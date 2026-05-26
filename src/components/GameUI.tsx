import React from 'react';
import { 
  Heart, 
  Zap, 
  Flame, 
  Coins, 
  RotateCcw, 
  Play, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Shield, 
  Crosshair, 
  ChevronRight,
  CircleAlert,
  Award,
  ChevronLeft,
  Settings
} from 'lucide-react';
import { Weapon, WeaponType, UpgradePerk, GameStats } from '../types';
import { audio } from '../audio';

interface GameUIProps {
  score: number;
  gold: number;
  health: number;
  maxHealth: number;
  xp: number;
  xpNeeded: number;
  level: number;
  currentWave: number;
  dinosKilled: number;
  dinosRemaining: number;
  waveActive: boolean;
  wavePrepTimer: number; // in seconds
  weapons: Record<WeaponType, Weapon>;
  activeWeaponType: WeaponType;
  setActiveWeaponType: (type: WeaponType) => void;
  buyWeapon: (type: WeaponType) => void;
  buyAmmo: (type: WeaponType) => void;
  availablePerks: UpgradePerk[];
  selectPerk: (perk: UpgradePerk) => void;
  buySentry: () => void;
  sentryCount: number;
  sentryCost: number;
  gameState: 'start' | 'playing' | 'levelup' | 'gameover';
  startNewGame: () => void;
  stats: GameStats;
  toggleMuted: () => void;
  isMuted: boolean;
}

