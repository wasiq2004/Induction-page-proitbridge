import { Router } from 'express';
import enrollmentRouter from './enrollment.js';

const router = Router();

router.use('/enrollments', enrollmentRouter);

export default router;
