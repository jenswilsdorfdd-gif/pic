import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// PICON Corporate Colors
const COLORS = {
  blue: '#005b82',
  green: '#8ab511',
  grey: '#5b5d5f',
  lightBg: '#f8f9fa',
  danger: '#dc3545'
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  
  // KPI States
  const [openInvoices, setOpenInvoices] = useState({ count: 0, sum: 0 });
  const [openOffers, setOpenOffers] = useState({ count: 0, sum: 0 });
  const [criticalProjects, setCriticalProjects] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);

    // 1. Offene Forderungen (Invoices mit Status 'sent')
    const { data: invData, error: invError } = await supabase
      .from('invoices')
      .select('amount')
      .eq('status', 'sent');

    if (!invError && invData) {
      const sum = invData.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
      setOpenInvoices({ count: invData.length, sum });
    }

    // 2. Offene Angebote (Offers mit Status 'sent' oder 'draft')
    const { data: offData, error: offError } = await supabase
      .from('offers')
      .select('net_amount')
      .in('status', ['sent', 'draft']);

    if (!offError && offData) {
      const sum = offData.reduce((acc, curr) => acc + Number(curr.net_amount || 0), 0);
      setOpenOffers({ count: offData.length, sum });
    }

    // 3. Kritische Projekte (Marge < Target Marge)
    const { data: projData, error: projError } = await supabase
      .from('projects')
      .select(`
        id, project_number, name, total_budget, target_margin_percent, status,
        time_entries ( hours, profiles ( hourly_rate ) )
      `)
      .eq('status', 'active');

    if (!projError && projData) {
      const crit = [];
      for (const p of projData) {
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

        if (margin < Number(p.target_margin_percent || 8)) {
          crit.push({ ...p, actualCosts, currentMargin: margin });
        }
      }
      
      // Nach schlechtester Marge sortieren
      crit.sort((a, b) => a.currentMargin - b.currentMargin);
      setCriticalProjects(crit);
    }

    setLoading(false);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <h3 style={{ color: COLORS.blue }}>Lade Executive Dashboard...</h3>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginTop: 0, color: COLORS.grey, borderBottom: `3px solid ${COLORS.green}`, paddingBottom: '10px', display: 'inline-block' }}>
        Executive Dashboard
      </h1>

      {/* KPI Kacheln */}
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
        
        {/* Kachel 1: Forderungen */}
        <div style={{ flex: '1 1 250px', background: COLORS.blue, color: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'normal', opacity: 0.9 }}>Offene Forderungen (L&L)</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>
            {formatCurrency(openInvoices.sum)}
          </div>
          <div style={{ fontSize: '13px', opacity: 0.8 }}>aus {openInvoices.count} gestellten Rechnungen</div>
        </div>

        {/* Kachel 2: Angebote */}
        <div style={{ flex: '1 1 250px', background: COLORS.green, color: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'normal', opacity: 0.9 }}>Angebotsvolumen (Offen)</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>
            {formatCurrency(openOffers.sum)}
          </div>
          <div style={{ fontSize: '13px', opacity: 0.8 }}>in {openOffers.count} aktiven Angeboten</div>
        </div>

        {/* Kachel 3: Kritische Projekte */}
        <div style={{ flex: '1 1 250px', background: criticalProjects.length > 0 ? COLORS.danger : COLORS.grey, color: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'normal', opacity: 0.9 }}>Kritische Projekte (Marge &lt; 8%)</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>
            {criticalProjects.length}
          </div>
          <div style={{ fontSize: '13px', opacity: 0.8 }}>Projekte erfordern Aufmerksamkeit</div>
        </div>

      </div>

      {/* Tabelle: Kritische Projekte */}
      <div style={{ marginTop: '40px', background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h2 style={{ marginTop: 0, color: COLORS.grey }}>Aktionsbedarf: Margen-Warnungen</h2>
        
        {criticalProjects.length === 0 ? (
          <p style={{ color: COLORS.green, fontWeight: 'bold' }}>Hervorragend! Aktuell liegen alle aktiven Projekte im Bereich der Zielmarge.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${COLORS.grey}`, color: COLORS.grey }}>
                <th style={{ padding: '12px' }}>Projekt</th>
                <th style={{ padding: '12px' }}>Budget (Soll)</th>
                <th style={{ padding: '12px' }}>Kosten (Ist)</th>
                <th style={{ padding: '12px' }}>Aktuelle Marge</th>
                <th style={{ padding: '12px' }}>Zielmarge</th>
              </tr>
            </thead>
            <tbody>
              {criticalProjects.map((p: any) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>
                    <strong>{p.project_number}</strong><br/>
                    <span style={{ color: '#666', fontSize: '12px' }}>{p.name}</span>
                  </td>
                  <td style={{ padding: '12px' }}>{formatCurrency(p.total_budget)}</td>
                  <td style={{ padding: '12px', color: COLORS.danger }}>{formatCurrency(p.actualCosts)}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ background: '#f8d7da', color: '#721c24', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                      {p.currentMargin.toFixed(1)} %
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#666' }}>{p.target_margin_percent} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}