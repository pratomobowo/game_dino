import * as THREE from 'three';

// Low-poly 3D models builder using primitive shapes
// Utilizes flat shading for a modern stylized aesthetic

// Materials caching for performance
const materialsCache: Record<string, THREE.Material> = {};

function getMaterial(color: number | string, roughness = 0.8, metalness = 0.2): THREE.Material {
  const key = `${color}_${roughness}_${metalness}`;
  if (materialsCache[key]) {
    return materialsCache[key];
  }
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness,
    metalness,
    flatShading: true,
  });
  materialsCache[key] = mat;
  return mat;
}

// 1. CREATE PLAYER MODEL
export function createPlayerMesh(): THREE.Group {
  const playerGroup = new THREE.Group();

  // Shadow/feet reference
  const feetGroup = new THREE.Group();
  playerGroup.add(feetGroup);

  // Left Leg
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.25), getMaterial(0x334155)); // Slate pants
  legL.position.set(-0.2, 0.25, 0);
  feetGroup.add(legL);

  // Right Leg
  const legR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.25), getMaterial(0x334155));
  legR.position.set(0.2, 0.25, 0);
  feetGroup.add(legR);

  // Torso (Soldier Armor)
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.4), getMaterial(0x166534)); // Dark green vest
  torso.position.set(0, 0.85, 0);
  playerGroup.add(torso);

  // Tactical belt/backpack
  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.25), getMaterial(0x3f6212)); // Olive olive
  backpack.position.set(0, 0.85, -0.3);
  playerGroup.add(backpack);

  // Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), getMaterial(0xfbcfe8)); // Skin tone
  head.position.set(0, 1.35, 0);
  playerGroup.add(head);

  // Helmet
  const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.2, 0.44), getMaterial(0x1e293b)); // Slate black helmet
  helmet.position.set(0, 1.5, 0);
  playerGroup.add(helmet);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.1, 0.1), getMaterial(0xef4444)); // Red visor
  visor.position.set(0, 1.45, 0.18);
  playerGroup.add(visor);

  // Gun Arm Group (Right arm holding weapon)
  const armGroup = new THREE.Group();
  armGroup.position.set(0.4, 0.85, 0.1);
  playerGroup.add(armGroup);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.2), getMaterial(0x166534));
  arm.position.set(0, -0.15, 0.1);
  arm.rotation.x = Math.PI / 3;
  armGroup.add(arm);

  // Gun placeholder mesh inside arm group
  const weaponMeshHolder = new THREE.Group();
  weaponMeshHolder.name = "weapon_holder";
  weaponMeshHolder.position.set(0, -0.35, 0.3);
  weaponMeshHolder.rotation.x = Math.PI / 6;
  armGroup.add(weaponMeshHolder);

  // Flashlight Attachment
  const flashlight = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.3, 8), getMaterial(0xd1d5db));
  flashlight.rotation.x = Math.PI / 2;
  flashlight.position.set(-0.4, 0.8, 0.2); // Attached to shoulder
  playerGroup.add(flashlight);

  // Add tag names so we can animate limbs easily
  legL.name = "legL";
  legR.name = "legR";
  armGroup.name = "armGroup";

  // Position offset to align feet at ground level
  playerGroup.position.y = 0;

  return playerGroup;
}

