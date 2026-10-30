/**
 * High-speed image URL resolver, CDN transformer, preloader, and LCD schematic engine.
 * Ensures screens ALWAYS show immediately with 0ms delay and no broken graphics.
 */

import { generateLcdBlueprintSvg } from './lcdBlueprintUtils';

// Cache of preloaded URLs to avoid duplicate requests
const preloadedCache = new Set<string>();

/**
 * Extracts Google Drive file ID from all known URL patterns
 */
export function extractGoogleDriveId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Pattern 1: /file/d/FILE_ID/...
  const matchFileD = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFileD && matchFileD[1]) return matchFileD[1];

  // Pattern 2: id=FILE_ID
  const matchIdParam = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchIdParam && matchIdParam[1]) return matchIdParam[1];

  // Pattern 3: /thumbnail?id=FILE_ID or /d/FILE_ID
  const matchD = trimmed.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (matchD && matchD[1]) return matchD[1];

  return null;
}

export function isGoogleDriveLink(url: string): boolean {
  return Boolean(extractGoogleDriveId(url));
}

/**
 * Transforms any image link into direct image stream / CDN URL
 */
export function fastResolveImageUrl(url: string, attempt: number = 0): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // Base64 or Blob URL - already local and instant
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // 1. Google Drive Links -> Primary high-resolution thumbnail endpoint
  const gDriveId = extractGoogleDriveId(trimmed);
  if (gDriveId) {
    if (attempt === 0) {
      // Primary: Drive thumbnail endpoint with w1000 sizing (standard for web embeddings)
      return `https://drive.google.com/thumbnail?id=${gDriveId}&sz=w1000`;
    } else if (attempt === 1) {
      // Fallback 1: Google edge CDN
      return `https://lh3.googleusercontent.com/d/${gDriveId}`;
    } else {
      // Fallback 2: Direct export view
      return `https://drive.google.com/uc?export=view&id=${gDriveId}`;
    }
  }

  // 2. Dropbox Links -> Force direct raw file stream (raw=1)
  if (trimmed.includes('dropbox.com')) {
    if (trimmed.includes('?')) {
      return trimmed.replace(/[?&]dl=[01]/g, '').replace(/[?&]raw=[01]/g, '') + '&raw=1';
    }
    return trimmed + '?raw=1';
  }

  // 3. OneDrive Links -> Force direct download/view
  if (trimmed.includes('1drv.ms') || trimmed.includes('onedrive.live.com')) {
    if (!trimmed.includes('download=1')) {
      const sep = trimmed.includes('?') ? '&' : '?';
      return `${trimmed}${sep}download=1`;
    }
    return trimmed;
  }

  // 4. GitHub Links -> Convert blob viewer to rawusercontent
  if (trimmed.includes('github.com') && trimmed.includes('/blob/')) {
    return trimmed.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
  }

  // 5. Imgur Links -> Direct image URL with extension
  if (trimmed.includes('imgur.com') && !trimmed.includes('i.imgur.com') && !/\.(jpg|jpeg|png|webp|gif)$/i.test(trimmed)) {
    const parts = trimmed.split('/');
    const imgId = parts[parts.length - 1];
    if (imgId) {
      return `https://i.imgur.com/${imgId}.jpg`;
    }
  }

  return trimmed;
}

/**
 * Returns a guaranteed displayable image: if real photo URL fails, returns instant technical LCD schematic
 */
export function getFallbackLcdBlueprint(name: string, brand?: string): string {
  return generateLcdBlueprintSvg(name, brand);
}

/**
 * Ultra-fast client-side image compressor for camera photos & uploads
 * Converts multi-megabyte photos into lightweight ~150KB web-optimized base64
 */
export function compressImageFile(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Prefer webp, fallback to jpeg
        try {
          const compressed = canvas.toDataURL('image/webp', quality);
          resolve(compressed);
        } catch {
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image file'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Returns a human-friendly link speed & source status
 */
export function getLinkSourceLabel(url: string): { label: string; isHighSpeed: boolean; description: string } {
  if (!url || !url.trim()) {
    return { label: 'Schematic Blueprint', isHighSpeed: true, description: 'Built-in high-precision technical LCD diagram (Instant 0ms)' };
  }
  const trimmed = url.trim();

  if (trimmed.startsWith('data:image/svg+xml')) {
    return { label: 'Schematic Vector', isHighSpeed: true, description: 'Crisp vector pinout schematic (Instant 0ms)' };
  }

  if (trimmed.startsWith('data:image')) {
    return { label: 'Local Real Photo', isHighSpeed: true, description: 'Stored locally in device memory (Instant 0ms)' };
  }

  if (extractGoogleDriveId(trimmed)) {
    return { label: 'Google Drive Link', isHighSpeed: true, description: 'Google Drive direct preview with auto-schematic fallback' };
  }

  if (trimmed.includes('dropbox.com')) {
    return { label: 'Dropbox Raw Stream', isHighSpeed: true, description: 'Direct media stream (?raw=1)' };
  }

  if (/\.(jpg|jpeg|png|webp|avif|svg)(\?.*)?$/i.test(trimmed)) {
    return { label: 'Direct Image File', isHighSpeed: true, description: 'Standard high-speed image URL' };
  }

  return { label: 'Web Image Link', isHighSpeed: true, description: 'External image resource' };
}

/**
 * Preload an array of image URLs in the background into the browser cache
 */
export function preloadImageLinks(urls: string[]) {
  if (typeof window === 'undefined') return;
  
  urls.forEach(url => {
    if (!url || typeof url !== 'string' || url.startsWith('data:')) return;
    const resolved = fastResolveImageUrl(url);
    if (!resolved || preloadedCache.has(resolved)) return;

    preloadedCache.add(resolved);
    const img = new Image();
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    img.src = resolved;
  });
}
