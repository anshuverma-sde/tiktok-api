import { HttpStatus } from '../constants/http.constants';

class ErrorHandler extends Error {
  statusCode: number;
  errorCode?: string;

  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    errorCode?: string,
  ) {
    super(message);
    this.statusCode = Number.isInteger(statusCode)
      ? statusCode
      : HttpStatus.INTERNAL_SERVER_ERROR;
    this.errorCode = errorCode;

    // Capture stack trace to improve debugging
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ErrorHandler;
