import React, { useMemo, useState } from 'react';
import { X, Ruler, Info, CheckCircle2 } from 'lucide-react';
import type { SizeChart, ProductVariant, BodyMeasurementRow } from '../../types';
import { useAuth } from '../../context/AuthContext';
import './SizeGuideModal.css';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  productTitle: string;
  productImage?: string | null;
  sizeChart?: SizeChart;
  selectedSize?: string;
  onSelectSize?: (size: string) => void;
  /** The piece's sizes: the guide only lists sizes you can actually buy. */
  variants?: ProductVariant[];
}

/** Body columns in display order: [row key, label, saved-measurement key used for "your size"]. */
const BODY_COLUMNS: [keyof BodyMeasurementRow, string, string | null][] = [
  ['bust', 'Bust / chest', 'chest_bust'],
  ['underbust', 'Underbust', 'underbust'],
  ['waist', 'Waist', 'waist'],
  ['hip', 'Hips', 'hips'],
  ['neck_collar', 'Neck', 'neck_collar'],
];

const STRETCH: Record<string, { label: string; desc: string }> = {
  NON: { label: 'No stretch', desc: 'The fabric has no give. If you are between sizes, choose the bigger one.' },
  SLIGHT: { label: 'Slight stretch', desc: 'A little give for comfort; keeps its shape.' },
  MEDIUM: { label: 'Medium stretch', desc: 'Comfortable give that follows your shape.' },
  HIGH: { label: 'High stretch', desc: 'Very stretchy: figure-hugging. If you are between sizes, the smaller one usually works.' },
};

const parseRange = (text?: string): [number, number] | null => {
  if (!text) return null;
  const m = String(text).match(/(\d+(?:\.\d+)?)(?:\s*[-–]\s*(\d+(?:\.\d+)?))?/);
  if (!m) return null;
  const lo = parseFloat(m[1]);
  return [lo, m[2] ? parseFloat(m[2]) : lo];
};

