// Optional verified mod ID packs for Questlog autocomplete.
//
// Keep this file source-first: add a pack only when IDs were generated from a
// specific mod version's source or jar registry dump. Do not copy partial wiki
// lists into production suggestions.
window.MOD_ID_PACKS = {
  schema: 1,
  defaultTarget: '1.21.1',
  supportedTargets: ['1.21.1', '1.20.1'],
  notes: 'Rows are intentionally empty until each mod/version has verified generated registry data.',
  packs: [
    {
      id: 'create',
      name: 'Create',
      description: 'Automation, contraptions, machines, trains, and kinetic building.',
      category: 'Tech and automation',
      modIds: ['create'],
      supportedVersions: ['1.21.1', '1.20.1'],
      note: 'High-priority 1.21.1 pack. Needs generated registry dump before suggestions are enabled.'
    },
    {
      id: 'farmersdelight',
      name: "Farmer's Delight",
      description: 'Cooking, farming, meals, tools, and kitchen blocks.',
      category: 'Food and farming',
      modIds: ['farmersdelight'],
      supportedVersions: ['1.21.1', '1.20.1'],
      note: 'High-priority food/cooking pack. Needs generated registry dump before suggestions are enabled.'
    },
    {
      id: 'supplementaries',
      name: 'Supplementaries',
      description: 'Vanilla-style decoration, utility blocks, tools, and small interactions.',
      category: 'Utility and decoration',
      modIds: ['supplementaries'],
      supportedVersions: ['1.21.1', '1.20.1'],
      note: 'High-priority decoration/utility pack. Needs generated registry dump before suggestions are enabled.'
    },
    {
      id: 'quark',
      name: 'Quark',
      description: 'Vanilla-plus blocks, items, mobs, building pieces, and quality-of-life content.',
      category: 'Utility and vanilla-plus',
      modIds: ['quark'],
      supportedVersions: ['1.21.1', '1.20.1'],
      note: 'Marked 1.21.1 compatible per Christopher. Current generated IDs are from the 1.20.1 jar until a direct 1.21.1 registry dump replaces them.'
    },
    {
      id: 'cataclysm',
      name: "L_Ender's Cataclysm",
      description: 'Bosses, dungeons, weapons, armor, and late-game adventure content.',
      category: 'Bosses and adventure',
      modIds: ['cataclysm'],
      supportedVersions: ['1.21.1', '1.20.1'],
      note: 'Boss/adventure pack. Needs generated registry dump before suggestions are enabled.'
    },
    {
      id: 'deeperdarker',
      name: 'Deeper and Darker',
      description: 'Ancient-city expansion with the Otherside dimension, sculk gear, mobs, and biomes.',
      category: 'Adventure and dimensions',
      modIds: ['deeperdarker'],
      supportedVersions: ['1.21.1', '1.20.1'],
      note: 'Deep Dark expansion pack. Needs generated registry dump before suggestions are enabled.'
    },
    {
      id: 'alexscaves',
      name: "Alex's Caves",
      description: 'Large cave biomes with mobs, blocks, gear, fossils, and exploration content.',
      category: 'Caves and adventure',
      modIds: ['alexscaves'],
      supportedVersions: ['1.21.1', '1.20.1'],
      note: 'Marked 1.21.1 compatible per Christopher. Current generated IDs are from the 1.20.1 jar until a direct 1.21.1 registry dump replaces them.'
    },
    {
      id: 'alexsmobs',
      name: "Alex's Mobs",
      description: 'Real and fictional animals with drops, items, and wildlife encounters.',
      category: 'Mobs and wildlife',
      modIds: ['alexsmobs'],
      supportedVersions: ['1.21.1', '1.20.1'],
      note: 'Marked 1.21.1 compatible per Christopher. Current generated IDs are from the 1.20.1 jar until a direct 1.21.1 registry dump replaces them.'
    },
    {
      id: 'starcatcher',
      name: 'Starcatcher',
      description: 'Fishing-focused content with new catches, rods, bait, and aquatic progression.',
      category: 'Fishing and collection',
      modIds: ['starcatcher'],
      supportedVersions: ['1.21.1', '1.20.1'],
      note: 'Fishing mod target confirmed. Needs generated registry dump before suggestions are enabled.'
    },
    {
      id: 'regions_unexplored',
      name: 'Regions Unexplored',
      description: 'Large biome expansion with plants, trees, blocks, and worldgen variety.',
      category: 'Worldgen and biomes',
      modIds: ['regions_unexplored'],
      supportedVersions: ['1.21.1', '1.20.1'],
      note: 'Biome pack. Needs generated registry dump before suggestions are enabled.'
    },
    {
      id: 'biomeswevegone',
      name: "Oh The Biomes We've Gone / BYG",
      description: 'Biome expansion with new woods, plants, blocks, and exploration content.',
      category: 'Worldgen and biomes',
      modIds: ['biomeswevegone', 'byg'],
      supportedVersions: ['1.21.1'],
      note: 'Use the modern Biomes We Have Gone/BYG-family data for 1.21.1. Confirm 1.20.1 target separately.'
    },
    {
      id: 'biomesoplenty',
      name: "Biomes O' Plenty",
      description: 'Classic biome expansion with plants, trees, terrain, and building blocks.',
      category: 'Worldgen and biomes',
      modIds: ['biomesoplenty'],
      supportedVersions: ['1.21.1', '1.20.1'],
      note: 'Biome pack. Needs generated registry dump before suggestions are enabled.'
    },
    {
      id: 'netherexp',
      name: "Jaden's Nether Expansion",
      description: 'Nether biomes, mobs, blocks, gear, and dimension progression.',
      category: 'Nether',
      modIds: ['netherexp'],
      supportedVersions: ['1.21.1', '1.20.1'],
      note: 'Nether pack. Needs exact mod version and generated registry dump.'
    },
    {
      id: 'betternether',
      name: 'BetterNether',
      description: 'Nether biomes, structures, plants, mobs, and building blocks.',
      category: 'Nether',
      modIds: ['betternether'],
      supportedVersions: ['1.21.1', '1.20.1'],
      note: 'Nether/worldgen pack. Needs loader/version-specific registry dump.'
    },
    {
      id: 'betterend',
      name: 'BetterEnd',
      description: 'End biomes, structures, plants, mobs, tools, and building blocks.',
      category: 'End',
      modIds: ['betterend'],
      supportedVersions: ['1.21.1', '1.20.1'],
      note: 'End/worldgen pack. Needs loader/version-specific registry dump.'
    },
    {
      id: 'endrem',
      name: 'End Remastered',
      description: 'End progression overhaul built around finding unique eyes.',
      category: 'End',
      modIds: ['endrem'],
      supportedVersions: ['1.21.1', '1.20.1'],
      note: 'End progression pack. Needs generated registry dump before suggestions are enabled.'
    },
    {
      id: 'darkerdepths',
      name: 'Darker Depths',
      description: 'Underground biomes, cave blocks, mobs, and exploration content.',
      category: 'Caves and worldgen',
      modIds: ['darkerdepths'],
      supportedVersions: ['1.21.1', '1.20.1'],
      note: 'Cave/worldgen candidate. Needs exact project source and generated registry dump.'
    },
    {
      id: 'galosphere',
      name: 'Galosphere',
      description: 'Crystal cave content with mobs, blocks, tools, and underground exploration.',
      category: 'Caves and worldgen',
      modIds: ['galosphere'],
      supportedVersions: ['1.21.1', '1.20.1'],
      note: 'Cave/content pack. Needs generated registry dump before suggestions are enabled.'
    }
  ]
};

window.MOD_ID_PACKS.register = function registerModIdPack(pack) {
  if (!pack || !pack.id) return;
  const packs = window.MOD_ID_PACKS.packs;
  const existing = packs.findIndex(entry => entry.id === pack.id);
  if (existing >= 0) {
    packs[existing] = Object.assign({}, packs[existing], pack);
  } else {
    packs.push(pack);
  }
};
