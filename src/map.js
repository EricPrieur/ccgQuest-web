/**
 * Map system - nodes connected by paths, each with encounters.
 */

export class MapNode {
  constructor({
    id, name, description, encounterId = '',
    connections = [], position = [0, 0], mapArea = '',
    isLocked = false, canRevisit = false, unlocks = [],
    hiddenName = '', hiddenDescription = '',
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.encounterId = encounterId;
    this.connections = connections;
    this.position = position;
    this.mapArea = mapArea;
    this.isLocked = isLocked;
    this.isDone = false;
    this.canRevisit = canRevisit;
    this.unlocks = unlocks;
    this.hiddenName = hiddenName;
    this.hiddenDescription = hiddenDescription;
    // Keys of encounter choices that have been permanently exhausted on this node.
    // Used for repeat-visit encounters (Abandoned Camp: one rest, one search).
    this.exhaustedChoices = [];
  }

  get displayName() {
    if (!this.isDone && this.hiddenName) return this.hiddenName;
    return this.name;
  }

  get displayDescription() {
    if (!this.isDone && this.hiddenDescription) return this.hiddenDescription;
    return this.description;
  }
}

export class GameMap {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.nodes = {};
    this.currentNodeId = '';
    this.mapImages = {}; // areaId -> image path
  }

  addNode(node) {
    this.nodes[node.id] = node;
  }

  getNode(id) {
    return this.nodes[id] || null;
  }

  getCurrentNode() {
    return this.getNode(this.currentNodeId);
  }

  getAccessibleNodes() {
    const current = this.getCurrentNode();
    if (!current) return [];
    return current.connections
      .map(id => this.getNode(id))
      .filter(n => n && !n.isLocked);
  }

  moveTo(nodeId) {
    const accessible = this.getAccessibleNodes();
    const node = accessible.find(n => n.id === nodeId);
    if (!node) return false;
    this.currentNodeId = nodeId;
    return true;
  }

  completeCurrentNode() {
    const node = this.getCurrentNode();
    if (!node) return;
    node.isDone = true;
    for (const unlockId of node.unlocks) {
      const target = this.getNode(unlockId);
      if (target) target.isLocked = false;
    }
  }
}

// === Prison Cell Map ===
export function createPrisonCellMap() {
  const map = new GameMap('prison_cell', 'Prison Cell');
  map.mapImages = {
    prison_cell: 'Maps/PrisonCellMap.jpg',
    sewers: 'Maps/SewerMap.jpg',
    upper_prison: 'Maps/KoboldCastlePrisonMap.jpg',
  };

  const nodes = [
    { id: 'bed', name: 'Bed', description: 'A filthy straw mattress where you woke up. The rats are gone now.', encounterId: 'giant_rat', connections: ['door', 'bone_pile'], position: [720, 280], mapArea: 'prison_cell' },
    { id: 'door', name: 'The Door', description: 'A heavy iron door. Locked tight.', encounterId: 'locked_door', connections: ['bed'], position: [512, 160], mapArea: 'prison_cell', canRevisit: true },
    { id: 'bone_pile', name: 'Bone Pile', description: 'A pile of old bones in the corner.', encounterId: 'bone_pile', connections: ['bed', 'crack'], position: [300, 720], mapArea: 'prison_cell', unlocks: ['crack'] },
    { id: 'crack', name: 'The Crack', description: 'A narrow crack in the floor.', encounterId: 'crack', connections: ['bone_pile'], position: [180, 580], mapArea: 'prison_cell', isLocked: true, canRevisit: true },
    { id: 'splash_point', name: 'Splash Point', description: 'Where you fell into the foul sewer water.', encounterId: 'splash_point', connections: ['dead_end', 'sewer_junction'], position: [728, 110], mapArea: 'sewers', isLocked: true, unlocks: ['dead_end', 'sewer_junction'] },
    { id: 'dead_end', name: 'Dead End', description: 'A sturdy metal gate blocks the way.', encounterId: 'dead_end', connections: ['splash_point', 'tight_opening'], position: [1050, 250], mapArea: 'sewers', isLocked: true, unlocks: ['tight_opening'], hiddenName: 'Deeper Sewer', hiddenDescription: 'The tunnel slopes upward into darkness.' },
    { id: 'tight_opening', name: 'Tight Opening', description: 'A narrow gap carved through rock by slime acid.', encounterId: 'tight_opening', connections: ['dead_end', 'lost_shrine'], position: [1220, 380], mapArea: 'sewers', isLocked: true, canRevisit: true, hiddenName: 'Deeper Sewer', hiddenDescription: 'The tunnel continues into darkness.' },
    { id: 'lost_shrine', name: 'Lost Shrine', description: 'A forgotten shrine glowing with faint golden light.', encounterId: 'lost_shrine', connections: ['tight_opening'], position: [1320, 220], mapArea: 'sewers', isLocked: true, canRevisit: true, hiddenName: '???', hiddenDescription: 'Something glows faintly beyond the gap.' },
    { id: 'sewer_junction', name: 'Sewer Junction', description: 'A junction where passages branch.', encounterId: 'sewer_junction', connections: ['splash_point', 'deeper_sewer', 'less_deep_sewer'], position: [500, 420], mapArea: 'sewers', isLocked: true, unlocks: ['deeper_sewer', 'less_deep_sewer'], hiddenName: 'Deeper Sewer', hiddenDescription: 'The tunnel descends deeper into darkness.' },
    { id: 'deeper_sewer', name: 'Abandoned Camp', description: 'An old campsite left behind by adventurers.', encounterId: 'abandoned_camp', connections: ['sewer_junction'], position: [728, 420], mapArea: 'sewers', isLocked: true, canRevisit: true, hiddenName: 'Dark Passage', hiddenDescription: 'A passage descending into total darkness.' },
    { id: 'less_deep_sewer', name: 'Upward Passage', description: 'The tunnel slopes upward. Light from above.', encounterId: 'upward_passage', connections: ['sewer_junction', 'kitchen'], position: [200, 420], mapArea: 'sewers', isLocked: true, canRevisit: true, hiddenName: 'Upward Passage', hiddenDescription: 'A passage that seems to lead upward.' },
    { id: 'kitchen', name: 'Kitchen', description: 'A warm kitchen where a reptilian cook works.', encounterId: 'kitchen', connections: ['less_deep_sewer', 'prison_entrance'], position: [180, 350], mapArea: 'upper_prison', isLocked: true, canRevisit: true, hiddenName: '???', hiddenDescription: 'You sense warmth and the smell of cooking from above.' },
    { id: 'prison_entrance', name: 'Prison Entrance', description: 'The main entrance to the prison complex.', encounterId: 'prison_entrance', connections: ['kitchen', 'leave_prison', 'prison_wing'], position: [580, 350], mapArea: 'upper_prison', isLocked: true, canRevisit: true, unlocks: ['leave_prison', 'prison_wing'], hiddenName: 'Passage Beyond', hiddenDescription: 'A corridor leading somewhere beyond the kitchen.' },
    { id: 'leave_prison', name: 'Leave the Prison', description: 'A heavy door leading outside. Daylight through the gap.', encounterId: 'leave_prison', connections: ['prison_entrance'], position: [550, 150], mapArea: 'upper_prison', isLocked: true, canRevisit: true, hiddenName: 'Heavy Door', hiddenDescription: 'A heavy door. It seems important.' },
    { id: 'prison_wing', name: 'Prison Wing', description: 'A corridor lined with prison cells.', encounterId: 'prison_wing', connections: ['prison_entrance', 'corner_cell'], position: [1000, 450], mapArea: 'upper_prison', isLocked: true, canRevisit: true, hiddenName: 'Locked Door', hiddenDescription: 'A locked iron door. You hear sounds from beyond.' },
    { id: 'corner_cell', name: 'Corner Cell', description: 'A cell at the far corner. Someone is fighting inside.', encounterId: 'corner_cell', connections: ['prison_wing'], position: [1100, 220], mapArea: 'upper_prison', isLocked: true, hiddenName: '???', hiddenDescription: 'Something is at the end of the corridor.' },
  ];

  for (const data of nodes) {
    map.addNode(new MapNode(data));
  }
  map.currentNodeId = 'bed';
  return map;
}