export const GameUI: React.FC<GameUIProps> = ({
  score,
  gold,
  health,
  maxHealth,
  xp,
  xpNeeded,
  level,
  currentWave,
  dinosKilled,
  dinosRemaining,
  waveActive,
  wavePrepTimer,
  weapons,
  activeWeaponType,
  setActiveWeaponType,
  buyWeapon,
  buyAmmo,
  availablePerks,
  selectPerk,
  buySentry,
  sentryCount,
  sentryCost,
  gameState,
  startNewGame,
  stats,
  toggleMuted,
  isMuted,
}) => {
  const activeWeapon = weapons[activeWeaponType];

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 md:p-8 font-sans z-30">
      
      {/* 1. CINEMATIC START OVERLAY */}
      {gameState === 'start' && (
        <div className="absolute inset-0 z-50 pointer-events-auto bg-[#020501]/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl bg-[#020501] border border-emerald-500/30 rounded-3xl p-6 md:p-8 text-center shadow-[0_0_50px_rgba(16,185,129,0.15)] overflow-hidden">
            {/* Ambient glows */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-lime-500/10 rounded-full blur-3xl"></div>

            <span className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 text-xs px-3.5 py-1.5 rounded-full font-bold tracking-[0.2em] uppercase mb-4 shadow-[inset_0_0_10px_rgba(16,185,129,0.1)]">
              <Sparkles className="w-3.5 h-3.5 text-lime-400 animate-spin" />
              TACTICAL SYSTEM INITIALIZING
            </span>

            <h1 className="text-4xl md:text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-200 to-lime-400 tracking-tighter leading-none mb-3">
              BOWO SURVIVAL 3D
            </h1>

            <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto leading-relaxed">
              Infiltrasi wilayah purba liar Jurassic. Bertahanlah dari serbuan kawanan predator dengan automatic sentry, persenjataan plasma, dan peningkatan biogenetis mutakhir.
            </p>

            {/* Tactical Briefing Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left text-xs mb-8">
              <div className="bg-black/60 backdrop-blur border border-emerald-950/80 p-4 rounded-xl">
                <h3 className="font-extrabold text-emerald-400 mb-2.5 flex items-center gap-1.5 uppercase tracking-wide">
                  <Zap className="w-4 h-4" /> PILOT CONTROLS
                </h3>
                <ul className="space-y-1.5 text-zinc-400 font-mono text-[11px]">
                  <li className="flex justify-between border-b border-zinc-900 pb-1"><span>[WASD] / Left-Joystick</span> <b className="text-zinc-200">MOVE</b></li>
                  <li className="flex justify-between border-b border-zinc-900 pb-1"><span>[Mouse] / Right-Joystick</span> <b className="text-zinc-200">BIDI K</b></li>
                  <li className="flex justify-between border-b border-zinc-900 pb-1"><span>[Click L] / Fire Button</span> <b className="text-zinc-200">TEMBAK</b></li>
                  <li className="flex justify-between"><span>[1 - 6] Numerical Key</span> <b className="text-emerald-400">SLOT ARSENAL</b></li>
                </ul>
              </div>

              <div className="bg-black/60 backdrop-blur border border-emerald-950/80 p-4 rounded-xl">
                <h3 className="font-extrabold text-[#f97316] mb-2.5 flex items-center gap-1.5 uppercase tracking-wide">
                  <Crosshair className="w-4 h-4" /> INTEL TARGET
                </h3>
                <ul className="space-y-1.5 text-zinc-400 text-[11px] font-mono">
                  <li className="flex justify-between border-b border-zinc-900 pb-1"><span>🦕 Raptor</span> <b className="text-red-400">Gesit & Lompat</b></li>
                  <li className="flex justify-between border-b border-zinc-900 pb-1"><span>🛡️ Triceratops</span> <b className="text-orange-400">Armor Depan</b></li>
                  <li className="flex justify-between border-b border-zinc-900 pb-1"><span>🦖 T-Rex (APEX)</span> <b className="text-red-500 font-bold">Darah Tebal</b></li>
                  <li className="flex justify-between"><span>🚁 Pterodactyl</span> <b className="text-sky-400">Serang Udara</b></li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => {
                audio.playBuy();
                startNewGame();
              }}
              className="pointer-events-auto w-full py-4 px-8 bg-gradient-to-r from-emerald-600 via-emerald-500 to-lime-500 hover:from-emerald-500 hover:to-lime-400 text-[#020501] font-black text-lg rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-transform hover:-translate-y-1 active:translate-y-0 cursor-pointer flex items-center justify-center gap-3"
            >
              <Play className="w-5 h-5 fill-current" />
              INTEGRASIKAN VISOR & BERTAHAN HIDUP
            </button>
          </div>
        </div>
      )}

      {/* 2. GAME HUD BAR HEADER (SCORES, WAVE, HP, WEAPON) */}
      {gameState !== 'start' && (
        <>
          <div className="w-full flex flex-col md:flex-row gap-4 justify-between items-start pointer-events-none">
            
            {/* Top Left: HUD Status Vitals (Health and Energy) */}
            <div className="flex flex-col gap-3.5 w-full max-w-xs md:max-w-sm pointer-events-auto">
              <div className="bg-black/60 backdrop-blur-md border border-emerald-500/20 p-4 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.05)] w-full">
                
                {/* Health Bar (Vital Signs) */}
                <div className="w-full mb-3.5">
                  <div className="flex justify-between mb-1 text-[10px] uppercase tracking-[0.15em] text-emerald-400 font-bold">
                    <span>Vital Signs: {health < maxHealth * 0.3 ? 'CRITICAL ALERT' : 'STABLE'}</span>
                    <span>{Math.ceil((health / maxHealth) * 100)}%</span>
                  </div>
                  <div className={`h-3 w-full bg-black/60 border rounded-full overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.1)] ${health < maxHealth * 0.3 ? 'border-red-900/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-emerald-900/50'}`}>
                    <div 
                      className={`h-full transition-all duration-300 shadow-[0_0_10px_#10b981] ${
                        health < maxHealth * 0.3
                          ? 'bg-gradient-to-r from-red-600 to-rose-500 animate-pulse shadow-[0_0_15px_#ef4444]'
                          : 'bg-gradient-to-r from-emerald-600 to-lime-400'
                      }`}
                      style={{ width: `${Math.max(0, (health / maxHealth) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Energy Reserves (Level/XP Progress Bar) */}
                <div className="w-full">
                  <div className="flex justify-between mb-1 text-[10px] uppercase tracking-[0.15em] text-sky-450 font-bold text-sky-400">
                    <span>Energy Matrix (Level {level})</span>
                    <span>XP: {xp}/{xpNeeded}</span>
                  </div>
                  <div className="h-2 w-full bg-black/60 border border-sky-900/50 rounded-full overflow-hidden shadow-[0_0_10px_rgba(56,189,248,0.1)]">
                    <div 
                      className="h-full bg-gradient-to-r from-sky-600 to-teal-400 transition-all duration-300 shadow-[0_0_8px_#38bdf8]"
                      style={{ width: `${Math.min(100, (xp / xpNeeded) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Core Balance Stats (Gold, Score) */}
                <div className="flex justify-between items-center pt-3 mt-3 border-t border-emerald-950 text-xs font-mono font-bold">
                  <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/20 px-2.5 py-1 rounded border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                    <Coins className="w-3.5 h-3.5" />
                    <span>DANA: ${gold}</span>
                  </div>
                  <div className="text-zinc-400 bg-zinc-950/40 px-2.5 py-1 rounded border border-zinc-805/30 border-white/5">
                    SKOR: <span className="text-white font-black">{score}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Top Middle: Dino Wave Alerts */}
            <div className="self-center flex flex-col items-center max-w-xs w-full">
              {waveActive ? (
                <div className="bg-red-950/45 backdrop-blur border border-red-500/35 rounded-2xl p-3.5 shadow-[0_0_20px_rgba(239,68,68,0.15)] flex items-center gap-3 animate-pulse pointer-events-auto">
                  <CircleAlert className="w-5 h-5 text-red-500" />
                  <div className="text-center font-mono">
                    <div className="text-[10px] text-red-400 font-bold tracking-widest uppercase">WAVE {currentWave} BERLANGSUNG!</div>
                    <div className="text-sm text-white font-extrabold">{dinosRemaining} Dino Terdeteksi</div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#020501]/80 border border-emerald-500/10 rounded-2xl p-3 backdrop-blur shadow-[0_0_35px_rgba(16,185,129,0.05)] text-center pointer-events-auto max-w-sm w-full">
                  <div className="text-[10px] text-emerald-400 font-black tracking-[0.2em] flex items-center justify-center gap-1.5 animate-pulse">
                    <Sparkles className="w-3 h-3 text-lime-400" /> SYSTEM SAFE: RECHARGING
                  </div>
                  <div className="text-base font-mono text-white font-semibold mt-0.5">
                    Wave {currentWave + 1} Spawns: <span className="text-amber-400 font-bold font-mono">{wavePrepTimer}s</span>
                  </div>
                  <div className="w-28 h-1 bg-black/60 rounded-full mt-2 mx-auto overflow-hidden">
                    <div 
                      className="h-full bg-emerald-400 transition-all duration-1000 shadow-[0_0_5px_#10b981]"
                      style={{ width: `${(wavePrepTimer / 15) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Top Right: Location Sector & Systems */}
            <div className="flex flex-col items-end gap-2.5 pointer-events-auto min-w-[220px]">
              
              <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-xl text-right w-full">
                <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-bold">Location Sector</div>
                <div className="text-lg font-black tracking-tight text-white font-sans uppercase">JURASSIC VALLEY W-{currentWave}</div>
                <div className={`text-[10.5px] font-bold font-mono mt-1 ${waveActive ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                  THREAT LEVEL: {waveActive ? "APEX WILD" : "SECURED NOMINAL"}
                </div>
              </div>

              <div className="flex gap-2 w-full justify-end">
                {waveActive && (
                  <div className="bg-red-950/20 border border-red-500/30 px-3 py-1 rounded text-[9px] font-black text-red-400 animate-pulse uppercase tracking-wider font-mono">
                    MOTION DETECTED
                  </div>
                )}
                <button
                  onClick={toggleMuted}
                  className="bg-black/50 border border-emerald-500/20 hover:bg-emerald-950/40 p-1.5 rounded text-emerald-400 cursor-pointer hover:text-white transition-colors flex items-center justify-center"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Laser Sentry Shop Menu */}
              <button
                onClick={buySentry}
                disabled={gold < sentryCost}
                className={`py-2 px-3.5 rounded-xl text-left border font-mono transition-all duration-200 cursor-pointer flex flex-col gap-0.5 w-full ${
                  gold >= sentryCost
                    ? 'bg-black/60 border-indigo-500/40 hover:border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                    : 'bg-black/30 border-zinc-900 text-zinc-650 opacity-55'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-[10px] tracking-wider uppercase">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  SENTRY SYSTEM ({sentryCount}/5)
                </div>
                <div className="flex justify-between items-center text-[10px] pt-0.5 mt-0.5 border-t border-zinc-900">
                  <span className="text-zinc-500 font-sans">Beli / Deploy</span>
                  <span className={gold >= sentryCost ? 'text-amber-400 font-bold' : 'text-zinc-500 font-bold'}>
                    ${sentryCost}
                  </span>
                </div>
              </button>

            </div>
          </div>

          {/* 3. SIDE QUEST & HISTORICAL NOTIFICATION LOG */}
          <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col gap-3 pointer-events-none max-w-[200px]">
            <div className="bg-black/50 backdrop-blur-md border-l-4 border-emerald-500 p-3 shadow-md">
              <div className="text-[10px] font-extrabold text-emerald-500 tracking-wider font-sans uppercase">Tactical Quest</div>
              <div className="text-[11px] text-zinc-300 mt-0.5">
                {waveActive ? `Kalahkan ${dinosRemaining} Dino Liar` : `Siapkan Sentry & Arsenal`}
              </div>
            </div>
            <div className="bg-black/50 backdrop-blur-md border-l-4 border-zinc-500 p-3 shadow-sm">
              <div className="text-[10px] font-extrabold text-zinc-400 tracking-wider uppercase">Combat Log</div>
              <div className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                {dinosKilled > 0 ? `+${dinosKilled} Dino Eliminated` : 'Sistem Siap Tempur'}
              </div>
            </div>
          </div>

          {/* 4. CENTER INTERACTIVE TARGETING RETICLE */}
          {gameState === 'playing' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="relative">
                {/* Crosshair SVG */}
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="opacity-80 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                  <path d="M60 10V30" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M60 90V110" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M10 60H30" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M90 60H110" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="60" cy="60" r="3.5" fill="#ef4444" className="animate-ping" />
                  <circle cx="60" cy="60" r="1.5" fill="#ef4444" />
                  <path d="M40 40L45 45" stroke="#10b981" strokeWidth="1" />
                  <path d="M75 40L70 45" stroke="#10b981" strokeWidth="1" />
                  <path d="M40 80L45 75" stroke="#10b981" strokeWidth="1" />
                  <path d="M75 80L70 75" stroke="#10b981" strokeWidth="1" />
                </svg>
                {waveActive && (
                  <div className="absolute -right-28 -top-8 bg-black/60 border border-red-500/40 p-2 rounded text-[10px] backdrop-blur-sm min-w-[130px] shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                    <div className="text-red-500 font-bold uppercase text-[9px] tracking-wider font-sans animate-pulse">Threat Locked</div>
                    <div className="text-white font-mono text-[11px] mt-0.5">COUNT: {dinosRemaining} Target</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. LEVEL UP SELECTOR POPUP */}
          {gameState === 'levelup' && (
            <div className="absolute inset-0 bg-[#020501]/85 backdrop-blur-sm z-50 pointer-events-auto flex items-center justify-center p-4">
              <div className="bg-[#020501] border border-emerald-500/30 rounded-3xl p-6 md:p-8 max-w-lg w-full text-center shadow-[0_0_60px_rgba(16,185,129,0.25)] relative overflow-hidden">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-lime-500 text-black font-black text-xs tracking-[0.2em] px-5 py-2 rounded-full shadow-[0_0_20px_#10b981] flex items-center gap-1.5 animate-bounce">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" /> MUTASE GENETIS
                </div>

                <h2 className="text-2xl font-black text-white mt-1.5 mb-2.5 uppercase tracking-wide">PILIH PILAR STRATAGEM</h2>
                <p className="text-zinc-400 text-xs mb-6 max-w-md mx-auto">Seleksi peningkatan bioteknologis mutakhir untuk memodifikasi ketahanan Anda melawan bahaya liar ini:</p>

                <div className="grid grid-cols-1 gap-3.5">
                  {availablePerks.map((perk) => (
                    <button
                      key={perk.id}
                      onClick={() => selectPerk(perk)}
                      className="flex items-center gap-4.5 p-4 rounded-2xl bg-black/60 border border-emerald-900/30 hover:border-emerald-400 hover:bg-emerald-950/20 text-left transition-all duration-200 cursor-pointer shadow-md"
                    >
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-[inset_0_0_10px_rgba(16,185,129,0.1)]">
                        {perk.icon === 'health' && <Heart className="w-6 h-6" />}
                        {perk.icon === 'speed' && <Zap className="w-6 h-6 animate-pulse" />}
                        {perk.icon === 'damage' && <Flame className="w-6 h-6" />}
                        {perk.icon === 'shield' && <Shield className="w-6 h-6 text-indigo-400" />}
                        {perk.icon === 'gold' && <Coins className="w-6 h-6 text-amber-400" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{perk.name}</h4>
                        <p className="text-zinc-400 text-xs mt-0.5 leading-snug">{perk.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-emerald-500 ml-auto shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 6. BOTTOM HUD: WEAPON ARSENAL & RADAR */}
          <div className="w-full p-0 flex flex-col md:flex-row gap-5 items-end justify-between pointer-events-none mt-auto">
            
            {/* Radar Mini Map Map (Bottom Left) */}
            <div className="relative w-44 h-44 bg-black/60 border border-emerald-500/30 rounded-full backdrop-blur-lg overflow-hidden flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.15)] pointer-events-auto shrink-0 md:mb-0 mb-3 block self-start md:self-auto mx-auto md:mx-0">
              {/* Grid Lines */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
              <div className="absolute w-[1.5px] h-full bg-emerald-500/20"></div>
              <div className="absolute h-[1.5px] w-full bg-emerald-500/20"></div>
              {/* Radar Sweep */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-emerald-500/5 to-emerald-500/25 rounded-full origin-center animate-[spin_4s_linear_infinite]"></div>
              
              {/* Dinosaurs Blinking Radar Dots */}
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full absolute top-12 left-10 shadow-[0_0_10px_#ef4444] animate-pulse"></div>
              <div className="w-2 h-2 bg-red-500 rounded-full absolute top-24 right-12 shadow-[0_0_10px_#ef4444] animate-pulse"></div>
              {waveActive && <div className="w-1.5 h-1.5 bg-red-400 rounded-full absolute bottom-14 left-24 shadow-[0_0_10px_#ef4444] animate-ping"></div>}
              
              {/* Self Marker */}
              <div className="w-2 h-2 bg-white rounded-full border border-emerald-500 shadow-[0_0_8px_white]"></div>
              
              <div className="absolute bottom-2 text-[8px] uppercase font-bold text-emerald-500/75 tracking-wider font-mono animate-pulse">SCANNING...</div>
            </div>

            {/* Armament Selection, Details, and Secondary Grid (Bottom Center & Right) */}
            <div className="flex-1 w-full flex flex-col lg:flex-row gap-4 items-stretch pointer-events-auto">
              
              {/* Active Weapon Detail Card */}
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col items-end min-w-[280px] md:min-w-[320px] shadow-2xl relative overflow-hidden flex-1 select-none">
                {/* Decorative Accents */}
                <div className="absolute top-0 right-0 w-24 h-1 bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                <div className="text-[10px] text-emerald-400 font-bold tracking-[0.2em] mb-1 uppercase font-sans">Selected Armament</div>
                <div className="text-2xl md:text-3xl font-extrabold italic tracking-tight mb-2 text-white block truncate uppercase">{activeWeapon.name}</div>
                
                <div className="flex items-baseline gap-1.5 mt-1 font-mono">
                  <span className="text-4xl font-bold text-white">{activeWeapon.type === 'pistol' ? '∞' : activeWeapon.ammo}</span>
                  <span className="text-lg text-zinc-500">/ {activeWeapon.type === 'pistol' ? '∞' : activeWeapon.maxAmmo}</span>
                </div>
                
                <div className="mt-4 flex gap-1 w-full">
                  <div className={`h-1 flex-1 ${activeWeapon.type === 'pistol' || activeWeapon.ammo > 0 ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-emerald-500/20'}`}></div>
                  <div className={`h-1 flex-1 ${activeWeapon.type === 'pistol' || activeWeapon.ammo > activeWeapon.maxAmmo * 0.15 ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-emerald-500/20'}`}></div>
                  <div className={`h-1 flex-1 ${activeWeapon.type === 'pistol' || activeWeapon.ammo > activeWeapon.maxAmmo * 0.35 ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-emerald-500/20'}`}></div>
                  <div className={`h-1 flex-1 ${activeWeapon.type === 'pistol' || activeWeapon.ammo > activeWeapon.maxAmmo * 0.55 ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-emerald-500/20'}`}></div>
                  <div className={`h-1 flex-1 ${activeWeapon.type === 'pistol' || activeWeapon.ammo > activeWeapon.maxAmmo * 0.75 ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-emerald-500/20'}`}></div>
                  <div className={`h-1 flex-1 ${activeWeapon.type === 'pistol' || activeWeapon.ammo > activeWeapon.maxAmmo * 0.9 ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-emerald-500/20'}`}></div>
                </div>
                <div className="mt-1.5 text-[8.5px] text-zinc-500 uppercase font-bold flex w-full justify-between font-mono">
                  <span>Ammo Core Temp</span>
                  <span className="text-emerald-400 font-bold tracking-widest uppercase">Optimum</span>
                </div>
              </div>

              {/* Weapon Switcher Slots Quick Actions Shop */}
              <div className="bg-black/60 border border-emerald-950/70 rounded-2xl p-4 backdrop-blur shadow-xl flex flex-col gap-3 justify-between flex-[2] w-full">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest border-b border-zinc-900 pb-2 text-zinc-500">
                  <span>Arsenal Slots</span>
                  <span className="text-emerald-400">Total Capital: ${gold}</span>
                </div>

                {/* Weapons Slots */}
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
                  {(Object.keys(weapons) as WeaponType[]).map((type) => {
                    const wep = weapons[type];
                    const isActive = activeWeaponType === type;

                    return (
                      <div 
                        key={type}
                        className={`relative flex flex-col justify-between p-2 rounded-xl border transition-all duration-200 ${
                          isActive 
                            ? 'bg-emerald-900/25 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                            : wep.unlocked 
                              ? 'bg-black/50 border-zinc-900 hover:border-zinc-700' 
                              : 'bg-black/20 border-zinc-950 opacity-55'
                        }`}
                      >
                        {/* Selector Trigger */}
                        <button
                          onClick={() => {
                            if (wep.unlocked) {
                              setActiveWeaponType(type);
                              audio.playBuy();
                            }
                          }}
                          disabled={!wep.unlocked}
                          className={`text-left w-full h-full cursor-pointer pr-1 flex flex-col ${
                            wep.unlocked ? 'cursor-pointer' : 'cursor-not-allowed'
                          }`}
                        >
                          <span className="text-[9px] text-zinc-500 font-mono block">Slot {
                            type === 'pistol' ? '1' :
                            type === 'shotgun' ? '2' :
                            type === 'rifle' ? '3' :
                            type === 'rpg' ? '4' :
                            type === 'plasma' ? '5' : '6'
                          }</span>
                          <span className="font-extrabold text-[11px] text-white truncate my-0.5 uppercase tracking-tight">{wep.name}</span>
                          <span className="text-[10px] text-emerald-400 font-mono">
                            {type === 'pistol' ? '∞' : `${wep.ammo}/${wep.maxAmmo}`}
                          </span>
                        </button>

                        {/* Quick shop triggers */}
                        <div className="mt-1.5 pt-1.5 border-t border-zinc-900 w-full">
                          {!wep.unlocked ? (
                            <button
                              onClick={() => buyWeapon(type)}
                              disabled={gold < wep.cost}
                              className={`w-full py-1 text-[9.5px] font-black rounded text-center uppercase tracking-wider cursor-pointer font-sans transition-all ${
                                gold >= wep.cost
                                  ? 'bg-amber-500 hover:bg-amber-400 text-[#020501] shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                                  : 'bg-zinc-900 text-zinc-500 cursor-not-allowed'
                              }`}
                            >
                              Beli: ${wep.cost}
                            </button>
                          ) : type !== 'pistol' ? (
                            <button
                              onClick={() => buyAmmo(type)}
                              disabled={gold < wep.ammoCost || wep.ammo === wep.maxAmmo}
                              className={`w-full py-1 text-[9.5px] font-bold rounded text-center cursor-pointer transition-all ${
                                wep.ammo === wep.maxAmmo
                                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                  : gold >= wep.ammoCost
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                                    : 'bg-stone-900 text-zinc-500 cursor-not-allowed'
                              }`}
                            >
                              {wep.ammo === wep.maxAmmo ? 'Full' : `Ammo: $${wep.ammoCost}`}
                            </button>
                          ) : (
                            <span className="w-full text-center py-1 text-[9px] font-mono text-zinc-500 uppercase font-semibold">
                              Tak Terbatas
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </>
      )}

      {/* 7. GAME OVER HUD PANEL */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 z-50 pointer-events-auto bg-[#020501]/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#020501] border border-red-500/35 rounded-3xl p-6 md:p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(239,68,68,0.2)] relative overflow-hidden">
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-red-900/10 rounded-full blur-3xl"></div>
            
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-pulse">
              <RotateCcw className="w-8 h-8" />
            </div>

            <h2 className="text-3xl font-black italic text-white leading-none tracking-tight uppercase">MISSION TERMINATED</h2>
            <p className="text-red-400 font-mono text-xs tracking-widest uppercase mt-1.5 font-bold mb-6">Prajurit Bertahan Hidup Gugur</p>

            <div className="space-y-2.5 bg-black/50 border border-zinc-900 p-4 rounded-2xl text-left font-mono text-xs mb-6">
              <div className="flex justify-between border-b border-zinc-900 pb-1.5 text-zinc-400">
                <span>DINO DIELIMINASI:</span>
                <span className="font-bold text-white font-mono">{stats.dinosKilled} target</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1.5 text-zinc-400">
                <span>RONDE BERTAHAN:</span>
                <span className="font-bold text-amber-400 font-mono">Wave {stats.wavesCleared}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1.5 text-zinc-400">
                <span>TOTAL AKUMULASI SKOR:</span>
                <span className="font-bold text-emerald-400 font-mono">{score}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1.5 text-zinc-400">
                <span>REKAYASA GENETIK:</span>
                <span className="font-bold text-slate-300 font-mono">Level {level}</span>
              </div>
              <div className="flex justify-between text-zinc-400 font-mono">
                <span>WAKTU SURVIVAL:</span>
                <span className="font-bold text-indigo-400">{Math.floor(stats.timeSurvived)} detik</span>
              </div>
            </div>

            <button
              onClick={() => {
                audio.playBuy();
                startNewGame();
              }}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white font-bold text-sm rounded-xl tracking-wider uppercase shadow-[0_0_25px_rgba(239,68,68,0.35)] transition-transform hover:-translate-y-1 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              INTEGRASIKAN HUD KEMBALI
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
