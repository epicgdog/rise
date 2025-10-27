/**
 * Blockchain Integration for RISE MUD Game
 * 
 * This module provides functions to interact with the Sui blockchain
 * smart contracts for the RISE game.
 * 
 * Note: Uses @0xobelisk/sui-client for Dubhe framework integration
 */

import { Transaction } from '@0xobelisk/sui-client';

// Coordinate mapping for game locations
export const LOCATION_COORDS: { [key: string]: { x: number; y: number } } = {
  wasteland_start: { x: 0, y: 0 },
  old_road: { x: 0, y: 5 },
  rusted_tower: { x: 10, y: 0 },
  dry_riverbed: { x: 0, y: 10 },
  ash_plains: { x: 5, y: 0 },
  rocky_outcrop: { x: 10, y: 15 },
  cave_entrance: { x: 10, y: 20 },
};

// Direction vectors for movement
const DIRECTIONS: { [key: string]: { dx: number; dy: number } } = {
  n: { dx: 0, dy: 5 },   // north
  s: { dx: 0, dy: -5 },  // south
  e: { dx: 5, dy: 0 },   // east (or 10 depending on location)
  w: { dx: -5, dy: 0 },  // west (or -10 depending on location)
};

/**
 * Initialize a new player on the blockchain
 */
export async function initializePlayer(
  contract: any,
  dubheSchemaId: string,
  playerName: string
): Promise<void> {
  const tx = new Transaction();
  
  await contract.tx.main_system.initialize_player({
    tx,
    params: [
      tx.object(dubheSchemaId),
      tx.pure.string(playerName)
    ]
  });

  await contract.signAndSendTxn({ tx });
}

/**
 * Move player on the blockchain
 */
export async function movePlayerOnChain(
  contract: any,
  dubheSchemaId: string,
  newX: number,
  newY: number
): Promise<void> {
  const tx = new Transaction();
  
  await contract.tx.main_system.move_player({
    tx,
    params: [
      tx.object(dubheSchemaId),
      tx.pure.u32(newX),
      tx.pure.u32(newY)
    ]
  });

  await contract.signAndSendTxn({ tx });
}

/**
 * Get player's current position from blockchain
 */
export async function getPlayerPosition(
  contract: any,
  dubheSchemaId: string,
  playerAddress: string
): Promise<{ x: number; y: number }> {
  const result = await contract.query.main_system.get_player_position({
    params: [dubheSchemaId, playerAddress]
  });

  return { x: result[0], y: result[1] };
}

/**
 * Get player's current location name and description from blockchain
 */
export async function getPlayerLocation(
  contract: any,
  dubheSchemaId: string,
  playerAddress: string
): Promise<{ name: string; description: string }> {
  const result = await contract.query.main_system.get_player_location({
    params: [dubheSchemaId, playerAddress]
  });

  return {
    name: result[0],
    description: result[1]
  };
}

/**
 * Get nearby landmarks from player's current position
 */
export async function getNearbyLandmarks(
  contract: any,
  dubheSchemaId: string,
  playerAddress: string
): Promise<string[]> {
  const result = await contract.query.main_system.get_nearby_landmarks({
    params: [dubheSchemaId, playerAddress]
  });

  return result;
}

/**
 * Get player stats (health, experience, level)
 */
export async function getPlayerStats(
  contract: any,
  dubheSchemaId: string,
  playerAddress: string
): Promise<{ health: number; experience: number; level: number }> {
  const result = await contract.query.main_system.get_player_stats({
    params: [dubheSchemaId, playerAddress]
  });

  return {
    health: result[0],
    experience: result[1],
    level: result[2]
  };
}

/**
 * Check if there's a monster at player's location
 */
export async function checkMonsterAtLocation(
  contract: any,
  dubheSchemaId: string,
  playerAddress: string
): Promise<boolean> {
  const result = await contract.query.main_system.check_monster_at_location({
    params: [dubheSchemaId, playerAddress]
  });

  return result;
}

/**
 * Update player health (damage or healing)
 */
export async function updatePlayerHealth(
  contract: any,
  dubheSchemaId: string,
  healthChange: number,
  isDamage: boolean
): Promise<void> {
  const tx = new Transaction();
  
  await contract.tx.main_system.update_player_health({
    tx,
    params: [
      tx.object(dubheSchemaId),
      tx.pure.u32(healthChange),
      tx.pure.bool(isDamage)
    ]
  });

  await contract.signAndSendTxn({ tx });
}

/**
 * Grant experience to player
 */
export async function grantExperience(
  contract: any,
  dubheSchemaId: string,
  expAmount: number
): Promise<void> {
  const tx = new Transaction();
  
  await contract.tx.main_system.grant_experience({
    tx,
    params: [
      tx.object(dubheSchemaId),
      tx.pure.u32(expAmount)
    ]
  });

  await contract.signAndSendTxn({ tx });
}

/**
 * Calculate new coordinates based on direction
 */
export function calculateNewPosition(
  currentX: number,
  currentY: number,
  direction: string
): { x: number; y: number } | null {
  const dir = DIRECTIONS[direction.toLowerCase()];
  if (!dir) return null;

  return {
    x: currentX + dir.dx,
    y: currentY + dir.dy
  };
}

/**
 * Process a movement command and update blockchain
 * Returns the new location info from the blockchain
 */
export async function processMovementCommand(
  contract: any,
  dubheSchemaId: string,
  playerAddress: string,
  direction: string
): Promise<{
  success: boolean;
  location?: { name: string; description: string };
  landmarks?: string[];
  hasMonster?: boolean;
  error?: string;
}> {
  try {
    // Get current position
    const currentPos = await getPlayerPosition(contract, dubheSchemaId, playerAddress);
    
    // Calculate new position
    const newPos = calculateNewPosition(currentPos.x, currentPos.y, direction);
    if (!newPos) {
      return { success: false, error: 'Invalid direction' };
    }

    // Move player on blockchain
    await movePlayerOnChain(contract, dubheSchemaId, newPos.x, newPos.y);

    // Get new location info from blockchain
    const location = await getPlayerLocation(contract, dubheSchemaId, playerAddress);
    const landmarks = await getNearbyLandmarks(contract, dubheSchemaId, playerAddress);
    const hasMonster = await checkMonsterAtLocation(contract, dubheSchemaId, playerAddress);

    return {
      success: true,
      location,
      landmarks,
      hasMonster
    };
  } catch (error) {
    console.error('Movement command failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Sync game state with blockchain
 * Call this when the player first loads the game
 */
export async function syncGameStateFromBlockchain(
  contract: any,
  dubheSchemaId: string,
  playerAddress: string
): Promise<{
  location: { name: string; description: string };
  position: { x: number; y: number };
  stats: { health: number; experience: number; level: number };
  landmarks: string[];
  hasMonster: boolean;
}> {
  const [location, position, stats, landmarks, hasMonster] = await Promise.all([
    getPlayerLocation(contract, dubheSchemaId, playerAddress),
    getPlayerPosition(contract, dubheSchemaId, playerAddress),
    getPlayerStats(contract, dubheSchemaId, playerAddress),
    getNearbyLandmarks(contract, dubheSchemaId, playerAddress),
    checkMonsterAtLocation(contract, dubheSchemaId, playerAddress)
  ]);

  return {
    location,
    position,
    stats,
    landmarks,
    hasMonster
  };
}
