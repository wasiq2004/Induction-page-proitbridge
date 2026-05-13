import api from './api';
import type { EnrollmentFormData } from '@t/index';

export const submitEnrollment = async (data: EnrollmentFormData): Promise<void> => {
  // TODO: replace stub with real call:
  // await api.post('/enrollment', data);
  void api;
  void data;
  return new Promise(resolve => setTimeout(resolve, 2000));
};
