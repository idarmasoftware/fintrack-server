import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express'; // Tambahkan Request
import { SlackService } from '../slack/slack.service'; // Import SlackService

// ... (Interface definitions tetap sama) ...
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

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  // 1. Tambahkan constructor untuk menerima SlackService
  constructor(private readonly slackService: SlackService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>(); // Ambil request untuk info URL/Method

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: string[] | Record<string, unknown>[] | null = null;

    // ... (Logika penanganan BadRequestException dan HttpException tetap sama) ...
    // ... (Kode bagian 1️⃣ dan 2️⃣ biarkan seperti semula) ...

    // =========================================
    // 1️⃣ VALIDATION ERROR
    // =========================================
    if (exception instanceof BadRequestException) {
      // ... (kode lama Anda)
      const res = exception.getResponse() as ErrorResponse;
      status = HttpStatus.BAD_REQUEST;
      // ... copy logic lama ...
      if (
        typeof res === 'object' &&
        'message' in res &&
        Array.isArray((res as ValidationErrorResponse).message)
      ) {
        message = 'Validation error';
        errors = (res as ValidationErrorResponse).message;
      } else if (typeof res === 'object' && typeof res.message === 'string') {
        message = res.message;
      }
    }

    // =========================================
    // 2️⃣ HTTP EXCEPTION
    // =========================================
    else if (exception instanceof HttpException) {
      // ... (kode lama Anda)
      status = exception.getStatus();
      const res = exception.getResponse() as ErrorResponse;

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const r = res as CustomExceptionResponse;
        if (r.message) message = r.message;
        if (r.errors) errors = r.errors;
      }
    }

    // =========================================
    // 3️⃣ UNEXPECTED ERROR & SLACK NOTIFICATION
    // =========================================
    if (exception instanceof Error) {
      // Jika bukan HttpException (artinya error codingan/crash), atau statusnya 500
      if (!(exception instanceof HttpException) || status === HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error(exception.message, exception.stack);

        // Kirim ke Slack secara Asynchronous (jangan await agar tidak memblokir response user)
        this.sendToSlack(exception, request, status);

        // Update message jika belum terset
        if (!(exception instanceof HttpException)) {
          message = exception.message ?? message;
        }
      }
    }

    return response.status(status).json({
      success: false,
      message: message === 'Internal server error' ? 'Internal server error' : message, // Safety mask
      errors,
    });
  }

  // Fungsi helper untuk format pesan Slack
  private sendToSlack(exception: Error, request: Request, status: number) {
    const text = `
    🚨 *Critical Error Detected* 🚨
    *Status:* ${status}
    *Method:* ${request.method}
    *URL:* ${request.url}
    *IP:* ${request.ip}
    *Message:* ${exception.message}
    *Stack Trace:* \`\`\`${exception.stack?.substring(0, 1000)}\`\`\`
    `;
    // Panggil service (gunakan .catch agar jika slack error, aplikasi tidak crash)
    this.slackService.send(text).catch((err) => this.logger.error('Failed to send to slack', err));
  }
}
