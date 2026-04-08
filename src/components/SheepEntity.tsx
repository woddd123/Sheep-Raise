import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Sheep, useGameStore } from '../store/gameStore';
import { Heart, Wheat, Droplets } from 'lucide-react';

export const SheepEntity: React.FC<{ sheep: Sheep }> = ({ sheep }) => {
  const timeOfDay = useGameStore(state => state.timeOfDay);
  const isNight = timeOfDay >= 19 || timeOfDay < 6;
  const isNightRef = useRef(isNight);
  useEffect(() => { isNightRef.current = isNight; }, [isNight]);
  const sheepDefecate = useGameStore(state => state.sheepDefecate);

  // Random initial position within the pen (strictly inside fences)
  const [pos, setPos] = useState({ 
    x: 20 + Math.random() * 60, 
    y: 20 + Math.random() * 60 
  });
  const posRef = useRef(pos);
  useEffect(() => { posRef.current = pos; }, [pos]);

  // Movement bounds: 18% to 82% to ensure sheep stays inside the 24px fences
  const MIN_BOUND = 18;
  const MAX_BOUND = 82;

  // Sheep faces left by default (head is on the left in the SVG). 
  const [facingRight, setFacingRight] = useState(Math.random() > 0.5);
  const [isMoving, setIsMoving] = useState(false);
  const [isKnockedBack, setIsKnockedBack] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [isDefecating, setIsDefecating] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      
      // 1 real second = 1 game tick = 0.25 in-game hours.
      // 8 in-game hours = 32 game ticks.
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

  const troughCapacity = useGameStore(state => state.troughCapacity);
  const eatFromTrough = useGameStore(state => state.eatFromTrough);
  const clearCorpse = useGameStore(state => state.clearCorpse);

  const isDead = sheep.health <= 0;
  const isDeadRef = useRef(isDead);
  useEffect(() => { isDeadRef.current = isDead; }, [isDead]);

  const sheepRef = useRef(sheep);
  const troughCapacityRef = useRef(troughCapacity);

  // Calculate a fixed feeding spot near the bottom fence for this sheep
  const feedSpot = useRef({
    x: 35 + Math.random() * 30, // 35% to 65% width (along the trough)
    y: 85 + Math.random() * 5   // 85% to 90% height (near the bottom fence)
  });

  useEffect(() => { sheepRef.current = sheep; }, [sheep]);
  useEffect(() => { troughCapacityRef.current = troughCapacity; }, [troughCapacity]);

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
      if (isNightRef.current || isDeadRef.current) {
        setIsMoving(false);
        return;
      }

      const currentSheep = sheepRef.current;
      const currentTroughCapacity = troughCapacityRef.current;
      const prevPos = posRef.current;

      const needsFood = currentSheep.hunger < 90;
      const troughAvailable = currentTroughCapacity > 0;
      
      // Target position is the feed spot near the bottom fence
      const troughPos = { 
        x: feedSpot.current.x, 
        y: feedSpot.current.y 
      };

      if (needsFood && troughAvailable) {
        const dx = troughPos.x - prevPos.x;
        const dy = troughPos.y - prevPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 12) {
          // Move towards trough
          const step = 15;
          let newX = prevPos.x + (dx / dist) * step;
          let newY = prevPos.y + (dy / dist) * step;
          
          newX = Math.max(MIN_BOUND, Math.min(MAX_BOUND, newX));
          newY = Math.max(MIN_BOUND, Math.min(MAX_BOUND, newY));

          setFacingRight(newX > prevPos.x);
          setIsMoving(true);
          setTimeout(() => setIsMoving(false), 1000);
          setPos({ x: newX, y: newY });
        } else {
          // Close enough, eat!
          eatFromTrough(currentSheep.id);
          setIsMoving(false);
          setFacingRight(troughPos.x > prevPos.x);
        }
      } else {
        // Random wander
        if (Math.random() > 0.4) {
          let newX = MIN_BOUND + Math.random() * (MAX_BOUND - MIN_BOUND);
          let newY = MIN_BOUND + Math.random() * (MAX_BOUND - MIN_BOUND);
          
          newX = Math.max(MIN_BOUND, Math.min(MAX_BOUND, newX));
          newY = Math.max(MIN_BOUND, Math.min(MAX_BOUND, newY));

          setFacingRight(newX > prevPos.x);
          setIsMoving(true);
          setTimeout(() => setIsMoving(false), 2000);
          setPos({ x: newX, y: newY });
        }
      }
    }, 2000); // Decide to move every 2 seconds

    return () => clearInterval(moveInterval);
  }, [eatFromTrough]);

  const handleSheepClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isDead) {
      clearCorpse(sheep.id);
      return;
    }

    if (clickTimer.current) {
      // Double click detected
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      performKnockback(e);
    } else {
      // Single click potential
      clickTimer.current = setTimeout(() => {
        setShowStatus(prev => !prev);
        clickTimer.current = null;
      }, 250); // 250ms window for double click
    }
  };

  const performKnockback = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const sheepCenterX = rect.left + rect.width / 2;
    const sheepCenterY = rect.top + rect.height / 2;
    const dx = sheepCenterX - e.clientX;
    const dy = sheepCenterY - e.clientY;
    
    const dist = Math.sqrt(dx * dx + dy * dy);
    const normX = dist === 0 ? (Math.random() > 0.5 ? 1 : -1) : dx / dist;
    const normY = dist === 0 ? (Math.random() > 0.5 ? 1 : -1) : dy / dist;
    
    const force = 12; // Push back by 12% of pen size
    
    let newX = pos.x + normX * force;
    let newY = pos.y + normY * force;
    
    // Keep within bounds
    newX = Math.max(MIN_BOUND, Math.min(MAX_BOUND, newX));
    newY = Math.max(MIN_BOUND, Math.min(MAX_BOUND, newY));
    
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

  return (
    <motion.div
      className="absolute cursor-pointer"
      animate={{ left: `${pos.x}%`, top: `${pos.y}%` }}
      transition={isKnockedBack ? { type: "spring", stiffness: 300, damping: 15 } : { duration: 1.8, ease: "linear" }}
      style={{ 
        transform: `translate(-50%, -50%)`,
        zIndex: Math.round(pos.y) // Dynamic z-index based on Y position for correct overlap
      }}
      onClick={handleSheepClick}
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

        {/* Hover Status HUD */}
        {isDead ? (
          <div className={`absolute -top-12 bg-white/95 px-3 py-2 rounded-lg text-xs font-bold shadow-xl transition-opacity pointer-events-none z-50 whitespace-nowrap border border-red-200 text-red-600 ${showStatus ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            小羊死去了... 点击清除
          </div>
        ) : (
          <div className={`absolute -top-28 bg-white/95 px-3 py-2 rounded-lg text-xs font-bold shadow-xl transition-opacity pointer-events-none z-50 flex flex-col gap-1 whitespace-nowrap border border-slate-200 ${showStatus ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <div className="text-slate-800 text-sm border-b border-slate-200 pb-1 mb-1">
              {sheep.name} {sheep.gender === 'MALE' ? '♂️' : '♀️'} ({sheep.stage === 'BABY' ? '幼崽' : sheep.stage === 'GROWING' ? '成长期' : '成年'})
            </div>
            <div className="flex items-center gap-2"><Heart className="w-3 h-3 text-red-500"/> 健康: {Math.round(sheep.health)}</div>
            <div className="flex items-center gap-2"><Wheat className="w-3 h-3 text-amber-600"/> 饱食: {Math.round(sheep.hunger)}</div>
          </div>
        )}
        
        {/* Pixel Art Sheep */}
        <div 
          className={`${sizeClass} drop-shadow-md ${isDead ? 'grayscale opacity-70' : ''}`}
          style={{ 
            transform: `${facingRight ? 'scaleX(-1)' : 'scaleX(1)'} ${isDead ? 'rotate(180deg)' : ''}`,
            imageRendering: 'pixelated'
          }}
        >
          <motion.div
            className="w-full h-full origin-bottom"
            animate={
              isDefecating ? { scaleY: [1, 0.7, 0.7, 1], scaleX: [1, 1.1, 1.1, 1] } :
              isMoving && !isDead ? { y: [0, -4, 0] } : { y: 0 }
            }
            transition={
              isDefecating ? { duration: 0.6, times: [0, 0.3, 0.7, 1] } :
              isMoving && !isDead ? { repeat: Infinity, duration: 0.3 } : {}
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

            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <style>{`rect { shape-rendering: crispEdges; }`}</style>
              
              {/* Colors based on health */}
              {(() => {
                const isCritical = sheep.health > 0 && sheep.health < 40;
                const bodyColor = isCritical ? "#ffcccc" : "#ffffff";
                const bodyShadow = isCritical ? "#e6b3b3" : "#e0e0e0";
                const headColor = isCritical ? "#4a2222" : "#2a2a2a";
                const legColor = isCritical ? "#4a2222" : "#2a2a2a";
                const backLegColor = isCritical ? "#2a0000" : "#1a1a1a";
                const hornColor = "#d4b886";
                const hornShadow = "#b39865";
                const hasHorns = sheep.gender === 'MALE';
                
                return (
                  <>
                    {/* Back Legs */}
                    <rect x="8" y="18" width="2" height="4" fill={backLegColor}/>
                    <rect x="16" y="18" width="2" height="4" fill={backLegColor}/>
                    
                    {/* Body Shadow */}
                    <rect x="6" y="15" width="14" height="3" fill={bodyShadow}/>
                    <rect x="5" y="13" width="2" height="3" fill={bodyShadow}/>
                    <rect x="19" y="13" width="2" height="3" fill={bodyShadow}/>
                    
                    {/* Body Fill */}
                    <rect x="6" y="8" width="14" height="7" fill={bodyColor}/>
                    <rect x="5" y="9" width="16" height="5" fill={bodyColor}/>
                    <rect x="7" y="7" width="12" height="9" fill={bodyColor}/>
                    <rect x="8" y="6" width="10" height="11" fill={bodyColor}/>
                    
                    {/* Wool Fluffs (Highlights) */}
                    <rect x="7" y="7" width="2" height="2" fill="#ffffff"/>
                    <rect x="11" y="6" width="3" height="2" fill="#ffffff"/>
                    <rect x="16" y="7" width="2" height="2" fill="#ffffff"/>
                    
                    {/* Front Legs */}
                    <rect x="6" y="19" width="2" height="4" fill={legColor}/>
                    <rect x="14" y="19" width="2" height="4" fill={legColor}/>
                    
                    {/* Head Base */}
                    <rect x="2" y="8" width="5" height="6" fill={headColor}/>
                    <rect x="1" y="9" width="6" height="4" fill={headColor}/>
                    <rect x="3" y="14" width="3" height="2" fill={headColor}/>
                    
                    {/* Snout Highlight */}
                    <rect x="1" y="11" width="2" height="1" fill="#3a3a3a"/>
                    
                    {/* Horns (Male Only) */}
                    {hasHorns && (
                      <>
                        {/* Front Horn */}
                        <rect x="4" y="5" width="2" height="3" fill={hornColor}/>
                        <rect x="3" y="4" width="2" height="1" fill={hornColor}/>
                        <rect x="2" y="5" width="1" height="2" fill={hornColor}/>
                        <rect x="2" y="7" width="2" height="1" fill={hornShadow}/>
                        <rect x="5" y="6" width="1" height="2" fill={hornShadow}/>
                        
                        {/* Back Horn (Partially hidden) */}
                        <rect x="6" y="4" width="2" height="2" fill={hornShadow}/>
                        <rect x="7" y="6" width="1" height="1" fill={hornShadow}/>
                      </>
                    )}
                  </>
                );
              })()}
              
              {/* Eye */}
              {isDefecating ? (
                <rect x="3" y="9" width="2" height="1" fill="#ffffff"/>
              ) : !isNight ? (
                <>
                  <rect x="3" y="9" width="2" height="2" fill="#ffffff"/>
                  <rect x="3" y="9" width="1" height="1" fill="#000000"/>
                </>
              ) : (
                <rect x="3" y="10" width="2" height="1" fill="#111111"/>
              )}
              
              {/* Ear */}
              <rect x="5" y="11" width="2" height="1" fill="#111111"/>
              <rect x="6" y="12" width="1" height="1" fill="#111111"/>
            </svg>
          </motion.div>
        </div>

        {/* Shadow */}
        <div className="w-3/4 h-1.5 bg-black/20 rounded-[100%] absolute -bottom-1 blur-[1px]" />
      </div>
    </motion.div>
  );
}
