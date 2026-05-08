/**
 * Map system - nodes connected by paths, each with encounters.
 */

export class MapNode {
  constructor({
    id, name, description, encounterId = '',
    connections = [], position = [0, 0], mapArea = '',
    isLocked = false, canRevisit = false, unlocks = [],
    hiddenName = '', hiddenDescription = '',
    passthroughTo = '', repeatableUntil = '',
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
    // When the node is done and clicked, auto-move to this node id instead
    // of retriggering the encounter (e.g. the kitchen shunts back to the
    // sewer passage once you've resolved it).
    this.passthroughTo = passthroughTo;
    // When set, the encounter repeats while canRevisit is true UNTIL the
    // node id named here is isDone — at that point this node stops
    // refiring its encounter (e.g. Sentinel Patrol stops once the Baron
    // is killed). Combined with canRevisit:true.
    this.repeatableUntil = repeatableUntil;
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
    // Upward Passage: dialog only fires the first time. After that, the node
    // is a silent move-through and `passthroughTo: 'kitchen'` means clicking
    // it while already standing on it shortcuts straight up to the Kitchen.
    { id: 'less_deep_sewer', name: 'Upward Passage', description: 'The tunnel slopes upward. Light from above.', encounterId: 'upward_passage', connections: ['sewer_junction', 'kitchen'], position: [200, 420], mapArea: 'sewers', isLocked: true, canRevisit: false, passthroughTo: 'kitchen', hiddenName: 'Upward Passage', hiddenDescription: 'A passage that seems to lead upward.' },
    // Kitchen: one-shot encounter. Once the player has made their choice
    // (attack / talk / sneak), the node is "done" but still clickable — it
    // auto-routes the player back down to the sewer via `passthroughTo`.
    { id: 'kitchen', name: 'Kitchen', description: 'A warm kitchen where a reptilian cook works.', encounterId: 'kitchen', connections: ['less_deep_sewer', 'prison_entrance'], position: [180, 350], mapArea: 'upper_prison', isLocked: true, canRevisit: false, passthroughTo: 'less_deep_sewer', hiddenName: '???', hiddenDescription: 'You sense warmth and the smell of cooking from above.' },
    // Prison Entrance: one-shot (no revisit) — the warden is defeated once.
    { id: 'prison_entrance', name: 'Prison Entrance', description: 'The main entrance to the prison complex.', encounterId: 'prison_entrance', connections: ['kitchen', 'leave_prison', 'prison_wing'], position: [580, 350], mapArea: 'upper_prison', isLocked: true, canRevisit: false, unlocks: ['leave_prison', 'prison_wing'], hiddenName: 'Passage Beyond', hiddenDescription: 'A corridor leading somewhere beyond the kitchen.' },
    { id: 'leave_prison', name: 'Leave the Prison', description: 'A heavy door leading outside. Daylight through the gap.', encounterId: 'leave_prison', connections: ['prison_entrance'], position: [550, 150], mapArea: 'upper_prison', isLocked: true, canRevisit: true, hiddenName: 'Heavy Door', hiddenDescription: 'A heavy door. It seems important.' },
    // Prison Wing: one-shot — the investigate choice unlocks corner_cell and
    // the node is done. Clicking it again moves silently.
    { id: 'prison_wing', name: 'Prison Wing', description: 'A corridor lined with prison cells.', encounterId: 'prison_wing', connections: ['prison_entrance', 'corner_cell'], position: [1000, 450], mapArea: 'upper_prison', isLocked: true, canRevisit: false, hiddenName: 'Locked Door', hiddenDescription: 'A locked iron door. You hear sounds from beyond.' },
    // Corner Cell: one-shot — fight the Dire Rat, get Thorb card. Once done
    // it's just a silent node; leave_prison reads `corner_cell.isDone` as the
    // thorb-rescued flag.
    { id: 'corner_cell', name: 'Corner Cell', description: 'A cell at the far corner. Someone is fighting inside.', encounterId: 'corner_cell', connections: ['prison_wing'], position: [1100, 220], mapArea: 'upper_prison', isLocked: true, canRevisit: false, hiddenName: '???', hiddenDescription: 'Something is at the end of the corridor.' },
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
    { id: 'mountain_camp', name: 'Mountain Camp', description: 'A sheltered campsite on the mountainside.', encounterId: 'mountain_camp', connections: ['mountain_pass'], position: [512, 150], mapArea: 'mountain_path', unlocks: ['mountain_pass'] },
    { id: 'mountain_pass', name: 'Mountain Pass', description: 'A narrow pass through the peaks.', encounterId: 'mountain_pass', connections: ['mountain_camp', 'calm_stream'], unlocks: ['calm_stream'], position: [780, 200], mapArea: 'mountain_path', isLocked: true, hiddenName: '???', hiddenDescription: 'A path deeper into the mountains.' },
    { id: 'calm_stream', name: 'Calm Stream', description: 'A peaceful mountain stream.', encounterId: 'calm_stream', connections: ['mountain_pass', 'general_zhost'], unlocks: ['general_zhost'], position: [700, 310], mapArea: 'mountain_path', isLocked: true, canRevisit: true, hiddenName: '???', hiddenDescription: 'Something lies further down the mountain path.' },
    { id: 'general_zhost', name: "General Zhost's Army", description: 'A Kobold army camps near the river crossing.', encounterId: 'general_zhost', connections: ['calm_stream', 'calm_grove'], unlocks: ['calm_grove'], position: [780, 500], mapArea: 'mountain_path', isLocked: true, hiddenName: '???', hiddenDescription: 'A wide river crossing, somewhere ahead.' },
    { id: 'calm_grove', name: 'Calm Grove', description: 'A hidden grove where Raena and the surviving elves rest.', encounterId: 'calm_grove', connections: ['general_zhost', 'to_the_plains'], unlocks: ['to_the_plains'], position: [400, 450], mapArea: 'mountain_path', isLocked: true, canRevisit: true, hiddenName: '???', hiddenDescription: 'Dense forest to the west.' },
    { id: 'to_the_plains', name: 'To the Plains', description: 'The edge of the forest, overlooking the Plains of No Hope.', encounterId: 'to_the_plains', connections: ['calm_grove'], position: [200, 450], mapArea: 'mountain_path', isLocked: true, hiddenName: '???', hiddenDescription: 'The forest thins to the southwest.' },
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
    { id: 'cave_entrance', name: 'Cave Entrance', description: 'The mouth of a dark underground cave.', encounterId: 'cave_entrance', connections: ['cave_ledge'], position: [750, 920], mapArea: 'cave', unlocks: ['cave_ledge'] },
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
    { id: 'pool_edge', name: 'Pool Edge', description: 'The edge of the pool, a sentinel watches.', encounterId: 'sahuagin_sentinel', connections: ['pool_south'], position: [760, 380], mapArea: 'ruins_basin' },
    { id: 'pool_south', name: 'Pool South', description: 'The southern edge of the basin.', encounterId: 'pool_south', connections: ['pool_edge', 'pool_exit'], position: [798, 686], mapArea: 'ruins_basin', unlocks: ['pool_exit'] },
    { id: 'pool_exit', name: "Pool's Exit", description: 'A patrolling sentinel blocks the corridor.', encounterId: 'pool_exit', connections: ['pool_south', 'flooded_entrance'], position: [520, 910], mapArea: 'ruins_basin', isLocked: true, unlocks: ['flooded_entrance'], passthroughTo: 'flooded_entrance' },
    { id: 'flooded_entrance', name: 'Flooded Entrance', description: 'The entrance to a flooded temple.', encounterId: '', connections: ['pool_exit', 'temple_right', 'temple_left', 'flooded_atrium'], position: [512, 120], mapArea: 'flood_temple', canRevisit: true, passthroughTo: 'pool_exit' },
    { id: 'temple_right', name: 'Conservatory Wing', description: 'A well-conserved area of the temple. Some light shows through cracks in the ceiling.', encounterId: 'conservatory_wing', connections: ['flooded_entrance', 'temple_depths', 'altar_entrance', 'flooded_atrium'], position: [902, 492], mapArea: 'flood_temple', passthroughTo: 'altar_entrance', unlocks: ['altar_entrance'] },
    // Atrium: new mid-room node not in the PY map. A direct link from
    // the flooded entrance straight down to the temple depths so the
    // player has a center-line path in addition to the flanks. Also
    // bridges the two side-wings (Conservatory + Dark Corridor) so
    // players can cut across the room without backtracking.
    { id: 'flooded_atrium', name: 'Flooded Atrium', description: 'A vast central chamber, half-submerged.', encounterId: '', connections: ['flooded_entrance', 'temple_depths', 'temple_left', 'temple_right'], position: [512, 500], mapArea: 'flood_temple', canRevisit: true },
    { id: 'temple_depths', name: 'Flooded Passage', description: 'Deep within the flooded temple.', encounterId: 'flooded_passage', connections: ['temple_right', 'temple_left', 'passage_entrance', 'flooded_atrium'], position: [512, 883], mapArea: 'flood_temple', passthroughTo: 'passage_entrance' },
    { id: 'temple_left', name: 'Dark Corridor', description: 'A wide corridor that leads deeper into the temple. This area looks dangerous.', encounterId: 'dark_corridor', connections: ['flooded_entrance', 'temple_depths', 'boss_wing_sentinel', 'flooded_atrium'], position: [160, 450], mapArea: 'flood_temple', passthroughTo: 'boss_wing_sentinel' },
    // --- Flood Temple Boss Wing (revealed by Dark Corridor descend) ---
    // Mirrors PY: same map, separate map_area. PY has three nodes
    // (sentinel sighting / sentinel combat / priest combat); JS port
    // wires the sighting node here and stubs the deeper rooms as
    // simple passages until the dedicated combats land.
    // Deeper Corridor — no encounter; the dark_corridor descend
    // teleports here directly. Acts as a bidirectional teleport
    // pair with temple_left thereafter. Reaching it unlocks the
    // Sentinel Patrol so the player can press deeper.
    { id: 'boss_wing_sentinel', name: 'Deeper Corridor', description: 'A flooded corridor descending into the dark wing of the temple.', encounterId: '', connections: ['boss_wing_entrance', 'temple_left'], unlocks: ['boss_wing_entrance'], position: [502, 960], mapArea: 'flood_temple_boss_wing', isLocked: true, canRevisit: true, passthroughTo: 'temple_left' },
    { id: 'boss_wing_entrance', name: 'Sentinel Patrol', description: 'A Sahuagin sentinel blocks the way deeper into the temple wing.', encounterId: 'boss_wing_sentinel_combat', connections: ['boss_wing_sentinel', 'boss_wing_priest'], unlocks: ['boss_wing_priest'], position: [312, 720], mapArea: 'flood_temple_boss_wing', isLocked: true, hiddenName: 'Deeper Corridor', canRevisit: true, repeatableUntil: 'boss_wing_priest' },
    { id: 'boss_wing_priest', name: 'Flooded Chamber', description: 'A grand chamber at the heart of the temple wing. Dark power radiates from within.', encounterId: 'boss_wing_priest_combat', connections: ['boss_wing_entrance'], position: [502, 310], mapArea: 'flood_temple_boss_wing', isLocked: true, hiddenName: '???' },
    // --- Flooded Altar (revealed via Conservatory Wing) ---
    { id: 'altar_entrance', name: 'Sacred Chamber', description: 'A vast chamber. The air is thick with brine and decay.', encounterId: '', connections: ['temple_right', 'flooded_altar'], unlocks: ['flooded_altar'], position: [200, 500], mapArea: 'flooded_altar', isLocked: true, canRevisit: true, passthroughTo: 'temple_right' },
    { id: 'flooded_altar', name: 'Flooded Altar', description: 'A sacred area within the temple. Dark shapes move beneath the water.', encounterId: 'flooded_altar', connections: ['altar_entrance', 'old_god_statue'], unlocks: ['old_god_statue'], position: [750, 500], mapArea: 'flooded_altar', isLocked: true },
    { id: 'old_god_statue', name: 'Statue of an Old God', description: 'An ancient statue stands half-submerged, its hands outstretched.', encounterId: 'old_god_statue', connections: ['flooded_altar'], position: [890, 512], mapArea: 'flooded_altar', isLocked: true, canRevisit: true },
    { id: 'passage_entrance', name: 'Passage Entrance', description: 'The entrance to a passage beyond the temple.', encounterId: '', connections: ['temple_depths', 'passage_ambush'], position: [512, 150], mapArea: 'temple_exit', canRevisit: true, passthroughTo: 'temple_depths' },
    { id: 'passage_ambush', name: 'Passage Ambush', description: 'A shadowed gallery.', encounterId: 'passage_ambush', connections: ['passage_entrance', 'cave_exit'], position: [512, 500], mapArea: 'temple_exit', hiddenName: 'Shadowed Gallery' },
    // Cave Exit is a one-shot narrative beat that ends with the
    // party stepping out onto the mountain overlook (different
    // map_area). passthroughTo makes a click after first completion
    // auto-route to the overlook so the player doesn't have to
    // manually click out of the cave.
    { id: 'cave_exit', name: 'Cave Exit', description: 'A passage leading out.', encounterId: 'cave_exit', connections: ['passage_ambush', 'mountain_overlook'], position: [512, 850], mapArea: 'temple_exit', hiddenName: 'Passage', passthroughTo: 'mountain_overlook' },
    { id: 'mountain_overlook', name: 'Mountain Overlook', description: 'A vista overlooking the land below.', encounterId: '', connections: ['cave_exit', 'river_crossing'], position: [212, 670], mapArea: 'arriving_city', canRevisit: true, passthroughTo: 'cave_exit' },
    { id: 'river_crossing', name: 'River Crossing', description: 'A crossing over the river.', encounterId: 'river_crossing', connections: ['mountain_overlook', 'south_gate'], position: [322, 510], mapArea: 'arriving_city' },
    { id: 'south_gate', name: 'South Gate', description: 'The southern gate of Qualibaf.', encounterId: 'south_gate', connections: ['river_crossing', 'city_south_gate'], position: [662, 260], mapArea: 'arriving_city', passthroughTo: 'city_south_gate' },
    { id: 'city_south_gate', name: 'City South Gate', description: 'Inside the southern gate of Qualibaf.', encounterId: '', connections: ['city_square', 'weaponsmith', 'armorsmith', 'general_store', 'inn', 'church', 'guild_hall', 'antiquity_shop', 'arcane_emporium', 'city_north_gate'], position: [512, 900], mapArea: 'qualibaf', canRevisit: true, passthroughTo: 'south_gate' },
    { id: 'city_square', name: 'City Square', description: 'The central square of Qualibaf.', encounterId: 'city_square', connections: ['city_south_gate', 'weaponsmith', 'armorsmith', 'general_store', 'inn', 'church', 'guild_hall', 'antiquity_shop', 'arcane_emporium', 'city_north_gate'], position: [512, 500], mapArea: 'qualibaf', canRevisit: true },
    { id: 'weaponsmith', name: 'Weaponsmith', description: 'A weaponsmith shop.', encounterId: 'weaponsmith', connections: ['city_south_gate', 'city_square'], position: [340, 390], mapArea: 'qualibaf', canRevisit: true },
    { id: 'armorsmith', name: 'Armorsmith', description: 'An armorsmith shop.', encounterId: 'armorsmith', connections: ['city_south_gate', 'city_square'], position: [324, 470], mapArea: 'qualibaf', canRevisit: true },
    { id: 'general_store', name: 'General Store', description: 'A general goods store.', encounterId: 'general_store', connections: ['city_south_gate', 'city_square'], position: [650, 610], mapArea: 'qualibaf', canRevisit: true },
    { id: 'inn', name: 'Inn', description: 'A cozy inn.', encounterId: 'inn', connections: ['city_south_gate', 'city_square'], position: [684, 430], mapArea: 'qualibaf', canRevisit: true },
    { id: 'church', name: 'Church', description: 'A place of worship.', encounterId: 'church', connections: ['city_south_gate', 'city_square'], position: [820, 350], mapArea: 'qualibaf', canRevisit: true },
    { id: 'guild_hall', name: 'Guild Hall', description: "The Adventurer's Guild hall. A place to find work and information.", encounterId: 'guild_hall', connections: ['city_south_gate', 'city_square'], position: [520, 401], mapArea: 'qualibaf', canRevisit: true },
    { id: 'antiquity_shop', name: 'Antiquity Shop', description: 'A dusty shop filled with ancient relics and curious artifacts.', encounterId: 'antiquity_shop', connections: ['city_south_gate', 'city_square'], position: [420, 270], mapArea: 'qualibaf', canRevisit: true },
    { id: 'arcane_emporium', name: 'Arcane Emporium', description: 'A shop of arcane goods.', encounterId: 'arcane_emporium', connections: ['city_south_gate', 'city_square'], position: [260, 710], mapArea: 'qualibaf', canRevisit: true },
    { id: 'city_north_gate', name: 'City North Gate', description: 'The northern gate of Qualibaf.', encounterId: 'city_north_gate', connections: ['city_south_gate', 'city_square'], position: [512, 100], mapArea: 'qualibaf', isLocked: true, hiddenName: '???' },
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
    { id: 'north_crossroad', name: 'North Crossroad', description: 'A crossroad north of the city.', encounterId: 'north_crossroad', connections: ['north_gate_return', 'filibaf_entrance'], position: [580, 170], mapArea: 'north_qualibaf', unlocks: ['filibaf_entrance'] },
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
    { id: 'siege_gauntlet_3', name: 'Siege Gauntlet 3', description: 'The third siege line.', encounterId: 'siege_gauntlet_3', connections: ['siege_gauntlet_2', 'siege_gauntlet_dialog', 'north_pass'], position: [450, 570], mapArea: 'tharnag', isLocked: true, unlocks: ['siege_gauntlet_dialog'], hiddenName: 'Siege Line' },
    { id: 'siege_gauntlet_dialog', name: 'Siege Gauntlet Dialog', description: 'Beyond the siege lines.', encounterId: 'siege_gauntlet_dialog', connections: ['siege_gauntlet_3', 'tharnag_side_door'], position: [640, 580], mapArea: 'tharnag', isLocked: true, unlocks: ['tharnag_side_door'], hiddenName: '???' },
    { id: 'tharnag_side_door', name: 'Tharnag Side Door', description: 'A side entrance to Tharnag.', encounterId: 'tharnag_side_door', connections: ['siege_gauntlet_dialog'], position: [790, 450], mapArea: 'tharnag', isLocked: true, canRevisit: true, hiddenName: '???' },
    // North Pass — unlocked after the throne audience. Clicking it
    // hops to the Obsidian Wastes map (wastes_entry). Mirrors PY
    // map.py:1088-1099 + game.py:2322-2341.
    { id: 'north_pass', name: 'North Pass', description: 'A narrow mountain pass leading north to the Obsidian Wastes.', encounterId: '', connections: ['siege_gauntlet_3'], position: [60, 320], mapArea: 'tharnag', isLocked: true, canRevisit: true, hiddenName: '???', hiddenDescription: 'A path continues north through the mountains.' },
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
    // Each step up the slope unlocks the next so the player can walk
    // straight from approach -> east path -> lava crossing -> base.
    { id: 'volcano_east_path', name: 'Volcano East Path', description: 'A path along the eastern slope.', encounterId: '', connections: ['volcano_approach', 'volcano_lava_crossing'], position: [750, 790], mapArea: 'volcano', isLocked: true, canRevisit: true, hiddenName: '???', unlocks: ['volcano_lava_crossing'] },
    { id: 'volcano_lava_crossing', name: 'Volcano Lava Crossing', description: 'A crossing over a lava flow.', encounterId: '', connections: ['volcano_east_path', 'volcano_base'], position: [800, 630], mapArea: 'volcano', isLocked: true, canRevisit: true, hiddenName: '???', unlocks: ['volcano_base'] },
    { id: 'volcano_base', name: 'Volcano Base', description: 'The base of the volcano crater.', encounterId: 'volcano_choice', connections: ['volcano_lava_crossing'], position: [770, 540], mapArea: 'volcano', isLocked: true, canRevisit: true, hiddenName: '???' },
  ];

  for (const data of nodes) {
    map.addNode(new MapNode(data));
  }
  map.currentNodeId = 'volcano_approach';
  return map;
}

// === Obsidian Wastes Map ===
// Base map only carries the entry + exit. The labyrinth in between
// is generated procedurally via generateLabyrinthNodes(map, seed) on
// the first arrival, then re-generated from the same seed on load.
// Mirrors PY map.py:create_obsidian_wastes_map.
export function createObsidianWastesMap() {
  const map = new GameMap('obsidian_wastes', 'Obsidian Wastes');
  map.mapImages = {
    obsidian_wastes: 'Maps/ObsidianWastesMap.jpg',
  };

  const nodes = [
    { id: 'wastes_entry', name: 'Edge of the Wastes', description: 'The frozen lava fields begin here, stretching endlessly northward.', encounterId: 'obsidian_wastes_arrival', connections: [], position: [500, 950], mapArea: 'obsidian_wastes', canRevisit: true },
    { id: 'wastes_north', name: 'Northern Wastes', description: 'The Volcano looms closer. Thorgazad must be near.', encounterId: 'wastes_north', connections: [], position: [410, 220], mapArea: 'obsidian_wastes', isLocked: true, canRevisit: true, hiddenName: '???', hiddenDescription: 'Something ahead, near the Volcano.' },
  ];

  for (const data of nodes) {
    map.addNode(new MapNode(data));
  }
  map.currentNodeId = 'wastes_entry';
  return map;
}

// Procedural labyrinth generation between wastes_entry and
// wastes_north. Mirrors PY map.py:generate_labyrinth_nodes — same
// shape, same seeded RNG behavior so the generated layout is
// deterministic per playthrough.
const LABYRINTH_NAMES = [
  'Obsidian Tunnel', 'Lava Crust Passage', 'Glass Cavern',
  'Molten Corridor', 'Basalt Chamber', 'Cinder Path',
  'Volcanic Vent', 'Sulfur Grotto', 'Magma Seam',
  'Scorched Gallery', 'Ember Crossing', 'Ash-Choked Passage',
  'Obsidian Ridge', 'Crystal Vein', 'Slag Heap',
  'Smoke-Filled Chamber', 'Cooled Flow', 'Black Glass Trail',
  'Fissure Path', 'Pyroclast Tunnel',
];
const LABYRINTH_DESCRIPTIONS = [
  'Sharp obsidian formations crunch underfoot. The haze is thick here.',
  'The ground is warm beneath your feet. Faint red light pulses from cracks below.',
  'Walls of jagged black glass rise on either side, distorting your reflection.',
  'Sulfurous fumes sting your eyes. The path narrows between volcanic boulders.',
  'A vast cavern of cooled lava, its ceiling lost in darkness above.',
  'The obsidian here is smooth as a mirror, treacherous to walk on.',
  'Thin wisps of steam rise from vents in the rock floor.',
  'Broken columns of basalt stand like petrified trees in the fog.',
  'The air shimmers with heat. Pools of molten rock glow dimly nearby.',
  'A narrow passage between towering obsidian walls. Every sound echoes.',
  'The ground slopes unpredictably. Loose volcanic gravel slides beneath your boots.',
  'Crystals of yellow sulfur crust the walls, casting a sickly glow.',
  'A wide chamber where the lava cooled in strange rippling waves.',
  'The fog is so thick you can barely see your own hands.',
  'Scorched rock formations twist into bizarre, almost organic shapes.',
  'A thin crust of obsidian over hollow ground — every step feels precarious.',
  'The path forks around a massive volcanic boulder, then rejoins.',
  'Ash drifts like black snow from somewhere above.',
  'A field of obsidian shards, sharp as broken glass, blocks easy passage.',
  'The remnants of an ancient lava tube, its walls smooth and dark.',
];

// Tiny seeded PRNG so layouts are deterministic for a given seed.
// Mulberry32 — fast, non-crypto, fine for layout reproducibility.
function _seededRng(seed) {
  let s = (seed >>> 0) || 1;
  return function() {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function _rngInt(rng, min, max) { return Math.floor(rng() * (max - min + 1)) + min; }
function _rngChoice(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
function _rngShuffle(rng, arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function _rngSample(rng, arr, k) {
  return _rngShuffle(rng, arr.slice()).slice(0, k);
}

export function generateLabyrinthNodes(gameMap, seed) {
  const rng = _seededRng(seed);
  // 7 inner tiers of 3-5 nodes each.
  const tierSizes = Array.from({ length: 7 }, () => _rngInt(rng, 3, 5));
  const names = _rngShuffle(rng, LABYRINTH_NAMES.slice());
  const descs = _rngShuffle(rng, LABYRINTH_DESCRIPTIONS.slice());

  const tiers = [['wastes_entry']];
  for (let t = 1; t <= tierSizes.length; t++) {
    const ids = [];
    for (let i = 0; i < tierSizes[t - 1]; i++) ids.push(`lab_${t}_${i}`);
    tiers.push(ids);
  }
  tiers.push(['wastes_north']);

  // Random positions, min 80px spacing.
  const allLab = {};
  const used = [];
  let nameIdx = 0;
  for (let t = 1; t < tiers.length - 1; t++) {
    for (const nodeId of tiers[t]) {
      let x = 0, y = 0;
      for (let attempt = 0; attempt < 50; attempt++) {
        x = _rngInt(rng, 100, 900);
        y = _rngInt(rng, 120, 850);
        let close = false;
        for (const [px, py] of used) {
          if (Math.abs(x - px) < 80 && Math.abs(y - py) < 80) { close = true; break; }
        }
        if (!close) break;
      }
      used.push([x, y]);
      allLab[nodeId] = {
        name: names[nameIdx % names.length],
        description: descs[nameIdx % descs.length],
        position: [x, y],
      };
      nameIdx++;
    }
  }

  // Build connection graph.
  const allNodeIds = [].concat(...tiers);
  const connections = {};
  for (const nid of allNodeIds) connections[nid] = [];

  for (let t = 0; t < tiers.length - 1; t++) {
    const cur = tiers[t];
    const next = tiers[t + 1];
    // Every next-tier node has at least one incoming forward edge.
    for (const nextNid of next) {
      const parent = _rngChoice(rng, cur);
      if (!connections[parent].includes(nextNid)) connections[parent].push(nextNid);
    }
    // wastes_entry caps at 3 forward connections.
    if (t === 0) {
      const fwd = connections['wastes_entry'].filter(c => next.includes(c));
      if (fwd.length > 3) {
        const keep = _rngSample(rng, fwd, 3);
        connections['wastes_entry'] = connections['wastes_entry'].filter(c => !fwd.includes(c) || keep.includes(c));
      }
    }
    // Each current-tier node aims for 2 forward connections.
    for (const curNid of cur) {
      const existing = connections[curNid].filter(c => next.includes(c));
      const need = 2 - existing.length;
      if (need > 0) {
        const candidates = next.filter(n => !connections[curNid].includes(n));
        for (let i = 0; i < Math.min(need, candidates.length); i++) {
          const pick = _rngChoice(rng, candidates);
          connections[curNid].push(pick);
          candidates.splice(candidates.indexOf(pick), 1);
        }
      }
    }
  }

  // Cap forward connections (wastes_entry: 3, others: 2).
  for (let t = 0; t < tiers.length - 1; t++) {
    const cur = tiers[t];
    const next = tiers[t + 1];
    for (const curNid of cur) {
      const maxFwd = curNid === 'wastes_entry' ? 3 : 2;
      const fwd = connections[curNid].filter(c => next.includes(c));
      if (fwd.length > maxFwd) {
        const keep = _rngSample(rng, fwd, maxFwd);
        connections[curNid] = connections[curNid].filter(c => !fwd.includes(c) || keep.includes(c));
      }
    }
  }

  // Add 1 backward (or sideways) connection per lab node.
  for (let t = 1; t < tiers.length - 1; t++) {
    for (const curNid of tiers[t]) {
      let back = 1;
      if (t >= 3 && rng() < 0.25) back = 2;
      const targetTier = tiers[Math.max(0, t - back)];
      const target = _rngChoice(rng, targetTier);
      if (!connections[curNid].includes(target)) connections[curNid].push(target);
    }
  }

  // Shuffle each connection list so the player can't tell forward from back.
  for (const nid of Object.keys(connections)) _rngShuffle(rng, connections[nid]);

  // Add the lab nodes to the map.
  for (const [nodeId, info] of Object.entries(allLab)) {
    gameMap.addNode(new MapNode({
      id: nodeId,
      name: info.name,
      description: info.description,
      connections: connections[nodeId].slice(),
      position: info.position,
      mapArea: 'obsidian_wastes',
      isLocked: true,
      canRevisit: true,
      hiddenName: '???',
      hiddenDescription: 'Darkness ahead.',
    }));
  }

  // Update entry + north connections.
  const entry = gameMap.getNode('wastes_entry');
  if (entry) {
    entry.connections = connections['wastes_entry'].slice();
    entry.unlocks = entry.connections.filter(c => c.startsWith('lab_'));
  }
  const north = gameMap.getNode('wastes_north');
  if (north) north.connections = connections['wastes_north'].slice();

  // Each lab node unlocks its connections on visit.
  for (const nodeId of Object.keys(allLab)) {
    const n = gameMap.getNode(nodeId);
    if (n) n.unlocks = n.connections.slice();
  }
}

// === Tharnag Interior Map ===
// Mirrors PY map.py:create_tharnag_interior_map. The Grand Hall lane
// (side entry → lower → mid → upper stairs) is wired now; the
// Artisan Hall and beyond are stubbed for future work — their nodes
// stay in the data so encounters keep resolving by id, but they're
// not connected to the navigable path yet.
export function createTharnagInteriorMap() {
  const map = new GameMap('tharnag_interior', 'Tharnag Interior');
  map.mapImages = {
    grand_hall: 'Maps/TharnagGrandHall.jpg',
    grand_staircase: 'Maps/TharnagGrandStairCase.jpg',
    throne_room: 'Maps/TharnagThroneRoom.jpg',
    personal_quarters: 'Maps/TharnagPersonalQuarter.jpg',
    artisan_hall: 'Maps/ArtisanHallMap.jpg',
  };

  const nodes = [
    // Grand Hall lane — side entry fires once (canRevisit:false), the
    // stairs above it are pure navigation nodes (no encounters yet).
    { id: 'grand_hall_side_entry', name: 'Grand Hall Side Entry', description: 'The side door opens into the vast Grand Hall of Tharnag.', encounterId: 'grand_hall_arrival', connections: ['grand_hall_lower_stairs'], position: [940, 620], mapArea: 'grand_hall', canRevisit: false },
    { id: 'grand_hall_lower_stairs', name: 'Lower Stairs', description: 'Wide stone stairs carved into the mountain rock.', encounterId: '', connections: ['grand_hall_side_entry', 'grand_hall_mid_stairs', 'artisan_hall_entry'], position: [580, 660], mapArea: 'grand_hall', canRevisit: true },
    { id: 'grand_hall_mid_stairs', name: 'Middle Stairs', description: 'The stairs continue upward past towering pillars.', encounterId: '', connections: ['grand_hall_lower_stairs', 'grand_hall_upper_stairs'], position: [690, 520], mapArea: 'grand_hall', canRevisit: true },
    { id: 'grand_hall_upper_stairs', name: 'Upper Stairs', description: 'The top of the grand stairway. A massive archway leads deeper into Tharnag.', encounterId: '', connections: ['grand_hall_mid_stairs', 'staircase_entry'], position: [740, 420], mapArea: 'grand_hall', canRevisit: true, passthroughTo: 'staircase_entry' },
    // Grand Staircase area — Thorb's homecoming dialog at the entry,
    // then a top + landing bridge into the throne room.
    { id: 'staircase_entry', name: 'Grand Staircase', description: 'A monumental staircase hewn from the living rock, lit by rivers of molten forge-light.', encounterId: 'grand_staircase_arrival', connections: ['grand_hall_upper_stairs', 'staircase_top'], position: [100, 970], mapArea: 'grand_staircase', canRevisit: false, passthroughTo: 'grand_hall_upper_stairs' },
    { id: 'staircase_top', name: 'Top of the Staircase', description: 'The stairs open onto a broad landing. To the left, a passage leads to the Throne Room.', encounterId: '', connections: ['staircase_entry', 'staircase_landing', 'quarters_hallway'], position: [650, 640], mapArea: 'grand_staircase', canRevisit: true },
    // To the Throne Room ↔ Throne Room — teleport pair across the
    // staircase / throne_room area boundary. Walking onto the landing
    // from the staircase auto-hops into the throne room and fires the
    // arrival dialog on first visit; walking back out of the throne
    // room hops you onto the landing. The teleport guard suppresses
    // the bounce when fromNodeId already matches the paired node, so
    // the encounter-complete re-fire doesn't ping-pong forever.
    { id: 'staircase_landing', name: 'To the Throne Room', description: 'A wide landing where the passage turns toward the Throne Room.', encounterId: '', connections: ['staircase_top', 'throne_room_entry'], position: [400, 580], mapArea: 'grand_staircase', canRevisit: true, passthroughTo: 'throne_room_entry' },
    { id: 'throne_room_entry', name: 'Throne Room', description: 'Massive iron doors stand open, revealing the Throne Room of Tharnag.', encounterId: 'throne_room_arrival', connections: ['staircase_landing', 'throne'], position: [500, 970], mapArea: 'throne_room', canRevisit: false, passthroughTo: 'staircase_landing' },
    { id: 'throne', name: 'The Throne', description: "The ancient stone throne of Tharnag's king sits upon a raised dais.", encounterId: 'throne_audience', connections: ['throne_room_entry'], position: [510, 820], mapArea: 'throne_room', canRevisit: false },
    // Personal Quarters lane — locked until the throne audience
    // completes (handled by the throne_audience completion hook in
    // main.js, which flips quarters_hallway.isLocked off and reveals
    // its hidden name). Mirrors PY map.py:1493-1535. Hallway is a
    // bridge node into the quarters; the quarters entry is a hub with
    // bed (rest) + chest (Queen's Locket) leaves.
    { id: 'quarters_hallway', name: 'Hallway to Quarters', description: 'A torchlit corridor leading to the personal quarters.', encounterId: '', connections: ['staircase_top', 'personal_quarters_entry'], position: [900, 640], mapArea: 'grand_staircase', isLocked: true, canRevisit: true, hiddenName: '???', hiddenDescription: 'A passage leading somewhere.', passthroughTo: 'personal_quarters_entry' },
    { id: 'personal_quarters_entry', name: 'Personal Quarters', description: "A private chamber prepared for Thorb's companions.", encounterId: '', connections: ['quarters_hallway', 'quarters_bed', 'quarters_chest'], position: [520, 920], mapArea: 'personal_quarters', canRevisit: true, passthroughTo: 'quarters_hallway' },
    { id: 'quarters_bed', name: 'Bed', description: 'A sturdy dwarven bed with thick furs. It looks incredibly inviting after the long journey.', encounterId: 'quarters_rest', connections: ['personal_quarters_entry', 'quarters_chest'], position: [520, 260], mapArea: 'personal_quarters', canRevisit: true },
    { id: 'quarters_chest', name: 'Chest with Personal Belongings', description: 'A wooden chest containing personal items left for the party.', encounterId: 'quarters_chest', connections: ['personal_quarters_entry', 'quarters_bed'], position: [940, 540], mapArea: 'personal_quarters', canRevisit: false },
    // Artisan Hall lane — unlocked by the throne audience completion.
    // The entry sits on the Grand Hall side as a hidden gate; once
    // open, it's a single navigation hop into the Artisan Hall hub
    // which then connects city-style to the tavern + smithy.
    // Mirrors PY map.py:1375-1418.
    { id: 'artisan_hall_entry', name: 'To the Artisan Hall', description: "A wide passage leads to the Artisan Hall where Tharnag's craftsmen work.", encounterId: '', connections: ['grand_hall_lower_stairs', 'artisan_hall'], position: [350, 500], mapArea: 'grand_hall', isLocked: true, canRevisit: true, hiddenName: '???', hiddenDescription: 'A passage leads somewhere deeper into Tharnag.', passthroughTo: 'artisan_hall' },
    { id: 'artisan_hall', name: 'Artisan Hall', description: "The great workshop of Tharnag's master craftsmen.", encounterId: '', connections: ['artisan_hall_entry', 'dwarven_tavern', 'dwarven_smithy'], position: [770, 870], mapArea: 'artisan_hall', canRevisit: true, isLocked: true, hiddenName: '???', passthroughTo: 'artisan_hall_entry' },
    { id: 'dwarven_tavern', name: 'Dwarven Tavern', description: 'A warm tavern filled with the smell of ale and roasting meat.', encounterId: 'dwarven_tavern', connections: ['artisan_hall', 'dwarven_smithy'], position: [400, 500], mapArea: 'artisan_hall', canRevisit: true, isLocked: true, hiddenName: '???' },
    { id: 'dwarven_smithy', name: 'Dwarven Smithy', description: 'A massive forge where master smiths craft the finest dwarven arms and armor.', encounterId: 'dwarven_smithy', connections: ['artisan_hall', 'dwarven_tavern'], position: [400, 800], mapArea: 'artisan_hall', canRevisit: true, isLocked: true, hiddenName: '???' },
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