// === Mountain Path Map ===
export function createMountainPathMap() {
  const map = new GameMap('mountain_path', 'Mountain Path');
  map.mapImages = {
    mountain_path: 'Maps/Chapter2MountainPathMap.jpg',
  };

  const nodes = [
    { id: 'mountain_camp', name: 'Mountain Camp', description: 'A sheltered campsite on the mountainside.', encounterId: 'mountain_camp', connections: ['mountain_pass'], position: [512, 150], mapArea: 'mountain_path' },
    { id: 'mountain_pass', name: 'Mountain Pass', description: 'A narrow pass through the peaks.', encounterId: 'mountain_pass', connections: ['mountain_camp', 'calm_stream'], position: [780, 200], mapArea: 'mountain_path', isLocked: true },
    { id: 'calm_stream', name: 'Calm Stream', description: 'A peaceful mountain stream.', encounterId: 'calm_stream', connections: ['mountain_pass', 'general_zhost'], position: [700, 310], mapArea: 'mountain_path', isLocked: true },
    { id: 'general_zhost', name: 'River Crossing', description: 'A wide river crossing.', encounterId: 'general_zhost', connections: ['calm_stream', 'calm_grove'], position: [780, 500], mapArea: 'mountain_path', isLocked: true, hiddenName: '???' },
    { id: 'calm_grove', name: 'Calm Grove', description: 'A sheltered grove of ancient trees.', encounterId: 'calm_grove', connections: ['general_zhost', 'to_the_plains'], position: [400, 450], mapArea: 'mountain_path', isLocked: true, canRevisit: true },
    { id: 'to_the_plains', name: 'To the Plains', description: 'The path descends toward the open plains.', encounterId: 'to_the_plains', connections: ['calm_grove'], position: [200, 450], mapArea: 'mountain_path', isLocked: true },
  ];

  for (const data of nodes) {
    map.addNode(new MapNode(data));
  }
  map.currentNodeId = 'mountain_camp';
  return map;
}

// === Plains Map ===
export function createPlainsMap() {
  const map = new GameMap('plains', 'The Plains of No Hope');
  map.mapImages = {
    plains: 'Maps/PlainsOfNoHopeMap.jpg',
  };

  const nodes = [
    { id: 'plains_of_no_hope', name: 'Plains of No Hope', description: 'A desolate expanse stretching to the horizon.', encounterId: '', connections: ['bone_valley'], position: [195, 95], mapArea: 'plains', canRevisit: true },
    { id: 'bone_valley', name: 'Bone Valley', description: 'A valley littered with ancient bones.', encounterId: 'bone_valley', connections: ['plains_of_no_hope', 'wolf_blizzard'], position: [300, 350], mapArea: 'plains', unlocks: ['wolf_blizzard'], hiddenName: '???' },
    { id: 'wolf_blizzard', name: 'Wolf Blizzard', description: 'A blinding blizzard howls through the pass.', encounterId: 'wolf_blizzard', connections: ['bone_valley'], position: [530, 520], mapArea: 'plains', isLocked: true, hiddenName: '???' },
  ];

  for (const data of nodes) {
    map.addNode(new MapNode(data));
  }
  map.currentNodeId = 'plains_of_no_hope';
  return map;
}

