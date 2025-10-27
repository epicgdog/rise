/**
 * Blockchain-integrated game engine for RISE
 * This wraps the local game engine and syncs with Sui blockchain
 */

import { Transaction, TransactionResult } from '@0xobelisk/sui-client';
import { GameState, OutputLine, LOCATIONS } from './gameEngine';

// Coordinate mapping for blockchain locations
export const LOCATION_TO_COORDS: { [key: string]: { x: number; y: number } } = {
  wasteland_start: { x: 0, y: 0 },
  old_road: { x: 0, y: 5 },
  rusted_tower: { x: 10, y: 0 },
  dry_riverbed: { x: 0, y: 10 },
  ash_plains: { x: 5, y: 0 },
  rocky_outcrop: { x: 10, y: 15 },
  cave_entrance: { x: 10, y: 20 },
  // Other locations use intermediate coordinates
  highway_junction: { x: 5, y: 5 },
  collapsed_overpass: { x: 0, y: 8 },
  bridge_ruins: { x: 5, y: 10 },
  mudflats: { x: 0, y: 12 },
  ash_dunes: { x: 8, y: 0 },
  rubble_field: { x: 0, y: 15 },
};

export const COORDS_TO_LOCATION: { [key: string]: string } = Object.fromEntries(
  Object.entries(LOCATION_TO_COORDS).map(([loc, coords]) => [`${coords.x},${coords.y}`, loc])
);

/**
 * Initialize player on blockchain
 */
export async function initializePlayerOnChain(
  contract: any,
  dubheSchemaId: string,
  playerName: string,
  onSuccess?: () => void,
  onError?: (error: any) => void
): Promise<void> {
  try {
    const tx = new Transaction();
    await contract.tx.main_system.initialize_player({
      tx,
      params: [tx.object(dubheSchemaId), tx.pure.string(playerName)],
      isRaw: true
    }) as TransactionResult;

    await contract.signAndSendTxn({
      tx,
      onSuccess: (result: any) => {
        console.log('✅ Player initialized on blockchain:', result);
        onSuccess?.();
      },
      onError: (error: any) => {
        console.error('❌ Player initialization failed:', error);
        onError?.(error);
      }
    });
  } catch (error) {
    console.error('❌ Initialize player transaction failed:', error);
    onError?.(error);
  }
}

/**
 * Move player on blockchain
 */
export async function movePlayerOnChain(
  contract: any,
  dubheSchemaId: string,
  targetLocation: string,
  onSuccess?: (result: any) => void,
  onError?: (error: any) => void
): Promise<void> {
  const coords = LOCATION_TO_COORDS[targetLocation];
  if (!coords) {
    console.error('❌ Unknown location:', targetLocation);
    onError?.(new Error(`Unknown location: ${targetLocation}`));
    return;
  }

  try {
    const tx = new Transaction();
    await contract.tx.main_system.move_player({
      tx,
      params: [tx.object(dubheSchemaId), tx.pure.u32(coords.x), tx.pure.u32(coords.y)],
      isRaw: true
    }) as TransactionResult;

    await contract.signAndSendTxn({
      tx,
      onSuccess: (result: any) => {
        console.log(`✅ Moved to ${targetLocation} (${coords.x}, ${coords.y}) on blockchain`);
        onSuccess?.(result);
      },
      onError: (error: any) => {
        console.error('❌ Move transaction failed:', error);
        onError?.(error);
      }
    });
  } catch (error) {
    console.error('❌ Move player transaction failed:', error);
    onError?.(error);
  }
}

/**
 * Load player state from blockchain
 */
export async function loadPlayerStateFromChain(
  contract: any,
  dubheSchemaId: string,
  playerAddress: string
): Promise<{
  location: string;
  health: number;
  experience: number;
  level: number;
} | null> {
  try {
    // Query player position
    const positionResult = await contract.query.main_system.get_player_position({
      params: [dubheSchemaId, playerAddress]
    });

    const x = positionResult?.[0] || 0;
    const y = positionResult?.[1] || 0;
    const location = COORDS_TO_LOCATION[`${x},${y}`] || 'wasteland_start';

    // Query player stats
    const statsResult = await contract.query.main_system.get_player_stats({
      params: [dubheSchemaId, playerAddress]
    });

    const health = statsResult?.[0] || 50;
    const experience = statsResult?.[1] || 0;
    const level = statsResult?.[2] || 1;

    console.log(`📍 Loaded player state from blockchain: ${location} (${x}, ${y}), HP: ${health}, Level: ${level}`);

    return { location, health, experience, level };
  } catch (error) {
    console.error('❌ Failed to load player state from blockchain:', error);
    return null;
  }
}

/**
 * Get location description from blockchain
 */
