import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { MailService } from '../common/mail/mail.service';
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
    private readonly mailService: MailService,
  ) { }

  async register(dto: CreateUserDto) {
    this.logger.info('mencoba registrasi', {
      context: 'Auth Service',
    });
    const user = await this.userService.create(dto);
    await this.mailService.sendUserConfirmation(user, user.activation_token!);
    return {
      message: 'registrasi berhasil, silahkan cek email untuk aktivasi',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
      }
    };
  }

  async login(dto: LoginDto, ip: string) {
    this.logger.info({
      message: 'mencoba login',
      context: 'Auth Service',
      email: dto.email,
      ip: ip,
    });
    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      this.logger.info({
        message: 'login gagal invalid crendential',
        context: 'Auth Service',
        email: dto.email,
        ip: ip,
      });
      throw new UnauthorizedException('invalid crendential');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Akun belum diaktivasi. Silahkan cek email anda.');
    }

    const verify = await bcrypt.compare(dto.password, user.password);
    if (verify) {
      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
      };
      const token = this.jwtService.sign(payload);
      this.logger.info({
        message: 'login berhasil',
        context: 'Auth Service',
        email: dto.email,
        ip: ip
      });
      return {
        access_token: token,
      };
    } else {
      this.logger.info({
        message: 'login gagal invalid crendential',
        context: 'Auth Service',
        email: dto.email,
        ip: ip
      });
      throw new UnauthorizedException('invalid crendential');
    }
  }

  profile() { }
}
