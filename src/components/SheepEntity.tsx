import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Sheep, useGameStore } from '../store/gameStore';
import { Heart, Wheat, Droplets } from 'lucide-react';
import { playBaa } from '../utils/audio';

export const SheepEntity: React.FC<{ sheep: Sheep }> = ({ sheep }) => {
  const timeOfDay = useGameStore(state => state.timeOfDay);
  const soundEnabled = useGameStore(state => state.soundEnabled);
  const farms = useGameStore(state => state.farms);
  const currentFarmId = useGameStore(state => state.currentFarmId);
  const currentFarm = farms.find(f => f.id === currentFarmId) || farms[0];
  const fences = currentFarm?.fences || [];
  const hayFeeders = currentFarm?.hayFeeders || [];
  const pickUpMode = useGameStore(state => state.pickUpMode);
  const pickedUpSheepId = useGameStore(state => state.pickedUpSheepId);
  const setPickedUpSheepId = useGameStore(state => state.setPickedUpSheepId);
  const dropTargetPos = useGameStore(state => state.dropTargetPos);
  const setDropTargetPos = useGameStore(state => state.setDropTargetPos);
  const weather = useGameStore(state => state.weather);
  const windDirection = useGameStore(state => state.windDirection);
  const windStrength = useGameStore(state => state.windStrength);
  const isNight = timeOfDay >= 19 || timeOfDay < 6;
  const isNightRef = useRef(isNight);
  useEffect(() => { isNightRef.current = isNight; }, [isNight]);
  const sheepDefecate = useGameStore(state => state.sheepDefecate);

  // Random initial position in the center area of the map (30-70%)
  const [pos, setPos] = useState(() => ({
    x: 30 + Math.random() * 40,
    y: 30 + Math.random() * 40
  }));
  const posRef = useRef(pos);
  useEffect(() => { posRef.current = pos; }, [pos]);

  // Keep fences ref updated
  const fencesRef = useRef(fences);
  useEffect(() => { fencesRef.current = fences; }, [fences]);

  // Keep hayFeeders ref updated
  const hayFeedersRef = useRef(hayFeeders);
  useEffect(() => { hayFeedersRef.current = hayFeeders; }, [hayFeeders]);

  // Collision detection for fences (32x32px grid)
  const FENCE_SIZE = 32;
  const checkFenceCollision = (targetXPercent: number, targetYPercent: number): boolean => {
    if (fencesRef.current.length === 0) {
      return false;
    }

    // Get the sheep entity's parent container (should be the pen container)
    const sheepEl = document.getElementById(`sheep-${sheep.id}`);
    const containerEl = sheepEl?.parentElement;
    if (!containerEl) {
      return false;
    }

    const containerRect = containerEl.getBoundingClientRect();

    // Convert sheep percentage position to pixel position relative to container
    const sheepPixelX = (targetXPercent / 100) * containerRect.width;
    const sheepPixelY = (targetYPercent / 100) * containerRect.height;

    // Use a large collision radius - the sheep should be fully blocked by fence
    // Female adult is 10% smaller than male adult
    const sheepSize = sheep.stage === 'BABY' ? 32 :
                      sheep.stage === 'GROWING' ? 48 :
                      (sheep.gender === 'FEMALE' && sheep.stage === 'ADULT') ? 56 : 64;
    const collisionRadius = sheepSize * 0.6;

    for (const fence of fencesRef.current) {
      // Fence bounds (fence.x, fence.y are already in pixels relative to container)
      const fenceLeft = fence.x;
      const fenceRight = fence.x + FENCE_SIZE;
      const fenceTop = fence.y;
      const fenceBottom = fence.y + FENCE_SIZE;

      // Sheep collision box
      const sheepLeft = sheepPixelX - collisionRadius;
      const sheepRight = sheepPixelX + collisionRadius;
      const sheepTop = sheepPixelY - collisionRadius;
      const sheepBottom = sheepPixelY + collisionRadius;

      // Box-based overlap check
      if (sheepRight > fenceLeft && sheepLeft < fenceRight &&
          sheepBottom > fenceTop && sheepTop < fenceBottom) {
        return true; // Collision detected
      }
    }
    return false;
  };

  // Try to move in one of 4 orthogonal directions, returns new position or null if all blocked
  const tryOrthogonalMove = (startX: number, startY: number, step: number): { newX: number, newY: number, windMultiplier?: number } | null => {
    // Don't move if currently in collision
    if (checkFenceCollision(startX, startY)) {
      return null;
    }

    // Direction angles: right=0, left=180, down=90, up=270
    const directions = [
      { dx: step, dy: 0, angle: 0 },     // right
      { dx: -step, dy: 0, angle: 180 }, // left
      { dx: 0, dy: step, angle: 90 },   // down
      { dx: 0, dy: -step, angle: 270 }, // up
    ];

    // Calculate wind multiplier if windy
    let windMultiplier = 1;
    if (weather === 'windy' && windStrength > 0) {
      // Sort directions by preference: wind-assisted first, then random
      directions.sort((a, b) => {
        const aAngleDiff = Math.abs(Math.sin(((b.angle - windDirection) * Math.PI) / 180));
        const bAngleDiff = Math.abs(Math.sin(((a.angle - windDirection) * Math.PI) / 180));
        // Higher sin value = more aligned with wind direction = faster
        return aAngleDiff - bAngleDiff;
      });
    } else {
      // Shuffle for natural movement when not windy
      directions.sort(() => Math.random() - 0.5);
    }

    for (const dir of directions) {
      const newX = Math.max(MIN_BOUND, Math.min(MAX_BOUND, startX + dir.dx));
      const newY = Math.max(MIN_BOUND, Math.min(MAX_BOUND, startY + dir.dy));
      // Check collision BEFORE returning - must be clear of fences
      if (!checkFenceCollision(newX, newY)) {
        // Calculate wind multiplier based on alignment with wind direction
        if (weather === 'windy' && windStrength > 0) {
          const alignment = Math.abs(Math.sin(((dir.angle - windDirection) * Math.PI) / 180));
          // alignment 1 = with wind (90° or 270°), 0 = against wind (0° or 180°)
          windMultiplier = 0.5 + alignment * (windStrength / 100); // 0.5 to 1.5
        }
        return { newX, newY, windMultiplier };
      }
    }
    return null;
  };

  // Movement bounds: 0% to 100% to utilize the full screen area
  const MIN_BOUND = 2;
  const MAX_BOUND = 98;

  // Sheep faces left by default (head is on the left in the SVG). 
  const [facingRight, setFacingRight] = useState(Math.random() > 0.5);
  const [isMoving, setIsMoving] = useState(false);
  const [moveDuration, setMoveDuration] = useState(1.8); // Default move duration
  const [isKnockedBack, setIsKnockedBack] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [isDefecating, setIsDefecating] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const isPickedUp = pickedUpSheepId === sheep.id;

  // Update position when being picked up and dropped - sheep follows cursor continuously
  useEffect(() => {
    // Move sheep when dropTargetPos is set (and this is the picked up sheep)
    if (dropTargetPos && pickedUpSheepId === sheep.id) {
      // Get the container to calculate percentage position
      const sheepEl = document.getElementById(`sheep-${sheep.id}`);
      const containerEl = sheepEl?.parentElement;
      if (containerEl) {
        const containerRect = containerEl.getBoundingClientRect();
        const newX = ((dropTargetPos.x + 16) / containerRect.width) * 100; // +16 to center on grid cell
        const newY = ((dropTargetPos.y + 16) / containerRect.height) * 100;
        setPos({ x: newX, y: newY });
      }
    }
  }, [dropTargetPos, pickedUpSheepId, sheep.id]);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartPos = useRef<{ x: number, y: number } | null>(null);
  const isDefecatingRef = useRef(false);

  // Defecation logic
  const defecateStateRef = useRef({ 
    hunger: sheep.hunger, 
    isNight, 
    health: sheep.health, 
    pos, 
    facingRight,
    age: sheep.age,
    lastDefecatedAge: sheep.lastDefecatedAge || 0
  });
  
  useEffect(() => {
    defecateStateRef.current = { 
      hunger: sheep.hunger, 
      isNight, 
      health: sheep.health, 
      pos, 
      facingRight,
      age: sheep.age,
      lastDefecatedAge: sheep.lastDefecatedAge || 0
    };
  }, [sheep.hunger, isNight, sheep.health, pos, facingRight, sheep.age, sheep.lastDefecatedAge]);

  useEffect(() => {
    const interval = setInterval(() => {
      const { hunger, isNight, health, pos, facingRight, age, lastDefecatedAge } = defecateStateRef.current;
      
      // 1 real second = 1 game tick = 1 in-game minute.
      // 32 in-game minutes = 32 game ticks.
      const canDefecate = (age - lastDefecatedAge >= 32) || lastDefecatedAge === 0;

      if (hunger > 80 && !isNight && health > 0 && !isDefecatingRef.current && canDefecate) {
        if (Math.random() < 0.2) { // 20% chance per second to defecate when hunger > 80
          isDefecatingRef.current = true;
          setIsDefecating(true);
          setTimeout(() => {
            const currentPos = defecateStateRef.current.pos;
            const currentFacingRight = defecateStateRef.current.facingRight;
            const offsetX = currentFacingRight ? -3 : 3;
            sheepDefecate(sheep.id, currentPos.x + offsetX, currentPos.y + 2);
            isDefecatingRef.current = false;
            setIsDefecating(false);
          }, 600);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [sheep.id, sheepDefecate]);

  const eatGrass = useGameStore(state => state.eatGrass);
  const removeGrass = useGameStore(state => state.removeGrass);
  const clearCorpse = useGameStore(state => state.clearCorpse);
  const addGrassTrail = useGameStore(state => state.addGrassTrail);
  const consumeHay = useGameStore(state => state.consumeHay);

  const isDead = sheep.health <= 0;
  const isDeadRef = useRef(isDead);
  useEffect(() => { isDeadRef.current = isDead; }, [isDead]);

  const sheepRef = useRef(sheep);

  // Eating state
  const [isEating, setIsEating] = useState(false);
  const isEatingRef = useRef(false);
  useEffect(() => { isEatingRef.current = isEating; }, [isEating]);

  // Intermittent ambient sound
  useEffect(() => {
    if (isDead) return;
    
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const scheduleNextBaa = () => {
      // Random interval between 15s and 45s
      const delay = 15000 + Math.random() * 30000;
      timeoutId = setTimeout(() => {
        if (!isDeadRef.current && !isNightRef.current && useGameStore.getState().soundEnabled) {
          playBaa(0.1); // Lower volume for ambient sound
        }
        scheduleNextBaa();
      }, delay);
    };
    
    scheduleNextBaa();
    
    return () => clearTimeout(timeoutId);
  }, [isDead]);

  useEffect(() => { sheepRef.current = sheep; }, [sheep]);

  const prevStageRef = useRef(sheep.stage);
  useEffect(() => {
    if (prevStageRef.current !== sheep.stage) {
      setShowLevelUp(true);
      const timer = setTimeout(() => setShowLevelUp(false), 3000);
      prevStageRef.current = sheep.stage;
      return () => clearTimeout(timer);
    }
  }, [sheep.stage]);

  useEffect(() => {
    const moveInterval = setInterval(() => {
      if (isNightRef.current || isDeadRef.current || isEatingRef.current || isDraggingRef.current) {
        setIsMoving(false);
        return;
      }

      const currentSheep = sheepRef.current;
      const prevPos = posRef.current;

      const needsFood = currentSheep.hunger < 90;

      if (needsFood) {
        // Get latest hay feeders from ref
        const allHayFeeders = hayFeedersRef.current;
        const feedersWithFood = allHayFeeders.filter(f => f.hay > 0);
        let nearestHayFeeder: typeof allHayFeeders[0] | null = null;
        let minHayDistance = Infinity;
        let hayTargetX = 0;
        let hayTargetY = 0;

        // Get container for position calculation
        const containerEl = document.getElementById('sheep-pen-container');
        const containerRect = containerEl?.getBoundingClientRect();

        feedersWithFood.forEach(feeder => {
          if (!containerRect) return;
          // Hay feeder center in percentage (feeder is 2x2 grid cells = 64x64px)
          const fX = ((feeder.x + 32) / containerRect.width) * 100;
          const fY = ((feeder.y + 32) / containerRect.height) * 100;

          const dist = Math.sqrt(Math.pow(fX - prevPos.x, 2) + Math.pow(fY - prevPos.y, 2));
          if (dist < minHayDistance) {
            minHayDistance = dist;
            nearestHayFeeder = feeder;
            hayTargetX = fX;
            hayTargetY = fY;
          }
        });

        // If there's a hay feeder with food, ALWAYS prefer it when hungry
        if (nearestHayFeeder) {
          // Move to hay feeder
          if (minHayDistance > 5) {
            const step = 5;

            // First check if current position is already in collision - if so, try to escape first
            if (checkFenceCollision(prevPos.x, prevPos.y)) {
              const escapeMove = tryOrthogonalMove(prevPos.x, prevPos.y, step * 2);
              if (escapeMove) {
                const actualDx = escapeMove.newX - prevPos.x;
                const actualDy = escapeMove.newY - prevPos.y;
                const actualDist = Math.sqrt(actualDx * actualDx + actualDy * actualDy);
                const windMult = escapeMove.windMultiplier || 1;
                const escDuration = Math.min((actualDist / 15) * 1.8, 4.0) / windMult;
                setMoveDuration(escDuration);
                setFacingRight(escapeMove.newX > prevPos.x);
                setIsMoving(true);
                addGrassTrail(prevPos.x, prevPos.y);
                setTimeout(() => setIsMoving(false), escDuration * 1000);
                setPos({ x: escapeMove.newX, y: escapeMove.newY });
              }
              return;
            }

            const dX = hayTargetX - prevPos.x;
            const dY = hayTargetY - prevPos.y;
            let newX = prevPos.x;
            let newY = prevPos.y;

            if (Math.abs(dX) > Math.abs(dY)) {
              newX = prevPos.x + Math.sign(dX) * step;
            } else {
              newY = prevPos.y + Math.sign(dY) * step;
            }

            newX = Math.max(MIN_BOUND, Math.min(MAX_BOUND, newX));
            newY = Math.max(MIN_BOUND, Math.min(MAX_BOUND, newY));

            let windMult = 1;
            if (checkFenceCollision(newX, newY)) {
              const altMove = tryOrthogonalMove(prevPos.x, prevPos.y, step);
              if (altMove) {
                newX = altMove.newX;
                newY = altMove.newY;
                windMult = altMove.windMultiplier || 1;
              } else {
                return;
              }
            }

            const actualDx = newX - prevPos.x;
            const actualDy = newY - prevPos.y;
            const actualDist = Math.sqrt(actualDx * actualDx + actualDy * actualDy);

            const calculatedDuration = Math.min((actualDist / 15) * 1.8, 4.0) / windMult;
            setMoveDuration(calculatedDuration);

            setFacingRight(newX > prevPos.x);
            setIsMoving(true);
            addGrassTrail(prevPos.x, prevPos.y);

            setTimeout(() => setIsMoving(false), calculatedDuration * 1000);
            setPos({ x: newX, y: newY });
          } else {
            // Close enough to hay feeder, start eating
            setIsEating(true);
            setIsMoving(false);
            setFacingRight(hayTargetX > prevPos.x);

            // Eat from hay feeder for 10 seconds
            let eatTicks = 0;
            const feedId = nearestHayFeeder!.id;
            const eatTimer = setInterval(() => {
              eatTicks++;
              consumeHay(feedId, 10); // Consume 10 hay per second
              eatGrass(currentSheep.id, 10); // Recover 10 hunger per second
              if (eatTicks >= 10 || isDeadRef.current || isNightRef.current) {
                clearInterval(eatTimer);
                setIsEating(false);
              }
            }, 1000);
          }
        } else {
          // No hay feeder with food, find grass
          const grassElements = document.querySelectorAll('[id^="grass-dec-"]');
          let nearestGrass: Element | null = null;
          let minGrassDistance = Infinity;
          let grassTargetX = 0;
          let grassTargetY = 0;

          grassElements.forEach(el => {
            const img = el.querySelector('img');
            if (img && !img.src.includes('grass.png')) return;

            const rect = el.getBoundingClientRect();
            const parentRect = el.parentElement?.getBoundingClientRect();
            if (!parentRect) return;

            const gX = ((rect.left - parentRect.left + rect.width / 2) / parentRect.width) * 100;
            const gY = ((rect.top - parentRect.top + rect.height / 2) / parentRect.height) * 100;

            const dist = Math.sqrt(Math.pow(gX - prevPos.x, 2) + Math.pow(gY - prevPos.y, 2));
            if (dist < minGrassDistance) {
              minGrassDistance = dist;
              nearestGrass = el;
              grassTargetX = gX;
              grassTargetY = gY;
            }
          });

          if (nearestGrass) {
            if (minGrassDistance > 5) {
              const step = 5;

              // First check if current position is already in collision - if so, try to escape first
              if (checkFenceCollision(prevPos.x, prevPos.y)) {
                const escapeMove = tryOrthogonalMove(prevPos.x, prevPos.y, step * 2);
                if (escapeMove) {
                  const actualDx = escapeMove.newX - prevPos.x;
                  const actualDy = escapeMove.newY - prevPos.y;
                  const actualDist = Math.sqrt(actualDx * actualDx + actualDy * actualDy);
                  const windMult = escapeMove.windMultiplier || 1;
                  const escDuration = Math.min((actualDist / 15) * 1.8, 4.0) / windMult;
                  setMoveDuration(escDuration);
                  setFacingRight(escapeMove.newX > prevPos.x);
                  setIsMoving(true);
                  addGrassTrail(prevPos.x, prevPos.y);
                  setTimeout(() => setIsMoving(false), escDuration * 1000);
                  setPos({ x: escapeMove.newX, y: escapeMove.newY });
                }
                return;
              }

              const dX = grassTargetX - prevPos.x;
              const dY = grassTargetY - prevPos.y;
              let newX = prevPos.x;
              let newY = prevPos.y;

              if (Math.abs(dX) > Math.abs(dY)) {
                newX = prevPos.x + Math.sign(dX) * step;
              } else {
                newY = prevPos.y + Math.sign(dY) * step;
              }

              newX = Math.max(MIN_BOUND, Math.min(MAX_BOUND, newX));
              newY = Math.max(MIN_BOUND, Math.min(MAX_BOUND, newY));

              let windMult = 1;
              if (checkFenceCollision(newX, newY)) {
                const altMove = tryOrthogonalMove(prevPos.x, prevPos.y, step);
                if (altMove) {
                  newX = altMove.newX;
                  newY = altMove.newY;
                  windMult = altMove.windMultiplier || 1;
                } else {
                  return;
                }
              }

              const actualDx = newX - prevPos.x;
              const actualDy = newY - prevPos.y;
              const actualDist = Math.sqrt(actualDx * actualDx + actualDy * actualDy);

              const calculatedDuration = Math.min((actualDist / 15) * 1.8, 4.0) / windMult;
              setMoveDuration(calculatedDuration);

              setFacingRight(newX > prevPos.x);
              setIsMoving(true);
              addGrassTrail(prevPos.x, prevPos.y);

              setTimeout(() => setIsMoving(false), calculatedDuration * 1000);
              setPos({ x: newX, y: newY });
            } else {
              // Close enough to grass, start eating
              setIsEating(true);
              setIsMoving(false);
              setFacingRight(grassTargetX > prevPos.x);

              const grassId = nearestGrass.id.replace('grass-', '');

              let eatTicks = 0;
              const eatTimer = setInterval(() => {
                eatTicks++;
                eatGrass(currentSheep.id, 10);
                if (eatTicks >= 10 || isDeadRef.current || isNightRef.current) {
                  clearInterval(eatTimer);
                  setIsEating(false);
                  if (eatTicks >= 10) {
                    removeGrass(grassId);
                  }
                }
              }, 1000);
            }
          } else {
            // No grass found, just wander
            randomWander();
          }
        }
      } else {
        // Not hungry, just wander
        randomWander();
      }

      function randomWander() {
        if (Math.random() > 0.4) {
          const step = 5;
          const altMove = tryOrthogonalMove(prevPos.x, prevPos.y, step);

          if (!altMove) {
            // Completely blocked, skip this movement
            return;
          }

          const newX = altMove.newX;
          const newY = altMove.newY;
          const windMult = altMove.windMultiplier || 1;

          const actualDx = newX - prevPos.x;
          const actualDy = newY - prevPos.y;
          const actualDist = Math.sqrt(actualDx * actualDx + actualDy * actualDy);

          const calculatedDuration = Math.min((actualDist / 15) * 1.8, 4.0) / windMult;
          setMoveDuration(calculatedDuration);

          setFacingRight(newX > prevPos.x);
          setIsMoving(true);
          addGrassTrail(prevPos.x, prevPos.y);

          setTimeout(() => setIsMoving(false), calculatedDuration * 1000);
          setPos({ x: newX, y: newY });
        }
      }
    }, 2000); // Decide to move every 2 seconds

    return () => clearInterval(moveInterval);
  }, [eatGrass, fences, consumeHay]);

  const handleSheepClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isDead) {
      clearCorpse(sheep.id);
      return;
    }

    // If in pickUpMode and not already picked up, pick up this sheep
    if (pickUpMode && !pickedUpSheepId) {
      setPickedUpSheepId(sheep.id);
      if (soundEnabled) {
        playBaa(0.5);
      }
      return;
    }

    if (soundEnabled) {
      playBaa(0.8); // Louder volume when clicked/hit
    }

    if (clickTimer.current) {
      // Double click detected
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      performKnockback(e);
    } else {
      // Single click potential
      clickTimer.current = setTimeout(() => {
        if (!isDraggingRef.current) {
          setShowStatus(prev => !prev);
        }
        clickTimer.current = null;
      }, 250); // 250ms window for double click
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isDead) return;
    e.stopPropagation();

    // Skip dragging setup if in pickUpMode (handled by click instead)
    if (pickUpMode) return;

    // Start long press timer for dragging
    longPressTimer.current = setTimeout(() => {
      isDraggingRef.current = true;
      setIsDragging(true);
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      if (soundEnabled) {
        playBaa(0.5);
      }
    }, 300); // 300ms long press to start dragging
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isDead) return;
    e.stopPropagation();

    // Skip dragging setup if in pickUpMode (handled by click instead)
    if (pickUpMode) return;

    const touch = e.touches[0];
    // Start long press timer for dragging
    longPressTimer.current = setTimeout(() => {
      isDraggingRef.current = true;
      setIsDragging(true);
      dragStartPos.current = { x: touch.clientX, y: touch.clientY };
      if (soundEnabled) {
        playBaa(0.5);
      }
    }, 300); // 300ms long press to start dragging
  };

  // Handle pointer move at document level for smooth dragging (works with mouse and trackpad)
  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;

      const sheepEl = document.getElementById(`sheep-${sheep.id}`);
      const containerEl = sheepEl?.parentElement;
      if (!containerEl) return;

      const containerRect = containerEl.getBoundingClientRect();

      // Direct position - set sheep center to mouse position
      const newX = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      const newY = ((e.clientY - containerRect.top) / containerRect.height) * 100;

      const clampedX = Math.max(MIN_BOUND, Math.min(MAX_BOUND, newX));
      const clampedY = Math.max(MIN_BOUND, Math.min(MAX_BOUND, newY));

      setPos({ x: clampedX, y: clampedY });
    };

    const handleGlobalPointerUp = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
        dragStartPos.current = null;
      }
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();

      const touch = e.touches[0];
      const sheepEl = document.getElementById(`sheep-${sheep.id}`);
      const containerEl = sheepEl?.parentElement;
      if (!containerEl) return;

      const containerRect = containerEl.getBoundingClientRect();

      // Direct position - set sheep center to touch position
      const newX = ((touch.clientX - containerRect.left) / containerRect.width) * 100;
      const newY = ((touch.clientY - containerRect.top) / containerRect.height) * 100;

      const clampedX = Math.max(MIN_BOUND, Math.min(MAX_BOUND, newX));
      const clampedY = Math.max(MIN_BOUND, Math.min(MAX_BOUND, newY));

      setPos({ x: clampedX, y: clampedY });
    };

    const handleGlobalTouchEnd = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
        dragStartPos.current = null;
      }
    };

    document.addEventListener('pointermove', handleGlobalPointerMove);
    document.addEventListener('pointerup', handleGlobalPointerUp);
    document.addEventListener('pointercancel', handleGlobalPointerUp);
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    document.addEventListener('touchend', handleGlobalTouchEnd);
    document.addEventListener('touchcancel', handleGlobalTouchEnd);

    return () => {
      document.removeEventListener('pointermove', handleGlobalPointerMove);
      document.removeEventListener('pointerup', handleGlobalPointerUp);
      document.removeEventListener('pointercancel', handleGlobalPointerUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
      document.removeEventListener('touchcancel', handleGlobalTouchEnd);
    };
  }, [sheep.id]);

  const performKnockback = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const sheepCenterX = rect.left + rect.width / 2;
    const sheepCenterY = rect.top + rect.height / 2;
    const dx = sheepCenterX - e.clientX;
    const dy = sheepCenterY - e.clientY;

    const dist = Math.sqrt(dx * dx + dy * dy);
    const normX = dist === 0 ? (Math.random() > 0.5 ? 1 : -1) : dx / dist;
    const normY = dist === 0 ? (Math.random() > 0.5 ? 1 : -1) : dy / dist;

    const force = 2; // Push back by 6% of pen size

    let newX = pos.x + normX * force;
    let newY = pos.y + normY * force;

    // Keep within bounds
    newX = Math.max(MIN_BOUND, Math.min(MAX_BOUND, newX));
    newY = Math.max(MIN_BOUND, Math.min(MAX_BOUND, newY));

    // Check fence collision
    if (checkFenceCollision(newX, newY)) {
      // Try to find a non-blocked position
      const directions = [
        { dx: normX * force, dy: 0 },
        { dx: 0, dy: normY * force },
        { dx: -normX * force, dy: 0 },
        { dx: 0, dy: -normY * force },
      ];

      let foundPath = false;
      for (const dir of directions) {
        const altX = Math.max(MIN_BOUND, Math.min(MAX_BOUND, pos.x + dir.dx));
        const altY = Math.max(MIN_BOUND, Math.min(MAX_BOUND, pos.y + dir.dy));
        if (!checkFenceCollision(altX, altY)) {
          newX = altX;
          newY = altY;
          foundPath = true;
          break;
        }
      }

      if (!foundPath) {
        // Completely blocked, don't move
        return;
      }
    }

    setIsKnockedBack(true);
    setPos({ x: newX, y: newY });

    setTimeout(() => {
      setIsKnockedBack(false);
    }, 300);
  };

  // Visual size based on growth stage
  const sizeClass = 
    sheep.stage === 'BABY' ? 'w-8 h-8' : 
    sheep.stage === 'GROWING' ? 'w-12 h-12' : 
    'w-16 h-16';

  // Frame animation state
  const [currentFrame, setCurrentFrame] = useState(0);
  const babyFrameCount = 12; // frame_0000.png to frame_0011.png (female)
  const youngFrames = [0, 2, 3, 4, 7, 8]; // (female)
  const adultFrameCount = 8; // frame_000.png to frame_007.png (female)

  const maleBabyFrameCount = 10; // frame_0000.png to frame_0009.png
  const maleYoungFrameCount = 10; // frame_0000.png to frame_0009.png
  const maleAdultFrameCount = 10; // frame_0000.png to frame_0009.png

  // Preload frames to prevent flickering
  useEffect(() => {
    if (sheep.gender === 'FEMALE') {
      if (sheep.stage === 'BABY') {
        for (let i = 0; i < babyFrameCount; i++) {
          const img = new Image();
          img.src = `/female-sheep-baby/frame_${i.toString().padStart(4, '0')}.png`;
        }
      } else if (sheep.stage === 'GROWING') {
        youngFrames.forEach(frameNum => {
          const img = new Image();
          img.src = `/female-sheep-young/frame_${frameNum.toString().padStart(4, '0')}.png`;
        });
      } else if (sheep.stage === 'ADULT') {
        for (let i = 0; i < adultFrameCount; i++) {
          const img = new Image();
          img.src = `/female-sheep-adult/frame_${i.toString().padStart(3, '0')}.png`;
        }
      }
    } else if (sheep.gender === 'MALE') {
      if (sheep.stage === 'BABY') {
        for (let i = 0; i < maleBabyFrameCount; i++) {
          const img = new Image();
          img.src = `/male-sheep-baby/frame_${i.toString().padStart(4, '0')}.png`;
        }
      } else if (sheep.stage === 'GROWING') {
        for (let i = 0; i < maleYoungFrameCount; i++) {
          const img = new Image();
          img.src = `/male-sheep-young/frame_${i.toString().padStart(4, '0')}.png`;
        }
      } else if (sheep.stage === 'ADULT') {
        for (let i = 0; i < maleAdultFrameCount; i++) {
          const img = new Image();
          img.src = `/male-sheep-adult/frame_${i.toString().padStart(4, '0')}.png`;
        }
      }
    }
  }, [sheep.gender, sheep.stage]);

  useEffect(() => {
    let frameInterval: ReturnType<typeof setInterval>;
    if (!isDead) {
      if (isMoving) {
        frameInterval = setInterval(() => {
          if (sheep.gender === 'FEMALE') {
            if (sheep.stage === 'BABY') {
              setCurrentFrame((prev) => (prev + 1) % babyFrameCount);
            } else if (sheep.stage === 'GROWING') {
              setCurrentFrame((prev) => (prev + 1) % youngFrames.length);
            } else if (sheep.stage === 'ADULT') {
              setCurrentFrame((prev) => (prev + 1) % adultFrameCount);
            }
          } else if (sheep.gender === 'MALE') {
            if (sheep.stage === 'BABY') {
              setCurrentFrame((prev) => (prev + 1) % maleBabyFrameCount);
            } else if (sheep.stage === 'GROWING') {
              setCurrentFrame((prev) => (prev + 1) % maleYoungFrameCount);
            } else if (sheep.stage === 'ADULT') {
              setCurrentFrame((prev) => (prev + 1) % maleAdultFrameCount);
            }
          }
        }, 100); // Walk animation speed
      } else {
        setCurrentFrame(0); 
      }
    }
    return () => {
      if (frameInterval) clearInterval(frameInterval);
    };
  }, [isMoving, isDead, sheep.gender, sheep.stage]);

  return (
    <motion.div
      id={`sheep-${sheep.id}`}
      className="sheep-entity absolute cursor-pointer pointer-events-auto"
      initial={false}
      animate={{ left: `${pos.x}%`, top: `${pos.y}%` }}
      transition={isKnockedBack ? { type: "spring", stiffness: 300, damping: 15 } : { duration: moveDuration, ease: "linear" }}
      style={{
        transform: `translate(-50%, -50%) scale(${sheep.gender === 'FEMALE' && sheep.stage === 'ADULT' ? 0.9 : 1})`,
        zIndex: Math.max(200, Math.round(pos.y) + 20), // Ensure sheep renders above UI (z-50) and elements
        isolation: 'isolate'
      }}
      onClick={handleSheepClick}
      onPointerDown={handlePointerDown}
      onTouchStart={handleTouchStart}
    >
      <div className="relative group flex flex-col items-center">
        {/* Level Up Animation */}
        {showLevelUp && !isDead && (
          <motion.div
            className="absolute -top-8 text-green-500 font-bold text-sm z-50 pointer-events-none drop-shadow-md whitespace-nowrap"
            initial={{ y: 0, opacity: 0, scale: 0.5 }}
            animate={{ y: -30, opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 1, 1] }}
            transition={{ duration: 2.5, times: [0, 0.2, 0.8, 1] }}
          >
            ✨ 长大了! ✨
          </motion.div>
        )}

        {/* Dragging Indicator */}
        {isDragging && !isDead && (
          <motion.div
            className="absolute -top-8 text-orange-500 font-bold text-sm z-50 pointer-events-none drop-shadow-md whitespace-nowrap"
            initial={{ y: 0, opacity: 0, scale: 0.8 }}
            animate={{ y: -10, opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            ✋ 被控制
          </motion.div>
        )}

        {/* Picked Up Indicator */}
        {isPickedUp && !isDead && (
          <motion.div
            className="absolute -top-8 text-green-500 font-bold text-sm z-50 pointer-events-none drop-shadow-md whitespace-nowrap"
            initial={{ y: 0, opacity: 0, scale: 0.8 }}
            animate={{ y: -10, opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            🟢 被抓取中
          </motion.div>
        )}

        {/* Wool Indicator */}
        {(sheep.woolGrowth || 0) >= 100 && !isDead && (
          <motion.div
            className="absolute -top-6 text-xl z-50 pointer-events-none drop-shadow-md"
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            🧶
          </motion.div>
        )}

        {/* Growth Progress Bar */}
        {!isDead && sheep.stage !== 'ADULT' && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-black/30 rounded-full overflow-hidden z-50 pointer-events-none">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-300"
              style={{
                width: `${sheep.stage === 'BABY' ? (sheep.age / 960) * 100 : ((sheep.age - 960) / 960) * 100}%`
              }}
            />
          </div>
        )}

        {/* Hover Status HUD */}
        {isDead ? (
          <div className={`absolute -top-12 left-1/2 -translate-x-1/2 bg-white/95 px-3 py-2 rounded-lg text-xs font-bold shadow-xl transition-opacity pointer-events-none z-[9999] whitespace-nowrap border border-red-200 text-red-600 ${showStatus ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            小羊死去了... 点击清除
          </div>
        ) : (
          <div className={`absolute -top-32 left-1/2 -translate-x-1/2 bg-white/95 px-3 py-2 rounded-lg text-xs font-bold shadow-xl transition-opacity pointer-events-none z-[9999] flex flex-col gap-1 whitespace-nowrap border border-slate-200 ${showStatus ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <div className="text-slate-800 text-sm border-b border-slate-200 pb-1 mb-1">
              {sheep.name} {sheep.gender === 'MALE' ? '♂️' : '♀️'} ({sheep.stage === 'BABY' ? '幼崽' : sheep.stage === 'GROWING' ? '成长期' : '成年'})
            </div>
            <div className="flex items-center gap-2"><Heart className="w-3 h-3 text-red-500"/> 健康: {Math.round(sheep.health)}</div>
            <div className="flex items-center gap-2"><Wheat className="w-3 h-3 text-amber-600"/> 饱食: {Math.round(sheep.hunger)}</div>
            {sheep.gender === 'FEMALE' && sheep.isPregnant && (
              <div className="flex items-center gap-2 text-pink-600"><span className="text-pink-500">🤰</span> 怀孕中</div>
            )}
          </div>
        )}
        
        {/* Pixel Art Sheep */}
        <div 
          className={`${sizeClass} drop-shadow-md ${isDead ? 'grayscale opacity-70' : ''}`}
          style={{ 
            // all frames (male and female) are facing right now.
            // so we need to reverse the scaling logic for all sheep.
            transform: `${
              (facingRight ? 'scaleX(1)' : 'scaleX(-1)')
            } ${isDead ? 'rotate(180deg)' : ''}`,
            imageRendering: 'pixelated'
          }}
        >
          <motion.div
            className="w-full h-full origin-bottom"
            initial={false}
            animate={
              isDefecating ? { scaleY: [1, 0.7, 0.7, 1], scaleX: [1, 1.1, 1.1, 1] } : { y: 0, scaleY: 1, scaleX: 1 }
            }
            transition={
              isDefecating ? { duration: 0.6, times: [0, 0.3, 0.7, 1] } : { duration: 0 }
            }
          >
            {/* Zzz Animation */}
            {isNight && !isDead && (
              <motion.div
                className="absolute -top-6 right-[-10px] text-blue-200 font-bold text-xs z-50 pointer-events-none drop-shadow-sm"
                animate={{ y: [0, -20], opacity: [0, 1, 0], scale: [0.5, 1, 1.2] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                style={{ transform: facingRight ? 'scaleX(-1)' : 'scaleX(1)' }} // Counteract parent flip
              >
                zZz
              </motion.div>
            )}

            {sheep.gender === 'FEMALE' ? (
              sheep.stage === 'BABY' ? (
                <div className="relative w-full h-full">
                  {isNight && !isDead ? (
                    <img
                      src="/sleep/female-baby-sleep.png"
                      alt="Baby sheep sleeping"
                      className="absolute inset-0 w-full h-full object-contain opacity-100"
                      style={{
                        imageRendering: 'pixelated',
                        filter: (sheep.health > 0 && sheep.health < 40) ? 'brightness(0.8) sepia(1) hue-rotate(-50deg) saturate(3)' : 'none'
                      }}
                    />
                  ) : (
                    Array.from({ length: babyFrameCount }).map((_, index) => (
                      <img
                        key={index}
                        src={`/female-sheep-baby/frame_${index.toString().padStart(4, '0')}.png`}
                        alt="Baby sheep frame"
                        className={`absolute inset-0 w-full h-full object-contain ${
                          currentFrame === index ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{
                          imageRendering: 'pixelated',
                          filter: (sheep.health > 0 && sheep.health < 40) ? 'brightness(0.8) sepia(1) hue-rotate(-50deg) saturate(3)' : 'none'
                        }}
                      />
                    ))
                  )}
                </div>
              ) : sheep.stage === 'GROWING' ? (
                <div className="relative w-full h-full">
                  {isNight && !isDead ? (
                    <img
                      src="/sleep/female-young-sleep.png"
                      alt="Young sheep sleeping"
                      className="absolute inset-0 w-full h-full object-contain opacity-100"
                      style={{
                        imageRendering: 'pixelated',
                        filter: (sheep.health > 0 && sheep.health < 40) ? 'brightness(0.8) sepia(1) hue-rotate(-50deg) saturate(3)' : 'none'
                      }}
                    />
                  ) : (
                    youngFrames.map((frameNum, index) => (
                      <img
                        key={frameNum}
                        src={`/female-sheep-young/frame_${frameNum.toString().padStart(4, '0')}.png`}
                        alt="Young sheep frame"
                        className={`absolute inset-0 w-full h-full object-contain ${
                          currentFrame === index ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{
                          imageRendering: 'pixelated',
                          filter: (sheep.health > 0 && sheep.health < 40) ? 'brightness(0.8) sepia(1) hue-rotate(-50deg) saturate(3)' : 'none'
                        }}
                      />
                    ))
                  )}
                </div>
              ) : (
                <div className="relative w-full h-full">
                  {isNight && !isDead ? (
                    <img
                      src="/sleep/female-adult-sleep.png"
                      alt="Adult sheep sleeping"
                      className="absolute inset-0 w-full h-full object-contain opacity-100"
                      style={{
                        imageRendering: 'pixelated',
                        filter: (sheep.health > 0 && sheep.health < 40) ? 'brightness(0.8) sepia(1) hue-rotate(-50deg) saturate(3)' : 'none'
                      }}
                    />
                  ) : (
                    Array.from({ length: adultFrameCount }).map((_, index) => (
                      <img
                        key={index}
                        src={`/female-sheep-adult/frame_${index.toString().padStart(3, '0')}.png`}
                        alt="Adult sheep frame"
                        className={`absolute inset-0 w-full h-full object-contain ${
                          currentFrame === index ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{
                          imageRendering: 'pixelated',
                          filter: (sheep.health > 0 && sheep.health < 40) ? 'brightness(0.8) sepia(1) hue-rotate(-50deg) saturate(3)' : 'none'
                        }}
                      />
                    ))
                  )}
                </div>
              )
            ) : (
              sheep.stage === 'BABY' ? (
                <div className="relative w-full h-full">
                  {isNight && !isDead ? (
                    <img
                      src="/sleep/male-baby-sleep.png"
                      alt="Male baby sheep sleeping"
                      className="absolute inset-0 w-full h-full object-contain opacity-100"
                      style={{
                        imageRendering: 'pixelated',
                        filter: (sheep.health > 0 && sheep.health < 40) ? 'brightness(0.8) sepia(1) hue-rotate(-50deg) saturate(3)' : 'none'
                      }}
                    />
                  ) : (
                    Array.from({ length: maleBabyFrameCount }).map((_, index) => (
                      <img
                        key={index}
                        src={`/male-sheep-baby/frame_${index.toString().padStart(4, '0')}.png`}
                        alt="Male baby sheep frame"
                        className={`absolute inset-0 w-full h-full object-contain ${
                          currentFrame === index ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{
                          imageRendering: 'pixelated',
                          filter: (sheep.health > 0 && sheep.health < 40) ? 'brightness(0.8) sepia(1) hue-rotate(-50deg) saturate(3)' : 'none'
                        }}
                      />
                    ))
                  )}
                </div>
              ) : sheep.stage === 'GROWING' ? (
                <div className="relative w-full h-full">
                  {isNight && !isDead ? (
                    <img
                      src="/sleep/male-young-sleep.png"
                      alt="Male young sheep sleeping"
                      className="absolute inset-0 w-full h-full object-contain opacity-100"
                      style={{
                        imageRendering: 'pixelated',
                        filter: (sheep.health > 0 && sheep.health < 40) ? 'brightness(0.8) sepia(1) hue-rotate(-50deg) saturate(3)' : 'none'
                      }}
                    />
                  ) : (
                    Array.from({ length: maleYoungFrameCount }).map((_, index) => (
                      <img
                        key={index}
                        src={`/male-sheep-young/frame_${index.toString().padStart(4, '0')}.png`}
                        alt="Male young sheep frame"
                        className={`absolute inset-0 w-full h-full object-contain ${
                          currentFrame === index ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{
                          imageRendering: 'pixelated',
                          filter: (sheep.health > 0 && sheep.health < 40) ? 'brightness(0.8) sepia(1) hue-rotate(-50deg) saturate(3)' : 'none'
                        }}
                      />
                    ))
                  )}
                </div>
              ) : (
                <div className="relative w-full h-full">
                  {isNight && !isDead ? (
                    <img
                      src="/sleep/male-adult-sleep.png"
                      alt="Male adult sheep sleeping"
                      className="absolute inset-0 w-full h-full object-contain opacity-100"
                      style={{
                        imageRendering: 'pixelated',
                        filter: (sheep.health > 0 && sheep.health < 40) ? 'brightness(0.8) sepia(1) hue-rotate(-50deg) saturate(3)' : 'none'
                      }}
                    />
                  ) : (
                    Array.from({ length: maleAdultFrameCount }).map((_, index) => (
                      <img
                        key={index}
                        src={`/male-sheep-adult/frame_${index.toString().padStart(4, '0')}.png`}
                        alt="Male adult sheep frame"
                        className={`absolute inset-0 w-full h-full object-contain ${
                          currentFrame === index ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{
                          imageRendering: 'pixelated',
                          filter: (sheep.health > 0 && sheep.health < 40) ? 'brightness(0.8) sepia(1) hue-rotate(-50deg) saturate(3)' : 'none'
                        }}
                      />
                    ))
                  )}
                </div>
              )
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
