import { Sequelize } from 'sequelize';
import path from 'path';
import fs from 'fs';

const DB_DIR = 'C:\\MahiJCompany\\Dawakhana';
const DB_PATH = path.join(DB_DIR, 'dawakhana.sqlite');

// Ensure directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: DB_PATH,
  logging: false,
});

console.log(`[DB] SQLite veritabanı bağlandı: ${DB_PATH}`);

export default sequelize;