// === Cave Map ===
export function createCaveMap() {
  const map = new GameMap('cave', 'The Cave');
  map.mapImages = {
    cave: 'Maps/UndergroundCaveMap.jpg',
  };

  const nodes = [
    { id: 'cave_entrance', name: 'Cave Entrance', description: 'The mouth of a dark underground cave.', encounterId: 'cave_entrance', connections: ['cave_ledge'], position: [750, 920], mapArea: 'cave', canRevisit: true, unlocks: ['cave_ledge'] },
    { id: 'cave_ledge', name: 'Cave Ledge', description: 'A narrow ledge above the cavern floor.', encounterId: 'cave_ledge', connections: ['cave_entrance', 'cave_river_landing'], position: [610, 910], mapArea: 'cave', isLocked: true, unlocks: ['cave_river_landing'], hiddenName: '???' },
    { id: 'cave_river_landing', name: 'Cave River Landing', description: 'A rocky landing beside an underground river.', encounterId: 'cave_river_landing', connections: ['cave_ledge', 'cave_river_path'], position: [490, 800], mapArea: 'cave', isLocked: true, unlocks: ['cave_river_path'], hiddenName: '???' },
    { id: 'cave_river_path', name: 'Cave River Path', description: 'A path along the underground river.', encounterId: 'underground_river', connections: ['cave_river_landing'], position: [270, 580], mapArea: 'cave', isLocked: true, hiddenName: '???' },
  ];

  for (const data of nodes) {
    map.addNode(new MapNode(data));
  }
  map.currentNodeId = 'cave_entrance';
  return map;
}

// === Ruins Basin Map ===
export function createRuinsBasinMap() {
  const map = new GameMap('ruins_basin', 'The Ruins Basin');
  map.mapImages = {
    ruins_basin: 'Maps/EndofRiverBasinStartOfRuins.jpg',
    flood_temple: 'Maps/FloodTemple.jpg',
    flooded_altar: 'Maps/SacredAreaFloodedTemple.jpg',
    temple_exit: 'Maps/TempleTowardTheExit.jpg',
    arriving_city: 'Maps/ArrivingAtTheCity.jpg',
    flood_temple_boss_wing: 'Maps/FloodTempleBossWing.jpg',
    qualibaf: 'Maps/QualibafMap.jpg',
  };

  const nodes = [
    { id: 'piranha_pool', name: 'Piranha Pool', description: 'Dark water churns with hungry fish.', encounterId: 'piranha_pool', connections: ['pool_edge'], position: [512, 500], mapArea: 'ruins_basin' },
    { id: 'pool_edge', name: 'Pool Edge', description: 'The edge of the pool, a sentinel watches.', encounterId: 'sahuagin_sentinel', connections: ['pool_south'], position: [760, 380], mapArea: 'ruins_basin', canRevisit: true },
    { id: 'pool_south', name: 'Pool South', description: 'The southern edge of the basin.', encounterId: 'pool_south', connections: ['pool_edge', 'pool_exit'], position: [798, 686], mapArea: 'ruins_basin', canRevisit: true, unlocks: ['pool_exit'] },
    { id: 'pool_exit', name: 'Pool Exit', description: 'A passage leading out of the basin.', encounterId: 'pool_exit', connections: ['pool_south', 'flooded_entrance'], position: [520, 910], mapArea: 'ruins_basin', isLocked: true, canRevisit: true },
    { id: 'flooded_entrance', name: 'Flooded Entrance', description: 'The entrance to a flooded temple.', encounterId: '', connections: ['pool_exit', 'temple_right', 'temple_left'], position: [512, 120], mapArea: 'flood_temple', canRevisit: true },
    { id: 'temple_right', name: 'Temple Right', description: 'The right wing of the flooded temple.', encounterId: 'conservatory_wing', connections: ['flooded_entrance', 'temple_depths'], position: [902, 492], mapArea: 'flood_temple', canRevisit: true },
    { id: 'temple_depths', name: 'Temple Depths', description: 'Deep within the flooded temple.', encounterId: 'flooded_passage', connections: ['temple_right', 'temple_left', 'passage_entrance'], position: [512, 883], mapArea: 'flood_temple', canRevisit: true },
    { id: 'temple_left', name: 'Temple Left', description: 'The left wing of the flooded temple.', encounterId: 'dark_corridor', connections: ['flooded_entrance', 'temple_depths'], position: [160, 450], mapArea: 'flood_temple', canRevisit: true },
    { id: 'passage_entrance', name: 'Passage Entrance', description: 'The entrance to a passage beyond the temple.', encounterId: '', connections: ['temple_depths', 'passage_ambush'], position: [512, 150], mapArea: 'temple_exit', canRevisit: true },
    { id: 'passage_ambush', name: 'Passage Ambush', description: 'A shadowed gallery.', encounterId: 'passage_ambush', connections: ['passage_entrance', 'cave_exit'], position: [512, 500], mapArea: 'temple_exit', hiddenName: 'Shadowed Gallery' },
    { id: 'cave_exit', name: 'Cave Exit', description: 'A passage leading out.', encounterId: 'cave_exit', connections: ['passage_ambush', 'mountain_overlook'], position: [512, 850], mapArea: 'temple_exit', hiddenName: 'Passage' },
    { id: 'mountain_overlook', name: 'Mountain Overlook', description: 'A vista overlooking the land below.', encounterId: '', connections: ['cave_exit', 'river_crossing'], position: [212, 670], mapArea: 'arriving_city', canRevisit: true },
    { id: 'river_crossing', name: 'River Crossing', description: 'A crossing over the river.', encounterId: 'river_crossing', connections: ['mountain_overlook', 'south_gate'], position: [322, 510], mapArea: 'arriving_city' },
    { id: 'south_gate', name: 'South Gate', description: 'The southern gate of Qualibaf.', encounterId: 'south_gate', connections: ['river_crossing', 'city_south_gate'], position: [662, 260], mapArea: 'arriving_city', canRevisit: true },
    { id: 'city_south_gate', name: 'City South Gate', description: 'Inside the southern gate of Qualibaf.', encounterId: '', connections: ['city_square', 'weaponsmith', 'armorsmith', 'general_store', 'inn', 'church', 'arcane_emporium', 'city_north_gate'], position: [512, 900], mapArea: 'qualibaf', canRevisit: true },
    { id: 'city_square', name: 'City Square', description: 'The central square of Qualibaf.', encounterId: 'city_square', connections: ['city_south_gate', 'weaponsmith', 'armorsmith', 'general_store', 'inn', 'church', 'arcane_emporium', 'city_north_gate'], position: [512, 500], mapArea: 'qualibaf', canRevisit: true },
    { id: 'weaponsmith', name: 'Weaponsmith', description: 'A weaponsmith shop.', encounterId: 'weaponsmith', connections: ['city_south_gate', 'city_square'], position: [340, 390], mapArea: 'qualibaf', canRevisit: true },
    { id: 'armorsmith', name: 'Armorsmith', description: 'An armorsmith shop.', encounterId: 'armorsmith', connections: ['city_south_gate', 'city_square'], position: [324, 470], mapArea: 'qualibaf', canRevisit: true },
    { id: 'general_store', name: 'General Store', description: 'A general goods store.', encounterId: 'general_store', connections: ['city_south_gate', 'city_square'], position: [650, 610], mapArea: 'qualibaf', canRevisit: true },
    { id: 'inn', name: 'Inn', description: 'A cozy inn.', encounterId: 'inn', connections: ['city_south_gate', 'city_square'], position: [684, 430], mapArea: 'qualibaf', canRevisit: true },
    { id: 'church', name: 'Church', description: 'A place of worship.', encounterId: 'church', connections: ['city_south_gate', 'city_square'], position: [820, 350], mapArea: 'qualibaf', canRevisit: true },
    { id: 'arcane_emporium', name: 'Arcane Emporium', description: 'A shop of arcane goods.', encounterId: 'arcane_emporium', connections: ['city_south_gate', 'city_square'], position: [260, 710], mapArea: 'qualibaf', canRevisit: true },
    { id: 'city_north_gate', name: 'City North Gate', description: 'The northern gate of Qualibaf.', encounterId: 'city_north_gate', connections: ['city_south_gate', 'city_square'], position: [512, 100], mapArea: 'qualibaf', isLocked: true, canRevisit: true, hiddenName: '???' },
  ];

  for (const data of nodes) {
    map.addNode(new MapNode(data));
  }
  map.currentNodeId = 'piranha_pool';
  return map;
}

