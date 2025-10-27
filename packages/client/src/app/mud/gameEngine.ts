// Game engine for Rise - Post-apocalyptic MUD
import { Transaction, TransactionResult } from '@0xobelisk/sui-client';

export type Location = {
  id: string;
  name: string;
  description: string;
  exits: { [direction: string]: string };
  landmarks: string[];
  coords?: { x: number; y: number }; // Optional - coordinates managed by blockchainGameEngine
};

export type Item = {
  id: string;
  name: string;
  description: string;
  type: 'food' | 'bad_food' | 'tool' | 'misc';
};

export type GameState = {
  currentLocation: string;
  inventory: Item[];
  hp: number;
  hunger: number;
  thirst: number;
  outputHistory: OutputLine[];
  playerAddress?: string;
};

export type OutputLine = {
  text: string;
  type: 'normal' | 'highlight' | 'warning' | 'error' | 'success';
};

// World map - post-apocalyptic wasteland with blockchain coordinates
export const LOCATIONS: { [key: string]: Location } = {
  wasteland_start: {
    id: 'wasteland_start',
    name: 'The Wasteland - Ground Zero',
    description: `You stand in the middle of an endless expanse of cracked earth and ash. The sky above is a sickly gray, thick with dust that blots out any hint of sun. The air tastes metallic, bitter. There are no trees, no grass, no sign of life—just endless desolation stretching in every direction.

A skeletal remnant of what might have been a road lies to the north, partially buried under drifts of fine, colorless sand. To the east, you can make out the rusted silhouette of something tall—perhaps an old radio tower or the bones of a building. South, the ground dips into what looks like a dried riverbed, littered with debris. West is more of the same: nothing but barren, cracked earth fading into the haze.

You clutch a tattered map in your hand—your only guide in this dead world. You are utterly alone.`,
    exits: {
      n: 'old_road',
      e: 'rusted_tower',
      s: 'dry_riverbed',
      w: 'ash_plains'
    },
    landmarks: ['cracked earth', 'skeletal road (north)', 'rusted structure (east)', 'dried riverbed (south)', 'ash plains (west)'],
    coords: { x: 0, y: 0 }
  },
  old_road: {
    id: 'old_road',
    name: 'The Old Road',
    description: `What remains of an ancient highway stretches before you—buckled asphalt riddled with deep cracks, weeds long dead and fossilized in the fissures. Rusted car husks sit abandoned, their windows shattered, their frames stripped bare by time and scavengers.

The road runs east and west, both directions vanishing into the gray distance. To the south, you can return to the wasteland's heart. The silence here is oppressive; even the wind seems reluctant to disturb this graveyard of the old world.`,
    exits: {
      s: 'wasteland_start',
      e: 'highway_junction',
      w: 'collapsed_overpass'
    },
    landmarks: ['buckled asphalt', 'rusted car husks', 'highway (east/west)', 'wasteland (south)']
  },
  rusted_tower: {
    id: 'rusted_tower',
    name: 'The Rusted Tower',
    description: `A skeletal radio tower looms above you, its metal frame corroded and twisted. It leans precariously, as if one strong gust could topple it entirely. At its base, scattered debris—broken glass, twisted metal, scraps of unidentifiable cloth—litters the ground.

The tower groans softly in the wind, a mournful sound. From here, you can see west back to the wasteland, or venture north where the ground slopes upward toward a rocky outcrop.`,
    exits: {
      w: 'wasteland_start',
      n: 'rocky_outcrop'
    },
    landmarks: ['corroded radio tower', 'scattered debris', 'wasteland (west)', 'rocky terrain (north)']
  },
  dry_riverbed: {
    id: 'dry_riverbed',
    name: 'The Dry Riverbed',
    description: `You stand in what was once a river, now a cracked channel of sun-baked mud and jagged stones. The bed is littered with the detritus of a lost civilization: rusted shopping carts, waterlogged books turned to pulp and dust, plastic bottles bleached white by the harsh sun.

The riverbed stretches east and west. To the north lies the wasteland you came from. Occasionally, you see the faint outline of old bridges in the distance, their spans long collapsed.`,
    exits: {
      n: 'wasteland_start',
      e: 'bridge_ruins',
      w: 'mudflats'
    },
    landmarks: ['cracked mud channel', 'scattered debris', 'collapsed bridges (distance)', 'wasteland (north)']
  },
  ash_plains: {
    id: 'ash_plains',
    name: 'The Ash Plains',
    description: `An endless plain of fine ash stretches before you, disturbed only by your footprints. Each step sends up tiny clouds of gray dust that hang in the still air. The silence here is absolute—no wind, no sound, just the soft crunch of ash beneath your feet.

Far to the west, you think you can make out the vague shape of hills or dunes. To the east lies the wasteland's heart. The monotony of this place is suffocating.`,
    exits: {
      e: 'wasteland_start',
      w: 'ash_dunes'
    },
    landmarks: ['endless ash', 'footprints', 'distant hills (west)', 'wasteland (east)']
  },
  highway_junction: {
    id: 'highway_junction',
    name: 'Highway Junction',
    description: `Several roads converge here in a tangle of cracked concrete and faded lane markings. A rusted sign, barely legible, points in four directions—though the destinations it once indicated are long forgotten.

Abandoned vehicles form a maze of metal, some stacked atop others as if pushed by some great force. The junction continues west along the old road, or you can venture south into the wasteland.`,
    exits: {
      w: 'old_road',
      s: 'wasteland_start'
    },
    landmarks: ['cracked concrete', 'rusted directional sign', 'vehicle maze', 'old road (west)']
  },
  collapsed_overpass: {
    id: 'collapsed_overpass',
    name: 'Collapsed Overpass',
    description: `A massive concrete overpass has collapsed into a pile of rubble, blocking what was once a major thoroughfare. Rebar juts out at odd angles, and sections of roadway lie cracked and tilted like broken teeth.

You can climb over the rubble to continue west, return east along the old road, or explore south into the wasteland.`,
    exits: {
      e: 'old_road',
      s: 'wasteland_start',
      w: 'rubble_field'
    },
    landmarks: ['collapsed concrete', 'jutting rebar', 'rubble pile', 'old road (east)']
  },
  rocky_outcrop: {
    id: 'rocky_outcrop',
    name: 'Rocky Outcrop',
    description: `You've climbed to a rocky outcrop overlooking the wasteland. From here, the devastation is laid bare—kilometer after kilometer of dead land stretching to the horizon. The view is both terrible and humbling.

A small cave entrance yawns in the rock face to the north. South leads back down to the rusted tower.`,
    exits: {
      s: 'rusted_tower',
      n: 'cave_entrance'
    },
    landmarks: ['rocky overlook', 'cave entrance (north)', 'panoramic wasteland view', 'tower (south)']
  },
  bridge_ruins: {
    id: 'bridge_ruins',
    name: 'Bridge Ruins',
    description: `The skeletal remains of a bridge arch over the dry riverbed. Most of the span has collapsed, leaving only twisted girders and crumbling concrete pillars. You can carefully cross the remaining structure to reach the far side, or return west.`,
    exits: {
      w: 'dry_riverbed'
    },
    landmarks: ['collapsed bridge span', 'twisted girders', 'concrete pillars', 'riverbed (west)']
  },
  mudflats: {
    id: 'mudflats',
    name: 'The Mudflats',
    description: `The riverbed opens into a wide expanse of cracked, dried mud—once a lake or reservoir, now nothing but a hardpan floor. Strange patterns in the mud suggest the last moments of water evaporating long ago.`,
    exits: {
      e: 'dry_riverbed'
    },
    landmarks: ['cracked mudflats', 'evaporation patterns', 'dry lakebed', 'riverbed (east)']
  },
  ash_dunes: {
    id: 'ash_dunes',
    name: 'Ash Dunes',
    description: `The ash has piled into dunes here, sculpted by winds you cannot feel. The dunes shift subtly, and walking through them is exhausting. To the east lies the ash plains. The dunes seem to go on forever to the west.`,
    exits: {
      e: 'ash_plains'
    },
    landmarks: ['shifting ash dunes', 'endless gray', 'plains (east)']
  },
  rubble_field: {
    id: 'rubble_field',
    name: 'Rubble Field',
    description: `A vast field of broken concrete, twisted metal, and shattered glass stretches before you. This was once a city, now reduced to unrecognizable fragments. Scavenging here might yield something useful—or nothing but more despair.`,
    exits: {
      e: 'collapsed_overpass'
    },
    landmarks: ['broken concrete', 'twisted metal', 'shattered glass', 'overpass (east)']
  },
  cave_entrance: {
    id: 'cave_entrance',
    name: 'Cave Entrance',
    description: `A dark cave opens before you, offering shelter from the harsh wasteland. The darkness within is absolute—entering without light would be foolish. South returns you to the rocky outcrop.`,
    exits: {
      s: 'rocky_outcrop'
    },
    landmarks: ['dark cave mouth', 'shelter', 'outcrop (south)']
  }
};

