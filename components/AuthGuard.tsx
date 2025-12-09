import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { GraduationCap } from 'lucide-react';

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center text-slate-400">
          <GraduationCap size={48} className="mb-4 text-slate-300" />
          <div>Checking access permissions...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center border border-slate-200">
          <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <GraduationCap size={32} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Authentication Required</h1>
          <p className="text-slate-500 mb-8">
            You need to be logged in to CompanyRm to access the Student AI Assistant.
          </p>

          <a
            href="/" // Assuming main app is at root or user knows where to login
            onClick={(e) => {
              // If running standalone, we might need a real login flow?
              // For now, let's keep it simple as part of the suite.
            }}
            className="block w-full py-3 px-4 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 transition-colors"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
