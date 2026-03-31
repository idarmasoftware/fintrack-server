import {
  Body,
  Controller,
  Get,
  Inject,
  Ip,
  Post,
  UseGuards,
  Query,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RtAuthGuard } from './guards/rt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { type UserPayload } from './interfaces/user-payload.interface';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  register(@Body() dto: CreateUserDto, @Ip() ip: string) {
    this.logger.info(`mencoba registrasi`, {
      context: 'Auth Controller',
      ip: ip,
    });
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Ip() ip: string, @Res({ passthrough: true }) res: Response) {
    const data = await this.authService.login(dto, ip);
    const { refresh_token, ...rest } = data;

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return rest;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: UserPayload, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(user.id);
    res.clearCookie('refresh_token');
    return { message: 'Logged out successfully' };
  }

  @UseGuards(RtAuthGuard)
  @Get('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@CurrentUser() user: any, @Res({ passthrough: true }) res: Response) {
    const oldRefreshToken = user.refreshToken;
    const tokens = await this.authService.refreshTokens(user.id, oldRefreshToken);

    const { refresh_token, ...rest } = tokens;
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return rest;
  }

  @Get('activate')
  async activate(@Query('token') token: string, @Res() res: Response) {
    const success = await this.userService.activateUser(token);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (success) {
      return res.redirect(`${frontendUrl}/activation/success`);
    } else {
      return res.redirect(`${frontendUrl}/activation?status=failed&message=InvalidOrExpiredToken`);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async profile(@CurrentUser() user: UserPayload) {
    const data = await this.userService.findOne(user.id);
    return {
      message: 'Profile retrieved',
      data,
    };
  }
}
