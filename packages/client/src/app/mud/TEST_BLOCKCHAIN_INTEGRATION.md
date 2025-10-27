# Testing Blockchain Integration - Verification Guide

## How to Verify Your Wallet Data Loads from Blockchain

This guide will help you verify that the game is actually reading and writing to the Sui blockchain using your wallet address.

---

## ✅ Pre-Test Setup

1. **Start the development server:**
   ```bash
   cd packages/client
   pnpm dev
   ```

2. **Open browser console:**
   - Press `F12` or `Ctrl+Shift+I` (or `Cmd+Option+I` on Mac)
   - Go to the "Console" tab
   - Keep this open during testing to see blockchain logs

3. **Navigate to the game:**
   - Go to `http://localhost:3000/mud`

---

## 🧪 Test 1: First-Time Player Initialization

This verifies that a new player is created on the blockchain.

### Steps:
1. **Connect your wallet** (Sui Wallet extension)
2. **Watch the console** for these logs:
   ```
   🏠 Address initialized/changed: 0xYOUR_ADDRESS_HERE
   🎮 Initializing ECS World...
   ⏳ Initializing new player on blockchain...
   ✅ Player initialized on blockchain: [transaction result]
   ```

3. **In the game terminal**, you should see:
   ```
   ⏳ Initializing new player on blockchain...
   ✅ Player initialized on blockchain!
   
   The year is 2089. The world as you knew it ended thirty years ago...
   ```

### What This Proves:
- ✅ Your wallet address is detected
- ✅ `initialize_player()` transaction was sent to blockchain
- ✅ Smart contract created your player entity with:
  - Position: (0, 0)
  - Health: 50
  - Level: 1
  - Experience: 0

### How to Verify on Blockchain:
1. Look for the transaction hash in the console logs
2. Copy the transaction digest (looks like `0xABC123...`)
3. Visit Sui Explorer:
   - Testnet: https://suiexplorer.com/?network=testnet
   - Or the explorer URL shown in your console
4. Search for your transaction
5. Under "Events" tab, you should see:
   - `PlayerCreated` event
   - Your address as the entity ID

---

## 🧪 Test 2: Movement Transaction Recording

This verifies that movements are written to the blockchain.

### Steps:
1. **Type a movement command**: `n` (or click North button)
2. **Watch the console** for:
   ```
   📍 Position: (0, 0)
   🔍 Querying blockchain for location data...
   ✅ Moved to old_road (0, 5) on blockchain
   ```

3. **In the game terminal**, you should see:
   ```
   > n
   ⏳ Recording movement on blockchain...
   ✅ Movement recorded on blockchain
   
   You move north...
   
   The Old Road
   What remains of an ancient highway stretches before you...
   📍 Position: (0, 5)
   ```

### What This Proves:
- ✅ Movement command creates a blockchain transaction
- ✅ `move_player(0, 5)` was called on smart contract
- ✅ Your position was updated on-chain

### How to Verify on Blockchain:
1. Each movement creates a new transaction
2. In console, find: `✅ Moved to old_road (0, 5) on blockchain`
3. Check the transaction in Sui Explorer
4. Verify it calls `move_player` with params `[0, 5]`

---

## 🧪 Test 3: Loading Existing Player (THE KEY TEST)

**This is the most important test** - it proves your data persists on blockchain.

### Steps:
1. **After completing Test 2**, move to a few different locations (n, e, w, etc.)
2. **Note your final position** (e.g., "Rocky Outcrop at (10, 15)")
3. **Refresh the page** (`Ctrl+R` or `F5`)
4. **Watch the console carefully**:
   ```
   🏠 Address initialized/changed: 0xYOUR_ADDRESS_HERE
   🔍 Querying blockchain for player state...
   📍 Loaded player state from blockchain: rocky_outcrop (10, 15), HP: 50, Level: 1
   ```

5. **In the game terminal**, you should see:
   ```
   ✅ Welcome back, Survivor! Loading your journey from the blockchain...
   📍 Location: Rocky Outcrop
   ❤️  Health: 50 | Level: 1 | XP: 0
   ```

### What This Proves:
- ✅ `loadPlayerStateFromChain()` successfully queries the blockchain
- ✅ `get_player_position()` returns your saved coordinates
- ✅ `get_player_stats()` returns your health/level/xp
- ✅ Game resumes from blockchain state, not starting over
- ✅ **Your wallet address is the key to your persistent game state**

### Critical Verification:
- **If you see the intro again** ("The year is 2089...") → Player not loading from blockchain ❌
- **If you see "Welcome back"** → Loading from blockchain works! ✅
- **If position matches where you were** → Perfect! ✅

---

## 🧪 Test 4: Query Commands Read Blockchain

This verifies that read operations query the blockchain.

### Steps:
1. **Type command**: `look`
2. **Watch console**:
   ```
   🔍 Querying blockchain for location data...
   ✅ Location data from blockchain: [data]
   ```

3. **In the game terminal**:
   ```
   > look
   🔍 Querying blockchain for location data...
   ✅ Location data from blockchain:
   
   Rocky Outcrop
   Jagged rocks rise from the dust, forming a natural barrier...
   ```

