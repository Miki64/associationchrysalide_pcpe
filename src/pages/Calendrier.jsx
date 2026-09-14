import React, { useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { MONTH_NAMES, formatCurrency, formatEcart, getSpecialiteTheme } from '../utils/data';
import { Calendar, Users, Briefcase, Stethoscope, Search, Info, BarChart2 } from 'lucide-react';

export default function Calendrier() {
  const { usagers, globalBudget } = useBudget();
  const [viewMode, setViewMode] = useState('usagers'); // 'usagers' | 'specialites' | 'professionnels' | 'global'
  const [searchTerm, setSearchTerm] = useState('');

  // --- 1. Compute Data for View: Usagers ---
  const usagersRows = usagers.map(u => {
    const monthlyValues = {};
    let rowTotalPrev = 0;
    let rowTotalReel = 0;

    MONTH_NAMES.forEach(m => {
      let mPrev = 0;
      let mReel = 0;
      (u.prestations || []).forEach(p => {
        const mData = p.mensuel?.[m.key] || { previsionnel: 0, reel: 0 };
        mPrev += Number(mData.previsionnel || 0);
        mReel += Number(mData.reel || 0);
      });
      monthlyValues[m.key] = { prev: mPrev, reel: mReel };
      rowTotalPrev += mPrev;
      rowTotalReel += mReel;
    });

    return {
      id: u.id,
      name: u.nom,
      monthlyValues,
      rowTotalPrev,
      rowTotalReel,
      diff: rowTotalReel - rowTotalPrev
    };
  });

  // --- 2. Compute Data for View: Spécialités ---
  const specialtiesMap = {};
  usagers.forEach(u => {
    (u.prestations || []).forEach(p => {
      const spec = p.specialite || 'Autre';
      if (!specialtiesMap[spec]) {
        specialtiesMap[spec] = {
          name: spec,
          monthlyValues: {},
          rowTotalPrev: 0,
          rowTotalReel: 0
        };
        MONTH_NAMES.forEach(m => { 
          specialtiesMap[spec].monthlyValues[m.key] = { prev: 0, reel: 0 }; 
        });
      }

      MONTH_NAMES.forEach(m => {
        const mData = p.mensuel?.[m.key] || { previsionnel: 0, reel: 0 };
        const prev = Number(mData.previsionnel || 0);
        const reel = Number(mData.reel || 0);

        specialtiesMap[spec].monthlyValues[m.key].prev += prev;
        specialtiesMap[spec].monthlyValues[m.key].reel += reel;
        specialtiesMap[spec].rowTotalPrev += prev;
        specialtiesMap[spec].rowTotalReel += reel;
      });
    });
  });
  const specialtiesRows = Object.values(specialtiesMap).map(row => ({
    ...row,
    diff: row.rowTotalReel - row.rowTotalPrev
  }));

  // --- 3. Compute Data for View: Professionnels ---
  const prosMap = {};
  usagers.forEach(u => {
    (u.prestations || []).forEach(p => {
      const pro = p.professionnel || 'Non assigné';
      if (!prosMap[pro]) {
        prosMap[pro] = {
          name: pro,
          specialite: p.specialite,
          monthlyValues: {},
          rowTotalPrev: 0,
          rowTotalReel: 0
        };
        MONTH_NAMES.forEach(m => { 
          prosMap[pro].monthlyValues[m.key] = { prev: 0, reel: 0 }; 
        });
      }

      MONTH_NAMES.forEach(m => {
        const mData = p.mensuel?.[m.key] || { previsionnel: 0, reel: 0 };
        const prev = Number(mData.previsionnel || 0);
        const reel = Number(mData.reel || 0);

        prosMap[pro].monthlyValues[m.key].prev += prev;
        prosMap[pro].monthlyValues[m.key].reel += reel;
        prosMap[pro].rowTotalPrev += prev;
        prosMap[pro].rowTotalReel += reel;
      });
    });
  });
  const prosRows = Object.values(prosMap)
    .map(row => ({
      ...row,
      diff: row.rowTotalReel - row.rowTotalPrev
    }))
    .sort((a, b) => b.rowTotalPrev - a.rowTotalPrev);

  // Active Rows based on viewMode
  let rawRows = usagersRows;
  if (viewMode === 'specialites') rawRows = specialtiesRows;
  if (viewMode === 'professionnels') rawRows = prosRows;

  // Filter with search term
  const activeRows = rawRows.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Column Totals (Monthly sums + Grand Totals) ---
  const columnTotals = {};
  let grandTotalPrev = 0;
  let grandTotalReel = 0;

  MONTH_NAMES.forEach(m => {
    let mPrev = 0;
    let mReel = 0;
    activeRows.forEach(row => {
      mPrev += (row.monthlyValues[m.key]?.prev || 0);
      mReel += (row.monthlyValues[m.key]?.reel || 0);
    });
    columnTotals[m.key] = { prev: mPrev, reel: mReel };
    grandTotalPrev += mPrev;
    grandTotalReel += mReel;
  });

  // --- 4. Global Monthly Recap (all usagers combined, per month) ---
  const globalMonthlyData = (() => {
    let cumulPrev = 0;
    let cumulReel = 0;
    return MONTH_NAMES.map(m => {
      let mPrev = 0;
      let mReel = 0;
      usagers.forEach(u => {
        (u.prestations || []).forEach(p => {
          const mData = p.mensuel?.[m.key] || { previsionnel: 0, reel: 0 };
          mPrev += Number(mData.previsionnel || 0);
          mReel += Number(mData.reel || 0);
        });
      });
      cumulPrev += mPrev;
      cumulReel += mReel;
      const ecart = mReel - mPrev;
      const budgetMensuel = globalBudget / 12;
      const tauxPrev = budgetMensuel > 0 ? (mPrev / budgetMensuel) * 100 : 0;
      const tauxReel = budgetMensuel > 0 ? (mReel / budgetMensuel) * 100 : 0;
      return {
        ...m,
        prev: mPrev,
        reel: mReel,
        ecart,
        cumulPrev,
        cumulReel,
        cumulEcart: cumulReel - cumulPrev,
        budgetMensuel,
        tauxPrev,
        tauxReel,
        hasActivity: mPrev > 0 || mReel > 0
      };
    });
  })();

  const globalTotalPrev = globalMonthlyData.reduce((s, m) => s + m.prev, 0);
  const globalTotalReel = globalMonthlyData.reduce((s, m) => s + m.reel, 0);
  const globalTotalEcart = globalTotalReel - globalTotalPrev;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1>Calendrier Budgétaire Annuel</h1>
            <span style={{ fontSize: '1.4rem' }}>📅</span>
          </div>
          <p className="text-muted" style={{ marginTop: '0.25rem' }}>
            Vue unifiée : <strong>Prévisionnel & Réel engagé</strong> sur le même tableau avec alertes couleurs
          </p>
        </div>

        {/* Search Input — hidden in global view */}
        {viewMode !== 'global' && (
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input 
              type="text" 
              placeholder="Filtrer les lignes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{ paddingLeft: '2.4rem', width: '220px' }}
            />
          </div>
        )}
      </div>

      {/* Legend & Help Banner */}
      <div style={{ padding: '0.75rem 1.25rem', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }} className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Info size={16} color="#0098D8" />
          <span>Dans chaque mois :</span>
          <span className="badge badge-purple" style={{ fontWeight: 700 }}>P : Prévisionnel</span>
          <span className="badge badge-pink" style={{ fontWeight: 700 }}>R : Réel engagé</span>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1" style={{ color: '#059669' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#059669' }} />
            Réel ≤ Prév (Dans le budget)
          </span>
          <span className="flex items-center gap-1" style={{ color: '#DC2626' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#DC2626' }} />
            Réel &gt; Prév (Dépassement)
          </span>
        </div>
      </div>

      {/* View Mode Navigation Tabs */}
      <div className="tabs">
        <button 
          onClick={() => setViewMode('usagers')} 
          className={`tab-btn ${viewMode === 'usagers' ? 'active' : ''}`}
        >
          <Users size={18} />
          <span>Vue par Usager ({usagers.length})</span>
        </button>

        <button 
          onClick={() => setViewMode('specialites')} 
          className={`tab-btn ${viewMode === 'specialites' ? 'active' : ''}`}
        >
          <Briefcase size={18} />
          <span>Récapitulatif par Spécialité ({specialtiesRows.length})</span>
        </button>

        <button 
          onClick={() => setViewMode('professionnels')} 
          className={`tab-btn ${viewMode === 'professionnels' ? 'active' : ''}`}
        >
          <Stethoscope size={18} />
          <span>Récapitulatif par Professionnel ({prosRows.length})</span>
        </button>

        <button 
          onClick={() => setViewMode('global')} 
          className={`tab-btn ${viewMode === 'global' ? 'active' : ''}`}
          style={viewMode === 'global' ? { borderColor: '#059669', color: '#059669' } : {}}
        >
          <BarChart2 size={18} />
          <span>Récapitulatif Global Mensuel</span>
        </button>
      </div>

      {/* === GLOBAL MONTHLY RECAP VIEW === */}
      {viewMode === 'global' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div className="card" style={{ borderLeft: '4px solid #7C3AED', padding: '1rem 1.25rem' }}>
              <div className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', marginBottom: '0.4rem' }}>Total Prévisionnel annuel</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#7C3AED' }}>{formatCurrency(globalTotalPrev)}</div>
              <div className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>
                {globalBudget > 0 ? `${((globalTotalPrev / globalBudget) * 100).toFixed(1)}% du budget alloué` : '—'}
              </div>
            </div>
            <div className="card" style={{ borderLeft: '4px solid #E83D84', padding: '1rem 1.25rem' }}>
              <div className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', marginBottom: '0.4rem' }}>Total Réel engagé</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#E83D84' }}>{formatCurrency(globalTotalReel)}</div>
              <div className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>
                {globalBudget > 0 ? `${((globalTotalReel / globalBudget) * 100).toFixed(1)}% du budget alloué` : '—'}
              </div>
            </div>
            <div className="card" style={{ borderLeft: `4px solid ${globalTotalEcart > 0 ? '#DC2626' : '#059669'}`, padding: '1rem 1.25rem' }}>
              <div className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', marginBottom: '0.4rem' }}>Écart global Réel vs Prévi.</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: globalTotalEcart > 0 ? '#DC2626' : (globalTotalEcart < 0 ? '#059669' : '#64748B') }}>
                {formatEcart(globalTotalEcart)}
              </div>
              <div className="text-xs font-semibold" style={{ marginTop: '0.25rem', color: globalTotalEcart > 0 ? '#DC2626' : '#059669' }}>
                {globalTotalEcart > 0 ? '⚠️ Dépassement prévisionnel' : globalTotalEcart < 0 ? '✅ En dessous du prévisionnel' : '⚖️ Équilibré'}
              </div>
            </div>
          </div>

          {/* Monthly detail table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>📊 Détail mensuel — Service PCPE Autisme</h3>
              <p className="text-xs text-muted" style={{ marginTop: '0.2rem' }}>Vue consolidée de tous les usagers · Budget mensuel indicatif : {formatCurrency(globalBudget / 12)}</p>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style={{ minWidth: '110px' }}>Mois</th>
                    <th style={{ textAlign: 'right', color: '#7C3AED' }}>Prévisionnel</th>
                    <th style={{ textAlign: 'right', color: '#BE185D' }}>Réel engagé</th>
                    <th style={{ textAlign: 'right' }}>Écart Réel/Prév</th>
                    <th style={{ minWidth: '180px' }}>Consommation du mois</th>
                    <th style={{ textAlign: 'right', color: '#7C3AED' }}>Cumul Prév.</th>
                    <th style={{ textAlign: 'right', color: '#BE185D' }}>Cumul Réel</th>
                    <th style={{ textAlign: 'right' }}>Écart Cumulé</th>
                  </tr>
                </thead>
                <tbody>
                  {globalMonthlyData.map(m => {
                    const isFav = m.ecart <= 0;
                    const isCumulFav = m.cumulEcart <= 0;
                    const hasActivity = m.hasActivity;
                    const barPrevWidth = Math.min(m.tauxPrev, 100);
                    const barReelWidth = Math.min(m.tauxReel, 100);

                    return (
                      <tr key={m.key} style={{ opacity: hasActivity ? 1 : 0.45 }}>
                        <td>
                          <span className="font-semibold" style={{ fontSize: '0.95rem' }}>{m.label}</span>
                          {!hasActivity && <span className="text-xs text-muted" style={{ display: 'block', fontSize: '0.7rem' }}>Aucune activité</span>}
                        </td>

                        {/* Prévisionnel */}
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#7C3AED' }}>
                          {m.prev > 0 ? formatCurrency(m.prev) : <span className="text-muted">—</span>}
                        </td>

                        {/* Réel */}
                        <td style={{ textAlign: 'right', fontWeight: 700, color: m.reel > 0 ? '#BE185D' : 'hsl(var(--color-text-muted))' }}>
                          {m.reel > 0 ? formatCurrency(m.reel) : <span className="text-muted">—</span>}
                        </td>

                        {/* Écart mois */}
                        <td style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          color: !hasActivity ? '#CBD5E1' : (m.ecart === 0 ? '#64748B' : (isFav ? '#059669' : '#DC2626'))
                        }}>
                          {hasActivity ? formatEcart(m.ecart) : '—'}
                        </td>

                        {/* Progress bars */}
                        <td style={{ padding: '0.5rem 1rem' }}>
                          {hasActivity ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div className="flex items-center gap-2">
                                <span style={{ fontSize: '0.65rem', width: '22px', color: '#7C3AED', fontWeight: 700 }}>Prév</span>
                                <div style={{ flex: 1, height: '6px', background: '#EDE9FE', borderRadius: '99px', overflow: 'hidden' }}>
                                  <div style={{ width: `${barPrevWidth}%`, height: '100%', background: '#7C3AED', borderRadius: '99px' }} />
                                </div>
                                <span style={{ fontSize: '0.65rem', color: '#7C3AED', fontWeight: 700, minWidth: '32px', textAlign: 'right' }}>{barPrevWidth.toFixed(0)}%</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span style={{ fontSize: '0.65rem', width: '22px', color: '#BE185D', fontWeight: 700 }}>Réel</span>
                                <div style={{ flex: 1, height: '6px', background: '#FCE7F3', borderRadius: '99px', overflow: 'hidden' }}>
                                  <div style={{ width: `${barReelWidth}%`, height: '100%', background: m.tauxReel > m.tauxPrev && m.tauxPrev > 0 ? '#DC2626' : '#BE185D', borderRadius: '99px' }} />
                                </div>
                                <span style={{ fontSize: '0.65rem', color: '#BE185D', fontWeight: 700, minWidth: '32px', textAlign: 'right' }}>{barReelWidth.toFixed(0)}%</span>
                              </div>
                            </div>
                          ) : <span className="text-muted text-xs">—</span>}
                        </td>

                        {/* Cumul Prév */}
                        <td style={{ textAlign: 'right', color: '#7C3AED', fontWeight: 600, fontSize: '0.85rem' }}>
                          {m.cumulPrev > 0 ? formatCurrency(m.cumulPrev) : '—'}
                        </td>

                        {/* Cumul Réel */}
                        <td style={{ textAlign: 'right', color: '#BE185D', fontWeight: 600, fontSize: '0.85rem' }}>
                          {m.cumulReel > 0 ? formatCurrency(m.cumulReel) : '—'}
                        </td>

                        {/* Écart cumulé */}
                        <td style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          color: m.cumulPrev === 0 && m.cumulReel === 0 ? '#CBD5E1' : (m.cumulEcart === 0 ? '#64748B' : (isCumulFav ? '#059669' : '#DC2626'))
                        }}>
                          {(m.cumulPrev > 0 || m.cumulReel > 0) ? formatEcart(m.cumulEcart) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#E2E8F0', borderTop: '2px solid #94A3B8', fontWeight: 900 }}>
                    <td style={{ padding: '0.75rem 1rem', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.04em' }}>📊 TOTAL ANNUEL</td>
                    <td style={{ textAlign: 'right', color: '#7C3AED', fontSize: '0.95rem' }}>{formatCurrency(globalTotalPrev)}</td>
                    <td style={{ textAlign: 'right', color: '#BE185D', fontSize: '0.95rem' }}>{formatCurrency(globalTotalReel)}</td>
                    <td style={{
                      textAlign: 'right',
                      fontSize: '0.95rem',
                      color: globalTotalEcart > 0 ? '#DC2626' : (globalTotalEcart < 0 ? '#059669' : '#64748B'),
                      background: globalTotalEcart > 0 ? '#FEE2E2' : '#DCFCE7'
                    }}>
                      {formatEcart(globalTotalEcart)}
                    </td>
                    <td style={{ padding: '0.5rem 1rem' }}>
                      <div className="flex items-center gap-2">
                        <div style={{ flex: 1, height: '8px', background: '#E2E8F0', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ 
                            width: `${Math.min(globalBudget > 0 ? (globalTotalPrev / globalBudget) * 100 : 0, 100)}%`,
                            height: '100%', background: '#7C3AED', borderRadius: '99px' 
                          }} />
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#7C3AED', fontWeight: 700, minWidth: '36px' }}>
                          {globalBudget > 0 ? `${((globalTotalPrev / globalBudget) * 100).toFixed(1)}%` : '—'}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', color: '#7C3AED' }}>{formatCurrency(globalTotalPrev)}</td>
                    <td style={{ textAlign: 'right', color: '#BE185D' }}>{formatCurrency(globalTotalReel)}</td>
                    <td style={{
                      textAlign: 'right',
                      color: globalTotalEcart > 0 ? '#DC2626' : '#059669',
                      background: globalTotalEcart > 0 ? '#FEE2E2' : '#DCFCE7'
                    }}>
                      {formatEcart(globalTotalEcart)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Unified Table — hidden in global recap view */}
      {viewMode !== 'global' && <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper" style={{ maxHeight: '74vh' }}>
          <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%' }}>
            <thead>
              {/* Row 1: Months Main Headers */}
              <tr style={{ position: 'sticky', top: 0, zIndex: 20 }}>
                <th 
                  rowSpan={2} 
                  style={{ 
                    minWidth: '220px', 
                    background: '#F8FAFC', 
                    borderRight: '2px solid #E2E8F0',
                    position: 'sticky',
                    left: 0,
                    zIndex: 25,
                    verticalAlign: 'middle'
                  }}
                >
                  {viewMode === 'usagers' ? 'Bénéficiaire' : viewMode === 'specialites' ? 'Spécialité' : 'Professionnel libéral'}
                </th>

                {MONTH_NAMES.map(m => (
                  <th 
                    key={m.key} 
                    colSpan={2} 
                    style={{ 
                      textAlign: 'center', 
                      background: '#F1F5F9', 
                      borderRight: '1px solid #CBD5E1', 
                      fontSize: '0.8rem',
                      padding: '0.5rem 0.25rem',
                      color: 'hsl(var(--color-text-main))'
                    }}
                  >
                    {m.label}
                  </th>
                ))}

                <th 
                  colSpan={2} 
                  style={{ 
                    textAlign: 'center', 
                    background: '#E2E8F0', 
                    borderLeft: '2px solid #94A3B8', 
                    fontWeight: 800,
                    padding: '0.5rem 0.25rem'
                  }}
                >
                  TOTAL ANNUEL
                </th>
              </tr>

              {/* Row 2: Sub-headers Prév vs Réel */}
              <tr style={{ position: 'sticky', top: '34px', zIndex: 20 }}>
                {MONTH_NAMES.map(m => (
                  <React.Fragment key={`${m.key}-sub`}>
                    <th style={{ textAlign: 'right', minWidth: '60px', padding: '0.4rem 0.4rem', fontSize: '0.72rem', color: '#7C3AED', background: '#F8FAFC', fontWeight: 800 }}>
                      Prév
                    </th>
                    <th style={{ textAlign: 'right', minWidth: '60px', padding: '0.4rem 0.4rem', fontSize: '0.72rem', color: '#BE185D', background: '#F8FAFC', borderRight: '1px solid #CBD5E1', fontWeight: 800 }}>
                      Réel
                    </th>
                  </React.Fragment>
                ))}
                <th style={{ textAlign: 'right', minWidth: '85px', padding: '0.4rem 0.5rem', fontSize: '0.75rem', background: '#E2E8F0', borderLeft: '2px solid #94A3B8', color: '#7C3AED', fontWeight: 800 }}>
                  Total Prév
                </th>
                <th style={{ textAlign: 'right', minWidth: '85px', padding: '0.4rem 0.5rem', fontSize: '0.75rem', background: '#E2E8F0', color: '#BE185D', fontWeight: 800 }}>
                  Total Réel
                </th>
              </tr>
            </thead>

            <tbody>
              {activeRows.map(row => {
                const theme = viewMode === 'specialites' ? getSpecialiteTheme(row.name) : null;
                const isRowOver = row.rowTotalReel > row.rowTotalPrev;

                return (
                  <tr key={row.id || row.name}>
                    {/* Entity Name (Sticky Column) */}
                    <td style={{ 
                      fontWeight: 600, 
                      background: 'white', 
                      borderRight: '2px solid #E2E8F0',
                      position: 'sticky',
                      left: 0,
                      zIndex: 10,
                      padding: '0.65rem 1rem'
                    }}>
                      <div className="flex items-center gap-2">
                        {viewMode === 'specialites' && theme && (
                          <span style={{ fontSize: '1.1rem' }}>{theme.emoji}</span>
                        )}
                        <span>{row.name}</span>
                      </div>
                    </td>

                    {/* 12 Months: Prév and Réel side by side */}
                    {MONTH_NAMES.map(m => {
                      const mData = row.monthlyValues[m.key] || { prev: 0, reel: 0 };
                      const isMonthOver = mData.reel > mData.prev;
                      const hasReel = mData.reel > 0;
                      const hasPrev = mData.prev > 0;

                      return (
                        <React.Fragment key={m.key}>
                          {/* Prévisionnel */}
                          <td style={{ textAlign: 'right', padding: '0.6rem 0.35rem', fontSize: '0.8rem', color: '#475569' }}>
                            {hasPrev ? `${Math.round(mData.prev)} €` : <span style={{ color: '#CBD5E1' }}>-</span>}
                          </td>

                          {/* Réel with Red/Green indicator and +/- sign */}
                          <td 
                            style={{ 
                              textAlign: 'right', 
                              padding: '0.6rem 0.35rem', 
                              fontSize: '0.8rem',
                              fontWeight: hasReel ? 700 : 400,
                              borderRight: '1px solid #E2E8F0',
                              color: hasReel 
                                ? (isMonthOver ? '#DC2626' : '#059669') 
                                : '#94A3B8',
                              background: hasReel 
                                ? (isMonthOver ? '#FEF2F2' : '#F0FDF4') 
                                : 'transparent'
                            }}
                          >
                            {hasReel 
                              ? (isMonthOver 
                                  ? `+ ${Math.round(mData.reel)} €` 
                                  : (mData.reel < mData.prev 
                                      ? `- ${Math.round(mData.reel)} €` 
                                      : `${Math.round(mData.reel)} €`)) 
                              : <span style={{ color: '#CBD5E1' }}>-</span>}
                          </td>
                        </React.Fragment>
                      );
                    })}

                    {/* Total Row Prévisionnel */}
                    <td style={{ 
                      textAlign: 'right', 
                      fontWeight: 700, 
                      fontSize: '0.85rem',
                      background: '#F8FAFC', 
                      borderLeft: '2px solid #94A3B8',
                      color: 'hsl(var(--color-text-main))'
                    }}>
                      {formatCurrency(row.rowTotalPrev)}
                    </td>

                    {/* Total Row Réel (Green if in budget, Red if over) with sign */}
                    <td style={{ 
                      textAlign: 'right', 
                      fontWeight: 800, 
                      fontSize: '0.85rem',
                      background: row.rowTotalReel > 0 
                        ? (isRowOver ? '#FEF2F2' : '#F0FDF4')
                        : '#F8FAFC',
                      color: row.rowTotalReel > 0 
                        ? (isRowOver ? '#DC2626' : '#059669')
                        : 'hsl(var(--color-text-muted))'
                    }}>
                      {row.rowTotalReel > 0 
                        ? (isRowOver 
                            ? `+ ${formatCurrency(row.rowTotalReel)}`
                            : (row.rowTotalReel < row.rowTotalPrev 
                                ? `- ${formatCurrency(row.rowTotalReel)}`
                                : formatCurrency(row.rowTotalReel)))
                        : formatCurrency(row.rowTotalReel)}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* TOTALS FOOTER (MONTHLY TOTALS & GRAND TOTAL) */}
            <tfoot>
              <tr style={{ position: 'sticky', bottom: 0, zIndex: 20, background: '#E2E8F0', borderTop: '2px solid #94A3B8' }}>
                <td style={{ 
                  fontWeight: 900, 
                  background: '#E2E8F0', 
                  borderRight: '2px solid #CBD5E1',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  position: 'sticky',
                  left: 0,
                  zIndex: 25,
                  padding: '0.75rem 1rem'
                }}>
                  📊 TOTAL GÉNÉRAL
                </td>

                {MONTH_NAMES.map(m => {
                  const mTotal = columnTotals[m.key] || { prev: 0, reel: 0 };
                  const isTotalMonthOver = mTotal.reel > mTotal.prev;

                  return (
                    <React.Fragment key={`${m.key}-total`}>
                      {/* Total Prév */}
                      <td style={{ textAlign: 'right', fontWeight: 900, fontSize: '0.8rem', padding: '0.75rem 0.35rem', color: '#7C3AED' }}>
                        {Math.round(mTotal.prev)} €
                      </td>
                      {/* Total Réel (Red if exceeds prev, Green if respects prev) with sign */}
                      <td style={{ 
                        textAlign: 'right', 
                        fontWeight: 900, 
                        fontSize: '0.8rem', 
                        padding: '0.75rem 0.35rem',
                        borderRight: '1px solid #CBD5E1',
                        color: mTotal.reel > 0 ? (isTotalMonthOver ? '#DC2626' : '#059669') : '#94A3B8',
                        background: mTotal.reel > 0 ? (isTotalMonthOver ? '#FEE2E2' : '#DCFCE7') : 'transparent'
                      }}>
                        {mTotal.reel > 0 
                          ? (isTotalMonthOver 
                              ? `+ ${Math.round(mTotal.reel)} €`
                              : (mTotal.reel < mTotal.prev 
                                  ? `- ${Math.round(mTotal.reel)} €`
                                  : `${Math.round(mTotal.reel)} €`))
                          : '0 €'}
                      </td>
                    </React.Fragment>
                  );
                })}

                {/* Grand Total Prév */}
                <td style={{ 
                  textAlign: 'right', 
                  fontWeight: 900, 
                  fontSize: '0.9rem',
                  background: '#CBD5E1', 
                  borderLeft: '2px solid #94A3B8',
                  color: '#7C3AED'
                }}>
                  {formatCurrency(grandTotalPrev)}
                </td>

                {/* Grand Total Réel (Red if > Grand Total Prév, Green if <=) with sign */}
                <td style={{ 
                  textAlign: 'right', 
                  fontWeight: 900, 
                  fontSize: '0.95rem',
                  background: grandTotalReel > grandTotalPrev ? '#FEE2E2' : '#DCFCE7',
                  color: grandTotalReel > grandTotalPrev ? '#DC2626' : '#059669'
                }}>
                  {grandTotalReel > 0 
                    ? (grandTotalReel > grandTotalPrev 
                        ? `+ ${formatCurrency(grandTotalReel)}`
                        : (grandTotalReel < grandTotalPrev 
                            ? `- ${formatCurrency(grandTotalReel)}`
                            : formatCurrency(grandTotalReel)))
                    : formatCurrency(grandTotalReel)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>}

    </div>
  );
}
