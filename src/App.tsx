import { useEffect, useState } from 'react';
import { useGameStore } from './store/gameStore';
import { Droplets, Wheat, Heart, Coins, Star, Plus, Moon, Sun, Wrench, X } from 'lucide-react';
import { SheepPen } from './components/SheepPen';

export default function App() {
  const { level, exp, coins, sheepList, gameTick, addSheep, fillTrough, cleanAll, troughCapacity, maxTroughCapacity, addCoins, upgradeTrough, timeOfDay, feces, penLevel, upgradePen, sellSheep, shearSheep, breedSheep, devSetState, wool } = useGameStore();

  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);

  const maxSheep = 4 + (penLevel || 1) * 4;
  const upgradePenCost = (penLevel || 1) * 500;
  const upgradePenLevelReq = (penLevel || 1) * 2;

  const isNight = timeOfDay >= 19 || timeOfDay < 6;
  const hours = Math.floor(timeOfDay);
  const minutes = Math.floor((timeOfDay - hours) * 60);
  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  // Calculate environmental lighting
  const getDarkness = (time: number) => {
    if (time >= 18 && time <= 20) return (time - 18) / 2 * 0.65;
    if (time > 20 || time < 4) return 0.65;
    if (time >= 4 && time <= 6) return 0.65 - (time - 4) / 2 * 0.65;
    return 0;
  };
  const darkness = getDarkness(timeOfDay);

  const getSunsetOpacity = (time: number) => {
    if (time >= 17 && time <= 19.5) return (1 - Math.abs(time - 18.25) / 1.25) * 0.35;
    if (time >= 4.5 && time <= 7) return (1 - Math.abs(time - 5.75) / 1.25) * 0.25;
    return 0;
  };
  const sunsetOpacity = Math.max(0, getSunsetOpacity(timeOfDay));

  // Sun: 5 to 19
  let sunProgress = -1;
  if (timeOfDay >= 5 && timeOfDay <= 19) {
    sunProgress = (timeOfDay - 5) / 14;
  }

  // Moon: 17 to 7
  let moonProgress = -1;
  if (timeOfDay >= 17 || timeOfDay <= 7) {
    const adjustedTime = timeOfDay < 12 ? timeOfDay + 24 : timeOfDay;
    moonProgress = (adjustedTime - 17) / 14;
  }

  // Core Game Loop
  useEffect(() => {
    const interval = setInterval(() => {
      gameTick();
    }, 1000); // 1 second tick
    return () => clearInterval(interval);
  }, [gameTick]);

  return (
    <div className="min-h-screen bg-[#7ec850] text-slate-800 font-sans pb-20 relative overflow-hidden">
      {/* Environmental Lighting Overlays */}
      <div 
        className="fixed inset-0 pointer-events-none z-20 transition-all duration-1000 ease-linear" 
        style={{ backgroundColor: `rgba(15, 23, 42, ${darkness})` }} 
      />
      <div 
        className="fixed inset-0 pointer-events-none z-20 transition-all duration-1000 ease-linear mix-blend-color-burn" 
        style={{ backgroundColor: `rgba(249, 115, 22, ${sunsetOpacity})` }} 
      />

      {/* Celestial Bodies */}
      <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
        {sunProgress >= 0 && (
          <div 
            className="absolute w-24 h-24 bg-yellow-300 rounded-full blur-[4px] shadow-[0_0_60px_rgba(253,224,71,0.8)] flex items-center justify-center text-6xl"
            style={{
              left: `calc(${sunProgress * 100}% - 3rem)`,
              top: `${Math.max(5, 40 - Math.sin(sunProgress * Math.PI) * 35)}vh`,
              transition: 'left 1s linear, top 1s linear'
            }}
          >
            ☀️
          </div>
        )}
        {moonProgress >= 0 && (
          <div 
            className="absolute w-20 h-20 bg-slate-100 rounded-full blur-[2px] shadow-[0_0_50px_rgba(241,245,249,0.9)] flex items-center justify-center text-5xl"
            style={{
              left: `calc(${moonProgress * 100}% - 2.5rem)`,
              top: `${Math.max(5, 40 - Math.sin(moonProgress * Math.PI) * 35)}vh`,
              transition: 'left 1s linear, top 1s linear'
            }}
          >
            🌙
          </div>
        )}
      </div>

      {/* Fullscreen Grass Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <svg width="100%" height="100%" style={{ imageRendering: 'pixelated' }}>
          <defs>
            <pattern id="grass-pattern-bg" x="0" y="0" width="64" height="64" patternUnits="userSpaceOnUse">
              <rect width="64" height="64" fill="#7ec850"/>
              <g fill="#529432">
                <rect x="10" y="14" width="2" height="6" />
                <rect x="12" y="10" width="2" height="10" />
                <rect x="14" y="16" width="2" height="4" />
                <rect x="40" y="44" width="2" height="6" />
                <rect x="42" y="40" width="2" height="10" />
                <rect x="44" y="46" width="2" height="4" />
                <rect x="50" y="10" width="2" height="4" />
                <rect x="52" y="8" width="2" height="6" />
              </g>
              <g fill="#8cd460">
                <rect x="26" y="34" width="2" height="6" />
                <rect x="28" y="30" width="2" height="10" />
                <rect x="30" y="36" width="2" height="4" />
                <rect x="8" y="50" width="2" height="4" />
                <rect x="10" y="48" width="2" height="6" />
                <rect x="56" y="26" width="2" height="6" />
                <rect x="58" y="24" width="2" height="8" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grass-pattern-bg)" />
        </svg>
      </div>

      {/* Header / HUD */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm p-4 sticky top-0 z-30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 relative">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl font-bold text-green-700">我的牧场</h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm mt-1 text-slate-600">
            <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-500" /> Lv.{level} ({exp}/100)</span>
            <span className="flex items-center gap-1">
              <Coins className="w-4 h-4 text-amber-500" /> {coins}
              <button 
                onClick={() => addCoins(999999)} 
                className="ml-1 sm:ml-2 text-xs bg-amber-100 hover:bg-amber-200 text-amber-700 px-2 py-0.5 rounded-full transition-colors font-bold"
              >
                + 无限金币
              </button>
            </span>
            <span className="font-mono bg-slate-100 px-2 py-1 rounded-md flex items-center gap-1 shadow-inner ml-auto sm:ml-2">
              {isNight ? <Moon className="w-3 h-3 text-indigo-500" /> : <Sun className="w-3 h-3 text-orange-500" />}
              {timeString}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setIsDevPanelOpen(true)}
            className="flex-1 sm:flex-none justify-center bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-full flex items-center gap-1 text-sm font-medium transition-colors"
          >
            <Wrench className="w-4 h-4" /> 开发者面板
          </button>
          <button 
            onClick={addSheep}
            disabled={coins < 50 || sheepList.length >= maxSheep}
            className="flex-1 sm:flex-none justify-center bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-full flex items-center gap-1 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> 买羊 (50)
          </button>
        </div>
      </header>

      {/* Main Farm Area */}
      <main className="p-4 max-w-4xl mx-auto relative z-10">
        
        {/* Visual Sheep Pen */}
        <SheepPen />

        {/* Farm Actions */}
        <div className="flex justify-center gap-2 sm:gap-4 mb-6 sm:mb-8 flex-wrap">
          <button
            onClick={fillTrough}
            disabled={coins < 10 || troughCapacity >= maxTroughCapacity}
            className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl flex items-center gap-1 sm:gap-2 text-sm sm:text-base font-bold shadow-sm transition-colors flex-1 sm:flex-none justify-center min-w-[120px]"
          >
            <Wheat className="w-4 h-4 sm:w-5 sm:h-5" /> 放食物 (10)
          </button>
          <button
            onClick={upgradeTrough}
            disabled={coins < 100 * (maxTroughCapacity / 100)}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl flex items-center gap-1 sm:gap-2 text-sm sm:text-base font-bold shadow-sm transition-colors flex-1 sm:flex-none justify-center min-w-[120px]"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> 升级食槽 ({100 * (maxTroughCapacity / 100)})
          </button>
          <button
            onClick={cleanAll}
            disabled={coins < 10 || !(feces?.length > 0)}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl flex items-center gap-1 sm:gap-2 text-sm sm:text-base font-bold shadow-sm transition-colors flex-1 sm:flex-none justify-center min-w-[120px]"
          >
            <Droplets className="w-4 h-4 sm:w-5 sm:h-5" /> 清理粪便 (10)
          </button>
          <button
            onClick={upgradePen}
            disabled={coins < upgradePenCost || level < upgradePenLevelReq}
            className="bg-purple-500 hover:bg-purple-600 disabled:bg-slate-300 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl flex items-center gap-1 sm:gap-2 text-sm sm:text-base font-bold shadow-sm transition-colors flex-1 sm:flex-none justify-center min-w-[120px]"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> 扩建 ({upgradePenCost})
            {level < upgradePenLevelReq && <span className="text-xs ml-1">(需Lv.{upgradePenLevelReq})</span>}
          </button>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-1 sm:gap-0">
            <h2 className="text-lg font-bold text-slate-800">羊群状态 ({sheepList.length}/{maxSheep})</h2>
            <span className="text-xs sm:text-sm text-slate-500">将鼠标悬停在羊圈中的小羊上可查看详细状态</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sheepList.map(sheep => (
              <div key={sheep.id} className={`bg-slate-50 rounded-xl p-4 border relative overflow-hidden flex items-center gap-3 ${sheep.health <= 0 ? 'border-red-200 bg-red-50/50' : 'border-slate-100'}`}>
                {sheep.health <= 0 && <div className="absolute inset-0 bg-red-900/5 z-0 pointer-events-none" />}
                {sheep.health > 0 && sheep.health < 50 && <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse" />}
                <div className="text-3xl relative z-10">{sheep.health <= 0 ? '💀' : '🐑'}</div>
                <div className="relative z-10">
                  <h3 className={`font-bold text-sm ${sheep.health <= 0 ? 'text-red-600' : ''}`}>
                    {sheep.name} {sheep.gender === 'MALE' ? '♂️' : '♀️'} {sheep.health <= 0 && '(已死亡)'}
                  </h3>
                  <div className="text-xs text-slate-500 mt-1">
                    健康: {Math.round(sheep.health)} | 饱食: {Math.round(sheep.hunger)}
                  </div>
                  
                  {/* Actions */}
                  {sheep.health > 0 && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {sheep.stage === 'ADULT' ? (
                        <>
                          <button 
                            onClick={() => shearSheep(sheep.id)}
                            disabled={(sheep.woolGrowth || 0) < 100}
                            className={`px-2 py-1 text-xs rounded font-bold transition-colors ${(sheep.woolGrowth || 0) >= 100 ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                          >
                            剪毛 ({Math.floor(sheep.woolGrowth || 0)}%)
                          </button>
                          <button 
                            onClick={() => breedSheep(sheep.id)}
                            disabled={(sheep.age - (sheep.lastBredAge || 0) < 600 && (sheep.lastBredAge || 0) !== 0) || sheepList.filter(s => s.stage === 'ADULT' && s.health > 0 && s.id !== sheep.id).length === 0}
                            className={`px-2 py-1 text-xs rounded font-bold transition-colors ${((sheep.age - (sheep.lastBredAge || 0) >= 600 || (sheep.lastBredAge || 0) === 0) && sheepList.filter(s => s.stage === 'ADULT' && s.health > 0 && s.id !== sheep.id).length > 0) ? 'bg-pink-500 text-white hover:bg-pink-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                          >
                            繁育
                          </button>
                          <button 
                            onClick={() => sellSheep(sheep.id)}
                            className="px-2 py-1 text-xs rounded font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                          >
                            出售 (150)
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => sellSheep(sheep.id)}
                          className="px-2 py-1 text-xs rounded font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                        >
                          出售 ({sheep.stage === 'GROWING' ? 80 : 30})
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Developer Panel Modal */}
      {isDevPanelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-800 text-white p-4 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Wrench className="w-5 h-5" /> 开发者面板
              </h2>
              <button onClick={() => setIsDevPanelOpen(false)} className="hover:bg-slate-700 p-1 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">金币 (Coins)</label>
                <input 
                  type="number" 
                  value={coins} 
                  onChange={(e) => devSetState({ coins: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">等级 (Level)</label>
                <input 
                  type="number" 
                  value={level} 
                  onChange={(e) => devSetState({ level: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">经验 (Exp)</label>
                <input 
                  type="number" 
                  value={exp} 
                  onChange={(e) => devSetState({ exp: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">羊圈等级 (Pen Level)</label>
                <input 
                  type="number" 
                  value={penLevel} 
                  onChange={(e) => devSetState({ penLevel: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">羊毛 (Wool)</label>
                <input 
                  type="number" 
                  value={wool} 
                  onChange={(e) => devSetState({ wool: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">当前食槽食物 (Trough Capacity)</label>
                <input 
                  type="number" 
                  value={troughCapacity} 
                  onChange={(e) => devSetState({ troughCapacity: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">食槽上限 (Max Trough Capacity)</label>
                <input 
                  type="number" 
                  value={maxTroughCapacity} 
                  onChange={(e) => devSetState({ maxTroughCapacity: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">时间 (Time of Day: 0-24)</label>
                <input 
                  type="range" 
                  min="0" 
                  max="24" 
                  step="0.1"
                  value={timeOfDay} 
                  onChange={(e) => devSetState({ timeOfDay: Number(e.target.value) })}
                  className="w-full"
                />
                <div className="text-right text-xs text-slate-500 mt-1">{timeOfDay.toFixed(1)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
