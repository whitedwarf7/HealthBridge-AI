import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { SymptomChecker } from './components/SymptomChecker';
import { HealthRecords } from './components/HealthRecords';
import { UserProfileView } from './components/UserProfile';
import { AppView, HealthRecord, UserProfile } from './types';

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  age: '',
  gender: 'Male',
  preExistingConditions: '',
  allergies: ''
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  // Initialize from Local Storage
  const [records, setRecords] = useState<HealthRecord[]>(() => {
    const saved = localStorage.getItem('healthRecords');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Re-hydrate Date objects
        return parsed.map((r: any) => ({
            ...r,
            date: new Date(r.date)
        }));
      } catch (e) {
        console.error("Failed to parse records", e);
        return [];
      }
    }
    return [];
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('userProfile');
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  });

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('healthRecords', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
  }, [userProfile]);

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