// === North Qualibaf Map ===
export function createNorthQualibafMap() {
  const map = new GameMap('north_qualibaf', 'North of Qualibaf');
  map.mapImages = {
    north_qualibaf: 'Maps/NorthGateQualibafExternalMap.jpg',
  };

  const nodes = [
    { id: 'north_gate_return', name: 'North Gate Return', description: 'Outside the northern gate of Qualibaf.', encounterId: '', connections: ['north_crossroad'], position: [480, 947], mapArea: 'north_qualibaf', canRevisit: true },
    { id: 'north_crossroad', name: 'North Crossroad', description: 'A crossroad north of the city.', encounterId: 'north_crossroad', connections: ['north_gate_return', 'filibaf_entrance'], position: [580, 170], mapArea: 'north_qualibaf', canRevisit: true, unlocks: ['filibaf_entrance'] },
    { id: 'filibaf_entrance', name: 'Filibaf Entrance', description: 'The entrance to Filibaf Forest.', encounterId: 'filibaf_entrance', connections: ['north_crossroad'], position: [825, 160], mapArea: 'north_qualibaf', isLocked: true, canRevisit: true, hiddenName: '???' },
  ];

  for (const data of nodes) {
    map.addNode(new MapNode(data));
  }
  map.currentNodeId = 'north_gate_return';
  return map;
}

// === Filibaf Forest Map ===
export function createFilibafForestMap() {
  const map = new GameMap('filibaf_forest', 'Filibaf Forest');
  map.mapImages = {
    filibaf_forest: 'Maps/FilibafForestMap.jpg',
  };

  const nodes = [
    { id: 'forest_edge', name: 'Forest Edge', description: 'The edge of Filibaf Forest.', encounterId: '', connections: ['forest_shadows'], position: [512, 850], mapArea: 'filibaf_forest', canRevisit: true, unlocks: ['forest_shadows'] },
    { id: 'forest_shadows', name: 'Forest Shadows', description: 'Deep shadows among the trees.', encounterId: 'forest_shadows', connections: ['forest_edge', 'forest_ambush_left', 'forest_ambush_right'], position: [512, 600], mapArea: 'filibaf_forest', isLocked: true, unlocks: ['forest_ambush_left', 'forest_ambush_right'], hiddenName: '???' },
    { id: 'forest_ambush_left', name: 'Forest Ambush Left', description: 'A narrow path to the left.', encounterId: 'forest_ambush_left', connections: ['forest_shadows', 'forest_return_left'], position: [300, 400], mapArea: 'filibaf_forest', isLocked: true, unlocks: ['forest_return_left'], hiddenName: '???' },
    { id: 'forest_ambush_right', name: 'Forest Ambush Right', description: 'A narrow path to the right.', encounterId: 'forest_ambush_right', connections: ['forest_shadows', 'forest_return_right'], position: [700, 400], mapArea: 'filibaf_forest', isLocked: true, unlocks: ['forest_return_right'], hiddenName: '???' },
    { id: 'forest_return_left', name: 'Forest Return Left', description: 'A clearing on the left path.', encounterId: '', connections: ['forest_ambush_left'], position: [250, 150], mapArea: 'filibaf_forest', isLocked: true, hiddenName: '???' },
    { id: 'forest_return_right', name: 'Forest Return Right', description: 'A clearing on the right path.', encounterId: '', connections: ['forest_ambush_right'], position: [750, 150], mapArea: 'filibaf_forest', isLocked: true, hiddenName: '???' },
  ];

  for (const data of nodes) {
    map.addNode(new MapNode(data));
  }
  map.currentNodeId = 'forest_edge';
  return map;
}

