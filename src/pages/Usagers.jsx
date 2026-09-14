import React, { useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { formatCurrency, formatEcart, MONTH_NAMES, getSpecialiteTheme, getTypeEmoji } from '../utils/data';
import { 
  Plus, Edit2, Trash2, ChevronDown, ChevronUp, Calendar, 
  MessageSquare, UserPlus, X, Check, Search, Zap
} from 'lucide-react';

export default function Usagers() {
  const { 
    usagers, 
    globalBudget, 
    picklists, 
    addUsager, 
    updateUsager, 
    deleteUsager,
    addPrestations,
    updatePrestation,
    deletePrestation,
    updatePrestationMonthly
  } = useBudget();

  const [expandedUsager, setExpandedUsager] = useState(usagers[0]?.id || null);
  const [searchTerm, setSearchTerm] = useState('');

  // Add Usager Modal
  const [showAddUsagerModal, setShowAddUsagerModal] = useState(false);
  const [newUsagerName, setNewUsagerName] = useState('');

  // Batch Add Prestations Modal
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchTargetUsagerId, setBatchTargetUsagerId] = useState(usagers[0]?.id || '');
  const [batchRows, setBatchRows] = useState([]);

  // Single Edit Prestation Modal
  const [editingPrestation, setEditingPrestation] = useState(null); // { usagerId, prestation }

  // Monthly Edit Modal
  const [monthlyModalData, setMonthlyModalData] = useState(null); // { usagerId, prestation }

  const toggleUsager = (id) => {
    setExpandedUsager(expandedUsager === id ? null : id);
  };

  // Filter usagers
  const filteredUsagers = usagers.filter(u => 
    u.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- HANDLERS FOR USAGERS ---
  const handleCreateUsager = (e) => {
    e.preventDefault();
    if (!newUsagerName.trim()) return;
    addUsager(newUsagerName.trim());
    setNewUsagerName('');
    setShowAddUsagerModal(false);
  };

  const handleDeleteUsager = (id, nom) => {
    if (window.confirm(`Confirmez-vous la suppression définitive de l'usager "${nom}" et de tous ses accompagnements ?`)) {
      deleteUsager(id);
    }
  };

  // --- HANDLERS FOR BATCH ADD PRESTATIONS ---
  const openBatchModal = (targetUsager = null) => {
    const targetId = targetUsager ? targetUsager.id : (usagers[0]?.id || '');
    setBatchTargetUsagerId(targetId);
    setBatchRows([]);
    setShowBatchModal(true);
  };

  const makeEmptyBatchRow = () => {
    const monthlyQty = {};
    MONTH_NAMES.forEach(m => { monthlyQty[m.key] = ''; });
    return {
      annee: 2026,
      type: '',
      specialite: '',
      professionnel: '',
      tarif: '',
      quantiteTotale: '',
      notes: '',
      monthlyQty // { janvier: '', février: '', ... }
    };
  };

  const addBatchRow = () => {
    setBatchRows(prev => [...prev, makeEmptyBatchRow()]);
  };

  const updateBatchRow = (index, field, value) => {
    const updated = [...batchRows];
    updated[index][field] = value;
    setBatchRows(updated);
  };

  const updateBatchMonthQty = (index, monthKey, value) => {
    const updated = [...batchRows];
    updated[index].monthlyQty[monthKey] = value;
    setBatchRows(updated);
  };

  const removeBatchRow = (index) => {
    setBatchRows(prev => prev.filter((_, i) => i !== index));
  };

  // Compute line total from monthly quantities × tarif
  const getBatchRowTotal = (row) => {
    const tarif = Number(row.tarif) || 0;
    let totalQty = 0;
    MONTH_NAMES.forEach(m => {
      totalQty += Number(row.monthlyQty?.[m.key] || 0);
    });
    return tarif * totalQty;
  };

  const getBatchRowMonthTotal = (row, monthKey) => {
    const tarif = Number(row.tarif) || 0;
    const qty = Number(row.monthlyQty?.[monthKey] || 0);
    return tarif * qty;
  };

  const handleSaveBatch = () => {
    if (!batchTargetUsagerId) {
      alert("Veuillez sélectionner un usager.");
      return;
    }
    const validRows = batchRows.filter(r => Number(r.tarif) > 0);
    if (validRows.length === 0) {
      alert("Veuillez ajouter au moins une prestation avec un tarif renseigné.");
      return;
    }

    // Convert batch rows to prestation format with monthly mensuel data
    const prestationsToAdd = validRows.map(row => {
      const tarif = Number(row.tarif) || 0;
      let totalQty = 0;
      const mensuel = {};
      MONTH_NAMES.forEach(m => {
        const qty = Number(row.monthlyQty?.[m.key] || 0);
        totalQty += qty;
        mensuel[m.key] = { quantite: qty, previsionnel: tarif * qty, reel: 0 };
      });
      return {
        annee: row.annee,
        type: row.type,
        specialite: row.specialite,
        professionnel: row.professionnel,
        tarif,
        quantite: totalQty,
        notes: row.notes || '',
        mensuel
      };
    });

    addPrestations(batchTargetUsagerId, prestationsToAdd);
    setShowBatchModal(false);
    setExpandedUsager(batchTargetUsagerId);
  };

  // --- HANDLERS FOR SINGLE EDIT PRESTATION ---
  const handleSaveSingleEdit = (e) => {
    e.preventDefault();
    if (!editingPrestation) return;
    const { usagerId, prestation } = editingPrestation;
    updatePrestation(usagerId, prestation.id, {
      annee: Number(prestation.annee) || 2026,
      type: prestation.type,
      specialite: prestation.specialite,
      professionnel: prestation.professionnel,
      tarif: Number(prestation.tarif) || 0,
      quantite: Number(prestation.quantite) || 0,
      notes: prestation.notes || ''
    });
    setEditingPrestation(null);
  };

  // Grand total from all batch rows
  const batchGrandTotal = batchRows.reduce((acc, row) => acc + getBatchRowTotal(row), 0);

  // Monthly column totals for batch footer
  const batchMonthTotals = {};
  MONTH_NAMES.forEach(m => {
    batchMonthTotals[m.key] = batchRows.reduce((acc, row) => acc + getBatchRowMonthTotal(row, m.key), 0);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1>Usagers &amp; Accompagnements</h1>
            <span style={{ fontSize: '1.4rem' }}>👥</span>
          </div>
          <p className="text-muted" style={{ marginTop: '0.25rem' }}>
            Simulations détaillées et gestion des prestations par bénéficiaire
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input 
              type="text" 
              placeholder="Rechercher un usager..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{ paddingLeft: '2.4rem', width: '220px' }}
            />
          </div>

          {/* Quick Add Prestations at once for any chosen user */}
          <button 
            onClick={() => openBatchModal(null)}
            className="btn btn-pink"
            title="Saisir des prestations à la volée en choisissant un usager dans une liste"
          >
            <Zap size={18} />
            <span>Saisie à la volée (Choix usager)</span>
          </button>

          <button 
            onClick={() => setShowAddUsagerModal(true)}
            className="btn btn-primary"
          >
            <UserPlus size={18} />
            <span>Nouvel Usager</span>
          </button>
        </div>
      </div>

      {/* Usagers List (Accordion style) */}
      <div className="flex flex-col gap-4">
        {filteredUsagers.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p className="text-muted">Aucun usager ne correspond à votre recherche.</p>
          </div>
        ) : (
          filteredUsagers.map(usager => {
            const coutPrev = (usager.prestations || []).reduce((acc, p) => acc + Number(p.coutAnnuel || 0), 0);
            const coutReel = (usager.prestations || []).reduce((acc, p) => acc + Number(p.coutReel || 0), 0);
            const percentOfBudget = globalBudget > 0 ? ((coutPrev / globalBudget) * 100) : 0;
            const isExpanded = expandedUsager === usager.id;

            return (
              <div key={usager.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                
                {/* Accordion Header */}
                <div 
                  className="flex justify-between items-center flex-wrap gap-4"
                  style={{ 
                    padding: '1.25rem 1.75rem', 
                    cursor: 'pointer', 
                    background: isExpanded ? '#F8FAFC' : 'white',
                    borderBottom: isExpanded ? '1px solid hsl(var(--color-border))' : 'none',
                    transition: 'background 0.15s ease'
                  }}
                  onClick={() => toggleUsager(usager.id)}
                >
                  <div className="flex items-center gap-3">
                    <div style={{ 
                      width: '46px', height: '46px', borderRadius: '12px', 
                      background: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)', 
                      color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '1.2rem'
                    }}>
                      {usager.nom.charAt(0)}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{usager.nom}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted" style={{ marginTop: '0.2rem' }}>
                        <span>{usager.prestations?.length || 0} prestation(s)</span>
                        <span>•</span>
                        <span className={`badge ${usager.actif ? 'badge-green' : 'badge-red'}`}>
                          {usager.actif ? '🟢 Actif' : '🔴 En attente / Clôturé'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics & Controls */}
                  <div className="flex items-center gap-8 flex-wrap" onClick={(e) => e.stopPropagation()}>
                    
                    {/* % of Global Budget Metric */}
                    <div style={{ textAlign: 'right', minWidth: '130px' }}>
                      <div className="text-xs text-muted font-semibold">% BUDGET GLOBAL</div>
                      <div className="flex items-center justify-end gap-1">
                        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0098D8' }}>
                          {percentOfBudget.toFixed(1)}%
                        </span>
                        <span className="text-xs text-muted">du service</span>
                      </div>
                      <div className="progress-bar-container" style={{ width: '120px', marginTop: '4px' }}>
                        <div 
                          className="progress-bar-fill" 
                          style={{ 
                            width: `${Math.min(percentOfBudget * 5, 100)}%`,
                            background: percentOfBudget > 10 ? '#E83D84' : '#0098D8'
                          }} 
                        />
                      </div>
                    </div>

                    {/* Forecast cost */}
                    <div style={{ textAlign: 'right', minWidth: '120px' }}>
                      <div className="text-xs text-muted font-semibold">PRÉVISIONNEL</div>
                      <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'hsl(var(--color-text-main))' }}>
                        {formatCurrency(coutPrev)}
                      </div>
                    </div>

                    {/* Real cost */}
                    <div style={{ textAlign: 'right', minWidth: '110px' }}>
                      <div className="text-xs text-muted font-semibold">RÉEL FACTURÉ</div>
                      <div style={{ fontWeight: 800, fontSize: '1.15rem', color: coutReel > 0 ? '#E83D84' : 'hsl(var(--color-text-muted))' }}>
                        {formatCurrency(coutReel)}
                      </div>
                    </div>

                    {/* Usager Actions */}
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleDeleteUsager(usager.id, usager.nom)} 
                        className="btn-icon btn-icon-danger"
                        title="Supprimer l'usager"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button 
                        onClick={() => toggleUsager(usager.id)} 
                        className="btn-icon"
                      >
                        {isExpanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Accordion Body: Prestations Table */}
                {isExpanded && (
                  <div style={{ padding: '1.5rem 1.75rem', background: '#FFFFFF' }}>
                    
                    <div className="flex justify-between items-center" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1rem', margin: 0 }}>Accompagnements et interventions planifiées</h4>
                        <p className="text-muted text-xs">Détail des séances, bilans et réunions d'équipe</p>
                      </div>

                      {/* Multi-add Prestations Button for this specific usager */}
                      <button 
                        onClick={() => openBatchModal(usager)}
                        className="btn btn-primary btn-sm"
                      >
                        <Plus size={16} />
                        <span>Ajouter des prestations pour {usager.nom}</span>
                      </button>
                    </div>

                    {(!usager.prestations || usager.prestations.length === 0) ? (
                      <div style={{ textAlign: 'center', padding: '2rem', background: '#F8FAFC', borderRadius: '12px' }}>
                        <p className="text-muted text-sm">Aucune prestation n'est encore enregistrée pour {usager.nom}.</p>
                        <button 
                          onClick={() => openBatchModal(usager)} 
                          className="btn btn-secondary btn-sm" 
                          style={{ marginTop: '0.75rem' }}
                        >
                          <Plus size={16} />
                          <span>Ajouter le premier accompagnement</span>
                        </button>
                      </div>
                    ) : (
                      <div className="table-wrapper">
                        <table>
                          <thead>
                            <tr>
                              <th>Année</th>
                              <th>Type</th>
                              <th>Spécialité</th>
                              <th>Professionnel</th>
                              <th>Commentaires / Notes</th>
                              <th style={{ textAlign: 'right' }}>Tarif Unit.</th>
                              <th style={{ textAlign: 'center' }}>Qté Annuelle</th>
                              <th style={{ textAlign: 'right' }}>Coût Prév.</th>
                              <th style={{ textAlign: 'right' }}>Coût Réel</th>
                              <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {usager.prestations.map(p => {
                              const theme = getSpecialiteTheme(p.specialite);
                              const typeEmoji = getTypeEmoji(p.type);

                              return (
                                <tr key={p.id}>
                                  <td>
                                    <span className="badge badge-gray font-bold">
                                      {p.annee || 2026}
                                    </span>
                                  </td>
                                  <td>
                                    <span className="badge badge-blue">
                                      <span>{typeEmoji}</span>
                                      <span>{p.type}</span>
                                    </span>
                                  </td>
                                  <td>
                                    <span 
                                      className="badge" 
                                      style={{ 
                                        background: theme.bg, 
                                        color: theme.color, 
                                        border: `1px solid ${theme.border}` 
                                      }}
                                    >
                                      <span>{theme.emoji}</span>
                                      <span>{p.specialite}</span>
                                    </span>
                                  </td>
                                  <td className="font-semibold" style={{ color: 'hsl(var(--color-text-main))' }}>
                                    {p.professionnel || 'Non assigné'}
                                  </td>
                                  <td style={{ maxWidth: '220px' }}>
                                    {p.notes ? (
                                      <div className="flex items-center gap-1 text-xs" style={{ color: '#475569' }}>
                                        <MessageSquare size={14} color="#0098D8" style={{ flexShrink: 0 }} />
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.notes}>
                                          {p.notes}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-muted text-xs italic">Aucune note</span>
                                    )}
                                  </td>
                                  <td style={{ textAlign: 'right' }} className="font-semibold">
                                    {formatCurrency(p.tarif)}
                                  </td>
                                  <td style={{ textAlign: 'center' }} className="font-bold">
                                    {p.quantite}
                                  </td>
                                  <td style={{ textAlign: 'right' }} className="font-bold">
                                    {formatCurrency(p.coutAnnuel)}
                                  </td>
                                  <td style={{ textAlign: 'right', fontWeight: 700, color: p.coutReel > 0 ? '#E83D84' : '#64748B' }}>
                                    {formatCurrency(p.coutReel || 0)}
                                  </td>
                                  <td>
                                    <div className="flex items-center justify-center gap-1">
                                      <button 
                                        onClick={() => setMonthlyModalData({ usagerId: usager.id, prestation: p })}
                                        className="btn-icon"
                                        title="Saisie mensuelle prévisionnel & réel"
                                        style={{ color: '#0098D8' }}
                                      >
                                        <Calendar size={17} />
                                      </button>
                                      <button 
                                        onClick={() => setEditingPrestation({ usagerId: usager.id, prestation: { ...p } })}
                                        className="btn-icon"
                                        title="Modifier la prestation"
                                      >
                                        <Edit2 size={16} />
                                      </button>
                                      <button 
                                        onClick={() => deletePrestation(usager.id, p.id)}
                                        className="btn-icon btn-icon-danger"
                                        title="Supprimer la prestation"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* --- MODAL 1: ADD USAGER --- */}
      {showAddUsagerModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Ajouter un Usager</h3>
              <button onClick={() => setShowAddUsagerModal(false)} className="btn-icon">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateUsager}>
              <div className="modal-body">
                <label className="text-sm font-semibold" style={{ marginBottom: '0.5rem', display: 'block' }}>
                  Nom complet de l'usager :
                </label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="ex: DUPONT Lucas"
                  value={newUsagerName}
                  onChange={(e) => setNewUsagerName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddUsagerModal(false)} className="btn btn-outline">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Créer le dossier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: BATCH ADD PRESTATIONS — quantités par mois --- */}
      {showBatchModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ width: '100vw', maxWidth: '100vw', height: '100vh', maxHeight: '100vh', borderRadius: 0 }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Saisie groupée de prestations</h3>
                <p className="text-muted text-xs" style={{ marginTop: '0.2rem' }}>
                  Renseignez les quantités mois par mois — le prévisionnel mensuel est calculé automatiquement (quantité × tarif)
                </p>
              </div>
              <button onClick={() => setShowBatchModal(false)} className="btn-icon">
                <X size={22} />
              </button>
            </div>

            <div className="modal-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem 1.25rem' }}>
              {/* User Selector */}
              <div style={{ padding: '0.9rem 1.25rem', background: '#F0F9FF', borderRadius: '12px', border: '1px solid #BAE6FD', marginBottom: '1rem' }} className="flex items-center gap-4 flex-wrap">
                <div style={{ minWidth: '320px' }}>
                  <label className="text-xs font-bold" style={{ color: '#0369A1', display: 'block', marginBottom: '0.35rem' }}>
                    SÉLECTIONNER L'USAGER BÉNÉFICIAIRE :
                  </label>
                  <select 
                    className="input"
                    style={{ fontWeight: 700, fontSize: '0.95rem' }}
                    value={batchTargetUsagerId}
                    onChange={(e) => setBatchTargetUsagerId(e.target.value)}
                  >
                    {usagers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.nom} ({u.prestations?.length || 0} prestations existantes)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 text-xs text-muted">
                  Grille vide — saisissez les quantités mois par mois pour chaque prestation. Le montant prévisionnel se calcule automatiquement.
                </div>

                <button onClick={addBatchRow} className="btn btn-primary btn-sm">
                  <Plus size={16} />
                  <span>+ Ajouter une ligne</span>
                </button>
              </div>

              {batchRows.length === 0 ? (
                <div style={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  padding: '4rem 2rem', 
                  background: '#F8FAFC', 
                  borderRadius: '12px', 
                  border: '2px dashed #CBD5E1' 
                }}>
                  <p className="text-muted" style={{ fontSize: '1.05rem', marginBottom: '1.25rem' }}>
                    La grille de saisie est actuellement vide.
                  </p>
                  <button onClick={addBatchRow} className="btn btn-primary" style={{ padding: '0.75rem 1.75rem', fontSize: '1rem' }}>
                    <Plus size={20} />
                    <span>+ Ajouter une première prestation</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="table-wrapper" style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}>
                    <table style={{ width: '100%', tableLayout: 'auto', borderCollapse: 'collapse' }}>
                      <colgroup>
                        {/* Fixed info cols */}
                        <col style={{ minWidth: '80px' }} />   {/* Année */}
                        <col style={{ minWidth: '130px' }} />  {/* Type */}
                        <col style={{ minWidth: '150px' }} />  {/* Spécialité */}
                        <col style={{ minWidth: '160px' }} />  {/* Professionnel */}
                        <col style={{ minWidth: '80px' }} />   {/* Tarif */}
                        <col style={{ minWidth: '60px' }} />   {/* Qté Totale */}
                        {/* 12 month qty cols */}
                        {MONTH_NAMES.map(m => (
                          <col key={m.key} style={{ minWidth: '60px' }} />
                        ))}
                        <col style={{ minWidth: '90px' }} />  {/* Total */}
                        <col style={{ minWidth: '130px' }} /> {/* Notes */}
                        <col style={{ minWidth: '40px' }} />  {/* Del */}
                      </colgroup>
                      <thead>
                        <tr>
                          <th rowSpan={2} style={{ verticalAlign: 'middle' }}>Année</th>
                          <th rowSpan={2} style={{ verticalAlign: 'middle' }}>Type</th>
                          <th rowSpan={2} style={{ verticalAlign: 'middle' }}>Spécialité</th>
                          <th rowSpan={2} style={{ verticalAlign: 'middle' }}>Professionnel</th>
                          <th rowSpan={2} style={{ textAlign: 'right', verticalAlign: 'middle' }}>Tarif (€)</th>
                          <th rowSpan={2} style={{ textAlign: 'center', verticalAlign: 'middle' }}>Qté Totale</th>
                          <th 
                            colSpan={12} 
                            style={{ 
                              textAlign: 'center', 
                              background: '#EFF6FF', 
                              color: '#1D4ED8', 
                              fontWeight: 800, 
                              borderBottom: '1px solid #BFDBFE',
                              padding: '0.4rem'
                            }}
                          >
                            Quantités par mois (séances)
                          </th>
                          <th rowSpan={2} style={{ textAlign: 'right', verticalAlign: 'middle', background: '#F0FDF4', color: '#15803D' }}>Total (€)</th>
                          <th rowSpan={2} style={{ verticalAlign: 'middle' }}>Notes</th>
                          <th rowSpan={2} style={{ textAlign: 'center', verticalAlign: 'middle' }}></th>
                        </tr>
                        <tr>
                          {MONTH_NAMES.map(m => (
                            <th key={m.key} style={{ 
                              textAlign: 'center', 
                              fontSize: '0.7rem', 
                              padding: '0.3rem 0.25rem',
                              background: '#F8FAFF',
                              color: '#3B82F6',
                              fontWeight: 700,
                              borderRight: '1px solid #E2E8F0'
                            }}>
                              {m.short}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {batchRows.map((row, index) => {
                          const lineTotal = getBatchRowTotal(row);
                          const rowTotalQty = MONTH_NAMES.reduce((acc, m) => acc + (Number(row.monthlyQty?.[m.key]) || 0), 0);

                          return (
                            <tr key={index}>
                              <td style={{ verticalAlign: 'middle' }}>
                                <select 
                                  className="input"
                                  style={{ padding: '0.45rem 0.4rem', fontWeight: 600, fontSize: '0.85rem' }}
                                  value={row.annee || 2026}
                                  onChange={(e) => updateBatchRow(index, 'annee', e.target.value)}
                                >
                                  <option value="2025">2025</option>
                                  <option value="2026">2026</option>
                                  <option value="2027">2027</option>
                                </select>
                              </td>
                              <td style={{ verticalAlign: 'middle' }}>
                                <select 
                                  className="input"
                                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.4rem' }}
                                  value={row.type}
                                  onChange={(e) => updateBatchRow(index, 'type', e.target.value)}
                                >
                                  {picklists.types.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                  ))}
                                </select>
                              </td>
                              <td style={{ verticalAlign: 'middle' }}>
                                <select 
                                  className="input"
                                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.4rem' }}
                                  value={row.specialite}
                                  onChange={(e) => updateBatchRow(index, 'specialite', e.target.value)}
                                >
                                  {picklists.specialites.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                              </td>
                              <td style={{ verticalAlign: 'middle' }}>
                                <select 
                                  className="input"
                                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.4rem' }}
                                  value={row.professionnel}
                                  onChange={(e) => updateBatchRow(index, 'professionnel', e.target.value)}
                                >
                                  <option value="">-- Choisir --</option>
                                  {picklists.professionnels.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                  ))}
                                </select>
                              </td>
                              <td style={{ verticalAlign: 'middle' }}>
                                <input 
                                  type="number"
                                  className="input"
                                  min="0"
                                  step="0.5"
                                  placeholder="0 €"
                                  style={{ textAlign: 'right', width: '75px', padding: '0.45rem 0.4rem', fontSize: '0.85rem' }}
                                  value={row.tarif}
                                  onChange={(e) => updateBatchRow(index, 'tarif', e.target.value)}
                                />
                              </td>
                              <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                                <input
                                  type="number"
                                  className="input"
                                  min="0"
                                  step="1"
                                  placeholder="0"
                                  style={{
                                    width: '60px',
                                    padding: '0.45rem 0.25rem',
                                    textAlign: 'center',
                                    fontSize: '0.85rem',
                                    fontWeight: 'bold',
                                    color: '#1D4ED8',
                                    border: '1px solid #BFDBFE',
                                    background: '#EFF6FF'
                                  }}
                                  value={row.quantiteTotale}
                                  onChange={(e) => updateBatchRow(index, 'quantiteTotale', e.target.value)}
                                />
                              </td>

                              {/* 12 Month Qty Inputs */}
                              {MONTH_NAMES.map(m => {
                                const monthPrev = getBatchRowMonthTotal(row, m.key);
                                return (
                                  <td key={m.key} style={{ verticalAlign: 'middle', textAlign: 'center', borderRight: '1px solid #F1F5F9', padding: '0.3rem 0.2rem' }}>
                                    <input
                                      type="number"
                                      min="0"
                                      step="1"
                                      placeholder=""
                                      style={{
                                        width: '52px',
                                        padding: '0.35rem 0.25rem',
                                        textAlign: 'center',
                                        fontSize: '0.85rem',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '6px',
                                        background: Number(row.monthlyQty?.[m.key] || 0) > 0 ? '#EFF6FF' : 'white',
                                        fontWeight: Number(row.monthlyQty?.[m.key] || 0) > 0 ? 700 : 400,
                                        color: Number(row.monthlyQty?.[m.key] || 0) > 0 ? '#1D4ED8' : '#94A3B8'
                                      }}
                                      value={row.monthlyQty?.[m.key] ?? ''}
                                      onChange={(e) => updateBatchMonthQty(index, m.key, e.target.value)}
                                      title={monthPrev > 0 ? `${formatCurrency(monthPrev)} prév.` : ''}
                                    />
                                  </td>
                                );
                              })}

                              {/* Total */}
                              <td style={{ textAlign: 'right', fontWeight: 700, color: lineTotal > 0 ? '#15803D' : '#94A3B8', verticalAlign: 'middle', background: lineTotal > 0 ? '#F0FDF4' : 'transparent' }}>
                                {lineTotal > 0 ? formatCurrency(lineTotal) : '—'}
                              </td>

                              {/* Notes */}
                              <td style={{ verticalAlign: 'middle' }}>
                                <input 
                                  type="text"
                                  className="input"
                                  placeholder="Notes..."
                                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.4rem' }}
                                  value={row.notes}
                                  onChange={(e) => updateBatchRow(index, 'notes', e.target.value)}
                                />
                              </td>
                              <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                <button 
                                  onClick={() => removeBatchRow(index)}
                                  className="btn-icon btn-icon-danger"
                                  title="Supprimer cette ligne"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      {/* Footer row with monthly totals */}
                      {batchRows.length > 0 && (
                        <tfoot>
                          <tr style={{ background: '#F8FAFC', borderTop: '2px solid #E2E8F0' }}>
                            <td colSpan={5} style={{ fontWeight: 800, fontSize: '0.8rem', padding: '0.5rem 0.75rem', textTransform: 'uppercase', letterSpacing: '0.03em', color: '#475569' }}>
                              Total prévisionnel / mois
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.8rem', padding: '0.5rem 0.2rem' }}>
                              {/* Optionnel: somme de toutes les quantités de tous les mois de toutes les lignes */}
                              {MONTH_NAMES.reduce((acc, m) => {
                                let mSum = 0;
                                batchRows.forEach(r => mSum += (Number(r.monthlyQty?.[m.key]) || 0));
                                return acc + mSum;
                              }, 0) || '—'}
                            </td>
                            {MONTH_NAMES.map(m => (
                              <td key={m.key} style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.75rem', color: batchMonthTotals[m.key] > 0 ? '#15803D' : '#CBD5E1', borderRight: '1px solid #E2E8F0', padding: '0.5rem 0.2rem' }}>
                                {batchMonthTotals[m.key] > 0 ? formatCurrency(batchMonthTotals[m.key]) : '—'}
                              </td>
                            ))}
                            <td style={{ textAlign: 'right', fontWeight: 900, fontSize: '0.9rem', color: '#15803D', background: '#DCFCE7', padding: '0.5rem 0.75rem' }}>
                              {formatCurrency(batchGrandTotal)}
                            </td>
                            <td colSpan={2}></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </>
              )}

            </div>

            <div className="modal-footer">
              <button onClick={() => setShowBatchModal(false)} className="btn btn-outline">
                Annuler
              </button>
              {batchRows.length > 0 && (
                <button onClick={addBatchRow} className="btn btn-secondary">
                  <Plus size={16} />
                  <span>+ Ajouter une autre ligne</span>
                </button>
              )}
              <button onClick={handleSaveBatch} className="btn btn-primary" disabled={batchRows.length === 0}>
                <Check size={18} />
                <span>Enregistrer toutes les prestations ({batchRows.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: SINGLE EDIT PRESTATION --- */}
      {editingPrestation && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Modifier la prestation</h3>
              <button onClick={() => setEditingPrestation(null)} className="btn-icon">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSingleEdit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                  <div>
                    <label className="text-xs font-bold text-muted">ANNÉE</label>
                    <select 
                      className="input"
                      value={editingPrestation.prestation.annee || 2026}
                      onChange={(e) => setEditingPrestation({
                        ...editingPrestation,
                        prestation: { ...editingPrestation.prestation, annee: e.target.value }
                      })}
                    >
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted">TYPE DE PRESTATION</label>
                    <select 
                      className="input"
                      value={editingPrestation.prestation.type}
                      onChange={(e) => setEditingPrestation({
                        ...editingPrestation,
                        prestation: { ...editingPrestation.prestation, type: e.target.value }
                      })}
                    >
                      {picklists.types.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted">SPÉCIALITÉ</label>
                  <select 
                    className="input"
                    value={editingPrestation.prestation.specialite}
                    onChange={(e) => setEditingPrestation({
                      ...editingPrestation,
                      prestation: { ...editingPrestation.prestation, specialite: e.target.value }
                    })}
                  >
                    {picklists.specialites.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted">PROFESSIONNEL</label>
                  <select 
                    className="input"
                    value={editingPrestation.prestation.professionnel}
                    onChange={(e) => setEditingPrestation({
                      ...editingPrestation,
                      prestation: { ...editingPrestation.prestation, professionnel: e.target.value }
                    })}
                  >
                    {picklists.professionnels.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="text-xs font-bold text-muted">TARIF UNITAIRE (€)</label>
                    <input 
                      type="number"
                      step="0.5"
                      className="input"
                      value={editingPrestation.prestation.tarif}
                      onChange={(e) => setEditingPrestation({
                        ...editingPrestation,
                        prestation: { ...editingPrestation.prestation, tarif: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted">QUANTITÉ ANNUELLE</label>
                    <input 
                      type="number"
                      className="input"
                      value={editingPrestation.prestation.quantite}
                      onChange={(e) => setEditingPrestation({
                        ...editingPrestation,
                        prestation: { ...editingPrestation.prestation, quantite: e.target.value }
                      })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted">COMMENTAIRES / NOTES</label>
                  <textarea 
                    className="input" 
                    rows="3"
                    value={editingPrestation.prestation.notes || ''}
                    onChange={(e) => setEditingPrestation({
                      ...editingPrestation,
                      prestation: { ...editingPrestation.prestation, notes: e.target.value }
                    })}
                  />
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setEditingPrestation(null)} className="btn btn-outline">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Enregistrer modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: MONTH-BY-MONTH DETAILED FORECAST & REAL EDIT --- */}
      {monthlyModalData && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Saisie Mensuelle : Prévisionnel &amp; Réel</h3>
                <p className="text-muted text-xs">
                  {monthlyModalData.prestation.type} — {monthlyModalData.prestation.specialite} ({monthlyModalData.prestation.professionnel})
                </p>
              </div>
              <button onClick={() => setMonthlyModalData(null)} className="btn-icon">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>
                Ajustez pour chaque mois le montant <strong>Prévisionnel</strong> planifié et le montant <strong>Réel</strong> engagé ou facturé.
              </p>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Mois</th>
                      <th style={{ textAlign: 'center' }}>Quantité</th>
                      <th style={{ textAlign: 'right' }}>Prévisionnel (€)</th>
                      <th style={{ textAlign: 'right' }}>Réel Engagé (€)</th>
                      <th style={{ textAlign: 'right' }}>Écart (€)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MONTH_NAMES.map(m => {
                      const currentMonthData = monthlyModalData.prestation.mensuel?.[m.key] || { previsionnel: 0, reel: 0 };
                      const diff = (Number(currentMonthData.reel) || 0) - (Number(currentMonthData.previsionnel) || 0);
                      const isFavorable = diff <= 0;
                      const hasData = Number(currentMonthData.previsionnel) > 0 || Number(currentMonthData.reel) > 0;

                      return (
                        <tr key={m.key}>
                          <td className="font-semibold">{m.label}</td>
                          <td style={{ textAlign: 'center' }}>
                            <input 
                              type="number"
                              step="1"
                              min="0"
                              className="input"
                              style={{ width: '80px', textAlign: 'center', display: 'inline-block' }}
                              value={currentMonthData.quantite !== undefined ? currentMonthData.quantite : ''}
                              placeholder="0"
                              onChange={(e) => {
                                const qty = Number(e.target.value) || 0;
                                const tarif = Number(monthlyModalData.prestation.tarif) || 0;
                                const calculatedPrev = qty * tarif;
                                updatePrestationMonthly(
                                  monthlyModalData.usagerId,
                                  monthlyModalData.prestation.id,
                                  m.key,
                                  { quantite: qty, previsionnel: calculatedPrev }
                                );
                                const updatedMensuel = { ...monthlyModalData.prestation.mensuel };
                                updatedMensuel[m.key] = {
                                  ...(updatedMensuel[m.key] || {}),
                                  quantite: qty,
                                  previsionnel: calculatedPrev
                                };
                                setMonthlyModalData({
                                  ...monthlyModalData,
                                  prestation: { ...monthlyModalData.prestation, mensuel: updatedMensuel }
                                });
                              }}
                            />
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: '#64748B' }}>
                            {formatCurrency(currentMonthData.previsionnel || 0)}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <input 
                              type="number"
                              step="0.5"
                              className="input"
                              style={{ width: '130px', textAlign: 'right', display: 'inline-block', borderColor: currentMonthData.reel > 0 ? '#E83D84' : '' }}
                              value={currentMonthData.reel || ''}
                              placeholder="0"
                              onChange={(e) => {
                                updatePrestationMonthly(
                                  monthlyModalData.usagerId,
                                  monthlyModalData.prestation.id,
                                  m.key,
                                  { reel: Number(e.target.value) || 0 }
                                );
                                const updatedMensuel = { ...monthlyModalData.prestation.mensuel };
                                updatedMensuel[m.key] = {
                                  ...(updatedMensuel[m.key] || {}),
                                  reel: Number(e.target.value) || 0
                                };
                                setMonthlyModalData({
                                  ...monthlyModalData,
                                  prestation: { ...monthlyModalData.prestation, mensuel: updatedMensuel }
                                });
                              }}
                            />
                          </td>
                          <td style={{ 
                            textAlign: 'right', 
                            fontWeight: 700, 
                            fontSize: '0.95rem',
                            color: !hasData ? '#CBD5E1' : (diff === 0 ? '#64748B' : (isFavorable ? '#059669' : '#DC2626'))
                          }}>
                            {hasData ? formatEcart(diff) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setMonthlyModalData(null)} className="btn btn-primary">
                Terminer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
