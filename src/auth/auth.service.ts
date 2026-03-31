import { ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { MailService } from '../common/mail/mail.service';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
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
      const tokens = await this.getTokens(user.id, user.email);
      await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

      this.logger.info({
        message: 'login berhasil',
        context: 'Auth Service',
        email: dto.email,
        ip: ip
      });
      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
        }
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

  async logout(userId: string) {
    await this.userService.updateRefreshToken(userId, null);
  }

  async refreshTokens(userId: string, rt: string) {
    const user = await this.userService.findOne(userId);
    if (!user || !user.refresh_token) throw new ForbiddenException('Access Denied');

    const rtMatches = await bcrypt.compare(rt, user.refresh_token);
    if (!rtMatches) throw new ForbiddenException('Access Denied');

    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRefreshTokenHash(user.id, tokens.refresh_token);
    return tokens;
  }

  async updateRefreshTokenHash(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.userService.updateRefreshToken(userId, hash);
  }

  async getTokens(userId: string, email: string) {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        { secret: this.configService.get<string>('JWT_SECRET_KEY'), expiresIn: '15m' },
      ),
      this.jwtService.signAsync(
        { sub: userId, email },
        { secret: this.configService.get<string>('JWT_SECRET_KEY'), expiresIn: '7d' },
      ),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }

  profile() { }
}
