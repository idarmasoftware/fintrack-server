import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class AuthService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
  ) {}

  register() {
    this.logger.info('registrasi berhasil', {
      context: 'Auth Service',
    });
    return {
      message: 'registrasi berhasil',
    };
  }

  login() {}

  profile() {}
}
