import { useAdminAuth } from '../../contexts/AdminAuthContext';
import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Dices, Sparkles } from 'lucide-react';

const DEFAULT_10_TEAMS = `T1, Alexandria Merchants
T2, Theban Architects
T3, Memphis Caravans
T4, Sinai Miners
T5, Nubian Gold Guild
T6, Fayum Harvesters
T7, Red Sea Navigators
T8, Necropolis Guardians
T9, Elephantine Sentinels
T10, Cataract Traders`;

export const REGION_PROFILES: Record<string, { food: number; material: number; gold: number }> = {
  'Eastern Granite Quarries': { food: 200, material: 800, gold: 500 },
  'Sinai Copper Mines': { food: 200, material: 800, gold: 500 },
  'Delta Basin': { food: 800, material: 200, gold: 500 },
  'Theban Floodplains': { food: 800, material: 200, gold: 500 },
  'Fayum Oasis': { food: 500, material: 500, gold: 500 },
  'Memphis Crossroads': { food: 500, material: 500, gold: 500 },
  'Red Sea Harbors': { food: 200, material: 500, gold: 800 },
  'Royal Necropolis': { food: 200, material: 500, gold: 800 },
  'Elephantine Outpost': { food: 800, material: 500, gold: 200 },
  'Nubian Cataracts': { food: 800, material: 500, gold: 200 },
};

const REGIONS = Object.keys(REGION_PROFILES);

interface TeamData {
  teamId: string;
  teamName: string;
  region: string;
  password: string;
  isLocked?: boolean;
}

