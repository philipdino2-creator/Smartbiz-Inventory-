import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileSpreadsheet, FileText, Check } from 'lucide-react';

export interface ExportDropdownProps {
  onExportCSV: () => void | Promise<void>;
  onExportExcel: () => void | Promise<void>;
  onExportPDF: () => void | Promise<void>;
  label?: string;
  disabled?: boolean;
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({
  onExportCSV,
  onExportExcel,
  onExportPDF,
  label = 'Export',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [recentType, setRecentType] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = async (type: 'csv' | 'xlsx' | 'pdf', action: () => void | Promise<void>) => {
    try {
      setIsExporting(true);
      await action();
      setRecentType(type);
      setTimeout(() => setRecentType(null), 2000);
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled || isExporting}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 sm:py-2 text-xs font-semibold rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer ${
          disabled
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <Download className="w-3.5 h-3.5 text-slate-500" />
        <span>{isExporting ? 'Exporting...' : label}</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in duration-150">
          <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-100 mb-1">
            Export Filtered Data
          </div>

          <button
            type="button"
            onClick={() => handleAction('csv', onExportCSV)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Comma Separated (.csv)</span>
            </div>
            {recentType === 'csv' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
          </button>

          <button
            type="button"
            onClick={() => handleAction('xlsx', onExportExcel)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-700 font-bold" />
              <span>Microsoft Excel (.xlsx)</span>
            </div>
            {recentType === 'xlsx' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
          </button>

          <button
            type="button"
            onClick={() => handleAction('pdf', onExportPDF)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-rose-600" />
              <span>PDF Document (.pdf)</span>
            </div>
            {recentType === 'pdf' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
          </button>
        </div>
      )}
    </div>
  );
};
