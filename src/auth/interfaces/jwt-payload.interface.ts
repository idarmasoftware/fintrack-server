export interface JwtPayload {
  sub: string;
  username: string;
  iat?: string;
  exp?: string;
}
