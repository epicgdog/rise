module rise::main_system {
    use dubhe::dapp_service::DappHub;
    use std::ascii::{string, String};
    
    // Import RISE game components
    use rise::player;
    use rise::landmark;
    use rise::monster;
    use rise::health;
    use rise::experience;
    use rise::level;
    use rise::name;
    use rise::description;
    use rise::position;

    // Constants for game initialization
    const STARTING_HEALTH: u32 = 50;
    const STARTING_EXPERIENCE: u32 = 0;
    const STARTING_LEVEL: u32 = 1;
    const STARTING_X: u32 = 0;  // wasteland_start coordinates
    const STARTING_Y: u32 = 0;

    // Monster constants for rocky terrain
    const MONSTER_HEALTH: u32 = 30;
    const MONSTER_X: u32 = 10;  // rocky_outcrop coordinates
    const MONSTER_Y: u32 = 15;

    /// Initialize a new player or load existing player data
    /// This function checks if the player already exists (returning player) and loads their data,
    /// or creates a new player with default starting values
    public entry fun initialize_player(
        dapp_hub: &mut DappHub, 
        player_name: String,
        ctx: &mut TxContext
    ) {
        let player_address = ctx.sender();
        
        // Check if player already exists (returning player)
        if (player::has(dapp_hub, player_address)) {
            // Player exists, data is already stored on-chain, no need to reload
            // The client will query the existing data from the blockchain
            return
        };
        
        // New player - initialize with default values
        player::set(dapp_hub, player_address);
        health::set(dapp_hub, player_address, STARTING_HEALTH);
        experience::set(dapp_hub, player_address, STARTING_EXPERIENCE);
        level::set(dapp_hub, player_address, STARTING_LEVEL);
        name::set(dapp_hub, player_address, player_name);
        
        // Set starting position at wasteland_start (0, 0)
        position::set(dapp_hub, player_address, STARTING_X, STARTING_Y);
    }

    /// Initialize landmarks across the game world
    /// Each landmark is stored as an entity with position, name, and description
    /// This should be called once during game deployment to set up the world
    public entry fun initialize_landmarks(
        dapp_hub: &mut DappHub,
        ctx: &mut TxContext
    ) {
        // We'll use deterministic addresses for landmarks based on their ID
        // For simplicity, we create landmark entities and store their data
        
        // Landmark 1: Wasteland Start (0, 0)
        let landmark_1 = @0x1;
        landmark::set(dapp_hub, landmark_1);
        position::set(dapp_hub, landmark_1, 0, 0);
        name::set(dapp_hub, landmark_1, string(b"The Wasteland - Ground Zero"));
        description::set(dapp_hub, landmark_1, string(b"An endless expanse of cracked earth and ash. The sky is sickly gray."));

        // Landmark 2: Old Road (0, 5)
        let landmark_2 = @0x2;
        landmark::set(dapp_hub, landmark_2);
        position::set(dapp_hub, landmark_2, 0, 5);
        name::set(dapp_hub, landmark_2, string(b"The Old Road"));
        description::set(dapp_hub, landmark_2, string(b"Buckled asphalt riddled with cracks. Rusted car husks sit abandoned."));

        // Landmark 3: Rusted Tower (10, 0)
        let landmark_3 = @0x3;
        landmark::set(dapp_hub, landmark_3);
        position::set(dapp_hub, landmark_3, 10, 0);
        name::set(dapp_hub, landmark_3, string(b"The Rusted Tower"));
        description::set(dapp_hub, landmark_3, string(b"A skeletal radio tower looms above, corroded and twisted."));

        // Landmark 4: Dry Riverbed (0, 10)  // Using positive coords for simplicity
        let landmark_4 = @0x4;
        landmark::set(dapp_hub, landmark_4);
        position::set(dapp_hub, landmark_4, 0, 10);
        name::set(dapp_hub, landmark_4, string(b"The Dry Riverbed"));
        description::set(dapp_hub, landmark_4, string(b"A cracked channel of sun-baked mud and jagged stones."));

        // Landmark 5: Ash Plains (5, 0)
        let landmark_5 = @0x5;
        landmark::set(dapp_hub, landmark_5);
        position::set(dapp_hub, landmark_5, 5, 0);
        name::set(dapp_hub, landmark_5, string(b"The Ash Plains"));
        description::set(dapp_hub, landmark_5, string(b"Endless plains of fine ash. Each step sends up clouds of gray dust."));

        // Landmark 6: Rocky Outcrop (10, 15)
        let landmark_6 = @0x6;
        landmark::set(dapp_hub, landmark_6);
        position::set(dapp_hub, landmark_6, MONSTER_X, MONSTER_Y);
        name::set(dapp_hub, landmark_6, string(b"Rocky Outcrop"));
        description::set(dapp_hub, landmark_6, string(b"A rocky outcrop overlooking the wasteland. A cave entrance yawns nearby."));

        // Landmark 7: Cave Entrance (10, 20)
        let landmark_7 = @0x7;
        landmark::set(dapp_hub, landmark_7);
        position::set(dapp_hub, landmark_7, 10, 20);
        name::set(dapp_hub, landmark_7, string(b"Cave Entrance"));
        description::set(dapp_hub, landmark_7, string(b"A dark cave offering shelter from the harsh wasteland."));
    }

    /// Initialize a monster at the rocky terrain area
    /// This creates a hostile entity that players may encounter
    public entry fun initialize_monster_rocky_terrain(
        dapp_hub: &mut DappHub,
        ctx: &mut TxContext
    ) {
        // Use a deterministic address for the rocky terrain monster
        let monster_address = @0x999;
        
        // Initialize monster entity
        monster::set(dapp_hub, monster_address);
        health::set(dapp_hub, monster_address, MONSTER_HEALTH);
        name::set(dapp_hub, monster_address, string(b"Wasteland Prowler"));
        description::set(dapp_hub, monster_address, string(b"A twisted creature adapted to the harsh wasteland. Its eyes glow with feral hunger."));
        position::set(dapp_hub, monster_address, MONSTER_X, MONSTER_Y);
        
        // Monsters start at level 1 with no experience
        level::set(dapp_hub, monster_address, 1);
        experience::set(dapp_hub, monster_address, 0);
    }

    /// Move player to a new position
    /// This records each movement command on the blockchain
    /// After moving, the client should query get_player_location to get the new description
    public entry fun move_player(
        dapp_hub: &mut DappHub,
        new_x: u32,
        new_y: u32,
        ctx: &mut TxContext
    ) {
        let player_address = ctx.sender();
        
        // Ensure player exists
        player::ensure_has(dapp_hub, player_address);
        
        // Update player position
        position::set(dapp_hub, player_address, new_x, new_y);
    }
    
    /// Check if there's a monster at the player's current location
    /// Returns true if player is at the same position as a monster
    public fun check_monster_at_location(
        dapp_hub: &DappHub,
        player_address: address
    ): bool {
        let (player_x, player_y) = position::get(dapp_hub, player_address);
        
        // Check if monster exists at this location
        let monster_address = @0x999;
        if (monster::has(dapp_hub, monster_address)) {
            let (monster_x, monster_y) = position::get(dapp_hub, monster_address);
            player_x == monster_x && player_y == monster_y
        } else {
            false
        }
    }

    /// Get player's current position
    public fun get_player_position(
        dapp_hub: &DappHub,
        player_address: address
    ): (u32, u32) {
        position::get(dapp_hub, player_address)
    }

    /// Get player's current location name and description based on their position
    /// Returns the landmark name and description for the player's current coordinates
    public fun get_player_location(
        dapp_hub: &DappHub,
        player_address: address
    ): (String, String) {
        let (x, y) = position::get(dapp_hub, player_address);
        
        // Match coordinates to landmarks
        if (x == 0 && y == 0) {
            // Landmark 1: Wasteland Start
            (
                string(b"The Wasteland - Ground Zero"),
                string(b"You stand in the middle of an endless expanse of cracked earth and ash. The sky above is a sickly gray, thick with dust that blots out any hint of sun. The air tastes metallic, bitter. There are no trees, no grass, no sign of life—just endless desolation stretching in every direction.")
            )
        } else if (x == 0 && y == 5) {
            // Landmark 2: Old Road
            (
                string(b"The Old Road"),
                string(b"What remains of an ancient highway stretches before you—buckled asphalt riddled with deep cracks, weeds long dead and fossilized in the fissures. Rusted car husks sit abandoned, their windows shattered, their frames stripped bare by time and scavengers. The silence here is oppressive; even the wind seems reluctant to disturb this graveyard of the old world.")
            )
        } else if (x == 10 && y == 0) {
            // Landmark 3: Rusted Tower
            (
                string(b"The Rusted Tower"),
                string(b"A skeletal radio tower looms above you, its metal frame corroded and twisted. It leans precariously, as if one strong gust could topple it entirely. At its base, scattered debris—broken glass, twisted metal, scraps of unidentifiable cloth—litters the ground. The tower groans softly in the wind, a mournful sound.")
            )
        } else if (x == 0 && y == 10) {
            // Landmark 4: Dry Riverbed
            (
                string(b"The Dry Riverbed"),
                string(b"You stand in what was once a river, now a cracked channel of sun-baked mud and jagged stones. The bed is littered with the detritus of a lost civilization: rusted shopping carts, waterlogged books turned to pulp and dust, plastic bottles bleached white by the harsh sun. Occasionally, you see the faint outline of old bridges in the distance, their spans long collapsed.")
            )
        } else if (x == 5 && y == 0) {
            // Landmark 5: Ash Plains
            (
                string(b"The Ash Plains"),
                string(b"An endless plain of fine ash stretches before you, disturbed only by your footprints. Each step sends up tiny clouds of gray dust that hang in the still air. The silence here is absolute—no wind, no sound, just the soft crunch of ash beneath your feet. The monotony of this place is suffocating.")
            )
        } else if (x == 10 && y == 15) {
            // Landmark 6: Rocky Outcrop
            (
                string(b"Rocky Outcrop"),
                string(b"You've climbed to a rocky outcrop overlooking the wasteland. From here, the devastation is laid bare—kilometer after kilometer of dead land stretching to the horizon. The view is both terrible and humbling. A small cave entrance yawns in the rock face nearby. The Wasteland Prowler lurks here.")
            )
        } else if (x == 10 && y == 20) {
            // Landmark 7: Cave Entrance
            (
                string(b"Cave Entrance"),
                string(b"A dark cave opens before you, offering shelter from the harsh wasteland. The darkness within is absolute—entering without light would be foolish. The cave mouth provides some protection from the elements, and you can hear the faint drip of water echoing from deep within.")
            )
        } else {
            // Unknown location - generic wasteland description
            (
                string(b"The Wasteland"),
                string(b"You wander through barren, lifeless terrain. Cracked earth stretches in all directions, broken only by scattered debris and the occasional twisted remnant of the world that was. The gray sky presses down like a weight, and you are utterly alone.")
            )
        }
    }

    /// Get player's stats
    public fun get_player_stats(
        dapp_hub: &DappHub,
        player_address: address
    ): (u32, u32, u32) {
        let hp = health::get(dapp_hub, player_address);
        let exp = experience::get(dapp_hub, player_address);
        let lvl = level::get(dapp_hub, player_address);
        (hp, exp, lvl)
    }
    
    /// Get nearby landmarks based on player position
    /// Returns a list of visible landmarks from the current location
    public fun get_nearby_landmarks(
        dapp_hub: &DappHub,
        player_address: address
    ): vector<String> {
        let (x, y) = position::get(dapp_hub, player_address);
        let mut landmarks = vector::empty<String>();
        
        // Based on current position, add nearby landmarks
        if (x == 0 && y == 0) {
            // From Wasteland Start, you can see:
            landmarks.push_back(string(b"Old Road (north)"));
            landmarks.push_back(string(b"Rusted Tower (east)"));
            landmarks.push_back(string(b"Dry Riverbed (south)"));
            landmarks.push_back(string(b"Ash Plains (west)"));
        } else if (x == 0 && y == 5) {
            // From Old Road
            landmarks.push_back(string(b"Wasteland Start (south)"));
            landmarks.push_back(string(b"Highway continues east and west"));
        } else if (x == 10 && y == 0) {
            // From Rusted Tower
            landmarks.push_back(string(b"Wasteland Start (west)"));
            landmarks.push_back(string(b"Rocky Outcrop (north)"));
        } else if (x == 0 && y == 10) {
            // From Dry Riverbed
            landmarks.push_back(string(b"Wasteland Start (north)"));
            landmarks.push_back(string(b"Riverbed continues east and west"));
        } else if (x == 5 && y == 0) {
            // From Ash Plains
            landmarks.push_back(string(b"Wasteland Start (east)"));
            landmarks.push_back(string(b"Ash dunes (west)"));
        } else if (x == 10 && y == 15) {
            // From Rocky Outcrop
            landmarks.push_back(string(b"Rusted Tower (south)"));
            landmarks.push_back(string(b"Cave Entrance (north)"));
            landmarks.push_back(string(b"DANGER: Wasteland Prowler nearby!"));
        } else if (x == 10 && y == 20) {
            // From Cave Entrance
            landmarks.push_back(string(b"Rocky Outcrop (south)"));
            landmarks.push_back(string(b"Dark cave interior"));
        } else {
            landmarks.push_back(string(b"Endless wasteland in all directions"));
        };
        
        landmarks
    }

    /// Update player health (for taking damage or healing)
    public entry fun update_player_health(
        dapp_hub: &mut DappHub,
        health_change: u32,
        is_damage: bool,
        ctx: &mut TxContext
    ) {
        let player_address = ctx.sender();
        player::ensure_has(dapp_hub, player_address);
        
        let current_health = health::get(dapp_hub, player_address);
        let new_health = if (is_damage) {
            if (current_health > health_change) {
                current_health - health_change
            } else {
                0  // Player is dead
            }
        } else {
            current_health + health_change  // Healing
        };
        
        health::set(dapp_hub, player_address, new_health);
    }

    /// Grant experience to player and handle level-up
    public entry fun grant_experience(
        dapp_hub: &mut DappHub,
        exp_amount: u32,
        ctx: &mut TxContext
    ) {
        let player_address = ctx.sender();
        player::ensure_has(dapp_hub, player_address);
        
        let current_exp = experience::get(dapp_hub, player_address);
        let current_level = level::get(dapp_hub, player_address);
        let new_exp = current_exp + exp_amount;
        
        experience::set(dapp_hub, player_address, new_exp);
        
        // Simple level-up logic: 100 exp per level
        let exp_for_next_level = current_level * 100;
        if (new_exp >= exp_for_next_level) {
            let new_level = current_level + 1;
            level::set(dapp_hub, player_address, new_level);
            
            // Heal player on level up
            let max_health = 50 + (new_level - 1) * 10;  // 50 base + 10 per level
            health::set(dapp_hub, player_address, max_health);
        };
    }
}