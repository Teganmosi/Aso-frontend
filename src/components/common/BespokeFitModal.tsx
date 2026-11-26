import React, { useState, useEffect } from 'react';
import {
  Scissors,
  X,
  CheckCircle2,
  AlertCircle,
  Save,
  Zap,
  Info,
  Target,
  ArrowRight,
  Ruler,
} from 'lucide-react';
import type { BespokeMeasurements } from '../../types';
import { measurementsApi, fitApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  crossFieldErrors,
  estimatedFields,
  isFromGarment,
  measurementEntries,
  measurementError,
  measurementLabel,
} from '../../utils/measurements';
import './BespokeFitModal.css';

interface BespokeFitModalProps {
  isOpen: boolean;
  onClose: () => void;
  productTitle?: string;
  categoryName?: string;
  categorySlug?: string;
  garmentTypeHint?: string;
  currentMeasurements?: BespokeMeasurements | null;
  onApplyMeasurements: (measurements: BespokeMeasurements) => void;
  /** Who the piece is for, from the product (null when it can't be told: then we ask). */
  wearer?: 'female' | 'male' | null;
}

export type GarmentType = 'full_set' | 'tops_senator' | 'trousers' | 'corset_gown' | 'boubou';

interface FieldConfig {
  key: string;
  label: string;
  placeholder: string;
  tip: string;
  minIn: number;
  maxIn: number;
}

export interface RangeEstimate {
  min: number;
  max: number;
  target: number;
  bracket: string;
}

const FIELD_CONFIGS: Record<GarmentType, FieldConfig[]> = {
  full_set: [
    { key: 'chest_bust', label: 'Bust / Chest', placeholder: 'e.g. 38', tip: 'Widest circumference around chest/bust', minIn: 28, maxIn: 65 },
    { key: 'shoulder', label: 'Shoulder Width', placeholder: 'e.g. 18', tip: 'Across back from shoulder bone to shoulder bone', minIn: 13, maxIn: 26 },
    { key: 'waist', label: 'Waist', placeholder: 'e.g. 32', tip: 'Around your natural waistband', minIn: 22, maxIn: 60 },
    { key: 'hips', label: 'Hips', placeholder: 'e.g. 42', tip: 'Fullest circumference around hips and buttocks', minIn: 28, maxIn: 70 },
    { key: 'top_length', label: 'Jacket / Blazer / Top Length', placeholder: 'e.g. 26', tip: 'From high shoulder down to jacket/blazer hemline', minIn: 20, maxIn: 55 },
    { key: 'sleeve_length', label: 'Sleeve Length', placeholder: 'e.g. 25', tip: 'Shoulder bone to wrist bone', minIn: 15, maxIn: 38 },
    { key: 'trouser_length', label: 'Trouser / Bottom Length', placeholder: 'e.g. 41', tip: 'Waistline straight down to ankle or hemline', minIn: 25, maxIn: 50 },
    { key: 'thigh', label: 'Thigh / Lap Circumference', placeholder: 'e.g. 24', tip: 'Around the fullest part of the upper thigh', minIn: 16, maxIn: 38 },
  ],
  tops_senator: [
    { key: 'chest_bust', label: 'Chest Circumference', placeholder: 'e.g. 40', tip: 'Under armpits around fullest part of chest', minIn: 28, maxIn: 65 },
    { key: 'shoulder', label: 'Shoulder Width', placeholder: 'e.g. 19', tip: 'Crucial for clean Senator/Kaftan drape', minIn: 13, maxIn: 26 },
    { key: 'sleeve_length', label: 'Sleeve Length', placeholder: 'e.g. 26', tip: 'From shoulder tip down to wrist', minIn: 15, maxIn: 38 },
    { key: 'top_length', label: 'Top / Senator Length', placeholder: 'e.g. 38', tip: 'High shoulder down to knee or desired hem', minIn: 20, maxIn: 60 },
    { key: 'neck_collar', label: 'Neck / Collar Circumference', placeholder: 'e.g. 16.5', tip: 'Base of neck + 1 finger comfort gap for crisp collar', minIn: 12, maxIn: 24 },
    { key: 'sleeve_circumference', label: 'Bicep / Arm Circumference', placeholder: 'e.g. 14', tip: 'Around widest upper arm', minIn: 9, maxIn: 26 },
    { key: 'waist', label: 'Trouser Waist (if 2-piece set)', placeholder: 'e.g. 34', tip: 'Where you normally buckle trousers (for matching trouser sets)', minIn: 22, maxIn: 60 },
    { key: 'trouser_length', label: 'Trouser Length (if 2-piece set)', placeholder: 'e.g. 41', tip: 'Waistline straight down to ankle/shoe top', minIn: 30, maxIn: 52 },
  ],
  corset_gown: [
    { key: 'chest_bust', label: 'Full Bust', placeholder: 'e.g. 36', tip: 'Across the fullest point of bust with bra on', minIn: 26, maxIn: 60 },
    { key: 'underbust', label: 'Underbust (Corset Boning)', placeholder: 'e.g. 30', tip: 'Ribcage right below breast tissue for cup support', minIn: 22, maxIn: 52 },
    { key: 'waist', label: 'High / Natural Waist', placeholder: 'e.g. 28', tip: 'Narrowest point of torso where corset snatches', minIn: 20, maxIn: 56 },
    { key: 'hips', label: 'Full Hips', placeholder: 'e.g. 40', tip: 'Fullest point around butt & hips for mermaid/pencil flare', minIn: 28, maxIn: 70 },
    { key: 'shoulder_to_underbust', label: 'Shoulder to Underbust', placeholder: 'e.g. 14', tip: 'Shoulder seam down to bust cup base', minIn: 10, maxIn: 22 },
    { key: 'top_length', label: 'Full Dress Length', placeholder: 'e.g. 58', tip: 'Shoulder down to floor (with heels)', minIn: 32, maxIn: 70 },
    { key: 'sleeve_length', label: 'Sleeve Length', placeholder: 'e.g. 23', tip: 'Shoulder seam to wrist/elbow', minIn: 10, maxIn: 36 },
  ],
  boubou: [
    { key: 'chest_bust', label: 'Bust Circumference', placeholder: 'e.g. 40', tip: 'Widest point of chest/bust with bra', minIn: 28, maxIn: 65 },
    { key: 'hips', label: 'Hips / Seat', placeholder: 'e.g. 44', tip: 'Fullest point around hips for free flowing drape', minIn: 28, maxIn: 70 },
    { key: 'top_length', label: 'Full Boubou Length', placeholder: 'e.g. 58', tip: 'From high shoulder down to floor/ankle', minIn: 42, maxIn: 70 },
    { key: 'sleeve_length', label: 'Sleeve Length', placeholder: 'e.g. 23', tip: 'Shoulder seam to wrist or 3/4 drape', minIn: 10, maxIn: 36 },
  ],
  trousers: [
    { key: 'waist', label: 'Trouser Waist', placeholder: 'e.g. 34', tip: 'Where you normally buckle your trousers', minIn: 22, maxIn: 60 },
    { key: 'hips', label: 'Hips / Seat', placeholder: 'e.g. 41', tip: 'Fullest circumference around seat', minIn: 28, maxIn: 70 },
    { key: 'trouser_length', label: 'Trouser Outseam Length', placeholder: 'e.g. 42', tip: 'Waist down to shoe top', minIn: 30, maxIn: 52 },
    { key: 'inseam', label: 'Inseam', placeholder: 'e.g. 32', tip: 'Crotch seam down to bottom ankle', minIn: 24, maxIn: 40 },
    { key: 'thigh', label: 'Thigh Circumference', placeholder: 'e.g. 25', tip: 'Upper thigh around fullest point', minIn: 16, maxIn: 38 },
    { key: 'ankle_opening', label: 'Ankle Opening Circumference', placeholder: 'e.g. 14', tip: 'Circumference at trouser bottom opening', minIn: 10, maxIn: 24 },
  ],
};

