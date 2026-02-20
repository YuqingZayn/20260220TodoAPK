import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
export declare const ErrorCode: {
    readonly INTERNAL_ERROR: 500;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly TODO_NOT_FOUND: 1001;
    readonly EMAIL_EXISTS: 2001;
    readonly INVALID_CREDENTIALS: 2002;
    readonly SYNC_CONFLICT: 3001;
};
export declare class GlobalExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost): void;
}
