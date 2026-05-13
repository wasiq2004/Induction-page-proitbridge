import express from 'express';
import morgan from 'morgan';
import corsMiddleware from './config/cors.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(corsMiddleware);
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'UP', service: 'ProITBridge API' });
});

app.use('/api', routes);

app.use(errorHandler);

export default app;