export interface DetectedGarmentResult {
  type: GarmentType;
  label: string;
  isAutoDetected: boolean;
}

export const detectGarmentType = (
  cat: string = '',
  title: string = '',
  hint: string = '',
  slug: string = ''
): DetectedGarmentResult => {
  // Size-chart settings such as "DRESS_AND_SUIT" or "TAILORED" describe the chart or the fit, not the
  // outfit, and used to turn gowns into "two-piece suits". Only free-text hints count.
  const normHint = /^[A-Z_]+$/.test((hint || '').trim()) ? '' : (hint || '').toLowerCase();
  const normTitle = (title || '').toLowerCase();
  const normCat = (cat || '').toLowerCase();
  const normSlug = (slug || '').toLowerCase();

  // Combine title and designer hint for high-specificity garment keyword matching
  const specificText = `${normHint} ${normTitle}`.trim();
  const fullContext = `${normHint} ${normCat} ${normSlug} ${normTitle}`.trim();

  // 0. Agbada / kaftan / dashiki in the title win over everything else: an "Agbada Set"
  //    or "Kaftan Suit" is cut as a flowing native set, not a western two-piece suit.
  if (/(agbada|kaftan|caftan|dashiki|jalabiya)/.test(normTitle) || /(agbada|kaftan)/.test(normHint)) {
    return { type: 'tops_senator', label: 'Kaftan / Agbada Cut', isAutoDetected: true };
  }

  // 1. Two-Piece Tailored Suits, Work Suits, Pantsuits, Blazers, Tuxedos, Co-ords
  // Check title first: "Female royal work suit" must be detected as a Suit, NOT a Corset Gown!
  if (
    specificText.includes('suit') ||
    specificText.includes('blazer') ||
    specificText.includes('pantsuit') ||
    specificText.includes('two-piece') ||
    specificText.includes('2-piece') ||
    specificText.includes('co-ord') ||
    specificText.includes('matching set') ||
    specificText.includes('tuxedo') ||
    (fullContext.includes('suit') && !fullContext.includes('swimsuit'))
  ) {
    // If it's explicitly a Senator suit, map to senator cut
    if (specificText.includes('senator')) {
      return {
        type: 'tops_senator',
        label: 'Senator Cut (Tunic & Set)',
        isAutoDetected: true,
      };
    }
    return {
      type: 'full_set',
      label: 'Two-Piece Suit / Tailored Set Cut',
      isAutoDetected: true,
    };
  }

  // 2. Senator Outfits & Tunics
  if (specificText.includes('senator') || fullContext.includes('senator')) {
    return {
      type: 'tops_senator',
      label: 'Senator Cut (Tunic & Set)',
      isAutoDetected: true,
    };
  }

  // 3. Kaftans, Agbadas, Dashikis, Native Tunics, Shirts
  if (
    specificText.includes('kaftan') ||
    specificText.includes('agbada') ||
    specificText.includes('tunic') ||
    specificText.includes('dashiki') ||
    specificText.includes('jalabiya') ||
    specificText.includes('shirt')
  ) {
    return {
      type: 'tops_senator',
      label: 'Kaftan / Agbada Cut',
      isAutoDetected: true,
    };
  }

  // 4. Boubou / Rich Auntie Gowns / Abayas (Loose flowing drapes, no boning)
  if (
    specificText.includes('boubou') ||
    specificText.includes('bubu') ||
    specificText.includes('rich auntie') ||
    specificText.includes('abaya')
  ) {
    return {
      type: 'boubou',
      label: 'Boubou / Rich Auntie Gown Cut',
      isAutoDetected: true,
    };
  }

  // 5. Trousers, Pants, Palazzos, Shorts
  if (
    specificText.includes('trouser') ||
    specificText.includes('pant') ||
    specificText.includes('palazzo') ||
    specificText.includes('short') ||
    specificText.includes('jogger')
  ) {
    return {
      type: 'trousers',
      label: 'Trousers / Pants Cut',
      isAutoDetected: true,
    };
  }

  // 6. Corsets & Snatched Boned Bodices
  if (
    specificText.includes('corset') ||
    specificText.includes('boned') ||
    specificText.includes('snatched')
  ) {
    return {
      type: 'corset_gown',
      label: 'Corset / Boned Gown Cut',
      isAutoDetected: true,
    };
  }

  // 7. Gowns, Dresses, Aso Ebi, Iro & Buba, Skirts
  // Note: NEVER match on generic 'women'! Women wear suits, trousers, boubous, and shirts too!
  if (
    specificText.includes('gown') ||
    specificText.includes('dress') ||
    specificText.includes('skirt') ||
    specificText.includes('aso ebi') ||
    specificText.includes('iro') ||
    specificText.includes('buba') ||
    normCat.includes('gown') ||
    normCat.includes('dress')
  ) {
    return {
      type: 'corset_gown',
      label: 'Gown / Dress Cut',
      isAutoDetected: true,
    };
  }

  // Fallback: Default to Two-Piece / Tailored Cut
  return {
    type: 'full_set',
    label: 'Two-Piece / Tailored Cut',
    isAutoDetected: false,
  };
};


