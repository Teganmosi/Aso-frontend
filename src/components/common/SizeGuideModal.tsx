import React, { useState } from 'react';
import { X, Ruler, Sparkles, Info } from 'lucide-react';
import type { SizeChart, ProductVariant } from '../../types';
import './SizeGuideModal.css';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  productTitle: string;
  productImage?: string | null;
  sizeChart?: SizeChart;
  selectedSize?: string;
  onSelectSize?: (size: string) => void;
  variants?: ProductVariant[];
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
  isOpen,
  onClose,
  productTitle,
  productImage,
  sizeChart,
  selectedSize,
  onSelectSize,
  variants: _variants = [],
}) => {
  void _variants;
  if (!isOpen) return null;

  // Active View Tab: 'body' | 'product' | 'how-to-measure'
  const [activeTab, setActiveTab] = useState<'body' | 'product' | 'how-to-measure'>('body');
  // Unit: 'IN' (Inches) vs 'CM' (Centimeters)
  const [unit, setUnit] = useState<'IN' | 'CM'>(sizeChart?.unit_default || 'IN');
  // Sizing Standard: 'STANDARD' vs 'US'
  const [standardType, setStandardType] = useState<'STANDARD' | 'US'>('STANDARD');
  // Subtab for product measurements: 'tops' | 'bottoms'
  const [garmentPart, setGarmentPart] = useState<'tops' | 'bottoms'>('tops');

  const stretch = sizeChart?.stretch || 'NON';
  const bodyRows = sizeChart?.body_measurements || [];
  const topsRows = sizeChart?.garment_measurements?.tops || [];
  const bottomsRows = sizeChart?.garment_measurements?.bottoms || [];

  const stretchLabels: Record<string, { label: string; desc: string }> = {
    NON: { label: 'Non-Stretch', desc: 'Rigid tailored luxury weave (Senator wool / Silk / Damask). Retains structured silhouette.' },
    SLIGHT: { label: 'Slight Stretch', desc: 'Mild give for flexibility while retaining sharp bespoke lines.' },
    MEDIUM: { label: 'Medium Stretch', desc: 'Comfortable flexibility adapted to body contours.' },
    HIGH: { label: 'High Stretch', desc: 'Significant elastane for figure-hugging or bodycon wear.' },
  };

  const handleSelectSize = (sz: string) => {
    if (onSelectSize) {
      onSelectSize(sz);
    }
  };

  return (
    <div className="size-guide-overlay" onClick={onClose}>
      <div className="size-guide-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
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
              <span className="size-guide-badge">Atelier Sizing Engine</span>
              <h3 className="size-guide-title">{productTitle}</h3>
            </div>
          </div>
          <button className="size-guide-close-btn" onClick={onClose} aria-label="Close size guide">
            <X size={20} />
          </button>
        </div>

        {/* Control Bar: Switch Sizing, Units, and Stretch */}
        <div className="size-guide-controls-bar">
          {/* Sizing Standard Switch */}
          <div className="control-group">
            <span className="control-label">Sizing:</span>
            <div className="segmented-switch">
              <button
                className={`switch-option ${standardType === 'STANDARD' ? 'active' : ''}`}
                onClick={() => setStandardType('STANDARD')}
              >
                Standard (UK/NG)
              </button>
              <button
                className={`switch-option ${standardType === 'US' ? 'active' : ''}`}
                onClick={() => setStandardType('US')}
              >
                US Size
              </button>
            </div>
          </div>

          {/* Unit Toggle: IN vs CM */}
          <div className="control-group">
            <span className="control-label">Unit:</span>
            <div className="segmented-switch">
              <button
                className={`switch-option ${unit === 'IN' ? 'active' : ''}`}
                onClick={() => setUnit('IN')}
              >
                IN
              </button>
              <button
                className={`switch-option ${unit === 'CM' ? 'active' : ''}`}
                onClick={() => setUnit('CM')}
              >
                CM
              </button>
            </div>
          </div>
        </div>

        {/* Stretch Indicator */}
        <div className="stretch-meter-card">
          <div className="stretch-meter-header">
            <span className="stretch-title">Fabric Elasticity & Stretch</span>
            <span className={`stretch-badge stretch-${stretch.toLowerCase()}`}>
              {stretchLabels[stretch]?.label || stretch}
            </span>
          </div>
          <div className="stretch-meter-track">
            {['NON', 'SLIGHT', 'MEDIUM', 'HIGH'].map((level, idx) => {
              const activeIndex = ['NON', 'SLIGHT', 'MEDIUM', 'HIGH'].indexOf(stretch);
              const isFilled = idx <= activeIndex;
              return (
                <div
                  key={level}
                  className={`stretch-segment ${isFilled ? 'filled' : ''} ${level === stretch ? 'current' : ''}`}
                >
                  <span className="segment-label">{level === 'NON' ? 'Non' : level === 'SLIGHT' ? 'Slight' : level === 'MEDIUM' ? 'Medium' : 'High'}</span>
                </div>
              );
            })}
          </div>
          <p className="stretch-desc">{stretchLabels[stretch]?.desc}</p>
        </div>

        {/* Main Tabs Navigation */}
        <div className="size-guide-tabs">
          <button
            className={`tab-item ${activeTab === 'body' ? 'active' : ''}`}
            onClick={() => setActiveTab('body')}
          >
            Body Measurements
          </button>
          <button
            className={`tab-item ${activeTab === 'product' ? 'active' : ''}`}
            onClick={() => setActiveTab('product')}
          >
            Product Dimensions
          </button>
          <button
            className={`tab-item ${activeTab === 'how-to-measure' ? 'active' : ''}`}
            onClick={() => setActiveTab('how-to-measure')}
          >
            How to Measure
          </button>
        </div>

        {/* Tab 1: Body Measurements */}
        {activeTab === 'body' && (
          <div className="size-guide-tab-content">
            <div className="table-disclaimer-banner">
              <Info size={14} color="#0C3B2E" />
              <span>
                These measurements reflect personal body dimensions. If your measurements fall between sizes, choose the larger size for a traditional relaxed fit.
              </span>
            </div>

            <div className="table-responsive-wrapper">
              <table className="size-guide-table">
                <thead>
                  <tr>
                    <th>Label Size</th>
                    {standardType === 'US' && <th>US Size</th>}
                    <th>Bust / Chest ({unit})</th>
                    <th>Waist ({unit})</th>
                    <th>Hips ({unit})</th>
                    <th>Height</th>
                  </tr>
                </thead>
                <tbody>
                  {bodyRows.map((row) => {
                    const isSelected = selectedSize?.toUpperCase() === row.size.toUpperCase();
                    const bustVal = unit === 'CM' ? (row.bust_cm || row.bust) : row.bust;
                    const waistVal = unit === 'CM' ? (row.waist_cm || row.waist) : row.waist;
                    const hipVal = unit === 'CM' ? (row.hip_cm || row.hip) : (row.hip || '-');
                    const heightVal = unit === 'CM' ? (row.height_cm ? `${row.height_cm} cm` : row.height) : row.height;

                    return (
                      <tr
                        key={row.size}
                        className={`size-table-row ${isSelected ? 'row-selected' : ''}`}
                        onClick={() => handleSelectSize(row.size)}
                      >
                        <td className="cell-size-label">
                          <strong>{row.size}</strong>
                          {isSelected && <span className="selected-indicator">Selected</span>}
                        </td>
                        {standardType === 'US' && <td className="cell-secondary">{row.us_size || '-'}</td>}
                        <td>{bustVal}</td>
                        <td>{waistVal}</td>
                        <td>{hipVal}</td>
                        <td className="cell-secondary">{heightVal || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="size-guide-footnote">
              Depending on your body type and dressing habits, the above sizes are for reference only.
            </p>
          </div>
        )}

        {/* Tab 2: Product / Garment Dimensions */}
        {activeTab === 'product' && (
          <div className="size-guide-tab-content">
            {(topsRows.length > 0 || bottomsRows.length > 0) && (
              <div className="garment-part-subtabs">
                {topsRows.length > 0 && (
                  <button
                    className={`subtab-btn ${garmentPart === 'tops' ? 'active' : ''}`}
                    onClick={() => setGarmentPart('tops')}
                  >
                    Tops / Kaftan / Jacket
                  </button>
                )}
                {bottomsRows.length > 0 && (
                  <button
                    className={`subtab-btn ${garmentPart === 'bottoms' ? 'active' : ''}`}
                    onClick={() => setGarmentPart('bottoms')}
                  >
                    Bottoms / Trousers
                  </button>
                )}
              </div>
            )}

            <div className="table-disclaimer-banner">
              <Info size={14} color="#0C3B2E" />
              <span>
                These are the physical dimensions of the garment laid flat, crafted with precision tailoring ease.
              </span>
            </div>

            {garmentPart === 'tops' && topsRows.length > 0 && (
              <div className="table-responsive-wrapper">
                <table className="size-guide-table">
                  <thead>
                    <tr>
                      <th>Label Size</th>
                      {standardType === 'US' && <th>US</th>}
                      <th>Shoulder ({unit})</th>
                      <th>Chest / Bust ({unit})</th>
                      <th>Length ({unit})</th>
                      <th>Sleeve Length ({unit})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topsRows.map((row) => {
                      const isSelected = selectedSize?.toUpperCase() === row.size.toUpperCase();
                      const shoulderVal = unit === 'CM' ? (row.shoulder_cm || row.shoulder) : row.shoulder;
                      const chestVal = unit === 'CM' ? (row.chest_cm || row.bust_cm || row.chest || row.bust) : (row.chest || row.bust);
                      const lengthVal = unit === 'CM' ? (row.length_cm || row.length) : row.length;
                      const sleeveVal = unit === 'CM' ? (row.sleeve_cm || row.sleeve) : row.sleeve;

                      return (
                        <tr
                          key={row.size}
                          className={`size-table-row ${isSelected ? 'row-selected' : ''}`}
                          onClick={() => handleSelectSize(row.size)}
                        >
                          <td className="cell-size-label">
                            <strong>{row.size}</strong>
                            {isSelected && <span className="selected-indicator">Selected</span>}
                          </td>
                          {standardType === 'US' && <td className="cell-secondary">{row.us_size || '-'}</td>}
                          <td>{shoulderVal || '-'}</td>
                          <td>{chestVal || '-'}</td>
                          <td>{lengthVal || '-'}</td>
                          <td>{sleeveVal || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {garmentPart === 'bottoms' && bottomsRows.length > 0 && (
              <div className="table-responsive-wrapper">
                <table className="size-guide-table">
                  <thead>
                    <tr>
                      <th>Label Size</th>
                      {standardType === 'US' && <th>US</th>}
                      <th>Waistband ({unit})</th>
                      <th>Hip ({unit})</th>
                      <th>Trouser Length ({unit})</th>
                      <th>Inseam ({unit})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bottomsRows.map((row) => {
                      const isSelected = selectedSize?.toUpperCase() === row.size.toUpperCase();
                      const waistVal = unit === 'CM' ? (row.waist_cm || row.waist) : row.waist;
                      const hipVal = unit === 'CM' ? (row.hip_cm || row.hip) : row.hip;
                      const lengthVal = unit === 'CM' ? (row.length_cm || row.length) : row.length;
                      const inseamVal = unit === 'CM' ? (row.inseam_cm || row.inseam) : row.inseam;

                      return (
                        <tr
                          key={row.size}
                          className={`size-table-row ${isSelected ? 'row-selected' : ''}`}
                          onClick={() => handleSelectSize(row.size)}
                        >
                          <td className="cell-size-label">
                            <strong>{row.size}</strong>
                            {isSelected && <span className="selected-indicator">Selected</span>}
                          </td>
                          {standardType === 'US' && <td className="cell-secondary">{row.us_size || '-'}</td>}
                          <td>{waistVal || '-'}</td>
                          <td>{hipVal || '-'}</td>
                          <td>{lengthVal || '-'}</td>
                          <td>{inseamVal || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <p className="size-guide-footnote">
              The data is measured manually by the cutting atelier and may have minor discrepancies (?1-2cm / 0.5in).
            </p>
          </div>
        )}

        {/* Tab 3: How to Measure Illustrated Guide */}
        {activeTab === 'how-to-measure' && (
          <div className="size-guide-tab-content how-to-measure-content">
            <div className="measure-guide-grid">
              <div className="measure-step-card">
                <div className="step-num">1</div>
                <div>
                  <h4>Collar circumference</h4>
                  <p>Wrap measuring tape around the base of the neck where the collar sits, leaving a one-finger comfort gap.</p>
                </div>
              </div>

              <div className="measure-step-card">
                <div className="step-num">2</div>
                <div>
                  <h4>Chest / Bust</h4>
                  <p>Measure completely around the fullest circumference under the armpits, keeping the tape level across the back.</p>
                </div>
              </div>

              <div className="measure-step-card">
                <div className="step-num">3</div>
                <div>
                  <h4>Waist</h4>
                  <p>Measure around the natural waistband where your trousers or Kaftan comfortably sits.</p>
                </div>
              </div>

              <div className="measure-step-card">
                <div className="step-num">4</div>
                <div>
                  <h4>Length</h4>
                  <p>Measure from the highest neckline/shoulder seam straight down to your desired hemline.</p>
                </div>
              </div>

              <div className="measure-step-card">
                <div className="step-num">5</div>
                <div>
                  <h4>Sleeve length</h4>
                  <p>Measure from the tip of the shoulder seam straight down to the end of the wrist cuff.</p>
                </div>
              </div>

              <div className="measure-step-card">
                <div className="step-num">6</div>
                <div>
                  <h4>Cuff circumference</h4>
                  <p>Measure the full circumference around the wrist opening of the sleeve.</p>
                </div>
              </div>

              <div className="measure-step-card">
                <div className="step-num">7</div>
                <div>
                  <h4>Shoulder</h4>
                  <p>Measure across the back from one shoulder seam to the other shoulder seam (crucial for clean Senator drape).</p>
                </div>
              </div>

              <div className="measure-step-card">
                <div className="step-num">8</div>
                <div>
                  <h4>Trouser Inseam</h4>
                  <p>Measure along the inside of your leg from the crotch seam straight down to the ankle bone.</p>
                </div>
              </div>
            </div>

            <div className="bespoke-callout-box">
              <Sparkles size={18} color="#D4AF37" />
              <div>
                <strong>Want 100% Bespoke Custom Tailoring?</strong>
                <p>Select "Bespoke Fit" on the garment page. Your personal atelier profile measurements will be sent directly to the designer.</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="size-guide-footer">
          <div className="footer-size-selector">
            <span>Selected Fit:</span>
            <strong>{selectedSize || 'Choose a size'}</strong>
          </div>
          <button className="btn-confirm-size" onClick={onClose}>
            Done & Apply
          </button>
        </div>
      </div>
    </div>
  );
};