export default function Onboarding() {
  const { token } = useAdminAuth();

  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');
  const [csvText, setCsvText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [teams, setTeams] = useState<TeamData[]>([]);
  const [onboarded, setOnboarded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing teams on mount to check if onboarding was already done
  useEffect(() => {
    fetch('/api/teams', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then((data: any[]) => {
        if (data && data.length > 0) {
          setTeams(data.map(t => ({
            teamId: t.teamId,
            teamName: t.teamName,
            region: t.region || '',
            password: t.password || '',
            isLocked: true
          })));
          setOnboarded(true);
        }
      })
      .catch(console.error);
  }, []);

  const generatePassword = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const parseRawCsv = (text: string) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    const parsed: TeamData[] = [];
    
    for (const line of lines) {
      // Split on comma or tab or semicolon
      const parts = line.split(/[,;\t]/).map(p => p.trim());
      if (parts.length >= 1 && parts[0]) {
        parsed.push({
          teamId: parts[0],
          teamName: parts[1] || parts[0],
          region: '',
          password: generatePassword(),
          isLocked: false
        });
      }
    }
    return parsed;
  };

  const handleParseText = () => {
    if (!csvText.trim()) {
      alert('Please enter or paste CSV text first.');
      return;
    }
    const parsed = parseRawCsv(csvText);
    if (parsed.length === 0) {
      alert('No valid team rows found in CSV text.');
      return;
    }
    setTeams(parsed);
    setOnboarded(false);
  };

  const handleFileRead = (file: File) => {
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setCsvText(content);
        const parsed = parseRawCsv(content);
        if (parsed.length > 0) {
          setTeams(parsed);
          setOnboarded(false);
        } else {
          alert('Could not parse any teams from the uploaded file.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileRead(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileRead(e.target.files[0]);
    }
  };

  const updateRegion = (index: number, region: string) => {
    if (teams[index].isLocked) return;
    const newTeams = [...teams];
    newTeams[index].region = region;
    setTeams(newTeams);
  };

  const autoAssignDistinctRegions = () => {
    if (onboarded) return;
    const shuffled = [...REGIONS].sort(() => Math.random() - 0.5);
    const newTeams = teams.map((t, idx) => ({
      ...t,
      region: shuffled[idx % shuffled.length] || ''
    }));
    setTeams(newTeams);
  };

  // Distinct region validation checks
  const allAssigned = teams.length > 0 && teams.every(t => t.region.trim() !== '');
  const assignedRegionsList = teams.map(t => t.region).filter(r => r.trim() !== '');
  const hasDuplicates = new Set(assignedRegionsList).size !== assignedRegionsList.length;
  const isDistinctValid = allAssigned && !hasDuplicates;

  // Track duplicated regions to highlight in UI
  const regionCounts = assignedRegionsList.reduce((acc, r) => {
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleConfirm = async () => {
    if (!isDistinctValid) {
      alert('Cannot onboard: Each team must have a unique, distinct region assigned.');
      return;
    }

    setIsSubmitting(true);
    const finalTeams = teams.map(t => ({
      ...t,
      isLocked: true
    }));

    try {
      const res = await fetch('/api/teams/bulk', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ teams: finalTeams })
      });
      
      if (!res.ok) {
        throw new Error('Server returned an error');
      }

      setTeams(finalTeams);
      setOnboarded(true);
      alert('All teams successfully onboarded with distinct starting regions and live credentials! They are now active on the Leaderboard.');
    } catch (e: any) {
      alert(`Failed to onboard teams: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif text-gold-500 font-bold">Team Realm Onboarding</h1>
          <p className="text-sm text-stone-400 mt-1">
            Import teams, automatically generate passwords, and assign distinct regional starting strongholds.
          </p>
        </div>
        {onboarded && (
          <div className="flex items-center space-x-3">
            <span className="bg-gold-600/20 text-gold-400 border border-gold-500 px-3.5 py-1.5 rounded-md text-sm font-bold flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 size={16} /> Realm Seeded & Regions Locked
            </span>
            <button
              onClick={() => {
                if (confirm('Re-opening onboarding will allow editing teams and re-parsing. Continue?')) {
                  setOnboarded(false);
                  setTeams(teams.map(t => ({ ...t, isLocked: false })));
                }
              }}
              className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-600 px-3 py-1.5 rounded font-bold transition"
            >
              Re-open Onboarding
            </button>
          </div>
        )}
      </div>

      {!onboarded && (
        <div className="bg-stone-850 rounded-lg border border-stone-700 shadow-xl overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-stone-700 bg-stone-900">
            <button
              onClick={() => setActiveTab('paste')}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'paste'
                  ? 'border-gold-500 text-gold-400 bg-stone-850'
                  : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              <FileText size={18} />
              Manual Type / Paste CSV
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'upload'
                  ? 'border-gold-500 text-gold-400 bg-stone-850'
                  : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              <Upload size={18} />
              Upload / Drag & Drop File
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'paste' ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-stone-300">
                    Enter or Paste CSV Rows <span className="text-stone-500 font-mono font-normal">(Format: TeamID, TeamName)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCsvText(DEFAULT_10_TEAMS)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-stone-800 hover:bg-stone-700 text-gold-400 hover:text-gold-300 border border-stone-600 rounded text-xs font-bold transition shadow-sm"
                    title="Insert 10 sample placeholder teams into the text box"
                  >
                    <Sparkles size={13} />
                    Auto-Generate 10 Sample Teams
                  </button>
                </div>
                <textarea 
                  className="w-full h-32 p-3 bg-stone-900 border border-stone-700 rounded text-parchment font-mono text-sm focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 placeholder-stone-600"
                  placeholder="T1, Alexandria Merchants&#10;T2, Theban Architects&#10;T3, Memphis Caravans&#10;T4, Sinai Miners&#10;T5, Nubian Gold Guild"
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-stone-500 italic">
                    Supported separators: Comma (,), Tab (\t), or Semicolon (;)
                  </span>
                  <div className="flex items-center gap-2">
                    {csvText && (
                      <button 
                        onClick={() => setCsvText('')}
                        className="px-3 py-1.5 text-xs text-stone-400 hover:text-stone-200 font-bold"
                      >
                        Clear
                      </button>
                    )}
                    <button 
                      onClick={handleParseText} 
                      className="px-6 py-2 bg-gold-600 hover:bg-gold-500 text-stone-900 rounded font-bold text-sm shadow transition"
                    >
                      Parse CSV Text
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".csv,.txt" 
                  className="hidden" 
                />
                
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                    isDragging 
                      ? 'border-gold-500 bg-gold-950/20' 
                      : 'border-stone-700 bg-stone-900/60 hover:border-gold-600 hover:bg-stone-900'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-gold-500">
                    <Upload size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-parchment text-base">
                      {uploadedFileName ? `File selected: ${uploadedFileName}` : 'Click to browse or drop your CSV file here'}
                    </p>
                    <p className="text-xs text-stone-400 mt-1">
                      Accepts .csv or .txt files formatted as (TeamID, TeamName)
                    </p>
                  </div>
                </div>

                {uploadedFileName && (
                  <div className="flex justify-end mt-4">
                    <button 
                      onClick={() => handleParseText()} 
                      className="px-6 py-2 bg-gold-600 hover:bg-gold-500 text-stone-900 rounded font-bold text-sm shadow transition"
                    >
                      Parse Uploaded File
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Parsed Teams Table */}
      {teams.length > 0 && (
        <div className="bg-stone-850 border border-stone-700 rounded-lg overflow-hidden shadow-2xl">
          <div className="p-4 bg-stone-900 border-b border-stone-700 flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-serif text-gold-500 font-bold">
                Parsed Teams Roster ({teams.length})
              </h2>
              {isDistinctValid ? (
                <span className="text-xs bg-green-950/60 border border-green-600 text-green-400 font-bold px-2.5 py-1 rounded flex items-center gap-1">
                  <CheckCircle2 size={13} /> Distinct Regions Validated
                </span>
              ) : (
                <span className="text-xs bg-crimson-950/60 border border-crimson-700 text-red-300 font-bold px-2.5 py-1 rounded flex items-center gap-1">
                  <AlertCircle size={13} />
                  {!allAssigned 
                    ? 'Assign regions to all teams' 
                    : 'Duplicate regions detected! Each team must have a unique region.'}
                </span>
              )}
            </div>

            {!onboarded && (
              <button 
                onClick={autoAssignDistinctRegions}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-600 text-gold-400 rounded text-xs font-bold transition"
                title="Randomly assign 1 distinct region to each team"
              >
                <Dices size={15} />
                Auto-Assign Distinct Regions
              </button>
            )}
          </div>

          <table className="w-full text-left">
            <thead className="bg-stone-900/80 border-b border-stone-700 text-gold-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 border-r border-stone-700">Team ID</th>
                <th className="p-4 border-r border-stone-700">Team Name</th>
                <th className="p-4 border-r border-stone-700">Assigned Region</th>
                <th className="p-4 border-r border-stone-700 text-center">Food</th>
                <th className="p-4 border-r border-stone-700 text-center">Material</th>
                <th className="p-4 border-r border-stone-700 text-center">Gold</th>
                <th className="p-4 border-r border-stone-700 text-center">Starting NAV</th>
                <th className="p-4 text-center">Generated Password</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {teams.map((t, idx) => {
                const profile = t.region ? REGION_PROFILES[t.region] : null;
                const nav = profile ? profile.gold + profile.food + profile.material : null;
                const isDuplicate = t.region && regionCounts[t.region] > 1;

                return (
                  <tr key={idx} className="hover:bg-stone-800/60 transition-colors">
                    <td className="p-4 font-bold text-parchment font-mono border-r border-stone-700/60">{t.teamId}</td>
                    <td className="p-4 text-parchment font-medium border-r border-stone-700/60">{t.teamName}</td>
                    <td className="p-4 border-r border-stone-700/60">
                      {t.isLocked ? (
                        <span className="font-serif font-bold text-gold-400">{t.region}</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <select 
                            className={`bg-stone-900 border rounded p-1.5 text-sm text-parchment focus:border-gold-500 focus:outline-none ${
                              isDuplicate ? 'border-crimson-700 bg-red-950/30' : 'border-stone-700'
                            }`}
                            value={t.region}
                            onChange={(e) => updateRegion(idx, e.target.value)}
                          >
                            <option value="">-- Select Unique Region --</option>
                            {REGIONS.map(r => {
                              const alreadyTaken = teams.some((other, oIdx) => oIdx !== idx && other.region === r);
                              return (
                                <option key={r} value={r}>
                                  {r} {alreadyTaken ? '(Assigned elsewhere)' : ''}
                                </option>
                              );
                            })}
                          </select>
                          {isDuplicate && (
                            <span className="text-xs text-red-400 font-bold" title="Duplicate region assigned">
                              Duplicate!
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-mono font-bold text-center border-r border-stone-700/60">
                      {profile ? <span className="text-green-400">{profile.food}</span> : <span className="text-stone-600">-</span>}
                    </td>
                    <td className="p-4 font-mono font-bold text-center border-r border-stone-700/60">
                      {profile ? <span className="text-stone-300">{profile.material}</span> : <span className="text-stone-600">-</span>}
                    </td>
                    <td className="p-4 font-mono font-bold text-center border-r border-stone-700/60">
                      {profile ? <span className="text-gold-400">{profile.gold}</span> : <span className="text-stone-600">-</span>}
                    </td>
                    <td className="p-4 font-mono font-bold text-center border-r border-stone-700/60">
                      {nav !== null ? (
                        <span className="text-gold-300 bg-gold-950/40 px-2 py-0.5 rounded border border-gold-600/30">
                          {nav.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-stone-600 italic text-xs">Pending Region</span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-gold-400 font-bold text-sm text-center">
                      <span>{t.password}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!onboarded && (
            <div className="p-4 bg-stone-900 border-t border-stone-700 flex flex-wrap justify-between items-center gap-4">
              <div className="text-xs text-stone-400">
                {!isDistinctValid ? (
                  <span className="text-red-400 font-bold">
                    ⚠️ Select a distinct region for all {teams.length} teams to enable onboarding.
                  </span>
                ) : (
                  <span className="text-green-400 font-bold">
                    ✓ All regional assignments are distinct and base stats are calculated.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel the onboarding process? All parsed teams will be cleared.')) {
                      setTeams([]);
                      setCsvText('');
                      setUploadedFileName(null);
                    }
                  }}
                  className="px-6 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-red-400 border border-stone-600 rounded font-bold text-sm transition"
                >
                  Cancel
                </button>

                <button 
                  disabled={!isDistinctValid || isSubmitting}
                  onClick={handleConfirm}
                  className="px-8 py-2.5 bg-gold-600 text-stone-900 font-bold rounded hover:bg-gold-500 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg flex items-center gap-2"
                >
                  {isSubmitting ? 'Onboarding Realm...' : 'Proceed & Confirm Onboarding'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
