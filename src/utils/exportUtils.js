import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MONTH_NAMES, formatCurrency } from './data';

export function exportToExcel({ usagers, globalBudget, totalPrevisionnel, totalReel, budgetRestant }) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Synthèse
  const kpiData = [
    ["SYNTHÈSE BUDGÉTAIRE - PCPE AUTISME (ASSOCIATION CHRYSALIDE)"],
    ["Date d'exportation", new Date().toLocaleDateString('fr-FR')],
    [],
    ["Indicateur", "Montant (€)"],
    ["Budget Annuel Global Alloué", globalBudget],
    ["Total Prévisionnel Engagé", totalPrevisionnel],
    ["Total Réellement Engagé", totalReel],
    ["Budget Restant (Prévisionnel)", budgetRestant],
    ["Solde Restant (sur Réel)", globalBudget - totalReel],
    ["Taux d'engagement prévisionnel", `${globalBudget > 0 ? ((totalPrevisionnel / globalBudget) * 100).toFixed(1) : 0}%`]
  ];
  const wsKpi = XLSX.utils.aoa_to_sheet(kpiData);
  XLSX.utils.book_append_sheet(wb, wsKpi, "Synthèse Budgétaire");

  // Sheet 2: Détail des Prestations
  const detailHeaders = [
    "Usager", "Année", "Type de prestation", "Spécialité", "Professionnel",
    "Tarif unitaire (€)", "Quantité annuelle", "Coût Annuel Prév (€)", "Coût Annuel Réel (€)",
    "Commentaires / Notes",
    ...MONTH_NAMES.map(m => `${m.label} Prév`),
    ...MONTH_NAMES.map(m => `${m.label} Réel`)
  ];

  const detailRows = [detailHeaders];

  usagers.forEach(u => {
    (u.prestations || []).forEach(p => {
      const prevMonths = MONTH_NAMES.map(m => p.mensuel?.[m.key]?.previsionnel || 0);
      const reelMonths = MONTH_NAMES.map(m => p.mensuel?.[m.key]?.reel || 0);

      detailRows.push([
        u.nom,
        p.annee || 2026,
        p.type,
        p.specialite,
        p.professionnel,
        p.tarif,
        p.quantite,
        p.coutAnnuel,
        p.coutReel || 0,
        p.notes || "",
        ...prevMonths,
        ...reelMonths
      ]);
    });
  });

  const wsDetail = XLSX.utils.aoa_to_sheet(detailRows);
  XLSX.utils.book_append_sheet(wb, wsDetail, "Accompagnements Détaillés");

  XLSX.writeFile(wb, `Budget_PCPE_Chrysalide_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportToPDF({ usagers, globalBudget, totalPrevisionnel, totalReel, budgetRestant }) {
  const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });

  // Title & Header
  doc.setFontSize(14);
  doc.setTextColor(0, 152, 216); // Chrysalide blue
  doc.text("CALENDRIER BUDGÉTAIRE ANNUEL - PCPE AUTISME", 14, 14);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Édité le ${new Date().toLocaleDateString('fr-FR')} | Budget Alloué: ${formatCurrency(globalBudget)} | Prév: ${formatCurrency(totalPrevisionnel)} | Réel: ${formatCurrency(totalReel)}`, 14, 21);

  // Build headers
  const head1 = [{ content: 'Bénéficiaire', rowSpan: 2, styles: { halign: 'left', valign: 'middle', fillColor: [241, 245, 249] } }];
  const head2 = [];

  MONTH_NAMES.forEach(m => {
    head1.push({ content: m.short.toUpperCase(), colSpan: 2, styles: { halign: 'center', fillColor: [241, 245, 249] } });
    head2.push({ content: 'Prév', styles: { halign: 'right', textColor: [124, 58, 237], fillColor: [248, 250, 252] } });
    head2.push({ content: 'Réel', styles: { halign: 'right', textColor: [190, 24, 93], fillColor: [248, 250, 252] } });
  });

  head1.push({ content: 'TOTAL ANNUEL', colSpan: 2, styles: { halign: 'center', fillColor: [226, 232, 240], textColor: [15, 23, 42] } });
  head2.push({ content: 'Total Prév', styles: { halign: 'right', fillColor: [226, 232, 240], textColor: [124, 58, 237] } });
  head2.push({ content: 'Total Réel', styles: { halign: 'right', fillColor: [226, 232, 240], textColor: [190, 24, 93] } });

  // Build body
  const body = [];
  const columnTotals = {};
  MONTH_NAMES.forEach(m => columnTotals[m.key] = { prev: 0, reel: 0 });
  let grandTotalPrev = 0;
  let grandTotalReel = 0;

  usagers.forEach(u => {
    if (!u.actif && u.actif !== undefined) return;

    let rowTotalPrev = 0;
    let rowTotalReel = 0;
    const row = [{ content: u.nom, styles: { fontStyle: 'bold' } }];

    const uMonths = {};
    MONTH_NAMES.forEach(m => uMonths[m.key] = { prev: 0, reel: 0 });

    (u.prestations || []).forEach(p => {
      MONTH_NAMES.forEach(m => {
        const mPrev = Number(p.mensuel?.[m.key]?.previsionnel || 0);
        const mReel = Number(p.mensuel?.[m.key]?.reel || 0);
        uMonths[m.key].prev += mPrev;
        uMonths[m.key].reel += mReel;
        columnTotals[m.key].prev += mPrev;
        columnTotals[m.key].reel += mReel;
      });
    });

    MONTH_NAMES.forEach(m => {
      const prev = uMonths[m.key].prev;
      const reel = uMonths[m.key].reel;
      rowTotalPrev += prev;
      rowTotalReel += reel;
      
      row.push({ content: prev > 0 ? Math.round(prev).toString() : '-', styles: { halign: 'right' } });
      row.push({ 
        content: reel > 0 ? (reel > prev ? `+${Math.round(reel)}` : `-${Math.round(reel)}`) : '-', 
        styles: { 
          halign: 'right', 
          fontStyle: reel > 0 ? 'bold' : 'normal',
          textColor: reel > 0 ? (reel > prev ? [220, 38, 38] : [5, 150, 105]) : [148, 163, 184],
          fillColor: reel > 0 ? (reel > prev ? [254, 242, 242] : [240, 253, 244]) : [255, 255, 255]
        } 
      });
    });

    grandTotalPrev += rowTotalPrev;
    grandTotalReel += rowTotalReel;

    row.push({ content: Math.round(rowTotalPrev).toString(), styles: { halign: 'right', fontStyle: 'bold', fillColor: [248, 250, 252] } });
    row.push({ 
      content: rowTotalReel > 0 ? (rowTotalReel > rowTotalPrev ? `+${Math.round(rowTotalReel)}` : `-${Math.round(rowTotalReel)}`) : '-', 
      styles: { 
        halign: 'right', 
        fontStyle: 'bold',
        textColor: rowTotalReel > 0 ? (rowTotalReel > rowTotalPrev ? [220, 38, 38] : [5, 150, 105]) : [148, 163, 184],
        fillColor: rowTotalReel > 0 ? (rowTotalReel > rowTotalPrev ? [254, 226, 226] : [220, 252, 231]) : [248, 250, 252]
      } 
    });

    body.push(row);
  });

  // Footer row
  const footRow = [{ content: 'TOTAL GÉNÉRAL', styles: { fontStyle: 'bold' } }];
  MONTH_NAMES.forEach(m => {
    const p = columnTotals[m.key].prev;
    const r = columnTotals[m.key].reel;
    footRow.push({ content: Math.round(p).toString(), styles: { halign: 'right', fontStyle: 'bold', textColor: [124, 58, 237] } });
    footRow.push({ 
      content: r > 0 ? (r > p ? `+${Math.round(r)}` : `-${Math.round(r)}`) : '-', 
      styles: { 
        halign: 'right', 
        fontStyle: 'bold',
        textColor: r > 0 ? (r > p ? [220, 38, 38] : [5, 150, 105]) : [148, 163, 184],
        fillColor: r > 0 ? (r > p ? [254, 226, 226] : [220, 252, 231]) : [226, 232, 240]
      } 
    });
  });
  footRow.push({ content: formatCurrency(grandTotalPrev), styles: { halign: 'right', fontStyle: 'bold', textColor: [124, 58, 237] } });
  footRow.push({ 
    content: grandTotalReel > 0 ? (grandTotalReel > grandTotalPrev ? `+${formatCurrency(grandTotalReel)}` : `-${formatCurrency(grandTotalReel)}`) : '-', 
    styles: { 
      halign: 'right', 
      fontStyle: 'bold',
      textColor: grandTotalReel > 0 ? (grandTotalReel > grandTotalPrev ? [220, 38, 38] : [5, 150, 105]) : [148, 163, 184],
      fillColor: grandTotalReel > 0 ? (grandTotalReel > grandTotalPrev ? [254, 226, 226] : [220, 252, 231]) : [226, 232, 240]
    } 
  });

  const options = {
    startY: 25,
    head: [head1, head2],
    body: body,
    foot: [footRow],
    theme: 'grid',
    headStyles: { textColor: [15, 23, 42], fontSize: 6, lineWidth: 0.1, lineColor: [203, 213, 225] },
    bodyStyles: { fontSize: 6, cellPadding: 1.5, lineWidth: 0.1, lineColor: [226, 232, 240] },
    footStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontSize: 7, lineWidth: 0.1, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 32 }
    }
  };

  if (typeof doc.autoTable === 'function') {
    doc.autoTable(options);
  } else if (typeof autoTable === 'function') {
    autoTable(doc, options);
  }

  // --- PAGE 2: Détail Mensuel ---
  doc.addPage();
  
  doc.setFontSize(14);
  doc.setTextColor(0, 152, 216);
  doc.text("DÉTAIL MENSUEL - SERVICE PCPE AUTISME", 14, 14);
  
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Vue consolidée de tous les usagers | Budget mensuel indicatif : ${formatCurrency(globalBudget / 12)}`, 14, 21);

  let globalTotalPrev = 0;
  let globalTotalReel = 0;
  let cumulPrev = 0;
  let cumulReel = 0;

  const monthDataRows = MONTH_NAMES.map(m => {
    let mPrev = 0;
    let mReel = 0;
    usagers.forEach(u => {
      if (!u.actif && u.actif !== undefined) return;
      (u.prestations || []).forEach(p => {
        mPrev += Number(p.mensuel?.[m.key]?.previsionnel || 0);
        mReel += Number(p.mensuel?.[m.key]?.reel || 0);
      });
    });

    globalTotalPrev += mPrev;
    globalTotalReel += mReel;
    cumulPrev += mPrev;
    cumulReel += mReel;

    const ecart = mReel - mPrev;
    const cumulEcart = cumulReel - cumulPrev;
    const hasActivity = mPrev > 0 || mReel > 0;

    return [
      { content: m.label, styles: { fontStyle: 'bold', textColor: hasActivity ? [15, 23, 42] : [148, 163, 184] } },
      { content: mPrev > 0 ? formatCurrency(mPrev) : '-', styles: { halign: 'right', textColor: hasActivity ? [124, 58, 237] : [148, 163, 184] } },
      { content: mReel > 0 ? formatCurrency(mReel) : '-', styles: { halign: 'right', textColor: hasActivity ? [190, 24, 93] : [148, 163, 184] } },
      { 
        content: hasActivity ? (ecart > 0 ? `+${formatCurrency(ecart)}` : (ecart < 0 ? `-${formatCurrency(Math.abs(ecart))}` : '0,00 €')) : '-', 
        styles: { halign: 'right', fontStyle: 'bold', textColor: hasActivity ? (ecart > 0 ? [220, 38, 38] : (ecart < 0 ? [5, 150, 105] : [100, 116, 139])) : [148, 163, 184] } 
      },
      { content: cumulPrev > 0 ? formatCurrency(cumulPrev) : '-', styles: { halign: 'right', textColor: hasActivity ? [124, 58, 237] : [148, 163, 184] } },
      { content: cumulReel > 0 ? formatCurrency(cumulReel) : '-', styles: { halign: 'right', textColor: hasActivity ? [190, 24, 93] : [148, 163, 184] } },
      { 
        content: (cumulPrev > 0 || cumulReel > 0) ? (cumulEcart > 0 ? `+${formatCurrency(cumulEcart)}` : (cumulEcart < 0 ? `-${formatCurrency(Math.abs(cumulEcart))}` : '0,00 €')) : '-', 
        styles: { halign: 'right', fontStyle: 'bold', textColor: (cumulPrev > 0 || cumulReel > 0) ? (cumulEcart > 0 ? [220, 38, 38] : (cumulEcart < 0 ? [5, 150, 105] : [100, 116, 139])) : [148, 163, 184] } 
      }
    ];
  });

  const monthHead = [[
    { content: 'Mois', styles: { halign: 'left' } }, 
    { content: 'Prévisionnel', styles: { halign: 'right', textColor: [124, 58, 237] } }, 
    { content: 'Réel engagé', styles: { halign: 'right', textColor: [190, 24, 93] } }, 
    { content: 'Écart Réel/Prév', styles: { halign: 'right' } }, 
    { content: 'Cumul Prév.', styles: { halign: 'right', textColor: [124, 58, 237] } }, 
    { content: 'Cumul Réel', styles: { halign: 'right', textColor: [190, 24, 93] } }, 
    { content: 'Écart Cumulé', styles: { halign: 'right' } }
  ]];
  
  const monthFootEcart = globalTotalReel - globalTotalPrev;
  const monthFoot = [[
    { content: 'TOTAL ANNUEL', styles: { fontStyle: 'bold' } }, 
    { content: formatCurrency(globalTotalPrev), styles: { halign: 'right', textColor: [124, 58, 237], fontStyle: 'bold' } }, 
    { content: formatCurrency(globalTotalReel), styles: { halign: 'right', textColor: [190, 24, 93], fontStyle: 'bold' } }, 
    { 
      content: monthFootEcart > 0 ? `+${formatCurrency(monthFootEcart)}` : (monthFootEcart < 0 ? `-${formatCurrency(Math.abs(monthFootEcart))}` : '0,00 €'), 
      styles: { halign: 'right', fontStyle: 'bold', textColor: monthFootEcart > 0 ? [220, 38, 38] : (monthFootEcart < 0 ? [5, 150, 105] : [100, 116, 139]), fillColor: monthFootEcart > 0 ? [254, 226, 226] : (monthFootEcart < 0 ? [220, 252, 231] : [226, 232, 240]) } 
    },
    { content: formatCurrency(globalTotalPrev), styles: { halign: 'right', textColor: [124, 58, 237], fontStyle: 'bold' } },
    { content: formatCurrency(globalTotalReel), styles: { halign: 'right', textColor: [190, 24, 93], fontStyle: 'bold' } },
    { 
      content: monthFootEcart > 0 ? `+${formatCurrency(monthFootEcart)}` : (monthFootEcart < 0 ? `-${formatCurrency(Math.abs(monthFootEcart))}` : '0,00 €'), 
      styles: { halign: 'right', fontStyle: 'bold', textColor: monthFootEcart > 0 ? [220, 38, 38] : (monthFootEcart < 0 ? [5, 150, 105] : [100, 116, 139]), fillColor: monthFootEcart > 0 ? [254, 226, 226] : (monthFootEcart < 0 ? [220, 252, 231] : [226, 232, 240]) } 
    }
  ]];

  const monthOptions = {
    startY: 25,
    head: monthHead,
    body: monthDataRows,
    foot: monthFoot,
    theme: 'grid',
    headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontSize: 9, lineWidth: 0.1, lineColor: [203, 213, 225] },
    bodyStyles: { fontSize: 9, cellPadding: 3, lineWidth: 0.1, lineColor: [226, 232, 240] },
    footStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontSize: 10, lineWidth: 0.1, cellPadding: 4 },
  };

  if (typeof doc.autoTable === 'function') {
    doc.autoTable(monthOptions);
  } else if (typeof autoTable === 'function') {
    autoTable(doc, monthOptions);
  }

  doc.save(`Calendrier_Budget_PCPE_${new Date().toISOString().slice(0, 10)}.pdf`);
}
