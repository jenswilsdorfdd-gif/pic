import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useLocation } from 'react-router-dom';

const COLORS = {
  blue: '#005b82',
  green: '#8ab511',
  grey: '#5b5d5f',
  lightBg: '#f8f9fa',
  warning: '#ffc107',
  success: '#28a745'
};

export default function Offers() {
  const location = useLocation();
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter- & Sortier-State
  const [filter, setFilter] = useState<'all' | 'active'>(location.state?.filter || 'all');
  const [sortField, setSortField] = useState<'created_at' | 'net_amount'>(location.state?.filter === 'active' ? 'net_amount' : 'created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Formular-State
  const [offerNumber, setOfferNumber] = useState('');
  const [title, setTitle] = useState('');
  const [netAmount, setNetAmount] = useState<number | ''>('');
  const [incidentalCosts, setIncidentalCosts] = useState<number | ''>(0);
  const [status, setStatus] = useState('draft');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('offers').select('*');
    if (!error && data) {
      setOffers(data);
    }
    setLoading(false);
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: '', type: '' });

    const { error } = await supabase.from('offers').insert([
      { offer_number: offerNumber, title: title, net_amount: Number(netAmount), incidental_costs_percent: Number(incidentalCosts), status: status }
    ]);

    if (error) {
      setMessage({ text: 'Fehler beim Speichern: ' + error.message, type: 'error' });
    } else {
      setMessage({ text: 'Angebot erfolgreich angelegt.', type: 'success' });
      setOfferNumber(''); setTitle(''); setNetAmount(''); setIncidentalCosts(0); setStatus('draft');
      fetchOffers();
    }
    setIsSubmitting(false);
  };

  const handleConvertToProject = async (offer: any) => {
    const projectNumber = window.prompt(`Angebot "${offer.title}" gewonnen!\nBitte Projektnummer für das neue Projekt vergeben:`, offer.offer_number?.replace('A', 'P') || '');
    if (!projectNumber) return;

    const totalBudget = Number(offer.net_amount) * (1 + Number(offer.incidental_costs_percent) / 100);
    const { error: projectError } = await supabase.from('projects').insert([
      { project_number: projectNumber, name: offer.title, total_budget: totalBudget, target_margin_percent: 8, status: 'active' }
    ]);

    if (projectError) {
      alert('Fehler bei der Projektanlage: ' + projectError.message);
      return;
    }

    await supabase.from('offers').update({ status: 'accepted' }).eq('id', offer.id);
    fetchOffers();
  };

  // SSOT: Memoized Filter & Sort
  const processedOffers = useMemo(() => {
    let result = offers;
    if (filter === 'active') {
      result = result.filter(o => o.status === 'draft' || o.status === 'sent');
    }
    return result.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [offers, filter, sortField, sortOrder]);

  const handleSortToggle = (field: 'created_at' | 'net_amount') => {
    if (sortField === field) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('desc'); }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val || 0);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}><h3 style={{ color: COLORS.blue }}>Lade Angebotsdaten...</h3></div>;

  return (
    <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <h1 style={{ color: COLORS.grey, borderBottom: `3px solid ${COLORS.green}`, paddingBottom: '10px', marginTop: 0 }}>Angebotswesen</h1>

      {message.text && (
        <div style={{ padding: '12px', marginBottom: '20px', borderRadius: '4px', fontWeight: 'bold', background: message.type === 'error' ? '#f8d7da' : '#d4edda', color: message.type === 'error' ? '#721c24' : '#155724' }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', marginTop: '20px' }}>
        
        {/* LINKE SPALTE: NEUES ANGEBOT */}
        <div style={{ background: COLORS.lightBg, padding: '20px', borderRadius: '8px', border: '1px solid #ddd', alignSelf: 'start' }}>
          <h2 style={{ fontSize: '18px', color: COLORS.blue, marginTop: 0 }}>Neues Angebot erfassen</h2>
          <form onSubmit={handleCreateOffer} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Angebotsnummer</label>
              <input type="text" value={offerNumber} onChange={e => setOfferNumber(e.target.value)} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} placeholder="z.B. A26-045"/>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Projekt / Titel</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Netto-Betrag (€)</label>
                <input type="number" step="0.01" value={netAmount} onChange={e => setNetAmount(Number(e.target.value))} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ width: '100px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Nebenk. (%)</label>
                <input type="number" step="0.1" value={incidentalCosts} onChange={e => setIncidentalCosts(Number(e.target.value))} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}>
                <option value="draft">Entwurf</option>
                <option value="sent">Versendet</option>
              </select>
            </div>
            <button type="submit" disabled={isSubmitting} style={{ padding: '10px', background: COLORS.green, color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
              {isSubmitting ? 'Speichere...' : 'Angebot anlegen'}
            </button>
          </form>
        </div>

        {/* RECHTE SPALTE: ANGEBOTSLISTE MIT FILTER & SORTIERUNG */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', background: COLORS.lightBg, padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setFilter('all')} style={{ padding: '6px 12px', cursor: 'pointer', border: 'none', borderRadius: '4px', background: filter === 'all' ? COLORS.blue : '#ccc', color: filter === 'all' ? '#fff' : '#333' }}>Alle Angebote</button>
              <button onClick={() => setFilter('active')} style={{ padding: '6px 12px', cursor: 'pointer', border: 'none', borderRadius: '4px', background: filter === 'active' ? COLORS.blue : '#ccc', color: filter === 'active' ? '#fff' : '#333' }}>Nur Aktive (Entwurf/Offen)</button>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: COLORS.grey, fontWeight: 'bold' }}>Sortieren nach:</span>
              <button onClick={() => handleSortToggle('net_amount')} style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px', background: sortField === 'net_amount' ? '#e2e3e5' : '#fff' }}>
                Volumen {sortField === 'net_amount' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </button>
              <button onClick={() => handleSortToggle('created_at')} style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px', background: sortField === 'created_at' ? '#e2e3e5' : '#fff' }}>
                Datum {sortField === 'created_at' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: COLORS.blue, color: '#fff', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Angebot</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Netto</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>NK</th>
                  <th style={{ padding: '10px' }}>Status</th>
                  <th style={{ padding: '10px' }}>Aktion</th>
                </tr>
              </thead>
              <tbody>
                {processedOffers.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: COLORS.grey }}>Keine Angebote in dieser Ansicht.</td></tr>
                ) : (
                  processedOffers.map(offer => (
                    <tr key={offer.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>
                        <strong>{offer.offer_number}</strong><br/>
                        <span style={{ fontSize: '12px', color: COLORS.grey }}>{offer.title}</span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>{formatCurrency(offer.net_amount)}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>{offer.incidental_costs_percent} %</td>
                      <td style={{ padding: '10px' }}>
                        {offer.status === 'draft' && <span style={{ background: '#e2e3e5', padding: '3px 6px', borderRadius: '4px', fontSize: '12px' }}>Entwurf</span>}
                        {offer.status === 'sent' && <span style={{ background: COLORS.warning, padding: '3px 6px', borderRadius: '4px', fontSize: '12px', color: '#000' }}>Versendet</span>}
                        {offer.status === 'accepted' && <span style={{ background: '#d4edda', color: '#155724', padding: '3px 6px', borderRadius: '4px', fontSize: '12px' }}>Gewonnen</span>}
                      </td>
                      <td style={{ padding: '10px' }}>
                        {offer.status !== 'accepted' ? (
                          <button onClick={() => handleConvertToProject(offer)} style={{ background: COLORS.blue, color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>In Projekt umwandeln</button>
                        ) : (
                          <span style={{ fontSize: '12px', color: COLORS.success, fontWeight: 'bold' }}>✓ Projekt aktiv</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}