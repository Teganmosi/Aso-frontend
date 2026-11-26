import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { apiErrorMessage, orderApi } from '../../api/client';
import type { FitResult, OrderItem } from '../../types';
import { measurementEntries, measurementLabel } from '../../utils/measurements';

/**
 * "Did it fit?" for one delivered piece. Answers go to Aso (not shown publicly) and tell us
 * which way of sizing works: measured, from clothes, rough estimate or a standard size.
 */
const RESULTS: [FitResult, string][] = [
  ['GREAT', 'Fits well'],
  ['TOO_SMALL', 'Too small / tight'],
  ['TOO_BIG', 'Too big / loose'],
  ['LENGTH', 'Length is off'],
  ['OTHER', 'Something else'],
];
const DEFAULT_AREAS = ['chest_bust', 'waist', 'hips', 'shoulder', 'sleeve_length', 'top_length', 'trouser_length'];

export const FitQuestion: React.FC<{ orderId: string; item: OrderItem }> = ({ orderId, item }) => {
  const [answer, setAnswer] = useState<FitResult | null>(item.fit_feedback ?? null);
  const [editing, setEditing] = useState<boolean>(!item.fit_feedback);
  const [choice, setChoice] = useState<FitResult | null>(null);
  const [areas, setAreas] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const areaOptions = (() => {
    const fromOrder = measurementEntries(item.custom_measurements).map(([k]) => k);
    return fromOrder.length ? fromOrder : DEFAULT_AREAS;
  })();

  const send = async (result: FitResult) => {
    setBusy(true);
    setError('');
    try {
      await orderApi.submitFit(orderId, item.id, { result, areas: result === 'GREAT' ? [] : areas, notes: notes.trim() });
      setAnswer(result);
      setEditing(false);
      setChoice(null);
    } catch (err) {
      setError(apiErrorMessage(err, 'Your answer wasn’t sent. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  if (!editing && answer) {
    return (
      <div className="fit-question fit-question--done">
        <CheckCircle2 size={14} color="#059669" />
        <span>Fit: <strong>{RESULTS.find(([r]) => r === answer)?.[1]}</strong>. Thanks for telling us.</span>
        <button type="button" className="fit-question__link" onClick={() => setEditing(true)}>Change</button>
      </div>
    );
  }

  return (
    <div className="fit-question">
      <p className="fit-question__title">Did it fit?</p>
      <div className="fit-question__options">
        {RESULTS.map(([r, label]) => (
          <button
            key={r}
            type="button"
            className={`fit-question__btn ${choice === r ? 'active' : ''}`}
            disabled={busy}
            onClick={() => (r === 'GREAT' ? send(r) : setChoice(r))}
          >
            {label}
          </button>
        ))}
      </div>
      {choice && choice !== 'GREAT' && (
        <div className="fit-question__more">
          <p className="fit-question__hint">Where? (tap all that apply)</p>
          <div className="fit-question__options">
            {areaOptions.map((a) => (
              <button
                key={a}
                type="button"
                className={`fit-question__chip ${areas.includes(a) ? 'active' : ''}`}
                onClick={() => setAreas((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]))}
              >
                {measurementLabel(a)}
              </button>
            ))}
          </div>
          <textarea
            className="input-field"
            rows={2}
            maxLength={1000}
            placeholder="Anything else? e.g. about 2 inches tight at the waist"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button type="button" className="aso-btn-sm-review" disabled={busy} onClick={() => send(choice)}>
            {busy ? 'Sending…' : 'Send'}
          </button>
          <p className="fit-question__hint">
            If it needs fixing, use “Report a problem” on this order too, so the designer can help.
          </p>
        </div>
      )}
      {error && <p role="alert" className="fit-question__error">{error}</p>}
    </div>
  );
};
