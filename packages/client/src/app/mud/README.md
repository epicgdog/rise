# RISE - Post-Apocalyptic MUD Game

A text-based adventure game set in a desolate post-apocalyptic wasteland.

## How to Play

Navigate to `/mud` in your browser after starting the dev server.

### Available Commands

**Movement:**
- `n`, `s`, `e`, `w` - Move north, south, east, west
- `u`, `d` - Move up or down (when available)

**Exploration:**
- `look` - Examine your current location in detail
- `map` - Consult your map to see visible landmarks

**Character:**
- `inventory` (or `inv`, `i`) - Check what you're carrying
- `score` (or `stats`) - View your health, hunger, and thirst levels

**Other:**
- `help` - Display command list
- Type commands directly in the input field or click the buttons

## Story

You wake in a world that has ended. The skies are gray, the earth is cracked and barren, and you are utterly alone. Armed only with a tattered map and a few meager supplies, you must explore the wasteland, survive its harsh conditions, and perhaps discover what caused the collapse of civilization.

## Game Features

- **12+ explorable locations** including wastelands, ruined roads, dry riverbeds, and mysterious caves
- **Dynamic inventory system** with food, water, and tools
- **Survival mechanics** tracking HP, hunger, and thirst
- **Map system** showing landmarks and points of interest
- **Atmospheric descriptions** bringing the dead world to life
- **Retro terminal aesthetic** with modern glowing effects

## Technical Details

- Built with React, Next.js, and Tailwind CSS
- Fully client-side game engine (`gameEngine.ts`)
- Monospaced terminal font with neon green/orange glow effects
- Responsive command grid and scrolling output window
- Type-safe TypeScript implementation

## Future Enhancements

- Items to find and use
- Consumable food/water with effects
- Random encounters
- Day/night cycle
- Save/load game state
- Multiple endings based on choices
