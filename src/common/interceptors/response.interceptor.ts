import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';

// Type untuk mendeteksi object { message: string; data: unknown }
interface ControllerReturnShape {
  message: string;
  data: unknown;
}

// Type guard untuk memastikan shape aman
function isControllerReturnShape(obj: unknown): obj is ControllerReturnShape {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'message' in obj &&
    'data' in obj &&
    typeof (obj as Record<string, unknown>).message === 'string'
  );
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        let message = 'OK';
        let finalData: unknown = data;

        if (isControllerReturnShape(data)) {
          message = data.message;
          finalData = data.data;
        }

        return {
          success: true,
          message,
          data: finalData as T,
        };
      }),
    );
  }
}
