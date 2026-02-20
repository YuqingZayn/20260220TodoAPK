"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = exports.ErrorCode = void 0;
const common_1 = require("@nestjs/common");
exports.ErrorCode = {
    INTERNAL_ERROR: 500,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    TODO_NOT_FOUND: 1001,
    EMAIL_EXISTS: 2001,
    INVALID_CREDENTIALS: 2002,
    SYNC_CONFLICT: 3001,
};
let GlobalExceptionFilter = class GlobalExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = '服务器内部错误';
        let code = exports.ErrorCode.INTERNAL_ERROR;
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();
            message = typeof res === 'string' ? res : res.message || message;
            if (exception instanceof common_1.NotFoundException) {
                code = exports.ErrorCode.TODO_NOT_FOUND;
            }
        }
        else if (exception instanceof Error) {
            message = exception.message;
        }
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
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=global-exception.filter.js.map