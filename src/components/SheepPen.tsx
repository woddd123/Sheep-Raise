import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { SheepEntity } from './SheepEntity';

export function SheepPen() {
  const sheepList = useGameStore(state => state.sheepList);
  const troughCapacity = useGameStore(state => state.troughCapacity);
  const maxTroughCapacity = useGameStore(state => state.maxTroughCapacity);
  const feces = useGameStore(state => state.feces);
  const [isGateOpen, setIsGateOpen] = useState(false);

  // Main view is always a fixed square
  const penContainerClass = 'w-[90vw] max-w-[400px] h-[90vw] max-h-[400px]';

  return (
    <div className="flex justify-center items-center w-full min-h-[300px] mb-8 mt-4">
      <div className={`relative ${penContainerClass} transition-all duration-500 ease-in-out`}>
        <div 
          className="relative w-full h-full rounded-2xl overflow-hidden bg-transparent"
        >
        {/* Fence Overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-40" style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges' }}>
          <defs>
            {/* Top/Bottom Fence Pattern */}
            <pattern id="fence-h" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              {/* Horizontal Rails Outline */}
              <rect x="0" y="8" width="24" height="8" fill="#000000" />
              {/* Horizontal Rails Fill */}
              <rect x="0" y="10" width="24" height="4" fill="#c07c40" />
              {/* Horizontal Rails Shadow/Grain */}
              <rect x="0" y="12" width="24" height="2" fill="#8a5020" />
              
              {/* Vertical Post Outline */}
              <rect x="6" y="2" width="12" height="20" fill="#000000" />
              {/* Vertical Post Fill */}
              <rect x="8" y="4" width="8" height="16" fill="#c07c40" />
              {/* Vertical Post Shadow/Grain */}
              <rect x="12" y="4" width="4" height="16" fill="#8a5020" />
              <rect x="8" y="16" width="8" height="4" fill="#8a5020" />
              <rect x="8" y="4" width="2" height="2" fill="#e8a870" />
              
              {/* Nail */}
              <rect x="10" y="10" width="4" height="4" fill="#000000" />
              <rect x="10" y="10" width="2" height="2" fill="#666666" />
            </pattern>
            
            {/* Left/Right Fence Pattern */}
            <pattern id="fence-v" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              {/* Vertical Rails Outline */}
              <rect x="8" y="0" width="8" height="24" fill="#000000" />
              {/* Vertical Rails Fill */}
              <rect x="10" y="0" width="4" height="24" fill="#c07c40" />
              {/* Vertical Rails Shadow/Grain */}
              <rect x="12" y="0" width="2" height="24" fill="#8a5020" />
              
              {/* Horizontal Post Outline */}
              <rect x="2" y="6" width="20" height="12" fill="#000000" />
              {/* Horizontal Post Fill */}
              <rect x="4" y="8" width="16" height="8" fill="#c07c40" />
              {/* Horizontal Post Shadow/Grain */}
              <rect x="4" y="12" width="16" height="4" fill="#8a5020" />
              <rect x="16" y="8" width="4" height="8" fill="#8a5020" />
              <rect x="4" y="8" width="2" height="2" fill="#e8a870" />
              
              {/* Nail */}
              <rect x="10" y="10" width="4" height="4" fill="#000000" />
              <rect x="10" y="10" width="2" height="2" fill="#666666" />
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
          <g>
            {/* Top Left */}
            <rect x="2" y="2" width="20" height="20" fill="#000000" />
            <rect x="4" y="4" width="16" height="16" fill="#c07c40" />
            <rect x="12" y="4" width="8" height="16" fill="#8a5020" />
            <rect x="4" y="12" width="16" height="8" fill="#8a5020" />
            <rect x="4" y="4" width="4" height="4" fill="#e8a870" />
            
            {/* Top Right */}
            <g transform="translate(100%, 0) translate(-24, 0)">
              <rect x="2" y="2" width="20" height="20" fill="#000000" />
              <rect x="4" y="4" width="16" height="16" fill="#c07c40" />
              <rect x="12" y="4" width="8" height="16" fill="#8a5020" />
              <rect x="4" y="12" width="16" height="8" fill="#8a5020" />
              <rect x="4" y="4" width="4" height="4" fill="#e8a870" />
            </g>
            
            {/* Bottom Left */}
            <g transform="translate(0, 100%) translate(0, -24)">
              <rect x="2" y="2" width="20" height="20" fill="#000000" />
              <rect x="4" y="4" width="16" height="16" fill="#c07c40" />
              <rect x="12" y="4" width="8" height="16" fill="#8a5020" />
              <rect x="4" y="12" width="16" height="8" fill="#8a5020" />
              <rect x="4" y="4" width="4" height="4" fill="#e8a870" />
            </g>
            
            {/* Bottom Right */}
            <g transform="translate(100%, 100%) translate(-24, -24)">
              <rect x="2" y="2" width="20" height="20" fill="#000000" />
              <rect x="4" y="4" width="16" height="16" fill="#c07c40" />
              <rect x="12" y="4" width="8" height="16" fill="#8a5020" />
              <rect x="4" y="12" width="16" height="8" fill="#8a5020" />
              <rect x="4" y="4" width="4" height="4" fill="#e8a870" />
            </g>
          </g>
        </svg>
        {/* Gate */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-8 z-30 cursor-pointer flex"
          onClick={() => setIsGateOpen(!isGateOpen)}
        >
          {/* Left Door */}
          <div className={`w-8 h-full relative origin-top-left transition-transform duration-500 ${isGateOpen ? '-rotate-90' : 'rotate-0'}`}>
             <svg width="100%" height="100%" style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges', overflow: 'visible' }}>
               {/* Horizontal Rails Outline */}
               <rect x="0" y="8" width="32" height="8" fill="#000000" />
               {/* Horizontal Rails Fill */}
               <rect x="0" y="10" width="32" height="4" fill="#c07c40" />
               {/* Horizontal Rails Shadow/Grain */}
               <rect x="0" y="12" width="32" height="2" fill="#8a5020" />
               
               {/* Diagonal cross brace */}
               <line x1="4" y1="10" x2="28" y2="22" stroke="#000000" strokeWidth="6" />
               <line x1="4" y1="10" x2="28" y2="22" stroke="#c07c40" strokeWidth="4" />
               <line x1="4" y1="12" x2="28" y2="24" stroke="#8a5020" strokeWidth="2" />

               {/* Left Post */}
               <rect x="2" y="2" width="12" height="20" fill="#000000" />
               <rect x="4" y="4" width="8" height="16" fill="#c07c40" />
               <rect x="8" y="4" width="4" height="16" fill="#8a5020" />
               <rect x="4" y="16" width="8" height="4" fill="#8a5020" />
               <rect x="4" y="4" width="2" height="2" fill="#e8a870" />
               
               {/* Right Post */}
               <rect x="18" y="2" width="12" height="20" fill="#000000" />
               <rect x="20" y="4" width="8" height="16" fill="#c07c40" />
               <rect x="24" y="4" width="4" height="16" fill="#8a5020" />
               <rect x="20" y="16" width="8" height="4" fill="#8a5020" />
               <rect x="20" y="4" width="2" height="2" fill="#e8a870" />
             </svg>
          </div>
          {/* Right Door */}
          <div className={`w-8 h-full relative origin-top-right transition-transform duration-500 ${isGateOpen ? 'rotate-90' : 'rotate-0'}`}>
             <svg width="100%" height="100%" style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges', overflow: 'visible' }}>
               {/* Horizontal Rails Outline */}
               <rect x="0" y="8" width="32" height="8" fill="#000000" />
               {/* Horizontal Rails Fill */}
               <rect x="0" y="10" width="32" height="4" fill="#c07c40" />
               {/* Horizontal Rails Shadow/Grain */}
               <rect x="0" y="12" width="32" height="2" fill="#8a5020" />
               
               {/* Diagonal cross brace */}
               <line x1="28" y1="10" x2="4" y2="22" stroke="#000000" strokeWidth="6" />
               <line x1="28" y1="10" x2="4" y2="22" stroke="#c07c40" strokeWidth="4" />
               <line x1="28" y1="12" x2="4" y2="24" stroke="#8a5020" strokeWidth="2" />

               {/* Left Post */}
               <rect x="2" y="2" width="12" height="20" fill="#000000" />
               <rect x="4" y="4" width="8" height="16" fill="#c07c40" />
               <rect x="8" y="4" width="4" height="16" fill="#8a5020" />
               <rect x="4" y="16" width="8" height="4" fill="#8a5020" />
               <rect x="4" y="4" width="2" height="2" fill="#e8a870" />
               
               {/* Right Post */}
               <rect x="18" y="2" width="12" height="20" fill="#000000" />
               <rect x="20" y="4" width="8" height="16" fill="#c07c40" />
               <rect x="24" y="4" width="4" height="16" fill="#8a5020" />
               <rect x="20" y="16" width="8" height="4" fill="#8a5020" />
               <rect x="20" y="4" width="2" height="2" fill="#e8a870" />
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
            <div className="absolute inset-0 bg-[#c07c40] border-4 border-b-0 border-black flex items-end overflow-hidden" style={{ imageRendering: 'pixelated' }}>
              <div 
                className="w-full bg-[#e6c280] transition-all duration-500 border-t-4 border-black"
                style={{ height: `${(troughCapacity / maxTroughCapacity) * 100}%` }}
              >
                <div className="w-full h-full opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, #c49a45 4px, #c49a45 8px)' }} />
              </div>
            </div>
            <div className="absolute inset-0 border-4 border-black pointer-events-none" />
            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white drop-shadow-[0_2px_0_rgba(0,0,0,1)] pointer-events-none z-10">
              {Math.round(troughCapacity)}/{maxTroughCapacity}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
