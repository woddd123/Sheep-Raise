import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SheepStage = 'BABY' | 'GROWING' | 'ADULT';
export type SheepGender = 'MALE' | 'FEMALE';

export interface Sheep {
  id: string;
  name: string;
  stage: SheepStage;
  gender: SheepGender;
  age: number; // in game ticks
  health: number; // 0-100
  hunger: number; // 0-100
  woolGrowth: number; // 0-100
  lastBredAge: number;
  lastDefecatedAge?: number;
  isPregnant: boolean;
  pregnancyStartTime: number; // 游戏tick数，怀孕开始的时间
  pregnancyFatherId: string | null;
}

export interface GrassDecoration {
  id: string;
  x: number;
  y: number;
  scale: number;
}

export interface Fence {
  id: string;
  x: number;
  y: number;
  rotation: number; // 0, 90, 180, 270 degrees
}

export interface FeedTrough {
  id: string;
  x: number; // pixel position
  y: number; // pixel position
  hay: number; // 0-100, amount of hay remaining
}

// Each farm contains its own world data
export interface Farm {
  id: string;
  name: string;
  sheepList: Sheep[];
  feces: { id: string, x: number, y: number }[];
  grassTrails: { id: string, x: number, y: number, timestamp: number }[];
  grassDecorations: GrassDecoration[];
  fences: Fence[];
  hayFeeders: FeedTrough[];
  dayCount: number;
  penLevel: number;
}

interface GameState {
  // Global state (not farm-specific)
  level: number;
  exp: number;
  coins: number;
  wool: number;
  feed: number;
  timeOfDay: number;
  timeSpeed: number;
  weather: 'sunny' | 'rainy' | 'windy';
  windDirection: number;
  windStrength: number;
  weatherEndTime: number;
  lastTick: number;

  // Farm management
  farms: Farm[];
  currentFarmId: string;

  // UI modes
  hayFeederMode: boolean;
  buildMode: boolean;
  demolishMode: boolean;
  pickUpMode: boolean;
  pickedUpSheepId: string | null;
  dropTargetPos: { x: number, y: number } | null;

  soundEnabled: boolean;

  // Actions
  // Farm management
  createFarm: (name: string) => void;
  deleteFarm: (id: string) => void;
  switchFarm: (id: string) => void;
  renameFarm: (id: string, name: string) => void;
  getCurrentFarm: () => Farm | undefined;

  toggleBuildMode: () => void;
  setBuildMode: (enabled: boolean) => void;
  toggleDemolishMode: () => void;
  togglePickUpMode: () => void;
  toggleHayFeederMode: () => void;
  setHayFeederMode: (enabled: boolean) => void;
  cancelPickUpMode: () => void;
  setPickedUpSheepId: (id: string | null) => void;
  setDropTargetPos: (pos: { x: number, y: number } | null) => void;
  placeFence: (x: number, y: number) => void;
  removeFence: (x: number, y: number) => void;
  rotateFence: (x: number, y: number) => void;
  placeHayFeeder: (x: number, y: number) => void;
  removeHayFeeder: (id: string) => void;
  refillHayFeeder: (id: string) => void;
  consumeHay: (id: string, amount: number) => void;
  upgradePen: () => void;
  eatGrass: (id: string, amount: number) => void;
  removeGrass: (id: string) => void;
  spawnGrass: () => void;
  cleanAll: () => void;
  sheepDefecate: (id: string, x: number, y: number) => void;
  addGrassTrail: (x: number, y: number) => void;
  clearOldGrassTrails: () => void;
  gameTick: () => void;
  addSheep: () => void;
  addCoins: (amount: number) => void;
  clearCorpse: (id: string) => void;
  shearSheep: (id: string) => void;
  sellSheep: (id: string) => void;
  breedSheep: (id: string) => void;
  sellWool: () => void;
  buyFeed: () => void;
  resetGame: () => void;
  devSetState: (newState: Partial<GameState>) => void;
  setSoundEnabled: (enabled: boolean) => void;
  triggerWeather: (weather: 'sunny' | 'rainy' | 'windy', durationSeconds: number) => void;
}

