type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogMeta = Record<string, unknown>;

function write(level: LogLevel, msg: string, meta?: LogMeta): void {
  const entry = {
    level,
    msg,
    ts: new Date().toISOString(),
    service: 'control-master',
    ...meta,
  };

  const line = JSON.stringify(entry);
  if (level === 'error' || level === 'warn') {
    console.error(line);
    return;
  }
  console.log(line);
}

export const logger = {
  debug(msg: string, meta?: LogMeta) {
    if (process.env.NODE_ENV === 'production') return;
    write('debug', msg, meta);
  },
  info(msg: string, meta?: LogMeta) {
    write('info', msg, meta);
  },
  warn(msg: string, meta?: LogMeta) {
    write('warn', msg, meta);
  },
  error(msg: string, meta?: LogMeta) {
    write('error', msg, meta);
  },
};

export function serializeError(error: unknown): LogMeta {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
    };
  }
  return { errorMessage: String(error) };
}
