import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GameUI } from './components/GameUI';
import { 
  Weapon, 
  WeaponType, 
  Dino, 
  DinoType, 
  Projectile, 
  Particle, 
  SentryTurret, 
  SupplyCrate, 
  UpgradePerk, 
  GameStats 
} from './types';
import { audio } from './audio';
import { 
  createPlayerMesh, 
  updateWeaponMesh, 
  createTrexMesh, 
  createRaptorMesh, 
  createTriceratopsMesh, 
  createPterodactylMesh, 
  createTreeMesh, 
  createTurretMesh, 
  createSupplyCrateMesh 
} from './utils/dinoModels';

export default function App() {
  // --- Canvas and Sizing Refs ---
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- React Game UI states (for real-time overlay HUD sync) ---
  const [gameState, setGameState] = useState<'start' | 'playing' | 'levelup' | 'gameover'>('start');
  const [score, setScore] = useState<number>(0);
  const [gold, setGold] = useState<number>(200); // Starting capital for weapons/turrets
  const [health, setHealth] = useState<number>(100);
  const [maxHealth, setMaxHealth] = useState<number>(100);
  const [xp, setXp] = useState<number>(0);
  const [xpNeeded, setXpNeeded] = useState<number>(100);
  const [level, setLevel] = useState<number>(1);
  const [currentWave, setCurrentWave] = useState<number>(0);
  const [dinosKilled, setDinosKilled] = useState<number>(0);
  const [dinosRemaining, setDinosRemaining] = useState<number>(0);
  const [waveActive, setWaveActive] = useState<boolean>(false);
  const [wavePrepTimer, setWavePrepTimer] = useState<number>(15);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [sentryCount, setSentryCount] = useState<number>(0);
  const [sentryCost, setSentryCost] = useState<number>(150);

  // --- Upgrades Perk selection pool ---
  const [availablePerks, setAvailablePerks] = useState<UpgradePerk[]>([]);

  // --- End of game statistics ---
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    dinosKilled: 0,
    wavesCleared: 0,
    damageDealt: 0,
    goldSpent: 0,
    timeSurvived: 0,
  });

  // --- Weapon Inventory ---
  const [weapons, setWeapons] = useState<Record<WeaponType, Weapon>>({
    pistol: {
      type: 'pistol',
      name: 'Pistol Purba',
      damage: 15,
      fireRate: 350,
      ammo: Infinity,
      maxAmmo: Infinity,
      unlocked: true,
      cost: 0,
      ammoCost: 0,
      description: 'Pistol tak berujung untuk bertahan hidup darurat.',
      bulletSpeed: 50,
      spread: 0.05,
      shotCount: 1,
      color: '#fbbf24',
    },
    shotgun: {
      type: 'shotgun',
      name: 'Penyebar Rawa',
      damage: 18, // 18 * 5 bullets = 90
      fireRate: 850,
      ammo: 20,
      maxAmmo: 40,
      unlocked: false,
      cost: 150,
      ammoCost: 15,
      description: 'Menembakkan 5 peluru pelumpuh raptor dengan area sebar lebar.',
      bulletSpeed: 42,
      spread: 0.28,
      shotCount: 5,
      color: '#ea580c',
    },
    rifle: {
      type: 'rifle',
      name: 'Rifle Serbu',
      damage: 25,
      fireRate: 150,
      ammo: 90,
      maxAmmo: 180,
      unlocked: false,
      cost: 300,
      ammoCost: 30,
      description: 'Senapan serbu serbaguna dengan laju tembak otomatis tinggi.',
      bulletSpeed: 55,
      spread: 0.08,
      shotCount: 1,
      color: '#ef4444',
    },
    rpg: {
      type: 'rpg',
      name: 'Mortal RPG',
      damage: 160,
      fireRate: 1400,
      ammo: 6,
      maxAmmo: 12,
      unlocked: false,
      cost: 500,
      ammoCost: 45,
      description: 'Rudal maut dengan daya ledak ledakan dahsyat radius besar.',
      bulletSpeed: 28,
      spread: 0.02,
      shotCount: 1,
      splashRadius: 5.5,
      color: '#facc15',
    },
    plasma: {
      type: 'plasma',
      name: 'Plasma Ionik',
      damage: 48,
      fireRate: 200,
      ammo: 60,
      maxAmmo: 120,
      unlocked: false,
      cost: 750,
      ammoCost: 40,
      description: 'Senapan plasma futuristik dengan proyektil menembus tulang.',
      bulletSpeed: 60,
      spread: 0.04,
      shotCount: 1,
      color: '#06b6d4',
    },
    flame: {
      type: 'flame',
      name: 'Penyembur Api',
      damage: 14, // Damage per tick
      fireRate: 65,
      ammo: 150,
      maxAmmo: 300,
      unlocked: false,
      cost: 600,
      ammoCost: 35,
      description: 'Semburan api membakar dinosaurus dan memicu kebakaran.',
      bulletSpeed: 22,
      spread: 0.35,
      shotCount: 1,
      color: '#f97316',
    },
  });

  const [activeWeaponType, setActiveWeaponType] = useState<WeaponType>('pistol');

  // --- Mutability Holders for actual game engine loop ---
  // Avoids stale closures and keeps loop processing at locked 60 FPS
  const gameRef = useRef({
    state: 'start',
    score: 0,
    gold: 200,
    health: 100,
    maxHealth: 100,
    xp: 0,
    xpNeeded: 100,
    level: 1,
    currentWave: 0,
    weapons: { ...weapons },
    activeWeaponType: 'pistol' as WeaponType,
    weaponCooldown: 0,
    isMuted: false,

    // Coordinates
    playerX: 0,
    playerZ: 0,
    playerAngle: 0,
    playerSpeed: 7.2,
    playerInvulnerable: 0, // Frame count
    damageMultiplier: 1.0,

    keys: {} as Record<string, boolean>,
    mousePos: new THREE.Vector3(),
    mouseClicked: false,

    // Entities in Three scene
    dinos: [] as Dino[],
    projectiles: [] as Projectile[],
    particles: [] as Particle[],
    sentries: [] as SentryTurret[],
    crates: [] as SupplyCrate[],
    wavePrepTimer: 15,
    waveActive: false,
    waveRequiredKills: 0,
    waveDinoSpawnsLeft: 0,
    waveSpawnCooldown: 0,

    // Accumulating statistics
    dinosKilled: 0,
    damageDealt: 0,
    goldSpent: 0,
    timeSurvived: 0,

    // Visual camera offsets
    screenShake: 0,
  });

  // Keep mutables synched from React commands
  useEffect(() => {
    gameRef.current.state = gameState;
  }, [gameState]);

  // Handle weapon switching
  const handleWeaponChange = (type: WeaponType) => {
    if (weapons[type].unlocked) {
      setActiveWeaponType(type);
      gameRef.current.activeWeaponType = type;
    }
  };

  // --- SENTRY TURRET PLACEMENT ---
  const buySentry = () => {
    const s = gameRef.current;
    if (s.gold < sentryCost || s.sentries.length >= 5) {
      return;
    }

    // Spend money
    s.gold -= sentryCost;
    s.goldSpent += sentryCost;
    setGold(s.gold);

    audio.playBuy();

    // Spawn a Sentry turret in a relative circle around the center outpost (x:0, z:0)
    const angle = (s.sentries.length * Math.PI * 2) / 5 + Math.random() * 0.5;
    const distance = 4.0; // Place around player central defense pad
    const sx = Math.cos(angle) * distance;
    const sz = Math.sin(angle) * distance;

    const newSentry: SentryTurret = {
      id: Math.random().toString(),
      x: sx,
      z: sz,
      y: 0,
      angle: angle,
      range: 16.0,
      damage: 18,
      fireRate: 400,
      cooldown: 0,
      level: 1,
      maxLevel: 3,
    };

    s.sentries.push(newSentry);
    setSentryCount(s.sentries.length);
    setSentryCost(Math.round(sentryCost * 1.4));

    // Spawn green sparks around sentry
    for (let i = 0; i < 15; i++) {
      s.particles.push({
        id: Math.random().toString(),
        x: sx,
        y: 0.1,
        z: sz,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 4 + 2,
        vz: (Math.random() - 0.5) * 4,
        color: '#818cf8',
        size: 0.15,
        life: 0.6,
        maxLife: 0.6,
        type: 'spark',
      });
    }

    // Trigger Three.js model inclusion event via an on-demand hook in the game loop
    (window as any).spawnTurretMesh?.(newSentry);
  };

  // --- WEAPONS AND AMMO STORE FUNCTIONS ---
  const buyWeapon = (type: WeaponType) => {
    const s = gameRef.current;
    const wep = s.weapons[type];
    if (s.gold >= wep.cost && !wep.unlocked) {
      s.gold -= wep.cost;
      s.goldSpent += wep.cost;
      wep.unlocked = true;
      wep.ammo = wep.maxAmmo; // Full load
      
      setGold(s.gold);
      setWeapons({ ...s.weapons });
      setActiveWeaponType(type);
      s.activeWeaponType = type;
      
      audio.playBuy();
      (window as any).triggerPlayerWeaponChange?.();
    }
  };

  const buyAmmo = (type: WeaponType) => {
    const s = gameRef.current;
    const wep = s.weapons[type];
    if (s.gold >= wep.ammoCost && wep.unlocked && wep.ammo < wep.maxAmmo) {
      s.gold -= wep.ammoCost;
      s.goldSpent += wep.ammoCost;
      wep.ammo = Math.min(wep.maxAmmo, wep.ammo + Math.round(wep.maxAmmo * 0.4));
      
      setGold(s.gold);
      setWeapons({ ...s.weapons });
      
      audio.playBuy();

      // Trigger sparkle particles
      for (let i = 0; i < 8; i++) {
        s.particles.push({
          id: Math.random().toString(),
          x: s.playerX + (Math.random() - 0.5) * 0.5,
          y: 0.6 + Math.random() * 0.5,
          z: s.playerZ + (Math.random() - 0.5) * 0.5,
          vx: (Math.random() - 0.5) * 1.5,
          vy: Math.random() * 2 + 1,
          vz: (Math.random() - 0.5) * 1.5,
          color: '#10b981',
          size: 0.12,
          life: 0.5,
          maxLife: 0.5,
          type: 'ammo',
        });
      }
    }
  };

  // --- DYNAMIC PERK STAT SELECTOR ON LEVEL UP ---
  const triggerLevelUpSelector = () => {
    const s = gameRef.current;
    s.state = 'levelup';
    setGameState('levelup');
    audio.playLevelUp();

    // Generate 3 randomized choices of perks
    const perkPool: UpgradePerk[] = [
      {
        id: 'hp',
        name: 'Maksimalkan Pertahanan',
        description: 'Meningkatkan Darah Maksimal kamu sebesar +40 HP dan memulihkannya sepenuhnya.',
        icon: 'health',
        effect: (plr) => {
          plr.maxHealth += 40;
          plr.health = plr.maxHealth;
        },
      },
      {
        id: 'speed',
        name: 'Piston Adrenalin',
        description: 'Meningkatkan kecepatan pergerakan karakter sebesar +25%. Sangat gesit menghindari Raptor.',
        icon: 'speed',
        effect: (plr) => {
          plr.playerSpeed *= 1.25;
        },
      },
      {
        id: 'damage',
        name: 'Amunisi Rongga',
        description: 'Meningkatkan seluruh kerusakan/damage tembakan senjata sebesar +35%.',
        icon: 'damage',
        effect: (plr) => {
          plr.damageMultiplier *= 1.35;
        },
      },
      {
        id: 'shield',
        name: 'Baju Tempur Regeneratif',
        description: 'Menyerap 15% semua kerusakan fisik yang didapatkan gempuran Dino.',
        icon: 'shield',
        effect: (plr) => {
          plr.playerInvulnerable += 20; // bonus frame
        },
      },
      {
        id: 'gold',
        name: 'Tambang Purba',
        description: 'Mendapatkan bonus hadiah koin tunai instan sebesar +$250 untuk belanja persenjataan.',
        icon: 'gold',
        effect: (plr) => {
          plr.gold += 250;
        },
      },
    ];

    // Shuffle and pick 3
    const shuffled = [...perkPool].sort(() => 0.5 - Math.random());
    setAvailablePerks(shuffled.slice(0, 3));
  };

  const selectPerk = (perk: UpgradePerk) => {
    const s = gameRef.current;
    
    // Apply selected buff
    perk.effect(s);

    // Sync React Health & Level Up transition
    setHealth(s.health);
    setMaxHealth(s.maxHealth);
    setGold(s.gold);
    setWeapons({ ...s.weapons });

    s.state = 'playing';
    setGameState('playing');
  };

  // --- SOUND AND HUD CONTROLS ---
  const toggleMuted = () => {
    const currentMute = audio.toggleMute();
    setIsMuted(currentMute);
    gameRef.current.isMuted = currentMute;
  };

  // --- START A FRESH SURVIVAL SESSION ---
  const startNewGame = () => {
    const s = gameRef.current;
    // Reset standard assets variables
    s.score = 0;
    s.gold = 200;
    s.health = 100;
    s.maxHealth = 100;
    s.xp = 0;
    s.xpNeeded = 100;
    s.level = 1;
    s.currentWave = 0;
    s.playerX = 0;
    s.playerZ = 0;
    s.playerSpeed = 7.2;
    s.playerInvulnerable = 0;
    s.damageMultiplier = 1.0;

    // Reset stats
    s.dinosKilled = 0;
    s.damageDealt = 0;
    s.goldSpent = 0;
    s.timeSurvived = 0;

    // Reset weapons list
    const freshWeapons = { ...weapons };
    Object.keys(freshWeapons).forEach((key) => {
      const wep = freshWeapons[key as WeaponType];
      wep.unlocked = key === 'pistol'; // only pistol starts unlocked
      wep.ammo = wep.maxAmmo;
    });
    s.weapons = freshWeapons;
    s.activeWeaponType = 'pistol';

    // Clear lists
    s.dinos = [];
    s.projectiles = [];
    s.particles = [];
    s.sentries = [];
    s.crates = [];

    // Wave systems
    s.wavePrepTimer = 10;
    s.waveActive = false;
    s.waveDinoSpawnsLeft = 0;
    s.waveRequiredKills = 0;

    // Sync React visual HUD
    setScore(0);
    setGold(200);
    setHealth(100);
    setMaxHealth(100);
    setXp(0);
    setXpNeeded(100);
    setLevel(1);
    setCurrentWave(0);
    setDinosKilled(0);
    setDinosRemaining(0);
    setWaveActive(false);
    setWavePrepTimer(10);
    setSentryCount(0);
    setSentryCost(150);
    setWeapons(freshWeapons);
    setActiveWeaponType('pistol');

    s.state = 'playing';
    setGameState('playing');

    // Trigger clear meshes in three.js scene through globally exposed event
    (window as any).resetThreeScene?.();
  };

  // --- THREE.JS GRAPHICS SCENE SETUP ---
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // --- 1. Scene and Fog ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060c13); // Atmospheric midnight sky deep blue-black
    scene.fog = new THREE.FogExp2(0x060c13, 0.012); // Foggy jungle elements

    // --- 2. Camera ---
    const camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 1000);
    // Over-the-shoulder isometric angle looking down representing ultimate layout gameplay
    camera.position.set(0, 18, 14);
    camera.lookAt(0, 0, 0);

    // --- 3. Renderer ---
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // --- 4. Lights ---
    // Ground and heaven environmental hemisphere lighting
    const hemiLight = new THREE.HemisphereLight(0x1d4ed8, 0x14532d, 0.35); // Blue night glow + green jungle reflection
    scene.add(hemiLight);

    // Directional moon shadow light
    const moonLight = new THREE.DirectionalLight(0x7dd3fc, 0.75);
    moonLight.position.set(20, 45, 10);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 1024;
    moonLight.shadow.mapSize.height = 1024;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 150;
    
    // Orthographic shadow camera boundary
    const d = 35;
    moonLight.shadow.camera.left = -d;
    moonLight.shadow.camera.right = d;
    moonLight.shadow.camera.top = d;
    moonLight.shadow.camera.bottom = -d;
    scene.add(moonLight);

    // Dynamic Flashlight mounted to player soldier pointing in aiming direction
    const flashlight = new THREE.SpotLight(0xfffbeb, 8.0, 32, Math.PI / 6, 0.6, 1.2);
    flashlight.castShadow = true;
    flashlight.shadow.mapSize.width = 512;
    flashlight.shadow.mapSize.height = 512;
    scene.add(flashlight);

    // Small dummy target to point flashlight towards mouse click direction
    const flashlightTarget = new THREE.Object3D();
    scene.add(flashlightTarget);
    flashlight.target = flashlightTarget;

    // --- 5. Environment meshes (Floor, Trees, Ruined Pillars) ---
    // Grassy sand floor arena
    const floorGeo = new THREE.PlaneGeometry(160, 160);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x12361d, // Beautiful dark jungle floor grass
      roughness: 0.95,
      metalness: 0.02,
      flatShading: true,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Central outpost metallic circular safety mesh
    const baseCircleGeo = new THREE.CylinderGeometry(4.8, 5.0, 0.08, 16);
    const baseCircleMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
      metalness: 0.5,
      flatShading: true,
    });
    const basePad = new THREE.Mesh(baseCircleGeo, baseCircleMat);
    basePad.position.y = 0.01;
    basePad.receiveShadow = true;
    scene.add(basePad);

    // Outline grid accent
    const grid = new THREE.GridHelper(100, 40, 0x1e293b, 0x0f172a);
    grid.position.y = 0.02;
    scene.add(grid);

    // Prop groups container (Forest)
    const forestGroup = new THREE.Group();
    scene.add(forestGroup);

    // Generate trees randomly outside center compound
    const treeMeshCache: THREE.Group[] = [];
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 8.0 + Math.random() * 60; // Outside central compound
      const tx = Math.cos(angle) * distance;
      const tz = Math.sin(angle) * distance;

      const tree = createTreeMesh(i);
      tree.position.set(tx, 0, tz);
      const s = 0.7 + Math.random() * 0.7;
      tree.scale.set(s, s, s);
      tree.rotation.y = Math.random() * Math.PI;
      forestGroup.add(tree);
      treeMeshCache.push(tree);
    }

    // Ancient stone pillars (Ruins)
    const ruinsGroup = new THREE.Group();
    scene.add(ruinsGroup);
    for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 15.0 + Math.random() * 30;
        const px = Math.cos(angle) * distance;
        const pz = Math.sin(angle) * distance;

        const pillarGeo = new THREE.CylinderGeometry(0.5, 0.6, 3.5 + Math.random() * 3, 6);
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9, flatShading: true });
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(px, 1.8, pz);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        ruinsGroup.add(pillar);
    }

    // --- 6. Playable Entities (Meshes Cache) ---
    // Instanced dictionaries mapping entity index to 3D geometry rendered inside Three.js
    const dinoMeshes: Record<string, THREE.Group> = {};
    const sentryMeshes: Record<string, THREE.Group> = {};
    const crateMeshes: Record<string, THREE.Group> = {};
    const projectileMeshes: Record<string, THREE.Mesh> = {};
    const particlesContainer = new THREE.Group();
    scene.add(particlesContainer);

    // Generate Player Mesh
    const playerGroup = createPlayerMesh();
    scene.add(playerGroup);

    const playerWeaponHolder = playerGroup.getObjectByName("weapon_holder") as THREE.Group;
    const playerLegL = playerGroup.getObjectByName("legL") as THREE.Mesh;
    const playerLegR = playerGroup.getObjectByName("legR") as THREE.Mesh;
    const playerArmHolder = playerGroup.getObjectByName("armGroup") as THREE.Group;

    // Load starting weapon
    if (playerWeaponHolder) {
      updateWeaponMesh(playerWeaponHolder, 'pistol');
    }

    // Handle global hooks accessed by React UI click triggers
    (window as any).triggerPlayerWeaponChange = () => {
      if (playerWeaponHolder) {
        updateWeaponMesh(playerWeaponHolder, gameRef.current.activeWeaponType);
      }
    };

    (window as any).spawnTurretMesh = (sentry: SentryTurret) => {
      const turretG = createTurretMesh();
      turretG.position.set(sentry.x, 0, sentry.z);
      scene.add(turretG);
      sentryMeshes[sentry.id] = turretG;
    };

    (window as any).resetThreeScene = () => {
      // Clear dinosaur meshes
      Object.keys(dinoMeshes).forEach((id) => {
        scene.remove(dinoMeshes[id]);
        delete dinoMeshes[id];
      });

      // Clear sentry meshes
      Object.keys(sentryMeshes).forEach((id) => {
        scene.remove(sentryMeshes[id]);
        delete sentryMeshes[id];
      });

      // Clear supply chest meshes
      Object.keys(crateMeshes).forEach((id) => {
        scene.remove(crateMeshes[id]);
        delete crateMeshes[id];
      });

      // Clear projectils
      Object.keys(projectileMeshes).forEach((id) => {
        scene.remove(projectileMeshes[id]);
        delete projectileMeshes[id];
      });

      // Empty visual particle meshes from pool
      while (particlesContainer.children.length > 0) {
        particlesContainer.remove(particlesContainer.children[0]);
      }

      // Reset coordinates
      playerGroup.position.set(0, 0, 0);
      playerGroup.rotation.y = 0;

      if (playerWeaponHolder) {
        updateWeaponMesh(playerWeaponHolder, 'pistol');
      }
    };

    // --- 7. CONTROLS LISTENER (Mouse and keys) ---
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      gameRef.current.keys[k] = true;

      // Handle direct quick slot switches
      if (['1', '2', '3', '4', '5', '6'].includes(k)) {
        const indexToType: Record<string, WeaponType> = {
          '1': 'pistol',
          '2': 'shotgun',
          '3': 'rifle',
          '4': 'rpg',
          '5': 'plasma',
          '6': 'flame',
        };
        const selected = indexToType[k];
        if (selected && gameRef.current.weapons[selected].unlocked) {
          gameRef.current.activeWeaponType = selected;
          setActiveWeaponType(selected);
          audio.playBuy();
          (window as any).triggerPlayerWeaponChange?.();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameRef.current.keys[e.key.toLowerCase()] = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (gameRef.current.state === 'playing') {
        gameRef.current.mouseClicked = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      gameRef.current.mouseClicked = false;
    };

    // Raycast ground mouse intersection
    const planeY0 = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const raycaster = new THREE.Raycaster();
    const mouseNormal = new THREE.Vector2();

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate normal mouse relative values
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouseNormal.set(x, y);

      raycaster.setFromCamera(mouseNormal, camera);
      const intersectionPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(planeY0, intersectionPoint);
      gameRef.current.mousePos.copy(intersectionPoint);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    // --- 8. DINOS MOBILITY COMPILER ---
    // Choose appropriate 3D model creation depending on dinosaur species
    const buildDinoMesh = (type: DinoType, colorHex: number): THREE.Group => {
      if (type === 'trex') return createTrexMesh(colorHex);
      if (type === 'triceratops') return createTriceratopsMesh(colorHex);
      if (type === 'pterodactyl') return createPterodactylMesh(colorHex);
      return createRaptorMesh(colorHex); // Default standard Raptor
    };

    // --- 9. PRIMARY GAME LOOP TICK ENGINE ---
    let lastTime = performance.now();
    let frameId = 0;

    const gameTick = (timeNow: number) => {
      frameId = requestAnimationFrame(gameTick);

      const s = gameRef.current;
      const rawDt = (timeNow - lastTime) / 1000;
      lastTime = timeNow;

      // Bound delta limits to save from browser lag spikes
      const dt = Math.min(0.08, rawDt);

      if (s.state !== 'playing') {
        // Just render base scene without heavy physics simulation during modals
        renderer.render(scene, camera);
        return;
      }

      // --- Accumulate survival tickers ---
      s.timeSurvived += dt;

      // --- SCREEN SHAKE OFFSET DECAY ---
      if (s.screenShake > 0) {
        s.screenShake -= dt * 1.5;
        if (s.screenShake < 0) s.screenShake = 0;
      }

      // --- PLAYER INVULNERABLE TICK ---
      if (s.playerInvulnerable > 0) {
        s.playerInvulnerable--;
      }

      // --- KEYBOARD PLAYER CONTROLS (WASD) ---
      let dx = 0;
      let dz = 0;

      if (s.keys['w'] || s.keys['arrowup']) dz -= 1;
      if (s.keys['s'] || s.keys['arrowdown']) dz += 1;
      if (s.keys['a'] || s.keys['arrowleft']) dx -= 1;
      if (s.keys['d'] || s.keys['arrowright']) dx += 1;

      // Normalize movement direction
      if (dx !== 0 || dz !== 0) {
        const len = Math.sqrt(dx * dx + dz * dz);
        const mx = (dx / len) * s.playerSpeed * dt;
        const mz = (dz / len) * s.playerSpeed * dt;

        s.playerX = Math.max(-65, Math.min(65, s.playerX + mx));
        s.playerZ = Math.max(-65, Math.min(65, s.playerZ + mz));

        // Walking leg rotations animation
        const walkFreq = s.playerSpeed * 1.4;
        const angleLegs = Math.sin(timeNow * 0.015 * walkFreq) * 0.6;
        if (playerLegL) playerLegL.rotation.x = angleLegs;
        if (playerLegR) playerLegR.rotation.x = -angleLegs;
      } else {
        // Stand still feet alignment
        if (playerLegL) playerLegL.rotation.x = 0;
        if (playerLegR) playerLegR.rotation.x = 0;
      }

      // Move player mesh
      playerGroup.position.set(s.playerX, 0, s.playerZ);

      // --- ROTATE CHARACTER TOWARD MOUSE AIM ---
      const aimDX = s.mousePos.x - s.playerX;
      const aimDZ = s.mousePos.z - s.playerZ;
      const targetAngle = Math.atan2(aimDX, aimDZ);
      s.playerAngle = targetAngle;
      playerGroup.rotation.y = targetAngle;

      // Animate hand recoil slightly
      if (playerArmHolder) {
        if (s.weaponCooldown > 0) {
          playerArmHolder.position.z = 0.1 - (s.weaponCooldown / s.weapons[s.activeWeaponType].fireRate) * 0.15;
        } else {
          playerArmHolder.position.z = 0.1;
        }
      }

      // Sync Flashlight position and direction
      flashlight.position.set(s.playerX, 1.3, s.playerZ);
      flashlightTarget.position.set(
        s.playerX + Math.sin(targetAngle) * 5,
        0.8,
        s.playerZ + Math.cos(targetAngle) * 5
      );

      // Camera pivots slightly dynamic centering behind the player for immersion
      const targetCamX = s.playerX;
      const targetCamZ = s.playerZ + 14;
      const targetCamY = 18;

      // Apply screen shake on camera
      const sxAmt = s.screenShake * 0.6;
      const shakeX = (Math.random() - 0.5) * sxAmt;
      const shakeY = (Math.random() - 0.5) * sxAmt;
      const shakeZ = (Math.random() - 0.5) * sxAmt;

      camera.position.set(
        THREE.MathUtils.lerp(camera.position.x, targetCamX, 0.12) + shakeX,
        THREE.MathUtils.lerp(camera.position.y, targetCamY, 0.12) + shakeY,
        THREE.MathUtils.lerp(camera.position.z, targetCamZ, 0.12) + shakeZ
      );
      camera.lookAt(s.playerX, 0.5, s.playerZ);

      // --- WEAPON SHOOTING LOGIC COOLDOWNS ---
      if (s.weaponCooldown > 0) {
        s.weaponCooldown -= dt * 1000;
      }

      if (s.mouseClicked && s.weaponCooldown <= 0) {
        const wep = s.weapons[s.activeWeaponType];

        // Check weapon ammo inventory
        if (s.activeWeaponType === 'pistol' || wep.ammo > 0) {
          if (s.activeWeaponType !== 'pistol') {
            wep.ammo--;
            setWeapons({ ...s.weapons });
          }

          // Reset delay
          s.weaponCooldown = wep.fireRate;

          // Sound triggers
          if (s.activeWeaponType === 'pistol') audio.playPistol();
          if (s.activeWeaponType === 'shotgun') audio.playShotgun();
          if (s.activeWeaponType === 'rifle') audio.playRifle();
          if (s.activeWeaponType === 'rpg') {
            audio.playRpgLaunch();
            s.screenShake = 0.5;
          }
          if (s.activeWeaponType === 'plasma') audio.playPlasma();
          if (s.activeWeaponType === 'flame') audio.playFlame();

          // Spawn muzzle flash sparks right from player chest pointing out
          const spawnAngle = targetAngle;
          const barrelX = s.playerX + Math.sin(spawnAngle) * 1.0;
          const barrelZ = s.playerZ + Math.cos(spawnAngle) * 1.0;
          const barrelY = 0.85;

          // Shotgun has multiple bullet spreads, other rifles have 1
          const rounds = wep.shotCount;
          for (let r = 0; r < rounds; r++) {
            const spreadAngle = (Math.random() - 0.5) * wep.spread;
            const finalAngle = spawnAngle + spreadAngle;

            const bulletVX = Math.sin(finalAngle) * wep.bulletSpeed;
            const bulletVZ = Math.cos(finalAngle) * wep.bulletSpeed;
            const bulletVY = (s.activeWeaponType === 'rpg' || s.activeWeaponType === 'plasma') ? 0 : (Math.random() - 0.5) * 1.5;

            const newProj: Projectile = {
              id: Math.random().toString(),
              x: barrelX,
              y: barrelY,
              z: barrelZ,
              vx: bulletVX,
              vy: bulletVY,
              vz: bulletVZ,
              damage: Math.round(wep.damage * s.damageMultiplier),
              type: s.activeWeaponType === 'rpg' ? 'rpg' : s.activeWeaponType === 'plasma' ? 'plasma' : s.activeWeaponType === 'flame' ? 'flame' : 'bullet',
              life: s.activeWeaponType === 'flame' ? 0.35 : 1.8,
              splashRadius: wep.splashRadius,
              color: wep.color,
            };

            s.projectiles.push(newProj);

            // Spawn geometric glowing proyektil mesh immediately into scene
            const projGeo = s.activeWeaponType === 'rpg' 
              ? new THREE.CylinderGeometry(0.08, 0.08, 0.45, 6) 
              : new THREE.SphereGeometry(s.activeWeaponType === 'plasma' ? 0.18 : s.activeWeaponType === 'flame' ? 0.25 : 0.08, 6, 6);
            
            const projMat = new THREE.MeshBasicMaterial({
              color: new THREE.Color(wep.color),
            });
            const projMesh = new THREE.Mesh(projGeo, projMat);
            projMesh.position.set(newProj.x, newProj.y, newProj.z);
            if (s.activeWeaponType === 'rpg') {
              projMesh.rotation.x = Math.PI / 2;
            }
            scene.add(projMesh);
            projectileMeshes[newProj.id] = projMesh;
          }

          // Shaking feedback on high recoil
          if (s.activeWeaponType === 'shotgun') s.screenShake = 0.35;
          if (s.activeWeaponType === 'rifle') s.screenShake = 0.12;
        } else {
          // Out of ammo beep or warning
          s.mouseClicked = false;
        }
      }

      // --- SENTRY AUTOMATIC DEFENSES TICK ---
      s.sentries.forEach((sentry) => {
        if (sentry.cooldown > 0) {
          sentry.cooldown -= dt * 1000;
        }

        // Find closest dinosaur in circle
        let closestDino: Dino | null = null;
        let minDist = sentry.range;

        s.dinos.forEach((dino) => {
          const dx = dino.x - sentry.x;
          const dz = dino.z - sentry.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < minDist && dino.health > 0) {
            minDist = dist;
            closestDino = dino;
          }
        });

        // Track and shoot
        const turretMesh = sentryMeshes[sentry.id];
        if (turretMesh && closestDino) {
          const dino: Dino = closestDino;
          const swivel = turretMesh.getObjectByName("swivel_body");

          const angleToDino = Math.atan2(dino.x - sentry.x, dino.z - sentry.z);
          sentry.angle = angleToDino;

          if (swivel) {
            swivel.rotation.y = angleToDino;
          }

          // Check shot cooldown trigger
          if (sentry.cooldown <= 0) {
            sentry.cooldown = sentry.fireRate;

            // Deal physical damage instantly represents beam laser
            dino.health -= sentry.damage;
            s.damageDealt += sentry.damage;

            // Cyan particle beam flash trace
            const laserLineGeo = new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(sentry.x, 1.2, sentry.z),
              new THREE.Vector3(dino.x, dino.y + (dino.size * 0.4), dino.z),
            ]);
            const laserLineMat = new THREE.LineBasicMaterial({ color: 0x06b6d4, linewidth: 2 });
            const beamLine = new THREE.Line(laserLineGeo, laserLineMat);
            scene.add(beamLine);

            // remove beam line quickly after next ticks
            setTimeout(() => {
              scene.remove(beamLine);
              laserLineGeo.dispose();
              laserLineMat.dispose();
            }, 55);

            // Spark particles on dino hit
            for (let i = 0; i < 4; i++) {
              s.particles.push({
                id: Math.random().toString(),
                x: dino.x,
                y: dino.y + (dino.size * 0.3),
                z: dino.z,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 3 + 1,
                vz: (Math.random() - 0.5) * 4,
                color: '#06b6d4',
                size: 0.1,
                life: 0.35,
                maxLife: 0.35,
                type: 'spark',
              });
            }
          }
        }
      });

      // --- WAVE SPAWNS AND COOLDOWN CONTROLS ---
      if (!s.waveActive) {
        s.wavePrepTimer -= dt;
        if (s.wavePrepTimer <= 0) {
          // Launch Wave!
          s.waveActive = true;
          s.currentWave++;
          // Dino spawn counts grow by wave intensity
          s.waveDinoSpawnsLeft = 8 + s.currentWave * 4;
          s.waveRequiredKills = s.waveDinoSpawnsLeft;
          s.waveSpawnCooldown = 0;

          setCurrentWave(s.currentWave);
          setWaveActive(true);
          setDinosRemaining(s.waveRequiredKills);

          audio.playWaveStart();
        } else {
          // Throttle state update
          if (Math.ceil(s.wavePrepTimer) !== Math.ceil(s.wavePrepTimer + dt)) {
            setWavePrepTimer(Math.ceil(s.wavePrepTimer));
          }
        }
      } else {
        // Active wave dino spawning schedule
        if (s.waveDinoSpawnsLeft > 0) {
          s.waveSpawnCooldown -= dt;
          if (s.waveSpawnCooldown <= 0) {
            // Decide dino species to spawn depending on tier wave difficulty
            let type: DinoType = 'raptor';
            const roll = Math.random();

            if (s.currentWave >= 4 && roll < 0.12 && s.waveDinoSpawnsLeft % 6 === 0) {
              type = 'trex'; // Boss Dino!
            } else if (s.currentWave >= 2 && roll < 0.32) {
              type = 'triceratops'; // Heavy tank charging
            } else if (s.currentWave >= 3 && roll < 0.45) {
              type = 'pterodactyl'; // Air attacks
            }

            // Spawn at boundary perimeter circles outwards
            const angle = Math.random() * Math.PI * 2;
            const distance = 42.0 + Math.random() * 10;
            const sx = s.playerX + Math.cos(angle) * distance;
            const sz = s.playerZ + Math.sin(angle) * distance;

            let finalHP = 40 + s.currentWave * 12;
            let finalSpeed = 3.6 + Math.min(1.5, s.currentWave * 0.2);
            let finalDmg = 12 + s.currentWave * 2;
            let finalSize = 1.3;
            let colorHex = 0x166534; // Raptor green
            let reward = 15;
            let xpR = 20;

            if (type === 'triceratops') {
              finalHP = 160 + s.currentWave * 30;
              finalSpeed = 2.4 + s.currentWave * 0.1;
              finalDmg = 25 + s.currentWave * 3;
              finalSize = 2.2;
              colorHex = 0x1d4ed8; // Triceratops dark blue frill
              reward = 35;
              xpR = 40;
            } else if (type === 'trex') {
              finalHP = 800 + s.currentWave * 120;
              finalSpeed = 1.8;
              finalDmg = 45 + s.currentWave * 8;
              finalSize = 4.2;
              colorHex = 0xb91c1c; // T-Rex fiery brown-red
              reward = 150;
              xpR = 150;
              audio.playDinoRoar(true); // Huge sound alert!
            } else if (type === 'pterodactyl') {
              finalHP = 35 + s.currentWave * 8;
              finalSpeed = 4.4;
              finalDmg = 10 + s.currentWave * 1;
              finalSize = 1.5;
              colorHex = 0x7c3aed; // Purple bat
              reward = 20;
              xpR = 25;
            }

            const newDino: Dino = {
              id: Math.random().toString(),
              type,
              name: type.toUpperCase(),
              health: finalHP,
              maxHealth: finalHP,
              speed: finalSpeed,
              damage: finalDmg,
              size: finalSize,
              color: '#' + colorHex.toString(16),
              goldReward: reward,
              xpReward: xpR,
              x: sx,
              z: sz,
              y: type === 'pterodactyl' ? 4.5 : 0,
              vx: 0, vvz: 0, vy: 0,
              state: 'walk',
              stateTime: 0,
              biteCooldown: 0,
              angle: 0,
              scaleY: 1.0,
            } as any;

            s.dinos.push(newDino);
            s.waveDinoSpawnsLeft--;

            // Build visual 3D model structures in Three.js
            const dMesh = buildDinoMesh(type, colorHex);
            dMesh.position.set(newDino.x, newDino.y, newDino.z);
            dMesh.scale.set(finalSize, finalSize, finalSize);
            scene.add(dMesh);
            dinoMeshes[newDino.id] = dMesh;

            // Scaled spawners cooldown matching waves
            s.waveSpawnCooldown = Math.max(0.4, 2.8 - s.currentWave * 0.25);
          }
        }
      }

      // --- RANDOM PARACHUTE SUPPLY CRATES LAUNCH SYSTEM ---
      if (Math.random() < 0.0016 && s.crates.length < 3) {
        // Drop coordinates close to player clearing
        const radius = 12 + Math.random() * 10;
        const angle = Math.random() * Math.PI * 2;
        const cx = s.playerX + Math.cos(angle) * radius;
        const cz = s.playerZ + Math.sin(angle) * radius;

        // Choose random payload category
        const types: ('health' | 'ammo' | 'gold' | 'weapon')[] = ['health', 'ammo', 'gold', 'weapon'];
        const pType = types[Math.floor(Math.random() * types.length)];
        let wType: WeaponType | undefined = undefined;

        if (pType === 'weapon') {
          // Pick a random locked advanced weapon
          const lockedList = (Object.keys(s.weapons) as WeaponType[]).filter(k => k !== 'pistol' && !s.weapons[k].unlocked);
          if (lockedList.length > 0) {
            wType = lockedList[Math.floor(Math.random() * lockedList.length)];
          } else {
            // Give normal ammo crate instead of duplicate weapon
            wType = undefined;
          }
        }

        const newCrate: SupplyCrate = {
          id: Math.random().toString(),
          x: cx,
          z: cz,
          y: 20, // starts from sky falling down
          type: wType ? 'weapon' : pType === 'weapon' ? 'ammo' : pType,
          weaponType: wType,
          collected: false,
        };

        s.crates.push(newCrate);

        // Build 3D box plus parachute visual
        const crateG = createSupplyCrateMesh(newCrate.type);
        crateG.position.set(cx, 20, cz);
        scene.add(crateG);
        crateMeshes[newCrate.id] = crateG;
      }

      // --- UPDATE SUPPLY CRATES FALLING MOTION ---
      s.crates.forEach((crate) => {
        if (!crate.collected && crate.y > 0) {
          // Gentle fall with parachute air drag
          crate.y -= dt * 2.5;
          if (crate.y < 0.05) crate.y = 0;

          const mesh = crateMeshes[crate.id];
          if (mesh) {
            mesh.position.y = crate.y;
            // Slowly rotate crate to guide eye
            mesh.rotation.y += dt * 0.45;
          }
        }

        // Check distance to player for collection
        if (!crate.collected && crate.y <= 0.8) {
          const dx = crate.x - s.playerX;
          const dz = crate.z - s.playerZ;
          const dist = Math.sqrt(dx * dx + dz * dz);

          if (dist < 1.4) {
            crate.collected = true;
            audio.playPickup();

            // Apply payload rewards
            if (crate.type === 'health') {
              s.health = Math.min(s.maxHealth, s.health + 40);
              setHealth(s.health);
            } else if (crate.type === 'ammo') {
              // Fill all weapons ammos
              Object.keys(s.weapons).forEach((k) => {
                const wep = s.weapons[k as WeaponType];
                if (wep.unlocked && k !== 'pistol') {
                  wep.ammo = Math.min(wep.maxAmmo, wep.ammo + Math.round(wep.maxAmmo * 0.5));
                }
              });
              setWeapons({ ...s.weapons });
            } else if (crate.type === 'gold') {
              s.gold += 120;
              setGold(s.gold);
            } else if (crate.type === 'weapon' && crate.weaponType) {
              const type = crate.weaponType;
              s.weapons[type].unlocked = true;
              s.weapons[type].ammo = s.weapons[type].maxAmmo;
              setWeapons({ ...s.weapons });
              setActiveWeaponType(type);
              s.activeWeaponType = type;
              (window as any).triggerPlayerWeaponChange?.();
            }

            // Splash pickup green/blue sparkles
            const sparkColor = crate.type === 'health' ? '#f43f5e' : crate.type === 'ammo' ? '#10b981' : '#ca8a04';
            for (let i = 0; i < 15; i++) {
              s.particles.push({
                id: Math.random().toString(),
                x: crate.x,
                y: 0.2,
                z: crate.z,
                vx: (Math.random() - 0.5) * 5,
                vy: Math.random() * 4 + 2,
                vz: (Math.random() - 0.5) * 5,
                color: sparkColor,
                size: 0.16,
                life: 0.65,
                maxLife: 0.65,
                type: 'spark',
              });
            }

            // Remove mesh and clean cache
            const mesh = crateMeshes[crate.id];
            if (mesh) {
              scene.remove(mesh);
              delete crateMeshes[crate.id];
            }
          }
        }
      });

      // Filter collected cages
      s.crates = s.crates.filter(c => !c.collected);

      // --- UPDATE PROJECTILES FLYING AND COLLISIONS ---
      s.projectiles.forEach((proj) => {
        proj.x += proj.vx * dt;
        proj.y += proj.vy * dt;
        proj.z += proj.vz * dt;
        proj.life -= dt;

        // Apply drop gravity slightly on heavy rocket bullet
        if (proj.type === 'rpg') {
          proj.vy -= dt * 6;
        }

        const mesh = projectileMeshes[proj.id];
        if (mesh) {
          mesh.position.set(proj.x, proj.y, proj.z);

          // Point cylindrical rockets in flight vector direction
          if (proj.type === 'rpg') {
            mesh.lookAt(proj.x + proj.vx, proj.y + proj.vy, proj.z + proj.vz);
            mesh.rotateX(Math.PI / 2);
          }
        }

        // --- CHECK COLLISIONS WITH DINOS ---
        s.dinos.forEach((dino) => {
          if (dino.health > 0) {
            const dx = proj.x - dino.x;
            const dz = proj.z - dino.z;
            const dy = proj.y - (dino.y + (dino.size * 0.3));
            const hitDist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            // Collide boundary size limits
            if (hitDist < dino.size * 0.6) {
              // Mark projectile expired
              proj.life = -1;

              // Hit Impact sparks
              for (let i = 0; i < 4; i++) {
                s.particles.push({
                  id: Math.random().toString(),
                  x: proj.x,
                  y: proj.y,
                  z: proj.z,
                  vx: (Math.random() - 0.5) * 6,
                  vy: Math.random() * 4 + 1,
                  vz: (Math.random() - 0.5) * 6,
                  color: proj.color,
                  size: 0.08,
                  life: 0.4,
                  maxLife: 0.4,
                  type: 'spark',
                });
              }

              // Splash RPG blast rocket launcher
              if (proj.type === 'rpg' && proj.splashRadius) {
                audio.playExplosion();
                s.screenShake = 0.75;

                // Blast fire cloud particles
                for (let i = 0; i < 24; i++) {
                  s.particles.push({
                    id: Math.random().toString(),
                    x: proj.x + (Math.random() - 0.5) * 0.5,
                    y: proj.y + (Math.random() - 0.5) * 0.5,
                    z: proj.z + (Math.random() - 0.5) * 0.5,
                    vx: (Math.random() - 0.5) * 9,
                    vy: Math.random() * 6 + 2,
                    vz: (Math.random() - 0.5) * 9,
                    color: Math.random() < 0.5 ? '#f97316' : '#ef4444',
                    size: 0.3 + Math.random() * 0.35,
                    life: 0.7,
                    maxLife: 0.7,
                    type: 'flame',
                  });
                }

                // Apply massive damage loop around blast range
                s.dinos.forEach((targetDino) => {
                  if (targetDino.health > 0) {
                    const bDX = targetDino.x - proj.x;
                    const bDZ = targetDino.z - proj.z;
                    const bDist = Math.sqrt(bDX * bDX + bDZ * bDZ);
                    if (bDist <= proj.splashRadius!) {
                      const finalBlastDmg = Math.round(proj.damage * (1.0 - (bDist / proj.splashRadius!)));
                      targetDino.health -= Math.max(25, finalBlastDmg);
                      s.damageDealt += finalBlastDmg;

                      // Stagger impact recoil
                      targetDino.state = 'recoil';
                      targetDino.stateTime = 0.25;
                    }
                  }
                });
              } else {
                // Single bullet pierce damage
                dino.health -= proj.damage;
                s.damageDealt += proj.damage;
                audio.playDinoHurt();

                // Ignite on Flamethrower
                if (proj.type === 'flame') {
                  dino.isBurning = true;
                  dino.burnDuration = 4.0; // burn for 4 seconds
                }

                // Stagger recoil slightly
                if (dino.state !== 'recoil') {
                  dino.state = 'recoil';
                  dino.stateTime = 0.12;
                }
              }
            }
          }
        });

        // Delete bullet if hits solid ground floor
        if (proj.y <= 0.05 && proj.vy < 0) {
          proj.life = -1;
        }
      });

      // Clean expired proyektil meshes
      s.projectiles.forEach((proj) => {
        if (proj.life <= 0) {
          const mesh = projectileMeshes[proj.id];
          if (mesh) {
            scene.remove(mesh);
            delete projectileMeshes[proj.id];
          }
        }
      });
      s.projectiles = s.projectiles.filter(p => p.life > 0);

      // --- DINOSAUR WALK AI AND COMBAT ENGAGEMENTS ---
      s.dinos.forEach((dino) => {
        if (dino.health <= 0) return;

        // Apply continuous burn damage ticks if on fire
        if (dino.isBurning && dino.burnDuration !== undefined) {
          dino.burnDuration -= dt;
          dino.health -= dt * 35; // burn tick damage
          
          if (dino.burnDuration <= 0) {
            dino.isBurning = false;
          }

          // Emit flame sparks from its torso
          if (Math.random() < 0.22) {
            s.particles.push({
              id: Math.random().toString(),
              x: dino.x + (Math.random() - 0.5) * (dino.size * 0.4),
              y: dino.y + 0.5 + Math.random() * (dino.size * 0.3),
              z: dino.z + (Math.random() - 0.5) * (dino.size * 0.4),
              vx: (Math.random() - 0.5) * 1.5,
              vy: Math.random() * 2 + 1,
              vz: (Math.random() - 0.5) * 1.5,
              color: '#f97316',
              size: 0.18,
              life: 0.45,
              maxLife: 0.45,
              type: 'flame',
            });
          }
        }

        const mesh = dinoMeshes[dino.id];
        if (!mesh) return;

        // Vector pointing directly from dino to player coordinates
        const diffX = s.playerX - dino.x;
        const diffZ = s.playerZ - dino.z;
        const dist = Math.sqrt(diffX * diffX + diffZ * diffZ);

        // Turn to player
        const targetAngle = Math.atan2(diffX, diffZ);
        dino.angle = targetAngle;
        mesh.rotation.y = targetAngle;

        // Animate legs, wings, jaws by dynamic mathematical pivots
        const walkFreq = dino.speed * 1.8;
        const bounce = Math.abs(Math.sin(timeNow * 0.005 * walkFreq)) * 0.15;
        mesh.position.y = dino.y + bounce;

        // Walk animations on sub bones
        const legL = mesh.getObjectByName("legL");
        const legR = mesh.getObjectByName("legR");
        const wingL = mesh.getObjectByName("wingL");
        const wingR = mesh.getObjectByName("wingR");
        const jaw = mesh.getObjectByName("jaw");

        const swingAngle = Math.sin(timeNow * 0.012 * walkFreq) * 0.7;
        if (legL) legL.rotation.x = swingAngle;
        if (legR) legR.rotation.x = -swingAngle;

        // Triceratops front/back quadrupel trot
        const legFL = mesh.getObjectByName("legFL");
        const legFR = mesh.getObjectByName("legFR");
        const legBL = mesh.getObjectByName("legBL");
        const legBR = mesh.getObjectByName("legBR");
        if (legFL) legFL.rotation.x = swingAngle;
        if (legFR) legFR.rotation.x = -swingAngle;
        if (legBL) legBL.rotation.x = -swingAngle;
        if (legBR) legBR.rotation.x = swingAngle;

        // Pterodactyl wing flap
        if (wingL && wingR) {
          const flap = Math.sin(timeNow * 0.016 * walkFreq) * 0.45;
          wingL.rotation.z = flap;
          wingR.rotation.z = -flap;
        }

        // State Machine processing
        if (dino.stateTime > 0) {
          dino.stateTime -= dt;
        } else {
          // Normal behavior
          dino.state = 'walk';
        }

        // TRICERATOPS CHARGING SKILL
        if (dino.type === 'triceratops' && dino.state === 'walk' && dist < 14.0 && Math.random() < 0.012) {
          dino.state = 'charge';
          dino.stateTime = 1.3; // charge in dash for 1.3 seconds with high speed!
          audio.playDinoHurt(); // warning squeal
        }

        // PTERODACTYL swooping down flight altitude adjustments
        if (dino.type === 'pterodactyl') {
          if (dist < 4.0) {
            dino.y = THREE.MathUtils.lerp(dino.y, 0.4, 0.12); // swoops low
          } else {
            dino.y = THREE.MathUtils.lerp(dino.y, 4.5, 0.08); // fly high
          }
        }

        // Apply moving velocities
        if (dino.state === 'recoil') {
          // Stunned step backlash
          const backlashSpeed = -1.8;
          dino.x += Math.sin(targetAngle) * backlashSpeed * dt;
          dino.z += Math.cos(targetAngle) * backlashSpeed * dt;
        } else {
          const speedMultiplier = dino.state === 'charge' ? 2.6 : 1.0;
          dino.x += Math.sin(targetAngle) * dino.speed * speedMultiplier * dt;
          dino.z += Math.cos(targetAngle) * dino.speed * speedMultiplier * dt;
        }

        mesh.position.set(dino.x, dino.y, dino.z);

        // --- ATTACK THE PLAYER (melee bite distance) ---
        if (dino.biteCooldown > 0) {
          dino.biteCooldown -= dt;
        }

        if (dist < dino.size * 0.75 + 0.6) {
          if (dino.biteCooldown <= 0) {
            dino.biteCooldown = 1.2; // damage cooldown is 1.2s

            // Trigger jaw bite animation quickly
            if (jaw) {
              jaw.rotation.x = 0.45;
              setTimeout(() => { if (jaw) jaw.rotation.x = 0; }, 180);
            }

            // Apply damage to Player
            if (s.playerInvulnerable <= 0) {
              s.health -= dino.damage;
              s.playerInvulnerable = 25; // 25 frames immunity (approx 0.4s)
              s.screenShake = 0.6;
              setHealth(s.health);

              audio.playPlayerHurt();

              // Spawn red blood splatter around player chest
              for (let i = 0; i < 10; i++) {
                s.particles.push({
                  id: Math.random().toString(),
                  x: s.playerX,
                  y: 0.8,
                  z: s.playerZ,
                  vx: (Math.random() - 0.5) * 6,
                  vy: Math.random() * 4 + 2,
                  vz: (Math.random() - 0.5) * 6,
                  color: '#ef4444',
                  size: 0.14,
                  life: 0.55,
                  maxLife: 0.55,
                  type: 'blood',
                });
              }

              // Check Player death
              if (s.health <= 0) {
                s.health = 0;
                setHealth(0);
                s.state = 'gameover';
                setGameState('gameover');

                // Record end game stats
                setStats({
                  score: s.score,
                  dinosKilled: s.dinosKilled,
                  wavesCleared: s.currentWave - 1,
                  damageDealt: Math.round(s.damageDealt),
                  goldSpent: s.goldSpent,
                  timeSurvived: s.timeSurvived,
                });
              }
            }
          }
        }
      });

      // Handle dinosaur terminations (Dino Killed!)
      s.dinos.forEach((dino) => {
        if (dino.health <= 0) {
          audio.playDinoRoar(false);

          s.dinosKilled++;
          s.score += dino.xpReward * 12;
          s.gold += dino.goldReward;
          s.xp += dino.xpReward;

          setDinosKilled(s.dinosKilled);
          setScore(s.score);
          setGold(s.gold);

          // Spawn gorgeous 3D color splatter matching Dino scales
          for (let i = 0; i < 22; i++) {
            s.particles.push({
              id: Math.random().toString(),
              x: dino.x,
              y: dino.y + (dino.size * 0.3),
              z: dino.z,
              vx: (Math.random() - 0.5) * 9,
              vy: Math.random() * 6 + 1.5,
              vz: (Math.random() - 0.5) * 9,
              color: dino.color,
              size: 0.14 + Math.random() * 0.16,
              life: 0.7,
              maxLife: 0.7,
              type: 'blood',
            });
          }

          // XP check leveling up threshold
          if (s.xp >= s.xpNeeded) {
            s.xp -= s.xpNeeded;
            s.level++;
            s.xpNeeded = Math.round(s.xpNeeded * 1.5);
            setLevel(s.level);
            setXpNeeded(s.xpNeeded);

            // Halt loop and trigger upgrade perks selection card modal overlay
            triggerLevelUpSelector();
          }

          setXp(s.xp);

          // Track numbers left in wave
          if (s.waveActive) {
            setDinosRemaining(prev => {
              const remaining = Math.max(0, prev - 1);
              if (remaining === 0) {
                // Wave cleared!
                s.waveActive = false;
                setWaveActive(false);
                s.wavePrepTimer = 15;
                setWavePrepTimer(15);
              }
              return remaining;
            });
          }

          // Clean mesh immediately
          const mesh = dinoMeshes[dino.id];
          if (mesh) {
            scene.remove(mesh);
            delete dinoMeshes[dino.id];
          }
        }
      });

      // Filter dead dinosaurs
      s.dinos = s.dinos.filter(d => d.health > 0);

      // --- VISUAL 3D PARTICLES EMISSION ENGINE ---
      s.particles.forEach((part) => {
        part.x += part.vx * dt;
        part.y += part.vy * dt;
        part.z += part.vz * dt;
        part.life -= dt;

        // Apply drop gravity to physical blood splatters and sparks, floating leaves float
        if (part.type === 'blood' || part.type === 'spark') {
          part.vy -= dt * 12.0; // gravity
        } else if (part.type === 'flame') {
          part.vy += dt * 3.0; // expand upwards
          part.vx *= 0.95;
          part.vz *= 0.95;
        }

        // Clamp particles at floor surface
        if (part.y < 0.05) {
          part.y = 0.05;
          part.vx *= 0.7; // friction
          part.vz *= 0.7;
          part.vy = 0;
        }

        // Draw geometric elements in system
        // Reuse visual meshes for incredible performance or spawn/dispose them programmatically
        let pMesh = part as any as THREE.Mesh;
        if (!(part as any).meshInScene) {
          const pGeo = part.type === 'flame' 
            ? new THREE.DodecahedronGeometry(part.size, 0)
            : new THREE.BoxGeometry(part.size, part.size, part.size);
          const pMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(part.color),
            transparent: true,
            opacity: 1.0,
          });
          const m = new THREE.Mesh(pGeo, pMat);
          m.position.set(part.x, part.y, part.z);
          particlesContainer.add(m);
          (part as any).meshInScene = m;
        } else {
          const m = (part as any).meshInScene as THREE.Mesh;
          m.position.set(part.x, part.y, part.z);
          
          // Shrink size and opacity during decay lifetime
          const ratio = Math.max(0, part.life / part.maxLife);
          m.scale.set(ratio, ratio, ratio);
          (m.material as THREE.MeshBasicMaterial).opacity = ratio;
        }
      });

      // Clean dead decaying particles
      s.particles.forEach((part) => {
        if (part.life <= 0) {
          const m = (part as any).meshInScene as THREE.Mesh;
          if (m) {
            particlesContainer.remove(m);
            m.geometry.dispose();
            (m.material as THREE.Material).dispose();
          }
        }
      });
      s.particles = s.particles.filter(p => p.life > 0);

      // --- 10. WEBGL RENDER ---
      renderer.render(scene, camera);
    };

    frameId = requestAnimationFrame(gameTick);

    // --- 11. DYNAMIC RESIZE ACTION ---
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // --- 12. DISBAND COMPILER ON UNMOUNT (Cleanup memory) ---
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      // Dispose resources
      renderer.dispose();
      grid.dispose();
      floorMat.dispose();
      floorGeo.dispose();
      baseCircleMat.dispose();
      baseCircleGeo.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden bg-[#020501] font-sans select-none"
    >
      {/* Space Horizon Atmosphere Layers */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(10,26,5,0.25)_0%,#020501_100%)] pointer-events-none z-10" />
      <div className="absolute inset-0 opacity-15 pointer-events-none scanlines z-10" />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.95)] z-20" />

      {/* Three.js WebGL canvas */}
      <canvas 
        ref={canvasRef}
        className="block w-full h-full cursor-crosshair z-0"
      />

      {/* Stylized custom UI controls overlay */}
      <GameUI
        score={score}
        gold={gold}
        health={health}
        maxHealth={maxHealth}
        xp={xp}
        xpNeeded={xpNeeded}
        level={level}
        currentWave={currentWave}
        dinosKilled={dinosKilled}
        dinosRemaining={dinosRemaining}
        waveActive={waveActive}
        wavePrepTimer={wavePrepTimer}
        weapons={weapons}
        activeWeaponType={activeWeaponType}
        setActiveWeaponType={handleWeaponChange}
        buyWeapon={buyWeapon}
        buyAmmo={buyAmmo}
        availablePerks={availablePerks}
        selectPerk={selectPerk}
        buySentry={buySentry}
        sentryCount={sentryCount}
        sentryCost={sentryCost}
        gameState={gameState}
        startNewGame={startNewGame}
        stats={stats}
        toggleMuted={toggleMuted}
        isMuted={isMuted}
      />
    </div>
  );
}
