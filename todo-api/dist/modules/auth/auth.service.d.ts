import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';
export declare class AuthService {
    private jwt;
    private prisma;
    private codeStore;
    private transporter;
    constructor(jwt: JwtService, prisma: PrismaService);
    register(email: string, password: string, name?: string): Promise<{
        access_token: string;
        userId: string;
        email: string;
    }>;
    login(email: string, password: string): Promise<{
        access_token: string;
        userId: string;
        email: string;
    }>;
    sendVerificationCode(email: string): Promise<void>;
    resetPassword(email: string, code: string, newPassword: string): Promise<void>;
    private generateToken;
}
