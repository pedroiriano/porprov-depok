import React, { useId } from 'react';
import { Image as PhotoIcon } from 'lucide-react';
import { resolveMediaUrl } from '../../lib/api';

interface BaseInputProps {
  label: string;
  required?: boolean;
}

interface TextInputProps extends BaseInputProps, React.InputHTMLAttributes<HTMLInputElement> {}

export const TextInput = ({ label, required, id, ...props }: TextInputProps) => {
  // ACCESSIBILITY: useId memberi pasangan label/input yang stabil tanpa mengubah API pemakai.
  const generatedId = useId();
  const inputId = id || generatedId;

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
        className={`form-input w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white ${props.className || ''}`}
      />
    </div>
  );
};

interface TextAreaProps extends BaseInputProps, React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const TextArea = ({ label, required, id, ...props }: TextAreaProps) => {
  // ACCESSIBILITY: textarea dapat difokuskan dengan menekan labelnya.
  const generatedId = useId();
  const inputId = id || generatedId;

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
        className={`form-input w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white ${props.className || ''}`}
      />
    </div>
  );
};

interface SelectInputProps extends BaseInputProps, React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string | number; label: string }[];
}

export const SelectInput = ({ label, required, options, id, ...props }: SelectInputProps) => {
  // ACCESSIBILITY: select memiliki nama aksesibel eksplisit dari label terkait.
  const generatedId = useId();
  const inputId = id || generatedId;

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
        className={`form-input w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white ${props.className || ''}`}
      >
        <option value="" disabled>Pilih {label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
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
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {helpText && <p className="mb-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{helpText}</p>}
    <div className={`flex gap-4 ${previewVariant === "landscape" ? "flex-col" : "items-start"}`}>
      <div className={`${previewVariant === "landscape" ? "aspect-video w-full" : "h-24 w-24 shrink-0"} rounded-md bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden`}>
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
          className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 px-3 py-2 rounded-md text-sm font-medium transition-colors text-center border border-indigo-200 dark:border-indigo-800"
        >
          {placeholderText}
        </button>
        {value && (
          <button 
            type="button"
            onClick={onClear}
            className="text-danger-600 hover:text-danger-700 text-sm font-medium text-center"
          >
            Hapus Gambar
          </button>
        )}
      </div>
    </div>
  </div>
);
