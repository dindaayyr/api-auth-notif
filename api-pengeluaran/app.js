import express from 'express';
import cors from 'cors';
import pengeluaranRoutes from './routes/pengeluaran.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/pengeluaran', pengeluaranRoutes);

export default app;