// 2. CREATE WEAPON GRAPHICS
export function updateWeaponMesh(holder: THREE.Group, type: string) {
  // Clear previous weapon
  while (holder.children.length > 0) {
    holder.remove(holder.children[0]);
  }

  const weaponGroup = new THREE.Group();

  if (type === 'pistol') {
    // Small handgun
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.3), getMaterial(0x4b5563));
    barrel.position.set(0, 0, 0.1);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.15, 0.08), getMaterial(0x1f2937));
    grip.position.set(0, -0.08, 0.0);
    grip.rotation.x = Math.PI / 6;

    weaponGroup.add(barrel, grip);
  } else if (type === 'shotgun') {
    // Double barrel shotgun
    const barrel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.55, 8), getMaterial(0x374151));
    barrel1.rotation.x = Math.PI / 2;
    barrel1.position.set(-0.04, 0, 0.15);

    const barrel2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.55, 8), getMaterial(0x374151));
    barrel2.rotation.x = Math.PI / 2;
    barrel2.position.set(0.04, 0, 0.15);

    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.4), getMaterial(0x78350f)); // Wooden brown stock
    stock.position.set(0, -0.04, -0.15);
    stock.rotation.x = Math.PI / 15;

    weaponGroup.add(barrel1, barrel2, stock);
  } else if (type === 'rifle') {
    // Assault rifle
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.45), getMaterial(0x1e293b));
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8), getMaterial(0x4b5563));
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, 0.35);

    const scope = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.2), getMaterial(0x3b82f6));
    scope.position.set(0, 0.1, 0);

    const magazine = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.25, 0.12), getMaterial(0x0f172a));
    magazine.position.set(0, -0.12, 0.1);
    magazine.rotation.x = -Math.PI / 12;

    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.35), getMaterial(0x1e293b));
    stock.position.set(0, -0.02, -0.22);

    weaponGroup.add(receiver, barrel, scope, magazine, stock);
  } else if (type === 'rpg') {
    // RPG launcher
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 8), getMaterial(0x14532d)); // Dark forest green
    tube.rotation.x = Math.PI / 2;

    const shieldFrill = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.15, 8), getMaterial(0x9a3412));
    shieldFrill.rotation.x = Math.PI / 2;
    shieldFrill.position.set(0, 0, 0.15);

    // Rocket loaded on tip
    const rocketBody = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.15, 0.25, 8), getMaterial(0xeab308)); // Golden warhead
    rocketBody.rotation.x = Math.PI / 2;
    rocketBody.position.set(0, 0.0, 0.52);

    const rocketCone = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.15, 8), getMaterial(0xd97706));
    rocketCone.rotation.x = Math.PI / 2;
    rocketCone.position.set(0, 0.0, 0.72);

    weaponGroup.add(tube, shieldFrill, rocketBody, rocketCone);
  } else if (type === 'plasma') {
    // Plasma Gun futuristic
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.55), getMaterial(0xf8fafc));
    const energyCoil = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.25, 8), getMaterial(0x06b6d4)); // Cyan light coil
    energyCoil.rotation.x = Math.PI / 2;
    energyCoil.position.set(0, 0.0, 0.1);

    const sight = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.05), getMaterial(0xe2e8f0));
    sight.position.set(0, 0.12, 0.22);

    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.15, 8), getMaterial(0x64748b));
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.set(0, 0, 0.35);

    weaponGroup.add(barrel, energyCoil, sight, nozzle);
  } else if (type === 'flame') {
    // Flamethrower
    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.45), getMaterial(0xef4444)); // Burning Red body
    const fuelTank = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.22, 8), getMaterial(0x3b82f6)); // Small blue pressure bottle
    fuelTank.position.set(0, -0.15, -0.05);

    const jetNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.3, 8), getMaterial(0xf59e0b)); // Brass nozzle
    jetNozzle.rotation.x = Math.PI / 2;
    jetNozzle.position.set(0, 0, 0.32);

    weaponGroup.add(mainBody, fuelTank, jetNozzle);
  }

  holder.add(weaponGroup);
}