// What the designer can't cut without, per cut. Saving is blocked until these are filled.
const REQUIRED_FIELDS: Record<GarmentType, string[]> = {
  full_set: ['chest_bust', 'shoulder', 'waist', 'hips', 'top_length', 'sleeve_length', 'trouser_length'],
  tops_senator: ['chest_bust', 'shoulder', 'sleeve_length', 'top_length', 'neck_collar'],
  corset_gown: ['chest_bust', 'underbust', 'waist', 'hips', 'top_length'],
  boubou: ['chest_bust', 'hips', 'top_length'],
  trousers: ['waist', 'hips', 'trouser_length'],
};

// How to take each measurement from clothes that already fit well (laid flat on a table).
const GARMENT_TIPS: Record<string, string> = {
  chest_bust: 'Lay the top flat, buttoned. Measure straight across from armpit to armpit, then double it.',
  underbust: 'On a fitted dress or bodice: measure across just under the bust seam, then double it.',
  waist: 'Trousers or skirt flat and closed: measure straight across the waistband, then double it.',
  hips: 'Measure straight across the widest part, about 8 in (20 cm) below the waistband, then double it.',
  shoulder: 'Top flat, back facing up: measure from one shoulder seam to the other.',
  sleeve_length: 'From the shoulder seam to the end of the sleeve.',
  sleeve_circumference: 'Across the sleeve just below the armpit, then double it.',
  top_length: 'From the highest point of the shoulder (by the collar) straight down to the hem.',
  trouser_length: 'From the top of the waistband straight down the side to the hem.',
  inseam: 'From the crotch seam down the inside leg to the hem.',
  thigh: 'Across the leg just below the crotch, then double it.',
  neck_collar: 'Lay the collar flat and open: measure from the centre of the button to the far end of the buttonhole.',
  ankle_opening: 'Across the bottom of the leg opening, then double it.',
  shoulder_to_underbust: 'On a dress that fits: from the shoulder seam down to the seam under the bust.',
};

const toInches = (v: number, unit: 'IN' | 'CM') => (unit === 'CM' ? v / 2.54 : v);
const fromInches = (v: number, unit: 'IN' | 'CM') => (unit === 'CM' ? v * 2.54 : v);
const fmt = (v: number) => String(Math.round(v * 2) / 2);

