import pino, { type Logger, type LoggerOptions } from 'pino';

export interface CreateLoggerOptions {
  name: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  isDevelopment: boolean;
}

let rootLogger: Logger | null = null;

export function createLogger(options: CreateLoggerOptions): Logger {
  const transport =
    options.isDevelopment
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined;

  const pinoOptions: LoggerOptions = {
    name: options.name,
    level: options.level,
    ...(transport && { transport }),
  };

  rootLogger = pino(pinoOptions);
  return rootLogger;
}

export function getLogger(): Logger {
  if (!rootLogger) {
    throw new Error('Logger not initialized. Call createLogger() first.');
  }
  return rootLogger;
}

export function createChildLogger(bindings: Record<string, unknown>): Logger {
  return getLogger().child(bindings);
}

export function resetLogger(): void {
  rootLogger = null;
}
