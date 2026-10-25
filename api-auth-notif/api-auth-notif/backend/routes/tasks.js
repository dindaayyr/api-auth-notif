import express from 'express';
import db from '../db.js';
import verifyToken from '../middleware/auth.js';
import { sendPushNotification } from '../utils/sendPushNotification.js';

const router = express.Router();

const validStatus = ['Belum dikerjakan', 'Selesai'];

// Mengambil semua tugas
router.get('/', verifyToken, async (req, res) => {
  try {
    const [tasks] = await db.execute(
      `SELECT id, judul, deskripsi, status, deadline, dibuat_pada
       FROM tasks
       WHERE user_id = ?
       ORDER BY id DESC`,
      [req.user.id]
    );

    res.json({
      message: 'Berhasil mengambil daftar tugas',
      tasks,
    });
  } catch (error) {
    console.error('Get tasks error:', error.message);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Menambahkan tugas
router.post('/', verifyToken, async (req, res) => {
  try {
    const { judul, deskripsi, deadline } = req.body;

    if (typeof judul !== 'string' || !judul.trim()) {
      return res.status(400).json({ message: 'Judul tugas wajib diisi' });
    }

    const judulAman = judul.trim();
    const deskripsiAman =
      typeof deskripsi === 'string' ? deskripsi.trim() || null : null;

    const deadlineAman = deadline || null;

    if (
      deadlineAman &&
      (typeof deadlineAman !== 'string' ||
        Number.isNaN(Date.parse(deadlineAman)))
    ) {
      return res.status(400).json({ message: 'Format deadline tidak valid' });
    }

    const [result] = await db.execute(
      `INSERT INTO tasks (user_id, judul, deskripsi, deadline)
       VALUES (?, ?, ?, ?)`,
      [req.user.id, judulAman, deskripsiAman, deadlineAman]
    );

    void sendPushNotification(
      req.user.id,
      'Tugas baru ditambahkan',
      `Tugas "${judulAman}" berhasil ditambahkan.`,
      { type: 'task_created', taskId: result.insertId }
    );

    res.status(201).json({
      message: 'Tugas berhasil ditambahkan',
      task: {
        id: result.insertId,
        user_id: req.user.id,
        judul: judulAman,
        deskripsi: deskripsiAman,
        deadline: deadlineAman,
        status: 'Belum dikerjakan',
      },
    });
  } catch (error) {
    console.error('Create task error:', error.message);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Mengubah status tugas
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!validStatus.includes(status)) {
      return res.status(400).json({ message: 'Status tugas tidak valid' });
    }

    const [tasks] = await db.execute(
      'SELECT id, judul, status FROM tasks WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Tugas tidak ditemukan' });
    }

    if (tasks[0].status === status) {
      return res.json({ message: 'Status tugas tidak berubah', status });
    }

    await db.execute(
      'UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?',
      [status, id, req.user.id]
    );

    void sendPushNotification(
      req.user.id,
      'Status tugas diperbarui',
      `Tugas "${tasks[0].judul}" sekarang: ${status}.`,
      { type: 'task_status_updated', taskId: Number(id), status }
    );

    res.json({ message: 'Status tugas berhasil diubah', status });
  } catch (error) {
    console.error('Update status error:', error.message);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Mengedit tugas
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { judul, deskripsi, deadline } = req.body;

    if (typeof judul !== 'string' || !judul.trim()) {
      return res.status(400).json({ message: 'Judul tugas wajib diisi' });
    }

    const deadlineAman = deadline || null;

    if (
      deadlineAman &&
      (typeof deadlineAman !== 'string' ||
        Number.isNaN(Date.parse(deadlineAman)))
    ) {
      return res.status(400).json({ message: 'Format deadline tidak valid' });
    }

    const [result] = await db.execute(
      `UPDATE tasks
       SET judul = ?, deskripsi = ?, deadline = ?
       WHERE id = ? AND user_id = ?`,
      [
        judul.trim(),
        typeof deskripsi === 'string' ? deskripsi.trim() || null : null,
        deadlineAman,
        id,
        req.user.id,
      ]
    );

    if (result.affectedRows === 0) {
      const [existing] = await db.execute(
        'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
        [id, req.user.id]
      );

      if (existing.length === 0) {
        return res.status(404).json({ message: 'Tugas tidak ditemukan' });
      }
    }

    res.json({
      message: 'Tugas berhasil diperbarui',
      task: {
        id: Number(id),
        judul: judul.trim(),
        deskripsi: deskripsi || null,
        deadline: deadlineAman,
      },
    });
  } catch (error) {
    console.error('Edit task error:', error.message);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Menghapus tugas
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const [result] = await db.execute(
      'DELETE FROM tasks WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Tugas tidak ditemukan' });
    }

    res.json({ message: 'Tugas berhasil dihapus' });
  } catch (error) {
    console.error('Delete task error:', error.message);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

export default router;