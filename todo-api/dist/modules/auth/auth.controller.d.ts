import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.dto';
export declare class AuthController {
    private auth;
    constructor(auth: AuthService);
    register(dto: RegisterDto): Promise<{
        access_token: string;
        userId: string;
        email: string;
    }>;
    login(dto: LoginDto): Promise<{
        access_token: string;
        userId: string;
        email: string;
    }>;
    sendCode(body: {
        email: string;
    }): Promise<{
        message: string;
    }>;
    resetPassword(body: {
        email: string;
        code: string;
        password: string;
    }): Promise<{
        message: string;
    }>;
}
