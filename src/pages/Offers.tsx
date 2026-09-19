import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Offers() {
  const [offers, setOffers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [offerNumber, setOfferNumber] = useState('');
  const [projectId, setProjectId] = useState('');
  const [netAmount, setNetAmount] = useState('');
  const [incidentalCosts, setIncidentalCosts] = useState('5.00');
  const [status, setStatus] = useState('draft');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('id, project_number, name')
      .order('project_number', { ascending: true });
      
    if (projectsError) console.error('Fehler beim Laden der Projekte:', projectsError);
    else setProjects(projectsData || []);

    const { data: offersData, error: offersError } = await supabase
      .from('offers')
      .select(`
        id, offer_number, net_amount, incidental_costs_percent, status, created_at,
        projects ( project_number, name )
      `)
      .order('created_at', { ascending: false });

    if (offersError) console.error('Fehler beim Laden der Angebote:', offersError);
    else setOffers(offersData || []);

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from('offers')
      .insert([{
        offer_number: offerNumber,
        project_id: projectId || null,
        net_amount: parseFloat(netAmount),
        incidental_costs_percent: parseFloat(incidentalCosts),
        status: status
      }]);

    if (error) {
      alert('Fehler beim Speichern des Angebots: ' + error.message);
    } else {
      setOfferNumber('');
      setProjectId('');
      setNetAmount('');
      setIncidentalCosts('5.00');
      setStatus('draft');
      fetchData();
    }
  };

  if (loading) return <p>Lade Angebotswesen...</p>;

  return (
    <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
      
      <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
        <h2 style={{ marginTop: 0 }}>Neues Angebot erstellen</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Angebotsnummer</label>
            <input 
              type="text" 
              placeholder="z.B. A26-001" 
              value={offerNumber} 
              onChange={(e: any) => setOfferNumber(e.target.value)} 
              required 
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Projektzuordnung (Optional)</label>
            <select 
              value={projectId} 
              onChange={(e: any) => setProjectId(e.target.value)} 
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            >
              <option value="">-- Ohne Projektbezug / Neu --</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.project_number} - {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Netto-Betrag (€)</label>
            <input 
              type="number" 
              step="0.01" 
              min="0"
              placeholder="z.B. 15000.00" 
              value={netAmount} 
              onChange={(e: any) => setNetAmount(e.target.value)} 
              required 
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nebenkosten (%)</label>
            <input 
              type="number" 
              step="0.1" 
              min="0"
              value={incidentalCosts} 
              onChange={(e: any) => setIncidentalCosts(e.target.value)} 
              required 
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Status</label>
            <select 
              value={status} 
              onChange={(e: any) => setStatus(e.target.value)} 
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            >
              <option value="draft">Entwurf (Draft)</option>
              <option value="sent">Versendet (Sent)</option>
              <option value="accepted">Angenommen (Accepted)</option>
              <option value="rejected">Abgelehnt (Rejected)</option>
            </select>
          </div>

          <button type="submit" style={{ padding: '10px', background: '#0056b3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}>
            Angebot speichern
          </button>
        </form>
      </div>

      <div style={{ flex: 2, background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
        <h2 style={{ marginTop: 0 }}>Angebotsbestand</h2>
        {offers.length === 0 ? (
          <p>Noch keine Angebote im System.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee', background: '#f8f9fa' }}>
                <th style={{ padding: '10px' }}>Angebots-Nr.</th>
                <th style={{ padding: '10px' }}>Projekt</th>
                <th style={{ padding: '10px' }}>Netto</th>
                <th style={{ padding: '10px' }}>NK (%)</th>
                <th style={{ padding: '10px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer: any) => (
                <tr key={offer.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}><strong>{offer.offer_number}</strong></td>
                  <td style={{ padding: '10px' }}>
                    {offer.projects 
                      ? `${offer.projects.project_number} - ${offer.projects.name}` 
                      : <span style={{ color: '#999', fontStyle: 'italic' }}>Kein Projekt</span>}
                  </td>
                  <td style={{ padding: '10px' }}>
                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(offer.net_amount)}
                  </td>
                  <td style={{ padding: '10px' }}>{offer.incidental_costs_percent}%</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      background: offer.status === 'accepted' ? '#d4edda' : offer.status === 'sent' ? '#cce5ff' : '#e2e3e5',
                      color: offer.status === 'accepted' ? '#155724' : offer.status === 'sent' ? '#004085' : '#383d41'
                    }}>
                      {offer.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}