import { Body, Controller, Get, Inject, Ip, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { type UserPayload } from './interfaces/user-payload.interface';

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
  login(@Body() dto: LoginDto, @Ip() ip: string) {
    return this.authService.login(dto, ip);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  profile(@CurrentUser() user: UserPayload) {
    return user;
  }
}
