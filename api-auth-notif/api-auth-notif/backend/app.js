  import express from 'express';
  import cors from 'cors';
  import authRoutes from './routes/auth.js';
  import verifyToken from './middleware/auth.js';
  import taskRoutes from './routes/tasks.js';
  import notificationRoutes from './routes/notifications.js';

  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/', (req, res) => {
    res.json({
      message: 'API Auth & Notification berhasil berjalan!'
    });
  });

  app.use('/api/auth', authRoutes);

  app.get('/api/protected', verifyToken, (req, res) => {
    res.json({
      message: 'Berhasil mengakses halaman privat',
      user: req.user
    });
  });

  app.use('/api/tasks', taskRoutes);
  app.use('/api/notifications', notificationRoutes);

  export default app;
