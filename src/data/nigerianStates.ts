/**
 * One spelling per state, matching the backend (apps/common/nigeria.py).
 * Delivery quotes compare the designer's state with the shopper's, so free-text
 * values like "Lagos State" vs "Lagos" used to be quoted as interstate.
 */
export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Abuja (FCT)', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

const FCT_ALIASES = ['fct', 'abuja', 'abuja fct', 'fct abuja', 'fct - abuja', 'abuja (fct)', 'federal capital territory'];

/** "lagos state" -> "Lagos", "FCT - Abuja" -> "Abuja (FCT)". Unknown values are kept as typed. */
export const normalizeNigerianState = (raw?: string | null): string => {
  const value = (raw || '').trim().replace(/\s+/g, ' ');
  if (!value) return '';
  let key = value.toLowerCase();
  if (FCT_ALIASES.includes(key)) return 'Abuja (FCT)';
  if (key.endsWith(' state')) key = key.slice(0, -' state'.length).trim();
  return NIGERIAN_STATES.find((s) => s.toLowerCase() === key) || value;
};

/** Options for a state <select>, keeping an unrecognised saved value visible instead of silently replacing it. */
export const stateOptions = (current?: string | null): string[] => {
  const normalized = normalizeNigerianState(current);
  return normalized && !NIGERIAN_STATES.includes(normalized) ? [normalized, ...NIGERIAN_STATES] : NIGERIAN_STATES;
};
