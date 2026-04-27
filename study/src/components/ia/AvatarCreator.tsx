import { useState, useCallback } from 'react';
import AvatarCanvas from './AvatarCanvas';
import { AVATAR_OPTIONS, getRandomConfig, type AvatarConfig } from '../../utils/avatarConfig';

const TABS = [
  { id: 'face', label: '😊', title: 'Visage' },
  { id: 'hair', label: '💇', title: 'Coiffure' },
  { id: 'clothing', label: '👕', title: 'Vêtements' },
  { id: 'colors', label: '🎨', title: 'Couleurs' },
];

interface AvatarCreatorProps {
  config: AvatarConfig;
  onSave: (config: AvatarConfig) => void;
  onClose: () => void;
}

export default function AvatarCreator({ config, onSave, onClose }: AvatarCreatorProps) {
  const [draft, setDraft] = useState<AvatarConfig>({ ...config });
  const [activeTab, setActiveTab] = useState('face');

  const update = useCallback((field: keyof AvatarConfig, value: string) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  }, []);

  const randomize = useCallback(() => setDraft(getRandomConfig()), []);
  const handleSave = useCallback(() => onSave(draft), [draft, onSave]);

  const formatLabel = (str: string) =>
    str.replace(/([A-Z0-9])/g, ' $1').replace(/^./, s => s.toUpperCase());

  const ColorSwatch = ({ colorHex, isSelected, onClick }: { colorHex: string; isSelected: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`ia-color-swatch ${isSelected ? 'ia-color-selected' : ''}`}
      style={{ backgroundColor: `#${colorHex}` }}
    />
  );

  const OptionButton = ({ isSelected, onClick, children }: { isSelected: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className={`ia-option-btn ${isSelected ? 'ia-option-selected' : ''}`}
    >
      {children}
    </button>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'face':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="ia-section-title">Yeux</h4>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.eyes.map(o => <OptionButton key={o} isSelected={draft.eyes === o} onClick={() => update('eyes', o)}>{formatLabel(o)}</OptionButton>)}
              </div>
            </div>
            <div>
              <h4 className="ia-section-title">Sourcils</h4>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.eyebrows.map(o => <OptionButton key={o} isSelected={draft.eyebrows === o} onClick={() => update('eyebrows', o)}>{formatLabel(o)}</OptionButton>)}
              </div>
            </div>
            <div>
              <h4 className="ia-section-title">Bouche</h4>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.mouth.map(o => <OptionButton key={o} isSelected={draft.mouth === o} onClick={() => update('mouth', o)}>{formatLabel(o)}</OptionButton>)}
              </div>
            </div>
            <div>
              <h4 className="ia-section-title">Barbes & Moustaches</h4>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.facialHair.map(o => <OptionButton key={o} isSelected={draft.facialHair === o} onClick={() => update('facialHair', o)}>{formatLabel(o)}</OptionButton>)}
              </div>
            </div>
            <div>
              <h4 className="ia-section-title">Accessoires</h4>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.accessories.map(o => <OptionButton key={o} isSelected={draft.accessories === o} onClick={() => update('accessories', o)}>{formatLabel(o)}</OptionButton>)}
              </div>
            </div>
          </div>
        );
      case 'hair':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="ia-section-title">Coupes & Chapeaux</h4>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.top.map(o => <OptionButton key={o} isSelected={draft.top === o} onClick={() => update('top', o)}>{formatLabel(o)}</OptionButton>)}
              </div>
            </div>
          </div>
        );
      case 'clothing':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="ia-section-title">Tenue Vestimentaire</h4>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.clothing.map(o => <OptionButton key={o} isSelected={draft.clothing === o} onClick={() => update('clothing', o)}>{formatLabel(o)}</OptionButton>)}
              </div>
            </div>
          </div>
        );
      case 'colors':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="ia-section-title">Couleur de Peau</h4>
              <div className="ia-color-row">
                {AVATAR_OPTIONS.skinColor.map(c => <ColorSwatch key={c} colorHex={c} isSelected={draft.skinColor === c} onClick={() => update('skinColor', c)} />)}
              </div>
            </div>
            <div>
              <h4 className="ia-section-title">Couleur des Cheveux</h4>
              <div className="ia-color-row">
                {AVATAR_OPTIONS.hairColor.map(c => <ColorSwatch key={c} colorHex={c} isSelected={draft.hairColor === c} onClick={() => update('hairColor', c)} />)}
              </div>
            </div>
            <div>
              <h4 className="ia-section-title">Couleur des Vêtements</h4>
              <div className="ia-color-row">
                {AVATAR_OPTIONS.clothesColor.map(c => <ColorSwatch key={c} colorHex={c} isSelected={draft.clothesColor === c} onClick={() => update('clothesColor', c)} />)}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center  backdrop-blur-md p-4">
      <div className="ia-creator-modal w-full max-w-[900px] h-[90vh] sm:h-[80vh] flex flex-col rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="ia-creator-header flex items-center justify-between p-5 border-black border-white-800/50">
          <h3 className="text-xl font-extrabold bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent">
            ✨ Studio d'Avatar Pro
          </h3>
          <button onClick={onClose} className="ia-close-btn">✕</button>
        </div>

        {/* Body */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Preview panel */}
          <div className="p-6 md:w-[280px] bg-[#0a0f1a]/40 border-r border-white-800/50 flex flex-col items-center flex-shrink-0">
            <div className="bg-gradient-to-b from-white to-[#0b0f19] border border-white-700/50 rounded-2xl p-4 flex items-center justify-center h-[220px] w-full mb-4 relative group">
              <div className="absolute inset-0 bg-sky-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              <AvatarCanvas config={draft} size={190} className="relative z-10" />
            </div>
            <button
              onClick={randomize}
              className="w-full py-3 px-4 rounded-xl font-bold text-sky-400 border border-sky-500/30 bg-sky-500/5 hover:bg-sky-500/15 transition-all flex items-center justify-center gap-2"
            >
              <span className="text-xl">🎲</span> Générer au hasard
            </button>
          </div>

          {/* Options panel */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#050810]/20">
            {/* Tabs */}
            <div className="flex gap-1 p-3 border-b border-gray-800/40 bg-[#0a0f1a]/20">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.title}
                  className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-sky-500/15 text-sky-400 shadow-[inset_0_2px_0_#0ea5e9]'
                      : 'text-blue-900 hover:bg-white-800/40 hover:text-gray-200'
                  }`}
                >
                  <span className="text-xl mb-1">{tab.label}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">{tab.title}</span>
                </button>
              ))}
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(14,165,233,0.3) transparent' }}>
              {renderTabContent()}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white-800/50 p-5 flex justify-end gap-3 bg-black/40">
          <button onClick={onClose} className="px-5 py-2 rounded-xl text-blue-300 font-medium hover:text-white bg-gray-900 border border-black-700 hover:border-gray-500 transition-all">
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-gradient-to-r from-sky-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-[0_4px_15px_rgba(14,165,233,0.3)] hover:shadow-[0_6px_25px_rgba(14,165,233,0.5)] transition-all"
          >
             Sauvegarder l'Avatar
          </button>
        </div>
      </div>
    </div>
  );
}
