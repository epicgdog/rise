"use client";
import React from "react";

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-center text-sm text-green-300 font-mono mb-2">{children}</div>
);

const CommandButton: React.FC<{ cmd: string; onClick: (cmd: string) => void }> = ({ cmd, onClick }) => (
  <button
    type="button"
    className="block w-full text-left px-2 py-1 text-green-300 font-mono text-sm hover:text-green-50 glow-hover transition-colors"
    title={`Run command ${cmd}`}
    onClick={() => onClick(cmd)}
  >
    <span className="inline-block px-1">{cmd}</span>
  </button>
);

type Props = {
  onCommand: (cmd: string) => void;
};

export default function CommandGrid({ onCommand }: Props) {
  return (
    <section className="grid grid-cols-3 gap-4 mb-4">
      <div className="mud-box">
        <SectionTitle>Movement</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          <CommandButton cmd="n" onClick={onCommand} />
          <CommandButton cmd="s" onClick={onCommand} />
          <CommandButton cmd="e" onClick={onCommand} />
          <CommandButton cmd="w" onClick={onCommand} />
          <CommandButton cmd="u" onClick={onCommand} />
          <CommandButton cmd="d" onClick={onCommand} />
        </div>
      </div>

      <div className="mud-box">
        <SectionTitle>Character</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          <CommandButton cmd="look" onClick={onCommand} />
          <CommandButton cmd="inventory" onClick={onCommand} />
          <CommandButton cmd="score" onClick={onCommand} />
          <CommandButton cmd="stats" onClick={onCommand} />
          <CommandButton cmd="map" onClick={onCommand} />
          <CommandButton cmd="help" onClick={onCommand} />
        </div>
      </div>

      <div className="mud-box">
        <SectionTitle>Actions</SectionTitle>
        <div className="grid grid-cols-1 gap-2">
          <CommandButton cmd="get" onClick={onCommand} />
          <CommandButton cmd="drop" onClick={onCommand} />
          <CommandButton cmd="use" onClick={onCommand} />
          <CommandButton cmd="examine" onClick={onCommand} />
        </div>
      </div>
    </section>
  );
}
