import React, { useState } from 'react';

export default React.memo(function ArtifactExportPanel({ onExport, domainName = 'general' }) {
  const [selectedFormats, setSelectedFormats] = useState({
    json: true,
    safetensors: true,
    guideline: true,
    ime: true,
    audit: true
  });

  const [isEncrypted, setIsEncrypted] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const toggleFormat = (key) => {
    setSelectedFormats(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExportClick = () => {
    if (isEncrypted && !password.trim()) {
      alert('暗号化を有効にする場合はパスワードを入力してください。');
      return;
    }
    onExport({
      ...selectedFormats,
      isEncrypted,
      password: password.trim()
    });
  };

  return (
    <div className="mt-auto pt-4 border-t border-border-default bg-surface-mica/50 -mx-4 -mb-4 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-bold text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-[17px]">inventory_2</span>
          5-Artifact Export Bundle
        </span>
        <span className="text-[10px] font-mono text-outline">{domainName}</span>
      </div>

      {/* Format Checkbox Selectors */}
      <div className="grid grid-cols-2 gap-1.5 text-[11px] font-code-sm text-on-surface-variant">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedFormats.json}
            onChange={() => toggleFormat('json')}
            className="rounded border-border-default bg-surface-card text-primary cursor-pointer"
          />
          <span>{isEncrypted ? 'kb.venc (Encrypted)' : 'kb.json (10-Layer)'}</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedFormats.safetensors}
            onChange={() => toggleFormat('safetensors')}
            className="rounded border-border-default bg-surface-card text-primary cursor-pointer"
          />
          <span>safetensors (Binary)</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedFormats.guideline}
            onChange={() => toggleFormat('guideline')}
            className="rounded border-border-default bg-surface-card text-primary cursor-pointer"
          />
          <span>guideline.json</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedFormats.ime}
            onChange={() => toggleFormat('ime')}
            className="rounded border-border-default bg-surface-card text-primary cursor-pointer"
          />
          <span>ime.txt (TSV)</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer col-span-2">
          <input
            type="checkbox"
            checked={selectedFormats.audit}
            onChange={() => toggleFormat('audit')}
            className="rounded border-border-default bg-surface-card text-primary cursor-pointer"
          />
          <span>audit_manifest.json (SHA-256)</span>
        </label>
      </div>

      {/* Encryption / Vault Option Section */}
      <div className="p-2.5 rounded-xl bg-surface-card border border-border-default flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-on-surface">
            <input
              type="checkbox"
              checked={isEncrypted}
              onChange={(e) => setIsEncrypted(e.target.checked)}
              className="rounded border-border-default bg-surface-mica text-secondary cursor-pointer"
            />
            <span className="material-symbols-outlined text-[15px] text-secondary">lock</span>
            <span>Vault暗号化 (.venc出力)</span>
          </label>
          <span className="text-[9px] font-mono text-outline">AES-256-GCM</span>
        </div>

        {isEncrypted && (
          <div className="flex items-center gap-1.5 relative mt-0.5">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="暗号化パスワードを入力..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-mica border border-border-default rounded-lg px-2.5 py-1.5 text-[11px] font-code-sm text-on-surface outline-none focus:border-secondary transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              className="absolute right-2 text-outline hover:text-on-surface text-[14px] flex items-center"
            >
              <span className="material-symbols-outlined text-[16px]">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Primary Export Button */}
      <button
        onClick={handleExportClick}
        className="fluent-btn bg-primary hover:bg-primary/90 text-on-primary text-[13px] font-bold py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer w-full mt-0.5"
      >
        <span className="material-symbols-outlined text-[18px]">
          {isEncrypted ? 'lock' : 'download'}
        </span>
        <span>{isEncrypted ? '暗号化してエクスポート (.venc)' : 'Export Artifacts Bundle'}</span>
      </button>
    </div>
  );
});
