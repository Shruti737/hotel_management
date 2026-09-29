/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config();

/**
 * Database configuration used by the sequelize-cli (migrations / seeders).
 * The application itself reads the same environment variables in
 * src/config/configuration.ts, so both always point to the same database.
 */
const common = {
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'globinn_hotels',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT || 5432),
  dialect: 'postgres',
  logging: false,
  dialectOptions:
    process.env.DATABASE_SSL === 'true'
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : undefined,
};

module.exports = {
  development: common,
  production: common,
};