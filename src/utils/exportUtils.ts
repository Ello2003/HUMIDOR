import { Cigar, Humidor, SmokeLog, WishlistItem, CigarAppData, CigarResearchItem } from '../types';

/**
 * Utility to download text/data as a local file in browser
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Research Database (including brand, type, average price, review tasting notes, user personal rating & notes) as JSON
 */
export function exportResearchDatabaseToJSON(database: CigarResearchItem[], userOnly: boolean = false) {
  const dataToExport = userOnly
    ? database.filter((item) => item.personalRating || item.personalNotes || item.personalFavorite || item.personalTried)
    : database;

  const exportPayload = {
    title: userOnly ? 'My Personal Cigar Ratings & Research Notes' : 'Cigar Connoisseur Research Database & Library',
    totalCigars: dataToExport.length,
    exportedAt: new Date().toISOString(),
    version: '2.0.0',
    cigars: dataToExport,
  };

  const jsonContent = JSON.stringify(exportPayload, null, 2);
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = userOnly
    ? `My_Cigar_Ratings_And_Notes_${timestamp}.json`
    : `Cigar_Research_Database_${timestamp}.json`;

  downloadFile(jsonContent, filename, 'application/json;charset=utf-8;');
}

/**
 * Export Research Database as CSV
 */
export function exportResearchDatabaseToCSV(database: CigarResearchItem[]) {
  const headers = [
    'Brand',
    'Line',
    'Vitola',
    'Length (in)',
    'Ring Gauge',
    'Country of Origin',
    'Wrapper',
    'Wrapper Type',
    'Binder',
    'Filler',
    'Strength',
    'Body',
    'Average Price (USD)',
    'Price Range',
    'Critic Rating',
    'Critic Consensus',
    'Master Blender',
    'Factory Terroir',
    'Review Tasting Overview',
    '1st Third Notes',
    '2nd Third Notes',
    'Final Third Notes',
    'Dominant Flavors',
    'Recommended Pairings',
    'Personal Rating (1-100)',
    'Personal Notes',
    'Personal Favorite',
    'Personal Rebuy Verdict',
    'Personal Pairing Notes',
  ];

  const rows = database.map((c) => [
    escapeCSV(c.brand),
    escapeCSV(c.line),
    escapeCSV(c.vitola),
    escapeCSV(c.lengthInches),
    escapeCSV(c.ringGauge),
    escapeCSV(c.countryOrigin),
    escapeCSV(c.wrapper),
    escapeCSV(c.wrapperType),
    escapeCSV(c.binder),
    escapeCSV(c.filler),
    escapeCSV(c.strength),
    escapeCSV(c.body),
    escapeCSV(c.averagePrice ? c.averagePrice.toFixed(2) : ''),
    escapeCSV(c.priceRange),
    escapeCSV(c.criticRating),
    escapeCSV(c.criticConsensus),
    escapeCSV(c.masterBlender || ''),
    escapeCSV(c.factoryTerroir || ''),
    escapeCSV(c.reviewTastingNotes?.overview || ''),
    escapeCSV(c.reviewTastingNotes?.firstThird || ''),
    escapeCSV(c.reviewTastingNotes?.secondThird || ''),
    escapeCSV(c.reviewTastingNotes?.finalThird || ''),
    escapeCSV((c.reviewTastingNotes?.dominantFlavorTags || []).join('; ')),
    escapeCSV((c.recommendedPairings || []).join('; ')),
    escapeCSV(c.personalRating || ''),
    escapeCSV(c.personalNotes || ''),
    escapeCSV(c.personalFavorite ? 'Yes' : 'No'),
    escapeCSV(c.personalWouldRebuy || ''),
    escapeCSV(c.personalPairingNotes || ''),
  ].join(','));

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const timestamp = new Date().toISOString().split('T')[0];
  downloadFile(csvContent, `Cigar_Research_Database_${timestamp}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Calculate resting days between purchase / box date and today
 */
export function calculateRestDays(dateStr?: string): number {
  if (!dateStr) return 0;
  const start = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

const escapeCSV = (str: any) => {
  if (str === undefined || str === null) return '""';
  const clean = String(str).replace(/"/g, '""');
  return `"${clean}"`;
};

/**
 * Export Humidor Inventory as clean CSV
 */
export function exportInventoryToCSV(cigars: Cigar[], humidors: Humidor[]) {
  const humidorMap = new Map(humidors.map((h) => [h.id, h.name]));

  const headers = [
    'Brand',
    'Cigar Name',
    'Line',
    'Vitola',
    'Length (in)',
    'Ring Gauge',
    'Wrapper',
    'Binder',
    'Filler',
    'Country of Origin',
    'Strength',
    'Quantity in Stock',
    'Humidor Location',
    'Status',
    'Resting (Days)',
    'Target Rest (Months)',
    'Purchase Date',
    'Box Date',
    'Purchase Price',
    'Currency',
    'Vendor / Shop',
    'Box Code',
    'Personal Rating (1-100)',
    'Flavor Tags',
    'Notes',
  ];

  const rows = cigars.map((c) => {
    const restDays = calculateRestDays(c.purchaseDate);
    const humName = humidorMap.get(c.humidorId) || 'Unassigned';
    return [
      escapeCSV(c.brand),
      escapeCSV(c.name),
      escapeCSV(c.line),
      escapeCSV(c.vitola),
      escapeCSV(c.lengthInches || ''),
      escapeCSV(c.ringGauge || ''),
      escapeCSV(c.wrapper),
      escapeCSV(c.binder || ''),
      escapeCSV(c.filler || ''),
      escapeCSV(c.countryOrigin),
      escapeCSV(c.strength),
      escapeCSV(c.quantity),
      escapeCSV(humName),
      escapeCSV(c.status),
      escapeCSV(restDays),
      escapeCSV(c.targetRestMonths),
      escapeCSV(c.purchaseDate),
      escapeCSV(c.boxDate || ''),
      escapeCSV(c.purchasePrice !== undefined ? c.purchasePrice.toFixed(2) : ''),
      escapeCSV(c.currency || '$'),
      escapeCSV(c.vendor || ''),
      escapeCSV(c.boxCode || ''),
      escapeCSV(c.personalRating || ''),
      escapeCSV((c.flavorTags || []).join('; ')),
      escapeCSV(c.notes || ''),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const timestamp = new Date().toISOString().split('T')[0];
  downloadFile(csvContent, `Cigar_Humidor_Inventory_${timestamp}.csv`, 'text/csv;charset=utf-8;');
}

export const exportInventoryCSV = exportInventoryToCSV;

/**
 * Export Smoke Journal & Tasting Logs as CSV
 */
export function exportSmokeLogsToCSV(logs: SmokeLog[]) {
  const headers = [
    'Date Smoked',
    'Brand',
    'Cigar Name',
    'Vitola',
    'Wrapper',
    'Origin',
    'Overall Score (1-100)',
    'Star Rating (1-5)',
    'Would Rebuy',
    'Smoking Duration (min)',
    'Location',
    'Occasion',
    'Draw Quality',
    'Burn Quality',
    'Ash Quality',
    'Dominant Flavors',
    '1st Third Notes',
    '2nd Third Notes',
    'Final Third Notes',
    'Pairing Beverage',
    'Pairing Notes',
    'Cut Type',
    'Light Type',
    'Detailed Review',
  ];

  const rows = logs.map((l) => {
    return [
      escapeCSV(l.smokedAt ? l.smokedAt.split('T')[0] : ''),
      escapeCSV(l.cigarBrand),
      escapeCSV(l.cigarName),
      escapeCSV(l.vitola),
      escapeCSV(l.wrapper),
      escapeCSV(l.origin || ''),
      escapeCSV(l.overallScore),
      escapeCSV(l.starRating),
      escapeCSV(l.wouldRebuy),
      escapeCSV(l.durationMinutes),
      escapeCSV(l.location),
      escapeCSV(l.occasion || ''),
      escapeCSV(l.drawQuality),
      escapeCSV(l.burnQuality),
      escapeCSV(l.ashQuality),
      escapeCSV((l.dominantFlavors || []).join('; ')),
      escapeCSV((l.firstThirdNotes || []).join('; ')),
      escapeCSV((l.secondThirdNotes || []).join('; ')),
      escapeCSV((l.finalThirdNotes || []).join('; ')),
      escapeCSV(l.pairingDrink),
      escapeCSV(l.pairingNotes || ''),
      escapeCSV(l.cutType || ''),
      escapeCSV(l.lightType || ''),
      escapeCSV(l.detailedReview || ''),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const timestamp = new Date().toISOString().split('T')[0];
  downloadFile(csvContent, `Cigar_Tasting_Journal_${timestamp}.csv`, 'text/csv;charset=utf-8;');
}

export const exportSmokeLogsCSV = exportSmokeLogsToCSV;

/**
 * Export Wishlist as CSV
 */
export function exportWishlistToCSV(wishlist: WishlistItem[]) {
  const headers = [
    'Brand',
    'Cigar Name',
    'Vitola',
    'Priority',
    'Target Price',
    'Source / Retailer',
    'Notes',
    'Date Added',
  ];

  const rows = wishlist.map((w) => {
    return [
      escapeCSV(w.brand),
      escapeCSV(w.name),
      escapeCSV(w.vitola || ''),
      escapeCSV(w.priority),
      escapeCSV(w.targetPrice !== undefined ? w.targetPrice.toFixed(2) : ''),
      escapeCSV(w.sourceRetailer || ''),
      escapeCSV(w.notes || ''),
      escapeCSV(w.createdAt ? w.createdAt.split('T')[0] : ''),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const timestamp = new Date().toISOString().split('T')[0];
  downloadFile(csvContent, `Cigar_Wishlist_${timestamp}.csv`, 'text/csv;charset=utf-8;');
}

export const exportWishlistCSV = exportWishlistToCSV;

/**
 * Export complete structured backup as JSON
 */
export function exportCompleteVaultJSON(data: {
  cigars: Cigar[];
  humidors: Humidor[];
  smokeLogs: SmokeLog[];
  wishlist: WishlistItem[];
  researchDatabase?: CigarResearchItem[];
}) {
  const exportPayload: CigarAppData = {
    ...data,
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
  };

  const jsonContent = JSON.stringify(exportPayload, null, 2);
  const timestamp = new Date().toISOString().split('T')[0];
  downloadFile(jsonContent, `Cigar_Vault_Backup_${timestamp}.json`, 'application/json;charset=utf-8;');
}

export const exportAllJSON = exportCompleteVaultJSON;

/**
 * Export Connoisseur Markdown Journal (.md) for personal archiving (Obsidian, Notion, Logseq)
 */
export function exportJournalMarkdown(logs: SmokeLog[], cigars: Cigar[]) {
  const timestamp = new Date().toISOString().split('T')[0];
  const totalSmokes = logs.length;
  const avgScore = totalSmokes > 0 ? (logs.reduce((acc, l) => acc + l.overallScore, 0) / totalSmokes).toFixed(1) : 'N/A';

  let md = `# 🍂 Personal Cigar Tasting Journal & Humidor Ledger
*Exported on ${timestamp} | Total Smokes Logged: ${totalSmokes} | Average Score: ${avgScore}/100*

---

## 📖 Tasting Session Log Index

`;

  logs.forEach((l, index) => {
    const dateFormatted = l.smokedAt ? new Date(l.smokedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown Date';
    md += `### ${index + 1}. ${l.cigarBrand} ${l.cigarName} (${l.vitola})
- **Date & Location:** ${dateFormatted} at *${l.location}* ${l.occasion ? `(${l.occasion})` : ''}
- **Score:** ⭐ **${l.overallScore}/100** (${l.starRating}/5 Stars) | **Verdict:** \`${l.wouldRebuy}\`
- **Wrapper:** ${l.wrapper} | **Origin:** ${l.origin || 'N/A'}
- **Burn & Construction:** Draw: *${l.drawQuality}* | Burn: *${l.burnQuality}* | Ash: *${l.ashQuality}*
- **Cut & Light:** ${l.cutType || 'Straight'} via ${l.lightType || 'Torch'} | Duration: ${l.durationMinutes} mins
- **Pairing Beverage:** 🥃 **${l.pairingDrink}** ${l.pairingNotes ? `— *"${l.pairingNotes}"*` : ''}

#### 💨 3-Thirds Flavor Transitions:
- **1st Third:** ${(l.firstThirdNotes || []).join(', ') || 'Mild cedar, gentle pepper'}
- **2nd Third:** ${(l.secondThirdNotes || []).join(', ') || 'Creamy cocoa, toasted nuts'}
- **Final Third:** ${(l.finalThirdNotes || []).join(', ') || 'Deep earth, espresso, rich leather'}
- **Dominant Profile:** ${(l.dominantFlavors || []).map((f) => `\`${f}\``).join(' ')}

