import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.auth.register(dto.email, dto.password, dto.name);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Post('send-code')
  @HttpCode(HttpStatus.OK)
  async sendCode(@Body() body: { email: string }) {
    await this.auth.sendVerificationCode(body.email);
    return { message: '验证码已发送' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: { email: string; code: string; password: string }) {
    await this.auth.resetPassword(body.email, body.code, body.password);
    return { message: '密码重置成功' };
  }
}