// 3. DINOSAURS MODELS
// T-REX MODEL
export function createTrexMesh(colorHex: number): THREE.Group {
  const trex = new THREE.Group();

  // Torso / bulky spine
  const torso = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 1.3), getMaterial(colorHex));
  torso.position.set(0, 1.7, 0);
  torso.castShadow = true;
  trex.add(torso);

  // Big heavy tail
  const tailGroup = new THREE.Group();
  tailGroup.name = "tail";
  tailGroup.position.set(0, 1.8, -0.7);
  torso.add(tailGroup);

  const tailSeg1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 1.2), getMaterial(colorHex));
  tailSeg1.position.set(0, -0.1, -0.5);
  tailGroup.add(tailSeg1);

  const tailSeg2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.9), getMaterial(colorHex));
  tailSeg2.position.set(0, -0.2, -1.4);
  tailGroup.add(tailSeg2);

  // Giant head
  const headGroup = new THREE.Group();
  headGroup.name = "head";
  headGroup.position.set(0, 0.6, 0.8);
  torso.add(headGroup);

  const skull = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.6), getMaterial(colorHex));
  skull.position.set(0, 0.4, 0.5);
  headGroup.add(skull);

  // Big Lower Jaw with biting pivot
  const jaw = new THREE.Group();
  jaw.name = "jaw";
  jaw.position.set(0, -0.2, 0.1);
  headGroup.add(jaw);

  const jawBone = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.4, 1.4), getMaterial(colorHex));
  jawBone.position.set(0, -0.1, 0.5);
  jaw.add(jawBone);

  // Sharp white teeth rows
  const teethUpper = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.1, 1.25), getMaterial(0xffffff));
  teethUpper.position.set(0, -0.12, 0.6);
  skull.add(teethUpper);

  const teethLower = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.1, 1.2), getMaterial(0xffffff));
  teethLower.position.set(0, 0.12, 0.55);
  jawBone.add(teethLower);

  // Angry yellow-red eyes
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), getMaterial(0xeab308));
  eyeL.position.set(0.51, 0.55, 0.4);
  const pupilL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.19), getMaterial(0xd97706));
  pupilL.position.set(0.52, 0.55, 0.4);
  headGroup.add(eyeL, pupilL);

  const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), getMaterial(0xeab308));
  eyeR.position.set(-0.51, 0.55, 0.4);
  const pupilR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.19), getMaterial(0xd97706));
  pupilR.position.set(-0.52, 0.55, 0.4);
  headGroup.add(eyeR, pupilR);

  // Tiny comical T-Rex arms
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.2), getMaterial(colorHex));
  armL.position.set(0.8, 1.8, 0.5);
  armL.rotation.z = Math.PI / 8;
  armL.rotation.x = Math.PI / 4;
  trex.add(armL);

  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.2), getMaterial(colorHex));
  armR.position.set(-0.8, 1.8, 0.5);
  armR.rotation.z = -Math.PI / 8;
  armR.rotation.x = Math.PI / 4;
  trex.add(armR);

  // Thick stomper legs
  const legLGroup = new THREE.Group();
  legLGroup.name = "legL";
  legLGroup.position.set(0.65, 1.2, 0);
  trex.add(legLGroup);

  const thighL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.9, 0.6), getMaterial(colorHex));
  thighL.position.set(0, -0.4, 0);
  legLGroup.add(thighL);

  const shinL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.8, 0.35), getMaterial(colorHex));
  shinL.position.set(0, -1.0, 0.1);
  legLGroup.add(shinL);

  const footL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.7), getMaterial(0x1e293b));
  footL.position.set(0, -1.45, 0.25);
  legLGroup.add(footL);

  const legRGroup = new THREE.Group();
  legRGroup.name = "legR";
  legRGroup.position.set(-0.65, 1.2, 0);
  trex.add(legRGroup);

  const thighR = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.9, 0.6), getMaterial(colorHex));
  thighR.position.set(0, -0.4, 0);
  legRGroup.add(thighR);

  const shinR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.8, 0.35), getMaterial(colorHex));
  shinR.position.set(0, -1.0, 0.1);
  legRGroup.add(shinR);

  const footR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.7), getMaterial(0x1e293b));
  footR.position.set(0, -1.45, 0.25);
  legRGroup.add(footR);

  return trex;
}

