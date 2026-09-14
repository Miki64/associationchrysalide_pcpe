import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarDays, Settings, FileSpreadsheet, FileText } from 'lucide-react';
import { useBudget } from '../context/BudgetContext';
import { formatCurrency } from '../utils/data';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

export default function Layout() {
  const { usagers, globalBudget, totalPrevisionnel, totalReel, budgetRestant } = useBudget();
  const isOverBudget = budgetRestant < 0;

  const handleExportExcel = () => {
    exportToExcel({ usagers, globalBudget, totalPrevisionnel, totalReel, budgetRestant });
  };

  const handleExportPDF = () => {
    exportToPDF({ usagers, globalBudget, totalPrevisionnel, totalReel, budgetRestant });
  };

  return (
    <div className="flex" style={{ minHeight: '100vh', width: '100%' }}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand-header">
          <img 
            src="/logo-chrysalide.jpg" 
            alt="Association Chrysalide" 
            className="brand-logo-img"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div>
            <div className="flex items-center gap-1">
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0098D8', margin: 0 }}>
                Chrysalide
              </h2>
              <span style={{ fontSize: '0.9rem' }}>🦋</span>
            </div>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#E83D84', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              PCPE Autisme
            </p>
          </div>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <p className="text-muted text-xs font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0.5rem 0.5rem 0.75rem' }}>
            Pilotage & Suivi
          </p>

          <NavLink to="/" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            <LayoutDashboard size={19} />
            <span>Tableau de bord</span>
          </NavLink>

          <NavLink to="/usagers" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            <Users size={19} />
            <span>Usagers & Prestations</span>
          </NavLink>

          <NavLink to="/calendrier" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            <CalendarDays size={19} />
            <span>Calendrier Annuel</span>
          </NavLink>

          <p className="text-muted text-xs font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', margin: '1.5rem 0.5rem 0.75rem' }}>
            Configuration
          </p>

          <NavLink to="/admin" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            <Settings size={19} />
            <span>Administration</span>
          </NavLink>
        </nav>

        <div style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#94A3B8', textAlign: 'center' }}>
          Association Chrysalide © 2026
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'hsl(var(--color-background))' }}>
        
        {/* PROMINENT TOP HEADER WITH BUDGET RESTANT & EXPORTS */}
        <header style={{ 
          background: '#FFFFFF', 
          borderBottom: '1px solid hsl(var(--color-border))', 
          padding: '0.85rem 2rem',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
        }}>
          <div className="flex justify-between items-center flex-wrap gap-4" style={{ width: '100%' }}>
            
            {/* Highly Visible Budget Restant Banner */}
            <div className="flex items-center gap-4">
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.85rem',
                  padding: '0.5rem 1.15rem',
                  borderRadius: 'var(--radius-md)',
                  background: isOverBudget 
                    ? 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)' 
                    : 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                  border: isOverBudget ? '1.5px solid #FCA5A5' : '1.5px solid #86EFAC',
                  boxShadow: isOverBudget ? '0 2px 10px rgba(220, 38, 38, 0.1)' : '0 2px 10px rgba(22, 163, 74, 0.1)'
                }}
              >
                <div style={{ 
                  width: '14px', 
                  height: '14px', 
                  borderRadius: '50%', 
                  background: isOverBudget ? '#DC2626' : '#16A34A',
                  boxShadow: isOverBudget ? '0 0 8px #DC2626' : '0 0 8px #16A34A'
                }} />
                <div>
                  <div className="text-xs font-bold" style={{ color: isOverBudget ? '#991B1B' : '#166534', letterSpacing: '0.04em' }}>
                    BUDGET RESTANT À ENGAGER
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: isOverBudget ? '#DC2626' : '#15803D', lineHeight: 1.1 }}>
                    {formatCurrency(budgetRestant)}
                  </div>
                </div>
              </div>

              {/* Quick contextual chips */}
              <div className="flex items-center gap-3 text-xs text-muted">
                <span className="badge badge-blue">
                  Alloué : {formatCurrency(globalBudget)}
                </span>
                <span className="badge badge-purple">
                  Prév. : {formatCurrency(totalPrevisionnel)}
                </span>
                <span className="badge badge-pink">
                  Réel : {formatCurrency(totalReel)}
                </span>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-2">
              <button 
                onClick={handleExportExcel}
                className="btn btn-outline btn-sm"
                style={{ borderColor: '#10B981', color: '#047857', fontWeight: 700 }}
                title="Exporter toutes les données et prestations dans un fichier Excel (.xlsx)"
              >
                <FileSpreadsheet size={16} />
                <span>Export Excel</span>
              </button>

              <button 
                onClick={handleExportPDF}
                className="btn btn-outline btn-sm"
                style={{ borderColor: '#EF4444', color: '#B91C1C', fontWeight: 700 }}
                title="Exporter un rapport imprimable au format PDF"
              >
                <FileText size={16} />
                <span>Export PDF</span>
              </button>
            </div>

          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: '1.75rem 2rem', overflowY: 'auto' }}>
          <div className="container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
