import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  private codeStore = new Map<string, { code: string; expires: number }>();
  private transporter: nodemailer.Transporter;

  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password',
      },
    });
  }

  async register(email: string, password: string, name?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('邮箱已被注册');
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email, password: hashed, name },
    });

    return this.generateToken(user.id, user.email);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    return this.generateToken(user.id, user.email);
  }

  async sendVerificationCode(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('邮箱未注册');
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
    } catch (e) {
      console.error('发送邮件失败:', e);
      throw new BadRequestException('发送验证码失败，请稍后重试');
    }
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const stored = this.codeStore.get(email);
    if (!stored || stored.code !== code) {
      throw new BadRequestException('验证码错误');
    }
    if (Date.now() > stored.expires) {
      throw new BadRequestException('验证码已过期');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { email },
      data: { password: hashed },
    });
    this.codeStore.delete(email);
  }

  private generateToken(userId: string, email: string) {
    const payload = { sub: userId, email };
    const access_token = this.jwt.sign(payload);
    return { access_token, userId, email };
  }
}
