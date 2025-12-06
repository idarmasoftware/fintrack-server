import { Body, Controller, Get, Inject, Ip, Post, UseGuards, Query, Res, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { type UserPayload } from './interfaces/user-payload.interface';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) { }

  @Post('register')
  register(@Body() dto: CreateUserDto, @Ip() ip: string) {
    this.logger.info(`mencoba registrasi`, {
      context: 'Auth Controller',
      ip: ip,
    });
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto, @Ip() ip: string) {
    return this.authService.login(dto, ip);
  }

  @Get('activate')
  async activate(@Query('token') token: string, @Res() res: any) {
    const success = await this.userService.activateUser(token);
    if (success) {
      return res.redirect('http://localhost:3004/start/login?activated=true'); // Redirect to frontend login
    } else {
      throw new UnauthorizedException('Invalid or expired activation token');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  profile(@CurrentUser() user: UserPayload) {
    return user;
  }
}
