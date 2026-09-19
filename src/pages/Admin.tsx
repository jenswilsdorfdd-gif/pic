import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// PICON Corporate Colors
const COLORS = {
  blue: '#005b82',
  green: '#8ab511',
  grey: '#5b5d5f',
  lightBg: '#f8f9fa',
  success: '#28a745',
  danger: '#dc3545'
};

// Strict Typing: Keine "any" Typen erlaubt
interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  hourly_rate: number;
  working_hours_per_week: number;
}

export default function Admin() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('email', { ascending: true });
      
    if (error) {
      setMessage({ text: 'Fehler beim Laden der Profile: ' + error.message, type: 'error' });
    } else if (data) {
      setProfiles(data as Profile[]);
    }
    setLoading(false);
  };

  const handleUpdate = async (id: string, field: keyof Profile, value: string | number) => {
    setMessage({ text: '', type: '' });
    
    const { error } = await supabase
      .from('profiles')
      .update({ [field]: value })
      .eq('id', id);

    if (error) {
      setMessage({ text: 'Fehler beim Speichern: ' + error.message, type: 'error' });
      fetchProfiles(); // Bei Fehler alte Daten wiederherstellen
    } else {
      setMessage({ text: 'Erfolgreich aktualisiert.', type: 'success' });
      // Lokalen State sofort updaten (Optimistic UI)
      setProfiles(profiles.map(p => p.id === id ? { ...p, [field]: value } : p));
      
      // Erfolgsmeldung nach 3 Sekunden ausblenden
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <h3 style={{ color: COLORS.blue }}>Lade Administration...</h3>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <h1 style={{ color: COLORS.grey, borderBottom: `3px solid ${COLORS.green}`, paddingBottom: '10px', marginTop: 0 }}>
        Mitarbeiter-Verwaltung & System-Parameter
      </h1>

      {message.text && (
        <div style={{ 
          padding: '12px', marginBottom: '20px', borderRadius: '4px', fontWeight: 'bold',
          background: message.type === 'error' ? '#f8d7da' : '#d4edda', 
          color: message.type === 'error' ? '#721c24' : '#155724' 
        }}>
          {message.text}
        </div>
      )}

      <div style={{ overflowX: 'auto', marginTop: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: COLORS.blue, color: '#fff', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>E-Mail (User)</th>
              <th style={{ padding: '12px' }}>System-Rolle</th>
              <th style={{ padding: '12px', width: '150px' }}>Interner Stundensatz (€)</th>
              <th style={{ padding: '12px', width: '150px' }}>Wochenstunden (Soll)</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map(profile => (
              <tr key={profile.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}><strong>{profile.email}</strong></td>
                
                <td style={{ padding: '12px' }}>
                  <select 
                    value={profile.role} 
                    onChange={(e) => handleUpdate(profile.id, 'role', e.target.value)}
                    style={{ padding: '6px', borderRadius: '4px', width: '100%', border: '1px solid #ccc', cursor: 'pointer' }}>
                    <option value="employee">Mitarbeiter</option>
                    <option value="manager">Projektleiter</option>
                    <option value="admin">Administrator</option>
                  </select>
                </td>
                
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input 
                      type="number" 
                      step="0.5" 
                      defaultValue={profile.hourly_rate} 
                      onBlur={(e) => {
                        const val = Number(e.target.value);
                        if (val !== profile.hourly_rate) handleUpdate(profile.id, 'hourly_rate', val);
                      }}
                      style={{ width: '80px', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }} 
                    />
                    <span style={{ color: COLORS.grey }}>€/h</span>
                  </div>
                </td>
                
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input 
                      type="number" 
                      step="0.5" 
                      defaultValue={profile.working_hours_per_week} 
                      onBlur={(e) => {
                        const val = Number(e.target.value);
                        if (val !== profile.working_hours_per_week) handleUpdate(profile.id, 'working_hours_per_week', val);
                      }}
                      style={{ width: '80px', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }} 
                    />
                    <span style={{ color: COLORS.grey }}>h</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div style={{ marginTop: '25px', padding: '15px', background: COLORS.lightBg, borderRadius: '8px', fontSize: '13px', color: COLORS.grey, borderLeft: `4px solid ${COLORS.blue}` }}>
        <strong>Architektur-Hinweis:</strong> Änderungen an Stundensätzen wirken sich sofort auf die historische und zukünftige Produktivitätsberechnung in den Dashboards aus. Aus Sicherheitsgründen können neue Nutzerkonten nur über das zentrale Supabase Auth-Interface angelegt werden.
      </div>
    </div>
  );
}