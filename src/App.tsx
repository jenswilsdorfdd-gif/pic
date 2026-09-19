import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout';
import { supabase } from './lib/supabase';
import { useState } from 'react';

// ==========================================
// ECHTE MODULE
// ==========================================
import TimeTracking from './pages/TimeTracking';
import Projects from './pages/Projects';
import Offers from './pages/Offers';
import Invoices from './pages/Invoices';
import Dashboard from './pages/Dashboard'; // <-- NEU IMPORTIERT!

// ==========================================
// LOGIN KOMPONENTE
// ==========================================
function Login() {
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (session) return <Navigate to="/" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert('Login fehlgeschlagen: ' + error.message);
  };

  return (
    <div style={{ padding: '50px', maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2>System Login</h2>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
          placeholder="Passwort" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          required 
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} 
        />
        <button 
          type="submit" 
          style={{ padding: '10px', cursor: 'pointer', background: '#0056b3', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Einloggen
        </button>
      </form>
    </div>
  );
}

// ==========================================
// HAUPT-APP & ROUTING
// ==========================================
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