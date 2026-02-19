import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { Response } from 'express';

export const ErrorCode = {
  // 通用错误
  INTERNAL_ERROR: 500,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  
  // 业务错误
  TODO_NOT_FOUND: 1001,
  EMAIL_EXISTS: 2001,
  INVALID_CREDENTIALS: 2002,
  SYNC_CONFLICT: 3001,
} as const;

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';
    let code: number = ErrorCode.INTERNAL_ERROR;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message || message;
      
      // 根据异常类型映射错误码
      if (exception instanceof NotFoundException) {
        code = ErrorCode.TODO_NOT_FOUND;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // 记录错误日志
    console.error(`[${new Date().toISOString()}] Error:`, {
      status,
      code,
      message,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    response.status(status).json({
      data: null,
      error: {
        code,
        message,
      },
    });
  }
}
