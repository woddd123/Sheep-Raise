import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { SheepEntity } from './SheepEntity';

const GRASS_ANIM_FRAMES = [
  'frame_0000.png', 'frame_0001.png', 'frame_0002.png', 'frame_0003.png',
  'frame_0006.png', 'frame_0007.png', 'frame_0008.png', 'frame_0009.png',
  'frame_0010.png', 'frame_0011.png'
];

// Preload frames to avoid flickering
if (typeof window !== 'undefined') {
  GRASS_ANIM_FRAMES.forEach(src => {
    const img = new Image();
    img.src = `/objects/grass/grass-ani/${src}`;
  });
}

function InteractiveGrass({ dec }: { key?: React.Key; dec: { id: string, x: number, y: number, scale: number } }) {
  const sheepList = useGameStore(state => state.sheepList);
  const weather = useGameStore(state => state.weather);
  const windDirection = useGameStore(state => state.windDirection);
  const windStrength = useGameStore(state => state.windStrength);
  const [frameIdx, setFrameIdx] = useState(-1); // -1 means standing grass (grass.png)
  const [isTrampled, setIsTrampled] = useState(false);

  // Check distance to all sheep to see if it gets trampled
  useEffect(() => {
    if (isTrampled) return;

    // We need to check distance. In CSS %, 1% is roughly 4px depending on container.
    // We'll use a simple threshold (e.g. within 3% distance).
    const checkInterval = setInterval(() => {
      // Find sheep elements by data attribute (since we don't have sheep positions in global state)
      const sheepElements = document.querySelectorAll('.sheep-entity');
      let trampled = false;
      
      sheepElements.forEach(el => {
        if (trampled) return;
        const rect = el.getBoundingClientRect();
        const grassEl = document.getElementById(`grass-${dec.id}`);
        if (!grassEl) return;
        const grassRect = grassEl.getBoundingClientRect();
        
        // Calculate center distances
        const sheepCx = rect.left + rect.width / 2;
        const sheepCy = rect.top + rect.height * 0.8; // Use bottom of sheep for footprint
        const grassCx = grassRect.left + grassRect.width / 2;
        const grassCy = grassRect.top + grassRect.height * 0.8;

        const dist = Math.sqrt(Math.pow(sheepCx - grassCx, 2) + Math.pow(sheepCy - grassCy, 2));
        
        if (dist < 30) { // Collision radius in pixels
          trampled = true;
        }
      });

      if (trampled) {
        setIsTrampled(true);
        setFrameIdx(0); // Start animation
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, [isTrampled, dec.id]);

  // Handle animation frames and recovery
  useEffect(() => {
    if (!isTrampled || frameIdx === -1) return;

    if (frameIdx < GRASS_ANIM_FRAMES.length - 1) {
      // Play animation
      const timer = setTimeout(() => {
        setFrameIdx(prev => prev + 1);
      }, 80);
      return () => clearTimeout(timer);
    } else {
      // Animation finished, wait and then recover
      const recoveryTimer = setTimeout(() => {
        setIsTrampled(false);
        setFrameIdx(-1);
      }, 3000); // Stay trampled for 3 seconds
      return () => clearTimeout(recoveryTimer);
    }
  }, [isTrampled, frameIdx]);

  return (
    <div
      id={`grass-${dec.id}`}
      className={`absolute pointer-events-none z-10 ${weather === 'windy' ? 'animate-wind-sway' : ''}`}
      style={{
        left: `${dec.x}%`,
        top: `${dec.y}%`,
        width: '32px',
        height: '32px',
        transform: `translate(-50%, -100%) scale(${dec.scale})${weather === 'windy' ? ` rotate(${windDirection * 0.1}deg)` : ''}`,
        zIndex: Math.round(dec.y) - 5,
        animation: weather === 'windy' ? `windSway ${2 - windStrength / 100}s ease-in-out infinite alternate` : 'none',
        animationDelay: `${Math.random() * 0.5}s`
      }}
    >
      <img 
        src={frameIdx === -1 ? '/objects/grass/grass.png' : `/objects/grass/grass-ani/${GRASS_ANIM_FRAMES[frameIdx]}`} 
        className="w-full h-full object-contain"
        style={{ imageRendering: 'pixelated' }}
        alt="grass" 
      />
    </div>
  );
}

export function SheepPen() {
  // Get current farm data
  const farms = useGameStore(state => state.farms);
  const currentFarmId = useGameStore(state => state.currentFarmId);
  const currentFarm = farms.find(f => f.id === currentFarmId) || farms[0];

  const sheepList = currentFarm?.sheepList || [];
  const feces = currentFarm?.feces || [];
  const grassTrails = currentFarm?.grassTrails || [];
  const grassDecorations = currentFarm?.grassDecorations || [];
  const fences = currentFarm?.fences || [];
  const hayFeeders = currentFarm?.hayFeeders || [];

  const clearOldGrassTrails = useGameStore(state => state.clearOldGrassTrails);
  const spawnGrass = useGameStore(state => state.spawnGrass);

  const buildMode = useGameStore(state => state.buildMode);
  const demolishMode = useGameStore(state => state.demolishMode);
  const pickUpMode = useGameStore(state => state.pickUpMode);
  const pickedUpSheepId = useGameStore(state => state.pickedUpSheepId);
  const dropTargetPos = useGameStore(state => state.dropTargetPos);
  const setDropTargetPos = useGameStore(state => state.setDropTargetPos);
  const cancelPickUpMode = useGameStore(state => state.cancelPickUpMode);
  const placeFence = useGameStore(state => state.placeFence);
  const removeFence = useGameStore(state => state.removeFence);
  const rotateFence = useGameStore(state => state.rotateFence);
  const hayFeederMode = useGameStore(state => state.hayFeederMode);
  const placeHayFeeder = useGameStore(state => state.placeHayFeeder);
  const removeHayFeeder = useGameStore(state => state.removeHayFeeder);
  const refillHayFeeder = useGameStore(state => state.refillHayFeeder);
  const feed = useGameStore(state => state.feed);

  // Periodically clear old grass trails and spawn new grass
  useEffect(() => {
    const interval = setInterval(() => {
      clearOldGrassTrails();
    }, 500);
    return () => clearInterval(interval);
  }, [clearOldGrassTrails]);

  useEffect(() => {
    const spawnInterval = setInterval(() => {
      spawnGrass();
    }, 15000); // Spawn new grass every 15 seconds
    
    // Initial spawn if empty
    if (!grassDecorations || grassDecorations.length === 0) {
      // Spawn enough times to cover the field initially
      for (let i = 0; i < 5; i++) spawnGrass();
    }
    
    return () => clearInterval(spawnInterval);
  }, [spawnGrass, grassDecorations?.length]);

  // Main view is always full screen now
  const penContainerClass = `w-screen h-screen absolute inset-0 pointer-events-auto ${buildMode ? 'cursor-crosshair' : ''}`;

  const handlePenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Handle sheep drop if in pickUpMode with a picked up sheep
    if (pickUpMode && pickedUpSheepId) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Snap to 32x32 grid for drop position
      const gridX = Math.floor(x / 32) * 32;
      const gridY = Math.floor(y / 32) * 32;

      // Convert grid position to percentage for the sheep position
      const newX = (gridX / rect.width) * 100;
      const newY = (gridY / rect.height) * 100;

      // Drop the sheep at this position - clear the pickup state
      setDropTargetPos({ x: gridX, y: gridY });
      // Use timeout to clear after the sheep has moved to the position
      setTimeout(() => {
        cancelPickUpMode();
      }, 50);
      return;
    }

    // Handle hay feeder placement
    if (hayFeederMode) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Snap to 32x32 grid
      const gridX = Math.floor(x / 32) * 32;
      const gridY = Math.floor(y / 32) * 32;

      placeHayFeeder(gridX, gridY);
      return;
    }

    if (!buildMode) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Snap to 32x32 grid
    const gridX = Math.floor(x / 32) * 32;
    const gridY = Math.floor(y / 32) * 32;

    // Check if right click (not natively supported here easily without onContextMenu, so we'll use a modifier key like Shift+Click to remove, or just check if one exists)
    const existingFence = fences.find(f => f.x === gridX && f.y === gridY);
    if (existingFence) {
      removeFence(gridX, gridY);
    } else {
      placeFence(gridX, gridY);
    }
  };

  // Handle mouse move to track position - sheep follows cursor when picked up
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (pickUpMode && pickedUpSheepId) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Snap to 32x32 grid
      const gridX = Math.floor(x / 32) * 32;
      const gridY = Math.floor(y / 32) * 32;

      setDropTargetPos({ x: gridX, y: gridY });
    }
  };

  return (
    <div className="absolute inset-0 z-0">
      <div
        id="sheep-pen-container"
        className={`relative ${penContainerClass}`}
        onClick={handlePenClick}
        onMouseMove={handleMouseMove}
      >
        
        {/* Inner Grass Area (Full screen) */}
        <div 
          className="absolute inset-0 bg-transparent overflow-visible pointer-events-none"
        >
        {/* Dirt patches - Scaled and subtle */}
        <div className="absolute top-[20%] left-[20%] w-[25%] h-[15%] bg-[#6b5236]/20 rounded-[100%] blur-xl pointer-events-none z-10"></div>
        <div className="absolute bottom-[30%] right-[20%] w-[30%] h-[18%] bg-[#6b5236]/20 rounded-[100%] blur-xl pointer-events-none z-10"></div>

        {/* Render Fences */}
        {fences?.map(fence => (
          <div
            key={fence.id}
            className="absolute pointer-events-auto cursor-pointer"
            style={{
              left: `${fence.x}px`,
              top: `${fence.y}px`,
              width: '32px',
              height: '32px',
              backgroundImage: 'url(/objects/fence.png)',
              backgroundSize: '100% 100%',
              imageRendering: 'pixelated',
              transform: `rotate(${fence.rotation ?? 0}deg)`,
              // Calculate z-index based on Y coordinate to properly sort with sheep
              zIndex: Math.floor((fence.y / window.innerHeight) * 100) + 10
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (demolishMode) {
                removeFence(fence.x, fence.y);
              } else if (buildMode) {
                rotateFence(fence.x, fence.y);
              }
            }}
          />
        ))}

        {/* Render Hay Feeders */}
        {hayFeeders?.map(feeder => (
          <div
            key={feeder.id}
            className="absolute pointer-events-auto cursor-pointer"
            style={{
              left: `${feeder.x}px`,
              top: `${feeder.y}px`,
              width: '64px',
              height: '64px',
              zIndex: Math.floor((feeder.y / window.innerHeight) * 100) + 10
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (demolishMode) {
                removeHayFeeder(feeder.id);
              } else if (feeder.hay <= 0 && feed >= 1) {
                // Refill empty hay feeder
                refillHayFeeder(feeder.id);
              }
            }}
          >
            <img
              src={feeder.hay > 0 ? '/objects/slut.png' : '/objects/slut-empty.png'}
              className="w-full h-full object-contain"
              style={{ imageRendering: 'pixelated' }}
              alt="hay feeder"
            />
            {/* Hay Level Indicator */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-2 bg-black/40 rounded-full overflow-hidden border border-white/30">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300"
                style={{ width: `${feeder.hay}%` }}
              />
            </div>
          </div>
        ))}

        <div className="absolute inset-0 z-0">
          {/* Decorative Grass Clumps (Interactive) */}
          {grassDecorations.map(dec => (
            <InteractiveGrass key={dec.id} dec={dec} />
          ))}
        </div>

        {/* Render Sheep */}
        {sheepList.map(sheep => (
          <SheepEntity key={sheep.id} sheep={sheep} />
        ))}

        {/* Drop Target Highlight */}
        {pickUpMode && pickedUpSheepId && dropTargetPos && (
          <div
            className="absolute pointer-events-none z-40"
            style={{
              left: `${dropTargetPos.x}px`,
              top: `${dropTargetPos.y}px`,
              width: '32px',
              height: '32px',
              border: '3px dashed #22c55e',
              borderRadius: '4px',
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)'
            }}
          />
        )}

        {/* Render Feces */}
        {(feces || []).map(f => (
          <div
            key={f.id}
            className="absolute pointer-events-none"
            style={{
              left: `${Math.max(18, Math.min(82, f.x))}%`,
              top: `${Math.max(18, Math.min(82, f.y))}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: Math.round(f.y) - 1,
              width: '16px',
              height: '16px'
            }}
          >
            <img src="/objects/shit.png" className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} alt="poop" />
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}
