import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

// --- TYPE Definitions ---
interface ValidationErrorResponse {
  statusCode: number;
  message: string[];
  error?: string;
}

interface CustomExceptionResponse {
  code?: number;
  message?: string;
  errors?: string[] | Record<string, unknown>[] | null;
}

type ErrorResponse = ValidationErrorResponse | CustomExceptionResponse | string;

// --- GLOBAL FILTER ---
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: string[] | Record<string, unknown>[] | null = null;

    // =========================================
    // 1️⃣ VALIDATION ERROR (class-validator + class-transformer)
    // =========================================
    if (exception instanceof BadRequestException) {
      const res = exception.getResponse() as ErrorResponse;
      status = HttpStatus.BAD_REQUEST;

      // ValidationPipe → { statusCode, message: string[] }
      if (
        typeof res === 'object' &&
        'message' in res &&
        Array.isArray((res as ValidationErrorResponse).message)
      ) {
        message = 'Validation error';
        errors = (res as ValidationErrorResponse).message;
      }

      // Custom BadRequestException → { message: string }
      else if (typeof res === 'object' && typeof res.message === 'string') {
        message = res.message;
      }

      return response.status(status).json({
        success: false,
        message,
        errors,
      });
    }

    // =========================================
    // 2️⃣ HTTP EXCEPTION (Business Error, Custom Error)
    // =========================================
    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const res = exception.getResponse() as ErrorResponse;

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const r = res as CustomExceptionResponse;

        if (r.message) message = r.message;
        if (r.errors) errors = r.errors;
      }

      return response.status(status).json({
        success: false,
        message,
        errors,
      });
    }

    // =========================================
    // 3️⃣ UNEXPECTED ERROR (Bug, runtime error)
    // =========================================
    if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);

      return response.status(status).json({
        success: false,
        message: exception.message ?? message,
      });
    }

    // =========================================
    // 4️⃣ Fallback (unknown error)
    // =========================================
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Unknown error occurred',
    });
  }
}
