import React, { useState } from 'react';
import { AuthUser } from '../types';

interface LoginScreenProps {
  onLogin: (user: AuthUser) => void;
}

const MOCK_ACCOUNTS: AuthUser[] = [
  {
    id: 'user_alex_123',
    name: 'Alex Morgan',
    email: 'alex.morgan@gmail.com',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'
  },
  {
    id: 'user_sarah_456',
    name: 'Sarah Chen',
    email: 'sarah.chen@gmail.com',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
  },
  {
    id: 'user_david_789',
    name: 'David Okeke',
    email: 'david.okeke@gmail.com',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David'
  }
];

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);

  const handleGoogleLoginClick = () => {
    // Show mock account chooser
    setShowAccounts(true);
  };

  const handleAccountSelect = (account: AuthUser) => {
    setShowAccounts(false);
    setIsLoading(true);
    // Simulate network delay for authentication
    setTimeout(() => {
      onLogin(account);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-teal-500 to-teal-700 p-6 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-10 rounded-full mix-blend-overlay filter blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-300 opacity-20 rounded-full mix-blend-overlay filter blur-3xl translate-x-1/3 translate-y-1/3"></div>

      <div className="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-sm text-center relative z-10 transition-all duration-300">
        
        {showAccounts ? (
          <div className="animate-fade-in">
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-gray-800 font-bold text-lg">Choose an account</h2>
               <button onClick={() => setShowAccounts(false)} className="text-gray-400 hover:text-gray-600">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
             </div>
             <p className="text-xs text-gray-500 mb-4 text-left">to continue to HealthBridge</p>
             
             <div className="space-y-1">
               {MOCK_ACCOUNTS.map(account => (
                 <button
                   key={account.id}
                   onClick={() => handleAccountSelect(account)}
                   className="w-full flex items-center p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition text-left group"
                 >
                   <img src={account.photoUrl} alt={account.name} className="w-10 h-10 rounded-full mr-3 bg-gray-100" />
                   <div className="flex-1 min-w-0">
                     <div className="text-sm font-semibold text-gray-800 group-hover:text-teal-700 truncate">{account.name}</div>
                     <div className="text-xs text-gray-500 truncate">{account.email}</div>
                   </div>
                 </button>
               ))}
               <div className="border-t border-gray-100 mt-2 pt-2">
                 <button className="w-full flex items-center p-3 hover:bg-gray-50 rounded-lg text-left">
                    <div className="w-10 h-10 rounded-full mr-3 flex items-center justify-center text-gray-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <div className="text-sm font-semibold text-gray-600">Use another account</div>
                 </button>
               </div>
             </div>
          </div>
        ) : (
          <>
            <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <svg className="w-10 h-10 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-2">HealthBridge</h1>
            <p className="text-gray-500 mb-8">Your personal AI health assistant.</p>

            <button 
              onClick={handleGoogleLoginClick}
              disabled={isLoading}
              className="w-full flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg transition shadow-sm active:bg-gray-100"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Sign in with Google
                </>
              )}
            </button>
            
            <p className="text-xs text-gray-400 mt-6">
              By signing in, you agree to our Terms of Service and Privacy Policy. Your data is stored securely in the local database.
            </p>
          </>
        )}
      </div>
    </div>
  );
};