// === Tharnag Map ===
export function createTharnagMap() {
  const map = new GameMap('tharnag', 'Tharnag');
  map.mapImages = {
    tharnag: 'Maps/TharnagMap.jpg',
  };

  const nodes = [
    { id: 'tharnag_entry', name: 'Tharnag Entry', description: 'The approach to Tharnag.', encounterId: 'tharnag_arrival', connections: ['siege_gauntlet_1'], position: [930, 940], mapArea: 'tharnag', canRevisit: true },
    { id: 'siege_gauntlet_1', name: 'Siege Gauntlet 1', description: 'The first siege line.', encounterId: 'siege_gauntlet_1', connections: ['tharnag_entry', 'siege_gauntlet_2'], position: [550, 780], mapArea: 'tharnag', isLocked: true, unlocks: ['siege_gauntlet_2'], hiddenName: 'Siege Line' },
    { id: 'siege_gauntlet_2', name: 'Siege Gauntlet 2', description: 'The second siege line.', encounterId: 'siege_gauntlet_2', connections: ['siege_gauntlet_1', 'siege_gauntlet_3'], position: [440, 700], mapArea: 'tharnag', isLocked: true, unlocks: ['siege_gauntlet_3'], hiddenName: 'Siege Line' },
    { id: 'siege_gauntlet_3', name: 'Siege Gauntlet 3', description: 'The third siege line.', encounterId: 'siege_gauntlet_3', connections: ['siege_gauntlet_2', 'siege_gauntlet_dialog'], position: [450, 570], mapArea: 'tharnag', isLocked: true, unlocks: ['siege_gauntlet_dialog'], hiddenName: 'Siege Line' },
    { id: 'siege_gauntlet_dialog', name: 'Siege Gauntlet Dialog', description: 'Beyond the siege lines.', encounterId: 'siege_gauntlet_dialog', connections: ['siege_gauntlet_3', 'tharnag_side_door'], position: [640, 580], mapArea: 'tharnag', isLocked: true, unlocks: ['tharnag_side_door'], hiddenName: '???' },
    { id: 'tharnag_side_door', name: 'Tharnag Side Door', description: 'A side entrance to Tharnag.', encounterId: 'tharnag_side_door', connections: ['siege_gauntlet_dialog'], position: [790, 450], mapArea: 'tharnag', isLocked: true, canRevisit: true, hiddenName: '???' },
  ];

  for (const data of nodes) {
    map.addNode(new MapNode(data));
  }
  map.currentNodeId = 'tharnag_entry';
  return map;
}

// === Volcano Map ===
export function createVolcanoMap() {
  const map = new GameMap('volcano', 'Qualibaf Volcano');
  map.mapImages = {
    volcano: 'Maps/QualibafVolcano.jpg',
  };

  const nodes = [
    { id: 'volcano_approach', name: 'Volcano Approach', description: 'The approach to the volcano.', encounterId: 'volcano_arrival', connections: ['volcano_east_path'], position: [642, 940], mapArea: 'volcano', canRevisit: true, unlocks: ['volcano_east_path'] },
    { id: 'volcano_east_path', name: 'Volcano East Path', description: 'A path along the eastern slope.', encounterId: '', connections: ['volcano_approach', 'volcano_lava_crossing'], position: [750, 790], mapArea: 'volcano', isLocked: true, canRevisit: true, hiddenName: '???' },
    { id: 'volcano_lava_crossing', name: 'Volcano Lava Crossing', description: 'A crossing over a lava flow.', encounterId: '', connections: ['volcano_east_path', 'volcano_base'], position: [800, 630], mapArea: 'volcano', isLocked: true, canRevisit: true, hiddenName: '???' },
    { id: 'volcano_base', name: 'Volcano Base', description: 'The base of the volcano crater.', encounterId: 'volcano_choice', connections: ['volcano_lava_crossing'], position: [770, 540], mapArea: 'volcano', isLocked: true, hiddenName: '???' },
  ];

  for (const data of nodes) {
    map.addNode(new MapNode(data));
  }
  map.currentNodeId = 'volcano_approach';
  return map;
}

// === Obsidian Wastes Map ===
export function createObsidianWastesMap() {
  const map = new GameMap('obsidian_wastes', 'Obsidian Wastes');
  map.mapImages = {
    obsidian_wastes: 'Maps/ObsidianWastesMap.jpg',
  };

  const nodes = [
    { id: 'wastes_entry', name: 'Wastes Entry', description: 'The edge of the obsidian wastes.', encounterId: 'obsidian_wastes_arrival', connections: ['wastes_north'], position: [500, 950], mapArea: 'obsidian_wastes', canRevisit: true },
    { id: 'wastes_north', name: 'Wastes North', description: 'Deeper into the obsidian wastes.', encounterId: 'wastes_north', connections: ['wastes_entry'], position: [410, 220], mapArea: 'obsidian_wastes', isLocked: true, canRevisit: true, hiddenName: '???' },
  ];

  for (const data of nodes) {
    map.addNode(new MapNode(data));
  }
  map.currentNodeId = 'wastes_entry';
  return map;
}

