const fs = require('fs');

const csvContent = fs.readFileSync('src/data/user_uploaded_catalog.csv', 'utf8');
const lines = csvContent.split(/\r?\n/).filter(l => l.trim().length > 0);

function parseCSVLine(text) {
  const row = [];
  let inQuotes = false;
  let cur = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      row.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  row.push(cur.trim());
  return row;
}

const parts = [];
for (let i = 1; i < lines.length; i++) {
  const parsed = parseCSVLine(lines[i]);
  if (parsed.length >= 11) {
    const row = [
      parsed[0],
      parsed[1],
      parsed[2],
      parseFloat(parsed[3]) || 0,
      parseFloat(parsed[4]) || 0,
      parseFloat(parsed[5]) || 0,
      parseFloat(parsed[6]) || 0,
      parsed[7],
      parsed[8],
      parsed[9],
      parsed[10]
    ];
    parts.push({ row });
  } else if (parsed.length > 0) {
    console.warn(`Line ${i} has only ${parsed.length} columns:`, parsed);
  }
}

console.log('Total valid parts parsed:', parts.length);
console.log('Part 0:', JSON.stringify(parts[0]));
console.log('Part 519:', JSON.stringify(parts[parts.length - 1]));

async function doBackup() {
  const url = 'https://script.google.com/macros/s/AKfycbw9E47A3hoMn41mM3bXBuXoTTPpCUhumfsn95QGxtJWHVkRQ75Fp6q8iUQPUk7NwhBY/exec';
  const payload = {
    action: 'backup_all_in_one',
    sheetName: 'ALL PRODUCT',
    mode: 'all_in_one',
    parts: parts
  };

  console.log(`Sending backup payload with ${parts.length} rows to Google Sheets...`);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    redirect: 'follow'
  });

  const text = await res.text();
  console.log('Apps Script response:', text);
}

doBackup().catch(err => {
  console.error('Backup failed:', err);
  process.exit(1);
});
