import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Projects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectsAndCalculate();
  }, []);

  const fetchProjectsAndCalculate = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id, project_number, name, total_budget, target_margin_percent, status,
        time_entries (
          hours,
          profiles ( hourly_rate )
        )
      `)
      .eq('status', 'active')
      .order('project_number', { ascending: true });

    if (error) {
      console.error('Fehler beim Laden der Controlling-Daten:', error);
      setLoading(false);
      return;
    }

    const processedProjects = data.map((project: any) => {
      let totalHours = 0;
      let actualCosts = 0;

      if (project.time_entries) {
        project.time_entries.forEach((entry: any) => {
          const hrs = Number(entry.hours || 0);
          const rate = Number(entry.profiles?.hourly_rate || 0);
          totalHours += hrs;
          actualCosts += (hrs * rate);
        });
      }

      const budget = Number(project.total_budget || 0);
      const remainingBudget = budget - actualCosts;
      
      const currentMargin = budget > 0 ? ((budget - actualCosts) / budget) * 100 : 0;

      return {
        ...project,
        totalHours,
        actualCosts,
        remainingBudget,
        currentMargin
      };
    });

    setProjects(processedProjects);
    setLoading(false);
  };

  if (loading) return <p>Lade Controlling-Dashboard...</p>;

  return (
    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
      <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Projekt-Controlling (Soll-Ist-Abgleich)</h2>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
        <thead>
          <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '12px' }}>Projekt</th>
            <th style={{ padding: '12px' }}>Soll-Budget</th>
            <th style={{ padding: '12px' }}>Gebuchte Std.</th>
            <th style={{ padding: '12px' }}>Ist-Kosten</th>
            <th style={{ padding: '12px' }}>Rest-Budget</th>
            <th style={{ padding: '12px' }}>Aktuelle Marge</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p: any) => (
            <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px' }}>
                <strong>{p.project_number}</strong><br/>
                <span style={{ color: '#666', fontSize: '12px' }}>{p.name}</span>
              </td>
              <td style={{ padding: '12px' }}>
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(p.total_budget)}
              </td>
              <td style={{ padding: '12px' }}>{p.totalHours} h</td>
              <td style={{ padding: '12px' }}>
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(p.actualCosts)}
              </td>
              <td style={{ padding: '12px', color: p.remainingBudget < 0 ? 'red' : 'inherit' }}>
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(p.remainingBudget)}
              </td>
              <td style={{ padding: '12px' }}>
                <span style={{ 
                  padding: '4px 8px', 
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  background: p.currentMargin >= p.target_margin_percent ? '#d4edda' : '#f8d7da',
                  color: p.currentMargin >= p.target_margin_percent ? '#155724' : '#721c24'
                }}>
                  {p.currentMargin.toFixed(1)} %
                </span>
                <span style={{ fontSize: '11px', color: '#666', marginLeft: '5px' }}>
                  (Ziel: {p.target_margin_percent}%)
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}