// === Tharnag Interior Map ===
export function createTharnagInteriorMap() {
  const map = new GameMap('tharnag_interior', 'Tharnag Interior');
  map.mapImages = {
    grand_hall: 'Maps/TharnagGrandHall.jpg',
    artisan_hall: 'Maps/ArtisanHallMap.jpg',
  };

  const nodes = [
    { id: 'grand_hall_side_entry', name: 'Grand Hall Side Entry', description: 'A side entrance to the grand hall.', encounterId: 'grand_hall_arrival', connections: ['grand_hall_lower_stairs'], position: [940, 620], mapArea: 'grand_hall', canRevisit: true },
    { id: 'grand_hall_lower_stairs', name: 'Grand Hall Lower Stairs', description: 'Stairs descending from the grand hall.', encounterId: '', connections: ['grand_hall_side_entry', 'artisan_hall'], position: [580, 660], mapArea: 'grand_hall', canRevisit: true },
    { id: 'artisan_hall', name: 'Artisan Hall', description: 'A hall of dwarven artisans.', encounterId: '', connections: ['grand_hall_lower_stairs', 'dwarven_tavern', 'dwarven_smithy'], position: [770, 870], mapArea: 'artisan_hall', canRevisit: true },
    { id: 'dwarven_tavern', name: 'Dwarven Tavern', description: 'A bustling dwarven tavern.', encounterId: 'dwarven_tavern', connections: ['artisan_hall', 'dwarven_smithy'], position: [400, 500], mapArea: 'artisan_hall', canRevisit: true },
    { id: 'dwarven_smithy', name: 'Dwarven Smithy', description: 'A dwarven smithy.', encounterId: 'dwarven_smithy', connections: ['artisan_hall', 'dwarven_tavern'], position: [400, 800], mapArea: 'artisan_hall', canRevisit: true },
  ];

  for (const data of nodes) {
    map.addNode(new MapNode(data));
  }
  map.currentNodeId = 'grand_hall_side_entry';
  return map;
}

// === Entry Corridor Map ===
export function createEntryCorridorMap() {
  const map = new GameMap('entry_corridor', 'Entry Corridor');
  map.mapImages = {
    entry_corridor: 'Maps/DwarvenCityEntryCorridorMap.jpg',
  };

  const nodes = [
    { id: 'corridor_entrance', name: 'Corridor Entrance', description: 'The entrance to the dwarven city corridor.', encounterId: 'entry_corridor_arrival', connections: ['corridor_ruins'], position: [720, 720], mapArea: 'entry_corridor', canRevisit: true, unlocks: ['corridor_ruins'] },
    { id: 'corridor_ruins', name: 'Corridor Ruins', description: 'Crumbling ruins along the corridor.', encounterId: '', connections: ['corridor_entrance', 'corridor_gate_approach'], position: [650, 500], mapArea: 'entry_corridor', isLocked: true, canRevisit: true, unlocks: ['corridor_gate_approach'] },
    { id: 'corridor_gate_approach', name: 'Corridor Gate Approach', description: 'Approaching the corridor gate.', encounterId: 'corridor_gate_approach', connections: ['corridor_ruins'], position: [590, 360], mapArea: 'entry_corridor', isLocked: true, canRevisit: true, hiddenName: '???' },
  ];

  for (const data of nodes) {
    map.addNode(new MapNode(data));
  }
  map.currentNodeId = 'corridor_entrance';
  return map;
}

// === Gate Area Map ===
export function createGateAreaMap() {
  const map = new GameMap('gate_area', 'Gate Area');
  map.mapImages = {
    gate_area: 'Maps/DwarvenCityGateArea.jpg',
  };

  const nodes = [
    { id: 'gate_back_to_corridor', name: 'Gate Back to Corridor', description: 'The path back to the entry corridor.', encounterId: '', connections: ['gate_entrance'], position: [610, 750], mapArea: 'gate_area', canRevisit: true },
    { id: 'gate_entrance', name: 'Gate Entrance', description: 'The main gate entrance.', encounterId: '', connections: ['gate_back_to_corridor', 'gate_guardroom', 'gate_passage'], position: [880, 660], mapArea: 'gate_area', canRevisit: true, unlocks: ['gate_guardroom', 'gate_passage'] },
    { id: 'gate_guardroom', name: 'Gate Guardroom', description: 'A guardroom beside the gate.', encounterId: 'gate_guardroom', connections: ['gate_entrance'], position: [780, 550], mapArea: 'gate_area', isLocked: true, canRevisit: true, hiddenName: '???' },
    { id: 'gate_passage', name: 'Gate Passage', description: 'A passage through the gate.', encounterId: 'gate_passage', connections: ['gate_entrance'], position: [1000, 560], mapArea: 'gate_area', isLocked: true, canRevisit: true, hiddenName: '???' },
  ];

  for (const data of nodes) {
    map.addNode(new MapNode(data));
  }
  map.currentNodeId = 'gate_back_to_corridor';
  return map;
}

