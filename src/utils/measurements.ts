/**
 * Shared rules for shopper measurements: names, which ones are estimates, and the checks
 * that stop impossible numbers reaching a designer. The server checks the same limits
 * (apps/common/measurements.py); keep the two in step.
 */
import type { BespokeMeasurements } from '../types';

/** Keys that describe the measurements rather than being one. */
export const META_KEYS = [
  'unit', 'category_type', 'notes', 'estimated_ranges', 'estimated_fields', 'fit_source',
  'height_snapshot', 'size_snapshot', 'sex', 'measured_on', 'gender',
];

/** Plain names and absolute limits (inches). Outside these the number can't be a real body. */
export const MEASUREMENT_LIMITS: Record<string, { label: string; min: number; max: number }> = {
  chest_bust: { label: 'Bust / chest', min: 24, max: 75 },
  underbust: { label: 'Underbust', min: 20, max: 65 },
  waist: { label: 'Waist', min: 18, max: 75 },
  hips: { label: 'Hips', min: 24, max: 80 },
  shoulder: { label: 'Shoulder width', min: 10, max: 30 },
  neck_collar: { label: 'Neck', min: 10, max: 28 },
  sleeve_length: { label: 'Sleeve length', min: 6, max: 40 },
  sleeve_circumference: { label: 'Arm (bicep)', min: 6, max: 30 },
  top_length: { label: 'Length', min: 10, max: 75 },
  trouser_length: { label: 'Trouser length', min: 15, max: 55 },
  inseam: { label: 'Inseam', min: 15, max: 45 },
  thigh: { label: 'Thigh', min: 12, max: 45 },
  ankle_opening: { label: 'Ankle opening', min: 6, max: 30 },
  shoulder_to_underbust: { label: 'Shoulder to underbust', min: 6, max: 25 },
  head: { label: 'Head', min: 17, max: 28 },
};

export const measurementLabel = (key: string): string =>
  MEASUREMENT_LIMITS[key]?.label || key.replace(/_/g, ' ');

/** The measurement entries (not the labels), in a stable order. */
export const measurementEntries = (m: BespokeMeasurements | null | undefined): [string, string][] => {
  if (!m) return [];
  return Object.entries(m)
    .filter(([k, v]) => !META_KEYS.includes(k) && v !== undefined && v !== null && v !== '' && typeof v !== 'object' && !isNaN(Number(v)))
    .map(([k, v]) => [k, String(v)] as [string, string]);
};

/** Which measurements are estimates (worked out from size and height), not measured. */
export const estimatedFields = (m: BespokeMeasurements | null | undefined): string[] => {
  if (!m) return [];
  if (Array.isArray(m.estimated_fields)) return m.estimated_fields as string[];
  // Orders placed before Nov 2026 only said "estimator" for the whole set.
  if (typeof m.fit_source === 'string' && m.fit_source.startsWith('smart_estimator')) {
    return measurementEntries(m).map(([k]) => k);
  }
  return [];
};

export const isEstimated = (m: BespokeMeasurements | null | undefined): boolean => estimatedFields(m).length > 0;

export const isFromGarment = (m: BespokeMeasurements | null | undefined): boolean =>
  !!m && (m.measured_on === 'garment' || m.fit_source === 'garment_flat');

/**
 * Hard check for one number. Returns a message when it can't be right (blocks saving),
 * or null when it's fine. Catches centimetres typed while the unit is inches.
 */
export const measurementError = (key: string, raw: string, unit: 'IN' | 'CM'): string | null => {
  if (!raw || !raw.trim()) return null;
  const n = parseFloat(raw);
  if (isNaN(n) || n <= 0) return 'Please enter a number.';
  const lim = MEASUREMENT_LIMITS[key];
  if (!lim) return null;
  const inches = unit === 'CM' ? n / 2.54 : n;
  if (unit === 'IN' && inches > lim.max && inches / 2.54 >= lim.min && inches / 2.54 <= lim.max) {
    return `${n} looks like centimetres. Switch to cm at the top, or enter it in inches.`;
  }
  if (inches < lim.min || inches > lim.max) {
    const lo = unit === 'CM' ? Math.round(lim.min * 2.54) : lim.min;
    const hi = unit === 'CM' ? Math.round(lim.max * 2.54) : lim.max;
    return `That can't be right. Expected between ${lo} and ${hi} ${unit === 'CM' ? 'cm' : 'in'}. Please measure again.`;
  }
  return null;
};

/** Checks between fields (e.g. underbust bigger than bust usually means two were swapped). */
export const crossFieldErrors = (values: Record<string, string>): string[] => {
  const n = (k: string) => parseFloat(values[k]);
  const out: string[] = [];
  if (n('underbust') > 0 && n('chest_bust') > 0 && n('underbust') > n('chest_bust')) {
    out.push('Underbust is bigger than full bust. Please check both.');
  }
  if (n('inseam') > 0 && n('trouser_length') > 0 && n('inseam') >= n('trouser_length')) {
    out.push('Inseam must be shorter than the full trouser length. Please check both.');
  }
  return out;
};
