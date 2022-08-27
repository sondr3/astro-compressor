const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
} as const;

export class Logger {
  private static format(msg: string, prefix = ""): string {
    const start = prefix;
    const end = prefix ? COLORS.reset : "";
    return `${start}astro-compressor:${end} ${msg}`;
  }

  static info(msg: string) {
    console.info(this.format(msg));
  }

  static success(msg: string) {
    console.log(this.format(msg, COLORS.green));
  }

  static warn(msg: string) {
    console.warn(this.format(msg, COLORS.yellow));
  }

  static error(msg: string) {
    console.error(this.format(msg, COLORS.red));
  }
}
