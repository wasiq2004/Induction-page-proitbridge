/* Shared TypeScript interfaces and types for the ProITBridge frontend */

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  quote: string;
  fullText: string;
  photoSrc: string;
}

export interface SuccessStory {
  id: string;
  title: string;
  result: string;
  packageLPA: number | null;
  company: string;
  image: string;
}

export interface CareerStory {
  id: string;
  title: string;
  description: string;
  duration: string;
  videoSrc: string;
}

export interface Prerequisite {
  id: string;
  iconPath: string;
  title: string;
  subtitle: string;
}

export enum ProgramType {
  ADVANCED_DATA_ANALYST = 'ADVANCED_DATA_ANALYST',
  ADVANCED_DATA_SCIENCE_AI = 'ADVANCED_DATA_SCIENCE_AI',
  AGENTIC_AI_GEN_AI = 'AGENTIC_AI_GEN_AI',
  COMBO = 'COMBO',
}

export enum PaymentMethod {
  UPI = 'UPI',
  CARD = 'CARD',
}

export type CourseType = 'ONLINE_LIVE' | 'SELF_PACED' | 'HYBRID';

export interface EnrollmentFormData {
  fullName: string;
  email: string;
  mobile: string;
  country: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  programSelection: ProgramType;
  courseType: CourseType;
  paymentMethod: PaymentMethod;
}
