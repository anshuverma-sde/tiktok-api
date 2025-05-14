import { Response } from 'express';
import { HttpStatus, SuccessMessages } from '../constants/http.constants';

interface SuccessResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export class ResponseHandler {
  static success<T>(
    res: Response,
    statusCode: HttpStatus = HttpStatus.OK,
    data?: T,
    message?: string,
  ): void {
    const response: SuccessResponse<T> = {
      success: true,
      ...(data !== undefined && { data }),
      ...(message && { message }),
    };
    res.status(statusCode).json(response);
  }

  static created<T>(
    res: Response,
    data?: T,
    message: string = SuccessMessages.CREATED,
  ): void {
    this.success(res, HttpStatus.CREATED, data, message);
  }

  static updated<T>(
    res: Response,
    data?: T,
    message: string = SuccessMessages.UPDATED,
  ): void {
    this.success(res, HttpStatus.OK, data, message);
  }

  static info(
    res: Response,
    statusCode: HttpStatus = HttpStatus.NO_CONTENT,
    message?: string,
  ): void {
    const response: SuccessResponse<never> = {
      success: true,
      ...(message && { message }),
    };
    res.status(statusCode).json(response);
  }
}
