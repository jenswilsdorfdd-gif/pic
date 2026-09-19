import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLocation } from 'react-router-dom';

const COLORS = {
  blue: '#005b82',
  green: '#8ab511',
  grey: '#5b5d5f',
  lightBg: '#f8f9fa',
  warning: '#ffc107',
  danger: '#dc3545',
  success: '#28a745'
};

export default function Invoices() {
  const location = useLocation();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter-State
  const [filter, setFilter] = useState<'all' | 'sent'>(location.state?.filter === 'sent' ? 'sent' : 'all');

  // Formular-State
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [projectId, setProjectId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [isPartialInvoice, setIsPartialInvoice] = useState(true);
  const [status, setStatus] = useState('sent'); 
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: invData } = await supabase.from('invoices').select('*, projects ( project_number, name )').order('created_at', { ascending: false });
    if (invData) setInvoices(invData);

    const { data: projData } = await supabase.from('projects').select('id, project_number, name').eq('status', 'active').order('project_number', { ascending: true });
    if (projData) setProjects(projData);
    
    setLoading(false);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: '', type: '' });

    if (!projectId) {
      setMessage({ text: 'Bitte wähle ein Projekt aus.', type: 'error' });
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from('invoices').insert([
      { invoice_number: invoiceNumber, project_id: projectId, amount: Number(amount), is_partial_invoice: isPartialInvoice, status: status }
    ]);

    if (error) {
      setMessage({ text: 'Fehler beim Speichern: ' + error.message, type: 'error' });
    } else {
      setMessage({ text: 'Rechnung erfolgreich erfasst.', type: 'success' });
      setInvoiceNumber(''); setAmount(''); setProjectId(''); setIsPartialInvoice(true); setStatus('sent');
      fetchData();
    }
    setIsSubmitting(false);
  };

  const handleMarkAsPaid = async (id: string) => {
    const { error } = await supabase.from('invoices').update({ status: 'paid' }).eq('id', id);
    if (error) alert('Fehler beim Aktualisieren: ' + error.message);
    else fetchData();
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val || 0);

  const filteredInvoices = invoices.filter(inv => filter === 'all' || inv.status === filter);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}><h3 style={{ color: COLORS.blue }}>Lade Rechnungsdaten...</h3></div>;

  return (
    <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <h1 style={{ color: COLORS.grey, borderBottom: `3px solid ${COLORS.green}`, paddingBottom: '10px', marginTop: 0 }}>Rechnungslegung & Forderungen</h1>

      {message.text && (
        <div style={{ padding: '12px', marginBottom: '20px', borderRadius: '4px', fontWeight: 'bold', background: message.type === 'error' ? '#f8d7da' : '#d4edda', color: message.type === 'error' ? '#721c24' : '#155724' }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', marginTop: '20px' }}>
        
        {/* LINKE SPALTE: NEUE RECHNUNG */}
        <div style={{ background: COLORS.lightBg, padding: '20px', borderRadius: '8px', border: '1px solid #ddd', alignSelf: 'start' }}>
          <h2 style={{ fontSize: '18px', color: COLORS.blue, marginTop: 0 }}>Rechnungsausgang erfassen</h2>
          <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Rechnungsnummer</label>
              <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} placeholder="z.B. R26-089"/>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Projekt</label>
              <select value={projectId} onChange={e => setProjectId(e.target.value)} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}>
                <option value="">-- Projekt wählen --</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.project_number} - {p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Netto-Betrag (€)</label>
              <input type="number" step="0.01" value={amount} onChange={e => setAmount(Number(e.target.value))} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', background: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', cursor: 'pointer' }}>
                <input type="radio" name="invoiceType" checked={isPartialInvoice} onChange={() => setIsPartialInvoice(true)} /> Teilrechnung (TR)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', cursor: 'pointer' }}>
                <input type="radio" name="invoiceType" checked={!isPartialInvoice} onChange={() => setIsPartialInvoice(false)} /> Schlussrechnung (SR)
              </label>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}>
                <option value="draft">Entwurf</option>
                <option value="sent">Versendet (Offene Forderung)</option>
                <option value="paid">Bezahlt</option>
              </select>
            </div>
            <button type="submit" disabled={isSubmitting} style={{ padding: '10px', background: COLORS.blue, color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' }}>
              {isSubmitting ? 'Speichere...' : 'Rechnung verbuchen'}
            </button>
          </form>
        </div>

        {/* RECHTE SPALTE: RECHNUNGSLISTE MIT FILTER */}
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', background: COLORS.lightBg, padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
            <button onClick={() => setFilter('all')} style={{ padding: '6px 12px', cursor: 'pointer', border: 'none', borderRadius: '4px', background: filter === 'all' ? COLORS.blue : '#ccc', color: filter === 'all' ? '#fff' : '#333' }}>Alle Rechnungen</button>
            <button onClick={() => setFilter('sent')} style={{ padding: '6px 12px', cursor: 'pointer', border: 'none', borderRadius: '4px', background: filter === 'sent' ? COLORS.danger : '#ccc', color: filter === 'sent' ? '#fff' : '#333', fontWeight: filter === 'sent' ? 'bold' : 'normal' }}>Nur Offene Forderungen</button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: COLORS.grey, color: '#fff', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Rechnung</th>
                  <th style={{ padding: '10px' }}>Projekt</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Betrag</th>
                  <th style={{ padding: '10px' }}>Typ</th>
                  <th style={{ padding: '10px' }}>Status</th>
                  <th style={{ padding: '10px' }}>Aktion</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: COLORS.grey }}>Keine Rechnungen in dieser Ansicht.</td></tr>
                ) : (
                  filteredInvoices.map(inv => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}><strong>{inv.invoice_number}</strong></td>
                      <td style={{ padding: '10px' }}><span style={{ fontSize: '12px', color: COLORS.grey }}>{inv.projects?.project_number}</span></td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(inv.amount)}</td>
                      <td style={{ padding: '10px' }}>
                        {inv.is_partial_invoice ? <span style={{ background: '#e2e3e5', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>TR</span> : <span style={{ background: '#d1ecf1', color: '#0c5460', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>SR</span>}
                      </td>
                      <td style={{ padding: '10px' }}>
                        {inv.status === 'draft' && <span style={{ color: COLORS.grey }}>Entwurf</span>}
                        {inv.status === 'sent' && <span style={{ color: COLORS.danger, fontWeight: 'bold' }}>Offen</span>}
                        {inv.status === 'paid' && <span style={{ color: COLORS.success, fontWeight: 'bold' }}>Bezahlt</span>}
                      </td>
                      <td style={{ padding: '10px' }}>
                        {inv.status === 'sent' && (
                          <button onClick={() => handleMarkAsPaid(inv.id)} style={{ background: COLORS.green, color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Als bezahlt markieren</button>
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