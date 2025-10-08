// Database configuration
const config = {
  development: {
    host: 'localhost',
    port: 5432,
    database: 'dev_db',
    user: 'dev_user',
    password: 'dev_password'
  },
  production: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false
    }
  }
};

const environment = process.env.NODE_ENV || 'development';

module.exports = config[environment];

