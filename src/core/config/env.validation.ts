import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'testing', 'production').default('development'),
  APP_PORT: Joi.number().default(3000),

  // Database Validations
  MARIADB_HOST: Joi.string().required(),
  MARIADB_PORT: Joi.number().default(3306),
  MARIADB_USER: Joi.string().required(),
  MARIADB_PASS: Joi.string().required(),
  MARIADB_NAME: Joi.string().required(),
});
