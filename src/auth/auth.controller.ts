import { Controller, Get, Inject, Ip, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  register(@Ip() ip: string) {
    this.logger.info(`mencoba registrasi`, {
      context: 'Auth Controller',
      ip: ip,
    });
    return this.authService.register();
  }

  @Post('login')
  login() {
    return this.authService.login();
  }

  @Get('profile')
  profile() {
    return this.authService.profile();
  }
}
