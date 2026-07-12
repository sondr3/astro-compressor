import { AsyncResource } from "node:async_hooks"
import EventEmitter from "node:events"
import os from "node:os"
import { Worker } from "node:worker_threads"

import type { Task } from "#/compression-worker.js"
import type { Format } from "#/index.js"

const kTaskInfo = Symbol("kTaskInfo")
const kWorkerFreedEvent = Symbol("kWorkerFreedEvent")

type WorkerCallback<R> = (...args: [err: Error, result: null] | [err: null, result: R]) => void

interface QueuedTask<R> {
	task: Task
	callback: WorkerCallback<R>
}

type PoolWorker<R> = Worker & {
	[kTaskInfo]?: WorkerPoolTaskInfo<R> | null
}

class WorkerPoolTaskInfo<R> extends AsyncResource {
	private readonly callback: WorkerCallback<R>

	constructor(callback: WorkerCallback<R>) {
		super("WorkerPoolTaskInfo")
		this.callback = callback
	}

	done(err?: Error | null, result?: R | null): void {
		this.runInAsyncScope(this.callback, null, err, result)
		this.emitDestroy()
	}
}

export class WorkerPool<R> extends EventEmitter {
	protected threads: number
	protected workers: Array<PoolWorker<R>> = []
	protected freeWorkers: Array<PoolWorker<R>> = []
	protected tasks: Array<QueuedTask<R>> = []
	protected failures: number = 0
	protected failed: Error | null = null

	constructor(threads: number = os.availableParallelism()) {
		super()
		this.threads = threads

		for (let i = 0; i < this.threads; i += 1) {
			this.addWorker()
		}

		this.on(kWorkerFreedEvent, () => {
			if (this.tasks.length > 0) {
				const next = this.tasks.shift()
				if (next) this.runTask(next.task, next.callback)
			}
		})
	}

	addWorker(): void {
		const worker: PoolWorker<R> = new Worker(new URL("compression-worker.js", import.meta.url))
		let online = false

		worker.on("message", (res: R) => {
			worker[kTaskInfo]?.done(null, res)
			worker[kTaskInfo] = null
			this.freeWorkers.push(worker)
			this.emit(kWorkerFreedEvent)
		})

		worker.once("online", () => {
			online = true
			this.failures = 0
			this.freeWorkers.push(worker)
			this.emit(kWorkerFreedEvent)
		})

		worker.on("error", (err: Error) => {
			worker[kTaskInfo]?.done(err, null)
			worker[kTaskInfo] = null
			this.removeWorker(worker)

			if (!online) {
				this.failures += 1
				if (this.failures >= 3) {
					this.fail(err)
					return
				}
			}

			this.addWorker()
		})

		worker.on("exit", () => {
			worker[kTaskInfo]?.done(this.failed ?? new Error("worker exited"), null)
			worker[kTaskInfo] = null
		})

		this.workers.push(worker)
	}

	async execute<N extends Format>(task: Task<N>): Promise<R>
	async execute(task: Task): Promise<R> {
		return new Promise((resolve, reject) => {
			this.runTask(task, (err, result) => {
				if (err) reject(err)
				else resolve(result)
			})
		})
	}

	private removeWorker(worker: PoolWorker<R>): void {
		const workerIndex = this.workers.indexOf(worker)
		if (workerIndex !== -1) this.workers.splice(workerIndex, 1)

		const freeWorkerIndex = this.freeWorkers.indexOf(worker)
		if (freeWorkerIndex !== -1) this.freeWorkers.splice(freeWorkerIndex, 1)
	}

	private fail(err: Error): void {
		this.failed = err
		for (const { callback } of this.tasks.splice(0)) callback(err, null)
		// oxlint-disable-next-line no-void
		void this.close()
	}

	private runTask(task: Task, callback: WorkerCallback<R>): void {
		if (this.failed) return callback(this.failed, null)

		const worker = this.freeWorkers.pop()
		if (!worker) {
			this.tasks.push({ task, callback })
			return
		}

		worker[kTaskInfo] = new WorkerPoolTaskInfo(callback)
		const { file, format, options, source } = task
		worker.postMessage({ file, format, options, source }, [source])
	}

	async close(): Promise<void> {
		await Promise.all(this.workers.map(async (w) => w.terminate()))
	}
}
