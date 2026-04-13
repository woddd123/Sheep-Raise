import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useGameStore } from './store/gameStore';
import { Droplets, Wheat, Heart, Coins, Star, Plus, Moon, Sun, Wrench, X, Maximize2, Volume2, VolumeX, ChevronRight, ChevronLeft, Hammer } from 'lucide-react';
import { SheepPen } from './components/SheepPen';
import { initAudio, playBaa } from './utils/audio';

export default function App() {
  const { level, exp, coins, sheepList, gameTick, addSheep, cleanAll, addCoins, timeOfDay, feces, penLevel, upgradePen, sellSheep, shearSheep, breedSheep, devSetState, wool, timeSpeed, dayCount, soundEnabled, setSoundEnabled, weather, windDirection, windStrength } = useGameStore();

  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

  const maxSheep = 4 + (penLevel || 1) * 4;
  const upgradePenCost = (penLevel || 1) * 500;
  const upgradePenLevelReq = (penLevel || 1) * 2;
  const penArea = (penLevel || 1) * 25; // Simple area calculation: 25sqm per level

  const buildMode = useGameStore(state => state.buildMode);
  const toggleBuildMode = useGameStore(state => state.toggleBuildMode);

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

  // Init audio on first interaction
  useEffect(() => {
    const handleFirstInteraction = async () => {
      if (soundEnabled) {
        await initAudio();
      }
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);
    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [soundEnabled]);

  return (
    <div className="min-h-screen text-slate-800 font-sans pb-20 relative overflow-hidden">
      {/* Environmental Lighting Overlays */}
      <div className="absolute inset-0 pointer-events-none z-10 transition-colors duration-1000" style={{ backgroundColor: `rgba(0, 0, 40, ${darkness})` }} />
      <div className="absolute inset-0 pointer-events-none z-10 transition-colors duration-1000" style={{ backgroundColor: `rgba(255, 100, 0, ${sunsetOpacity})` }} />

      {/* Main Content Layer */}
      <div className="relative z-20 h-full w-full min-h-screen">
      {/* Top Header for Time and Progress */}
      <div className="fixed top-4 left-0 right-0 z-50 px-4 pointer-events-none flex items-center justify-between gap-4">
        {/* Day Display */}
        <div className="bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-white/40 flex items-center gap-2 font-mono text-sm pointer-events-auto font-bold text-slate-700">
          第 {dayCount || 1} 天
        </div>

        {/* Floating Stick Time Progress Bar */}
        <div className="relative flex-1 max-w-xl h-3">
          <div className="relative w-full h-full">
            {/* Shadow */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[98%] h-2 bg-black/15 rounded-full blur-sm" />
            
            {/* Stick Body */}
            <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-500 to-sky-800 rounded-full border border-white/40 shadow-md overflow-visible">
              {/* Progress Track Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/30 via-transparent to-indigo-900/30 rounded-full" />

              {/* Time Markers */}
              <div className="absolute inset-x-4 inset-y-0 flex justify-between items-center opacity-40">
                {[0, 6, 12, 18, 24].map(h => (
                  <div key={h} className="h-full w-[1px] bg-white/60" />
                ))}
              </div>

              {/* Celestial Bodies (Sliding on the stick) */}
              <div className="relative w-full h-full px-4">
                {sunProgress >= 0 && (
                  <motion.div 
                    className="absolute top-1/2 -translate-y-1/2 text-3xl z-10 drop-shadow-[0_0_12px_rgba(253,224,71,1)]"
                    animate={{ 
                      left: `calc(${sunProgress * 100}% - 18px)`,
                      opacity: sunProgress < 0.01 || sunProgress > 0.99 ? 0 : 1
                    }}
                    transition={{ duration: 1, ease: "linear" }}
                  >
                    ☀️
                  </motion.div>
                )}
                
                {moonProgress >= 0 && (
                  <motion.div 
                    className="absolute top-1/2 -translate-y-1/2 text-2xl z-10 drop-shadow-[0_0_12px_rgba(241,245,249,1)]"
                    animate={{ 
                      left: `calc(${moonProgress * 100}% - 14px)`,
                      opacity: moonProgress < 0.01 || moonProgress > 0.99 ? 0 : 1
                    }}
                    transition={{ duration: 1, ease: "linear" }}
                  >
                    🌙
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Minimal Time Display */}
        <div className="bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-white/40 flex items-center gap-2 font-mono text-sm pointer-events-auto">
          {isNight ? <Moon className="w-4 h-4 text-indigo-500" /> : <Sun className="w-4 h-4 text-orange-500" />}
          {timeString}
          {/* Weather Icon */}
          <span className="ml-1 text-base">
            {weather === 'sunny' && '☀️'}
            {weather === 'rainy' && '🌧️'}
            {weather === 'windy' && '💨'}
          </span>
        </div>

        {/* Sound Toggle */}
        <button
          onClick={async () => {
            const newState = !soundEnabled;
            setSoundEnabled(newState);
            if (newState) {
              await initAudio();
              playBaa(0.3);
            }
          }}
          className="bg-white/80 backdrop-blur-sm p-1.5 rounded-full shadow-sm border border-white/40 text-slate-700 hover:bg-white transition-colors pointer-events-auto"
          title={soundEnabled ? "关闭声音" : "开启声音"}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Environmental Lighting Overlays (Full Screen) */}
      <div
        className="fixed inset-0 pointer-events-none z-40 transition-all duration-1000 ease-linear"
        style={{ backgroundColor: `rgba(15, 23, 42, ${darkness})` }}
      />
      <div
        className="fixed inset-0 pointer-events-none z-40 transition-all duration-1000 ease-linear mix-blend-color-burn"
        style={{ backgroundColor: `rgba(249, 115, 22, ${sunsetOpacity})` }}
      />

      {/* Rain Effect Overlay */}
      {weather === 'rainy' && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {/* Rain drops */}
          {Array.from({ length: 100 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-rain"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20 + 10}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${0.5 + Math.random() * 0.5}s`,
                width: '2px',
                height: '15px',
                background: 'linear-gradient(to bottom, transparent, rgba(200, 220, 255, 0.6))',
                borderRadius: '1px'
              }}
            />
          ))}
          {/* Rain overlay tint */}
          <div className="absolute inset-0 bg-blue-200/10" />
        </div>
      )}

      {/* Wind Effect Overlay */}
      {weather === 'windy' && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {/* Wind streaks */}
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-wind"
              style={{
                left: '-10%',
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${1 + Math.random() * 2}s`,
                width: `${50 + Math.random() * 100}px`,
                height: '2px',
                background: 'linear-gradient(to right, transparent, rgba(200, 200, 200, 0.4), transparent)',
                transform: `rotate(${windDirection * 0.1}deg)`
              }}
            />
          ))}
        </div>
      )}

      {/* Fullscreen Grass Background */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'url(/grass/grasses.png)',
          backgroundSize: '128px 32px', // Size of the 4-tile strip
          backgroundRepeat: 'repeat',
          imageRendering: 'pixelated'
        }}
      />

      {/* Visual Sheep Pen Area - Now Fullscreen */}
      <div className="fixed inset-0 pointer-events-auto z-10">
        <SheepPen />
      </div>

      {/* Left Drawer - Control Panel (我的牧场) */}
      <motion.div 
        className="fixed left-0 top-0 bottom-0 z-50 flex items-center h-full pointer-events-none"
        initial={false}
        animate={{ x: isLeftPanelOpen ? 0 : 'calc(-100% + 32px)' }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
      >
        <div className="bg-white/40 backdrop-blur-xl h-full w-[350px] sm:w-[450px] p-6 shadow-[10px_0_30px_rgba(0,0,0,0.1)] border-r border-white/50 overflow-y-auto pointer-events-auto flex flex-col">
          {/* Content of Management Panel */}
          <div className="flex flex-col gap-4 mb-6 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-green-700 tracking-tight">我的牧场</h1>
              <div className="bg-green-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">
                Level {level}
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 mt-3">
              <div className="flex flex-col">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">资产</span>
                <div className="flex items-center gap-1 text-amber-600 font-black text-base">
                  <Coins className="w-4 h-4" /> {coins.toLocaleString()}
                </div>
              </div>
              <div className="flex flex-col border-l border-slate-100 pl-4">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">面积</span>
                <div className="flex items-center gap-1 text-green-600 font-black text-base">
                  <Maximize2 className="w-4 h-4" /> {penArea} ㎡
                </div>
              </div>
              <div className="flex flex-col border-l border-slate-100 pl-4">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">羊群</span>
                <div className="flex items-center gap-1 text-indigo-600 font-black text-base">
                  <Heart className="w-4 h-4" /> {sheepList.length}/{maxSheep}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-4">
              <button 
                onClick={addSheep}
                disabled={coins < 50 || sheepList.length >= maxSheep}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white px-4 py-2.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-black transition-all shadow-[0_4px_0_rgb(22,101,52)] active:shadow-none active:translate-y-1"
              >
                <Plus className="w-4 h-4" /> 买羊 (50)
              </button>
              <button 
                onClick={() => setIsDevPanelOpen(true)}
                className="bg-slate-800 hover:bg-slate-900 text-white p-2.5 rounded-2xl transition-all shadow-[0_4px_0_rgb(30,41,59)] active:shadow-none active:translate-y-1"
                title="开发者面板"
              >
                <Wrench className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Action Grid */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={cleanAll}
              disabled={coins < 10 || !(feces?.length > 0)}
              className="group relative bg-blue-500 hover:bg-blue-600 disabled:bg-slate-100 disabled:text-slate-400 text-white p-4 rounded-2xl flex flex-col items-center gap-2 text-sm font-black shadow-[0_4px_0_rgb(29,78,216)] active:shadow-none active:translate-y-1 transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Droplets className="w-6 h-6" />
              <span>清理粪便 (10)</span>
            </button>
            <button
              onClick={upgradePen}
              disabled={coins < upgradePenCost || level < upgradePenLevelReq}
              className="group relative bg-purple-500 hover:bg-purple-600 disabled:bg-slate-100 disabled:text-slate-400 text-white p-4 rounded-2xl flex flex-col items-center gap-2 text-sm font-black shadow-[0_4px_0_rgb(126,34,206)] active:shadow-none active:translate-y-1 transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Plus className="w-6 h-6" />
              <div className="flex flex-col items-center">
                <span>扩建 ({upgradePenCost})</span>
                {level < upgradePenLevelReq && <span className="text-[9px] font-bold opacity-70">需Lv.{upgradePenLevelReq}</span>}
              </div>
            </button>
            <button
              onClick={toggleBuildMode}
              className={`group relative ${buildMode ? 'bg-amber-500 hover:bg-amber-600 shadow-[0_4px_0_rgb(217,119,6)]' : 'bg-slate-500 hover:bg-slate-600 shadow-[0_4px_0_rgb(71,85,105)]'} text-white p-4 rounded-2xl flex flex-col items-center gap-2 text-sm font-black active:shadow-none active:translate-y-1 transition-all overflow-hidden`}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Hammer className="w-6 h-6" />
              <span>{buildMode ? '退出建造' : '建造栅栏 (5)'}</span>
            </button>
          </div>

          {/* Experience Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
              <span>经验值 (EXP)</span>
              <span>{exp} / 100</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-green-500"
                initial={{ width: 0 }}
                animate={{ width: `${exp}%` }}
              />
            </div>
          </div>
          
          <button 
            onClick={() => addCoins(999999)} 
            className="mt-4 w-full text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-600 py-1 rounded-lg transition-colors font-bold border border-amber-100"
          >
            点击获取无限金币 (调试用)
          </button>
        </div>
        
        {/* Pull Handle Left */}
        <motion.div 
          className="bg-white/40 backdrop-blur-xl h-24 w-8 rounded-r-2xl border-y border-r border-white/50 flex items-center justify-center shadow-[4px_0_10px_rgba(0,0,0,0.05)] cursor-pointer pointer-events-auto ml-[-1px] transition-colors hover:bg-white/60 active:bg-white/30"
          onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(e, info) => {
            if (info.offset.x > 50) setIsLeftPanelOpen(true);
            if (info.offset.x < -50) setIsLeftPanelOpen(false);
          }}
        >
          {isLeftPanelOpen ? <ChevronLeft className="w-5 h-5 text-green-600" /> : <ChevronRight className="w-5 h-5 text-green-600" />}
        </motion.div>
      </motion.div>

      {/* Right Drawer - Sheep Status */}
      <motion.div 
        className="fixed right-0 top-0 bottom-0 z-50 flex items-center h-full pointer-events-none"
        initial={false}
        animate={{ x: isRightPanelOpen ? 0 : 'calc(100% - 32px)' }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
      >
        {/* Pull Handle Right */}
        <motion.div 
          className="bg-white/40 backdrop-blur-xl h-24 w-8 rounded-l-2xl border-y border-l border-white/50 flex items-center justify-center shadow-[-4px_0_10px_rgba(0,0,0,0.05)] cursor-pointer pointer-events-auto mr-[-1px] transition-colors hover:bg-white/60 active:bg-white/30"
          onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(e, info) => {
            if (info.offset.x < -50) setIsRightPanelOpen(true);
            if (info.offset.x > 50) setIsRightPanelOpen(false);
          }}
        >
          {isRightPanelOpen ? <ChevronRight className="w-5 h-5 text-slate-600" /> : <ChevronLeft className="w-5 h-5 text-slate-600" />}
        </motion.div>

        <div className="bg-white/40 backdrop-blur-xl h-full w-[350px] sm:w-[450px] p-6 shadow-[-10px_0_30px_rgba(0,0,0,0.1)] border-l border-white/50 overflow-y-auto pointer-events-auto flex flex-col">
          <div className="flex flex-col mb-4 gap-1">
            <h2 className="text-lg font-bold text-slate-800">羊群状态 ({sheepList.length}/{maxSheep})</h2>
            <span className="text-xs text-slate-500">将鼠标悬停在小羊上可查看详细状态</span>
          </div>
          
          <div className="flex flex-col gap-4">
            {sheepList.map(sheep => (
              <div key={sheep.id} className={`bg-slate-50 rounded-xl p-4 border relative overflow-hidden flex items-center gap-3 ${sheep.health <= 0 ? 'border-red-200 bg-red-50/50' : 'border-slate-100'}`}>
                {sheep.health <= 0 && <div className="absolute inset-0 bg-red-900/5 z-0 pointer-events-none" />}
                {sheep.health > 0 && sheep.health < 50 && <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse" />}
                <div className="text-3xl relative z-10">{sheep.health <= 0 ? '💀' : '🐑'}</div>
                <div className="relative z-10 w-full">
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
      </motion.div>

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
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">时间流速 (Time Speed)</label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="1"
                  value={timeSpeed || 1} 
                  onChange={(e) => devSetState({ timeSpeed: Number(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>暂停 (0x)</span>
                  <span>{timeSpeed || 1}x</span>
                  <span>极速 (100x)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
