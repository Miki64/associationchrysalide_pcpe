import React, { useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { formatCurrency, MONTH_NAMES, getSpecialiteTheme } from '../utils/data';
import { 
  Wallet, TrendingUp, CreditCard, AlertCircle, CheckCircle2, 
  BarChart3, PieChart as PieIcon, ArrowUpRight, Sliders, ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  Legend, PieChart, Pie, Cell, CartesianGrid 
} from 'recharts';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { 
    globalBudget, 
    updateGlobalBudget, 
    totalPrevisionnel, 
    totalReel, 
    budgetRestant, 
    budgetRestantReel,
    usagers 
  } = useBudget();

  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(globalBudget);

  const isOverBudget = budgetRestant < 0;
  const isOverBudgetReel = budgetRestantReel < 0;
  const percentPrev = globalBudget > 0 ? (totalPrevisionnel / globalBudget) * 100 : 0;
  const percentReel = globalBudget > 0 ? (totalReel / globalBudget) * 100 : 0;

  const handleSaveBudget = (e) => {
    e.preventDefault();
    updateGlobalBudget(tempBudget);
    setIsEditingBudget(false);
  };

  // 1. Data for Monthly Forecast vs Real BarChart
  const monthlyChartData = MONTH_NAMES.map(m => {
    let mPrev = 0;
    let mReel = 0;
    usagers.forEach(u => {
      (u.prestations || []).forEach(p => {
        if (p.mensuel && p.mensuel[m.key]) {
          mPrev += Number(p.mensuel[m.key].previsionnel || 0);
          mReel += Number(p.mensuel[m.key].reel || 0);
        }
      });
    });
    return {
      name: m.short,
      fullName: m.label,
      Prévisionnel: Math.round(mPrev),
      Réel: Math.round(mReel)
    };
  });

  // 2. Data for Specialty PieChart
  const specialtyTotals = {};
  usagers.forEach(u => {
    (u.prestations || []).forEach(p => {
      const spec = p.specialite || 'Autre';
      specialtyTotals[spec] = (specialtyTotals[spec] || 0) + Number(p.coutAnnuel || 0);
    });
  });

  const specialtyChartData = Object.entries(specialtyTotals).map(([name, value]) => {
    const theme = getSpecialiteTheme(name);
    return {
      name,
      value: Math.round(value),
      color: theme.color,
      emoji: theme.emoji
    };
  }).sort((a, b) => b.value - a.value);

  // 3. Top Usagers by Cost
  const usagersRanking = usagers
    .map(u => {
      const prev = (u.prestations || []).reduce((acc, p) => acc + Number(p.coutAnnuel || 0), 0);
      const reel = (u.prestations || []).reduce((acc, p) => acc + Number(p.coutReel || 0), 0);
      const percentOfGlobal = globalBudget > 0 ? ((prev / globalBudget) * 100) : 0;
      return {
        ...u,
        totalPrev: prev,
        totalReel: reel,
        percentOfGlobal
      };
    })
    .sort((a, b) => b.totalPrev - a.totalPrev);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header with Title & Simulation Bar */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1>Tableau de bord de Gestion</h1>
            <span style={{ fontSize: '1.5rem' }}>✨</span>
          </div>
          <p className="text-muted" style={{ marginTop: '0.25rem' }}>
            Simulateur & Analyse Budgétaire — PCPE Autisme Chrysalide
          </p>
        </div>

        {/* Quick Simulation Budget Button */}
        <div className="flex items-center gap-2">
          {!isEditingBudget ? (
            <button 
              onClick={() => { setTempBudget(globalBudget); setIsEditingBudget(true); }}
              className="btn btn-dark"
            >
              <Sliders size={18} />
              <span>Simuler / Modifier Budget Alloué</span>
            </button>
          ) : (
            <form onSubmit={handleSaveBudget} className="flex items-center gap-2 card" style={{ padding: '0.5rem 0.75rem' }}>
              <span className="text-sm font-semibold">Budget (€) :</span>
              <input 
                type="number"
                value={tempBudget}
                onChange={(e) => setTempBudget(e.target.value)}
                className="input"
                style={{ width: '130px', padding: '0.4rem 0.6rem' }}
                autoFocus
              />
              <button type="submit" className="btn btn-primary btn-sm">Appliquer</button>
              <button type="button" onClick={() => setIsEditingBudget(false)} className="btn btn-outline btn-sm">Annuler</button>
            </form>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        
        {/* KPI 1 : Budget Alloué */}
        <div className="card" style={{ borderLeft: '4px solid #0098D8' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
            <span className="text-muted text-xs font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              BUDGET ANNUEL ALLOUÉ
            </span>
            <div style={{ padding: '0.6rem', background: '#E0F2FE', color: '#0098D8', borderRadius: '10px' }}>
              <Wallet size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'hsl(var(--color-text-main))' }}>
            {formatCurrency(globalBudget)}
          </div>
          <div className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>
            Enveloppe globale de l'Agence / ARS
          </div>
        </div>

        {/* KPI 2 : Total Prévisionnel */}
        <div className="card" style={{ borderLeft: '4px solid #7C3AED' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
            <span className="text-muted text-xs font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              PRÉVISIONNEL ENGAGÉ
            </span>
            <div style={{ padding: '0.6rem', background: '#F5F3FF', color: '#7C3AED', borderRadius: '10px' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'hsl(var(--color-text-main))' }}>
            {formatCurrency(totalPrevisionnel)}
          </div>
          <div className="flex items-center gap-2" style={{ marginTop: '0.5rem' }}>
            <span className="badge badge-purple">
              {percentPrev.toFixed(1)}% alloué
            </span>
            <span className="text-xs text-muted">projections 2026</span>
          </div>
        </div>

        {/* KPI 3 : Dépenses Réellement Engagées */}
        <div className="card" style={{ borderLeft: '4px solid #E83D84' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
            <span className="text-muted text-xs font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              RÉELLEMENT ENGAGÉ
            </span>
            <div style={{ padding: '0.6rem', background: '#FCE7F3', color: '#E83D84', borderRadius: '10px' }}>
              <CreditCard size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#E83D84' }}>
            {formatCurrency(totalReel)}
          </div>
          <div className="flex items-center gap-2" style={{ marginTop: '0.5rem' }}>
            <span className="badge badge-pink">
              {percentReel.toFixed(1)}% du budget
            </span>
            <span className="text-xs text-muted">facturé à date</span>
          </div>
        </div>

        {/* KPI 4 : Solde Prévisionnel Restant */}
        <div className="card" style={{ borderLeft: isOverBudget ? '4px solid #DC2626' : '4px solid #059669' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
            <span className="text-muted text-xs font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              RESTANT À ENGAGER (PRÉV.)
            </span>
            <div style={{ 
              padding: '0.6rem', 
              background: isOverBudget ? '#FEE2E2' : '#ECFDF5', 
              color: isOverBudget ? '#DC2626' : '#059669', 
              borderRadius: '10px' 
            }}>
              {isOverBudget ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: isOverBudget ? '#DC2626' : '#059669' }}>
            {formatCurrency(budgetRestant)}
          </div>
          <div className="text-xs font-semibold" style={{ marginTop: '0.5rem', color: isOverBudget ? '#DC2626' : '#059669' }}>
            {isOverBudget ? '⚠️ Dépassement prévisionnel' : '✅ Budget sous contrôle'}
          </div>
        </div>

        {/* KPI 5 : Solde Réel Restant */}
        <div className="card" style={{ borderLeft: isOverBudgetReel ? '4px solid #DC2626' : '4px solid #10B981' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
            <span className="text-muted text-xs font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              SOLDE RESTANT (RÉEL)
            </span>
            <div style={{ 
              padding: '0.6rem', 
              background: isOverBudgetReel ? '#FEE2E2' : '#D1FAE5', 
              color: isOverBudgetReel ? '#DC2626' : '#10B981', 
              borderRadius: '10px' 
            }}>
              {isOverBudgetReel ? <AlertCircle size={20} /> : <Wallet size={20} />}
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: isOverBudgetReel ? '#DC2626' : '#10B981' }}>
            {formatCurrency(budgetRestantReel)}
          </div>
          <div className="text-xs font-semibold" style={{ marginTop: '0.5rem', color: isOverBudgetReel ? '#DC2626' : '#10B981' }}>
            {isOverBudgetReel ? '⚠️ Dépassement réel' : '✅ Trésorerie disponible'}
          </div>
        </div>
      </div>

      {/* CHARTS SECTION (For Direction & Reporting) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.5rem' }}>
        
        {/* Chart 1: Monthly Forecast vs Real */}
        <div className="card">
          <div className="flex justify-between items-center" style={{ marginBottom: '1.25rem' }}>
            <div>
              <h3 className="flex items-center gap-2">
                <BarChart3 size={20} color="#0098D8" />
                <span>Suivi Mensuel : Prévisionnel vs Réel</span>
              </h3>
              <p className="text-muted text-xs">Évolution des accompagnements mois par mois (€)</p>
            </div>
          </div>

          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}€`} />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), '']}
                  labelFormatter={(name, items) => items[0]?.payload?.fullName || name}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '13px' }} />
                <Bar dataKey="Prévisionnel" fill="#0098D8" radius={[4, 4, 0, 0]} barSize={14} />
                <Bar dataKey="Réel" fill="#E83D84" radius={[4, 4, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Specialty Breakdown */}
        <div className="card">
          <div className="flex justify-between items-center" style={{ marginBottom: '1.25rem' }}>
            <div>
              <h3 className="flex items-center gap-2">
                <PieIcon size={20} color="#7C3AED" />
                <span>Répartition par Spécialité</span>
              </h3>
              <p className="text-muted text-xs">Part du prévisionnel engagé par métier</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', height: 300 }}>
            <div style={{ width: '55%', height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={specialtyChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {specialtyChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val) => [formatCurrency(val), 'Budget prév.']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Legend */}
            <div style={{ width: '45%', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.5rem' }}>
              {specialtyChartData.map(item => {
                const pct = totalPrevisionnel > 0 ? ((item.value / totalPrevisionnel) * 100).toFixed(1) : 0;
                return (
                  <div key={item.name} className="flex items-center justify-between text-xs" style={{ padding: '0.25rem 0' }}>
                    <div className="flex items-center gap-2" style={{ overflow: 'hidden' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                      <span className="font-semibold" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {item.emoji} {item.name}
                      </span>
                    </div>
                    <span className="text-muted font-semibold">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* TABLEAU RÉCAPITULATIF PAR USAGER AVEC % DU BUDGET GLOBAL */}
      <div className="card">
        <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 className="flex items-center gap-2">
              <span>👥 Récapitulatif et Impact par Usager</span>
            </h3>
            <p className="text-muted text-xs">
              Part de chaque usager sur le budget global de {formatCurrency(globalBudget)}
            </p>
          </div>
          <Link to="/usagers" className="btn btn-secondary btn-sm">
            <span>Gérer les usagers & prestations</span>
            <ChevronRight size={16} />
          </Link>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Usager</th>
                <th>Prestations</th>
                <th>Coût Prévisionnel</th>
                <th style={{ minWidth: '220px' }}>% du Budget Global</th>
                <th>Coût Réel Réalisé</th>
                <th>Statut</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usagersRanking.map(u => {
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div style={{ 
                          width: '32px', height: '32px', borderRadius: '8px', 
                          background: '#E0F2FE', color: '#0098D8', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.85rem'
                        }}>
                          {u.nom.charAt(0)}
                        </div>
                        <span className="font-semibold">{u.nom}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-gray">
                        {u.prestations?.length || 0} prestation(s)
                      </span>
                    </td>
                    <td className="font-bold" style={{ color: 'hsl(var(--color-text-main))' }}>
                      {formatCurrency(u.totalPrev)}
                    </td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold" style={{ color: '#0098D8' }}>
                            {u.percentOfGlobal.toFixed(1)}%
                          </span>
                          <span className="text-muted">sur budget alloué</span>
                        </div>
                        <div className="progress-bar-container">
                          <div 
                            className="progress-bar-fill" 
                            style={{ 
                              width: `${Math.min(u.percentOfGlobal * 4, 100)}%`, // scaled for visual distinction
                              background: u.percentOfGlobal > 10 ? '#E83D84' : '#0098D8'
                            }} 
                          />
                        </div>
                      </div>
                    </td>
                    <td className="font-semibold" style={{ color: u.totalReel > 0 ? '#E83D84' : 'hsl(var(--color-text-muted))' }}>
                      {formatCurrency(u.totalReel)}
                    </td>
                    <td>
                      <span className={`badge ${u.actif ? 'badge-green' : 'badge-red'}`}>
                        {u.actif ? '🟢 Actif' : '🔴 En attente / Clôturé'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to="/usagers" className="btn btn-outline btn-sm">
                        Voir détail
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
