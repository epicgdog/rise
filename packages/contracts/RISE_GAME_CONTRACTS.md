# RISE Game Smart Contracts

## Overview
The RISE game uses Sui blockchain smart contracts built with the Dubhe ECS (Entity Component System) framework. All game actions (player movement, combat, inventory changes) are recorded on-chain.

## Architecture

### Components (ECS)
- **player**: Marker component identifying player entities
- **landmark**: Marker component for world landmarks
- **monster**: Marker component for hostile entities
- **health**: u32 - Entity health points
- **experience**: u32 - Player/monster experience points
- **level**: u32 - Entity level
- **name**: string - Entity name
- **description**: string - Entity description
- **position**: struct { x: u32, y: u32 } - 2D coordinates

## Smart Contract Functions

### Player Management

#### `initialize_player(dapp_hub, player_name, ctx)`
Initialize a new player or load existing player data.
- **Parameters:**
  - `player_name`: vector<u8> - Player's chosen name
- **Behavior:**
  - For new players: Creates entity with default stats (HP: 50, Level: 1, Exp: 0, Position: 0,0)
  - For returning players: Loads existing blockchain data automatically
- **Transaction**: Records player creation on-chain

#### `move_player(dapp_hub, new_x, new_y, ctx)`
Move player to new coordinates.
- **Parameters:**
  - `new_x`: u32 - Target X coordinate
  - `new_y`: u32 - Target Y coordinate
- **Transaction**: Each movement is recorded on blockchain
- **Use case**: Connects to MUD client commands (n, s, e, w)

#### `update_player_health(dapp_hub, health_change, is_damage, ctx)`
Modify player health (damage or healing).
- **Parameters:**
  - `health_change`: u32 - Amount to change
  - `is_damage`: bool - true for damage, false for healing
- **Transaction**: Records health changes on-chain
- **Use case**: Combat, consuming food, environmental damage

#### `grant_experience(dapp_hub, exp_amount, ctx)`
Award experience and handle level-ups.
- **Parameters:**
  - `exp_amount`: u32 - Experience points to award
- **Behavior:**
  - Adds experience
  - Auto level-up at 100 exp per level
  - Heals player to max HP on level-up (50 base + 10 per level)
- **Transaction**: Records progression on-chain

### World Initialization

#### `initialize_landmarks(dapp_hub, ctx)`
Set up game world landmarks (call once during deployment).
- **Creates 7 landmarks:**
  1. The Wasteland - Ground Zero (0, 0)
  2. The Old Road (0, 5)
  3. The Rusted Tower (10, 0)
  4. The Dry Riverbed (0, -5)
  5. The Ash Plains (-10, 0)
  6. Rocky Outcrop (10, 15)
  7. Cave Entrance (10, 20)
- **Transaction**: Stores world state on blockchain

#### `initialize_monster_rocky_terrain(dapp_hub, ctx)`
Spawn a monster at rocky outcrop.
- **Monster**: "Wasteland Prowler" at (10, 15)
- **Stats**: HP: 30, Level: 1
- **Transaction**: Creates hostile entity on-chain

### Query Functions (No Transaction)

#### `get_player_position(dapp_hub, player_address)`
Returns: `(u32, u32)` - Current (x, y) coordinates

#### `get_player_stats(dapp_hub, player_address)`
Returns: `(u32, u32, u32)` - (health, experience, level)

## Game Loop Integration

### Client → Blockchain Flow

1. **Player Action** (e.g., types "n" to move north in MUD client)
2. **Client calculates** new coordinates based on current location
3. **Transaction sent** to `move_player(dapp_hub, new_x, new_y, ctx)`
4. **Blockchain records** the movement
5. **Client queries** updated position and renders new location

### Command Mapping

| MUD Command | Smart Contract Function | Transaction |
|-------------|-------------------------|-------------|
| `look` | Query `get_player_position` | No (read-only) |
| `n`, `s`, `e`, `w` | Call `move_player(...)` | Yes ✓ |
| `inventory` | Query player components | No (read-only) |
| `score` / `stats` | Call `get_player_stats(...)` | No (read-only) |
| `attack` | Call `update_player_health(...)` | Yes ✓ |
| (consume food) | Call `update_player_health(...)` | Yes ✓ |

## Deployment Steps

1. **Generate schemas:**
   ```bash
   cd packages/contracts
   pnpm run schemagen
   ```

2. **Build contracts:**
   ```bash
   pnpm run build
   ```

3. **Deploy to Sui:**
   ```bash
   pnpm run deploy --network testnet
   # or
   pnpm run deploy --network mainnet
   ```

4. **Initialize world:**
   ```bash
   # Call initialize_landmarks once
   sui client call --function initialize_landmarks --module main_system --package <PACKAGE_ID>
   
   # Call initialize_monster_rocky_terrain once
   sui client call --function initialize_monster_rocky_terrain --module main_system --package <PACKAGE_ID>
   ```

## Client Integration

### Initialize Player (First Time)
```typescript
import { Transaction } from '@mysten/sui.js';

const tx = new Transaction();
await contract.tx.main_system.initialize_player({
  tx,
  params: [
    tx.object(dubheSchemaId),
    tx.pure(new TextEncoder().encode(playerName))
  ]
});

await contract.signAndSendTxn({ tx });
```

### Move Player
```typescript
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
```

### Query Player Data (No Transaction)
```typescript
const position = await contract.query.main_system.get_player_position({
  params: [dubheSchemaId, playerAddress]
});

const [health, exp, level] = await contract.query.main_system.get_player_stats({
  params: [dubheSchemaId, playerAddress]
});
```

## Gas Optimization

- **Read operations** (queries) are free - no gas cost
- **Write operations** (movements, combat) cost gas
- Consider batching multiple actions into single transaction
- Use ECS subscription system to avoid repeated queries

## Security Considerations

- All player actions are verified on-chain
- Player can only modify their own entity (enforced by `ctx.sender()`)
- Landmarks and monsters use deterministic addresses (@0x1, @0x2, etc.)
- Health cannot drop below 0 (clamped in `update_player_health`)

## Future Enhancements

- [ ] Inventory system (pickup/drop items)
- [ ] Combat system (attack monsters)
- [ ] Random encounters using VRF
- [ ] Trading between players
- [ ] Crafting system
- [ ] Persistent game saves (already supported by blockchain!)
- [ ] Multiplayer interactions
