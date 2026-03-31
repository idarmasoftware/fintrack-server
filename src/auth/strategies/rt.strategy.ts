import { ForbiddenException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: Request) => {
                    return request?.cookies?.refresh_token;
                },
            ]),
            secretOrKey: configService.getOrThrow<string>('JWT_SECRET_KEY'),
            passReqToCallback: true,
        });
    }

    validate(req: Request, payload: JwtPayload) {
        const refreshToken = req.cookies.refresh_token;

        if (!refreshToken) throw new ForbiddenException('Refresh token malformed');

        return {
            ...payload,
            refreshToken,
        };
    }
}
