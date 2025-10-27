"use client";
import React, { useState, useEffect, useRef } from "react";
import GameLayout from "./GameLayout";
import Header from "./Header";
import CommandGrid from "./CommandGrid";
import GameOutput from "./GameOutput";
import { GameState, INITIAL_STATE, LOCATIONS } from "./gameEngine";
import { 
  processCommandWithBlockchain, 
  movePlayerOnChain,
  loadPlayerStateFromChain,
  getLocationFromChain,
  getNearbyLandmarksFromChain,
  initializePlayerOnChain,
  LOCATION_TO_COORDS
} from "./blockchainGameEngine";
import { useDubhe } from "@0xobelisk/react/sui";

export default function MudUI() {
  const { contract, dubheSchemaId, address } = useDubhe();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [inputValue, setInputValue] = useState("");
  const outputRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [gameState.outputHistory]);

  // Initialize player on blockchain when wallet is connected
  useEffect(() => {
    if (contract && dubheSchemaId && address && !isInitialized) {
      setIsLoading(true);
      
      // Try to load existing player state
      loadPlayerStateFromChain(contract, dubheSchemaId, address)
        .then(playerState => {
          if (playerState) {
            // Player exists on blockchain
            setGameState(prev => ({
              ...prev,
              currentLocation: playerState.location,
              hp: playerState.health,
              experience: playerState.experience,
              level: playerState.level,
              outputHistory: [
                { text: "═══════════════════════════════════════════════════", type: "normal" },
                { text: "          R I S E", type: "highlight" },
                { text: "    A POST-APOCALYPTIC TEXT ADVENTURE", type: "normal" },
                { text: "═══════════════════════════════════════════════════", type: "normal" },
                { text: "", type: "normal" },
                { text: "💎 Blockchain-Enabled Game", type: "success" },
                { text: "All movements are recorded on Sui blockchain", type: "success" },
                { text: "", type: "normal" },
                { text: `✅ Welcome back, Survivor! Loading your journey from the blockchain...`, type: "success" },
                { text: `📍 Location: ${LOCATIONS[playerState.location]?.name || "Unknown"}`, type: "normal" },
                { text: `❤️  Health: ${playerState.health} | Level: ${playerState.level} | XP: ${playerState.experience}`, type: "normal" },
                { text: "", type: "normal" },
                { text: 'Type "help" for commands. Type "look" to examine your surroundings.', type: "normal" },
              ]
            }));
            setIsInitialized(true);
          } else {
            // Player doesn't exist - show intro and initialize
            setGameState(prev => ({
              ...prev,
              outputHistory: [
                { text: "═══════════════════════════════════════════════════", type: "normal" },
                { text: "          R I S E", type: "highlight" },
                { text: "    A POST-APOCALYPTIC TEXT ADVENTURE", type: "normal" },
                { text: "═══════════════════════════════════════════════════", type: "normal" },
                { text: "", type: "normal" },
                { text: "💎 Blockchain-Enabled Game", type: "success" },
                { text: "All movements are recorded on Sui blockchain", type: "success" },
                { text: "", type: "normal" },
                { text: "⏳ Initializing new player on blockchain...", type: "warning" },
              ]
            }));
            
            // Initialize player
            initializePlayerOnChain(
              contract,
              dubheSchemaId,
              "Survivor",
              () => {
                // Success
                setGameState(prev => ({
                  ...prev,
                  outputHistory: [
                    ...prev.outputHistory,
                    { text: "✅ Player initialized on blockchain!", type: "success" },
                    { text: "", type: "normal" },
                    { text: "The year is 2089. The world as you knew it ended thirty years ago.", type: "normal" },
                    { text: "You are one of the few survivors, wandering the barren wasteland", type: "normal" },
                    { text: "in search of... something. Anything.", type: "normal" },
                    { text: "", type: "normal" },
                    { text: "Your story begins here.", type: "highlight" },
                    { text: "", type: "normal" },
                    { text: 'Type "help" for commands. Type "look" to examine your surroundings.', type: "normal" },
                  ]
                }));
                setIsInitialized(true);
              },
              (error) => {
                // Error
                setGameState(prev => ({
                  ...prev,
                  outputHistory: [
                    ...prev.outputHistory,
                    { text: `❌ Failed to initialize player: ${error.message}`, type: "error" },
                  ]
                }));
              }
            );
          }
          setIsLoading(false);
        })
        .catch(error => {
          console.error("Error loading player state:", error);
          setIsLoading(false);
        });
    }
  }, [contract, dubheSchemaId, address, isInitialized]);

  const handleCommand = async (command: string) => {
    if (!contract || !dubheSchemaId || !address) {
      setGameState(prev => ({
        ...prev,
        outputHistory: [
          ...prev.outputHistory,
          { text: `> ${command}`, type: "normal" },
          { text: "❌ Please connect your wallet to play.", type: "error" }
        ]
      }));
      return;
    }

    if (isLoading) return; // Prevent commands while loading

    const cmd = command.trim().toLowerCase();
    
    // Process command with blockchain integration
    const result = await processCommandWithBlockchain(
      gameState,
      command,
      contract,
      dubheSchemaId,
      address
    );

    // Update state with pending transaction message if needed
    setGameState(result.newState);

    // Handle movement commands - requires blockchain transaction
    if (result.requiresTransaction && result.transactionPending) {
      const direction = cmd.charAt(0);
      const location = LOCATIONS[gameState.currentLocation];
      const targetLocation = location.exits[direction];
      
      if (targetLocation) {
        setIsLoading(true);
        
        // Execute blockchain transaction
        movePlayerOnChain(
          contract,
          dubheSchemaId,
          targetLocation,
          async (txResult) => {
            // Transaction successful - update local state
            const newLocation = LOCATIONS[targetLocation];
            const coords = LOCATION_TO_COORDS[targetLocation];
            
            setGameState(prev => ({
              ...prev,
              currentLocation: targetLocation,
              outputHistory: [
                ...prev.outputHistory.slice(0, -1), // Remove pending message
                { text: "✅ Movement recorded on blockchain", type: "success" },
                { text: "", type: "normal" },
                { text: `You move ${direction === "n" ? "north" : direction === "s" ? "south" : direction === "e" ? "east" : direction === "w" ? "west" : direction === "u" ? "up" : "down"}...`, type: "normal" },
                { text: "", type: "normal" },
                { text: newLocation.name, type: "highlight" },
                { text: newLocation.description, type: "normal" },
                { text: `📍 Position: (${coords.x}, ${coords.y})`, type: "normal" },
              ]
            }));
            setIsLoading(false);
          },
          (error) => {
            // Transaction failed
            setGameState(prev => ({
              ...prev,
              outputHistory: [
                ...prev.outputHistory.slice(0, -1), // Remove pending message
                { text: `❌ Blockchain transaction failed: ${error.message}`, type: "error" },
              ]
            }));
            setIsLoading(false);
          }
        );
      }
    }
    
    // Handle look command - query blockchain
    else if (cmd === "look" || cmd === "l") {
      setIsLoading(true);
      
      const locationData = await getLocationFromChain(contract, dubheSchemaId, address);
      const landmarks = await getNearbyLandmarksFromChain(contract, dubheSchemaId, address);
      
      if (locationData) {
        setGameState(prev => ({
          ...prev,
          outputHistory: [
            ...prev.outputHistory.slice(0, -1), // Remove querying message
            { text: "✅ Location data from blockchain:", type: "success" },
            { text: "", type: "normal" },
            { text: locationData.name, type: "highlight" },
            { text: locationData.description, type: "normal" },
            ...(landmarks.length > 0 ? [
              { text: "", type: "normal" as const },
              { text: "Nearby landmarks:", type: "normal" as const },
              ...landmarks.map(l => ({ text: `  • ${l}`, type: "normal" as const }))
            ] : [])
          ]
        }));
      }
      
      setIsLoading(false);
    }
    
    setInputValue("");
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      handleCommand(inputValue);
    }
  };

  return (
    <GameLayout>
      <Header />

      <main>
        <CommandGrid onCommand={handleCommand} />

        <GameOutput 
          outputHistory={gameState.outputHistory}
          hp={gameState.hp}
          hunger={gameState.hunger}
          thirst={gameState.thirst}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onInputSubmit={handleInputSubmit}
          outputRef={outputRef}
        />
      </main>
    </GameLayout>
  );
}
