import { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { useGameStore } from './store/gameStore';
import { Droplets, Wheat, Heart, Coins, Star, Plus, Moon, Sun, Wrench, X, Maximize2, Volume2, VolumeX, ChevronRight, ChevronLeft, Hammer, Trash2, Hand, MapPin } from 'lucide-react';
import { SheepPen } from './components/SheepPen';
import { FarmSelector } from './components/FarmSelector';
import { initAudio, playBaa, startRainSound, stopRainSound, setRainVolume } from './utils/audio';

export default function App() {
  const { level, exp, coins, gameTick, addSheep, cleanAll, addCoins, timeOfDay, sellSheep, shearSheep, sellWool, breedSheep, buyFeed, resetGame, devSetState, wool, feed, timeSpeed, soundEnabled, setSoundEnabled, weather, windDirection, windStrength } = useGameStore();

  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [isFarmSelectorOpen, setIsFarmSelectorOpen] = useState(false);

  // Floating coin animation
  const [coinFloats, setCoinFloats] = useState<{ id: number, amount: number, key: string }[]>([]);
  const prevCoinsRef = useRef(coins);
  const floatIdRef = useRef(0);

  useEffect(() => {
    if (coins !== prevCoinsRef.current) {
      const diff = coins - prevCoinsRef.current;
      if (diff !== 0) {
        const newFloat = { id: floatIdRef.current++, amount: diff, key: `float-${Date.now()}` };
        setCoinFloats(prev => [...prev, newFloat]);
        setTimeout(() => {
          setCoinFloats(prev => prev.filter(f => f.id !== newFloat.id));
        }, 1500);
      }
      prevCoinsRef.current = coins;
    }
  }, [coins]);

  // Handle rain sound based on weather
  useEffect(() => {
    if (weather === 'rainy') {
      startRainSound();
      setRainVolume(soundEnabled ? 0.3 : 0);
    } else {
      stopRainSound();
    }
  }, [weather, soundEnabled]);

  // Get current farm data
  const farms = useGameStore(state => state.farms);
  const currentFarmId = useGameStore(state => state.currentFarmId);
  const currentFarm = farms.find(f => f.id === currentFarmId) || farms[0];
  const sheepList = currentFarm?.sheepList || [];
  const feces = currentFarm?.feces || [];
  const fences = currentFarm?.fences || [];
  const hayFeeders = currentFarm?.hayFeeders || [];
  const dayCount = currentFarm?.dayCount || 1;
  const penLevel = currentFarm?.penLevel || 1;

  const maxSheep = 4 + (penLevel || 1) * 4;
  const penArea = (penLevel || 1) * 25; // Simple area calculation: 25sqm per level

  const buildMode = useGameStore(state => state.buildMode);
  const setBuildMode = useGameStore(state => state.setBuildMode);
  const demolishMode = useGameStore(state => state.demolishMode);
  const toggleDemolishMode = useGameStore(state => state.toggleDemolishMode);
  const pickUpMode = useGameStore(state => state.pickUpMode);
  const togglePickUpMode = useGameStore(state => state.togglePickUpMode);
  const hayFeederMode = useGameStore(state => state.hayFeederMode);
  const setHayFeederMode = useGameStore(state => state.setHayFeederMode);

  const [buildType, setBuildType] = useState<'fence' | 'hayFeeder' | null>(null);
  const [showBuildDropdown, setShowBuildDropdown] = useState(false);

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
      <div className="fixed top-4 left-0 right-0 z-50 px-4 pointer-events-none flex items-center justify-between gap-4 isolate">
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

        {/* Build/Demolish Buttons in Top Bar */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Build Button with Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                if (buildMode || hayFeederMode) {
                  setBuildMode(false);
                  setHayFeederMode(false);
                  setBuildType(null);
                } else {
                  setShowBuildDropdown(!showBuildDropdown);
                }
              }}
              disabled={demolishMode}
              className={`p-2 rounded-full shadow-sm border border-white/40 transition-all ${
                buildMode || hayFeederMode
                  ? 'bg-amber-500 text-white'
                  : demolishMode
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-white/80 text-slate-700 hover:bg-white'
              }`}
              title={buildMode || hayFeederMode ? '退出建造' : '建造'}
            >
              <Hammer className="w-4 h-4" />
            </button>

            {/* Dropdown */}
            {showBuildDropdown && !buildMode && (
              <div className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50 min-w-[140px]">
                <button
                  onClick={() => {
                    setBuildType('fence');
                    setBuildMode(true);
                    setShowBuildDropdown(false);
                  }}
                  disabled={coins < 5}
                  className="w-full px-4 py-2.5 text-left text-sm font-bold hover:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <span className="w-5 h-5 bg-amber-500 text-white rounded flex items-center justify-center text-xs">F</span>
                  栅栏块 (5)
                </button>
                <button
                  onClick={() => {
                    setBuildType('hayFeeder');
                    setHayFeederMode(true);
                    setShowBuildDropdown(false);
                  }}
                  disabled={coins < 20}
                  className="w-full px-4 py-2.5 text-left text-sm font-bold hover:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <span className="w-5 h-5 bg-amber-500 text-white rounded flex items-center justify-center text-xs">H</span>
                  饲料槽 (20)
                </button>
              </div>
            )}
          </div>

          {/* Demolish Button */}
          <button
            onClick={toggleDemolishMode}
            disabled={buildMode}
            className={`p-2 rounded-full shadow-sm border border-white/40 transition-all ${
              demolishMode
                ? 'bg-red-500 text-white'
                : buildMode
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-white/80 text-slate-700 hover:bg-white'
            }`}
            title={demolishMode ? '退出拆除' : '拆除'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
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
          backgroundImage: 'url(/objects/grass/grasses.png)',
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
        <div className="bg-white/40 backdrop-blur-xl h-full w-[280px] sm:w-[320px] p-4 shadow-[10px_0_30px_rgba(0,0,0,0.1)] border-r border-white/50 overflow-y-auto pointer-events-auto flex flex-col">
          {/* Content of Management Panel */}
          <div className="flex flex-col gap-4 mb-6 border-b border-slate-100 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-green-700 tracking-tight">{currentFarm?.name || '我的牧场'}</h1>
                <div className="bg-green-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">
                  Level {level}
                </div>
              </div>
              <button
                onClick={() => setIsFarmSelectorOpen(true)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="切换牧场"
              >
                <MapPin className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-between gap-4 mt-3">
              <div className="flex flex-col relative">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">资产</span>
                <div className="flex items-center gap-1 text-amber-600 font-black text-base">
                  <Coins className="w-4 h-4" /> {coins.toLocaleString()}
                </div>
                {/* Floating coin animations */}
                {coinFloats.map(float => (
                  <motion.div
                    key={float.key}
                    className={`absolute left-0 top-0 font-black text-sm ${float.amount > 0 ? 'text-green-500' : 'text-red-500'}`}
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 0, y: -40 }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                  >
                    {float.amount > 0 ? '+' : ''}{float.amount}$
                  </motion.div>
                ))}
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
            
            <div className="grid grid-cols-5 gap-2 mt-4">
              <button
                onClick={addSheep}
                disabled={coins < 50 || sheepList.length >= maxSheep}
                className="aspect-square rounded-xl bg-white/30 backdrop-blur-md border border-white/40 flex flex-col items-center justify-center gap-1 text-[10px] font-bold text-green-700 disabled:opacity-40 disabled:text-slate-400 transition-all hover:bg-white/50 active:scale-95 shadow-lg"
              >
                <Plus className="w-5 h-5" />
                <span>买羊</span>
              </button>
              <button
                onClick={cleanAll}
                disabled={coins < 10 || !(feces?.length > 0)}
                className="aspect-square rounded-xl bg-white/30 backdrop-blur-md border border-white/40 flex flex-col items-center justify-center gap-1 text-[10px] font-bold text-blue-700 disabled:opacity-40 disabled:text-slate-400 transition-all hover:bg-white/50 active:scale-95 shadow-lg"
              >
                <Droplets className="w-5 h-5" />
                <span>清理</span>
              </button>
              <button
                onClick={() => {
                  sheepList.filter(s => s.stage === 'ADULT' && (s.woolGrowth || 0) >= 100 && s.health > 0).forEach(s => shearSheep(s.id));
                }}
                disabled={!sheepList.some(s => s.stage === 'ADULT' && (s.woolGrowth || 0) >= 100 && s.health > 0)}
                className="aspect-square rounded-xl bg-white/30 backdrop-blur-md border border-white/40 flex flex-col items-center justify-center gap-1 text-[10px] font-bold text-cyan-700 disabled:opacity-40 disabled:text-slate-400 transition-all hover:bg-white/50 active:scale-95 shadow-lg"
              >
                <span className="text-lg">🧶</span>
                <span>剪毛</span>
              </button>
              <button
                onClick={togglePickUpMode}
                className={`aspect-square rounded-xl backdrop-blur-md border flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-all hover:bg-white/50 active:scale-95 shadow-lg ${
                  pickUpMode
                    ? 'bg-green-400/40 border-green-400/60 text-green-800'
                    : 'bg-white/30 border-white/40 text-slate-700'
                }`}
              >
                <Hand className="w-5 h-5" />
                <span>{pickUpMode ? '取消' : '抓起'}</span>
              </button>
              <button
                onClick={() => setIsDevPanelOpen(true)}
                className="aspect-square rounded-xl bg-white/30 backdrop-blur-md border border-white/40 flex flex-col items-center justify-center gap-1 text-[10px] font-bold text-slate-600 transition-all hover:bg-white/50 active:scale-95 shadow-lg"
                title="开发者面板"
              >
                <Wrench className="w-5 h-5" />
                <span>设置</span>
              </button>
            </div>
          </div>

          {/* Sheep Status in Control Panel */}
          <div className="mt-4 flex flex-col gap-2">
            <h3 className="text-sm font-bold text-slate-700">羊群状态 ({sheepList.length}/{maxSheep})</h3>
            <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: '160px' }}>
              {sheepList.slice(0, 6).map(sheep => (
                <div key={sheep.id} className="flex items-center gap-2 p-2 rounded-xl bg-white/30 backdrop-blur-md border border-white/40">
                  <span className="text-xl">{sheep.health <= 0 ? '💀' : '🐑'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-700 truncate">{sheep.name}</span>
                      <span className="text-[10px] text-slate-400">{sheep.gender === 'MALE' ? '♂️' : '♀️'}</span>
                      <span className="text-[10px] px-1 rounded bg-slate-100 text-slate-500">{sheep.stage === 'BABY' ? '宝宝' : sheep.stage === 'GROWING' ? '幼年' : '成年'}</span>
                      {sheep.gender === 'FEMALE' && sheep.isPregnant && <span className="text-[10px] px-1 rounded bg-pink-200 text-pink-700 font-bold">怀孕</span>}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span>❤{Math.round(sheep.health)}</span>
                      <span>饱{Math.round(sheep.hunger)}</span>
                      {sheep.stage === 'ADULT' && <span>毛{Math.round(sheep.woolGrowth || 0)}%</span>}
                    </div>
                  </div>
                  {sheep.health > 0 && (
                    <button
                      onClick={() => sellSheep(sheep.id)}
                      className="w-8 h-8 rounded-lg bg-amber-100/50 backdrop-blur-md border border-amber-200/50 flex items-center justify-center text-amber-600 hover:bg-amber-200/60 active:scale-95 transition-all"
                      title="出售"
                    >
                      <span className="text-sm">💰</span>
                    </button>
                  )}
                </div>
              ))}
              {sheepList.length > 6 && (
                <div className="text-xs text-slate-400 text-center py-1">还有 {sheepList.length - 6} 只羊...</div>
              )}
            </div>
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
          onClick={() => { setIsLeftPanelOpen(!isLeftPanelOpen); setIsRightPanelOpen(false); }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(e, info) => {
            if (info.offset.x > 50) { setIsLeftPanelOpen(true); setIsRightPanelOpen(false); }
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
          onClick={() => { setIsRightPanelOpen(!isRightPanelOpen); setIsLeftPanelOpen(false); }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(e, info) => {
            if (info.offset.x < -50) { setIsRightPanelOpen(true); setIsLeftPanelOpen(false); }
            if (info.offset.x > 50) setIsRightPanelOpen(false);
          }}
        >
          {isRightPanelOpen ? <ChevronRight className="w-5 h-5 text-slate-600" /> : <ChevronLeft className="w-5 h-5 text-slate-600" />}
        </motion.div>

        <div className="bg-white/40 backdrop-blur-xl h-full w-[280px] sm:w-[320px] p-4 shadow-[-10px_0_30px_rgba(0,0,0,0.1)] border-l border-white/50 overflow-y-auto pointer-events-auto flex flex-col">
          <div className="flex flex-col mb-3 gap-1">
            <h2 className="text-lg font-bold text-slate-800">背包</h2>
            <span className="text-xs text-slate-500">存放羊毛、羊皮和饲料等物品</span>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {/* Wool */}
            <div className="bg-blue-50 rounded-xl p-3 flex flex-col items-center gap-1 border border-blue-100">
              <div className="text-2xl">🧶</div>
              <div className="text-xs font-bold text-blue-600">羊毛</div>
              <div className="text-sm font-black text-blue-800">{wool}</div>
            </div>
            {/* Placeholder items */}
            <div className="bg-slate-50 rounded-xl p-3 flex flex-col items-center gap-1 border border-slate-100 opacity-50">
              <div className="text-2xl">🐑</div>
              <div className="text-xs font-bold text-slate-500">羊皮</div>
              <div className="text-sm font-black text-slate-400">0</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 flex flex-col items-center gap-1 border border-amber-100">
              <div className="text-2xl">🌾</div>
              <div className="text-xs font-bold text-amber-600">饲料</div>
              <div className="text-sm font-black text-amber-800">{feed}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 flex flex-col items-center gap-1 border border-slate-100 opacity-50">
              <div className="text-2xl">❓</div>
              <div className="text-xs font-bold text-slate-500">更多</div>
              <div className="text-sm font-black text-slate-400">-</div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <h3 className="text-sm font-bold text-slate-700">快捷操作</h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={sellWool}
                disabled={wool <= 0}
                className="w-full bg-amber-100 hover:bg-amber-200 disabled:bg-slate-100 disabled:text-slate-400 text-amber-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
              >
                出售所有羊毛 ({wool}个)
              </button>
              <button
                onClick={buyFeed}
                disabled={coins < 10}
                className="w-full bg-green-100 hover:bg-green-200 disabled:bg-slate-100 disabled:text-slate-400 text-green-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
              >
                购买饲料 (10金币)
              </button>
            </div>
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
                <label className="block text-sm font-bold text-slate-700 mb-1">经验 (EXP)</label>
                <input
                  type="number"
                  value={exp}
                  onChange={(e) => devSetState({ exp: Number(e.target.value) })}
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
                <label className="block text-sm font-bold text-slate-700 mb-1">天气 (Weather)</label>
                <select
                  value={weather}
                  onChange={(e) => devSetState({ weather: e.target.value as 'sunny' | 'rainy' | 'windy' })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="sunny">晴天</option>
                  <option value="rainy">雨天</option>
                  <option value="windy">刮风</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">风向 (Wind Direction)</label>
                <input
                  type="number"
                  value={windDirection}
                  onChange={(e) => devSetState({ windDirection: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">风力 (Wind Strength)</label>
                <input
                  type="number"
                  value={windStrength}
                  onChange={(e) => devSetState({ windStrength: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">时间 ({timeString})</label>
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="0.1"
                  value={timeOfDay}
                  onChange={(e) => devSetState({ timeOfDay: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div className="pt-4 border-t border-slate-200">
                <button
                  onClick={resetGame}
                  className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl text-sm font-bold transition-colors"
                >
                  重置游戏数据
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Farm Selector Modal */}
      <FarmSelector
        isOpen={isFarmSelectorOpen}
        onClose={() => setIsFarmSelectorOpen(false)}
      />
      </div>
    </div>
  );
}
