import React, { useId } from 'react';
import { Image as PhotoIcon } from 'lucide-react';
import { resolveMediaUrl } from '../../lib/api';

interface BaseInputProps {
  label: string;
  required?: boolean;
  helpText?: string;
  error?: string;
}

interface TextInputProps extends BaseInputProps, React.InputHTMLAttributes<HTMLInputElement> {}

export const TextInput = ({ label, required, helpText, error, id, ...props }: TextInputProps) => {
  // ACCESSIBILITY: useId memberi pasangan label/input yang stabil tanpa mengubah API pemakai.
  const generatedId = useId();
  const inputId = id || generatedId;
  const messageId = `${inputId}-message`;

  return (
    <div>
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label} {required && <span className="text-red-500" aria-hidden="true">*</span>}
      </label>
      <input
        {...props}
        id={inputId}
        required={required}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || helpText ? messageId : props['aria-describedby']}
        className={`form-input min-h-11 w-full rounded-xl border bg-white px-3 py-2 text-slate-900 transition-colors focus:outline-none focus:ring-2 dark:bg-slate-800 dark:text-white ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600'} ${props.className || ''}`}
      />
      {(error || helpText) && <p id={messageId} className={`mt-1.5 text-xs ${error ? 'font-bold text-red-600 dark:text-red-300' : 'text-slate-500 dark:text-slate-400'}`}>{error || helpText}</p>}
    </div>
  );
};

interface TextAreaProps extends BaseInputProps, React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const TextArea = ({ label, required, helpText, error, id, ...props }: TextAreaProps) => {
  // ACCESSIBILITY: textarea dapat difokuskan dengan menekan labelnya.
  const generatedId = useId();
  const inputId = id || generatedId;
  const messageId = `${inputId}-message`;

  return (
    <div>
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label} {required && <span className="text-red-500" aria-hidden="true">*</span>}
      </label>
      <textarea
        {...props}
        id={inputId}
        required={required}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || helpText ? messageId : props['aria-describedby']}
        className={`form-input w-full rounded-xl border bg-white px-3 py-2 text-slate-900 transition-colors focus:outline-none focus:ring-2 dark:bg-slate-800 dark:text-white ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600'} ${props.className || ''}`}
      />
      {(error || helpText) && <p id={messageId} className={`mt-1.5 text-xs ${error ? 'font-bold text-red-600 dark:text-red-300' : 'text-slate-500 dark:text-slate-400'}`}>{error || helpText}</p>}
    </div>
  );
};

interface SelectInputProps extends BaseInputProps, React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string | number; label: string }[];
}

export const SelectInput = ({ label, required, options, helpText, error, id, ...props }: SelectInputProps) => {
  // ACCESSIBILITY: select memiliki nama aksesibel eksplisit dari label terkait.
  const generatedId = useId();
  const inputId = id || generatedId;
  const messageId = `${inputId}-message`;

  return (
    <div>
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label} {required && <span className="text-red-500" aria-hidden="true">*</span>}
      </label>
      <select
        {...props}
        id={inputId}
        required={required}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || helpText ? messageId : props['aria-describedby']}
        className={`form-input min-h-11 w-full rounded-xl border bg-white px-3 py-2 text-slate-900 transition-colors focus:outline-none focus:ring-2 dark:bg-slate-800 dark:text-white ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600'} ${props.className || ''}`}
      >
        <option value="" disabled>Pilih {label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {(error || helpText) && <p id={messageId} className={`mt-1.5 text-xs ${error ? 'font-bold text-red-600 dark:text-red-300' : 'text-slate-500 dark:text-slate-400'}`}>{error || helpText}</p>}
    </div>
  );
};

interface MediaInputProps extends BaseInputProps {
  value: string;
  onClear: () => void;
  onSelect: () => void;
  placeholderText?: string;
  previewVariant?: "square" | "landscape";
  helpText?: string;
}

export const MediaInput = ({ label, required, value, onClear, onSelect, placeholderText = "Pilih dari Media Library", previewVariant = "square", helpText }: MediaInputProps) => (
  <div>
    <p className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
      {label} {required && <span className="text-red-500" aria-hidden="true">*</span>}
    </p>
    {helpText && <p className="mb-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{helpText}</p>}
    <div className={`flex gap-4 ${previewVariant === "landscape" ? "flex-col" : "items-start"}`}>
      <div className={`${previewVariant === "landscape" ? "aspect-video w-full" : "h-24 w-24 shrink-0"} flex items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-100 dark:border-slate-600 dark:bg-slate-800`}>
        {value ? (
          <img src={resolveMediaUrl(value)} alt={`Pratinjau ${label}`} className={`w-full h-full bg-white dark:bg-slate-900 ${previewVariant === "landscape" ? "object-cover" : "object-contain"}`} />
        ) : (
          <PhotoIcon className="w-8 h-8 text-slate-400" />
        )}
      </div>
      <div className="flex-1 flex flex-col gap-2">
        <button 
          type="button"
          onClick={onSelect}
          className="min-h-11 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-center text-sm font-bold text-blue-700 transition-colors hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200 dark:hover:bg-blue-950/70"
        >
          {placeholderText}
        </button>
        {value && (
          <button 
            type="button"
            onClick={onClear}
            className="min-h-11 rounded-xl px-3 text-center text-sm font-bold text-red-600 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-red-300 dark:hover:bg-red-950/40"
          >
            Hapus Gambar
          </button>
        )}
      </div>
    </div>
  </div>
);
