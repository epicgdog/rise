# RISE - Blockchain Integration Guide

## Overview
RISE is now fully integrated with Sui blockchain using the Dubhe ECS framework. Every movement and game action is recorded on-chain, creating a persistent, verifiable game state.

## Architecture

### Files
1. **`gameEngine.ts`** - Local game logic and location definitions
2. **`blockchainGameEngine.ts`** - Blockchain integration layer (NEW)
3. **`MudUI.tsx`** - React UI with blockchain hooks
4. **`/packages/contracts/src/rise/sources/systems/rise.move`** - Smart contracts

### Data Flow
```
User Action → MudUI → blockchainGameEngine → Sui Blockchain → Smart Contract
                ↓                                                      ↓
         Local UI Update  ←──── Transaction Result ←──── State Change
```

## Smart Contract Functions

### Initialized by Game
- `initialize_player(name)` - Create player on blockchain with default stats (HP: 50, Level: 1, XP: 0, Position: 0,0)
- `initialize_landmarks()` - Set up world locations (called once)
- `initialize_monster_rocky_terrain()` - Spawn monster at (10, 15)

### Called During Gameplay
- `move_player(x, y)` - Record player movement (💎 Blockchain transaction)
- `get_player_location(address)` - Query current location name and description
- `get_player_position(address)` - Query current (x, y) coordinates
- `get_player_stats(address)` - Query health, experience, level
- `get_nearby_landmarks(address)` - Query visible landmarks from current position
- `check_monster_at_location(address)` - Check for monster encounters
- `update_player_health(change, is_damage)` - Combat/healing system
- `grant_experience(amount)` - XP and level-up system

## Coordinate System

### Location Mapping
The game uses a 2D coordinate system that maps to named locations:

```typescript
wasteland_start:     (0, 0)   // Starting position
old_road:           (0, 5)   // North of start
rusted_tower:       (10, 0)  // East side
dry_riverbed:       (0, 10)  // Far north
ash_plains:         (5, 0)   // Middle east
rocky_outcrop:      (10, 15) // Near monster
cave_entrance:      (10, 20) // Deepest location
```

Defined in `blockchainGameEngine.ts`:
```typescript
export const LOCATION_TO_COORDS = {
  wasteland_start: { x: 0, y: 0 },
  old_road: { x: 0, y: 5 },
  // ... etc
};
```

## User Experience

### Wallet Connection Required
Players must connect a Sui wallet to play. The game checks for:
- `contract` - Dubhe contract instance
- `dubheSchemaId` - Schema ID for the game
- `address` - Player's wallet address

### First-Time Players
1. Connect wallet
2. Game calls `initialize_player("Survivor")`
3. Transaction is recorded on blockchain
4. Player spawns at (0, 0) with default stats
5. Game shows intro narrative

### Returning Players
1. Connect wallet
2. Game calls `loadPlayerStateFromChain()`
3. Retrieves position, health, experience, level
4. Game loads player at their saved location
5. Shows "Welcome back" message

### Movement Commands
When player types `n`, `s`, `e`, `w` or clicks a direction button:

1. **Local validation** - Check if exit exists
2. **Show pending message** - "⏳ Recording movement on blockchain..."
3. **Create transaction** - `movePlayerOnChain(targetLocation)`
4. **Execute on blockchain** - Calls `move_player(x, y)`
5. **Update UI on success** - "✅ Movement recorded on blockchain"
6. **Show new location** - Name, description, coordinates

### Query Commands
Commands like `look`, `stats`, `map` query the blockchain:

1. **Show loading** - "🔍 Querying blockchain..."
2. **Call query function** - e.g., `getLocationFromChain()`
3. **Display results** - "✅ Location data from blockchain:"

## Transaction Pattern

Following the pattern from `page.tsx`:

```typescript
const tx = new Transaction();

await contract.tx.main_system.move_player({
  tx,
  params: [
    tx.object(dubheSchemaId),
    tx.pure.u32(newX),
    tx.pure.u32(newY)
  ],
  isRaw: true
});

await contract.signAndSendTxn({
  tx,
  onSuccess: (result) => {
    // Update UI, show success toast
  },
  onError: (error) => {
    // Show error toast
  }
});
```

## Key Features

### ✅ Persistent State
- All player movements saved on blockchain
- Positions remain even after closing browser
- No centralized server required

### ✅ Real-time Updates
- Immediate UI feedback during transactions
- Loading states for blockchain operations
- Success/error notifications

### ✅ Hybrid Architecture
- Critical game state (position, stats) on blockchain
- Local data (inventory, UI state) for performance
- Balance between decentralization and UX

### ✅ Graceful Degradation
- Checks for wallet connection before allowing commands
- Clear error messages if blockchain calls fail
- Prevents actions during pending transactions

## Testing the Integration

1. **Start the client**:
   ```bash
   cd packages/client
   pnpm dev
   ```

2. **Navigate to `/mud`** in your browser

3. **Connect Sui wallet** (Sui Wallet, Suiet, etc.)

4. **Test scenarios**:
   - First-time player: Should initialize on blockchain
   - Movement: Each direction should create a transaction
   - Look command: Should query blockchain for location
   - Refresh page: Should reload player state from blockchain
   - Disconnect wallet: Commands should show "connect wallet" message

## Debugging

### Console Logs
The integration includes comprehensive logging:
- `🔍 Querying blockchain...` - Query started
- `✅ Loaded player state from blockchain` - State loaded
- `📍 Position: (x, y)` - Current coordinates
- `❌ Blockchain transaction failed` - Error occurred

### Common Issues
1. **"No address available"** - Wallet not connected
2. **"Transaction failed"** - Gas issue or contract error
3. **"Unknown location"** - Coordinate mapping mismatch

### Verifying Transactions
After each movement, check the Sui Explorer:
- Click "Check in Explorer" link in toast notification
- Verify transaction shows correct `move_player` call
- Check position was updated in contract storage

## Next Steps

### Additional Features to Integrate
- [ ] Combat system (`update_player_health`)
- [ ] Experience/leveling (`grant_experience`)
- [ ] Item collection (requires new contract functions)
- [ ] Monster encounters (`check_monster_at_location`)
- [ ] Multi-player interactions
- [ ] Leaderboard (query all players by level)

### Performance Optimizations
- [ ] Batch multiple queries in single call
- [ ] Cache blockchain queries with TTL
- [ ] Optimistic UI updates before blockchain confirmation
- [ ] Background transaction queue

## Resources

- **Dubhe Docs**: https://docs.0xobelisk.com/
- **Sui Move Docs**: https://docs.sui.io/
- **Contract Code**: `/packages/contracts/src/rise/`
- **Smart Contract Documentation**: `/packages/contracts/RISE_GAME_CONTRACTS.md`

---

**Built with**: React, Next.js, TypeScript, Sui Blockchain, Dubhe ECS Framework

**Game by**: Your team
**Blockchain Integration**: Complete ✅
