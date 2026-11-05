// Utility functions for phone model extraction, brand detection, and randomization

export function extractPhoneModel(partName: string): string {
  const clean = partName.trim();
  const iphoneMatch = clean.match(/IPHONE\s+([0-9]{1,2}(?:\s*(?:PRO\s*MAX|PRO|PLUS|MINI))?|[XSRM]+(?:\s*(?:MAX|PRO))?)/i);
  if (iphoneMatch) return `iPhone ${iphoneMatch[1].toUpperCase().replace(/\s+/g, ' ')}`;

  const samsungMatch = clean.match(/SAMSUNG\s+(?:GALAXY\s+)?([A-Z][0-9]{1,3}[A-Z]?(?:\s*(?:ULTRA|PLUS|FE|5G))?|NOTE\s*[0-9]{1,2})/i);
  if (samsungMatch) return `Samsung ${samsungMatch[1].toUpperCase()}`;

  const redmiMatch = clean.match(/(?:REDMI|XIAOMI|POCO)\s+(NOTE\s*[0-9]{1,2}[A-Z]?|[0-9]{1,2}[A-Z]?|[A-Z][0-9]+)/i);
  if (redmiMatch) return `Redmi ${redmiMatch[1].toUpperCase()}`;

  const tecnoMatch = clean.match(/TECNO\s+([A-Z0-9]+(?:\s*[0-9]+[A-Z]?)?)/i);
  if (tecnoMatch) return `Tecno ${tecnoMatch[1].toUpperCase()}`;

  const infinixMatch = clean.match(/INFINIX\s+([A-Z0-9]+(?:\s*[0-9]+[A-Z]?)?)/i);
  if (infinixMatch) return `Infinix ${infinixMatch[1].toUpperCase()}`;

  const honorMatch = clean.match(/HONOR\s+([A-Z0-9]+)/i);
  if (honorMatch) return `Honor ${honorMatch[1].toUpperCase()}`;

  const words = clean.replace(/^(LCD|BATTERY|TOUCH|GLASS|BACK GLASS|FLEX|SPEAKER|HOUSING)\s+/i, '').split(' ');
  return words.slice(0, 3).join(' ') || clean;
}

export function detectBrand(name: string, cat?: string): string {
  const upper = `${name} ${cat || ''}`.toUpperCase();
  if (upper.includes('IPHONE') || upper.includes('APPLE')) return 'Apple / iPhone';
  if (upper.includes('SAMSUNG')) return 'Samsung';
  if (upper.includes('REDMI') || upper.includes('XIAOMI') || upper.includes('POCO')) return 'Xiaomi / Redmi';
  if (upper.includes('TECNO')) return 'Tecno';
  if (upper.includes('INFINIX')) return 'Infinix';
  if (upper.includes('HONOR')) return 'Honor';
  if (upper.includes('HUAWEI')) return 'Huawei';
  if (upper.includes('OPPO') || upper.includes('REALME')) return 'Oppo / Realme';
  if (upper.includes('VIVO')) return 'Vivo';
  if (upper.includes('ITEL')) return 'Itel';
  if (upper.includes('ONEPLUS')) return 'OnePlus';
  return 'General Brand';
}

export function shuffleArray<T>(items: T[]): T[] {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