export const BespokeFitModal: React.FC<BespokeFitModalProps> = ({
  isOpen,
  onClose,
  productTitle = '',
  categoryName = '',
  categorySlug = '',
  garmentTypeHint = '',
  currentMeasurements,
  onApplyMeasurements,
  wearer = null,
}) => {
  const { user } = useAuth();
  const [unit, setUnit] = useState<'IN' | 'CM'>('IN');
  const [activeTab, setActiveTab] = useState<'custom_form' | 'estimator'>('custom_form');

  const initialDetection = detectGarmentType(categoryName, productTitle, garmentTypeHint, categorySlug);
  const [garmentType, setGarmentType] = useState<GarmentType>(initialDetection.type);
  const [detectedLabel, setDetectedLabel] = useState<string>(initialDetection.label);
  const [isAutoDetected, setIsAutoDetected] = useState<boolean>(initialDetection.isAutoDetected);
  const [showManualTypeSelector, setShowManualTypeSelector] = useState<boolean>(!initialDetection.isAutoDetected);

  const [formData, setFormData] = useState<Record<string, string>>({});
  // Ranges for estimated numbers, always in inches (converted for display).
  const [estimatedRanges, setEstimatedRanges] = useState<Record<string, RangeEstimate>>({});
  // Which fields still hold an estimate. Typing your own number removes it from this list.
  const [estimatedKeys, setEstimatedKeys] = useState<string[]>([]);
  const [measuredOn, setMeasuredOn] = useState<'body' | 'garment'>('body');
  const [showHowTo, setShowHowTo] = useState(false);
  const [notes, setNotes] = useState('');
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [savingFeedback, setSavingFeedback] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Rough estimate inputs
  const [estSex, setEstSex] = useState<'female' | 'male'>(
    wearer || (['corset_gown', 'boubou'].includes(initialDetection.type) ? 'female' : 'male'),
  );
  // Only ask "who is it for?" when the piece doesn't tell us (or the shopper wants to change it).
  const [askWearer, setAskWearer] = useState<boolean>(!wearer);
  const [estStandardSize, setEstStandardSize] = useState('M');
  const [estHeightFeet, setEstHeightFeet] = useState('5');
  const [estHeightInches, setEstHeightInches] = useState('6');
  const [estBuild, setEstBuild] = useState<'slim' | 'regular' | 'full'>('regular');
  const [estimatingLoading, setEstimatingLoading] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [calculatedGuide, setCalculatedGuide] = useState<{
    spec: Record<string, number>;
    ranges: Record<string, RangeEstimate>;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const res = detectGarmentType(categoryName, productTitle, garmentTypeHint, categorySlug);
      setGarmentType(res.type);
      setDetectedLabel(res.label);
      setIsAutoDetected(res.isAutoDetected);
      setShowManualTypeSelector(!res.isAutoDetected);
      setSubmitAttempted(false);
      if (wearer) { setEstSex(wearer); setAskWearer(false); }
    }
  }, [categoryName, productTitle, garmentTypeHint, categorySlug, isOpen, wearer]);

  useEffect(() => {
    if (currentMeasurements && Object.keys(currentMeasurements).length > 0) {
      setUnit(currentMeasurements.unit === 'CM' ? 'CM' : 'IN');
      const initialVals: Record<string, string> = {};
      measurementEntries(currentMeasurements).forEach(([k, v]) => { initialVals[k] = v; });
      setFormData(initialVals);
      setNotes(currentMeasurements.notes || '');
      setEstimatedRanges(currentMeasurements.estimated_ranges || {});
      setEstimatedKeys(estimatedFields(currentMeasurements));
      setMeasuredOn(isFromGarment(currentMeasurements) ? 'garment' : 'body');
    }
  }, [currentMeasurements, isOpen]);

  if (!isOpen) return null;

  const currentFields = FIELD_CONFIGS[garmentType] || FIELD_CONFIGS.full_set;
  const requiredKeys = REQUIRED_FIELDS[garmentType] || [];
  const fieldKeys = currentFields.map((f) => f.key);
  const liveEstimated = estimatedKeys.filter((k) => fieldKeys.includes(k) && (formData[k] || '').trim() !== '');

  const handleToggleUnit = (newUnit: 'IN' | 'CM') => {
    if (newUnit === unit) return;
    const converted: Record<string, string> = {};
    Object.keys(formData).forEach((k) => {
      const val = parseFloat(formData[k]);
      converted[k] = !isNaN(val) && val > 0
        ? (newUnit === 'CM' ? (val * 2.54).toFixed(1) : (val / 2.54).toFixed(1))
        : formData[k];
    });
    setFormData(converted);
    setUnit(newUnit);
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // Their own number now, not our estimate.
    setEstimatedKeys((prev) => prev.filter((k) => k !== key));
  };

  const handleApplySavedProfile = () => {
    const saved = user?.saved_measurements;
    if (saved && Object.keys(saved).length > 0) {
      setUnit(saved.unit === 'CM' ? 'CM' : 'IN');
      const loaded: Record<string, string> = {};
      measurementEntries(saved).forEach(([k, v]) => { loaded[k] = v; });
      setFormData(loaded);
      setEstimatedKeys([]);
      setEstimatedRanges({});
      setMeasuredOn(isFromGarment(saved) ? 'garment' : 'body');
      if (saved.notes) setNotes(saved.notes);
      setSavingFeedback('Loaded your saved measurements. Check they are still right.');
      setTimeout(() => setSavingFeedback(null), 3500);
    }
  };

  const handleGenerateEstimations = async () => {
    setEstimatingLoading(true);
    setEstimateError(null);
    const heightInchesTotal = parseInt(estHeightFeet, 10) * 12 + parseInt(estHeightInches, 10);
    try {
      const apiRes = await fitApi.estimate({
        category: garmentType,
        sex: estSex,
        rtw_size: estStandardSize,
        height_inches: heightInchesTotal,
        build: estBuild,
      });
      if (apiRes?.measurements) {
        const spec: Record<string, number> = {};
        Object.entries(apiRes.measurements).forEach(([k, v]) => { spec[k] = Number(v); });
        setCalculatedGuide({ spec, ranges: apiRes.estimated_ranges || {} });
      } else {
        setEstimateError('Could not work out an estimate just now. Please try again.');
      }
    } catch (e) {
      console.warn('Estimate failed', e);
      setEstimateError('Could not reach Aso to work out an estimate. Check your connection and try again.');
    } finally {
      setEstimatingLoading(false);
    }
  };

  const handleApplyCalculatedGuide = () => {
    if (!calculatedGuide) return;
    const next = { ...formData };
    const applied: string[] = [];
    fieldKeys.forEach((k) => {
      const v = calculatedGuide.spec[k];
      // Only fill gaps: never overwrite a number the shopper typed.
      if (v && !(formData[k] || '').trim()) {
        next[k] = fmt(fromInches(v, unit));
        applied.push(k);
      }
    });
    setFormData(next);
    setEstimatedRanges((prev) => ({ ...prev, ...calculatedGuide.ranges }));
    setEstimatedKeys((prev) => Array.from(new Set([...prev, ...applied])));
    setMeasuredOn('body');
    setActiveTab('custom_form');
    setSavingFeedback(applied.length
      ? `Filled ${applied.length} empty field${applied.length === 1 ? '' : 's'} with a rough estimate (marked below). Replace them with real measurements if you can.`
      : 'You already filled every field yourself, so nothing was changed.');
    setTimeout(() => setSavingFeedback(null), 6000);
  };

  // Soft warning: unusual but possible.
  const unusualWarning = (field: FieldConfig, valueStr: string): string | null => {
    const num = parseFloat(valueStr);
    if (!valueStr || isNaN(num)) return null;
    const inches = toInches(num, unit);
    if (inches < field.minIn || inches > field.maxIn) {
      const lo = unit === 'CM' ? field.minIn * 2.54 : field.minIn;
      const hi = unit === 'CM' ? field.maxIn * 2.54 : field.maxIn;
      return `Unusual for this measurement (most people: ${lo.toFixed(0)}–${hi.toFixed(0)} ${unit.toLowerCase()}). Double-check it.`;
    }
    return null;
  };

  const fieldErrors: Record<string, string> = {};
  currentFields.forEach((f) => {
    const err = measurementError(f.key, formData[f.key] || '', unit);
    if (err) fieldErrors[f.key] = err;
  });
  const missingRequired = requiredKeys.filter((k) => !(formData[k] || '').trim());
  const crossErrors = crossFieldErrors(Object.fromEntries(fieldKeys.map((k) => [k, formData[k] || ''])));

  const handleApply = async () => {
    setSubmitAttempted(true);
    if (missingRequired.length || Object.keys(fieldErrors).length || crossErrors.length) {
      const parts: string[] = [];
      if (missingRequired.length) parts.push(`Please fill in: ${missingRequired.map(measurementLabel).join(', ')}.`);
      if (Object.keys(fieldErrors).length) parts.push('Fix the measurements marked in red.');
      parts.push(...crossErrors);
      setSavingFeedback(parts.join(' '));
      return;
    }

    // Only this cut's fields: numbers left over from another cut would confuse the designer.
    const values: Record<string, string> = {};
    fieldKeys.forEach((k) => {
      const v = (formData[k] || '').trim();
      if (v) values[k] = v;
    });
    const estimatedNow = liveEstimated;
    const payload: BespokeMeasurements = {
      unit,
      category_type: garmentType,
      notes: notes.trim() || undefined,
      measured_on: measuredOn,
      fit_source: estimatedNow.length ? 'smart_estimator_v2' : measuredOn === 'garment' ? 'garment_flat' : 'manual_atelier',
      ...values,
    };
    if (estimatedNow.length) {
      payload.estimated_fields = estimatedNow;
      payload.estimated_ranges = Object.fromEntries(
        estimatedNow.filter((k) => estimatedRanges[k]).map((k) => [k, estimatedRanges[k]]),
      );
      payload.sex = estSex;
      payload.size_snapshot = estStandardSize;
      payload.height_snapshot = `${estHeightFeet}'${estHeightInches}"`;
    }

    if (saveToProfile && user) {
      try {
        await measurementsApi.saveMeasurements(payload);  // the server keeps only measured numbers
      } catch (e) {
        console.warn('Could not save to profile', e);
      }
    }
    try {
      localStorage.setItem('aso_my_fit_cache', JSON.stringify(payload));
    } catch {}

    onApplyMeasurements(payload);
    onClose();
  };

  const hasSavedProfile = measurementEntries(user?.saved_measurements).length > 0;
  const sizeOptions = estSex === 'female' ? ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'] : ['S', 'M', 'L', 'XL', 'XXL', '3XL'];

  return (
    <div className="bespoke-modal-overlay" onClick={onClose}>
      <div className="bespoke-modal-container" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Your measurements">
        <div className="bespoke-modal-header">
          <div className="bespoke-header-title-wrap">
            <div className="bespoke-header-icon">
              <Scissors size={20} color="#D4AF37" />
            </div>
            <div>
              <div className="bespoke-tagline">
                <Ruler size={12} color="#D4AF37" />
                <span>MY ASO FIT</span>
              </div>
              <h2 className="bespoke-title">Your measurements</h2>
            </div>
          </div>
          <button className="bespoke-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {productTitle && (
          <div className="bespoke-product-banner">
            <span>For:</span>
            <strong>{productTitle}</strong>
          </div>
        )}

        <div className="bespoke-control-bar">
          <div className="bespoke-nav-tabs">
            <button
              className={`bespoke-tab-btn ${activeTab === 'custom_form' ? 'active' : ''}`}
              onClick={() => { setActiveTab('custom_form'); setSavingFeedback(null); }}
            >
              📏 Enter measurements
            </button>
            <button
              className={`bespoke-tab-btn ${activeTab === 'estimator' ? 'active' : ''}`}
              onClick={() => { setActiveTab('estimator'); setSavingFeedback(null); }}
            >
              No tape? Rough estimate
            </button>
          </div>

          <div className="bespoke-unit-toggle">
            <span className="unit-label">Unit:</span>
            <button className={`unit-pill ${unit === 'IN' ? 'active' : ''}`} onClick={() => handleToggleUnit('IN')}>
              Inches (in)
            </button>
            <button className={`unit-pill ${unit === 'CM' ? 'active' : ''}`} onClick={() => handleToggleUnit('CM')}>
              Centimetres (cm)
            </button>
          </div>
        </div>

        {activeTab === 'custom_form' && liveEstimated.length > 0 && (
          <div className="bespoke-confidence-bar bespoke-confidence--low">
            <div className="confidence-label-wrap">
              <AlertCircle size={15} />
              <span>
                <strong>{liveEstimated.length} of these are rough estimates</strong>, not measurements.
              </span>
            </div>
            <span className="confidence-tip">
              Measure them if you can. If you order with estimates, the designer will confirm your measurements
              with you before cutting.
            </span>
          </div>
        )}

        {savingFeedback && (
          <div className="bespoke-feedback-alert" role="status">
            <Info size={16} />
            <span>{savingFeedback}</span>
          </div>
        )}

        <div className="bespoke-modal-body">
          {activeTab === 'custom_form' && (
            <div className="bespoke-form-view">
              {hasSavedProfile && (
                <div className="bespoke-quick-profile-bar">
                  <div className="quick-profile-text">
                    <CheckCircle2 size={16} color="#10B981" />
                    <span>You have saved measurements.</span>
                  </div>
                  <button className="btn-quick-apply-profile" onClick={handleApplySavedProfile}>
                    <Zap size={14} /> Use my saved measurements
                  </button>
                </div>
              )}

              {/* What was measured: their body, or clothes that already fit them */}
              <div className="bespoke-measured-on" role="radiogroup" aria-label="What did you measure?">
                <span className="section-mini-label">What are you measuring?</span>
                <div className="bespoke-measured-on__options">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={measuredOn === 'body'}
                    className={`bespoke-measured-on__btn ${measuredOn === 'body' ? 'active' : ''}`}
                    onClick={() => setMeasuredOn('body')}
                  >
                    <strong>My body</strong>
                    <span>With a soft tape measure</span>
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={measuredOn === 'garment'}
                    className={`bespoke-measured-on__btn ${measuredOn === 'garment' ? 'active' : ''}`}
                    onClick={() => setMeasuredOn('garment')}
                  >
                    <strong>Clothes that fit me well</strong>
                    <span>Laid flat on a table. Easy and accurate</span>
                  </button>
                </div>
              </div>

              <button type="button" className="bespoke-howto-toggle" onClick={() => setShowHowTo((v) => !v)} aria-expanded={showHowTo}>
                <Ruler size={14} /> {showHowTo ? 'Hide' : 'How to measure correctly'}
              </button>
              {showHowTo && (
                <div className="bespoke-howto">
                  {measuredOn === 'body' ? (
                    <ul>
                      <li>Use a soft tailor's tape. Ask someone to help for shoulders and back.</li>
                      <li>Wear thin clothes (or what you'll wear under the outfit). Stand straight and relaxed.</li>
                      <li>Keep the tape level all the way round, snug but not tight: you should fit one finger under it.</li>
                      <li>Don't add extra for comfort. The designer adds the right room for the style.</li>
                      <li>Measure twice. If the two differ, use the bigger number.</li>
                    </ul>
                  ) : (
                    <ul>
                      <li>Choose clothes that fit you the way you want this piece to fit.</li>
                      <li>Lay them flat on a table, buttoned or zipped, and smooth out the wrinkles.</li>
                      <li>For widths (chest, waist, hips), measure straight across and <strong>double it</strong>.</li>
                      <li>Each field below says exactly where to measure.</li>
                      <li>The designer is told you measured clothes, so they won't add extra room twice.</li>
                    </ul>
                  )}
                </div>
              )}

              {isAutoDetected && (
                <div className="bespoke-detected-garment-bar">
                  <div className="detected-garment-left">
                    <div className="detected-badge-icon">
                      <Scissors size={16} color="#D4AF37" />
                    </div>
                    <div className="detected-garment-text">
                      <div className="detected-badge-sub">Measurements for this cut</div>
                      <div className="detected-badge-title">
                        <strong>{detectedLabel}</strong>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-toggle-manual-archetype"
                    onClick={() => setShowManualTypeSelector((prev) => !prev)}
                  >
                    {showManualTypeSelector ? 'Done' : 'Not right? Change'}
                  </button>
                </div>
              )}

              {(!isAutoDetected || showManualTypeSelector) && (
                <div className="bespoke-archetype-selector">
                  <div className="section-label-row">
                    <label className="section-mini-label">What kind of outfit is it?</label>
                  </div>
                  <div className="archetype-chips">
                    {([
                      ['full_set', 'Two-Piece / Full Outfit'],
                      ['tops_senator', 'Senator / Kaftan / Agbada'],
                      ['corset_gown', 'Gown / Dress / Corset'],
                      ['boubou', 'Boubou / Free Gown'],
                      ['trousers', 'Trousers / Pants'],
                    ] as [GarmentType, string][]).map(([type, label]) => (
                      <button
                        key={type}
                        type="button"
                        className={`archetype-chip ${garmentType === type ? 'active' : ''}`}
                        onClick={() => { setGarmentType(type); setDetectedLabel(label); }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="bespoke-fields-grid">
                {currentFields.map((field) => {
                  const val = formData[field.key] || '';
                  const error = fieldErrors[field.key];
                  const required = requiredKeys.includes(field.key);
                  const missing = submitAttempted && required && !val.trim();
                  const warning = !error ? unusualWarning(field, val) : null;
                  const isEst = liveEstimated.includes(field.key);
                  const range = isEst ? estimatedRanges[field.key] : undefined;
                  const tip = measuredOn === 'garment' ? (GARMENT_TIPS[field.key] || field.tip) : field.tip;

                  return (
                    <div key={field.key} className={`bespoke-input-card${isEst ? ' is-estimated' : ''}${error || missing ? ' has-error' : ''}`}>
                      <div className="bespoke-label-row">
                        <label htmlFor={`m-${field.key}`}>
                          {field.label}
                          {required ? <span className="field-required" aria-label="required"> *</span> : <span className="field-optional"> (optional)</span>}
                        </label>
                        <span className="unit-badge">{unit}</span>
                      </div>
                      <div className="bespoke-input-wrapper">
                        <input
                          id={`m-${field.key}`}
                          type="number"
                          inputMode="decimal"
                          step="0.5"
                          min="0"
                          placeholder={unit === 'CM' ? `e.g. ${(parseFloat(field.placeholder.replace('e.g. ', '')) * 2.54).toFixed(0)}` : field.placeholder}
                          value={val}
                          onChange={(e) => handleInputChange(field.key, e.target.value)}
                          className={error || missing ? 'input-error' : warning ? 'input-warning' : ''}
                          aria-invalid={!!(error || missing)}
                        />
                      </div>

                      {isEst && (
                        <div className="field-bracket-pill">
                          <Target size={11} color="#92400E" />
                          <span>
                            Rough estimate
                            {range ? <> (likely {fmt(fromInches(range.min, unit))}–{fmt(fromInches(range.max, unit))} {unit.toLowerCase()})</> : null}
                            . Measure to replace it.
                          </span>
                        </div>
                      )}

                      {error ? (
                        <span className="field-error-text"><AlertCircle size={12} /> {error}</span>
                      ) : missing ? (
                        <span className="field-error-text"><AlertCircle size={12} /> Needed for this outfit.</span>
                      ) : warning ? (
                        <span className="field-warning-text"><AlertCircle size={12} /> {warning}</span>
                      ) : (
                        <span className="field-tip-text">{tip}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {crossErrors.length > 0 && (
                <div className="bespoke-cross-errors">
                  {crossErrors.map((e) => <p key={e}><AlertCircle size={13} /> {e}</p>)}
                </div>
              )}

              <div className="bespoke-notes-card">
                <label htmlFor="bespoke-notes" className="section-mini-label">
                  Notes for the designer (optional)
                </label>
                <textarea
                  id="bespoke-notes"
                  rows={2}
                  maxLength={1000}
                  placeholder="e.g. I like sleeves a little loose. Make the gown 2 in longer: I'll wear 4-inch heels."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {user && (
                <div className="bespoke-save-checkbox-row">
                  <label className="checkbox-container">
                    <input type="checkbox" checked={saveToProfile} onChange={(e) => setSaveToProfile(e.target.checked)} />
                    <span className="checkmark" />
                    <span className="checkbox-text">
                      <Save size={14} /> Save to my profile for next time
                      {liveEstimated.length > 0 && ' (only the ones you measured; estimates are not saved)'}
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}

          {activeTab === 'estimator' && (
            <div className="bespoke-estimator-view">
              <div className="estimator-hero">
                <Ruler size={24} color="#D4AF37" />
                <h3>No tape measure? Get a rough starting point</h3>
                <p>
                  We'll fill in typical measurements for your size and height. It's only a guide: bodies vary a lot
                  within one size. The designer will confirm your measurements with you before cutting.
                </p>
              </div>

              <div className="v12-estimator-inputs">
                {askWearer ? (
                  <div className="v12-step-card">
                    <label className="v12-step-label">Who is this outfit for?</label>
                    <div className="v12-frame-chips">
                      <button type="button" className={`v12-frame-pill ${estSex === 'female' ? 'active' : ''}`}
                        onClick={() => setEstSex('female')}>A woman</button>
                      <button type="button" className={`v12-frame-pill ${estSex === 'male' ? 'active' : ''}`}
                        onClick={() => { setEstSex('male'); if (estStandardSize === 'XS') setEstStandardSize('S'); }}>A man</button>
                    </div>
                  </div>
                ) : (
                  <p className="v12-helper-text" style={{ margin: '0 0 4px' }}>
                    Using {estSex === 'female' ? "women's" : "men's"} sizes for this outfit.{' '}
                    <button type="button" className="bespoke-howto-toggle" style={{ margin: 0 }} onClick={() => setAskWearer(true)}>
                      Change
                    </button>
                  </p>
                )}

                <div className="v12-step-card">
                  <label className="v12-step-label">What size do you usually buy?</label>
                  <div className="v12-size-chips">
                    {sizeOptions.map((sz) => (
                      <button key={sz} type="button" className={`v12-size-pill ${estStandardSize === sz ? 'active' : ''}`}
                        onClick={() => setEstStandardSize(sz)}>{sz}</button>
                    ))}
                  </div>
                  <span className="v12-helper-text">
                    {estSex === 'female' ? 'Roughly: XS = UK 6, S = UK 8–10, M = UK 12, L = UK 14–16, XL = UK 18, XXL = UK 20, 3XL = UK 22.' : 'Your usual shirt size.'}
                  </span>
                </div>

                <div className="v12-step-card">
                  <label className="v12-step-label">How tall are you?</label>
                  <div className="v12-height-selects">
                    <select value={estHeightFeet} onChange={(e) => setEstHeightFeet(e.target.value)} className="v12-select" aria-label="Feet">
                      {['4', '5', '6'].map((f) => <option key={f} value={f}>{f} ft</option>)}
                    </select>
                    <select value={estHeightInches} onChange={(e) => setEstHeightInches(e.target.value)} className="v12-select" aria-label="Inches">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => <option key={i} value={i}>{i} in</option>)}
                    </select>
                  </div>
                </div>

                <div className="v12-step-card">
                  <label className="v12-step-label">Your build</label>
                  <div className="v12-frame-chips">
                    <button type="button" className={`v12-frame-pill ${estBuild === 'slim' ? 'active' : ''}`} onClick={() => setEstBuild('slim')}>Slim</button>
                    <button type="button" className={`v12-frame-pill ${estBuild === 'regular' ? 'active' : ''}`} onClick={() => setEstBuild('regular')}>Average</button>
                    <button type="button" className={`v12-frame-pill ${estBuild === 'full' ? 'active' : ''}`} onClick={() => setEstBuild('full')}>Fuller / tummy</button>
                  </div>
                </div>
              </div>

              <div className="v12-action-center">
                <button type="button" className="btn-calc-estimates" onClick={handleGenerateEstimations} disabled={estimatingLoading}>
                  {estimatingLoading ? 'Working it out…' : 'Show my rough estimate'}
                </button>
                {estimateError && <p className="field-error-text" role="alert">{estimateError}</p>}
              </div>

              {calculatedGuide && (
                <div className="v12-guide-result-card">
                  <div className="v12-guide-header">
                    <div>
                      <span className="v12-guide-badge">Rough guide, not measurements</span>
                      <h4 className="v12-guide-title">
                        {estSex === 'female' ? 'Woman' : 'Man'} · size {estStandardSize} · {estHeightFeet}'{estHeightInches}" · {estBuild === 'full' ? 'fuller build' : estBuild === 'slim' ? 'slim build' : 'average build'}
                      </h4>
                    </div>
                  </div>
                  <p className="v12-guide-desc">
                    Most people your size fall inside these ranges. Using a tape measure is always more accurate.
                  </p>
                  <div className="v12-ranges-table">
                    <div className="v12-table-header">
                      <span>Measurement</span>
                      <span>Likely range</span>
                      <span>We'll use</span>
                    </div>
                    {currentFields.map((field) => {
                      const target = calculatedGuide.spec[field.key];
                      const range = calculatedGuide.ranges[field.key];
                      if (!target) return null;
                      const u = unit.toLowerCase();
                      return (
                        <div key={field.key} className="v12-table-row">
                          <span className="row-label">{field.label}</span>
                          <span className="row-bracket">
                            {range ? `${fmt(fromInches(range.min, unit))}–${fmt(fromInches(range.max, unit))} ${u}` : '—'}
                          </span>
                          <strong className="row-target">{fmt(fromInches(target, unit))} {u}</strong>
                        </div>
                      );
                    })}
                  </div>
                  <button type="button" className="btn-apply-guide-spec" onClick={handleApplyCalculatedGuide}>
                    <span>Use as a starting point</span>
                    <ArrowRight size={16} />
                  </button>
                  <p className="v12-helper-text" style={{ marginTop: 8 }}>
                    This fills only the empty fields. Anything you already typed stays as it is.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bespoke-modal-footer">
          <button type="button" className="btn-bespoke-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-bespoke-apply" onClick={activeTab === 'estimator' ? () => setActiveTab('custom_form') : handleApply}>
            <CheckCircle2 size={16} /> {activeTab === 'estimator' ? 'Back to my measurements' : 'Use these measurements'}
          </button>
        </div>
      </div>
    </div>
  );
};