// === Hall of Ancestors Map ===
export function createHallOfAncestorsMap() {
  const map = new GameMap('hall_of_ancestors', 'Hall of Ancestors');
  map.mapImages = {
    hall_of_ancestors: 'Maps/DwarvenCityHallofAncestors.jpg',
  };

  const nodes = [
    { id: 'ancestors_entry', name: 'Ancestors Entry', description: 'The entry to the Hall of Ancestors.', encounterId: '', connections: ['ancestors_sky_shaft'], position: [606, 760], mapArea: 'hall_of_ancestors', canRevisit: true, unlocks: ['ancestors_sky_shaft'] },
    { id: 'ancestors_sky_shaft', name: 'Ancestors Sky Shaft', description: 'A shaft of light from above.', encounterId: 'ruga_slave_master', connections: ['ancestors_entry', 'ancestors_monument_alley', 'ancestors_artisan_district'], position: [740, 680], mapArea: 'hall_of_ancestors', isLocked: true, canRevisit: true, unlocks: ['ancestors_monument_alley', 'ancestors_artisan_district'] },
    { id: 'ancestors_monument_alley', name: 'Ancestors Monument Alley', description: 'An alley lined with monuments.', encounterId: '', connections: ['ancestors_sky_shaft'], position: [150, 620], mapArea: 'hall_of_ancestors', isLocked: true, canRevisit: true },
    { id: 'ancestors_artisan_district', name: 'Ancestors Artisan District', description: 'The artisan district entrance.', encounterId: '', connections: ['ancestors_sky_shaft'], position: [1250, 620], mapArea: 'hall_of_ancestors', isLocked: true, canRevisit: true },
  ];

  for (const data of nodes) {
    map.addNode(new MapNode(data));
  }
  map.currentNodeId = 'ancestors_entry';
  return map;
}

// === Monument Alley Map ===
export function createMonumentAlleyMap() {
  const map = new GameMap('monument_alley', 'Monument Alley');
  map.mapImages = {
    monument_alley: 'Maps/DwarvenCityMonumentAlley.jpg',
  };

  const nodes = [
    { id: 'monument_entry', name: 'Monument Entry', description: 'The entry to Monument Alley.', encounterId: 'monument_alley_entry', connections: ['monument_south_hub'], position: [720, 750], mapArea: 'monument_alley', canRevisit: true, unlocks: ['monument_south_hub'] },
    { id: 'monument_south_hub', name: 'Monument South Hub', description: 'A hub in the southern part of the alley.', encounterId: '', connections: ['monument_entry', 'monument_left_far', 'monument_right_far'], position: [720, 650], mapArea: 'monument_alley', isLocked: true, canRevisit: true, unlocks: ['monument_left_far', 'monument_right_far'] },
    { id: 'monument_left_far', name: 'Monument Left Far', description: 'The far left of the alley.', encounterId: '', connections: ['monument_south_hub', 'monument_north_hub'], position: [440, 440], mapArea: 'monument_alley', isLocked: true, canRevisit: true, unlocks: ['monument_north_hub'] },
    { id: 'monument_right_far', name: 'Monument Right Far', description: 'The far right of the alley.', encounterId: '', connections: ['monument_south_hub', 'monument_north_hub'], position: [1000, 440], mapArea: 'monument_alley', isLocked: true, canRevisit: true },
    { id: 'monument_north_hub', name: 'Monument North Hub', description: 'A hub in the northern part of the alley.', encounterId: '', connections: ['monument_left_far', 'monument_right_far', 'monument_tomb'], position: [720, 280], mapArea: 'monument_alley', isLocked: true, canRevisit: true, unlocks: ['monument_tomb'] },
    { id: 'monument_tomb', name: 'Monument Tomb', description: 'A tomb at the end of the alley.', encounterId: '', connections: ['monument_north_hub'], position: [720, 190], mapArea: 'monument_alley', isLocked: true, canRevisit: true },
  ];

  for (const data of nodes) {
    map.addNode(new MapNode(data));
  }
  map.currentNodeId = 'monument_entry';
  return map;
}

// === Tomb of Ancestor Map ===
export function createTombOfAncestorMap() {
  const map = new GameMap('tomb_of_ancestor', 'Tomb of the Ancestor');
  map.mapImages = {
    tomb_of_ancestor: 'Maps/DwarvenCityTombOfAncestor.jpg',
  };

  const nodes = [
    { id: 'tomb_entry', name: 'Tomb Entry', description: 'The entry to the ancestor tomb.', encounterId: 'tomb_of_ancestor_entry', connections: ['tomb_sarcophagus'], position: [680, 740], mapArea: 'tomb_of_ancestor', canRevisit: true, unlocks: ['tomb_sarcophagus'] },
    { id: 'tomb_sarcophagus', name: 'Tomb Sarcophagus', description: 'The ancient sarcophagus.', encounterId: 'tomb_sarcophagus', connections: ['tomb_entry'], position: [677, 570], mapArea: 'tomb_of_ancestor', isLocked: true, canRevisit: true },
  ];

  for (const data of nodes) {
    map.addNode(new MapNode(data));
  }
  map.currentNodeId = 'tomb_entry';
  return map;
}

// === Grand Stairs Map ===
export function createGrandStairsMap() {
  const map = new GameMap('grand_stairs', 'Grand Stairs');
  map.mapImages = {
    grand_stairs: 'Maps/DwarvenCityGrandStairs.jpg',
  };

  const nodes = [
    { id: 'stairs_entry', name: 'Stairs Entry', description: 'The base of the grand stairs.', encounterId: 'grand_stairs_entry', connections: ['stairs_lower'], position: [400, 720], mapArea: 'grand_stairs', canRevisit: true, unlocks: ['stairs_lower'] },
    { id: 'stairs_lower', name: 'Stairs Lower', description: 'The lower section of the stairs.', encounterId: '', connections: ['stairs_entry', 'stairs_upper'], position: [760, 540], mapArea: 'grand_stairs', isLocked: true, canRevisit: true, unlocks: ['stairs_upper'] },
    { id: 'stairs_upper', name: 'Stairs Upper', description: 'The upper section of the stairs.', encounterId: '', connections: ['stairs_lower', 'stairs_to_throne'], position: [970, 400], mapArea: 'grand_stairs', isLocked: true, canRevisit: true, unlocks: ['stairs_to_throne'] },
    { id: 'stairs_to_throne', name: 'Stairs to Throne', description: 'The stairs leading to the throne room.', encounterId: '', connections: ['stairs_upper'], position: [1130, 280], mapArea: 'grand_stairs', isLocked: true, canRevisit: true },
  ];

  for (const data of nodes) {
    map.addNode(new MapNode(data));
  }
  map.currentNodeId = 'stairs_entry';
  return map;
}

