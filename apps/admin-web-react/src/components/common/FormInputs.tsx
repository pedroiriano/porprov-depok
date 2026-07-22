import React from 'react';
import { Image as PhotoIcon } from 'lucide-react';
import { resolveMediaUrl } from '../../lib/api';

interface BaseInputProps {
  label: string;
  required?: boolean;
}

interface TextInputProps extends BaseInputProps, React.InputHTMLAttributes<HTMLInputElement> {}

export const TextInput = ({ label, required, ...props }: TextInputProps) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input 
      {...props}
      required={required}
      className={`form-input w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${props.className || ''}`}
    />
  </div>
);

interface TextAreaProps extends BaseInputProps, React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const TextArea = ({ label, required, ...props }: TextAreaProps) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <textarea 
      {...props}
      required={required}
      className={`form-input w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${props.className || ''}`}
    />
  </div>
);

interface SelectInputProps extends BaseInputProps, React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string | number; label: string }[];
}

export const SelectInput = ({ label, required, options, ...props }: SelectInputProps) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select 
      {...props}
      required={required}
      className={`form-input w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${props.className || ''}`}
    >
      <option value="" disabled>Pilih {label}</option>
      {options.map((opt, i) => (
        <option key={i} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

interface MediaInputProps extends BaseInputProps {
  value: string;
  onClear: () => void;
  onSelect: () => void;
  placeholderText?: string;
}

export const MediaInput = ({ label, required, value, onClear, onSelect, placeholderText = "Pilih dari Media Library" }: MediaInputProps) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="flex items-start gap-4">
      <div className="w-24 h-24 rounded-md bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden shrink-0">
        {value ? (
          <img src={resolveMediaUrl(value)} alt={`Pratinjau ${label}`} className="w-full h-full object-contain bg-white dark:bg-slate-900" />
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
