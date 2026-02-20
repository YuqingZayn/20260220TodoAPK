"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../../prisma.service");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
let AuthService = class AuthService {
    constructor(jwt, prisma) {
        this.jwt = jwt;
        this.prisma = prisma;
        this.codeStore = new Map();
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'your-email@gmail.com',
                pass: process.env.EMAIL_PASS || 'your-app-password',
            },
        });
    }
    async register(email, password, name) {
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new common_1.ConflictException('邮箱已被注册');
        }
        const hashed = await bcrypt.hash(password, 10);
        const user = await this.prisma.user.create({
            data: { email, password: hashed, name },
        });
        return this.generateToken(user.id, user.email);
    }
    async login(email, password) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new common_1.UnauthorizedException('邮箱或密码错误');
        }
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            throw new common_1.UnauthorizedException('邮箱或密码错误');
        }
        return this.generateToken(user.id, user.email);
    }
    async sendVerificationCode(email) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new common_1.BadRequestException('邮箱未注册');
        }
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        this.codeStore.set(email, { code, expires: Date.now() + 10 * 60 * 1000 });
        try {
            await this.transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: '待办事项 - 验证码',
                text: `您的验证码是：${code}，10分钟内有效。`,
            });
        }
        catch (e) {
            console.error('发送邮件失败:', e);
            throw new common_1.BadRequestException('发送验证码失败，请稍后重试');
        }
    }
    async resetPassword(email, code, newPassword) {
        const stored = this.codeStore.get(email);
        if (!stored || stored.code !== code) {
            throw new common_1.BadRequestException('验证码错误');
        }
        if (Date.now() > stored.expires) {
            throw new common_1.BadRequestException('验证码已过期');
        }
        const hashed = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { email },
            data: { password: hashed },
        });
        this.codeStore.delete(email);
    }
    generateToken(userId, email) {
        const payload = { sub: userId, email };
        const access_token = this.jwt.sign(payload);
        return { access_token, userId, email };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map