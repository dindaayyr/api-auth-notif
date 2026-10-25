import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import app from './app.js';
import db from './db.js';
import { startTaskReminderScheduler } from './scheduler/taskReminder.js';

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);

dotenv.config({
  path: path.join(projectRoot, '.env'),
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    const connection = await db.getConnection();
    console.log('Koneksi database berhasil!');
    connection.release();

    startTaskReminderScheduler();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server berjalan di port ${PORT}`);
    });
  } catch (error) {
    console.error('Koneksi database gagal:', error.message);
  }
}

startServer();