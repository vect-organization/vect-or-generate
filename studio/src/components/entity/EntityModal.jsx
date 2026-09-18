import React, { useState } from 'react';
import { SEMANTIC_LAYERS } from '../../constants/domainConfig';

export default function EntityModal({ isOpen, onClose, onSave, initialData = null }) {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    reading: '',
    definition: '',
    layer: 4,
    code: '',
    synonyms: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const layerNum = parseInt(formData.layer, 10) || 4;
    const synonymsList = typeof formData.synonyms === 'string'
      ? formData.synonyms.split(/[,;、|]/).map(s => s.trim()).filter(Boolean)
      : formData.synonyms || [];

    onSave({
      ...formData,
      layer: layerNum,
      layerName: `L${layerNum} Semantic`,
      synonyms: synonymsList
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-card border border-border-default rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="p-4 border-b border-border-default flex justify-between items-center bg-surface-mica">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">edit_note</span>
            <h3 className="font-bold text-on-surface text-[15px]">
              {initialData ? 'Edit Knowledge Entity' : 'Add New Knowledge Entity'}
            </h3>
          </div>
          <button onClick={onClose} className="text-outline hover:text-on-surface p-1 rounded-lg">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-on-surface-variant">Term Name *</span>
              <input
                required
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Major Depression"
                className="bg-surface-mica border border-border-default rounded-lg px-3 py-2 text-[13px] text-on-surface fluent-input outline-none"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-on-surface-variant">Reading / Phonetic</span>
              <input
                type="text"
                value={formData.reading}
                onChange={e => setFormData({ ...formData, reading: e.target.value })}
                placeholder="e.g. depression"
                className="bg-surface-mica border border-border-default rounded-lg px-3 py-2 text-[13px] text-on-surface fluent-input outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-on-surface-variant">Semantic Layer</span>
              <select
                value={formData.layer}
                onChange={e => setFormData({ ...formData, layer: Number(e.target.value) })}
                className="bg-surface-mica border border-border-default rounded-lg px-3 py-2 text-[13px] text-on-surface fluent-input outline-none"
              >
                {SEMANTIC_LAYERS.map(l => (
                  <option key={l.id} value={l.id}>L{l.id}: {l.name}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-on-surface-variant">Taxonomy / ICD Code</span>
              <input
                type="text"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. F32.9"
                className="bg-surface-mica border border-border-default rounded-lg px-3 py-2 text-[13px] text-on-surface fluent-input outline-none"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-on-surface-variant">Concept Definition *</span>
            <textarea
              required
              rows={3}
              value={formData.definition}
              onChange={e => setFormData({ ...formData, definition: e.target.value })}
              placeholder="Enter standardized domain definition..."
              className="bg-surface-mica border border-border-default rounded-lg p-3 text-[13px] text-on-surface fluent-input outline-none resize-none"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-on-surface-variant">Synonyms (Comma separated)</span>
            <input
              type="text"
              value={Array.isArray(formData.synonyms) ? formData.synonyms.join(', ') : formData.synonyms}
              onChange={e => setFormData({ ...formData, synonyms: e.target.value })}
              placeholder="e.g. Clinical Depression, Unipolar Depression"
              className="bg-surface-mica border border-border-default rounded-lg px-3 py-2 text-[13px] text-on-surface fluent-input outline-none"
            />
          </label>

          <div className="flex justify-end gap-2.5 mt-3 pt-3 border-t border-border-default">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-[13px] text-on-surface-variant hover:bg-surface-mica transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              Save Entity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
