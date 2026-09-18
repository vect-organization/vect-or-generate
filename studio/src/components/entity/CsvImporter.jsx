import React, { useState } from 'react';
import { parseAndNormalizeData } from '../../services/csvParser';

export default function CsvImporter({ onImport }) {
  const [isDragging, setIsDragging] = useState(false);
  const [importStatus, setImportStatus] = useState(null);

  const processFile = (file) => {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        // The deep module parseAndNormalizeData automatically routes to XML, JSON, or CSV/TSV
        const imported = parseAndNormalizeData(text);

        if (imported.length > 0) {
          onImport(imported);
          setImportStatus(`Imported ${imported.length} items successfully`);
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          alert('No valid entities found. Please ensure your file has valid entity data.');
        }
      } catch (err) {
        console.error('[Import Error]', err);
        alert('Failed to parse file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    processFile(file);
    e.target.value = ''; // Reset input
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border border-dashed rounded-xl p-3 text-center transition-all cursor-pointer ${
        isDragging
          ? 'border-primary bg-primary/10 scale-[0.99]'
          : 'border-border-default hover:border-primary/50 bg-surface-card/60 hover:bg-surface-card'
      }`}
    >
      <label className="flex flex-col items-center justify-center gap-1.5 cursor-pointer w-full">
        <input
          type="file"
          accept=".csv,.tsv,.txt,.json,.xml"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex items-center gap-2 text-primary font-medium text-[12px]">
          <span className="material-symbols-outlined text-[18px]">upload_file</span>
          <span>Import CSV / JSON / XML</span>
        </div>
        <span className="text-[10px] text-on-surface-variant/80">
          {importStatus ? (
            <span className="text-secondary font-bold">{importStatus}</span>
          ) : (
            'Drag & drop or click (JSON / CSV / TSV / XML)'
          )}
        </span>
      </label>
    </div>
  );
}

