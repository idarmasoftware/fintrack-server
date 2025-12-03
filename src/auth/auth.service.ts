import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { LoginDto } from './dto/login.dto';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  register() {
    this.logger.info('registrasi berhasil', {
      context: 'Auth Service',
    });
    return {
      message: 'registrasi berhasil',
    };
  }

  async login(dto: LoginDto, ip: string) {
    this.logger.info({
      message: 'mencoba login',
      context: 'Auth Service',
      username: dto.username,
      ip: ip,
    });
    const user = await this.userService.findByUsername(dto.username);
    if (!user) {
      this.logger.info({
        message: 'login gagal invalid crendential',
        context: 'Auth Service',
        username: dto.username,
        ip: ip,
      });
      throw new UnauthorizedException('invalid crendential');
    }
    const verify = await bcrypt.compare(dto.password, user.password);
    if (verify) {
      const payload: JwtPayload = {
        sub: user.id,
        username: user.username,
      };
      const token = this.jwtService.sign(payload);
      this.logger.info({
        message: 'login berhasil',
        context: 'Auth Service',
        username: dto.username,
        ip: ip
      });
      return {
        access_token: token,
      };
    } else {
      this.logger.info({
        message: 'login gagal invalid crendential',
        context: 'Auth Service',
        username: dto.username,
        ip: ip
      });
      throw new UnauthorizedException('invalid crendential');
    }
  }

  profile() {}
}
