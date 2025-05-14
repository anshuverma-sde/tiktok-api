import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { StreamOptions } from 'morgan';

// Extend winston.Logger to include stream property
declare module 'winston' {
  interface Logger {
    morganStream: StreamOptions;
  }
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}${
      stack ? `\n${stack}` : ''
    }`;
  }),
);

// Create logger
const logger: winston.Logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      level: 'debug',
      format: winston.format.combine(winston.format.colorize(), logFormat),
    }),
    new DailyRotateFile({
      filename: 'tmp/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      maxFiles: '2d',
    }),
    new DailyRotateFile({
      filename: 'tmp/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '3d',
    }),
  ],
  exceptionHandlers: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), logFormat),
    }),
    new winston.transports.File({
      filename: 'tmp/exceptions.log',
      maxFiles: 5,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), logFormat),
    }),
    new winston.transports.File({
      filename: 'tmp/rejections.log',
      maxFiles: 5,
    }),
  ],
});

// Stream for Morgan
logger.morganStream = {
  write: (message: string) => logger.info(message.trim()),
};

export default logger;
