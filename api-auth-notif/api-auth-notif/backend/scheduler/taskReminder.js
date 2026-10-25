
import cron from 'node-cron';
import db from '../db.js';
import { sendPushNotification } from '../utils/sendPushNotification.js';

let isRunning = false;

export function startTaskReminderScheduler() {
  console.log('Scheduler pengingat deadline aktif.');

  cron.schedule('* * * * *', async () => {
    if (isRunning) return;
    isRunning = true;

    try {
      const [tasks] = await db.execute(`
        SELECT id, user_id, judul, deadline
        FROM tasks
        WHERE status = 'Belum dikerjakan'
          AND deadline IS NOT NULL
          AND deadline > NOW()
          AND deadline <= DATE_ADD(NOW(), INTERVAL 1 DAY)
      `);

      console.log(`Scheduler memeriksa ${tasks.length} tugas.`);

      for (const task of tasks) {
        const [timeRows] = await db.execute(
          'SELECT TIMESTAMPDIFF(SECOND, NOW(), ?) AS seconds_left',
          [task.deadline]
        );

        const secondsLeft = Number(timeRows[0].seconds_left);
        const reminders = [];

        // Pengingat ketika deadline tinggal maksimal 1 jam
        if (secondsLeft > 0 && secondsLeft <= 60 * 60) {
          reminders.push({
            type: '1_hour',
            title: 'Deadline kurang dari 1 jam lagi',
            body: `Tugas "${task.judul}" akan segera mencapai deadline.`,
          });
        }

        // Pengingat sekitar 1 hari sebelum deadline
        if (
          secondsLeft > 23 * 60 * 60 + 59 * 60 &&
          secondsLeft <= 24 * 60 * 60
        ) {
          reminders.push({
            type: '1_day',
            title: 'Deadline 1 hari lagi',
            body: `Tugas "${task.judul}" akan mencapai deadline sekitar 1 hari lagi.`,
          });
        }

        for (const reminder of reminders) {
          // Cek pengingat berdasarkan tugas, jenis pengingat,
          // dan deadline yang berlaku saat pengingat dikirim
          const [existing] = await db.execute(
            `SELECT id
             FROM task_reminder_logs
             WHERE task_id = ?
               AND reminder_type = ?
               AND deadline_dikirim = ?
             LIMIT 1`,
            [task.id, reminder.type, task.deadline]
          );

          if (existing.length > 0) {
            console.log(
              `Pengingat ${reminder.type} tugas ${task.id} untuk deadline ini sudah tercatat.`
            );
            continue;
          }

          const sent = await sendPushNotification(
            task.user_id,
            reminder.title,
            reminder.body,
            {
              type: 'task_deadline_reminder',
              taskId: task.id,
              reminderType: reminder.type,
            }
          );

          if (sent) {
            await db.execute(
              `INSERT INTO task_reminder_logs
               (task_id, user_id, reminder_type, deadline_dikirim)
               VALUES (?, ?, ?, ?)`,
              [task.id, task.user_id, reminder.type, task.deadline]
            );

            console.log(
              `Pengingat ${reminder.type} tugas ${task.id} berhasil dikirim ke Expo.`
            );
          } else {
            console.error(
              `Pengingat ${reminder.type} tugas ${task.id} gagal dikirim.`
            );
          }
        }
      }
    } catch (error) {
      console.error('Task reminder scheduler error:', error);
    } finally {
      isRunning = false;
    }
  });
}
