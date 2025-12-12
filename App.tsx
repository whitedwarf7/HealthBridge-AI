import React, { useState } from 'react';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { SymptomChecker } from './components/SymptomChecker';
import { HealthRecords } from './components/HealthRecords';
import { UserProfileView } from './components/UserProfile';
import { AppView, HealthRecord, UserProfile } from './types';

// Mock Data
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

const DEFAULT_PROFILE: UserProfile = {
  name: 'John Doe',
  age: '35',
  gender: 'Male',
  preExistingConditions: '',
  allergies: ''
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [records, setRecords] = useState<HealthRecord[]>(MOCK_RECORDS);
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  const handleDeleteRecord = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard onChangeView={setCurrentView} />;
      case AppView.SYMPTOM_CHECKER:
        return <SymptomChecker onBack={() => setCurrentView(AppView.DASHBOARD)} userProfile={userProfile} />;
      case AppView.RECORDS:
        return (
          <HealthRecords 
            records={records} 
            addRecord={(rec) => setRecords(prev => [rec, ...prev])} 
            deleteRecord={handleDeleteRecord}
          />
        );
      case AppView.PROFILE:
        return <UserProfileView profile={userProfile} onSave={setUserProfile} />;
      default:
        return <Dashboard onChangeView={setCurrentView} />;
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