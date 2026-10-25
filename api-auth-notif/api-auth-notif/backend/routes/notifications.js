
import express from 'express';
import db from '../db.js';
import verifyToken from '../middleware/auth.js';

const router = express.Router();

// Menyimpan atau memperbarui Expo Push Token
router.post('/token', verifyToken, async (req, res) => {
  try {
    const { expo_push_token } = req.body;
    const userId = req.user.id;

    if (
      typeof expo_push_token !== 'string' ||
      !expo_push_token.trim()
    ) {
      return res.status(400).json({
        message: 'Expo Push Token wajib diisi',
      });
    }

    const pushToken = expo_push_token.trim();

    // Jika token sudah ada, pindahkan kepemilikannya
    // ke akun yang sedang login. Jika belum ada, buat data baru.
    await db.execute(
      `INSERT INTO push_tokens (user_id, expo_push_token)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE
         user_id = VALUES(user_id),
         diperbarui_pada = CURRENT_TIMESTAMP`,
      [userId, pushToken]
    );

    return res.status(200).json({
      message: 'Expo Push Token berhasil disimpan',
    });
  } catch (error) {
    console.error('Save push token error:', error.message);

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server',
    });
  }
});

export default router;
