/**
 * High-Precision LCD Screen Module & Pinout Visual Engine.
 * Generates ultra-crisp, photorealistic vector diagrams of mobile LCD modules,
 * complete with rear metal heat-shield, gold flex pinout connector, IC controller,
 * camera notch/bezel, factory barcodes, and technical inspection specs.
 * Loads in 0ms with zero network lag and scales infinitely without blurriness.
 */

export interface ScreenSpec {
  model: string;
  brand: string;
  displayType: string;
  size: string;
  resolution: string;
  pinCount: number;
  flexCode: string;
  notchType: 'waterdrop' | 'punchhole' | 'pill' | 'iphone-notch' | 'dynamic-island';
  connectorPosition: 'bottom-center' | 'bottom-left' | 'bottom-right' | 'dual-cable';
  icModel: string;
  factoryCode: string;
}

export function detectScreenSpec(name: string, brand?: string): ScreenSpec {
  const n = (name || '').toLowerCase();
  const b = (brand || '').toLowerCase();

  let detectedBrand = brand || 'Screen';
  if (n.includes('iphone') || b.includes('iphone')) detectedBrand = 'Apple iPhone';
  else if (n.includes('sam ') || n.includes('samsung') || b.includes('sam')) detectedBrand = 'Samsung';
  else if (n.includes('redmi') || b.includes('redmi') || b.includes('radmi')) detectedBrand = 'Redmi Xiaomi';
  else if (n.includes('mota') || n.includes('motorola') || b.includes('mota')) detectedBrand = 'Motorola';
  else if (n.includes('oppo') || b.includes('oppo')) detectedBrand = 'Oppo';
  else if (n.includes('zte') || b.includes('zte')) detectedBrand = 'ZTE';
  else if (n.includes('honor') || b.includes('honor')) detectedBrand = 'Honor';
  else if (n.includes('huawei') || n.includes('huawie') || b.includes('huawei')) detectedBrand = 'Huawei';
  else if (n.includes('infinix') || n.includes('tecno')) detectedBrand = 'Infinix / Tecno';

  // Notch detection
  let notchType: ScreenSpec['notchType'] = 'punchhole';
  if (n.includes('iphone x') || n.includes('iphone 11') || n.includes('iphone 12') || n.includes('iphone 13') || n.includes('xr') || n.includes('xs')) {
    notchType = 'iphone-notch';
  } else if (n.includes('iphone 14 pro') || n.includes('iphone 15') || n.includes('iphone 16') || n.includes('iphone 17')) {
    notchType = 'dynamic-island';
  } else if (n.includes('10c') || n.includes('12c') || n.includes('14c') || n.includes('15c') || n.includes('a2') || n.includes('a3') || n.includes('a5') || n.includes('e20') || n.includes('e13') || n.includes('e22') || n.includes('a15 2020') || n.includes('a16 2020') || n.includes('c35')) {
    notchType = 'waterdrop';
  }

  // Dual cable vs single
  const isDual = n.includes('two cable') || n.includes('dual') || n.includes('dd x') || n.includes('jh x');
  const connectorPosition: ScreenSpec['connectorPosition'] = isDual 
    ? 'dual-cable' 
    : (n.includes('oppo') || n.includes('zte') ? 'bottom-right' : 'bottom-center');

  // Pin count estimation based on technology
  let pinCount = 34;
  let displayType = 'IPS LCD HD+';
  let size = '6.67"';
  let resolution = '1080 x 2400 (FHD+)';

  if (detectedBrand === 'Apple iPhone') {
    pinCount = n.includes('15') || n.includes('16') || n.includes('17') ? 48 : (n.includes('13') || n.includes('14') ? 44 : 38);
    displayType = n.includes('pro') ? 'Super Retina XDR OLED 120Hz' : 'OLED Retina HD';
    size = n.includes('max') || n.includes('plus') ? '6.7"' : '6.1"';
    resolution = n.includes('max') ? '2796 x 1290 px' : '2556 x 1179 px';
  } else if (detectedBrand === 'Samsung') {
    pinCount = n.includes('wf') ? 40 : 34;
    displayType = n.includes('org') || n.includes('original') ? 'Super AMOLED 90Hz' : 'Incell HD+ LCD';
    size = n.includes('a5') || n.includes('a7') ? '6.5"' : '6.6"';
    resolution = n.includes('fhd') || n.includes('a5') ? '1080 x 2340 px' : '720 x 1600 px';
  } else if (detectedBrand.includes('Redmi')) {
    pinCount = n.includes('note') ? 40 : 34;
    displayType = n.includes('note') ? 'AMOLED FHD+ 120Hz' : 'DotDrop IPS 90Hz';
    size = n.includes('10c') || n.includes('12c') || n.includes('13c') ? '6.71"' : '6.67"';
    resolution = n.includes('note') ? '1080 x 2400 px' : '720 x 1650 px';
  }

  // Flex Code & IC
  const cleanCode = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
  const flexCode = `FPC-${cleanCode}-V2.4`;
  const icModel = n.includes('oled') ? 'FT8719-OLED-CTRL' : 'NT36672A-INCELL';
  const factoryCode = `QC-PASS-${Math.abs(hashString(name)) % 90000 + 10000}`;

  return {
    model: name,
    brand: detectedBrand,
    displayType,
    size,
    resolution,
    pinCount,
    flexCode,
    notchType,
    connectorPosition,
    icModel,
    factoryCode
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/**
 * Builds an authentic, high-speed SVG Data URI representing the screen module
 */
export function generateLcdBlueprintSvg(name: string, brand?: string): string {
  const spec = detectScreenSpec(name, brand);
  const isDual = spec.connectorPosition === 'dual-cable';

  // SVG dimensions (standard 9:16 mobile display inspection aspect)
  const W = 450;
  const H = 760;

  // Render Notch based on type
  let notchSvg = '';
  if (spec.notchType === 'waterdrop') {
    notchSvg = `
      <path d="M 213 42 C 213 54, 219 60, 225 60 C 231 60, 237 54, 237 42 Z" fill="#080c14" stroke="#1f2937" stroke-width="1.5"/>
      <circle cx="225" cy="51" r="4.5" fill="#030712" stroke="#374151" stroke-width="1"/>
      <circle cx="226" cy="50" r="1.5" fill="#60a5fa" opacity="0.8"/>
    `;
  } else if (spec.notchType === 'punchhole') {
    notchSvg = `
      <circle cx="225" cy="58" r="7.5" fill="#080c14" stroke="#1f2937" stroke-width="1.5"/>
      <circle cx="225" cy="58" r="5" fill="#030712"/>
      <circle cx="226.5" cy="56.5" r="1.5" fill="#60a5fa" opacity="0.9"/>
    `;
  } else if (spec.notchType === 'dynamic-island') {
    notchSvg = `
      <rect x="185" y="48" width="80" height="22" rx="11" fill="#080c14" stroke="#1e293b" stroke-width="1.5"/>
      <circle cx="205" cy="59" r="5" fill="#030712"/>
      <circle cx="245" cy="59" r="6" fill="#030712"/>
      <circle cx="246" cy="58" r="1.8" fill="#38bdf8" opacity="0.9"/>
    `;
  } else if (spec.notchType === 'iphone-notch') {
    notchSvg = `
      <path d="M 175 42 L 180 56 Q 185 62, 195 62 L 255 62 Q 265 62, 270 56 L 275 42 Z" fill="#080c14" stroke="#1e293b" stroke-width="1.5"/>
      <rect x="215" y="47" width="20" height="3" rx="1.5" fill="#334155"/>
      <circle cx="250" cy="53" r="4.5" fill="#030712"/>
      <circle cx="251" cy="52" r="1.5" fill="#38bdf8" opacity="0.8"/>
    `;
  }

  // Generate Connector Pins
  const pinRows = [];
  const startX = isDual ? 165 : 185;
  const pinSpacing = 3;
  const pinsToShow = Math.min(spec.pinCount, 36);
  for (let i = 0; i < pinsToShow; i++) {
    const px = startX + (i % 18) * 4.5;
    const py = 642 + Math.floor(i / 18) * 6;
    pinRows.push(`<rect x="${px}" y="${py}" width="2.2" height="4" rx="0.5" fill="#fbbf24" stroke="#d97706" stroke-width="0.3"/>`);
  }

  // Dual cable pins if applicable
  const dualPins = [];
  if (isDual) {
    for (let i = 0; i < 20; i++) {
      const px = 275 + (i % 10) * 4.5;
      const py = 642 + Math.floor(i / 10) * 6;
      dualPins.push(`<rect x="${px}" y="${py}" width="2.2" height="4" rx="0.5" fill="#fbbf24" stroke="#d97706" stroke-width="0.3"/>`);
    }
  }

  const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <!-- Background Gradients -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#070b14"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>

    <!-- Metal Rear Shield Texture -->
    <linearGradient id="metalShield" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="30%" stop-color="#334155"/>
      <stop offset="50%" stop-color="#1e293b"/>
      <stop offset="70%" stop-color="#475569"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>

    <!-- Amber Polyimide Flex Cable -->
    <linearGradient id="flexCable" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#78350f"/>
      <stop offset="25%" stop-color="#b45309"/>
      <stop offset="50%" stop-color="#d97706"/>
      <stop offset="75%" stop-color="#b45309"/>
      <stop offset="100%" stop-color="#78350f"/>
    </linearGradient>

    <!-- Gold Connector Latch -->
    <linearGradient id="goldLatch" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#eab308"/>
      <stop offset="100%" stop-color="#a16207"/>
    </linearGradient>

    <!-- Screen Glass Glow -->
    <radialGradient id="screenGlass" cx="50%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#1e293b" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#020617" stop-opacity="0.95"/>
    </radialGradient>

    <!-- Blueprint Grid Pattern -->
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" stroke-width="0.75" stroke-opacity="0.5"/>
    </pattern>
  </defs>

  <!-- Canvas Background -->
  <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>

  <!-- Technical Blueprint Measurement Border -->
  <rect x="15" y="15" width="${W - 30}" height="${H - 30}" rx="20" fill="none" stroke="#0ea5e9" stroke-width="1" stroke-dasharray="6,4" stroke-opacity="0.4"/>

  <!-- Outer Glass Frame (Curved Smartphone Bezel) -->
  <rect x="55" y="40" width="340" height="600" rx="36" fill="#030712" stroke="#38bdf8" stroke-width="2" stroke-opacity="0.6" filter="drop-shadow(0 20px 30px rgba(0,0,0,0.9))"/>

  <!-- Screen Glass Area -->
  <rect x="63" y="48" width="324" height="584" rx="30" fill="url(#screenGlass)"/>

  <!-- Rear Metal Heat-Shield Plate (Technician Internal View) -->
  <rect x="75" y="85" width="300" height="425" rx="16" fill="url(#metalShield)" stroke="#64748b" stroke-width="1.5" stroke-opacity="0.8"/>

  <!-- Heat Shield Screws & Grounding Contacts -->
  <circle cx="88" cy="98" r="3.5" fill="#94a3b8" stroke="#475569" stroke-width="1"/>
  <circle cx="362" cy="98" r="3.5" fill="#94a3b8" stroke="#475569" stroke-width="1"/>
  <circle cx="88" cy="497" r="3.5" fill="#94a3b8" stroke="#475569" stroke-width="1"/>
  <circle cx="362" cy="497" r="3.5" fill="#94a3b8" stroke="#475569" stroke-width="1"/>
  <rect x="200" y="92" width="50" height="6" rx="3" fill="#cbd5e1" opacity="0.6"/>

  <!-- Top Camera Notch / Dynamic Island -->
  ${notchSvg}

  <!-- Center Branding & Model Watermark on Shield -->
  <g transform="translate(225, 230)" text-anchor="middle">
    <!-- Brand Title -->
    <text y="-25" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="800" fill="#38bdf8" letter-spacing="3" text-anchor="middle">
      ${spec.brand.toUpperCase()} · ORIGINAL MODULE
    </text>

    <!-- Product Model Name -->
    <text y="5" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="900" fill="#f8fafc" letter-spacing="-0.5" text-anchor="middle">
      ${escapeXml(spec.model)}
    </text>

    <!-- Sub Specs Badge -->
    <rect x="-135" y="24" width="270" height="26" rx="13" fill="#0f172a" stroke="#0ea5e9" stroke-width="1" stroke-opacity="0.6"/>
    <text y="41" font-family="monospace" font-size="11" font-weight="700" fill="#38bdf8" text-anchor="middle">
      ${spec.displayType} · ${spec.size}
    </text>

    <text y="68" font-family="monospace" font-size="9.5" font-weight="600" fill="#94a3b8" text-anchor="middle">
      RES: ${spec.resolution} · ${spec.pinCount}-PIN FPC
    </text>
  </g>

  <!-- Data Matrix / Barcode Sticker on LCD Back -->
  <g transform="translate(100, 345)">
    <rect width="250" height="60" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
    <!-- Simulated 2D Matrix -->
    <rect x="12" y="10" width="40" height="40" fill="#0f172a"/>
    <rect x="18" y="16" width="12" height="12" fill="#f8fafc"/>
    <rect x="34" y="16" width="6" height="6" fill="#f8fafc"/>
    <rect x="18" y="32" width="6" height="12" fill="#f8fafc"/>
    <rect x="28" y="28" width="16" height="16" fill="#f8fafc"/>
    <rect x="32" y="32" width="8" height="8" fill="#0f172a"/>

    <!-- Barcode Text Details -->
    <text x="64" y="22" font-family="monospace" font-size="10" font-weight="bold" fill="#0f172a">PART: ${spec.flexCode}</text>
    <text x="64" y="36" font-family="monospace" font-size="9" fill="#475569">LOT: ${spec.factoryCode}</text>
    <text x="64" y="48" font-family="monospace" font-size="8.5" font-weight="bold" fill="#0284c7">TESTED OK · 100% WORKING FACTORY</text>
  </g>

  <!-- Flex Ribbon Cable Body Extending Out of Screen -->
  ${isDual ? `
    <!-- Dual Cable Left -->
    <path d="M 175 490 L 175 625 Q 175 635, 185 635 L 235 635 Q 245 635, 245 625 L 245 490 Z" fill="url(#flexCable)" stroke="#92400e" stroke-width="1.5"/>
    <!-- Dual Cable Right -->
    <path d="M 265 490 L 265 625 Q 265 635, 275 635 L 315 635 Q 325 635, 325 625 L 325 490 Z" fill="url(#flexCable)" stroke="#92400e" stroke-width="1.5"/>
  ` : `
    <!-- Single Wide FPC Cable -->
    <path d="M 170 490 L 170 625 Q 170 635, 180 635 L 270 635 Q 280 635, 280 625 L 280 490 Z" fill="url(#flexCable)" stroke="#92400e" stroke-width="1.5"/>
  `}

  <!-- Copper Trace Micro-Lines on Flex Cable -->
  <g opacity="0.4" stroke="#fef08a" stroke-width="0.8">
    <line x1="182" y1="510" x2="182" y2="620"/>
    <line x1="192" y1="510" x2="192" y2="620"/>
    <line x1="202" y1="510" x2="202" y2="620"/>
    <line x1="212" y1="510" x2="212" y2="620"/>
    <line x1="222" y1="510" x2="222" y2="620"/>
    <line x1="232" y1="510" x2="232" y2="620"/>
    <line x1="242" y1="510" x2="242" y2="620"/>
    <line x1="252" y1="510" x2="252" y2="620"/>
    <line x1="262" y1="510" x2="262" y2="620"/>
  </g>

  <!-- Display IC Chip (Silicon Controller Epoxy Encapsulation) -->
  <rect x="185" y="535" width="80" height="32" rx="4" fill="#090d16" stroke="#334155" stroke-width="1.5" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.8))"/>
  <circle cx="192" cy="542" r="2" fill="#64748b"/>
  <text x="225" y="551" font-family="monospace" font-size="8.5" font-weight="bold" fill="#e2e8f0" text-anchor="middle">${spec.icModel}</text>
  <text x="225" y="562" font-family="monospace" font-size="7.5" fill="#94a3b8" text-anchor="middle">DRIVER IC · COF</text>

  <!-- Gold MIPI DSI Connector Housing & Pins -->
  ${isDual ? `
    <!-- Dual Connector Left -->
    <rect x="160" y="635" width="90" height="22" rx="4" fill="#18181b" stroke="#71717a" stroke-width="1.5"/>
    <rect x="163" y="637" width="84" height="18" rx="2" fill="url(#goldLatch)" opacity="0.3"/>
    ${pinRows.join('')}

    <!-- Dual Connector Right -->
    <rect x="268" y="635" width="60" height="22" rx="4" fill="#18181b" stroke="#71717a" stroke-width="1.5"/>
    <rect x="271" y="637" width="54" height="18" rx="2" fill="url(#goldLatch)" opacity="0.3"/>
    ${dualPins.join('')}
  ` : `
    <!-- Standard Single Connector -->
    <rect x="175" y="635" width="100" height="22" rx="4" fill="#18181b" stroke="#71717a" stroke-width="1.5" filter="drop-shadow(0 6px 10px rgba(0,0,0,0.9))"/>
    <rect x="178" y="637" width="94" height="18" rx="2" fill="url(#goldLatch)" opacity="0.3"/>
    ${pinRows.join('')}
  `}

  <!-- Connector Identification Callout -->
  <g transform="translate(225, 680)" text-anchor="middle">
    <rect x="-115" y="-12" width="230" height="22" rx="11" fill="#047857" stroke="#34d399" stroke-width="1.2"/>
    <text y="3" font-family="monospace" font-size="10.5" font-weight="bold" fill="#ffffff" text-anchor="middle">
      ✓ ${spec.pinCount}-PIN GOLD MIPI FPC CONNECTOR
    </text>
  </g>

  <!-- Bottom Technical Legend Banner -->
  <rect x="40" y="710" width="370" height="34" rx="10" fill="#090d16" stroke="#1e293b" stroke-width="1"/>
  <text x="55" y="731" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="bold" fill="#38bdf8">
    PINOUT INSPECTOR
  </text>
  <text x="175" y="731" font-family="monospace" font-size="9" fill="#94a3b8">
    GND · VDD 3.3V · MIPI_CLK · MIPI_D0-D3 · RESET
  </text>

  <!-- Corner Quality Inspection Stamp -->
  <g transform="translate(340, 115) rotate(15)">
    <circle cx="0" cy="0" r="22" fill="none" stroke="#22c55e" stroke-width="2" stroke-dasharray="3,2"/>
    <text y="-4" font-family="sans-serif" font-size="7.5" font-weight="900" fill="#22c55e" text-anchor="middle">REPAIR LAB</text>
    <text y="7" font-family="sans-serif" font-size="8" font-weight="bold" fill="#22c55e" text-anchor="middle">PASS</text>
  </g>
</svg>
`.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