### What This Proves:
- ✅ `get_player_location()` queries the smart contract
- ✅ Location description comes from blockchain based on your (x, y) coordinates
- ✅ The smart contract's coordinate→location mapping works

---

## 🧪 Test 5: Multi-Wallet Test (Ultimate Proof)

This is the **definitive proof** that data is wallet-specific on blockchain.

### Steps:
1. **Connect Wallet A**, move to a specific location (e.g., Rocky Outcrop at 10, 15)
2. **Disconnect** and **connect Wallet B**
3. **Wallet B should start fresh** at (0, 0) with "Initializing new player"
4. **Move Wallet B** to a different location (e.g., Old Road at 0, 5)
5. **Switch back to Wallet A**
6. **Wallet A should still be at Rocky Outcrop** (10, 15)

### What This Proves:
- ✅ Each wallet address has separate blockchain state
- ✅ Game data is truly decentralized and persistent per address
- ✅ No centralized database - all state is on Sui blockchain

---

## 🔍 Console Log Cheat Sheet

### Successful Blockchain Operations:
```javascript
✅ Player initialized on blockchain          // New player created
✅ Moved to [location] (x, y) on blockchain  // Movement recorded
📍 Loaded player state from blockchain       // State retrieved
✅ Location data from blockchain            // Query succeeded
```

### Error Indicators:
```javascript
❌ Failed to load player state              // Query failed
❌ Blockchain transaction failed            // Transaction rejected
⚠️ No address available                     // Wallet not connected
❌ Player initialization failed             // Contract error
```

---

## 🐛 Troubleshooting

### Issue: "Welcome back" shows but position is always (0, 0)
**Diagnosis:** Query works but returns default values

**Check:**
```javascript
// In console, after page load, type:
const { contract, dubheSchemaId, address } = useDubhe();
await contract.query.main_system.get_player_position({ params: [dubheSchemaId, address] });
```

**Expected:** `[10, 15]` (your actual position)
**If you get:** `[0, 0]` → Smart contract not storing position correctly

---

### Issue: Always shows intro, never "Welcome back"
**Diagnosis:** `loadPlayerStateFromChain()` not finding player

**Check:**
1. Does player exist on blockchain?
2. In console after first movement:
   ```javascript
   await contract.query.main_system.get_player_stats({ params: [dubheSchemaId, address] });
   ```
3. **Expected:** `[50, 0, 1]` (health, exp, level)
4. **If error:** Player wasn't initialized properly

---

### Issue: Movement doesn't change location
**Diagnosis:** Transaction succeeds but position not updating

**Check:** In console after moving:
```javascript
await contract.query.main_system.get_player_position({ params: [dubheSchemaId, address] });
```

Should return new coordinates matching your movement.

---

## 📊 Manual Verification via Smart Contract Queries

You can manually query the blockchain state at any time:

### Get Your Current Position:
```javascript
// Open browser console at /mud
const { contract, dubheSchemaId, address } = window.__DUBHE__;
const pos = await contract.query.main_system.get_player_position({ 
  params: [dubheSchemaId, address] 
});
console.log('Position:', pos); // [x, y]
```

### Get Your Stats:
```javascript
const stats = await contract.query.main_system.get_player_stats({ 
  params: [dubheSchemaId, address] 
});
console.log('Health:', stats[0], 'XP:', stats[1], 'Level:', stats[2]);
```

### Get Your Location Description:
```javascript
const location = await contract.query.main_system.get_player_location({ 
  params: [dubheSchemaId, address] 
});
console.log('Location:', location[0]); // Name
console.log('Description:', location[1]); // Description
```

---

## ✅ Success Checklist

Your blockchain integration is working correctly if:

- [ ] First visit shows "Initializing player on blockchain"
- [ ] Console logs show transaction hash after initialization
- [ ] Movement commands show "⏳ Recording movement on blockchain..."
- [ ] Each movement logs "✅ Movement recorded on blockchain"
- [ ] **After refresh, you see "Welcome back" (NOT the intro)**
- [ ] **After refresh, your position matches where you left off**
- [ ] Look command queries blockchain and shows correct location
- [ ] Console shows `📍 Loaded player state from blockchain: [location] (x, y)`
- [ ] Switching wallets creates separate game states
- [ ] Manual queries return your actual position/stats

---

## 🎯 The Ultimate Test

**To be 100% certain:**

1. Move to Rocky Outcrop (type: `e`, `e`, `n`, `n`)
2. Note console log: `📍 Position: (10, 15)`
3. **Close browser completely** (not just the tab)
4. **Open browser again**, go to `/mud`
5. **Connect same wallet**
6. **You should see:** "Welcome back, Survivor!"
7. **Type:** `look`
8. **You should see:** "Rocky Outcrop" description

**If this works → Your wallet data is 100% loading from blockchain! ✅**

---

## 🔗 Quick Reference Links

- **Sui Testnet Explorer**: https://suiexplorer.com/?network=testnet
- **Your Smart Contract**: `/packages/contracts/src/rise/sources/systems/rise.move`
- **Blockchain Functions**: See `RISE_GAME_CONTRACTS.md`
- **Integration Code**: `blockchainGameEngine.ts`

---

**Last Updated:** Based on current implementation
**Framework:** Dubhe ECS + Sui Move
**Pattern:** Transaction + TransactionResult with query functions
