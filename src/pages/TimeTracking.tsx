import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function TimeTracking() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  // Daten-State
  const [projects, setProjects] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Formular-State
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState('');
  const [category, setCategory] = useState('productive');
  const [projectId, setProjectId] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (userId) {
      fetchProjects();
      fetchTimeEntries();
    }
  }, [userId]);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('id, project_number, name')
      .eq('status', 'active')
      .order('project_number', { ascending: true });
    
    if (error) console.error('Fehler beim Laden der Projekte:', error);
    else setProjects(data);
  };

  const fetchTimeEntries = async () => {
    const { data, error } = await supabase
      .from('time_entries')
      .select(`
        id, entry_date, hours, category, description,
        projects ( project_number, name )
      `)
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })
      .limit(20);

    if (error) console.error('Fehler beim Laden der Zeiten:', error);
    else setTimeEntries(data);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validierung: Produktive Zeiten brauchen ein Projekt
    if (category === 'productive' && !projectId) {
      alert('Bitte wählen Sie ein Projekt für produktive Stunden aus.');
      return;
    }

    const { error } = await supabase
      .from('time_entries')
      .insert([{
        user_id: userId,
        project_id: category === 'productive' ? projectId : null,
        entry_date: entryDate,
        hours: parseFloat(hours),
        category,
        description
      }]);

    if (error) {
      alert('Fehler beim Speichern: ' + error.message);
    } else {
      // Formular zurücksetzen & Liste aktualisieren
      setHours('');
      setDescription('');
      fetchTimeEntries();
    }
  };

  if (loading) return <p>Lade Zeiterfassung...</p>;

  return (
    <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
      
      {/* Linke Spalte: Eingabemaske */}
      <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
        <h2 style={{ marginTop: 0 }}>Neue Zeit buchen</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Datum</label>
            <input 
              type="date" 
              value={entryDate} 
              onChange={e => setEntryDate(e.target.value)} 
              required 
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Kategorie</label>
            <select 
              value={category} 
              onChange={e => {
                setCategory(e.target.value);
                if (e.target.value !== 'productive') setProjectId('');
              }} 
              style={{ width: '100%', padding: '8px' }}
            >
              <option value="productive">Projektarbeit (Produktiv)</option>
              <option value="admin">Administration / Internes</option>
              <option value="vacation">Urlaub</option>
              <option value="sick_leave">Krankheit</option>
              <option value="training">Weiterbildung</option>
              <option value="sales">Akquise / Vertrieb</option>
            </select>
          </div>

          {category === 'productive' && (
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Projekt</label>
              <select 
                value={projectId} 
                onChange={e => setProjectId(e.target.value)} 
                required 
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="">-- Projekt wählen --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.project_number} - {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Stunden</label>
            <input 
              type="number" 
              step="0.25" 
              min="0.25"
              placeholder="z.B. 2.5" 
              value={hours} 
              onChange={e => setHours(e.target.value)} 
              required 
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tätigkeitsbeschreibung</label>
            <textarea 
              rows="3" 
              placeholder="Kurze Beschreibung der Leistung..." 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          <button type="submit" style={{ padding: '10px', background: '#0056b3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Zeit erfassen
          </button>
        </form>
      </div>

      {/* Rechte Spalte: Letzte Buchungen */}
      <div style={{ flex: 2, background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
        <h2 style={{ marginTop: 0 }}>Meine letzten Buchungen</h2>
        {timeEntries.length === 0 ? (
          <p>Noch keine Zeiten erfasst.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '10px 0' }}>Datum</th>
                <th>Projekt / Kategorie</th>
                <th>Std.</th>
                <th>Beschreibung</th>
              </tr>
            </thead>
            <tbody>
              {timeEntries.map(entry => (
                <tr key={entry.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px 0' }}>{new Date(entry.entry_date).toLocaleDateString('de-DE')}</td>
                  <td>
                    {entry.category === 'productive' 
                      ? `${entry.projects?.project_number} - ${entry.projects?.name}` 
                      : <span style={{ color: '#666', fontStyle: 'italic' }}>{entry.category}</span>
                    }
                  </td>
                  <td><strong>{entry.hours}</strong></td>
                  <td style={{ fontSize: '14px', color: '#555' }}>{entry.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}