// === Dwarven Throne Room Map ===
export function createDwarvenThroneRoomMap() {
  const map = new GameMap('dwarven_throne_room', 'Dwarven Throne Room');
  map.mapImages = {
    dwarven_throne_room: 'Maps/DwarvenCityThroneRoom.jpg',
  };

  const nodes = [
    { id: 'throne_entry', name: 'Throne Entry', description: 'The entry to the throne room.', encounterId: 'dwarven_throne_room_entry', connections: ['throne_dais'], position: [720, 720], mapArea: 'dwarven_throne_room', canRevisit: true, unlocks: ['throne_dais'] },
    { id: 'throne_dais', name: 'Throne Dais', description: 'The raised dais of the throne.', encounterId: 'throne_specter', connections: ['throne_entry', 'throne_to_map_room'], position: [750, 550], mapArea: 'dwarven_throne_room', isLocked: true, canRevisit: true, unlocks: ['throne_to_map_room'] },
    { id: 'throne_to_map_room', name: 'Throne to Map Room', description: 'A passage to the map room.', encounterId: '', connections: ['throne_dais'], position: [600, 470], mapArea: 'dwarven_throne_room', isLocked: true, canRevisit: true },
  ];

  for (const data of nodes) {
    map.addNode(new MapNode(data));
  }
  map.currentNodeId = 'throne_entry';
  return map;
}

// === Map Room Map ===
export function createMapRoomMap() {
  const map = new GameMap('map_room', 'Map Room');
  map.mapImages = {
    map_room: 'Maps/DwarvenCityMapRoom.jpg',
  };

  const nodes = [
    { id: 'map_room_entry', name: 'Map Room Entry', description: 'The entry to the map room.', encounterId: 'map_room_entry', connections: ['map_table'], position: [500, 700], mapArea: 'map_room', canRevisit: true, unlocks: ['map_table'] },
    { id: 'map_table', name: 'Map Table', description: 'A large table with maps spread across it.', encounterId: 'map_table', connections: ['map_room_entry'], position: [720, 450], mapArea: 'map_room', isLocked: true, canRevisit: true },
  ];

  for (const data of nodes) {
    map.addNode(new MapNode(data));
  }
  map.currentNodeId = 'map_room_entry';
  return map;
}

// === Deeper Tunnels Map ===
export function createDeeperTunnelsMap() {
  const map = new GameMap('deeper_tunnels', 'Deeper Tunnels');
  map.mapImages = {
    deeper_tunnels: 'Maps/DwarvenCityDeeperTunnels.jpg',
  };

  const nodes = [
    { id: 'tunnels_entry', name: 'Tunnels Entry', description: 'The entry to the deeper tunnels.', encounterId: 'deeper_tunnels_entry', connections: ['tunnels_mid'], position: [760, 700], mapArea: 'deeper_tunnels', canRevisit: true, unlocks: ['tunnels_mid'] },
    { id: 'tunnels_mid', name: 'Tunnels Mid', description: 'The middle of the deeper tunnels.', encounterId: '', connections: ['tunnels_entry', 'tunnels_exit'], position: [750, 570], mapArea: 'deeper_tunnels', isLocked: true, canRevisit: true, unlocks: ['tunnels_exit'] },
    { id: 'tunnels_exit', name: 'Tunnels Exit', description: 'The exit of the deeper tunnels.', encounterId: '', connections: ['tunnels_mid'], position: [760, 360], mapArea: 'deeper_tunnels', isLocked: true, canRevisit: true },
  ];

  for (const data of nodes) {
    map.addNode(new MapNode(data));
  }
  map.currentNodeId = 'tunnels_entry';
  return map;
}

// === Artisan District Map ===
export function createArtisanDistrictMap() {
  const map = new GameMap('artisan_district', 'Artisan District');
  map.mapImages = {
    artisan_district: 'Maps/DwarvenCityArtisanDistrict.jpg',
  };

  const nodes = [
    { id: 'artisan_entry', name: 'Artisan Entry', description: 'The entry to the artisan district.', encounterId: 'artisan_district_entry', connections: ['artisan_lower'], position: [1340, 760], mapArea: 'artisan_district', canRevisit: true, unlocks: ['artisan_lower'] },
    { id: 'artisan_lower', name: 'Artisan Lower', description: 'The lower artisan district.', encounterId: '', connections: ['artisan_entry', 'artisan_upper'], position: [1020, 640], mapArea: 'artisan_district', isLocked: true, canRevisit: true, unlocks: ['artisan_upper'] },
    { id: 'artisan_upper', name: 'Artisan Upper', description: 'The upper artisan district.', encounterId: '', connections: ['artisan_lower', 'artisan_workshop'], position: [330, 410], mapArea: 'artisan_district', isLocked: true, canRevisit: true, unlocks: ['artisan_workshop'] },
    { id: 'artisan_workshop', name: 'Artisan Workshop', description: 'A dwarven artisan workshop.', encounterId: 'artisan_workshop', connections: ['artisan_upper'], position: [580, 200], mapArea: 'artisan_district', isLocked: true, canRevisit: true },
  ];

  for (const data of nodes) {
    map.addNode(new MapNode(data));
  }
  map.currentNodeId = 'artisan_entry';
  return map;
}