// VELOCIRAPTOR MODEL
export function createRaptorMesh(colorHex: number): THREE.Group {
  const raptor = new THREE.Group();

  // Bullet body shape
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 1.4), getMaterial(colorHex));
  body.position.set(0, 0.9, 0);
  raptor.add(body);

  // Long whip tail (balance)
  const tailGroup = new THREE.Group();
  tailGroup.name = "tail";
  tailGroup.position.set(0, 0.1, -0.6);
  body.add(tailGroup);

  const tailS1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 1.0), getMaterial(colorHex));
  tailS1.position.set(0, 0, -0.4);
  tailGroup.add(tailS1);

  const tailS2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.8), getMaterial(colorHex));
  tailS2.position.set(0, 0.05, -1.2);
  tailGroup.add(tailS2);

  // Long active neck + head
  const neckGroup = new THREE.Group();
  neckGroup.name = "neck";
  neckGroup.position.set(0, 0.2, 0.6);
  body.add(neckGroup);

  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.6, 0.35), getMaterial(colorHex));
  neck.position.set(0, 0.3, 0.1);
  neck.rotation.x = -Math.PI / 6;
  neckGroup.add(neck);

  const skull = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.95), getMaterial(colorHex));
  skull.position.set(0, 0.6, 0.35);
  neckGroup.add(skull);

  // Slit glowing eyes
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), getMaterial(0xf97316));
  eyeL.position.set(0.21, 0.7, 0.55);
  const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), getMaterial(0xf97316));
  eyeR.position.set(-0.21, 0.7, 0.55);
  neckGroup.add(eyeL, eyeR);

  // Sharp grab claws (front arms)
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 0.15), getMaterial(colorHex));
  armL.position.set(0.35, 0.8, 0.4);
  armL.rotation.x = Math.PI / 5;
  raptor.add(armL);

  const clawL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.2), getMaterial(0xe2e8f0));
  clawL.position.set(0.35, 0.6, 0.52);
  raptor.add(clawL);

  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 0.15), getMaterial(colorHex));
  armR.position.set(-0.35, 0.8, 0.4);
  armR.rotation.x = Math.PI / 5;
  raptor.add(armR);

  const clawR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.2), getMaterial(0xe2e8f0));
  clawR.position.set(-0.35, 0.6, 0.52);
  raptor.add(clawR);

  // Jump leg structures
  const legLGroup = new THREE.Group();
  legLGroup.name = "legL";
  legLGroup.position.set(0.32, 0.7, -0.1);
  raptor.add(legLGroup);

  const thighL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.5, 0.35), getMaterial(colorHex));
  thighL.position.set(0, -0.2, 0);
  legLGroup.add(thighL);

  const shinL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.14), getMaterial(colorHex));
  shinL.position.set(0, -0.5, 0.1);
  legLGroup.add(shinL);

  const footL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.45), getMaterial(0x0f172a));
  footL.position.set(0, -0.75, 0.2);
  legLGroup.add(footL);

  const legRGroup = new THREE.Group();
  legRGroup.name = "legR";
  legRGroup.position.set(-0.32, 0.7, -0.1);
  raptor.add(legRGroup);

  const thighR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.5, 0.35), getMaterial(colorHex));
  thighR.position.set(0, -0.2, 0);
  legRGroup.add(thighR);

  const shinR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.14), getMaterial(colorHex));
  shinR.position.set(0, -0.5, 0.1);
  legRGroup.add(shinR);

  const footR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.45), getMaterial(0x0f172a));
  footR.position.set(0, -0.75, 0.2);
  legRGroup.add(footR);

  return raptor;
}

// TRICERATOPS MODEL WITH HORNS AND CHARGING COLLAR
export function createTriceratopsMesh(colorHex: number): THREE.Group {
  const triceratops = new THREE.Group();

  // Fat robust chassis
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 2.3), getMaterial(colorHex));
  body.position.set(0, 1.0, 0);
  triceratops.add(body);

  // Shield crest frill
  const frillGroup = new THREE.Group();
  frillGroup.name = "frill";
  frillGroup.position.set(0, 1.5, 0.9);
  frillGroup.rotation.x = -Math.PI / 6;
  triceratops.add(frillGroup);

  const shield = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.4, 0.25), getMaterial(colorHex));
  frillGroup.add(shield);

  // Spikes on shield frill edges
  for (let i = -0.9; i <= 0.9; i += 0.45) {
    if (Math.abs(i) > 0.05) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.25, 4), getMaterial(0xfffbeb)); // Bone ivory
      spike.rotation.x = Math.PI / 2;
      spike.position.set(i, 0.7, 0);
      frillGroup.add(spike);
    }
  }

  // Head
  const headGroup = new THREE.Group();
  headGroup.name = "head";
  headGroup.position.set(0, 0.8, 1.5);
  triceratops.add(headGroup);

  const skull = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.8, 1.1), getMaterial(colorHex));
  skull.position.set(0, 0, 0);
  headGroup.add(skull);

  // Big horns (x2 on brow)
  const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.15, 1.0, 8), getMaterial(0xffffff));
  hornL.rotation.x = Math.PI / 4;
  hornL.position.set(0.3, 0.4, 0.6);
  headGroup.add(hornL);

  const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.15, 1.0, 8), getMaterial(0xffffff));
  hornR.rotation.x = Math.PI / 4;
  hornR.position.set(-0.3, 0.4, 0.6);
  headGroup.add(hornR);

  // Nose horn (small)
  const noseHorn = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 8), getMaterial(0xffffff));
  noseHorn.rotation.x = Math.PI / 10;
  noseHorn.position.set(0, 0.2, 0.6);
  headGroup.add(noseHorn);

  // Stubby thick legs (Quadrupedal)
  const legsGroup = new THREE.Group();
  legsGroup.name = "legs";
  triceratops.add(legsGroup);

  // Front Left
  const legFL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.7, 0.4), getMaterial(colorHex));
  legFL.position.set(0.65, 0.35, 0.8);
  legFL.name = "legFL";
  // Front Right
  const legFR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.7, 0.4), getMaterial(colorHex));
  legFR.position.set(-0.65, 0.35, 0.8);
  legFR.name = "legFR";
  // Back Left
  const legBL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.7, 0.4), getMaterial(colorHex));
  legBL.position.set(0.65, 0.35, -0.8);
  legBL.name = "legBL";
  // Back Right
  const legBR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.7, 0.4), getMaterial(colorHex));
  legBR.position.set(-0.65, 0.35, -0.8);
  legBR.name = "legBR";

  legsGroup.add(legFL, legFR, legBL, legBR);

  return triceratops;
}

