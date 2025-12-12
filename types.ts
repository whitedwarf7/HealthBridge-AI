export enum AppView {
  DASHBOARD = 'DASHBOARD',
  SYMPTOM_CHECKER = 'SYMPTOM_CHECKER',
  RECORDS = 'RECORDS',
  PROFILE = 'PROFILE'
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
}

export interface UserProfile {
  name: string;
  age: string;
  gender: string;
  preExistingConditions: string;
  allergies: string;
}

export interface SymptomReport {
  id: string;
  timestamp: Date;
  summary: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  advice: string;
  category: string;
}

export interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  notes?: string;
}

export interface HealthRecord {
  id: string;
  type: 'PRESCRIPTION' | 'LAB_REPORT' | 'OTHER';
  title: string;
  date: Date;
  imageUrl?: string; // Stores Base64 Data URL
  mimeType?: string; // 'image/jpeg', 'image/png', 'application/pdf', etc.
  summary?: string;
  medicines?: Medicine[];
}

export interface TriageResponse {
  summary: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  advice: string;
  recommendedAction: string;
  specialistNeeded?: string;
  emergencyNumber?: string;
  detectedLanguage?: string;
}

export interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: Date;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
}