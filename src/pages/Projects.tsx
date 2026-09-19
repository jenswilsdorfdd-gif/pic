import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// PICON Corporate Colors
const COLORS = {
  blue: '#005b82',
  green: '#8ab511',
  grey: '#5b5d5f',
  lightBg: '#f8f9fa',
  danger: '#dc3545'
};

export default function Projects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id, project_number, name, total_budget, target_margin_percent, status,
        time_entries ( hours, profiles ( hourly_rate ) )
      `)
      .order('project_number', { ascending: true });

    if (!error && data) {
      const enriched = data.map((p: any) => {
        let actualCosts = 0;
        if (p.time_entries) {
          p.time_entries.forEach((entry: any) => {
            const hrs = Number(entry.hours || 0);
            const rate = Number(entry.profiles?.hourly_rate || 0);
            actualCosts += (hrs * rate);
          });
        }
        const budget = Number(p.total_budget || 0);
        const margin = budget > 0 ? ((budget - actualCosts) / budget) * 100 : 0;
        return { ...p, actualCosts, currentMargin: margin };
      });
      setProjects(enriched);
    }
    setLoading(false);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <h3 style={{ color: COLORS.blue }}>Lade Projekt-Controlling...</h3>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <h1 style={{ color: COLORS.grey, borderBottom: `3px solid ${COLORS.green}`, paddingBottom: '10px', marginTop: 0 }}>
        Projekt-Controlling (Soll/Ist)
      </h1>

      <div style={{ overflowX: 'auto', marginTop: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: COLORS.lightBg, borderBottom: `2px solid ${COLORS.grey}`, color: COLORS.grey }}>
              <th style={{ padding: '12px' }}>Projektnummer</th>
              <th style={{ padding: '12px' }}>Projektname</th>
              <th style={{ padding: '12px' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Budget (Soll)</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Kosten (Ist)</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Marge (Ist)</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Zielmarge</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}><strong>{p.project_number}</strong></td>
                <td style={{ padding: '12px' }}>{p.name}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 8px', borderRadius: '12px', fontSize: '12px',
                    backgroundColor: p.status === 'active' ? '#d4edda' : '#e2e3e5',
                    color: p.status === 'active' ? '#155724' : '#383d41'
                  }}>
                    {p.status === 'active' ? 'Aktiv' : 'Abgeschlossen'}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{formatCurrency(p.total_budget)}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: p.actualCosts > 0 ? COLORS.danger : 'inherit' }}>
                  {formatCurrency(p.actualCosts)}
                </td>
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  <span style={{
                    fontWeight: 'bold',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: p.currentMargin < p.target_margin_percent ? '#f8d7da' : 'transparent',
                    color: p.currentMargin < p.target_margin_percent ? COLORS.danger : COLORS.green
                  }}>
                    {p.currentMargin.toFixed(1)} %
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'right', color: COLORS.grey }}>
                  {p.target_margin_percent} %
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}