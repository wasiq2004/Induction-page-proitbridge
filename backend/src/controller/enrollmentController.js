import { ApiResponse } from '../utils/apiResponse.js';
import { enrollments, createEnrollment } from '../model/enrollment.js';

export async function submitEnrollment(req, res, next) {
  try {
    // TODO: persist to DB when ready (enrollmentRepository.save)
    const record = createEnrollment(req.body);
    enrollments.push(record);

    return res.status(200).json(
      ApiResponse.ok('Enrollment submitted successfully', null)
    );
  } catch (err) {
    next(err);
  }
}

export async function getEnrollments(_req, res, next) {
  try {
    // TODO: replace with DB query when ready
    return res.status(200).json(
      ApiResponse.ok('Enrollments retrieved', enrollments)
    );
  } catch (err) {
    next(err);
  }
}
