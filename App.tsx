import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { SymptomChecker } from './components/SymptomChecker';
import { HealthRecords } from './components/HealthRecords';
import { UserProfileView } from './components/UserProfile';
import { LoginScreen } from './components/LoginScreen';
import { AppView, HealthRecord, UserProfile, AuthUser } from './types';

// Mock Data
const MOCK_RECORDS: HealthRecord[] = [];

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  age: '',
  gender: '',
  preExistingConditions: '',
  allergies: ''
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [user, setUser] = useState<AuthUser | null>(null);
  
  // Data state
  const [records, setRecords] = useState<HealthRecord[]>(MOCK_RECORDS);
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  // 1. Check for logged in user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('hb_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        // We trigger load here explicitly
        loadUserData(parsedUser.id);
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }
  }, []);

  // 2. Load data helper
  const loadUserData = (userId: string) => {
    try {
      // Load Profile
      const savedProfile = localStorage.getItem(`hb_profile_${userId}`);
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile));
      } else {
        // Reset to default if no profile found
        setUserProfile({ ...DEFAULT_PROFILE });
      }

      // Load Records
      const savedRecords = localStorage.getItem(`hb_records_${userId}`);
      if (savedRecords) {
        const parsedRecs = JSON.parse(savedRecords);
        const hydratedRecs = parsedRecs.map((r: any) => ({
          ...r,
          date: new Date(r.date)
        }));
        setRecords(hydratedRecs);
      } else {
        setRecords([]);
      }
    } catch (e) {
      console.error("Error loading user data", e);
    }
  };

  // Handlers
  const handleLogin = (authenticatedUser: AuthUser) => {
    setUser(authenticatedUser);
    localStorage.setItem('hb_user', JSON.stringify(authenticatedUser));
    
    // Check if we need to seed the profile name from the auth user
    const existingProfileKey = `hb_profile_${authenticatedUser.id}`;
    const existingProfile = localStorage.getItem(existingProfileKey);
    
    if (!existingProfile) {
      // Create new profile for this user
      const newProfile = { ...DEFAULT_PROFILE, name: authenticatedUser.name };
      setUserProfile(newProfile);
      localStorage.setItem(existingProfileKey, JSON.stringify(newProfile));
      
      // Clear records for new user
      setRecords([]);
      localStorage.setItem(`hb_records_${authenticatedUser.id}`, JSON.stringify([]));
    } else {
      loadUserData(authenticatedUser.id);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('hb_user');
    setRecords([]);
    setUserProfile(DEFAULT_PROFILE);
    setCurrentView(AppView.DASHBOARD);
  };

  // Imperative Save Helpers
  // We avoid useEffect for saving to prevent race conditions during user switching
  const saveRecordsToDb = (newRecords: HealthRecord[], userId: string) => {
    localStorage.setItem(`hb_records_${userId}`, JSON.stringify(newRecords));
  };

  const saveProfileToDb = (newProfile: UserProfile, userId: string) => {
    localStorage.setItem(`hb_profile_${userId}`, JSON.stringify(newProfile));
  };

  const handleAddRecord = (rec: HealthRecord) => {
    if (!user) return;
    const newRecords = [rec, ...records];
    setRecords(newRecords);
    saveRecordsToDb(newRecords, user.id);
  };

  const handleDeleteRecord = (id: string) => {
    if (!user) return;
    const newRecords = records.filter(r => r.id !== id);
    setRecords(newRecords);
    saveRecordsToDb(newRecords, user.id);
  };

  const handleSaveProfile = (updatedProfile: UserProfile) => {
    if (!user) return;
    setUserProfile(updatedProfile);
    saveProfileToDb(updatedProfile, user.id);
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard onChangeView={setCurrentView} user={user} />;
      case AppView.SYMPTOM_CHECKER:
        return <SymptomChecker onBack={() => setCurrentView(AppView.DASHBOARD)} userProfile={userProfile} />;
      case AppView.RECORDS:
        return (
          <HealthRecords 
            records={records} 
            addRecord={handleAddRecord} 
            deleteRecord={handleDeleteRecord}
          />
        );
      case AppView.PROFILE:
        return <UserProfileView profile={userProfile} onSave={handleSaveProfile} onLogout={handleLogout} />;
      default:
        return <Dashboard onChangeView={setCurrentView} user={user} />;
    }
  };

  // If not logged in, show Login Screen
  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

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