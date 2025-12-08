import React, { useState } from 'react';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { SymptomChecker } from './components/SymptomChecker';
import { HealthRecords } from './components/HealthRecords';
import { Appointments } from './components/Appointments';
import { AppView, Appointment, HealthRecord } from './types';

// Mock Data
const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: '1',
    doctorName: 'Dr. Sarah M.',
    specialty: 'General Practitioner',
    date: new Date(Date.now() + 86400000 * 2), // 2 days from now
    status: 'CONFIRMED'
  }
];

const MOCK_RECORDS: HealthRecord[] = [
  {
    id: '1',
    type: 'PRESCRIPTION',
    title: 'Amoxicillin 500mg',
    date: new Date('2023-10-15'),
    summary: 'Antibiotic for bacterial infection. Take 3 times daily.',
    medicines: [
      { name: 'Amoxicillin', dosage: '500mg', frequency: '3 times daily', notes: 'Take with food to avoid upset stomach' },
      { name: 'Ibuprofen', dosage: '400mg', frequency: 'As needed', notes: 'For fever/pain' }
    ]
  }
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
  const [records, setRecords] = useState<HealthRecord[]>(MOCK_RECORDS);

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard onChangeView={setCurrentView} appointments={appointments} />;
      case AppView.SYMPTOM_CHECKER:
        return <SymptomChecker onBack={() => setCurrentView(AppView.DASHBOARD)} />;
      case AppView.RECORDS:
        return <HealthRecords records={records} addRecord={(rec) => setRecords(prev => [rec, ...prev])} />;
      case AppView.APPOINTMENTS:
        return <Appointments appointments={appointments} />;
      default:
        return <Dashboard onChangeView={setCurrentView} appointments={appointments} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative">
        {renderView()}
        
        {/* Navigation is now always visible */}
        <Navigation currentView={currentView} onChangeView={setCurrentView} />
      </div>
    </div>
  );
};

export default App;