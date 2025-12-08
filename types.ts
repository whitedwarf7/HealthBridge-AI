export enum AppView {
  DASHBOARD = 'DASHBOARD',
  SYMPTOM_CHECKER = 'SYMPTOM_CHECKER',
  RECORDS = 'RECORDS',
  APPOINTMENTS = 'APPOINTMENTS',
  PROFILE = 'PROFILE'
}

export interface SymptomReport {
  id: string;
  timestamp: Date;
  summary: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  advice: string;
  category: string;
}

export interface HealthRecord {
  id: string;
  type: 'PRESCRIPTION' | 'LAB_REPORT' | 'OTHER';
  title: string;
  date: Date;
  imageUrl?: string;
  summary?: string;
}

export interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: Date;
  status: 'CONFIRMED' | 'PENDING' | 'COMPLETED';
}

export interface TriageResponse {
  summary: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  advice: string;
  recommendedAction: string;
  specialistNeeded?: string;
}
