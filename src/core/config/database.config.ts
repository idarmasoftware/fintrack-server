import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'mariadb',
  host: process.env.MARIADB_HOST,
  port: process.env.MARIADB_PORT || 3306,
  username: process.env.MARIADB_USER,
  password: process.env.MARIADB_PASS,
  database: process.env.MARIADB_NAME,
  synchronize: process.env.NODE_ENV !== 'production',
  timezone: '+07:00',
}));
