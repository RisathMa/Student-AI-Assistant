import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { GraduationCap } from 'lucide-react';

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to check for main site cookie
  const getCookie = (name: string) => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const hasCookie = !!getCookie('rm_auth_token');

  useEffect(() => {
    if (!loading) {
      if (!hasCookie) {
        // Redirect to main site if no cookie found (Not authenticated on CompanyRm)
        window.location.href = "https://www.companyrm.lk";
      }
    }
  }, [loading, hasCookie]);

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

  // If no cookie, we are redirecting, render nothing or spinner
  if (!hasCookie) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-400">
        Redirecting to login...
      </div>
    );
  }

  // Valid Cookie Exists -> Allow Access!
  // Note: Firebase 'user' might be null here if cross-domain session didn't sync.
  // The App handles null user by disabling History features gracefully.
  return <>{children}</>;
};
