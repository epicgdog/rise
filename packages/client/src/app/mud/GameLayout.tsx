"use client";
import React from "react";

type Props = {
  children: React.ReactNode;
};

export default function GameLayout({ children }: Props) {
  return (
    <div className="mud-root min-h-screen flex items-start justify-center p-8">
      <div className="w-full max-w-5xl">
        <div className="mud-box bg-black">
          {children}
        </div>
      </div>
    </div>
  );
}
