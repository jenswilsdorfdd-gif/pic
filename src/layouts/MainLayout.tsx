import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const COLORS = {
  blue: '#005b82',
  green: '#8ab511',
  grey: '#5b5d5f',
  lightBg: '#f8f9fa',
};

export default function MainLayout() {
  const { session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Executive Dashboard' },
    { path: '/time-tracking', label: 'Zeiterfassung' },
    { path: '/projects', label: 'Projekt-Controlling' },
    { path: '/offers', label: 'Angebote' },
    { path: '/invoices', label: 'Rechnungen' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: COLORS.lightBg, fontFamily: 'sans-serif' }}>
      
      {/* Sidebar Navigation */}
      <aside style={{ width: '260px', backgroundColor: COLORS.blue, color: '#fff', display: 'flex', flexDirection: 'column', boxShadow: '2px 0 5px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '25px 20px', fontSize: '22px', letterSpacing: '1px', borderBottom: `4px solid ${COLORS.green}` }}>
          <strong>PICON</strong> SYSTEM
        </div>

        <nav style={{ flex: 1, padding: '20px 0' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    style={{
                      display: 'block',
                      padding: '16px 25px',
                      color: '#fff',
                      textDecoration: 'none',
                      backgroundColor: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                      borderLeft: isActive ? `6px solid ${COLORS.green}` : '6px solid transparent',
                      fontWeight: isActive ? 'bold' : 'normal',
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Info & Logout */}
        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '13px' }}>
          <div style={{ marginBottom: '15px', opacity: 0.8, wordBreak: 'break-all' }}>
            Angemeldet als:<br/>
            <strong style={{ fontSize: '14px', color: COLORS.green }}>{session?.user?.email}</strong>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '10px', backgroundColor: 'transparent',
              color: '#fff', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '4px',
              cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            Sicher abmelden
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <Outlet />
      </main>
      
    </div>
  );
}