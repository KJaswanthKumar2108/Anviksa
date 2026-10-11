import React, { useState } from 'react';
import { User, Bell, Moon, Sun, Save, Check, Palette, CheckCircle2, Sparkles } from 'lucide-react';
import {
  ThemePalette,
  ThemeMode,
  ThemeConfig,
  RESEARCH_PALETTES,
  getInitialTheme,
  applyTheme
} from '../utils/themeManager';

interface SettingsViewProps {
  themeConfig?: ThemeConfig;
  onThemeChange?: (config: ThemeConfig) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  themeConfig: initialConfig,
  onThemeChange
}) => {
  const [name, setName] = useState('');
  const [hierarchyRole, setHierarchyRole] = useState<string>('Researcher');
  const [institution, setInstitution] = useState('');
  const [orcid, setOrcid] = useState('');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Active theme state
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(() => initialConfig || getInitialTheme());

  const handlePaletteSelect = (palette: ThemePalette) => {
    const updated: ThemeConfig = { ...currentTheme, palette };
    setCurrentTheme(updated);
    applyTheme(updated.palette, updated.mode);
    onThemeChange?.(updated);
  };

  const handleModeToggle = (mode: ThemeMode) => {
    const updated: ThemeConfig = { ...currentTheme, mode };
    setCurrentTheme(updated);
    applyTheme(updated.palette, updated.mode);
    onThemeChange?.(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    applyTheme(currentTheme.palette, currentTheme.mode);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      
      {/* Header */}
      <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs">
        <h1 className="text-xl font-bold text-[#342F27]">Workspace & Account Settings</h1>
        <p className="text-xs text-[#6B6255] mt-1">
          Customize your researcher profile, academic visual theme, day/night lighting modes, and notifications.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs text-[#342F27]">
        
        {/* Research Themes & Appearance */}
        <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCD5BC]">
            <div>
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#8B5E34]" />
                <h3 className="font-bold text-sm text-[#342F27]">Research-Tailored Color Themes</h3>
              </div>
              <p className="text-[11px] text-[#6B6255] mt-0.5">
                Every theme is engineered for scientific reading, high contrast accessibility, and zero eye fatigue.
              </p>
            </div>

            {/* Day / Night Mode Toggle */}
            <div className="flex items-center gap-1.5 bg-[#FEFAE0] p-1 rounded-xl border border-[#DCD5BC] shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => handleModeToggle('light')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  currentTheme.mode === 'light'
                    ? 'bg-[#CCD5AE] text-[#342F27] border border-[#B8C299] shadow-xs'
                    : 'text-[#6B6255] hover:text-[#342F27]'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-[#8B5E34]" />
                <span>Day (Light)</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeToggle('dark')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  currentTheme.mode === 'dark'
                    ? 'bg-[#CCD5AE] text-[#342F27] border border-[#B8C299] shadow-xs'
                    : 'text-[#6B6255] hover:text-[#342F27]'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-[#8B5E34]" />
                <span>Night (Dark)</span>
              </button>
            </div>
          </div>

          {/* Palettes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {RESEARCH_PALETTES.map((palette) => {
              const isSelected = currentTheme.palette === palette.id;
              return (
                <div
                  key={palette.id}
                  onClick={() => handlePaletteSelect(palette.id)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#CCD5AE]/40 border-[#D4A373] ring-2 ring-[#D4A373] shadow-xs'
                      : 'bg-[#FEFAE0] border-[#DCD5BC] hover:border-[#D4A373]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#342F27]">{palette.name}</span>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-[#287A50] bg-[#E9EDC9] px-2 py-0.2 rounded border border-[#B8C299] inline-flex items-center gap-0.5">
                            <Check className="w-3 h-3" />
                            Active
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-[#6B6255] uppercase font-mono">{palette.field.split('&')[0]}</span>
                    </div>

                    <p className="text-[11px] text-[#6B6255] leading-relaxed mb-3">
                      {palette.description}
                    </p>
                  </div>

                  {/* Swatches preview */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-[#DCD5BC]/60">
                    <span className="text-[10px] text-[#6B6255] font-mono mr-1">Palette:</span>
                    <div className="flex items-center gap-1">
                      <div
                        className="w-5 h-5 rounded-md border border-[#DCD5BC] shadow-2xs"
                        style={{ backgroundColor: palette.previewColors.bg }}
                        title="Canvas Background"
                      />
                      <div
                        className="w-5 h-5 rounded-md border border-[#DCD5BC] shadow-2xs"
                        style={{ backgroundColor: palette.previewColors.surface }}
                        title="Card Surface"
                      />
                      <div
                        className="w-5 h-5 rounded-md border border-[#DCD5BC] shadow-2xs"
                        style={{ backgroundColor: palette.previewColors.accent }}
                        title="Soft Accent"
                      />
                      <div
                        className="w-5 h-5 rounded-md border border-[#DCD5BC] shadow-2xs"
                        style={{ backgroundColor: palette.previewColors.primary }}
                        title="Primary Call to Action"
                      />
                      <div
                        className="w-5 h-5 rounded-md border border-[#DCD5BC] shadow-2xs"
                        style={{ backgroundColor: palette.previewColors.text }}
                        title="Primary Typography"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Profile Settings */}
        <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs space-y-4">
          <h3 className="font-bold text-[#342F27] text-sm border-b border-[#DCD5BC] pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-[#8B5E34]" />
            <span>Academic Profile Details</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#6B6255] mb-1">Full Name & Academic Title</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A373] text-[#342F27] font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#6B6255] mb-1">Academic Hierarchy Rank & Role</label>
              <select
                value={hierarchyRole}
                onChange={(e) => setHierarchyRole(e.target.value)}
                className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A373] text-[#342F27] font-medium cursor-pointer"
              >
                <option value="Research Scientist">1. Research Scientist (PI / Senior Fellow)</option>
                <option value="Researcher">2. Researcher (Staff Scientist / Postdoc)</option>
                <option value="PhD Scholar">3. PhD Scholar (Doctoral Candidate)</option>
                <option value="Student">4. Student (Graduate / Undergraduate Fellow)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#6B6255] mb-1">Primary Institution or Organization</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A373] text-[#342F27] font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#6B6255] mb-1">ORCID iD (Verified Identity)</label>
              <input
                type="text"
                value={orcid}
                onChange={(e) => setOrcid(e.target.value)}
                className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A373] font-mono text-[#287A50] font-bold"
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs space-y-4">
          <h3 className="font-bold text-[#342F27] text-sm border-b border-[#DCD5BC] pb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#8B5E34]" />
            <span>Notification Preferences</span>
          </h3>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotifs}
                onChange={(e) => setEmailNotifs(e.target.checked)}
                className="w-4 h-4 accent-[#D4A373] rounded"
              />
              <span className="font-medium text-[#342F27]">Receive email alerts when peer reviewers comment on your proposals</span>
            </label>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="text-[#287A50] font-bold flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>Settings Saved & Applied!</span>
            </span>
          ) : <div />}

          <button
            type="submit"
            className="px-6 py-2.5 text-xs font-bold text-[#342F27] bg-[#D4A373] hover:bg-[#8B5E34] hover:text-white border border-[#C59465] rounded-xl shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>

      </form>

    </div>
  );
};
