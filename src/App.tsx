import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout';
import { supabase } from './lib/supabase';
import { useState } from 'react';

import TimeTracking from './pages/TimeTracking';
import Projects from './pages/Projects';
import Offers from './pages/Offers';
import Invoices from './pages/Invoices';
import Dashboard from './pages/Dashboard';

function Login() {
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  if (session) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert('Login fehlgeschlagen: ' + error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert('Registrierung fehlgeschlagen: ' + error.message);
      else {
        alert('Mitarbeiter erfolgreich angelegt! Bitte jetzt einloggen.');
        setIsLogin(true);
      }
    }
  };

  return (
    <div style={{ padding: '50px', maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2>System Zugang</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="email" 
          placeholder="E-Mail" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          required 
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} 
        />
        <input 
          type="password" 
          placeholder="Passwort (mind. 6 Zeichen)" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          required 
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} 
        />
        <button 
          type="submit" 
          style={{ padding: '10px', cursor: 'pointer', background: '#005b82', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
        >
          {isLogin ? 'Einloggen' : 'Mitarbeiter anlegen'}
        </button>
      </form>
      <button 
        onClick={() => setIsLogin(!isLogin)}
        style={{ marginTop: '15px', background: 'none', border: 'none', color: '#005b82', cursor: 'pointer', textDecoration: 'underline' }}
      >
        {isLogin ? 'Neuen Mitarbeiter registrieren' : 'Zurück zum Login'}
      </button>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/time-tracking" element={<TimeTracking />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/offers" element={<Offers />} />
            <Route path="/invoices" element={<Invoices />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}