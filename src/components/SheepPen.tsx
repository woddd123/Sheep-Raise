import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { SheepEntity } from './SheepEntity';

export function SheepPen() {
  const sheepList = useGameStore(state => state.sheepList);
  const troughCapacity = useGameStore(state => state.troughCapacity);
  const maxTroughCapacity = useGameStore(state => state.maxTroughCapacity);
  const feces = useGameStore(state => state.feces);
  const penLevel = useGameStore(state => state.penLevel);
  const [isGateOpen, setIsGateOpen] = useState(false);

  // Map penLevel to max-width class
  const maxWidthClass = 
    !penLevel || penLevel === 1 ? 'max-w-md' :
    penLevel === 2 ? 'max-w-lg' :
    penLevel === 3 ? 'max-w-xl' :
    penLevel === 4 ? 'max-w-2xl' :
    penLevel === 5 ? 'max-w-3xl' :
    penLevel === 6 ? 'max-w-4xl' :
    penLevel === 7 ? 'max-w-5xl' :
    penLevel === 8 ? 'max-w-6xl' :
    'max-w-7xl';

  return (
    <div className="flex justify-center mb-12 mt-4">
      <div className={`relative w-full ${maxWidthClass} transition-all duration-1000 ease-in-out`}>
        <div 
          className="relative w-full aspect-square shadow-2xl rounded-xl overflow-hidden"
          style={{
            boxShadow: 'inset 0 0 24px rgba(0,0,0,0.3), 0 10px 25px rgba(0,0,0,0.15)',
          }}
        >
        {/* Fence Overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" style={{ imageRendering: 'pixelated' }}>
          <defs>
            {/* Top/Bottom Fence Pattern */}
            <pattern id="fence-h" x="0" y="0" width="16" height="32" patternUnits="userSpaceOnUse">
              <rect x="0" y="12" width="16" height="4" fill="#5c3a18" />
              <rect x="0" y="20" width="16" height="4" fill="#5c3a18" />
              <rect x="2" y="2" width="12" height="28" rx="2" fill="#8b5a2b" stroke="#5c3a18" strokeWidth="2"/>
              <line x1="6" y1="4" x2="6" y2="28" stroke="#a06a38" strokeWidth="2"/>
            </pattern>
            
            {/* Left/Right Fence Pattern */}
            <pattern id="fence-v" x="0" y="0" width="32" height="24" patternUnits="userSpaceOnUse">
              <rect x="14" y="0" width="4" height="24" fill="#5c3a18" />
              <rect x="10" y="2" width="12" height="20" rx="2" fill="#8b5a2b" stroke="#5c3a18" strokeWidth="2"/>
              <line x1="14" y1="4" x2="14" y2="20" stroke="#a06a38" strokeWidth="2"/>
            </pattern>
          </defs>
          
          {/* Draw Fences */}
          <rect x="0" y="0" width="32" height="100%" fill="url(#fence-v)" />
          <rect x="calc(100% - 32px)" y="0" width="32" height="100%" fill="url(#fence-v)" />
          
          {/* Top Fence with Gap for Gate */}
          <rect x="0" y="0" width="calc(50% - 32px)" height="32" fill="url(#fence-h)" />
          <rect x="calc(50% + 32px)" y="0" width="calc(50% - 32px)" height="32" fill="url(#fence-h)" />
          
          {/* Bottom Fence */}
          <rect x="0" y="calc(100% - 32px)" width="100%" height="32" fill="url(#fence-h)" />
          
          {/* Corner Posts */}
          <g stroke="#5c3a18" strokeWidth="2">
            <rect x="2" y="2" width="28" height="28" rx="4" fill="#8b5a2b" />
            <rect x="6" y="6" width="20" height="20" rx="2" fill="none" stroke="#a06a38" />
            
            <rect x="calc(100% - 30px)" y="2" width="28" height="28" rx="4" fill="#8b5a2b" />
            <rect x="calc(100% - 26px)" y="6" width="20" height="20" rx="2" fill="none" stroke="#a06a38" />
            
            <rect x="2" y="calc(100% - 30px)" width="28" height="28" rx="4" fill="#8b5a2b" />
            <rect x="6" y="calc(100% - 26px)" width="20" height="20" rx="2" fill="none" stroke="#a06a38" />
            
            <rect x="calc(100% - 30px)" y="calc(100% - 30px)" width="28" height="28" rx="4" fill="#8b5a2b" />
            <rect x="calc(100% - 26px)" y="calc(100% - 26px)" width="20" height="20" rx="2" fill="none" stroke="#a06a38" />
          </g>
        </svg>
        {/* Gate */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-8 z-30 cursor-pointer flex"
          onClick={() => setIsGateOpen(!isGateOpen)}
        >
          {/* Left Door */}
          <div className={`w-8 h-full relative origin-top-left transition-transform duration-500 ${isGateOpen ? '-rotate-90' : 'rotate-0'}`}>
             <svg width="100%" height="100%" style={{ imageRendering: 'pixelated', overflow: 'visible' }}>
               <rect x="0" y="10" width="32" height="4" fill="#6b4423" />
               <rect x="0" y="22" width="32" height="4" fill="#6b4423" />
               <rect x="2" y="2" width="12" height="28" rx="2" fill="#a06a38" stroke="#4a2e12" strokeWidth="2"/>
               <rect x="18" y="2" width="12" height="28" rx="2" fill="#a06a38" stroke="#4a2e12" strokeWidth="2"/>
               <line x1="2" y1="4" x2="30" y2="28" stroke="#6b4423" strokeWidth="3" />
             </svg>
          </div>
          {/* Right Door */}
          <div className={`w-8 h-full relative origin-top-right transition-transform duration-500 ${isGateOpen ? 'rotate-90' : 'rotate-0'}`}>
             <svg width="100%" height="100%" style={{ imageRendering: 'pixelated', overflow: 'visible' }}>
               <rect x="0" y="10" width="32" height="4" fill="#6b4423" />
               <rect x="0" y="22" width="32" height="4" fill="#6b4423" />
               <rect x="2" y="2" width="12" height="28" rx="2" fill="#a06a38" stroke="#4a2e12" strokeWidth="2"/>
               <rect x="18" y="2" width="12" height="28" rx="2" fill="#a06a38" stroke="#4a2e12" strokeWidth="2"/>
               <line x1="30" y1="4" x2="2" y2="28" stroke="#6b4423" strokeWidth="3" />
             </svg>
          </div>
        </div>

        {/* Dirt patches */}
        <div className="absolute top-1/4 left-1/4 w-32 h-20 bg-[#8b6b4a]/30 rounded-[100%] blur-md pointer-events-none"></div>
        <div className="absolute bottom-1/3 right-1/4 w-40 h-24 bg-[#8b6b4a]/30 rounded-[100%] blur-md pointer-events-none"></div>

        {/* Render Sheep */}
        {sheepList.map(sheep => (
          <SheepEntity key={sheep.id} sheep={sheep} />
        ))}

        {/* Render Feces */}
        {(feces || []).map(f => (
          <div
            key={f.id}
            className="absolute text-sm drop-shadow-sm pointer-events-none"
            style={{
              left: `${f.x}%`,
              top: `${f.y}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: Math.round(f.y) - 1
            }}
          >
            💩
          </div>
        ))}
        </div>

        {/* Trough (Placed outside the bottom fence) */}
        <div className="absolute z-30" style={{ left: '50%', bottom: '-16px', transform: 'translateX(-50%)' }}>
          <div className="relative w-40 h-14">
            <div className="absolute -bottom-1 left-2 w-36 h-4 bg-black/30 rounded-full blur-sm" />
            <div className="absolute inset-0 bg-[#8b5a2b] border-4 border-b-0 border-[#5c3a18] rounded-t-lg flex items-end overflow-hidden">
              <div 
                className="w-full bg-[#e6c280] transition-all duration-500"
                style={{ height: `${(troughCapacity / maxTroughCapacity) * 100}%` }}
              >
                <div className="w-full h-full opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, #c49a45 4px, #c49a45 8px)' }} />
              </div>
            </div>
            <div className="absolute inset-0 border-4 border-[#5c3a18] rounded-lg pointer-events-none" />
            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white drop-shadow-md pointer-events-none z-10">
              {Math.round(troughCapacity)}/{maxTroughCapacity}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