// PTERODACTYL (FLYING DINO MESH BUILDER)
export function createPterodactylMesh(colorHex: number): THREE.Group {
  const pterodactyl = new THREE.Group();

  // Torso cylinder sleek
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 1.2), getMaterial(colorHex));
  body.castShadow = true;
  body.position.set(0, 0, 0);
  pterodactyl.add(body);

  // Beak/Head structure
  const neckGroup = new THREE.Group();
  neckGroup.name = "head_group";
  neckGroup.position.set(0, 0.1, 0.6);
  body.add(neckGroup);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.4), getMaterial(colorHex));
  neckGroup.add(head);

  // Giant forward beak
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1.1, 8), getMaterial(0xeab308)); // Long yellow spear beak
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, -0.05, 0.65);
  neckGroup.add(beak);

  // Crest helmet
  const crest = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.6), getMaterial(colorHex));
  crest.rotation.x = -Math.PI / 4;
  crest.position.set(0, 0.2, -0.2);
  neckGroup.add(crest);

  // Wings (Flappable pivots)
  const wingLGroup = new THREE.Group();
  wingLGroup.name = "wingL";
  wingLGroup.position.set(0.2, 0, 0);
  body.add(wingLGroup);

  const wingLInner = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.6), getMaterial(colorHex));
  wingLInner.position.set(0.6, 0, 0);
  wingLGroup.add(wingLInner);

  const wingLOuter = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.02, 0.4), getMaterial(0x7c3aed)); // Purple wing membrane
  wingLOuter.position.set(1.6, 0.01, 0);
  wingLOuter.rotation.z = Math.PI / 18;
  wingLGroup.add(wingLOuter);

  const wingRGroup = new THREE.Group();
  wingRGroup.name = "wingR";
  wingRGroup.position.set(-0.2, 0, 0);
  body.add(wingRGroup);

  const wingRInner = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.6), getMaterial(colorHex));
  wingRInner.position.set(-0.6, 0, 0);
  wingRGroup.add(wingRInner);

  const wingROuter = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.02, 0.4), getMaterial(0x7c3aed));
  wingROuter.position.set(-1.6, 0.01, 0);
  wingROuter.rotation.z = -Math.PI / 18;
  wingRGroup.add(wingROuter);

  // Claw feet (tiny tucked away)
  const feet = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.3), getMaterial(0x1e293b));
  feet.position.set(0, -0.1, -0.5);
  body.add(feet);

  return pterodactyl;
}

// 4. ENVIRONMENT: TREE GENERATOR
export function createTreeMesh(style: number): THREE.Group {
  const tree = new THREE.Group();

  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.3, 2.2, 8);
  const trunkMat = getMaterial(0x78350f); // Wood brown
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 1.1;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  // Procedural low-poly foliage
  const leafMat = getMaterial(style % 2 === 0 ? 0x15803d : 0x14532d); // Forest green variants
  
  if (style % 3 === 0) {
    // Pine shape tree
    const leaf1 = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.8, 8), leafMat);
    leaf1.position.y = 2.4;
    leaf1.castShadow = true;

    const leaf2 = new THREE.Mesh(new THREE.ConeGeometry(1.0, 1.5, 8), leafMat);
    leaf2.position.y = 3.2;
    leaf2.castShadow = true;

    tree.add(leaf1, leaf2);
  } else if (style % 3 === 1) {
    // Fluffy bush tree list of spheres
    const foliage = new THREE.Group();
    foliage.position.y = 2.5;

    const b1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9, 1), leafMat);
    b1.position.set(0, 0, 0);
    const b2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 1), leafMat);
    b2.position.set(0.6, 0.3, 0.4);
    const b3 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 1), leafMat);
    b3.position.set(-0.5, 0.4, -0.3);
    const b4 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6, 1), leafMat);
    b4.position.set(0.1, 0.8, -0.2);

    foliage.add(b1, b2, b3, b4);
    tree.add(foliage);
  } else {
    // Palm or parasol umbrella tree style
    const foliage = new THREE.Group();
    foliage.position.y = 2.2;
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
      const leafFrond = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.4), leafMat);
      leafFrond.position.set(Math.cos(angle) * 0.7, 0.4, Math.sin(angle) * 0.7);
      leafFrond.rotation.y = -angle;
      leafFrond.rotation.z = 0.2;
      foliage.add(leafFrond);
    }
    tree.add(foliage);
  }

  return tree;
}

