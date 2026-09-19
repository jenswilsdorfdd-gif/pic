import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Invoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [projectId, setProjectId] = useState('');
  const [amount, setAmount] = useState('');
  const [isPartialInvoice, setIsPartialInvoice] = useState(false);
  const [status, setStatus] = useState('draft');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('id, project_number, name')
      .eq('status', 'active')
      .order('project_number', { ascending: true });
      
    if (projectsError) console.error('Fehler beim Laden der Projekte:', projectsError);
    else setProjects(projectsData || []);

    const { data: invoicesData, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        id, invoice_number, amount, is_partial_invoice, status, created_at,
        projects ( project_number, name )
      `)
      .order('created_at', { ascending: false });

    if (invoicesError) console.error('Fehler beim Laden der Rechnungen:', invoicesError);
    else setInvoices(invoicesData || []);

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectId) {
      alert('Bitte wählen Sie ein Projekt für die Rechnung aus.');
      return;
    }

    const { error } = await supabase
      .from('invoices')
      .insert([{
        invoice_number: invoiceNumber,
        project_id: projectId,
        amount: parseFloat(amount),
        is_partial_invoice: isPartialInvoice,
        status: status
      }]);

    if (error) {
      alert('Fehler beim Speichern der Rechnung: ' + error.message);
    } else {
      setInvoiceNumber('');
      setProjectId('');
      setAmount('');
      setIsPartialInvoice(false);
      setStatus('draft');
      fetchData();
    }
  };

  if (loading) return <p>Lade Rechnungslegung...</p>;

  return (
    <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
      
      <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
        <h2 style={{ marginTop: 0 }}>Neue Rechnung erfassen</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Rechnungsnummer</label>
            <input 
              type="text" 
              placeholder="z.B. R26-001" 
              value={invoiceNumber} 
              onChange={(e: any) => setInvoiceNumber(e.target.value)} 
              required 
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Projekt</label>
            <select 
              value={projectId} 
              onChange={(e: any) => setProjectId(e.target.value)} 
              required
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            >
              <option value="">-- Projekt wählen --</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.project_number} - {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Betrag (€)</label>
            <input 
              type="number" 
              step="0.01" 
              min="0"
              placeholder="z.B. 5000.00" 
              value={amount} 
              onChange={(e: any) => setAmount(e.target.value)} 
              required 
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input 
              type="checkbox" 
              id="partial"
              checked={isPartialInvoice} 
              onChange={(e: any) => setIsPartialInvoice(e.target.checked)} 
            />
            <label htmlFor="partial" style={{ fontWeight: 'bold', cursor: 'pointer' }}>Dies ist eine Teilrechnung (TR)</label>
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
              <option value="paid">Bezahlt (Paid)</option>
            </select>
          </div>

          <button type="submit" style={{ padding: '10px', background: '#0056b3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}>
            Rechnung speichern
          </button>
        </form>
      </div>

      <div style={{ flex: 2, background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
        <h2 style={{ marginTop: 0 }}>Forderungen L&L (Rechnungsbestand)</h2>
        {invoices.length === 0 ? (
          <p>Noch keine Rechnungen im System.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee', background: '#f8f9fa' }}>
                <th style={{ padding: '10px' }}>Rechnungs-Nr.</th>
                <th style={{ padding: '10px' }}>Projekt</th>
                <th style={{ padding: '10px' }}>Typ</th>
                <th style={{ padding: '10px' }}>Betrag</th>
                <th style={{ padding: '10px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv: any) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}><strong>{inv.invoice_number}</strong></td>
                  <td style={{ padding: '10px' }}>
                    {inv.projects ? `${inv.projects.project_number} - ${inv.projects.name}` : <span style={{ color: '#999', fontStyle: 'italic' }}>Unbekannt/Gelöscht</span>}
                  </td>
                  <td style={{ padding: '10px' }}>
                    {inv.is_partial_invoice ? <span style={{color: '#856404', background: '#fff3cd', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold'}}>TR</span> : <span style={{color: '#155724', background: '#d4edda', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold'}}>SR</span>}
                  </td>
                  <td style={{ padding: '10px' }}>
                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(inv.amount)}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      background: inv.status === 'paid' ? '#d4edda' : inv.status === 'sent' ? '#cce5ff' : '#e2e3e5',
                      color: inv.status === 'paid' ? '#155724' : inv.status === 'sent' ? '#004085' : '#383d41'
                    }}>
                      {inv.status.toUpperCase()}
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