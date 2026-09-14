import React, { useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { formatCurrency, getSpecialiteTheme } from '../utils/data';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { 
  Settings, Sliders, ListPlus, Users, Trash2, Plus, 
  Check, RefreshCw, AlertTriangle, ShieldCheck, Download,
  Search, UserPlus, X, FileSpreadsheet, FileText, Edit2
} from 'lucide-react';

export default function Admin() {
  const { 
    globalBudget, 
    updateGlobalBudget, 
    picklists, 
    addPicklistItem, 
    deletePicklistItem,
    usagers,
    addUsager,
    deleteUsager,
    updateUsager,
    totalPrevisionnel,
    totalReel,
    budgetRestant,
    resetToDefaultData
  } = useBudget();

  const [activeTab, setActiveTab] = useState('budget'); // 'budget' | 'picklists' | 'usagers' | 'donnees'

  // Picklist inputs
  const [newSpecialite, setNewSpecialite] = useState('');
  const [newPro, setNewPro] = useState('');
  const [newType, setNewType] = useState('');

  // Usager creation, edit & search in Admin
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUsagerName, setNewUsagerName] = useState('');
  const [editingUsager, setEditingUsager] = useState(null); // { id, nom, actif }
  const [usagerSearch, setUsagerSearch] = useState('');

  // Budget simulation input
  const [budgetInput, setBudgetInput] = useState(globalBudget);
  const [budgetFeedback, setBudgetFeedback] = useState(false);

  const handleUpdateBudget = (e) => {
    e.preventDefault();
    updateGlobalBudget(budgetInput);
    setBudgetFeedback(true);
    setTimeout(() => setBudgetFeedback(false), 2500);
  };

  const handleAddPick = (cat, val, setter) => {
    if (!val.trim()) return;
    addPicklistItem(cat, val.trim());
    setter('');
  };

  const handleCreateUsager = (e) => {
    e.preventDefault();
    if (!newUsagerName.trim()) return;
    addUsager(newUsagerName.trim());
    setNewUsagerName('');
    setShowCreateModal(false);
  };

  // Filter usagers in Admin
  const filteredUsagers = usagers.filter(u => 
    u.nom.toLowerCase().includes(usagerSearch.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1>Panneau d'Administration & Configuration</h1>
          <span style={{ fontSize: '1.4rem' }}>⚙️</span>
        </div>
        <p className="text-muted" style={{ marginTop: '0.25rem' }}>
          Paramétrez le budget global, les listes déroulantes (picklists) et le référentiel des usagers
        </p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          onClick={() => setActiveTab('budget')} 
          className={`tab-btn ${activeTab === 'budget' ? 'active' : ''}`}
        >
          <Sliders size={18} />
          <span>Simulation Budget Alloué</span>
        </button>

        <button 
          onClick={() => setActiveTab('picklists')} 
          className={`tab-btn ${activeTab === 'picklists' ? 'active' : ''}`}
        >
          <ListPlus size={18} />
          <span>Gestion des Picklists</span>
        </button>

        <button 
          onClick={() => setActiveTab('usagers')} 
          className={`tab-btn ${activeTab === 'usagers' ? 'active' : ''}`}
        >
          <Users size={18} />
          <span>Référentiel Usagers ({usagers.length})</span>
        </button>

        <button 
          onClick={() => setActiveTab('donnees')} 
          className={`tab-btn ${activeTab === 'donnees' ? 'active' : ''}`}
        >
          <RefreshCw size={18} />
          <span>Exports & Sauvegarde</span>
        </button>
      </div>

      {/* --- TAB 1: BUDGET SIMULATION --- */}
      {activeTab === 'budget' && (
        <div className="card" style={{ maxWidth: '650px' }}>
          <h3 className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
            <span>💰 Modification & Simulation du Budget Annuel</span>
          </h3>
          <p className="text-sm text-muted" style={{ marginBottom: '1.5rem' }}>
            Ajustez ici l'enveloppe globale allouée pour le PCPE. Tous les calculs de reste à engager et les pourcentages par usager s'actualiseront instantanément sur l'ensemble de l'outil.
          </p>

          <form onSubmit={handleUpdateBudget} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label className="text-sm font-semibold" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Montant total alloué au service (€) :
              </label>
              <input 
                type="number"
                step="500"
                className="input"
                style={{ fontSize: '1.2rem', fontWeight: 700, padding: '0.75rem 1rem' }}
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <button type="submit" className="btn btn-primary">
                <Check size={18} />
                <span>Enregistrer & Simuler</span>
              </button>

              {budgetFeedback && (
                <span className="badge badge-green">
                  Budget mis à jour avec succès !
                </span>
              )}
            </div>
          </form>

          {/* Quick Simulation Presets */}
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid hsl(var(--color-border))' }}>
            <span className="text-xs font-bold text-muted uppercase">Scénarios rapides de simulation :</span>
            <div className="flex gap-2 flex-wrap" style={{ marginTop: '0.75rem' }}>
              {[60000, 80000, 100000, 120000, 140000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setBudgetInput(amt);
                    updateGlobalBudget(amt);
                    setBudgetFeedback(true);
                    setTimeout(() => setBudgetFeedback(false), 2000);
                  }}
                  className="btn btn-outline btn-sm"
                >
                  {formatCurrency(amt)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: PICKLISTS MANAGEMENT --- */}
      {activeTab === 'picklists' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          
          {/* Picklist 1: Spécialités */}
          <div className="card">
            <h3 className="flex items-center gap-2" style={{ marginBottom: '0.5rem' }}>
              <span>🧠 Spécialités & Métiers</span>
            </h3>
            <p className="text-xs text-muted" style={{ marginBottom: '1.25rem' }}>
              Utilisées pour catégoriser les professionnels et les prestations
            </p>

            <div className="flex gap-2" style={{ marginBottom: '1.25rem' }}>
              <input 
                type="text"
                placeholder="Nouvelle spécialité..."
                className="input text-sm"
                value={newSpecialite}
                onChange={(e) => setNewSpecialite(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddPick('specialites', newSpecialite, setNewSpecialite)}
              />
              <button 
                onClick={() => handleAddPick('specialites', newSpecialite, setNewSpecialite)}
                className="btn btn-secondary btn-sm"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-2" style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {picklists.specialites.map(item => {
                const theme = getSpecialiteTheme(item);
                return (
                  <div 
                    key={item} 
                    className="flex justify-between items-center"
                    style={{ padding: '0.5rem 0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                  >
                    <span className="text-sm font-semibold flex items-center gap-2">
                      <span>{theme.emoji}</span>
                      <span>{item}</span>
                    </span>
                    <button 
                      onClick={() => deletePicklistItem('specialites', item)}
                      className="btn-icon btn-icon-danger"
                      title="Supprimer cette option"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Picklist 2: Professionnels */}
          <div className="card">
            <h3 className="flex items-center gap-2" style={{ marginBottom: '0.5rem' }}>
              <span>🩺 Professionnels Libéraux</span>
            </h3>
            <p className="text-xs text-muted" style={{ marginBottom: '1.25rem' }}>
              Intervenants extérieurs et praticiens conventionnés
            </p>

            <div className="flex gap-2" style={{ marginBottom: '1.25rem' }}>
              <input 
                type="text"
                placeholder="Nom du professionnel..."
                className="input text-sm"
                value={newPro}
                onChange={(e) => setNewPro(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddPick('professionnels', newPro, setNewPro)}
              />
              <button 
                onClick={() => handleAddPick('professionnels', newPro, setNewPro)}
                className="btn btn-secondary btn-sm"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-2" style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {picklists.professionnels.map(item => (
                <div 
                  key={item} 
                  className="flex justify-between items-center"
                  style={{ padding: '0.5rem 0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                >
                  <span className="text-sm font-semibold">{item}</span>
                  <button 
                    onClick={() => deletePicklistItem('professionnels', item)}
                    className="btn-icon btn-icon-danger"
                    title="Supprimer cette option"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Picklist 3: Types de prestation */}
          <div className="card">
            <h3 className="flex items-center gap-2" style={{ marginBottom: '0.5rem' }}>
              <span>📑 Types de Prestation</span>
            </h3>
            <p className="text-xs text-muted" style={{ marginBottom: '1.25rem' }}>
              Nature de l'intervention (Rendez-vous, bilan, réunion...)
            </p>

            <div className="flex gap-2" style={{ marginBottom: '1.25rem' }}>
              <input 
                type="text"
                placeholder="Nouveau type (ex: Atelier groupe)..."
                className="input text-sm"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddPick('types', newType, setNewType)}
              />
              <button 
                onClick={() => handleAddPick('types', newType, setNewType)}
                className="btn btn-secondary btn-sm"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-2" style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {picklists.types.map(item => (
                <div 
                  key={item} 
                  className="flex justify-between items-center"
                  style={{ padding: '0.5rem 0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                >
                  <span className="text-sm font-semibold">{item}</span>
                  <button 
                    onClick={() => deletePicklistItem('types', item)}
                    className="btn-icon btn-icon-danger"
                    title="Supprimer cette option"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* --- TAB 3: USAGERS REGISTRY WITH PROMINENT BUTTON & SEARCH --- */}
      {activeTab === 'usagers' && (
        <div className="card">
          <div className="flex justify-between items-center flex-wrap gap-4" style={{ marginBottom: '1.5rem' }}>
            <div>
              <h3 className="flex items-center gap-2">
                <span>👥 Référentiel des Bénéficiaires ({usagers.length})</span>
              </h3>
              <p className="text-muted text-xs">
                Gestion des dossiers d'usagers : statut, recherche et création
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Search input */}
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                <input 
                  type="text" 
                  placeholder="Rechercher un usager..."
                  className="input text-sm"
                  style={{ paddingLeft: '2.4rem', width: '240px' }}
                  value={usagerSearch}
                  onChange={(e) => setUsagerSearch(e.target.value)}
                />
              </div>

              {/* Prominent Create Usager Button */}
              <button 
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
              >
                <UserPlus size={18} />
                <span>Créer un usager</span>
              </button>
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nom de l'usager</th>
                  <th>Prestations rattachées</th>
                  <th>Budget Prévisionnel</th>
                  <th>Statut du dossier</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsagers.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
                      Aucun usager trouvé pour "{usagerSearch}".
                    </td>
                  </tr>
                ) : (
                  filteredUsagers.map(u => {
                    const total = (u.prestations || []).reduce((acc, p) => acc + Number(p.coutAnnuel || 0), 0);
                    return (
                      <tr key={u.id}>
                        <td className="font-semibold">
                          <div className="flex items-center gap-2">
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                              {u.nom.charAt(0)}
                            </div>
                            <span>{u.nom}</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-gray">
                            {u.prestations?.length || 0} accompagnement(s)
                          </span>
                        </td>
                        <td className="font-bold">
                          {formatCurrency(total)}
                        </td>
                        <td>
                          <button 
                            onClick={() => updateUsager(u.id, { actif: !u.actif })}
                            className={`badge ${u.actif ? 'badge-green' : 'badge-red'}`}
                            style={{ cursor: 'pointer', border: 'none' }}
                            title="Cliquez pour changer le statut"
                          >
                            {u.actif ? '🟢 Dossier Actif' : '🔴 En attente / Clôturé'}
                          </button>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              onClick={() => setEditingUsager({ id: u.id, nom: u.nom, actif: u.actif })}
                              className="btn-icon"
                              title="Modifier / renommer l'usager"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => {
                                if (window.confirm(`Supprimer définitivement l'usager "${u.nom}" ?`)) {
                                  deleteUsager(u.id);
                                }
                              }}
                              className="btn-icon btn-icon-danger"
                              title="Supprimer l'usager"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Creation Modal */}
          {showCreateModal && (
            <div className="modal-backdrop">
              <div className="modal-content" style={{ maxWidth: '480px' }}>
                <div className="modal-header">
                  <h3 style={{ margin: 0 }}>Créer un nouvel usager</h3>
                  <button onClick={() => setShowCreateModal(false)} className="btn-icon">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleCreateUsager}>
                  <div className="modal-body">
                    <label className="text-sm font-semibold" style={{ display: 'block', marginBottom: '0.5rem' }}>
                      Nom et prénom du bénéficiaire :
                    </label>
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="ex: MARTIN Thomas"
                      value={newUsagerName}
                      onChange={(e) => setNewUsagerName(e.target.value)}
                      autoFocus
                      required
                    />
                    <p className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>
                      Le dossier sera immédiatement créé et disponible dans toutes les listes pour planifier ses accompagnements.
                    </p>
                  </div>
                  <div className="modal-footer">
                    <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-outline">
                      Annuler
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Créer l'usager
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Usager Modal */}
          {editingUsager && (
            <div className="modal-backdrop">
              <div className="modal-content" style={{ maxWidth: '480px' }}>
                <div className="modal-header">
                  <h3 style={{ margin: 0 }}>Modifier l'usager</h3>
                  <button onClick={() => setEditingUsager(null)} className="btn-icon">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!editingUsager.nom.trim()) return;
                  updateUsager(editingUsager.id, { nom: editingUsager.nom.trim(), actif: editingUsager.actif });
                  setEditingUsager(null);
                }}>
                  <div className="modal-body">
                    <label className="text-sm font-semibold" style={{ display: 'block', marginBottom: '0.5rem' }}>
                      Nom et prénom du bénéficiaire :
                    </label>
                    <input 
                      type="text" 
                      className="input" 
                      value={editingUsager.nom}
                      onChange={(e) => setEditingUsager({ ...editingUsager, nom: e.target.value })}
                      autoFocus
                      required
                    />

                    <div style={{ marginTop: '1.25rem' }}>
                      <label className="text-sm font-semibold" style={{ display: 'block', marginBottom: '0.5rem' }}>
                        Statut du dossier :
                      </label>
                      <select 
                        className="input"
                        value={editingUsager.actif ? 'actif' : 'inactif'}
                        onChange={(e) => setEditingUsager({ ...editingUsager, actif: e.target.value === 'actif' })}
                      >
                        <option value="actif">🟢 Dossier Actif</option>
                        <option value="inactif">🔴 En attente / Clôturé</option>
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" onClick={() => setEditingUsager(null)} className="btn btn-outline">
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

        </div>
      )}

      {/* --- TAB 4: EXPORTS & RESTAURATION --- */}
      {activeTab === 'donnees' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          
          {/* Excel Export */}
          <div className="card">
            <h3 className="flex items-center gap-2" style={{ marginBottom: '0.75rem', color: '#047857' }}>
              <FileSpreadsheet size={22} />
              <span>Export Classeur Excel (.xlsx)</span>
            </h3>
            <p className="text-sm text-muted" style={{ marginBottom: '1.5rem' }}>
              Téléchargez un tableur Excel complet contenant 2 feuilles : Synthèse budgétaire globale et détail mensuel complet de toutes les prestations.
            </p>
            <button 
              onClick={() => exportToExcel({ usagers, globalBudget, totalPrevisionnel, totalReel, budgetRestant })}
              className="btn btn-primary"
              style={{ background: '#059669', borderColor: '#059669' }}
            >
              <Download size={18} />
              <span>Télécharger le fichier Excel</span>
            </button>
          </div>

          {/* PDF Export */}
          <div className="card">
            <h3 className="flex items-center gap-2" style={{ marginBottom: '0.75rem', color: '#DC2626' }}>
              <FileText size={22} />
              <span>Export Rapport PDF</span>
            </h3>
            <p className="text-sm text-muted" style={{ marginBottom: '1.5rem' }}>
              Générez un rapport exécutif imprimable au format PDF avec en-tête Chrysalide et tableau de bord par usager pour la Direction.
            </p>
            <button 
              onClick={() => exportToPDF({ usagers, globalBudget, totalPrevisionnel, totalReel, budgetRestant })}
              className="btn btn-pink"
            >
              <Download size={18} />
              <span>Générer le rapport PDF</span>
            </button>
          </div>

          {/* Reset to CSV Data */}
          <div className="card" style={{ border: '1.5px solid #FCA5A5', gridColumn: '1 / -1' }}>
            <h3 className="flex items-center gap-2" style={{ marginBottom: '0.75rem', color: '#DC2626' }}>
              <AlertTriangle size={20} />
              <span>Réinitialiser aux Données Initiales du CSV</span>
            </h3>
            <p className="text-sm text-muted" style={{ marginBottom: '1.5rem' }}>
              Cette action restaurera les 15 usagers et toutes les prestations d'origine issues de votre fichier de départ. Vos modifications locales seront réinitialisées.
            </p>
            <button 
              onClick={() => {
                if (window.confirm("Êtes-vous sûr(e) de vouloir restaurer les données d'origine du CSV ?")) {
                  resetToDefaultData();
                  alert("Données initiales restaurées !");
                }
              }}
              className="btn btn-danger"
            >
              <RefreshCw size={18} />
              <span>Restaurer les données d'origine</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
