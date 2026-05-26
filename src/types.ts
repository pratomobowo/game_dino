export type WeaponType = 'pistol' | 'shotgun' | 'rifle' | 'rpg' | 'plasma' | 'flame';

export interface Weapon {
  type: WeaponType;
  name: string;
  damage: number;
  fireRate: number; // ms to Wait between shots
  ammo: number;
  maxAmmo: number;
  unlocked: boolean;
  cost: number;
  ammoCost: number;
  description: string;
  bulletSpeed: number;
  spread: number;
  shotCount: number;
  splashRadius?: number;
  color: string;
}

export type DinoType = 'raptor' | 'triceratops' | 'trex' | 'pterodactyl';

export interface Dino {
  id: string; // unique identifier
  type: DinoType;
  name: string;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  size: number;
  color: string;
  goldReward: number;
  xpReward: number;
  x: number;
  z: number;
  y: number;
  vx: number;
  vz: number;
  vy: number;
  state: 'walk' | 'charge' | 'bite' | 'recoil';
  stateTime: number;
  biteCooldown: number;
  angle: number;
  scaleY: number; // for bounce walking animation
  isBurning?: boolean;
  burnDuration?: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  damage: number;
  splashRadius?: number;
  type: 'bullet' | 'rpg' | 'plasma' | 'flame';
  life: number; // decrements over time
  color: string;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  type: 'blood' | 'spark' | 'smoke' | 'flame' | 'leaf' | 'heal' | 'ammo';
}

export interface SentryTurret {
  id: string;
  x: number;
  z: number;
  y: number;
  angle: number;
  range: number;
  damage: number;
  fireRate: number; // ms target
  cooldown: number;
  level: number;
  maxLevel: number;
}

export interface Barricade {
  id: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  health: number;
  maxHealth: number;
  destroyed: boolean;
}

export interface SupplyCrate {
  id: string;
  x: number;
  z: number;
  y: number;
  type: 'health' | 'ammo' | 'gold' | 'weapon';
  weaponType?: WeaponType;
  collected: boolean;
}

export interface UpgradePerk {
  id: string;
  name: string;
  description: string;
  icon: string;
  effect: (player: any) => void;
}

export interface GameStats {
  score: number;
  dinosKilled: number;
  wavesCleared: number;
  damageDealt: number;
  goldSpent: number;
  timeSurvived: number; // in seconds
}