// Starting inventory
export const STARTING_INVENTORY: Item[] = [
  {
    id: 'tattered_map',
    name: 'Tattered Map',
    description: 'A worn, barely legible map showing vague landmarks of the wasteland. Your only guide.',
    type: 'tool'
  },
  {
    id: 'stale_ration',
    name: 'Stale Ration Bar',
    description: 'A military ration bar, years past its expiration date. Still edible, barely.',
    type: 'food'
  },
  {
    id: 'dirty_water',
    name: 'Bottle of Dirty Water',
    description: 'Water of questionable quality. Drinking it is risky, but thirst is worse.',
    type: 'bad_food'
  }
];

export const INITIAL_STATE: GameState = {
  currentLocation: 'wasteland_start',
  inventory: [...STARTING_INVENTORY],
  hp: 50,
  hunger: 75,
  thirst: 60,
  outputHistory: []
};

// Command processing
export function processCommand(state: GameState, command: string): GameState {
  const cmd = command.trim().toLowerCase();
  const newState = { ...state };
  
  // Movement commands
  if (['n', 'north', 's', 'south', 'e', 'east', 'w', 'west', 'u', 'up', 'd', 'down'].includes(cmd)) {
    const direction = cmd.charAt(0);
    const location = LOCATIONS[state.currentLocation];
    
    if (location.exits[direction]) {
      newState.currentLocation = location.exits[direction];
      const newLocation = LOCATIONS[newState.currentLocation];
      newState.outputHistory = [
        ...state.outputHistory,
        { text: `> ${command}`, type: 'normal' },
        { text: '', type: 'normal' },
        { text: newLocation.name, type: 'highlight' },
        { text: newLocation.description, type: 'normal' },
        { text: '', type: 'normal' },
        { text: `Obvious exits: ${Object.keys(newLocation.exits).join(', ')}`, type: 'normal' }
      ];
    } else {
      newState.outputHistory = [
        ...state.outputHistory,
        { text: `> ${command}`, type: 'normal' },
        { text: 'You cannot go that way.', type: 'warning' }
      ];
    }
  }
  // Look command
  else if (cmd === 'look' || cmd === 'l') {
    const location = LOCATIONS[state.currentLocation];
    newState.outputHistory = [
      ...state.outputHistory,
      { text: `> ${command}`, type: 'normal' },
      { text: '', type: 'normal' },
      { text: location.name, type: 'highlight' },
      { text: location.description, type: 'normal' },
      { text: '', type: 'normal' },
      { text: `Obvious exits: ${Object.keys(location.exits).join(', ')}`, type: 'normal' }
    ];
  }
  // Inventory command
  else if (cmd === 'inventory' || cmd === 'inv' || cmd === 'i') {
    const inventoryLines: OutputLine[] = [
      { text: `> ${command}`, type: 'normal' },
      { text: '', type: 'normal' },
      { text: 'You are carrying:', type: 'highlight' }
    ];
    
    if (state.inventory.length === 0) {
      inventoryLines.push({ text: '  Nothing. Your pockets are empty.', type: 'warning' });
    } else {
      state.inventory.forEach(item => {
        const typeColor = item.type === 'bad_food' ? 'warning' : 'normal';
        inventoryLines.push({ 
          text: `  - ${item.name}${item.type === 'bad_food' ? ' (spoiled)' : ''}`, 
          type: typeColor 
        });
      });
    }
    
    newState.outputHistory = [...state.outputHistory, ...inventoryLines];
  }
  // Map command
  else if (cmd === 'map' || cmd === 'map look') {
    const location = LOCATIONS[state.currentLocation];
    newState.outputHistory = [
      ...state.outputHistory,
      { text: `> ${command}`, type: 'normal' },
      { text: '', type: 'normal' },
      { text: 'You consult your tattered map...', type: 'normal' },
      { text: '', type: 'normal' },
      { text: 'Landmarks visible from here:', type: 'highlight' },
      ...location.landmarks.map(landmark => ({ 
        text: `  • ${landmark}`, 
        type: 'normal' as const 
      }))
    ];
  }
  // Score/Stats command
  else if (cmd === 'score' || cmd === 'stats') {
    newState.outputHistory = [
      ...state.outputHistory,
      { text: `> ${command}`, type: 'normal' },
      { text: '', type: 'normal' },
      { text: 'Your Status:', type: 'highlight' },
      { text: `  Health: ${state.hp}/100`, type: state.hp < 30 ? 'warning' : 'success' },
      { text: `  Hunger: ${state.hunger}/100`, type: state.hunger < 30 ? 'warning' : 'normal' },
      { text: `  Thirst: ${state.thirst}/100`, type: state.thirst < 30 ? 'warning' : 'normal' }
    ];
  }
  // Help command
  else if (cmd === 'help' || cmd === '?') {
    newState.outputHistory = [
      ...state.outputHistory,
      { text: `> ${command}`, type: 'normal' },
      { text: '', type: 'normal' },
      { text: 'Available Commands:', type: 'highlight' },
      { text: '  Movement: n, s, e, w (north, south, east, west)', type: 'normal' },
      { text: '  look - Examine your surroundings', type: 'normal' },
      { text: '  inventory (inv, i) - Check what you\'re carrying', type: 'normal' },
      { text: '  map - Consult your map for landmarks', type: 'normal' },
      { text: '  score (stats) - Check your health and status', type: 'normal' },
      { text: '  help - Show this message', type: 'normal' }
    ];
  }
  // Unknown command
  else if (cmd) {
    newState.outputHistory = [
      ...state.outputHistory,
      { text: `> ${command}`, type: 'normal' },
      { text: 'Unknown command. Type "help" for available commands.', type: 'error' }
    ];
  }
  
  return newState;
}

