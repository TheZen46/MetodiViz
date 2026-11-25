import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { MathfieldElement } from 'mathlive';
import { tryParseLatex } from '../engine/latex/latexParser';

let mathliveConfigured = false;
function ensureMathliveConfigured() {
  if (mathliveConfigured) return;
  MathfieldElement.fontsDirectory = '/mathlive/fonts';
  MathfieldElement.soundsDirectory = '/mathlive/sounds';
  mathliveConfigured = true;
}

interface MathLatexInputProps {
  label?: string;
  value: string;
  onChange: (latex: string) => void;
  placeholder?: string;
}

export const MathLatexInput: React.FC<MathLatexInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
}) => {
  const inputId = useId();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mfRef = useRef<MathfieldElement | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [rawMode, setRawMode] = useState(false);

  const parseCheck = useMemo(() => tryParseLatex(value), [value]);

  useEffect(() => {
    if (rawMode) return;
    ensureMathliveConfigured();
    const host = hostRef.current;
    if (!host) return;

    const mf = new MathfieldElement();
    mf.id = inputId;
    mf.value = value;
    mf.mathVirtualKeyboardPolicy = 'manual';
    if (label) mf.setAttribute('aria-label', label);
    if (placeholder) mf.setAttribute('placeholder', placeholder);

    const handleInput = () => {
      onChangeRef.current(mf.value);
    };

    mf.addEventListener('input', handleInput);
    host.innerHTML = '';
    host.appendChild(mf);
    mfRef.current = mf;

    return () => {
      mf.removeEventListener('input', handleInput);
      mfRef.current = null;
      host.innerHTML = '';
    };
  }, [rawMode, placeholder, inputId, label]);

  useEffect(() => {
    if (rawMode) return;
    const mf = mfRef.current;
    if (mf && mf.value !== value) {
      mf.value = value;
    }
  }, [value, rawMode]);

  return (
    <div className="math-input-wrap">
      <div className="math-input-header">
        <label htmlFor={inputId}>{label ?? 'Formula'}</label>
        <div className="inline-row">
          <span
            aria-live="polite"
            className={parseCheck.error ? 'math-status-error' : 'math-status-valid'}
          >
            {parseCheck.error ? 'Sintassi errata' : 'Valida'}
          </span>
          <button
            type="button"
            className="viz-btn"
            aria-pressed={rawMode}
            onClick={() => setRawMode((m) => !m)}
          >
            {rawMode ? 'Editor visivo' : 'Codice LaTeX'}
          </button>
        </div>
      </div>

      <div className={`math-input-box ${parseCheck.error ? 'invalid' : ''}`}>
        {rawMode ? (
          <input
            id={inputId}
            type="text"
            className="raw-latex-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder ?? 'Es: \\frac{x^2 - y^2}{2}'}
          />
        ) : (
          <div ref={hostRef} style={{ width: '100%' }} />
        )}
      </div>

      {parseCheck.error && (
        <div className="math-input-error" role="alert">
          {parseCheck.error}
        </div>
      )}
    </div>
  );
};
