"use client";
import React, { useState, useEffect, useRef } from "react";
import GameLayout from "./GameLayout";
import Header from "./Header";
import CommandGrid from "./CommandGrid";
import GameOutput from "./GameOutput";
import { GameState, INITIAL_STATE, processCommand, getIntroText } from "./gameEngine";

export default function MudUI() {
  const [gameState, setGameState] = useState<GameState>(() => ({
    ...INITIAL_STATE,
    outputHistory: getIntroText()
  }));
  const [inputValue, setInputValue] = useState("");
  const outputRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [gameState.outputHistory]);

  const handleCommand = (cmd: string) => {
    const newState = processCommand(gameState, cmd);
    setGameState(newState);
    setInputValue("");
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
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
