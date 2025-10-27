# Blockchain Integration Guide

## How Position-Based Descriptions Work

When a player moves to a specific position, the smart contract automatically returns the correct location name and description based on their coordinates.

### Location Mapping (in Smart Contract)

```move
// In rise.move:
public fun get_player_location(dapp_hub: &DappHub, player_address: address): (String, String)
```

| Position | Location Name | Description |
|----------|---------------|-------------|
| (0, 0) | The Wasteland - Ground Zero | You stand in the middle of an endless expanse of cracked earth... |
| (0, 5) | The Old Road | What remains of an ancient highway stretches before you... |
| (10, 0) | The Rusted Tower | A skeletal radio tower looms above you... |
| (0, 10) | The Dry Riverbed | You stand in what was once a river... |
| (5, 0) | The Ash Plains | An endless plain of fine ash stretches before you... |
| (10, 15) | Rocky Outcrop | You've climbed to a rocky outcrop... |
| (10, 20) | Cave Entrance | A dark cave opens before you... |
| (any other) | The Wasteland | Generic wasteland description |

## Integration Example

### Step 1: Import the blockchain integration module

```typescript
import { 
  processMovementCommand, 
  syncGameStateFromBlockchain,
  getPlayerLocation 
} from './blockchainIntegration';
```

### Step 2: Update your game engine to use blockchain

```typescript
// In gameEngine.ts, modify processCommand:

export async function processCommand(
  state: GameState, 
  command: string,
  contract: any,
  dubheSchemaId: string,
  playerAddress: string
): Promise<GameState> {
  const cmd = command.trim().toLowerCase();
  const newState = { ...state };
  
  // Movement commands - now call blockchain!
  if (['n', 'north', 's', 'south', 'e', 'east', 'w', 'west'].includes(cmd)) {
    const direction = cmd.charAt(0);
    
    try {
      // Process movement on blockchain
      const result = await processMovementCommand(
        contract,
        dubheSchemaId,
        playerAddress,
        direction
      );
      
      if (result.success && result.location) {
        // Update output with blockchain data
        newState.outputHistory = [
          ...state.outputHistory,
          { text: `> ${command}`, type: 'normal' },
          { text: '', type: 'normal' },
          { text: result.location.name, type: 'highlight' },
          { text: result.location.description, type: 'normal' },
          { text: '', type: 'normal' },
          { text: `Visible landmarks: ${result.landmarks?.join(', ')}`, type: 'normal' }
        ];
        
        // Check for monster encounter
        if (result.hasMonster) {
          newState.outputHistory.push({ 
            text: '⚠️ A Wasteland Prowler blocks your path!', 
            type: 'warning' 
          });
        }
      } else {
        newState.outputHistory = [
          ...state.outputHistory,
          { text: `> ${command}`, type: 'normal' },
          { text: result.error || 'Movement failed', type: 'error' }
        ];
      }
    } catch (error) {
      console.error('Blockchain movement error:', error);
      newState.outputHistory = [
        ...state.outputHistory,
        { text: `> ${command}`, type: 'normal' },
        { text: 'Transaction failed. Please try again.', type: 'error' }
      ];
    }
  }
  
  return newState;
}
```

### Step 3: Load player state from blockchain on game start

```typescript
// In MudUI.tsx or your main game component:

useEffect(() => {
  const loadGameState = async () => {
    if (!address || !contract) return;
    
    try {
      // Sync all game state from blockchain
      const blockchainState = await syncGameStateFromBlockchain(
        contract,
        dubheSchemaId,
        address
      );
      
      // Update local state with blockchain data
      setGameState(prev => ({
        ...prev,
        outputHistory: [
          { text: blockchainState.location.name, type: 'highlight' },
          { text: blockchainState.location.description, type: 'normal' },
          { text: '', type: 'normal' },
          { text: `Visible landmarks: ${blockchainState.landmarks.join(', ')}`, type: 'normal' }
        ],
        hp: blockchainState.stats.health,
        hunger: 100 - blockchainState.stats.experience, // example mapping
        thirst: 100 - blockchainState.stats.level * 10
      }));
      
    } catch (error) {
      console.error('Failed to load from blockchain:', error);
    }
  };
  
  loadGameState();
}, [address, contract, dubheSchemaId]);
```

### Step 4: Initialize new players

```typescript
// When a new player joins:
await initializePlayer(contract, dubheSchemaId, playerName);
```

## Query Functions (No Gas Cost)

These read from blockchain without transactions:

```typescript
// Get current location description
const location = await getPlayerLocation(contract, dubheSchemaId, playerAddress);
console.log(location.name); // "The Wasteland - Ground Zero"
console.log(location.description); // Full atmospheric text

// Get nearby landmarks
const landmarks = await getNearbyLandmarks(contract, dubheSchemaId, playerAddress);
console.log(landmarks); // ["Old Road (north)", "Rusted Tower (east)", ...]

// Check for monsters
const hasMonster = await checkMonsterAtLocation(contract, dubheSchemaId, playerAddress);
if (hasMonster) {
  console.log("⚠️ Monster encounter!");
}

// Get player stats
const stats = await getPlayerStats(contract, dubheSchemaId, playerAddress);
console.log(`HP: ${stats.health}, Level: ${stats.level}, Exp: ${stats.experience}`);
```

## Transaction Functions (Cost Gas)

These modify blockchain state:

```typescript
// Move player (records position on-chain)
await movePlayerOnChain(contract, dubheSchemaId, newX, newY);

// Update health (combat, healing, eating)
await updatePlayerHealth(contract, dubheSchemaId, 10, true); // take 10 damage
await updatePlayerHealth(contract, dubheSchemaId, 5, false); // heal 5 HP

// Grant experience
await grantExperience(contract, dubheSchemaId, 25);
```

## Flow Diagram

```
Player types "n" in MUD client
    ↓
Calculate new coordinates (0,0) → (0,5)
    ↓
Send transaction: move_player(0, 5)
    ↓
Blockchain records new position
    ↓
Query: get_player_location(playerAddress)
    ↓
Smart contract checks: if (x==0 && y==5) return "The Old Road" + description
    ↓
Client displays location text from blockchain
```

## Benefits

✅ **Provable**: Every movement is on-chain  
✅ **Persistent**: Player always loads correct location  
✅ **Secure**: Server can't cheat or modify history  
✅ **Multiplayer-ready**: Other players can see your location  
✅ **Dynamic**: Add new locations by deploying updated contract  

## Gas Optimization Tips

- **Batch movements**: Consider allowing multiple moves in one transaction
- **Cache queries**: Store location descriptions client-side after first query
- **Use ECS subscriptions**: Listen for position changes instead of polling
- **Local validation**: Check if move is valid before sending transaction
