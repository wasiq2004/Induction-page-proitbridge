import { Router } from 'express';
import { enrollmentRules, handleValidationErrors } from '../middleware/validateEnrollment.js';
import { submitEnrollment, getEnrollments } from '../controller/enrollmentController.js';

const router = Router();

router.post('/', enrollmentRules, handleValidationErrors, submitEnrollment);
router.get('/', getEnrollments);

export default router;
