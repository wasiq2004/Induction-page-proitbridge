import cors from 'cors';

const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

export default cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
});
