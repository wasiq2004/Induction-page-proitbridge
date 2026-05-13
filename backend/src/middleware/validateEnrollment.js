import { body, validationResult } from 'express-validator';
import { PROGRAM_TYPES, COURSE_TYPES, PAYMENT_METHODS } from '../model/enrollment.js';

export const enrollmentRules = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('mobile')
    .matches(/^[0-9]{10}$/)
    .withMessage('Mobile must be exactly 10 digits'),
  body('country').trim().notEmpty().withMessage('Country is required'),
  body('addressLine1').trim().notEmpty().withMessage('Address line 1 is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('pincode')
    .matches(/^[0-9]{6}$/)
    .withMessage('Pincode must be exactly 6 digits'),
  body('programSelection')
    .isIn(PROGRAM_TYPES)
    .withMessage(`Program must be one of: ${PROGRAM_TYPES.join(', ')}`),
  body('courseType')
    .isIn(COURSE_TYPES)
    .withMessage(`Course type must be one of: ${COURSE_TYPES.join(', ')}`),
  body('paymentMethod')
    .isIn(PAYMENT_METHODS)
    .withMessage(`Payment method must be one of: ${PAYMENT_METHODS.join(', ')}`),
];

export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      data: errors.mapped(),
    });
  }
  next();
}
