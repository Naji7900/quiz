// Utility functions for phone model extraction, brand detection, and randomization

export function extractPhoneModel(partName: string, category: string = ''): string {
  const norm = ` ${partName.toUpperCase().replace(/[^A-Z0-9+]/g, ' ')} `.replace(/\s+/g, ' ');
  const catUpper = (category || '').toUpperCase();

  // 1. iPhone 16 down to 11 (Pro Max, Pro, Plus, Mini, standard)
  for (const num of [16, 15, 14, 13, 12, 11]) {
    if (new RegExp(`\\b${num}\\s*PRO\\s*MAX\\b`).test(norm)) return `iPhone ${num} Pro Max`;
    if (new RegExp(`\\b${num}\\s*PRO\\b`).test(norm)) return `iPhone ${num} Pro`;
    if (new RegExp(`\\b${num}\\s*PLUS\\b`).test(norm)) return `iPhone ${num} Plus`;
    if (new RegExp(`\\b${num}\\s*MINI\\b`).test(norm)) return `iPhone ${num} Mini`;
    if (new RegExp(`\\b(?:IPHONE\\s+|IP\\s+)?${num}\\b`).test(norm) && !/\b(NOTE|A|M|S)\s*[0-9]+\b/.test(norm)) {
      if (catUpper.includes('IPHONE') || /\bIPHONE\b/.test(norm) || /\bIP\b/.test(norm)) {
        return `iPhone ${num}`;
      }
    }
  }

  // iPhone X series (XS Max checked before XS)
  if (/\bXS\s*MAX\b/.test(norm)) return 'iPhone XS Max';
  if (/\bXR\b/.test(norm)) return 'iPhone XR';
  if (/\bXS\b/.test(norm)) return 'iPhone XS';
  if (/\b(IPHONE\s*X|IP\s*X)\b/.test(norm) || (/\bX\b/.test(norm) && catUpper.includes('IPHONE'))) return 'iPhone X';

  // Older iPhones: 8 Plus, 8, 7 Plus, 7, 6 Plus, 6S Plus, 6S, 6
  for (const num of [8, 7, 6]) {
    if (new RegExp(`\\b(?:IPHONE\\s+|IP\\s+)?${num}\\s*(?:S\\s*)?PLUS\\b`).test(norm)) return `iPhone ${num} Plus`;
    if (new RegExp(`\\b(?:IPHONE\\s+|IP\\s+)?${num}S\\b`).test(norm)) return `iPhone ${num}S`;
    if (new RegExp(`\\b(?:IPHONE\\s+|IP\\s+)?${num}[G]?\\b`).test(norm) && (catUpper.includes('IPHONE') || /\bIPHONE\b/.test(norm))) return `iPhone ${num}`;
  }

  if (/\bSE\s*[0-9]?\b/.test(norm) && (catUpper.includes('IPHONE') || /\bIPHONE\b/.test(norm))) return 'iPhone SE';

  // 2. Samsung A series, M series, S series, Note series (e.g. A12, A10, A20, A50, S20, Note 10)
  const samMatch = norm.match(/\b([AMS][0-9]{1,3}[A-Z]?(?:\s*(?:ULTRA|PLUS|FE|5G|4G))?|NOTE\s*[0-9]{1,2}(?:\s*(?:ULTRA|PLUS))?)\b/);
  if (samMatch) {
    return 'Samsung ' + samMatch[1].trim();
  }

  // 3. Redmi Note & number series (e.g. Note 8, Note 9, 9C, 9A, 10A, 12C)
  const redMatch = norm.match(/\b(NOTE\s*[0-9]{1,2}[A-Z]?|9A|9C|10A|10C|12C|A1\+|A1|A2|A3)\b/);
  if (redMatch && (catUpper.includes('REDMI') || /\bREDMI\b/.test(norm) || catUpper.includes('XIAOMI'))) {
    return 'Redmi ' + redMatch[1].trim();
  }

  // 4. Tecno / Infinix models (e.g. Spark 7, Spark 8, Spark 10, Hot 10, Hot 11, Smart 6, Pop 5)
  const tecMatch = norm.match(/\b(SPARK\s*[0-9]{1,2}[A-Z]?|HOT\s*[0-9]{1,2}[A-Z]?|SMART\s*[0-9]{1,2}[A-Z]?|POP\s*[0-9]{1,2}[A-Z]?|CAMON\s*[0-9]{1,2}[A-Z]?)\b/);
  if (tecMatch) {
    return tecMatch[1].trim();
  }

  // Fallback: strip known spare part descriptors and brand prefixes
  const clean = partName.trim().replace(/^(LCD|BATTERY|TOUCH|GLASS|BACK GLASS|BACKGLASS|FLEX|FLEX CHARGER|SPEAKER|HOUSING|BIRTA SWICH|SIM TRY|COVER|FINGER|USB|DD|JH|ZY|GX|SENSOR\s*\+?\s*SPEAKER|SENSOR|FLASH)\s+/i, '');
  const words = clean.split(/\s+/);
  return words.slice(0, 2).join(' ') || partName.trim();
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

/**
 * Generates a clean, readable, unique Part ID that differentiates identical product names
 * based on Company, Shipment (Air vs Sea), and Origin (Dubai vs China).
 * Example outputs:
 *  - "SP-13PM-ROYAL-AIR"
 *  - "SP-13PM-ROYAL-SEA"
 *  - "SP-13PM-DUBAIVX-AIR"
 *  - "SP-13PM-SEA"
 */
export function generatePartId(
  partName: string,
  companyName?: string,
  shippingMethod?: 'air' | 'sea' | string,
  origin?: 'Dubai' | 'China' | string,
  existingId?: string
): string {
  if (existingId && existingId.trim() && !existingId.startsWith('p-') && !existingId.startsWith('naji-') && !existingId.startsWith('row-') && !existingId.startsWith('restored-')) {
    return existingId.trim().toUpperCase();
  }

  // Model slug
  let nameSlug = (partName || 'PART')
    .toUpperCase()
    .replace(/^LCD\s+/i, '')
    .replace(/^BATTERY\s+/i, 'BAT-')
    .replace(/^FLEX\s+CHARGER\s+/i, 'FLX-')
    .replace(/\bIPHONE\b/gi, 'IP')
    .replace(/\bSAMSUNG\b/gi, 'SAM')
    .replace(/\bPRO\s+MAX\b/gi, 'PM')
    .replace(/\bPRO\b/gi, 'P')
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, 10);

  if (!nameSlug) nameSlug = 'PART';

  let compSlug = '';
  if (companyName && companyName.trim()) {
    compSlug = '-' + companyName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  }

  let shipSlug = '';
  if (shippingMethod === 'sea' || String(shippingMethod).toLowerCase().includes('sea')) {
    shipSlug = '-SEA';
  } else if (shippingMethod === 'air' || String(shippingMethod).toLowerCase().includes('air')) {
    shipSlug = '-AIR';
  }

  let originSlug = '';
  if (!shipSlug) {
    if (origin && origin.toLowerCase().includes('china')) originSlug = '-CN';
    else if (origin && origin.toLowerCase().includes('dubai')) originSlug = '-DXB';
  }

  return `SP-${nameSlug}${compSlug}${shipSlug || originSlug}`;
}

export function formatDisplayId(id?: string, fallbackName?: string, index?: number): string {
  if (id && id.trim()) {
    if (id.startsWith('naji-')) {
      const parts = id.split('-');
      const num = parts[1] || String((index || 0) + 1);
      return `SP-NAJI-${String(num).padStart(3, '0')}`;
    }
    if (id.startsWith('p-') || id.startsWith('row-') || id.startsWith('restored-')) {
      const num = String((index || 0) + 1).padStart(3, '0');
      return `SP-${num}`;
    }
    return id.trim();
  }
  return `SP-${String((index || 0) + 1).padStart(3, '0')}`;
}
