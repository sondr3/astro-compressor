const COLORS = {
	reset: "\x1b[0m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
} as const;

const format = (msg: string, prefix = ""): string => {
	const end = prefix ? COLORS.reset : "";
	return `${prefix}astro-compressor:${end} ${msg}`;
};

export const info = (msg: string) => {
	console.info(format(msg));
};

export const success = (msg: string) => {
	console.log(format(msg, COLORS.green));
};

export const warn = (msg: string) => {
	console.warn(format(msg, COLORS.yellow));
};

export const error = (msg: string) => {
	console.error(format(msg, COLORS.red));
};