const createDefaultFarm = (id: string, name: string): Farm => ({
  id,
  name,
  sheepList: [
    { id: `${id}-1`, name: '小白', stage: 'BABY', gender: 'FEMALE', age: 0, health: 100, hunger: 100, woolGrowth: 0, lastBredAge: 0, isPregnant: false, pregnancyStartTime: 0, pregnancyFatherId: null },
    { id: `${id}-2`, name: '小黑', stage: 'BABY', gender: 'MALE', age: 0, health: 100, hunger: 100, woolGrowth: 0, lastBredAge: 0, isPregnant: false, pregnancyStartTime: 0, pregnancyFatherId: null },
  ],
  feces: [],
  grassTrails: [],
  grassDecorations: [],
  fences: [],
  hayFeeders: [],
  dayCount: 1,
  penLevel: 1,
});

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      level: 1,
      exp: 0,
      coins: 100,
      wool: 0,
      feed: 0,
      timeOfDay: 8,
      timeSpeed: 1,
      weather: 'sunny',
      windDirection: 0,
      windStrength: 0,
      weatherEndTime: 0,
      lastTick: Date.now(),
      hayFeederMode: false,
      buildMode: false,
      demolishMode: false,
      pickUpMode: false,
      pickedUpSheepId: null,
      dropTargetPos: null,
      soundEnabled: true,

      farms: [createDefaultFarm('farm-1', '我的牧场')],
      currentFarmId: 'farm-1',

      getCurrentFarm: () => {
        const state = get();
        return state.farms.find(f => f.id === state.currentFarmId);
      },

      createFarm: (name) => set((state) => {
        const newId = `farm-${Date.now()}`;
        return {
          farms: [...state.farms, createDefaultFarm(newId, name)]
        };
      }),

      deleteFarm: (id) => set((state) => {
        if (state.farms.length <= 1) return state; // Keep at least one farm
        const newFarms = state.farms.filter(f => f.id !== id);
        const newCurrentId = state.currentFarmId === id ? newFarms[0].id : state.currentFarmId;
        return {
          farms: newFarms,
          currentFarmId: newCurrentId
        };
      }),

      switchFarm: (id) => set((state) => ({
        currentFarmId: id,
        buildMode: false,
        demolishMode: false,
        hayFeederMode: false,
        pickUpMode: false,
        pickedUpSheepId: null,
        dropTargetPos: null,
      })),

      renameFarm: (id, name) => set((state) => ({
        farms: state.farms.map(f => f.id === id ? { ...f, name } : f)
      })),

      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      devSetState: (newState) => set((state) => ({ ...state, ...newState })),

      triggerWeather: (weather, durationSeconds) => set({
        weather,
        windDirection: weather === 'windy' ? Math.random() * 360 : 0,
        windStrength: weather === 'windy' ? 30 + Math.random() * 70 : 0,
        weatherEndTime: Date.now() + durationSeconds * 1000
      }),

      addGrassTrail: (x, y) => set((state) => {
        const farm = state.farms.find(f => f.id === state.currentFarmId);
        if (!farm) return state;
        return {
          farms: state.farms.map(f => f.id === state.currentFarmId ? {
            ...f,
            grassTrails: [...(f.grassTrails || []), { id: Date.now().toString() + Math.random(), x, y, timestamp: Date.now() }]
          } : f)
        };
      }),

      clearOldGrassTrails: () => set((state) => {
        const now = Date.now();
        return {
          farms: state.farms.map(f => f.id === state.currentFarmId ? {
            ...f,
            grassTrails: (f.grassTrails || []).filter(t => now - t.timestamp < 3000)
          } : f)
        };
      }),

      removeGrass: (id) => set((state) => ({
        farms: state.farms.map(f => f.id === state.currentFarmId ? {
          ...f,
          grassDecorations: (f.grassDecorations || []).filter(g => g.id !== id)
        } : f)
      })),

      toggleBuildMode: () => set((state) => ({ buildMode: !state.buildMode, hayFeederMode: false })),
      setBuildMode: (enabled) => set({ buildMode: enabled, hayFeederMode: false }),
      toggleDemolishMode: () => set((state) => ({ demolishMode: !state.demolishMode })),
      togglePickUpMode: () => set((state) => ({ pickUpMode: !state.pickUpMode, pickedUpSheepId: null })),
      toggleHayFeederMode: () => set((state) => ({ hayFeederMode: !state.hayFeederMode, buildMode: false })),
      setHayFeederMode: (enabled) => set({ hayFeederMode: enabled, buildMode: false }),
      cancelPickUpMode: () => set({ pickUpMode: false, pickedUpSheepId: null, dropTargetPos: null }),
      setPickedUpSheepId: (id) => set({ pickedUpSheepId: id }),
      setDropTargetPos: (pos) => set({ dropTargetPos: pos }),

      placeFence: (x, y) => set((state) => {
        if (state.coins < 5) return state;
        const farm = state.farms.find(f => f.id === state.currentFarmId);
        if (!farm) return state;
        if ((farm.fences || []).some(f => f.x === x && f.y === y)) return state;
        // Check if hay feeder occupies this cell
        const hayFeederCells = (farm.hayFeeders || []).flatMap(h => [
          { x: h.x, y: h.y },
          { x: h.x + 32, y: h.y },
          { x: h.x, y: h.y + 32 },
          { x: h.x + 32, y: h.y + 32 }
        ]);
        if (hayFeederCells.some(cell => cell.x === x && cell.y === y)) return state;
        return {
          coins: state.coins - 5,
          farms: state.farms.map(f => f.id === state.currentFarmId ? {
            ...f,
            fences: [...(f.fences || []), { id: `fence-${Date.now()}-${x}-${y}`, x, y, rotation: 0 }]
          } : f)
        };
      }),

      removeFence: (x, y) => set((state) => ({
        coins: state.coins + 2,
        farms: state.farms.map(f => f.id === state.currentFarmId ? {
          ...f,
          fences: (f.fences || []).filter(fence => !(fence.x === x && fence.y === y))
        } : f)
      })),

      rotateFence: (x, y) => set((state) => ({
        farms: state.farms.map(f => f.id === state.currentFarmId ? {
          ...f,
          fences: (f.fences || []).map(fence =>
            fence.x === x && fence.y === y ? { ...fence, rotation: (fence.rotation + 90) % 360 } : fence
          )
        } : f)
      })),

      placeHayFeeder: (x, y) => set((state) => {
        if (state.coins < 20) return state;
        const farm = state.farms.find(f => f.id === state.currentFarmId);
        if (!farm) return state;
        if ((farm.hayFeeders || []).some(h => h.x === x && h.y === y)) return state;
        const cells = [
          { x, y },
          { x: x + 32, y },
          { x, y: y + 32 },
          { x: x + 32, y: y + 32 }
        ];
        if ((farm.fences || []).some(f => cells.some(c => c.x === f.x && c.y === f.y))) return state;
        const otherFeeders = (farm.hayFeeders || []).flatMap(h => [
          { x: h.x, y: h.y },
          { x: h.x + 32, y: h.y },
          { x: h.x, y: h.y + 32 },
          { x: h.x + 32, y: h.y + 32 }
        ]);
        if (cells.some(c => otherFeeders.some(f => c.x === f.x && c.y === f.y))) return state;
        return {
          coins: state.coins - 20,
          farms: state.farms.map(f => f.id === state.currentFarmId ? {
            ...f,
            hayFeeders: [...(f.hayFeeders || []), { id: `hay-${Date.now()}`, x, y, hay: 100 }]
          } : f)
        };
      }),

      removeHayFeeder: (id) => set((state) => ({
        coins: state.coins + 10,
        farms: state.farms.map(f => f.id === state.currentFarmId ? {
          ...f,
          hayFeeders: (f.hayFeeders || []).filter(h => h.id !== id)
        } : f)
      })),

      refillHayFeeder: (id) => set((state) => {
        if (state.feed < 1) return state;
        const farm = state.farms.find(f => f.id === state.currentFarmId);
        if (!farm) return state;
        const feeder = (farm.hayFeeders || []).find(h => h.id === id);
        if (!feeder || feeder.hay >= 100) return state;
        return {
          feed: state.feed - 1,
          farms: state.farms.map(f => f.id === state.currentFarmId ? {
            ...f,
            hayFeeders: (f.hayFeeders || []).map(h =>
              h.id === id ? { ...h, hay: 100 } : h
            )
          } : f)
        };
      }),

      buyFeed: () => set((state) => {
        if (state.coins < 10) return state;
        return {
          coins: state.coins - 10,
          feed: state.feed + 1
        };
      }),

      resetGame: () => {
        localStorage.removeItem('sheep-farm-storage');
        const newId = `farm-${Date.now()}`;
        const defaultFarm = createDefaultFarm(newId, '我的牧场');
        window.location.reload();
        return {
          level: 1,
          exp: 0,
          coins: 100,
          wool: 0,
          feed: 0,
          timeOfDay: 8,
          timeSpeed: 1,
          weather: 'sunny',
          windDirection: 0,
          windStrength: 0,
          weatherEndTime: 0,
          lastTick: Date.now(),
          farms: [defaultFarm],
          currentFarmId: newId,
          hayFeederMode: false,
          buildMode: false,
          demolishMode: false,
          pickUpMode: false,
          pickedUpSheepId: null,
          dropTargetPos: null,
          soundEnabled: true,
        };
      },

      consumeHay: (id, amount) => set((state) => ({
        farms: state.farms.map(f => f.id === state.currentFarmId ? {
          ...f,
          hayFeeders: (f.hayFeeders || []).map(h =>
            h.id === id ? { ...h, hay: Math.max(0, h.hay - amount) } : h
          )
        } : f)
      })),

      spawnGrass: () => set((state) => {
        const farm = state.farms.find(f => f.id === state.currentFarmId);
        if (!farm) return state;
        const MAX_GRASS = 50;
        const currentGrassCount = (farm.grassDecorations || []).length;
        if (currentGrassCount >= MAX_GRASS) return state;
        const missingAmount = MAX_GRASS - currentGrassCount;
        const spawnCount = Math.min(missingAmount, 5);
        if (spawnCount <= 0) return state;
        const newGrass = [];
        for (let i = 0; i < spawnCount; i++) {
          newGrass.push({
            id: `dec-${Date.now()}-${Math.random()}`,
            x: Math.random() * 100,
            y: Math.random() * 100,
            scale: 0.6 + Math.random() * 0.6,
          });
        }
        return {
          farms: state.farms.map(f => f.id === state.currentFarmId ? {
            ...f,
            grassDecorations: [...(f.grassDecorations || []), ...newGrass]
          } : f)
        };
      }),

      upgradePen: () => set((state) => {
        const farm = state.farms.find(f => f.id === state.currentFarmId);
        if (!farm) return state;
        const penLevel = farm.penLevel || 1;
        const upgradeCost = penLevel * 500;
        const levelReq = penLevel * 2;
        if (state.coins < upgradeCost || state.level < levelReq) return state;
        return {
          coins: state.coins - upgradeCost,
          farms: state.farms.map(f => f.id === state.currentFarmId ? { ...f, penLevel: penLevel + 1 } : f)
        };
      }),

      eatGrass: (id, amount) => set((state) => {
        const farm = state.farms.find(f => f.id === state.currentFarmId);
        if (!farm) return state;
        const sheep = farm.sheepList.find(s => s.id === id);
        if (!sheep || sheep.health <= 0) return state;
        return {
          farms: state.farms.map(f => f.id === state.currentFarmId ? {
            ...f,
            sheepList: f.sheepList.map(s =>
              s.id === id ? { ...s, hunger: Math.min(100, s.hunger + amount) } : s
            )
          } : f)
        };
      }),

      cleanAll: () => set((state) => {
        if (state.coins < 10) return state;
        const farm = state.farms.find(f => f.id === state.currentFarmId);
        if (!farm || !(farm.feces?.length > 0)) return state;
        return {
          coins: state.coins - 10,
          farms: state.farms.map(f => f.id === state.currentFarmId ? { ...f, feces: [] } : f)
        };
      }),

      sheepDefecate: (id, x, y) => set((state) => {
        const farm = state.farms.find(f => f.id === state.currentFarmId);
        if (!farm) return state;
        const sheep = farm.sheepList.find(s => s.id === id);
        if (!sheep || sheep.health <= 0) return state;
        return {
          farms: state.farms.map(f => f.id === state.currentFarmId ? {
            ...f,
            feces: [...(f.feces || []), { id: Date.now().toString() + Math.random(), x, y }],
            sheepList: f.sheepList.map(s => s.id === id ? { ...s, hunger: Math.max(0, s.hunger - 15), lastDefecatedAge: s.age } : s)
          } : f)
        };
      }),

      addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),

      clearCorpse: (id) => set((state) => ({
        farms: state.farms.map(f => f.id === state.currentFarmId ? {
          ...f,
          sheepList: f.sheepList.filter(s => s.id !== id)
        } : f)
      })),

      shearSheep: (id) => set((state) => {
        const farm = state.farms.find(f => f.id === state.currentFarmId);
        if (!farm) return state;
        const sheep = farm.sheepList.find(s => s.id === id);
        if (!sheep || (sheep.woolGrowth || 0) < 100 || sheep.health <= 0) return state;
        return {
          wool: state.wool + 1,
          farms: state.farms.map(f => f.id === state.currentFarmId ? {
            ...f,
            sheepList: f.sheepList.map(s => s.id === id ? { ...s, woolGrowth: 0 } : s)
          } : f)
        };
      }),

      sellSheep: (id) => set((state) => {
        const farm = state.farms.find(f => f.id === state.currentFarmId);
        if (!farm) return state;
        const sheep = farm.sheepList.find(s => s.id === id);
        if (!sheep) return state;
        const value = sheep.stage === 'ADULT' ? 150 : sheep.stage === 'GROWING' ? 80 : 30;
        return {
          coins: state.coins + value,
          farms: state.farms.map(f => f.id === state.currentFarmId ? {
            ...f,
            sheepList: f.sheepList.filter(s => s.id !== id)
          } : f)
        };
      }),

      breedSheep: (id) => set((state) => {
        const farm = state.farms.find(f => f.id === state.currentFarmId);
        if (!farm) return state;
        const sheep = farm.sheepList.find(s => s.id === id);
        if (!sheep || sheep.stage !== 'ADULT' || sheep.health <= 0 || sheep.gender !== 'FEMALE') return state;
        if (sheep.isPregnant) return state; // Already pregnant
        const lastBred = sheep.lastBredAge || 0;
        if (sheep.age - lastBred < 600 && lastBred !== 0) return state; // Cooldown not passed
        if (sheep.hunger < 80) return state; // Hunger too low

        // Find a male partner
        const partner = farm.sheepList.find(s => s.stage === 'ADULT' && s.health > 0 && s.gender === 'MALE' && (s.hunger >= 80));
        if (!partner) return state;
        if ((partner.lastBredAge || 0) !== 0 && partner.age - partner.lastBredAge < 600) return state; // Partner on cooldown

        // Set female as pregnant, deduct hunger from both
        return {
          farms: state.farms.map(f => f.id === state.currentFarmId ? {
            ...f,
            sheepList: f.sheepList.map(s => {
              if (s.id === sheep.id) {
                return { ...s, isPregnant: true, pregnancyStartTime: s.age, pregnancyFatherId: partner.id, lastBredAge: s.age, hunger: Math.max(0, s.hunger - 10) };
              }
              if (s.id === partner.id) {
                return { ...s, lastBredAge: s.age, hunger: Math.max(0, s.hunger - 10) };
              }
              return s;
            })
          } : f)
        };
      }),

      sellWool: () => set((state) => {
        if (state.wool <= 0) return state;
        return {
          coins: state.coins + state.wool * 40,
          wool: 0
        };
      }),

      addSheep: () => set((state) => {
        const farm = state.farms.find(f => f.id === state.currentFarmId);
        if (!farm) return state;
        const maxSheep = 4 + (farm.penLevel || 1) * 4;
        if (state.coins >= 50 && farm.sheepList.length < maxSheep) {
          return {
            coins: state.coins - 50,
            farms: state.farms.map(f => f.id === state.currentFarmId ? {
              ...f,
              sheepList: [...f.sheepList, {
                id: Date.now().toString(),
                name: `小羊${f.sheepList.length + 1}`,
                stage: 'BABY' as SheepStage,
                gender: Math.random() > 0.5 ? 'MALE' : 'FEMALE' as SheepGender,
                age: 0,
                health: 100,
                hunger: 100,
                woolGrowth: 0,
                lastBredAge: 0,
                isPregnant: false,
                pregnancyStartTime: 0,
                pregnancyFatherId: null
              }]
            } : f)
          };
        }
        return state;
      }),

      gameTick: () => set((state) => {
        const now = Date.now();
        const ticksPassed = Math.floor((now - state.lastTick) / 1000);
        if (ticksPassed <= 0) return state;
        const farm = state.farms.find(f => f.id === state.currentFarmId);
        if (!farm) return state;
        const isNight = state.timeOfDay >= 19 || state.timeOfDay < 6;
        const hungerDecayRate = isNight ? (0.2 / 30) : (1 / 30);
        const effectiveTicks = ticksPassed * (state.timeSpeed || 1);
        const timeIncrement = effectiveTicks * (1 / 60);
        const totalTime = state.timeOfDay + timeIncrement;
        const newTimeOfDay = totalTime % 24;
        const daysPassed = Math.floor(totalTime / 24);
        const newDayCount = (farm.dayCount || 1) + daysPassed;

        // First pass: update basic sheep properties
        let updatedSheep = farm.sheepList.map(sheep => {
          if (sheep.health <= 0) return sheep;
          const newHunger = Math.max(0, sheep.hunger - (effectiveTicks * hungerDecayRate));
          let healthDelta = 0;
          if (newHunger <= 0) healthDelta -= 2;
          else if (newHunger > 80) healthDelta += 1;
          let newWoolGrowth = sheep.woolGrowth || 0;
          if (sheep.stage === 'ADULT') {
            newWoolGrowth = Math.min(100, newWoolGrowth + (effectiveTicks * 0.5));
          }
          return {
            ...sheep,
            age: sheep.age + effectiveTicks,
            hunger: newHunger,
            health: Math.max(0, Math.min(100, sheep.health + (healthDelta * effectiveTicks))),
            stage: (sheep.age + effectiveTicks > 1920 ? 'ADULT' : sheep.age + effectiveTicks > 960 ? 'GROWING' : 'BABY') as SheepStage,
            woolGrowth: newWoolGrowth,
            lastBredAge: sheep.lastBredAge || 0
          };
        });

        // Second pass: check for automatic breeding (every tick)
        const maxSheep = 4 + (farm.penLevel || 1) * 4;
        if (updatedSheep.length < maxSheep) {
          // Find females that can become pregnant
          const eligibleFemales = updatedSheep.filter(s =>
            s.stage === 'ADULT' &&
            s.gender === 'FEMALE' &&
            !s.isPregnant &&
            s.hunger >= 80 &&
            s.health > 0 &&
            ((s.age - (s.lastBredAge || 0)) >= 600 || (s.lastBredAge || 0) === 0)
          );

          // Find eligible males
          const eligibleMales = updatedSheep.filter(s =>
            s.stage === 'ADULT' &&
            s.gender === 'MALE' &&
            s.hunger >= 80 &&
            s.health > 0 &&
            ((s.age - (s.lastBredAge || 0)) >= 600 || (s.lastBredAge || 0) === 0)
          );

          // Try to match pairs
          for (const female of eligibleFemales) {
            const partner = eligibleMales.find(m => m.id !== female.pregnancyFatherId);
            if (partner) {
              // Set female as pregnant
              updatedSheep = updatedSheep.map(s => {
                if (s.id === female.id) {
                  return { ...s, isPregnant: true, pregnancyStartTime: s.age, pregnancyFatherId: partner.id, lastBredAge: s.age, hunger: Math.max(0, s.hunger - 10) };
                }
                if (s.id === partner.id) {
                  return { ...s, lastBredAge: s.age, hunger: Math.max(0, s.hunger - 10) };
                }
                return s;
              });
              // Remove the male from eligible list to prevent double breeding
              eligibleMales.splice(eligibleMales.findIndex(m => m.id === partner.id), 1);
              break; // Only one breeding per tick
            }
          }
        }

        // Third pass: check for births and newborn hunger reduction
        const newborns: Sheep[] = [];
        updatedSheep = updatedSheep.map(sheep => {
          // Check if pregnant sheep should give birth (3 game days = 3 days of dayCount)
          if (sheep.isPregnant && sheep.pregnancyStartTime > 0) {
            // Pregnancy duration: 3 game days worth of ticks (approximately 4320 ticks per day)
            const pregnancyDuration = 3 * 4320;
            if (sheep.age - sheep.pregnancyStartTime >= pregnancyDuration) {
              // Give birth!
              newborns.push({
                id: `baby-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: `小羊${farm.sheepList.length + newborns.length + 1}`,
                stage: 'BABY' as SheepStage,
                gender: Math.random() > 0.5 ? 'MALE' : 'FEMALE' as SheepGender,
                age: 0,
                health: 100,
                hunger: 100,
                woolGrowth: 0,
                lastBredAge: 0,
                isPregnant: false,
                pregnancyStartTime: 0,
                pregnancyFatherId: null
              });
              // Reset mother
              return { ...sheep, isPregnant: false, pregnancyStartTime: 0, pregnancyFatherId: null, hunger: Math.max(0, sheep.hunger - 30) };
            }
          }
          return sheep;
        });

        // Add newborns to the list
        if (newborns.length > 0) {
          updatedSheep = [...updatedSheep, ...newborns];
        }

        let newWeather = state.weather;
        let newWindDirection = state.windDirection;
        let newWindStrength = state.windStrength;
        if (now >= state.weatherEndTime && state.weather !== 'sunny') {
          newWeather = 'sunny';
          newWindDirection = 0;
          newWindStrength = 0;
        }
        if (state.weather === 'sunny' && Math.random() < 0.1) {
          const willBeWindy = Math.random() > 0.5;
          newWeather = willBeWindy ? 'windy' : 'rainy';
          const duration = 30 + Math.random() * 60;
          if (willBeWindy) {
            newWindDirection = Math.random() * 360;
            newWindStrength = 30 + Math.random() * 70;
          }
          return {
            lastTick: now,
            timeOfDay: newTimeOfDay,
            weather: newWeather,
            windDirection: newWindDirection,
            windStrength: newWindStrength,
            weatherEndTime: now + duration * 1000,
            farms: state.farms.map(f => f.id === state.currentFarmId ? {
              ...f,
              sheepList: updatedSheep,
              dayCount: newDayCount
            } : f)
          };
        }
        return {
          lastTick: now,
          timeOfDay: newTimeOfDay,
          weather: newWeather,
          windDirection: newWindDirection,
          windStrength: newWindStrength,
          farms: state.farms.map(f => f.id === state.currentFarmId ? {
            ...f,
            sheepList: updatedSheep,
            dayCount: newDayCount
          } : f)
        };
      }),
    }),
    {
      name: 'sheep-farm-storage',
    }
  )
);