export async function getLocationFromChain(
  contract: any,
  dubheSchemaId: string,
  playerAddress: string
): Promise<{ name: string; description: string } | null> {
  try {
    const result = await contract.query.main_system.get_player_location({
      params: [dubheSchemaId, playerAddress]
    });

    if (result && result[0] && result[1]) {
      return {
        name: result[0],
        description: result[1]
      };
    }
    return null;
  } catch (error) {
    console.error('❌ Failed to get location from blockchain:', error);
    return null;
  }
}

/**
 * Get nearby landmarks from blockchain
 */
export async function getNearbyLandmarksFromChain(
  contract: any,
  dubheSchemaId: string,
  playerAddress: string
): Promise<string[]> {
  try {
    const result = await contract.query.main_system.get_nearby_landmarks({
      params: [dubheSchemaId, playerAddress]
    });

    return result || [];
  } catch (error) {
    console.error('❌ Failed to get landmarks from blockchain:', error);
    return [];
  }
}

/**
 * Check for monster at current location
 */
export async function checkMonsterAtLocationFromChain(
  contract: any,
  dubheSchemaId: string,
  playerAddress: string
): Promise<boolean> {
  try {
    const result = await contract.query.main_system.check_monster_at_location({
      params: [dubheSchemaId, playerAddress]
    });

    return result || false;
  } catch (error) {
    console.error('❌ Failed to check monster:', error);
    return false;
  }
}

/**
 * Process command with blockchain integration
 */
export async function processCommandWithBlockchain(
  state: GameState,
  command: string,
  contract: any,
  dubheSchemaId: string,
  playerAddress: string
): Promise<{
  newState: GameState;
  requiresTransaction: boolean;
  transactionPending?: boolean;
}> {
  const cmd = command.trim().toLowerCase();
  const newState = { ...state };

  // Movement commands - these require blockchain transactions
  if (['n', 'north', 's', 'south', 'e', 'east', 'w', 'west', 'u', 'up', 'd', 'down'].includes(cmd)) {
    const direction = cmd.charAt(0);
    const location = LOCATIONS[state.currentLocation];
    
    if (location.exits[direction]) {
      const targetLocation = location.exits[direction];
      
      // Add "transaction pending" message
      newState.outputHistory = [
        ...state.outputHistory,
        { text: `> ${command}`, type: 'normal' },
        { text: '⏳ Recording movement on blockchain...', type: 'warning' }
      ];

      return {
        newState,
        requiresTransaction: true,
        transactionPending: true
      };
    } else {
      newState.outputHistory = [
        ...state.outputHistory,
        { text: `> ${command}`, type: 'normal' },
        { text: 'You cannot go that way.', type: 'warning' }
      ];
      return { newState, requiresTransaction: false };
    }
  }
  
  // Look command - query blockchain for current location
  else if (cmd === 'look' || cmd === 'l') {
    newState.outputHistory = [
      ...state.outputHistory,
      { text: `> ${command}`, type: 'normal' },
      { text: '🔍 Querying blockchain for location data...', type: 'normal' }
    ];
    return { newState, requiresTransaction: false };
  }
  
  // Inventory - local only (for now)
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
    return { newState, requiresTransaction: false };
  }
  
  // Map command - local
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
    return { newState, requiresTransaction: false };
  }
  
  // Score/Stats - query blockchain
  else if (cmd === 'score' || cmd === 'stats') {
    newState.outputHistory = [
      ...state.outputHistory,
      { text: `> ${command}`, type: 'normal' },
      { text: '📊 Loading stats from blockchain...', type: 'normal' }
    ];
    return { newState, requiresTransaction: false };
  }
  
  // Help
  else if (cmd === 'help' || cmd === '?') {
    newState.outputHistory = [
      ...state.outputHistory,
      { text: `> ${command}`, type: 'normal' },
      { text: '', type: 'normal' },
      { text: 'Available Commands:', type: 'highlight' },
      { text: '  Movement: n, s, e, w (north, south, east, west) - 💎 Blockchain', type: 'success' },
      { text: '  look - Examine surroundings (queries blockchain)', type: 'normal' },
      { text: '  inventory (inv, i) - Check what you\'re carrying', type: 'normal' },
      { text: '  map - Consult your map for landmarks', type: 'normal' },
      { text: '  score (stats) - Check health and status (queries blockchain)', type: 'normal' },
      { text: '  help - Show this message', type: 'normal' },
      { text: '', type: 'normal' },
      { text: '💎 = Recorded on Sui blockchain', type: 'success' }
    ];
    return { newState, requiresTransaction: false };
  }
  
  // Unknown command
  else if (cmd) {
    newState.outputHistory = [
      ...state.outputHistory,
      { text: `> ${command}`, type: 'normal' },
      { text: 'Unknown command. Type "help" for available commands.', type: 'error' }
    ];
    return { newState, requiresTransaction: false };
  }

  return { newState, requiresTransaction: false };
}
