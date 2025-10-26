"use client";
import React from "react";
import { OutputLine } from "./gameEngine";

type Props = {
  outputHistory: OutputLine[];
  hp: number;
  hunger: number;
  thirst: number;
  inputValue: string;
  onInputChange: (value: string) => void;
  onInputSubmit: (e: React.FormEvent) => void;
  outputRef: React.RefObject<HTMLDivElement>;
};

export default function GameOutput({ 
  outputHistory, 
  hp, 
  hunger, 
  thirst, 
  inputValue, 
  onInputChange, 
  onInputSubmit,
  outputRef 
}: Props) {
  const getTextColor = (type: OutputLine['type']) => {
    switch (type) {
      case 'highlight': return 'text-yellow-400';
      case 'warning': return 'text-orange-400';
      case 'error': return 'text-red-400';
      case 'success': return 'text-green-400';
      default: return 'text-green-300';
    }
  };

  const getStatColor = (value: number, max: number = 100) => {
    const percentage = (value / max) * 100;
    if (percentage < 30) return 'text-red-400';
    if (percentage < 60) return 'text-orange-400';
    return 'text-green-400';
  };

  return (
    <div className="mt-4 mud-box">
      {/* Scrolling output area */}
      <div 
        ref={outputRef}
        className="bg-black p-3 rounded text-sm max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-green-700 scrollbar-track-black"
      >
        {outputHistory.map((line, idx) => (
          <div key={idx} className={`${getTextColor(line.type)} font-mono whitespace-pre-wrap`}>
            {line.text || '\u00A0'}
          </div>
        ))}
      </div>

      {/* Status bar */}
      <div className="mt-3 pt-3 border-t border-green-700">
        <div className="text-green-300 font-mono text-sm mb-2">
          [ HP:<span className={getStatColor(hp)}>{hp}</span> 
          {' '}Hunger:<span className={getStatColor(hunger)}>{hunger}</span>
          {' '}Thirst:<span className={getStatColor(thirst)}>{thirst}</span> ]
        </div>

        {/* Command input */}
        <form onSubmit={onInputSubmit} className="flex items-center gap-2">
          <span className="text-green-300 font-mono">{'>'}</span>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            className="flex-1 bg-black text-green-300 font-mono text-sm border-none outline-none focus:text-green-100"
            placeholder="Type a command..."
            autoFocus
          />
          <span className="text-green-300 font-mono blink-cursor">_</span>
        </form>
      </div>
    </div>
  );
}
