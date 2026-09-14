import initialData from './initialData.json';

export const initialBudget = initialData.initialBudget;
export const initialPicklists = initialData.initialPicklists;
export const initialUsagers = initialData.initialUsagers;

export const MONTH_NAMES = [
  { key: 'janvier', label: 'Janvier', short: 'Jan' },
  { key: 'février', label: 'Février', short: 'Fév' },
  { key: 'mars', label: 'Mars', short: 'Mar' },
  { key: 'avril', label: 'Avril', short: 'Avr' },
  { key: 'mai', label: 'Mai', short: 'Mai' },
  { key: 'juin', label: 'Juin', short: 'Juin' },
  { key: 'juillet', label: 'Juillet', short: 'Juil' },
  { key: 'août', label: 'Août', short: 'Aoû' },
  { key: 'septembre', label: 'Septembre', short: 'Sep' },
  { key: 'octobre', label: 'Octobre', short: 'Oct' },
  { key: 'novembre', label: 'Novembre', short: 'Nov' },
  { key: 'décembre', label: 'Décembre', short: 'Déc' },
];

export const SPECIALITE_THEMES = {
  'Éducateur spécialisé': { emoji: '🤝', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  'Psychologie': { emoji: '🧠', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  'Ergothérapie': { emoji: '🤲', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  'Psychiatrie': { emoji: '🩺', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  'Arthérapie': { emoji: '🎨', color: '#DB2777', bg: '#FDF2F8', border: '#FBCFE8' },
  'Autre': { emoji: '📋', color: '#4B5563', bg: '#F3F4F6', border: '#E5E7EB' }
};

export function getSpecialiteTheme(specialite) {
  return SPECIALITE_THEMES[specialite] || SPECIALITE_THEMES['Autre'];
}

export const TYPE_ICONS = {
  'Réunion': '👥',
  'Rdv 45min': '⏱️',
  'Rdv 1h': '⏳',
  'Bilan': '📑',
  'Atelier': '🧩',
  'Dépassement honoraires Psychiatrie': '💳',
  'Autre': '📌'
};

export function getTypeEmoji(type) {
  return TYPE_ICONS[type] || '📌';
}

export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '0,00 €';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}

export function formatEcart(diff) {
  const num = Number(diff) || 0;
  if (Math.abs(num) < 0.001) {
    return '0,00 €';
  }
  const formattedAbs = formatCurrency(Math.abs(num));
  if (num > 0) {
    return `+ ${formattedAbs}`;
  } else {
    return `- ${formattedAbs}`;
  }
}
