import React, { useState, useEffect } from 'react';
import {
  Scissors,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Save,
  Zap,
  Info,
  Activity,
  Target,
  ArrowRight,
} from 'lucide-react';
import type { BespokeMeasurements } from '../../types';
import { measurementsApi, fitApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
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
  const normHint = (hint || '').toLowerCase();
  const normTitle = (title || '').toLowerCase();
  const normCat = (cat || '').toLowerCase();
  const normSlug = (slug || '').toLowerCase();

  // Combine title and designer hint for high-specificity garment keyword matching
  const specificText = `${normHint} ${normTitle}`.trim();
  const fullContext = `${normHint} ${normCat} ${normSlug} ${normTitle}`.trim();

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

export const BespokeFitModal: React.FC<BespokeFitModalProps> = ({
  isOpen,
  onClose,
  productTitle = '',
  categoryName = '',
  categorySlug = '',
  garmentTypeHint = '',
  currentMeasurements,
  onApplyMeasurements,
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
  const [estimatedRanges, setEstimatedRanges] = useState<Record<string, RangeEstimate>>({});
  const [notes, setNotes] = useState('');
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [savingFeedback, setSavingFeedback] = useState<string | null>(null);

  // v1.2 Streamlined Estimator State (2 Core Inputs + Frame Pill)
  const [estStandardSize, setEstStandardSize] = useState('L');
  const [estHeightFeet, setEstHeightFeet] = useState('5');
  const [estHeightInches, setEstHeightInches] = useState('10');
  const [estBuild, setEstBuild] = useState<'slim' | 'regular' | 'full'>('regular');
  const [estimatingLoading, setEstimatingLoading] = useState(false);
  const [calculatedGuide, setCalculatedGuide] = useState<{
    spec: Record<string, string>;
    ranges: Record<string, RangeEstimate>;
    confidenceLabel: string;
    score: number;
  } | null>(null);

  // Confidence & Meta Info
  const [confidenceMeta, setConfidenceMeta] = useState<{
    score: number;
    tier: 'high' | 'medium' | 'low';
    label: string;
    version: string;
  } | null>(null);

  // Auto-detect garment archetype whenever product context changes or modal opens
  useEffect(() => {
    if (isOpen) {
      const res = detectGarmentType(categoryName, productTitle, garmentTypeHint, categorySlug);
      setGarmentType(res.type);
      setDetectedLabel(res.label);
      setIsAutoDetected(res.isAutoDetected);
      setShowManualTypeSelector(!res.isAutoDetected);
    }
  }, [categoryName, productTitle, garmentTypeHint, categorySlug, isOpen]);

  useEffect(() => {
    if (currentMeasurements && Object.keys(currentMeasurements).length > 0) {
      const initialUnit = currentMeasurements.unit || 'IN';
      setUnit(initialUnit);
      const initialVals: Record<string, string> = {};
      Object.keys(currentMeasurements).forEach((k) => {
        if (!['unit', 'notes', 'category_type', 'gender', 'estimated_ranges', 'fit_source', 'height_snapshot', 'size_snapshot'].includes(k)) {
          initialVals[k] = String(currentMeasurements[k] ?? '');
        }
      });
      setFormData(initialVals);
      if (currentMeasurements.notes) {
        setNotes(currentMeasurements.notes);
      }
      if (currentMeasurements.estimated_ranges) {
        setEstimatedRanges(currentMeasurements.estimated_ranges);
      }
    }
  }, [currentMeasurements, isOpen]);

  if (!isOpen) return null;

  const currentFields = FIELD_CONFIGS[garmentType] || FIELD_CONFIGS.full_set;

  const handleToggleUnit = (newUnit: 'IN' | 'CM') => {
    if (newUnit === unit) return;
    const converted: Record<string, string> = {};
    Object.keys(formData).forEach((k) => {
      const val = parseFloat(formData[k]);
      if (!isNaN(val) && val > 0) {
        if (newUnit === 'CM') {
          converted[k] = (val * 2.54).toFixed(1);
        } else {
          converted[k] = (val / 2.54).toFixed(1);
        }
      } else {
        converted[k] = formData[k];
      }
    });
    setFormData(converted);
    setUnit(newUnit);
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleApplySavedProfile = () => {
    const saved = user?.saved_measurements;
    if (saved && Object.keys(saved).length > 0) {
      const profileUnit = saved.unit || 'IN';
      setUnit(profileUnit);
      const loaded: Record<string, string> = {};
      Object.keys(saved).forEach((k) => {
        if (!['unit', 'notes', 'category_type', 'gender', 'estimated_ranges'].includes(k)) {
          loaded[k] = String(saved[k] ?? '');
        }
      });
      setFormData(loaded);
      if (saved.notes) setNotes(saved.notes);
      setSavingFeedback('Loaded your saved My Aso Fit profile measurements!');
      setTimeout(() => setSavingFeedback(null), 3000);
    } else {
      setSavingFeedback('No saved measurements found on your profile yet.');
      setTimeout(() => setSavingFeedback(null), 3000);
    }
  };

  // v1.2 Intelligent Fit Estimator: Computes Midpoints AND Safe Bracket Ranges
  const handleGenerateEstimations = async () => {
    setEstimatingLoading(true);
    const heightInchesTotal = parseInt(estHeightFeet, 10) * 12 + parseInt(estHeightInches, 10);

    let generatedSpec: Record<string, string> = {};
    let generatedRanges: Record<string, RangeEstimate> = {};
    let score = 0.92;
    let label = 'Strong Calibrated Fit';

    try {
      const apiRes = await fitApi.estimate({
        category: garmentType,
        rtw_size: estStandardSize,
        height_inches: heightInchesTotal,
        build: estBuild,
        usual_size_fit: 'fitted',
        garment_fit: 'regular',
      });

      if (apiRes && apiRes.measurements) {
        Object.entries(apiRes.measurements).forEach(([k, v]) => {
          generatedSpec[k] = String(v);
        });
        if (apiRes.estimated_ranges) {
          generatedRanges = apiRes.estimated_ranges;
        }
        score = apiRes.confidence_score || 0.92;
        label = apiRes.confidence_label || 'Strong Calibrated Fit';
      }
    } catch (e) {
      console.warn('API estimation failed, using local v1.2 algorithm', e);
    } finally {
      setEstimatingLoading(false);
    }

    // Local Deterministic Fallback if API ranges missing
    if (Object.keys(generatedSpec).length === 0) {
      const factorMap: Record<string, { bust: number; shoulder: number; waist: number; hips: number; sleeve: number }> = {
        XS: { bust: 34, shoulder: 16.5, waist: 28, hips: 35, sleeve: 24 },
        S: { bust: 37, shoulder: 17.5, waist: 30, hips: 38, sleeve: 24.5 },
        M: { bust: 40, shoulder: 18.5, waist: 33, hips: 41, sleeve: 25 },
        L: { bust: 43, shoulder: 19.5, waist: 36, hips: 44, sleeve: 25.5 },
        XL: { bust: 46, shoulder: 20.5, waist: 39, hips: 47, sleeve: 26 },
        XXL: { bust: 49, shoulder: 21.5, waist: 43, hips: 51, sleeve: 26.5 },
        '3XL': { bust: 52, shoulder: 22.5, waist: 47, hips: 55, sleeve: 27 },
      };

      const base = factorMap[estStandardSize] || factorMap.L;
      const heightFactor = (heightInchesTotal - 70) * 0.4;
      const buildAdj = estBuild === 'slim' ? -1.5 : estBuild === 'full' ? 3.0 : 0.0;

      generatedSpec = {
        chest_bust: String(Math.round(base.bust + (estBuild === 'full' ? 1.5 : buildAdj))),
        shoulder: String((base.shoulder + (estBuild === 'full' ? 0.3 : buildAdj * 0.2)).toFixed(1)),
        waist: String(Math.round(base.waist + (estBuild === 'full' ? 3.5 : buildAdj))),
        hips: String(Math.round(base.hips + (estBuild === 'full' ? 2.5 : buildAdj))),
        sleeve_length: String(Math.round(base.sleeve + heightFactor * 0.3)),
        top_length: String(Math.round(37 + heightFactor * 0.6)),
        trouser_length: String(Math.round(41 + heightFactor * 0.7)),
        thigh: String(Math.round(24 + buildAdj * 0.8)),
        underbust: String(Math.round(base.waist - 2)),
        neck_collar: String((15.5 + (estBuild === 'full' ? 0.8 : buildAdj * 0.3)).toFixed(1)),
        shoulder_to_underbust: String((14 + heightFactor * 0.1).toFixed(1)),
      };
    }

    // Build Range Brackets (M ± Delta)
    const deltaMap: Record<string, number> = {
      chest_bust: 1.0,
      shoulder: 0.5,
      waist: 1.5,
      hips: 1.5,
      top_length: 1.0,
      trouser_length: 1.0,
      sleeve_length: 0.5,
      neck_collar: 0.5,
      underbust: 1.0,
      thigh: 1.0,
      shoulder_to_underbust: 0.5,
    };

    if (Object.keys(generatedRanges).length === 0) {
      Object.entries(generatedSpec).forEach(([k, v]) => {
        const targetNum = parseFloat(v);
        if (!isNaN(targetNum)) {
          const delta = deltaMap[k] || 1.0;
          const minV = Math.round((targetNum - delta) * 10) / 10;
          const maxV = Math.round((targetNum + delta) * 10) / 10;
          generatedRanges[k] = {
            min: minV,
            max: maxV,
            target: targetNum,
            bracket: `${minV} - ${maxV}`,
          };
        }
      });
    }

    setCalculatedGuide({
      spec: generatedSpec,
      ranges: generatedRanges,
      confidenceLabel: label,
      score,
    });
  };

  const handleApplyCalculatedGuide = () => {
    if (!calculatedGuide) return;

    const formattedData: Record<string, string> = {};
    Object.entries(calculatedGuide.spec).forEach(([k, v]) => {
      if (unit === 'CM') {
        formattedData[k] = (parseFloat(v) * 2.54).toFixed(1);
      } else {
        formattedData[k] = v;
      }
    });

    setFormData(formattedData);
    setEstimatedRanges(calculatedGuide.ranges);
    setConfidenceMeta({
      score: calculatedGuide.score,
      tier: 'high',
      label: calculatedGuide.confidenceLabel,
      version: '1.2',
    });

    setActiveTab('custom_form');
    setSavingFeedback('Recommended fit and bracket ranges applied! Review your tailored spec below.');
    setTimeout(() => setSavingFeedback(null), 4000);
  };

  const validateField = (field: FieldConfig, valueStr: string): string | null => {
    if (!valueStr || valueStr.trim() === '') return null;
    const num = parseFloat(valueStr);
    if (isNaN(num)) return 'Please enter a valid number';
    const min = unit === 'CM' ? field.minIn * 2.54 : field.minIn;
    const max = unit === 'CM' ? field.maxIn * 2.54 : field.maxIn;
    if (num < min || num > max) {
      return `Unusual measurement (typical range: ${min.toFixed(0)} - ${max.toFixed(0)} ${unit.toLowerCase()})`;
    }
    return null;
  };

  const handleApply = async () => {
    const filledCount = Object.values(formData).filter(v => v && String(v).trim() !== '').length;
    if (filledCount === 0) {
      setSavingFeedback('Please fill in your primary measurements before applying.');
      setTimeout(() => setSavingFeedback(null), 3500);
      return;
    }

    const payload: BespokeMeasurements = {
      unit,
      category_type: garmentType,
      notes: notes.trim() || undefined,
      estimated_ranges: Object.keys(estimatedRanges).length > 0 ? estimatedRanges : undefined,
      fit_source: Object.keys(estimatedRanges).length > 0 ? 'smart_estimator_v1.2' : 'manual_atelier',
      height_snapshot: `${estHeightFeet}'${estHeightInches}"`,
      size_snapshot: estStandardSize,
      ...formData,
    };

    if (saveToProfile && user) {
      try {
        await measurementsApi.saveMeasurements(payload);
      } catch (e) {
        console.warn('Could not persist to user profile API', e);
      }
    }

    try {
      localStorage.setItem('aso_my_fit_cache', JSON.stringify(payload));
    } catch {}

    onApplyMeasurements(payload);
    onClose();
  };

  const hasSavedProfile = !!(user?.saved_measurements && Object.keys(user.saved_measurements).length > 0);

  return (
    <div className="bespoke-modal-overlay" onClick={onClose}>
      <div className="bespoke-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bespoke-modal-header">
          <div className="bespoke-header-title-wrap">
            <div className="bespoke-header-icon">
              <Scissors size={20} color="#D4AF37" />
            </div>
            <div>
              <div className="bespoke-tagline">
                <Sparkles size={12} color="#D4AF37" />
                <span>MY ASO FIT • SMART ATELIER v1.2</span>
              </div>
              <h2 className="bespoke-title">Custom Made-to-Measure Spec</h2>
            </div>
          </div>
          <button className="bespoke-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Product Context Banner */}
        {productTitle && (
          <div className="bespoke-product-banner">
            <span>Tailoring garment:</span>
            <strong>{productTitle}</strong>
          </div>
        )}

        {/* Navigation / Switcher Bar */}
        <div className="bespoke-control-bar">
          <div className="bespoke-nav-tabs">
            <button
              className={`bespoke-tab-btn ${activeTab === 'custom_form' ? 'active' : ''}`}
              onClick={() => setActiveTab('custom_form')}
            >
              📏 Atelier Measurements
            </button>
            <button
              className={`bespoke-tab-btn ${activeTab === 'estimator' ? 'active' : ''}`}
              onClick={() => setActiveTab('estimator')}
            >
              ✨ Smart Fit Estimator
            </button>
          </div>

          <div className="bespoke-unit-toggle">
            <span className="unit-label">Unit:</span>
            <button
              className={`unit-pill ${unit === 'IN' ? 'active' : ''}`}
              onClick={() => handleToggleUnit('IN')}
            >
              Inches (in)
            </button>
            <button
              className={`unit-pill ${unit === 'CM' ? 'active' : ''}`}
              onClick={() => handleToggleUnit('CM')}
            >
              Centimeters (cm)
            </button>
          </div>
        </div>

        {/* Confidence Tier Badge */}
        {confidenceMeta && (
          <div className={`bespoke-confidence-bar bespoke-confidence--${confidenceMeta.tier}`}>
            <div className="confidence-label-wrap">
              <Activity size={15} />
              <span><strong>{confidenceMeta.label}</strong> (v{confidenceMeta.version})</span>
            </div>
            <span className="confidence-tip">
              Safe bracket ranges applied. Tailors leave 1.5–2" inner seam allowance for custom drape.
            </span>
          </div>
        )}

        {/* Feedback Alert if any */}
        {savingFeedback && (
          <div className="bespoke-feedback-alert">
            <Info size={16} />
            <span>{savingFeedback}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="bespoke-modal-body">
          {activeTab === 'custom_form' && (
            <div className="bespoke-form-view">
              {/* Profile Quick-Load Banner */}
              {hasSavedProfile && (
                <div className="bespoke-quick-profile-bar">
                  <div className="quick-profile-text">
                    <CheckCircle2 size={16} color="#10B981" />
                    <span>You have a saved <strong>My Aso Fit</strong> profile.</span>
                  </div>
                  <button className="btn-quick-apply-profile" onClick={handleApplySavedProfile}>
                    <Zap size={14} /> 1-Click Apply Saved Profile
                  </button>
                </div>
              )}

              {/* Intelligent Garment Cut Detection Bar */}
              {isAutoDetected && (
                <div className="bespoke-detected-garment-bar">
                  <div className="detected-garment-left">
                    <div className="detected-badge-icon">
                      <Sparkles size={16} color="#D4AF37" />
                    </div>
                    <div className="detected-garment-text">
                      <div className="detected-badge-sub">Auto-Detected Garment Cut</div>
                      <div className="detected-badge-title">
                        <strong>{detectedLabel}</strong>
                        <span className="detected-badge-pill">
                          {productTitle ? `Calibrated for "${productTitle}"` : 'Calibrated for this piece'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-toggle-manual-archetype"
                    onClick={() => setShowManualTypeSelector(prev => !prev)}
                    title="Manually switch garment cut if needed"
                  >
                    {showManualTypeSelector ? 'Keep Auto-Detected' : 'Change Cut'}
                  </button>
                </div>
              )}

              {/* Garment Archetype Selector: ONLY shown if manually opened or not auto-detected */}
              {(!isAutoDetected || showManualTypeSelector) && (
                <div className="bespoke-archetype-selector">
                  <div className="section-label-row">
                    <label className="section-mini-label">Garment Type & Cut:</label>
                    {isAutoDetected && (
                      <span className="archetype-override-hint">Manual override</span>
                    )}
                  </div>
                  <div className="archetype-chips">
                    <button
                      type="button"
                      className={`archetype-chip ${garmentType === 'full_set' ? 'active' : ''}`}
                      onClick={() => {
                        setGarmentType('full_set');
                        setDetectedLabel('Two-Piece / Full Outfit');
                      }}
                    >
                      Two-Piece / Full Outfit
                    </button>
                    <button
                      type="button"
                      className={`archetype-chip ${garmentType === 'tops_senator' ? 'active' : ''}`}
                      onClick={() => {
                        setGarmentType('tops_senator');
                        setDetectedLabel('Senator / Kaftan / Agbada');
                      }}
                    >
                      Senator / Kaftan / Agbada
                    </button>
                    <button
                      type="button"
                      className={`archetype-chip ${garmentType === 'corset_gown' ? 'active' : ''}`}
                      onClick={() => {
                        setGarmentType('corset_gown');
                        setDetectedLabel('Gown / Dress / Corset');
                      }}
                    >
                      Gown / Dress / Corset
                    </button>
                    <button
                      type="button"
                      className={`archetype-chip ${garmentType === 'boubou' ? 'active' : ''}`}
                      onClick={() => {
                        setGarmentType('boubou');
                        setDetectedLabel('Boubou / Rich Auntie Gown');
                      }}
                    >
                      Boubou / Rich Auntie
                    </button>
                    <button
                      type="button"
                      className={`archetype-chip ${garmentType === 'trousers' ? 'active' : ''}`}
                      onClick={() => {
                        setGarmentType('trousers');
                        setDetectedLabel('Trousers / Pants');
                      }}
                    >
                      Trousers / Pants
                    </button>
                  </div>
                </div>
              )}

              {/* Form Input Fields Grid with Range Bracket Badges */}
              <div className="bespoke-fields-grid">
                {currentFields.map((field) => {
                  const val = formData[field.key] || '';
                  const warning = validateField(field, val);
                  const range = estimatedRanges[field.key];

                  return (
                    <div key={field.key} className="bespoke-input-card">
                      <div className="bespoke-label-row">
                        <label htmlFor={field.key}>{field.label}</label>
                        <span className="unit-badge">{unit}</span>
                      </div>
                      <div className="bespoke-input-wrapper">
                        <input
                          id={field.key}
                          type="number"
                          step="0.1"
                          placeholder={unit === 'CM' ? `${(parseFloat(field.placeholder.replace('e.g. ', '')) * 2.54).toFixed(0)}` : field.placeholder}
                          value={val}
                          onChange={(e) => handleInputChange(field.key, e.target.value)}
                          className={warning ? 'input-warning' : ''}
                        />
                      </div>
                      
                      {/* v1.2 Safe Bracket Range Pill */}
                      {range && (
                        <div className="field-bracket-pill">
                          <Target size={11} color="#0C3B2E" />
                          <span>Est. Range: <strong>{range.bracket} {unit.toLowerCase()}</strong></span>
                        </div>
                      )}

                      {warning ? (
                        <span className="field-warning-text">
                          <AlertCircle size={12} /> {warning}
                        </span>
                      ) : (
                        <span className="field-tip-text">{field.tip}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Special Atelier Tailoring Instructions / Notes */}
              <div className="bespoke-notes-card">
                <label htmlFor="bespoke-notes" className="section-mini-label">
                  Special Tailoring Requests & Drape Notes (Optional):
                </label>
                <textarea
                  id="bespoke-notes"
                  rows={2}
                  placeholder="e.g. Prefer relaxed sleeve fit, extra 2 inches length for 4-inch heels, include lining in sleeves..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Save to Profile Checkbox */}
              <div className="bespoke-save-checkbox-row">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={saveToProfile}
                    onChange={(e) => setSaveToProfile(e.target.checked)}
                  />
                  <span className="checkmark" />
                  <span className="checkbox-text">
                    <Save size={14} /> Save to <strong>My Aso Fit</strong> profile for 1-click checkout on all future designer pieces.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* v1.2 Frictionless Smart Fit Estimator Tab */}
          {activeTab === 'estimator' && (
            <div className="bespoke-estimator-view">
              <div className="estimator-hero">
                <Sparkles size={24} color="#D4AF37" />
                <h3>Get Your Custom Fit in 5 Seconds (No Tape Needed)</h3>
                <p>
                  Tell us your normal shirt/cloth size and height. Our anthropometric engine calculates your tailored spec and safe bracket ranges.
                </p>
              </div>

              {/* 2-Step Core Inputs */}
              <div className="v12-estimator-inputs">
                {/* Step 1: Normal Shirt/Cloth Size */}
                <div className="v12-step-card">
                  <label className="v12-step-label">
                    1. What size shirt or cloth do you normally buy?
                  </label>
                  <div className="v12-size-chips">
                    {['S', 'M', 'L', 'XL', 'XXL', '3XL'].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        className={`v12-size-pill ${estStandardSize === sz ? 'active' : ''}`}
                        onClick={() => setEstStandardSize(sz)}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                  <span className="v12-helper-text">Standard boutique / regular ready-to-wear size</span>
                </div>

                {/* Step 2: Height */}
                <div className="v12-step-card">
                  <label className="v12-step-label">
                    2. What is your height?
                  </label>
                  <div className="v12-height-selects">
                    <select
                      value={estHeightFeet}
                      onChange={(e) => setEstHeightFeet(e.target.value)}
                      className="v12-select"
                    >
                      <option value="4">4 ft</option>
                      <option value="5">5 ft</option>
                      <option value="6">6 ft</option>
                      <option value="7">7 ft</option>
                    </select>
                    <select
                      value={estHeightInches}
                      onChange={(e) => setEstHeightInches(e.target.value)}
                      className="v12-select"
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => (
                        <option key={i} value={i}>{i} in</option>
                      ))}
                    </select>
                  </div>
                  <span className="v12-helper-text">Anchors accurate top length and trouser hemline</span>
                </div>

                {/* Step 3: Body Frame Modifier (Optional) */}
                <div className="v12-step-card">
                  <label className="v12-step-label">
                    3. Body Frame (Optional modifier):
                  </label>
                  <div className="v12-frame-chips">
                    <button
                      type="button"
                      className={`v12-frame-pill ${estBuild === 'slim' ? 'active' : ''}`}
                      onClick={() => setEstBuild('slim')}
                    >
                      🏃 Slim / Lean
                    </button>
                    <button
                      type="button"
                      className={`v12-frame-pill ${estBuild === 'regular' ? 'active' : ''}`}
                      onClick={() => setEstBuild('regular')}
                    >
                      👔 Balanced (Default)
                    </button>
                    <button
                      type="button"
                      className={`v12-frame-pill ${estBuild === 'full' ? 'active' : ''}`}
                      onClick={() => setEstBuild('full')}
                    >
                      👑 Heavy / Belly
                    </button>
                  </div>
                </div>
              </div>

              {/* Calculate Button */}
              <div className="v12-action-center">
                <button
                  type="button"
                  className="btn-calc-estimates"
                  onClick={handleGenerateEstimations}
                  disabled={estimatingLoading}
                >
                  <Zap size={16} />
                  {estimatingLoading ? 'Calculating Calibrated Fit...' : 'Calculate Estimated Fit & Safe Bracket Ranges'}
                </button>
              </div>

              {/* Calculated Result: Estimated Fit Guide Card with Ranges */}
              {calculatedGuide && (
                <div className="v12-guide-result-card">
                  <div className="v12-guide-header">
                    <div>
                      <span className="v12-guide-badge">
                        <Sparkles size={13} color="#D4AF37" /> Calibrated Fit Spec (92% Match)
                      </span>
                      <h4 className="v12-guide-title">
                        Estimated for Size {estStandardSize} • {estHeightFeet}'{estHeightInches}" • {estBuild === 'full' ? 'Full Frame' : estBuild === 'slim' ? 'Slim Frame' : 'Balanced'}
                      </h4>
                    </div>
                  </div>

                  <p className="v12-guide-desc">
                    Below are your safe measurement brackets. African native garments feature natural ease and a 2" tailor's inner seam allowance.
                  </p>

                  {/* Range Table */}
                  <div className="v12-ranges-table">
                    <div className="v12-table-header">
                      <span>Tailoring Area</span>
                      <span>Safe Bracket Range</span>
                      <span>Target Spec</span>
                    </div>
                    {currentFields.map((field) => {
                      const range = calculatedGuide.ranges[field.key];
                      const targetVal = calculatedGuide.spec[field.key] || range?.target;
                      if (!range && !targetVal) return null;

                      return (
                        <div key={field.key} className="v12-table-row">
                          <span className="row-label">{field.label}</span>
                          <span className="row-bracket">
                            {range ? `${range.bracket} in` : 'Standard drape'}
                          </span>
                          <strong className="row-target">
                            {targetVal} in
                          </strong>
                        </div>
                      );
                    })}
                  </div>

                  {/* Apply Button */}
                  <button
                    type="button"
                    className="btn-apply-guide-spec"
                    onClick={handleApplyCalculatedGuide}
                  >
                    <span>Apply Recommended Spec & Bracket Ranges</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="bespoke-modal-footer">
          <button type="button" className="btn-bespoke-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-bespoke-apply" onClick={handleApply}>
            <CheckCircle2 size={16} /> Confirm & Apply Made-to-Measure Spec
          </button>
        </div>
      </div>
    </div>
  );
};