> **Connoisseur Notes & Review:**  
> ${l.detailedReview || 'Smooth smoke with great complexity throughout the session.'}

---
`;
  });

  md += `\n## 🪵 Current Humidor Inventory Snapshot (${cigars.length} distinct lines)\n\n`;
  md += `| Brand | Line & Vitola | Wrapper | Strength | Qty | Status | Rest (Days) |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  cigars.forEach((c) => {
    const rest = calculateRestDays(c.purchaseDate);
    md += `| ${c.brand} | ${c.name} (${c.vitola}) | ${c.wrapper} | ${c.strength} | **${c.quantity}** | \`${c.status}\` | ${rest}d |\n`;
  });

  md += `\n\n*Generated by Cigar Humidor & Research Connoisseur Dashboard*`;

  downloadFile(md, `Cigar_Connoisseur_Journal_${timestamp}.md`, 'text/markdown;charset=utf-8;');
}

export const exportMarkdownJournal = exportJournalMarkdown;

/**
 * Generate a printable HTML page ready for window.print() or Save as PDF
 */
export function exportPrintableReport(cigars: Cigar[], humidors: Humidor[], logs: SmokeLog[]) {
  const humidorMap = new Map(humidors.map((h) => [h.id, h.name]));
  const totalSticks = cigars.reduce((acc, c) => acc + (c.quantity || 0), 0);
  const totalValue = cigars.reduce((acc, c) => acc + (c.purchasePrice || 0) * (c.quantity || 0), 0);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to open the printable catalog.');
    return;
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Cigar Humidor Vault & Tasting Ledger</title>
  <style>
    @media print {
      @page { margin: 15mm; size: letter portrait; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1c1917;
      background: #fafaf9;
      margin: 0;
      padding: 24px;
      line-height: 1.4;
    }
    .header {
      border-bottom: 2px solid #78350f;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    h1 { margin: 0; color: #451a03; font-size: 24px; font-weight: 700; }
    .subtitle { color: #78716c; font-size: 13px; margin-top: 4px; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: #fff;
      border: 1px solid #e7e5e4;
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }
    .stat-val { font-size: 20px; font-weight: 700; color: #92400e; }
    .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #78716c; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
      background: #fff;
      font-size: 12px;
      border: 1px solid #e7e5e4;
      border-radius: 6px;
      overflow: hidden;
    }
    th {
      background: #f5f5f4;
      color: #44403c;
      text-align: left;
      padding: 10px 8px;
      font-weight: 600;
      border-bottom: 1px solid #d6d3d1;
    }
    td {
      padding: 8px;
      border-bottom: 1px solid #f5f5f4;
    }
    tr:nth-child(even) td { background: #fafaf9; }
    .btn-print {
      background: #78350f;
      color: #fff;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      margin-bottom: 20px;
    }
    .btn-print:hover { background: #92400e; }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
    <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
    <span style="color: #78716c; font-size: 13px;">Pro Tip: Choose "Save as PDF" in print destinations to save an archive file.</span>
  </div>

  <div class="header">
    <div>
      <h1>🍂 Personal Humidor Vault & Tasting Ledger</h1>
      <div class="subtitle">Private Connoisseur Collection Report • Generated ${new Date().toLocaleDateString()}</div>
    </div>
    <div style="text-align: right;">
      <div style="font-weight: 700; color: #78350f;">Personal Collector Edition</div>
      <div style="font-size: 11px; color: #a8a29e;">Cigar Sommelier Suite</div>
    </div>
  </div>

  <div class="summary-grid">
    <div class="stat-card">
      <div class="stat-val">${totalSticks}</div>
      <div class="stat-label">Total Cigars in Stock</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">$${totalValue.toFixed(2)}</div>
      <div class="stat-label">Total Valuation</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">${humidors.length}</div>
      <div class="stat-label">Active Humidors</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">${logs.length}</div>
      <div class="stat-label">Smokes Logged</div>
    </div>
  </div>

  <h2 style="font-size: 16px; color: #451a03; margin: 16px 0 8px;">🪵 Current Humidor Inventory</h2>
  <table>
    <thead>
      <tr>
        <th>Brand & Line</th>
        <th>Vitola / Dimensions</th>
        <th>Wrapper & Origin</th>
        <th>Strength</th>
        <th>Humidor</th>
        <th>Rest (Days)</th>
        <th>Qty</th>
        <th>Price</th>
        <th>Rating</th>
      </tr>
    </thead>
    <tbody>
      ${cigars
        .map((c) => {
          const rest = calculateRestDays(c.purchaseDate);
          const hum = humidorMap.get(c.humidorId) || 'Main';
          return `
        <tr>
          <td><strong>${c.brand}</strong><br>${c.name}</td>
          <td>${c.vitola}<br><span style="color:#78716c; font-size:10px;">${c.lengthInches ? `${c.lengthInches}"` : ''} ${c.ringGauge ? `x ${c.ringGauge} RG` : ''}</span></td>
          <td>${c.wrapper}<br><span style="color:#78716c; font-size:10px;">${c.countryOrigin}</span></td>
          <td>${c.strength}</td>
          <td>${hum}</td>
          <td><strong>${rest}d</strong><br><span style="font-size:10px; color:#78716c;">${c.status}</span></td>
          <td><strong style="font-size: 14px;">${c.quantity}</strong></td>
          <td>${c.purchasePrice ? `$${c.purchasePrice.toFixed(2)}` : '—'}</td>
          <td>${c.personalRating ? `⭐ ${c.personalRating}` : '—'}</td>
        </tr>
      `;
        })
        .join('')}
    </tbody>
  </table>

  <div class="page-break"></div>

  <h2 style="font-size: 16px; color: #451a03; margin: 24px 0 8px;">📖 Connoisseur Tasting Sessions Ledger</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Cigar</th>
        <th>Score</th>
        <th>Pairing</th>
        <th>Burn / Draw</th>
        <th>Key Notes & Review</th>
      </tr>
    </thead>
    <tbody>
      ${logs
        .map((l) => {
          const date = l.smokedAt ? new Date(l.smokedAt).toLocaleDateString() : '';
          return `
        <tr>
          <td>${date}<br><span style="color:#78716c; font-size:10px;">${l.location}</span></td>
          <td><strong>${l.cigarBrand}</strong><br>${l.cigarName} (${l.vitola})</td>
          <td><strong style="color:#92400e;">${l.overallScore}/100</strong><br><span style="font-size:10px;">${l.wouldRebuy}</span></td>
          <td><strong>${l.pairingDrink}</strong><br><span style="color:#78716c; font-size:10px;">${l.pairingNotes || ''}</span></td>
          <td>${l.drawQuality} draw<br>${l.burnQuality} burn</td>
          <td>
            <div style="font-size: 11px; margin-bottom: 4px;"><strong>Flavors:</strong> ${(l.dominantFlavors || []).join(', ')}</div>
            <div style="font-style: italic; color:#44403c; font-size: 11px;">"${l.detailedReview}"</div>
          </td>
        </tr>
      `;
        })
        .join('')}
    </tbody>
  </table>
</body>
</html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

export const openPrintableCatalog = exportPrintableReport;
