import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { SheepEntity } from './SheepEntity';

export function SheepPen({ isFullScreen = false }: { isFullScreen?: boolean }) {
  const sheepList = useGameStore(state => state.sheepList);
  const troughCapacity = useGameStore(state => state.troughCapacity);
  const maxTroughCapacity = useGameStore(state => state.maxTroughCapacity);
  const feces = useGameStore(state => state.feces);
  const penLevel = useGameStore(state => state.penLevel);
  const [isGateOpen, setIsGateOpen] = useState(false);

  // Map penLevel to width for Full Screen mode
  const actualWidth = 
    !penLevel || penLevel === 1 ? 'w-[500px]' :
    penLevel === 2 ? 'w-[600px]' :
    penLevel === 3 ? 'w-[700px]' :
    penLevel === 4 ? 'w-[800px]' :
    penLevel === 5 ? 'w-[900px]' :
    penLevel === 6 ? 'w-[1000px]' :
    penLevel === 7 ? 'w-[1100px]' :
    penLevel === 8 ? 'w-[1200px]' :
    'w-[1400px]';

  // Main view is always a fixed square, Full screen uses actual width
  const penContainerClass = isFullScreen 
    ? `${actualWidth} h-[80vh]` 
    : 'w-[90vw] max-w-[400px] h-[90vw] max-h-[400px]';

  return (
    <div className={`flex justify-center items-center w-full ${isFullScreen ? 'h-full p-8' : 'min-h-[300px] mb-8 mt-4'}`}>
      <div className={`relative ${penContainerClass} transition-all duration-500 ease-in-out`}>
        <div 
          className="relative w-full h-full rounded-2xl overflow-hidden bg-transparent"
        >
        {/* Fence Overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-40" style={{ imageRendering: 'pixelated' }}>
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
          <rect x="0" y="0" width="24" height="100%" fill="url(#fence-v)" />
          <rect x="100%" y="0" width="24" height="100%" fill="url(#fence-v)" transform="translate(-24, 0)" />
          
          {/* Top Fence with Gap for Gate */}
          <rect x="0" y="0" width="45%" height="24" fill="url(#fence-h)" />
          <rect x="55%" y="0" width="45%" height="24" fill="url(#fence-h)" />
          
          {/* Bottom Fence */}
          <rect x="0" y="100%" width="100%" height="24" fill="url(#fence-h)" transform="translate(0, -24)" />
          
          {/* Corner Posts */}
          <g stroke="#5c3a18" strokeWidth="2">
            <rect x="0" y="0" width="24" height="24" rx="2" fill="#8b5a2b" />
            <rect x="100%" y="0" width="24" height="24" rx="2" fill="#8b5a2b" transform="translate(-24, 0)" />
            <rect x="0" y="100%" width="24" height="24" rx="2" fill="#8b5a2b" transform="translate(0, -24)" />
            <rect x="100%" y="100%" width="24" height="24" rx="2" fill="#8b5a2b" transform="translate(-24, -24)" />
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

        {/* Dirt patches - Scaled and subtle */}
        <div className="absolute top-[20%] left-[20%] w-[25%] h-[15%] bg-[#6b5236]/20 rounded-[100%] blur-xl pointer-events-none"></div>
        <div className="absolute bottom-[30%] right-[20%] w-[30%] h-[18%] bg-[#6b5236]/20 rounded-[100%] blur-xl pointer-events-none"></div>

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
              left: `${Math.max(18, Math.min(82, f.x))}%`,
              top: `${Math.max(18, Math.min(82, f.y))}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: Math.round(f.y) - 1
            }}
          >
            💩
          </div>
        ))}
        </div>

        {/* Trough (Placed outside the bottom fence) */}
        <div className="absolute z-50" style={{ left: '50%', bottom: '-16px', transform: 'translateX(-50%)' }}>
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
