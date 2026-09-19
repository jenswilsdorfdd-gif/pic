import { Outlet, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function MainLayout() {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      {/* Sidebar Navigation */}
      <nav style={{ width: '250px', background: '#f4f4f4', padding: '20px', borderRight: '1px solid #ddd' }}>
        <h2>Ingenieurbüro</h2>
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '30px' }}>
          {session.user?.email}
        </p>
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <li><Link to="/">Dashboard</Link></li>
          <li><Link to="/time-tracking">Zeiterfassung</Link></li>
          <li><Link to="/projects">Projekte & Controlling</Link></li>
          <li><Link to="/offers">Angebote</Link></li>
          <li><Link to="/invoices">Rechnungen</Link></li>
        </ul>
        <button onClick={handleLogout} style={{ marginTop: 'auto', padding: '10px', width: '100%', cursor: 'pointer' }}>
          Abmelden
        </button>
      </nav>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}