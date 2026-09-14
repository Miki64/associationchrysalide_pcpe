import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialUsagers, initialBudget, initialPicklists, MONTH_NAMES } from '../utils/data';

const BudgetContext = createContext();

export function BudgetProvider({ children }) {
  const [usagers, setUsagers] = useState(() => {
    try {
      const saved = localStorage.getItem('pcpe_v2_usagers');
      return saved ? JSON.parse(saved) : initialUsagers;
    } catch {
      return initialUsagers;
    }
  });

  const [globalBudget, setGlobalBudget] = useState(() => {
    try {
      const saved = localStorage.getItem('pcpe_v2_budget');
      return saved ? Number(JSON.parse(saved)) : initialBudget;
    } catch {
      return initialBudget;
    }
  });

  const [picklists, setPicklists] = useState(() => {
    try {
      const saved = localStorage.getItem('pcpe_v2_picklists');
      return saved ? JSON.parse(saved) : initialPicklists;
    } catch {
      return initialPicklists;
    }
  });

  useEffect(() => {
    localStorage.setItem('pcpe_v2_usagers', JSON.stringify(usagers));
  }, [usagers]);

  useEffect(() => {
    localStorage.setItem('pcpe_v2_budget', JSON.stringify(globalBudget));
  }, [globalBudget]);

  useEffect(() => {
    localStorage.setItem('pcpe_v2_picklists', JSON.stringify(picklists));
  }, [picklists]);

  // Recalculate monthly forecast & real totals per prestation
  const computePrestationTotals = (p) => {
    let prevSum = 0;
    let reelSum = 0;
    if (p.mensuel) {
      MONTH_NAMES.forEach(m => {
        const monthData = p.mensuel[m.key] || { previsionnel: 0, reel: 0 };
        prevSum += Number(monthData.previsionnel || 0);
        reelSum += Number(monthData.reel || 0);
      });
    }
    return {
      coutAnnuel: prevSum,
      coutReel: reelSum
    };
  };

  // KPIs — always computed from monthly data (single source of truth)
  const totalPrevisionnel = usagers.reduce((acc, u) => {
    if (!u.actif && u.actif !== undefined) return acc;
    return acc + (u.prestations || []).reduce((pAcc, p) => {
      const { coutAnnuel } = computePrestationTotals(p);
      return pAcc + coutAnnuel;
    }, 0);
  }, 0);

  const totalReel = usagers.reduce((acc, u) => {
    if (!u.actif && u.actif !== undefined) return acc;
    return acc + (u.prestations || []).reduce((pAcc, p) => {
      const { coutReel } = computePrestationTotals(p);
      return pAcc + coutReel;
    }, 0);
  }, 0);

  const budgetRestant = globalBudget - totalPrevisionnel;
  const budgetRestantReel = globalBudget - totalReel;
  const tauxEngagementPrevisionnel = globalBudget > 0 ? (totalPrevisionnel / globalBudget) * 100 : 0;
  const tauxConsommationReel = globalBudget > 0 ? (totalReel / globalBudget) * 100 : 0;

  // Actions
  const updateGlobalBudget = (amount) => {
    setGlobalBudget(Math.max(0, Number(amount) || 0));
  };

  const addUsager = (nom) => {
    if (!nom.trim()) return;
    const newUsager = {
      id: `u_${Date.now()}`,
      nom: nom.trim(),
      actif: true,
      prestations: []
    };
    setUsagers(prev => [newUsager, ...prev]);
  };

  const updateUsager = (id, fields) => {
    setUsagers(prev => prev.map(u => u.id === id ? { ...u, ...fields } : u));
  };

  const deleteUsager = (id) => {
    setUsagers(prev => prev.filter(u => u.id !== id));
  };

  const addPrestations = (usagerId, newPrestationsList) => {
    setUsagers(prev => prev.map(u => {
      if (u.id !== usagerId) return u;
      const formatted = newPrestationsList.map((p, idx) => {
        const tarif = Number(p.tarif) || 0;
        const quantite = Number(p.quantite) || 0;
        const annee = Number(p.annee) || 2026;

        // Use mensuel if explicitly provided by caller (batch with monthly qty)
        // Otherwise initialize all months to 0 (no auto-smoothing)
        const mensuel = p.mensuel || {};
        MONTH_NAMES.forEach(m => {
          if (!mensuel[m.key]) {
            mensuel[m.key] = { previsionnel: 0, reel: 0 };
          }
        });

        // coutAnnuel = sum of monthly previsionnel (from batch qty × tarif)
        let prevSum = 0;
        MONTH_NAMES.forEach(m => {
          prevSum += Number(mensuel[m.key]?.previsionnel || 0);
        });
        const coutAnnuel = prevSum > 0 ? prevSum : tarif * quantite;

        return {
          id: `p_${Date.now()}_${idx}`,
          annee,
          type: p.type || '',
          specialite: p.specialite || '',
          professionnel: p.professionnel || '',
          tarif,
          quantite,
          coutAnnuel,
          coutReel: Number(p.coutReel) || 0,
          notes: p.notes || '',
          mensuel
        };
      });
      return {
        ...u,
        prestations: [...(u.prestations || []), ...formatted]
      };
    }));
  };

  const updatePrestation = (usagerId, prestationId, fields) => {
    setUsagers(prev => prev.map(u => {
      if (u.id !== usagerId) return u;
      return {
        ...u,
        prestations: u.prestations.map(p => {
          if (p.id !== prestationId) return p;
          const merged = { ...p, ...fields };
          // If tarif or quantite changed and no specific mensuel override
          if (fields.tarif !== undefined || fields.quantite !== undefined) {
            merged.coutAnnuel = Number(merged.tarif || 0) * Number(merged.quantite || 0);
          }
          return merged;
        })
      };
    }));
  };

  const deletePrestation = (usagerId, prestationId) => {
    setUsagers(prev => prev.map(u => {
      if (u.id !== usagerId) return u;
      return {
        ...u,
        prestations: u.prestations.filter(p => p.id !== prestationId)
      };
    }));
  };

  // updates is an object like { quantite: 3, previsionnel: 150 } or { reel: 200 }
  const updatePrestationMonthly = (usagerId, prestationId, monthKey, updates) => {
    setUsagers(prev => prev.map(u => {
      if (u.id !== usagerId) return u;
      return {
        ...u,
        prestations: u.prestations.map(p => {
          if (p.id !== prestationId) return p;
          const newMensuel = { ...(p.mensuel || {}) };
          if (!newMensuel[monthKey]) {
            newMensuel[monthKey] = { previsionnel: 0, reel: 0, quantite: 0 };
          }
          newMensuel[monthKey] = { ...newMensuel[monthKey], ...updates };
          const { coutAnnuel, coutReel } = computePrestationTotals({ ...p, mensuel: newMensuel });
          // Recompute total quantite from all months
          let totalQty = 0;
          MONTH_NAMES.forEach(m => {
            totalQty += Number(newMensuel[m.key]?.quantite || 0);
          });
          return {
            ...p,
            mensuel: newMensuel,
            coutAnnuel,
            coutReel,
            quantite: totalQty
          };
        })
      };
    }));
  };

  // Picklists management
  const addPicklistItem = (category, value) => {
    if (!value || !value.trim()) return;
    const cleanVal = value.trim();
    setPicklists(prev => {
      const current = prev[category] || [];
      if (current.includes(cleanVal)) return prev;
      return {
        ...prev,
        [category]: [...current, cleanVal].sort((a, b) => a.localeCompare(b, 'fr'))
      };
    });
  };

  const deletePicklistItem = (category, value) => {
    setPicklists(prev => ({
      ...prev,
      [category]: (prev[category] || []).filter(item => item !== value)
    }));
  };

  const resetToDefaultData = () => {
    setUsagers(initialUsagers);
    setGlobalBudget(initialBudget);
    setPicklists(initialPicklists);
    localStorage.removeItem('pcpe_v2_usagers');
    localStorage.removeItem('pcpe_v2_budget');
    localStorage.removeItem('pcpe_v2_picklists');
  };

  return (
    <BudgetContext.Provider value={{
      usagers,
      setUsagers,
      globalBudget,
      updateGlobalBudget,
      picklists,
      addPicklistItem,
      deletePicklistItem,
      totalPrevisionnel,
      totalReel,
      budgetRestant,
      budgetRestantReel,
      tauxEngagementPrevisionnel,
      tauxConsommationReel,
      addUsager,
      updateUsager,
      deleteUsager,
      addPrestations,
      updatePrestation,
      deletePrestation,
      updatePrestationMonthly,
      resetToDefaultData
    }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  return useContext(BudgetContext);
}