// Initialize game with intro text
export function getIntroText(): OutputLine[] {
  return [
    { text: '', type: 'normal' },
    { text: '='.repeat(70), type: 'highlight' },
    { text: 'RISE', type: 'highlight' },
    { text: '='.repeat(70), type: 'highlight' },
    { text: '', type: 'normal' },
    { text: 'The world ended not with a bang, but with a slow, agonizing whimper.', type: 'normal' },
    { text: 'You don\'t remember when it started—only that one day, everything stopped.', type: 'normal' },
    { text: 'The cities fell silent. The skies turned gray. Life... simply ceased.', type: 'normal' },
    { text: '', type: 'normal' },
    { text: 'Now you wander the wasteland alone, clutching a tattered map—', type: 'normal' },
    { text: 'your only companion in this dead world.', type: 'warning' },
    { text: '', type: 'normal' },
    { text: 'Your only goals: survive. Find others, if any remain. Understand what happened.', type: 'highlight' },
    { text: '', type: 'normal' },
    { text: 'Type "help" for commands. Type "look" to examine your surroundings.', type: 'success' },
    { text: '', type: 'normal' },
    { text: '='.repeat(70), type: 'highlight' },
    { text: '', type: 'normal' },
    { text: LOCATIONS['wasteland_start'].name, type: 'highlight' },
    { text: LOCATIONS['wasteland_start'].description, type: 'normal' },
    { text: '', type: 'normal' },
    { text: `Obvious exits: ${Object.keys(LOCATIONS['wasteland_start'].exits).join(', ')}`, type: 'normal' },
    { text: '', type: 'normal' }
  ];
}
