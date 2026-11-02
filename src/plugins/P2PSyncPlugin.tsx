import React, { useState } from 'react';
import { Download, Upload, Share2, Copy, Check, Radio } from 'lucide-react';
import { PluginDefinition } from '../lib/plugins';
import {
  downloadBackupFile,
  restoreStateSnapshot,
  generateP2PRoomCode,
} from '../lib/dataBackup';
import { playCoinSound, playLevelUpSound } from '../lib/soundFx';

export const P2PSyncComponent: React.FC = () => {
  const [roomCode, setRoomCode] = useState<string>('LT-SYNC-77');
  const [copied, setCopied] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleGenerateRoom = () => {
    const code = generateP2PRoomCode();
    setRoomCode(code);
    playCoinSound();
  };

  const copyRoomCode = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      playCoinSound();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = restoreStateSnapshot(content);
      if (res.success) {
        setImportStatus('✅ Данные успешно восстановлены!');
        playLevelUpSound();
      } else {
        setImportStatus(`❌ Ошибка: ${res.error}`);
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 rounded-2xl bg-surface-card border border-surface-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Левая часть: заголовок и статус */}
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shrink-0">
          <Share2 className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">
              P2P WebRTC & Локальный Бэкап
            </span>
            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
              <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
              Готов к связи
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Синхронизация между своими девайсами без центрального сервера (CRDT-задел)
          </p>
        </div>
      </div>

      {/* Правая часть: комната P2P и кнопки JSON бэкапа */}
      <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
        {/* Комната синхронизации */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-mono">Комната:</span>
          <span className="text-xs font-mono font-bold text-cyan-300">{roomCode}</span>
          <button
            type="button"
            onClick={copyRoomCode}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Скопировать код комнаты"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleGenerateRoom}
            className="text-[10px] text-cyan-400 hover:underline ml-1 cursor-pointer"
          >
            Новая
          </button>
        </div>

        {/* Экспорт */}
        <button
          type="button"
          onClick={() => {
            downloadBackupFile();
            playCoinSound();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer"
          title="Скачать JSON снапшот"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Экспорт</span>
        </button>

        {/* Импорт */}
        <label
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer"
          title="Загрузить JSON снапшот"
        >
          <Upload className="w-3.5 h-3.5 text-amber-400" />
          <span>Импорт</span>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Уведомление о статусе */}
      {importStatus && (
        <div className="w-full text-xs font-bold text-center py-1 px-2 rounded-lg bg-slate-900/90 text-cyan-300 border border-cyan-500/30">
          {importStatus}
        </div>
      )}
    </div>
  );
};

export const P2PSyncPlugin: PluginDefinition = {
  manifest: {
    id: 'p2p-sync-vault',
    name: 'P2P WebRTC & Data Vault',
    version: '1.0.0',
    author: 'Living Tracker Core Team',
    description: 'Децентрализованная синхронизация через комнаты WebRTC без внешних серверов и резервное копирование в JSON.',
    icon: '🌐',
    slot: 'dashboard.widgets',
    defaultEnabled: true,
    tags: ['p2p', 'webrtc', 'бэкап', 'json', 'безопасность'],
  },
  component: P2PSyncComponent,
};
