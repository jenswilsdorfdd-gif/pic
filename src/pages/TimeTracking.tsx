import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// PICON Corporate Colors
const COLORS = {
  blue: '#005b82',
  green: '#8ab511',
  grey: '#5b5d5f',
  lightBg: '#f8f9fa'
};

const CATEGORIES = [
  { id: 'productive', label: 'Produktiv (Projekt)' },
  { id: 'admin', label: 'Admin / Orga' },
  { id: 'vacation', label: 'Urlaub' },
  { id: 'sick_leave', label: 'Krankheit' },
  { id: 'training', label: 'Weiterbildung' },
  { id: 'sales', label: 'Vertrieb' }
];

export default function TimeTracking() {
  const { session } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  
  // Formular-State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState<number | ''>('');
  const [category, setCategory] = useState('productive');
  const [projectId, setProjectId] = useState('');
  const [description, setDescription] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    // Lade alle aktiven Projekte für das Dropdown
    const fetchProjects = async () => {
      const { data } = await supabase
        .from('projects')
        .select('id, project_number, name')
        .eq('status', 'active')
        .order('project_number', { ascending: true });
      if (data) setProjects(data);
    };
    fetchProjects();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: '', type: '' });

    if (category === 'productive' && !projectId) {
      setMessage({ text: 'Bitte wähle ein Projekt für produktive Stunden aus.', type: 'error' });
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from('time_entries').insert([
      {
        user_id: session.user.id,
        entry_date: date,
        hours: Number(hours),
        category: category,
        project_id: category === 'productive' ? projectId : null,
        description: description || null
      }
    ]);

    if (error) {
      setMessage({ text: 'Fehler beim Speichern: ' + error.message, type: 'error' });
    } else {
      setMessage({ text: 'Stunden erfolgreich gebucht!', type: 'success' });
      setHours('');
      setDescription('');
      // Die Werte für Datum, Kategorie und Projekt bleiben für schnelle Folge-Buchungen erhalten
    }
    setIsSubmitting(false);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <h1 style={{ color: COLORS.grey, borderBottom: `3px solid ${COLORS.green}`, paddingBottom: '10px', marginTop: 0 }}>
        Zeiterfassung
      </h1>
      
      {message.text && (
        <div style={{ 
          padding: '12px', 
          marginBottom: '20px', 
          borderRadius: '4px', 
          fontWeight: 'bold',
          background: message.type === 'error' ? '#f8d7da' : '#d4edda', 
          color: message.type === 'error' ? '#721c24' : '#155724' 
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: COLORS.grey }}>Datum *</label>
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              required 
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} 
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: COLORS.grey }}>Stunden *</label>
            <input 
              type="number" 
              step="0.25" 
              min="0.25" 
              max="24"
              value={hours} 
              onChange={e => setHours(parseFloat(e.target.value))} 
              required 
              placeholder="z.B. 4.5"
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} 
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: COLORS.grey }}>Kategorie *</label>
          <select 
            value={category} 
            onChange={e => {
              setCategory(e.target.value);
              if (e.target.value !== 'productive') setProjectId('');
            }} 
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          >
            {CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
        </div>

        {category === 'productive' && (
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: COLORS.grey }}>Projekt *</label>
            <select 
              value={projectId} 
              onChange={e => setProjectId(e.target.value)} 
              required 
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            >
              <option value="">-- Bitte Projekt auswählen --</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.project_number} - {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: COLORS.grey }}>Tätigkeit (optional)</label>
          <input 
            type="text" 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            placeholder="Kurze Beschreibung für Rückfragen..."
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} 
          />
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          style={{ 
            padding: '15px', 
            background: COLORS.blue, 
            color: '#fff', 
            border: 'none', 
            borderRadius: '4px', 
            fontWeight: 'bold', 
            fontSize: '16px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1,
            marginTop: '10px'
          }}
        >
          {isSubmitting ? 'Speichere...' : 'Stunden buchen'}
        </button>
      </form>
    </div>
  );
}