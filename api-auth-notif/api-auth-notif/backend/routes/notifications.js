import express from 'express';
import db from '../db.js';
import verifyToken from '../middleware/auth.js';

const router = express.Router();

// Menyimpan atau memperbarui Expo Push Token
router.post('/token', verifyToken, async (req, res) => {
  try {
    const { expo_push_token } = req.body;

    if (!expo_push_token) {
      return res.status(400).json({
        message: 'Expo Push Token wajib diisi'
      });
    }

    const [existingToken] = await db.execute(
      'SELECT id FROM push_tokens WHERE user_id = ?',
      [req.user.id]
    );

    if (existingToken.length > 0) {
      await db.execute(
        `UPDATE push_tokens
         SET expo_push_token = ?, diperbarui_pada = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [expo_push_token, req.user.id]
      );
    } else {
      await db.execute(
        `INSERT INTO push_tokens (user_id, expo_push_token)
         VALUES (?, ?)`,
        [req.user.id, expo_push_token]
      );
    }

    return res.status(200).json({
      message: 'Expo Push Token berhasil disimpan'
    });
  } catch (error) {
    console.error('Save push token error:', error.message);
    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
});

export default router;
