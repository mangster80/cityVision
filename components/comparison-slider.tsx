"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";

interface ComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export function ComparisonSlider({
  beforeImage,
  afterImage,
  beforeLabel = "Före",
  afterLabel = "Vision",
}: ComparisonSliderProps) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const clamped = Math.max(0, Math.min(x, rect.width));
    const percentage = (clamped / rect.width) * 100;
    setPosition(percentage);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) handleMove(e.clientX);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      className="relative h-full w-full select-none overflow-hidden rounded-2xl"
      style={{ cursor: "ew-resize", touchAction: "none" }}
    >
      {/* After / Vision (Full underneath) */}
      <div className="absolute inset-0 h-full w-full">
        <Image
          src={afterImage}
          alt={afterLabel}
          fill
          unoptimized
          className="object-cover"
        />
      </div>

      {/* Before (Clipped on top) */}
      <div
        className="absolute inset-0 h-full w-full overflow-hidden"
        style={{ width: `${position}%` }}
      >
        <div className="relative h-full w-full min-w-full" style={{ width: containerRef.current ? `${containerRef.current.offsetWidth}px` : "100%" }}>
          <Image
            src={beforeImage}
            alt={beforeLabel}
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      </div>

      {/* Badges - Uniform overlay with smooth fade when sliding past */}
      <span
        className={`pointer-events-none absolute bottom-3 left-3 z-20 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md transition-opacity duration-200 ${
          position < 12 ? "opacity-0" : "opacity-100"
        }`}
      >
        {beforeLabel}
      </span>
      <span
        className={`pointer-events-none absolute bottom-3 right-3 z-20 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md transition-opacity duration-200 ${
          position > 88 ? "opacity-0" : "opacity-100"
        }`}
      >
        {afterLabel}
      </span>

      {/* Divider Bar */}
      <div
        className="absolute bottom-0 top-0 z-20 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)]"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-ink text-xs text-white shadow-xl">
          ↔
        </div>
      </div>
    </div>
  );
}