// 5. DEFENSE TURRET GRAPHICS
export function createTurretMesh(): THREE.Group {
  const turret = new THREE.Group();

  // Heavy metal circular base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, 0.2, 12), getMaterial(0x475569, 0.4, 0.7));
  base.position.y = 0.1;
  base.castShadow = true;
  base.receiveShadow = true;
  turret.add(base);

  // Stand pillar
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.0, 8), getMaterial(0x334155, 0.5, 0.6));
  pillar.position.y = 0.6;
  turret.add(pillar);

  // Swiveling body (tagged to modify rotating angle)
  const swivelBody = new THREE.Group();
  swivelBody.name = "swivel_body";
  swivelBody.position.y = 1.1;
  turret.add(swivelBody);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.55), getMaterial(0x1e293b, 0.3, 0.8));
  swivelBody.add(head);

  // Double Laser blast gun barrels
  const barrelL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.65, 8), getMaterial(0x64748b, 0.2, 0.8));
  barrelL.rotation.x = Math.PI / 2;
  barrelL.position.set(0.2, 0, 0.3);

  const barrelR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.65, 8), getMaterial(0x64748b, 0.2, 0.8));
  barrelR.rotation.x = Math.PI / 2;
  barrelR.position.set(-0.2, 0, 0.3);

  swivelBody.add(barrelL, barrelR);

  // Power Core sphere
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), getMaterial(0x06b6d4, 0.1, 0.9)); // cyan core
  core.position.set(0, 0.25, -0.1);
  swivelBody.add(core);

  return turret;
}

// 6. SUPPLY CHEST
export function createSupplyCrateMesh(type: string): THREE.Group {
  const crateGroup = new THREE.Group();

  // Low poly wooden container box
  let boxColor = 0xb45309; // Orange Wood for generic
  if (type === 'health') boxColor = 0xd97706; // Amber
  if (type === 'ammo') boxColor = 0x16a34a; // Green
  if (type === 'gold') boxColor = 0xca8a04; // Gold Yellow
  if (type === 'weapon') boxColor = 0x6d28d9; // Purple

  const box = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.8), getMaterial(boxColor));
  box.position.y = 0.35;
  box.castShadow = true;
  crateGroup.add(box);

  // White cross or symbol ribbons
  const ribH = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.73, 0.15), getMaterial(0xffffff));
  ribH.position.y = 0.35;
  const ribV = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.73, 0.84), getMaterial(0xffffff));
  ribV.position.y = 0.35;
  crateGroup.add(ribH, ribV);

  // Type Indicator light sphere
  let glowColor = 0xff0000;
  if (type === 'health') glowColor = 0xf43f5e;
  if (type === 'ammo') glowColor = 0x22c55e;
  if (type === 'gold') glowColor = 0xeab308;
  if (type === 'weapon') glowColor = 0xa855f7;

  const light = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), getMaterial(glowColor, 0.1, 1.0));
  light.position.set(0, 0.75, 0);
  crateGroup.add(light);

  // Add a literal miniature stylized model attached to represent the crate type
  if (type === 'health') {
    // Red Cross block
    const crossBar1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.12), getMaterial(0xf43f5e));
    crossBar1.position.set(0, 0.75, 0.1);
    const crossBar2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.12), getMaterial(0xf43f5e));
    crossBar2.position.set(0, 0.75, 0.1);
    crateGroup.add(crossBar1, crossBar2);
  } else if (type === 'ammo') {
    // Stylized bullet pile
    const bullet = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.25, 8), getMaterial(0xeab308));
    bullet.rotation.x = Math.PI / 6;
    bullet.position.set(0, 0.75, 0.15);
    crateGroup.add(bullet);
  } else if (type === 'gold') {
    // Giant gold coin
    const goldC = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 10), getMaterial(0xfacc15, 0.1, 0.9));
    goldC.rotation.z = Math.PI / 2;
    goldC.position.set(0, 0.75, 0.15);
    crateGroup.add(goldC);
  }

  return crateGroup;
}
