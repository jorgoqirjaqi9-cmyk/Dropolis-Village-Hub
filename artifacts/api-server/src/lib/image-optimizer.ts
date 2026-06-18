/**
 * Server-side image optimization pipeline.
 *
 * - optimizeToWebP   : converts any image to WebP, quality-ladders until ≤ maxBytes
 * - createThumbnailWebP : resized WebP thumbnail
 * - slugifyFilename  : clean, SEO-safe `.webp` filename
 */

const QUALITY_LADDER = [82, 72, 62, 52, 42, 32, 24] as const;

export interface OptimizeOptions {
  /** Maximum output bytes. Default: 150 KB */
  maxBytes?: number;
  /** Resize longest edge to this px (no upscaling). Default: 1600 */
  maxPx?: number;
}

export interface ThumbnailOptions {
  /** Resize width to this px (no upscaling). Default: 600 */
  maxPx?: number;
  /** Maximum output bytes. Default: 120 KB */
  maxBytes?: number;
}

/**
 * Convert an image buffer to WebP, staying under maxBytes by iterating
 * through a quality ladder.  Always returns a Buffer — never throws on
 * quality degradation (uses quality 24 as absolute last resort).
 */
export async function optimizeToWebP(
  input: Buffer,
  options: OptimizeOptions = {}
): Promise<Buffer> {
  const { default: sharp } = await import("sharp");
  const maxBytes = options.maxBytes ?? 150 * 1024;
  const maxPx    = options.maxPx    ?? 1600;

  for (const quality of QUALITY_LADDER) {
    const out = await sharp(input)
      .resize(maxPx, null, { withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
    if (out.length <= maxBytes) return out;
  }

  // Last resort — use the lowest quality in the ladder
  return sharp(input)
    .resize(maxPx, null, { withoutEnlargement: true })
    .webp({ quality: QUALITY_LADDER[QUALITY_LADDER.length - 1] })
    .toBuffer();
}

/**
 * Create a small WebP thumbnail from a raw image buffer.
 */
export async function createThumbnailWebP(
  input: Buffer,
  options: ThumbnailOptions = {}
): Promise<Buffer> {
  return optimizeToWebP(input, {
    maxPx:    options.maxPx    ?? 600,
    maxBytes: options.maxBytes ?? 120 * 1024,
  });
}

// ---------------------------------------------------------------------------
// Filename sanitization
// ---------------------------------------------------------------------------

/** Known camera / phone filename prefixes to strip (case-insensitive). */
const CAMERA_PREFIX_RE =
  /^(dcim[-_\s]*|img[-_\s]*|dsc[fn]?[-_\s]*|dji[-_\s]*|p\d{4,}[-_\s]*|photo[-_\s]*|image[-_\s]*|screenshot[-_\s]*|wp[-_\s]*|pic[-_\s]*)/i;

/** Parenthesised copy counters like " (1)", "(2)" */
const COPY_COUNTER_RE = /\s*\(\d+\)/g;

/**
 * Turn a raw upload filename into a clean, SEO-friendly `.webp` slug.
 *
 * Examples:
 *   "DCIM_1234.jpg"          → "1234.webp"
 *   "IMG_20240615_142311.JPG" → "20240615-142311.webp"
 *   "My Photo (1).PNG"        → "my-photo-1.webp"
 *   "Φωτογραφία.jpeg"         → "photo.webp"   (non-ASCII falls back to "photo")
 */
export function slugifyFilename(original: string): string {
  // Strip extension
  const dotIdx = original.lastIndexOf(".");
  let base = dotIdx >= 0 ? original.slice(0, dotIdx) : original;

  // Strip camera prefixes
  base = base.replace(CAMERA_PREFIX_RE, "");

  // Remove copy counters "(1)"
  base = base.replace(COPY_COUNTER_RE, "");

  // Lowercase, collapse whitespace/underscores → dash
  base = base
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    // Keep only ASCII alphanumeric + dash
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

  return (base || "photo") + ".webp";
}