const sameSize = (a?: string, b?: string) => (a || '').trim().toUpperCase() === (b || '').trim().toUpperCase();

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
  isOpen,
  onClose,
  productTitle,
  productImage,
  sizeChart,
  selectedSize,
  onSelectSize,
  variants = [],
}) => {
  // Hooks always run, open or closed (calling them after an early return crashed React).
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'body' | 'product' | 'how-to-measure'>('body');
  const [unit, setUnit] = useState<'IN' | 'CM'>(sizeChart?.unit_default || 'IN');

  const soldSizes = useMemo(
    () => variants.filter((v) => v.is_active !== false && !/bespoke|custom/i.test(v.size)).map((v) => v.size),
    [variants],
  );
  // Only the sizes this piece is sold in (designers' charts sometimes list more).
  const bodyRows = useMemo(() => {
    const rows = sizeChart?.body_measurements || [];
    if (!soldSizes.length) return rows;
    const kept = rows.filter((r) => soldSizes.some((s) => sameSize(s, r.size)));
    return kept.length ? kept : rows;
  }, [sizeChart, soldSizes]);
  const garmentRows = sizeChart?.garment_measurements?.tops || [];
  const bottomsRows = sizeChart?.garment_measurements?.bottoms || [];
  const hasProductDims = garmentRows.length > 0 || bottomsRows.length > 0;

  const columns = BODY_COLUMNS.filter(([key]) => bodyRows.some((r) => r[key]));
  const showUk = bodyRows.some((r) => r.uk_size);
  const showUs = !sizeChart?.is_generic && bodyRows.some((r) => r.us_size);
  const showHeight = !sizeChart?.is_generic && bodyRows.some((r) => r.height);
  const stretch = sizeChart?.stretch ? STRETCH[sizeChart.stretch] : null;

  // "Your size": compare saved measurements (inches) with each row's ranges.
  const recommended = useMemo(() => {
    const saved = user?.saved_measurements;
    if (!saved || !bodyRows.length) return null;
    const toIn = (v: any) => {
      const n = parseFloat(String(v));
      if (isNaN(n)) return null;
      return saved.unit === 'CM' ? n / 2.54 : n;
    };
    let best: { size: string; score: number; checked: number } | null = null;
    for (const row of bodyRows) {
      let score = 0;
      let checked = 0;
      for (const [key, , savedKey] of columns) {
        const mine = savedKey ? toIn(saved[savedKey]) : null;
        const range = parseRange(row[key] as string);
        if (mine === null || !range) continue;
        checked += 1;
        const [lo, hi] = range;
        // Inside the range scores best; outside loses points by how far off it is.
        score += mine >= lo && mine <= hi ? 2 : -Math.min(Math.abs(mine - lo), Math.abs(mine - hi));
      }
      if (checked && (!best || score > best.score)) best = { size: row.size, score, checked };
    }
    return best;
  }, [user, bodyRows, columns]);

  if (!isOpen) return null;

  const val = (row: any, key: string) => (unit === 'CM' ? row[`${key}_cm`] || row[key] : row[key]) || '–';

  return (
    <div className="size-guide-overlay" onClick={onClose}>
      <div className="size-guide-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Size guide">
        <div className="size-guide-header">
          <div className="size-guide-product-preview">
            {productImage ? (
              <img src={productImage} alt={productTitle} className="size-guide-thumb" />
            ) : (
              <div className="size-guide-thumb-placeholder">
                <Ruler size={18} color="#0C3B2E" />
              </div>
            )}
            <div>
              <span className="size-guide-badge">Size guide</span>
              <h3 className="size-guide-title">{productTitle}</h3>
            </div>
          </div>
          <button className="size-guide-close-btn" onClick={onClose} aria-label="Close size guide">
            <X size={20} />
          </button>
        </div>

        {sizeChart?.is_generic ? (
          <div role="note" style={{ margin: '0 1.25rem', padding: '0.6rem 0.85rem', borderRadius: 8, background: '#FEF3C7', color: '#92400E', fontSize: '0.8rem', lineHeight: 1.45 }}>
            <strong>General guide.</strong> This designer hasn't added their own size chart, so these are typical
            {sizeChart.wearer === 'male' ? " men's" : sizeChart.wearer === 'female' ? " women's" : ''} body measurements
            for each size. If you're between sizes or unsure,
            {sizeChart.allows_custom_tailoring !== false ? <> choose <strong>Custom fit</strong> and send your measurements.</> : ' choose the bigger size.'}
          </div>
        ) : (
          <div role="note" style={{ margin: '0 1.25rem', padding: '0.5rem 0.85rem', borderRadius: 8, background: '#ECFDF5', color: '#065F46', fontSize: '0.8rem' }}>
            <CheckCircle2 size={13} style={{ verticalAlign: '-2px' }} /> This is the designer's own size chart for this piece.
          </div>
        )}

        <div className="size-guide-controls-bar">
          <div className="control-group">
            <span className="control-label">Unit:</span>
            <div className="segmented-switch">
              <button className={`switch-option ${unit === 'IN' ? 'active' : ''}`} onClick={() => setUnit('IN')}>Inches</button>
              <button className={`switch-option ${unit === 'CM' ? 'active' : ''}`} onClick={() => setUnit('CM')}>cm</button>
            </div>
          </div>
        </div>

        {stretch && (
          <div className="stretch-meter-card">
            <div className="stretch-meter-header">
              <span className="stretch-title">Fabric stretch</span>
              <span className={`stretch-badge stretch-${String(sizeChart?.stretch).toLowerCase()}`}>{stretch.label}</span>
            </div>
            <p className="stretch-desc">{stretch.desc}</p>
          </div>
        )}

        <div className="size-guide-tabs">
          <button className={`tab-item ${activeTab === 'body' ? 'active' : ''}`} onClick={() => setActiveTab('body')}>
            Your body measurements
          </button>
          {hasProductDims && (
            <button className={`tab-item ${activeTab === 'product' ? 'active' : ''}`} onClick={() => setActiveTab('product')}>
              The piece itself
            </button>
          )}
          <button className={`tab-item ${activeTab === 'how-to-measure' ? 'active' : ''}`} onClick={() => setActiveTab('how-to-measure')}>
            How to measure
          </button>
        </div>

        {activeTab === 'body' && (
          <div className="size-guide-tab-content">
            {recommended && (
              <div className="table-disclaimer-banner" style={{ background: '#ECFDF5', borderColor: '#A7F3D0' }}>
                <CheckCircle2 size={14} color="#065F46" />
                <span>
                  From your saved measurements, <strong>size {recommended.size}</strong> looks closest.
                  {recommended.score < recommended.checked * 2 && ' You are between sizes on some measurements: consider Custom fit.'}
                </span>
              </div>
            )}
            {bodyRows.length === 0 ? (
              <p className="size-guide-footnote">
                There's no size chart for this piece yet. Choose <strong>Custom fit</strong> to send your own measurements.
              </p>
            ) : (
              <>
                <div className="table-disclaimer-banner">
                  <Info size={14} color="#0C3B2E" />
                  <span>
                    Measure your body, not your clothes, and pick the size whose ranges fit you. If you're between two
                    sizes, choose the bigger one (or Custom fit).
                  </span>
                </div>
                <div className="table-responsive-wrapper">
                  <table className="size-guide-table">
                    <thead>
                      <tr>
                        <th>Size</th>
                        {showUk && <th>UK size</th>}
                        {showUs && <th>US size</th>}
                        {columns.map(([key, label]) => <th key={key}>{label} ({unit === 'CM' ? 'cm' : 'in'})</th>)}
                        {showHeight && <th>Height</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {bodyRows.map((row) => {
                        const isSelected = sameSize(selectedSize, row.size);
                        const isRec = recommended && sameSize(recommended.size, row.size);
                        return (
                          <tr
                            key={row.size}
                            className={`size-table-row ${isSelected ? 'row-selected' : ''}`}
                            onClick={() => onSelectSize?.(row.size)}
                          >
                            <td className="cell-size-label">
                              <strong>{row.size}</strong>
                              {isSelected && <span className="selected-indicator">Selected</span>}
                              {!isSelected && isRec && <span className="selected-indicator">Your size</span>}
                            </td>
                            {showUk && <td className="cell-secondary">{row.uk_size || '–'}</td>}
                            {showUs && <td className="cell-secondary">{row.us_size || '–'}</td>}
                            {columns.map(([key]) => <td key={key}>{val(row, key as string)}</td>)}
                            {showHeight && <td className="cell-secondary">{unit === 'CM' ? (row.height_cm ? `${row.height_cm} cm` : row.height) : row.height || '–'}</td>}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="size-guide-footnote">Tap a size to choose it.</p>
              </>
            )}
          </div>
        )}

        {activeTab === 'product' && hasProductDims && (
          <div className="size-guide-tab-content">
            <div className="table-disclaimer-banner">
              <Info size={14} color="#0C3B2E" />
              <span>Measured on the finished piece by the designer. Compare with clothes you own that fit well.</span>
            </div>
            <div className="table-responsive-wrapper">
              <table className="size-guide-table">
                <thead>
                  <tr>
                    <th>Size</th>
                    {garmentRows.some((r) => r.shoulder) && <th>Shoulder</th>}
                    {garmentRows.some((r) => r.chest || r.bust) && <th>Chest</th>}
                    {garmentRows.some((r) => r.length) && <th>Length ({unit === 'CM' ? 'cm' : 'in'})</th>}
                    {garmentRows.some((r) => r.sleeve) && <th>Sleeve</th>}
                  </tr>
                </thead>
                <tbody>
                  {garmentRows
                    .filter((r) => !soldSizes.length || soldSizes.some((s) => sameSize(s, r.size)))
                    .map((row) => (
                      <tr key={row.size} className="size-table-row" onClick={() => onSelectSize?.(row.size)}>
                        <td className="cell-size-label"><strong>{row.size}</strong></td>
                        {garmentRows.some((r) => r.shoulder) && <td>{val(row, 'shoulder')}</td>}
                        {garmentRows.some((r) => r.chest || r.bust) && <td>{val(row, row.chest ? 'chest' : 'bust')}</td>}
                        {garmentRows.some((r) => r.length) && <td>{val(row, 'length')}</td>}
                        {garmentRows.some((r) => r.sleeve) && <td>{val(row, 'sleeve')}</td>}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'how-to-measure' && (
          <div className="size-guide-tab-content how-to-measure-content">
            <div className="measure-guide-grid">
              {[
                ['Bust / chest', 'Around the fullest part of your chest, under the armpits, tape level across your back.'],
                ['Underbust', 'Around your ribcage just below the bust.'],
                ['Waist', 'Around your natural waist, the narrowest part (or where you wear your trousers).'],
                ['Hips', 'Around the fullest part of your hips and bottom, feet together.'],
                ['Neck', 'Around the base of your neck, with one finger under the tape.'],
                ['Length', 'From the top of your shoulder, by the neck, straight down to where you want the hem.'],
              ].map(([title, tip], i) => (
                <div className="measure-step-card" key={title}>
                  <div className="step-num">{i + 1}</div>
                  <div>
                    <h4>{title}</h4>
                    <p>{tip}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="size-guide-footnote">
              Use a soft tape over thin clothes. Snug, not tight. Don't add extra: the designer adds the right room for the style.
            </p>
          </div>
        )}

        <div className="size-guide-footer">
          <div className="footer-size-selector">
            <span>Your size:</span>
            <strong>{selectedSize || 'Not chosen yet'}</strong>
          </div>
          <button className="btn-confirm-size" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
};
