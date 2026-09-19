import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext<any>({});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ausfallsichere Initialisierung
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) console.error("Session Error:", error.message);
        setSession(session);
      })
      .catch((err) => console.error("Auth Exception:", err))
      .finally(() => setLoading(false)); // Garantiert, dass der Ladebildschirm verschwindet

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
          <h3 style={{ color: '#005b82' }}>System wird initialisiert...</h3>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);