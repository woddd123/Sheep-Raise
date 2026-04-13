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

interface GameState {
  level: number;
  penLevel: number;
  exp: number;
  coins: number;
  wool: number;
  sheepList: Sheep[];
  feces: { id: string, x: number, y: number }[];
  grassTrails: { id: string, x: number, y: number, timestamp: number }[];
  grassDecorations: GrassDecoration[];
  fences: Fence[];
  buildMode: boolean;
  lastTick: number;
  timeOfDay: number; // 0 to 24 hours
  timeSpeed: number; // Multiplier for time passage
  dayCount: number; // Number of days passed
  weather: 'sunny' | 'rainy' | 'windy';
  windDirection: number; // 0-360 degrees
  windStrength: number; // 0-100
  weatherEndTime: number; // Timestamp when weather ends

  // Actions
  toggleBuildMode: () => void;
  placeFence: (x: number, y: number) => void;
  removeFence: (x: number, y: number) => void;
  rotateFence: (x: number, y: number) => void;
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
  devSetState: (newState: Partial<GameState>) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  triggerWeather: (weather: 'sunny' | 'rainy' | 'windy', durationSeconds: number) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      level: 1,
      penLevel: 1,
      exp: 0,
      coins: 100,
      wool: 0,
      sheepList: [
        { id: '1', name: '小白', stage: 'BABY', gender: 'FEMALE', age: 0, health: 100, hunger: 100, woolGrowth: 0, lastBredAge: 0 },
        { id: '2', name: '小黑', stage: 'BABY', gender: 'MALE', age: 0, health: 100, hunger: 100, woolGrowth: 0, lastBredAge: 0 },
      ],
      feces: [],
      grassTrails: [],
      grassDecorations: [],
      fences: [],
      buildMode: false,
      lastTick: Date.now(),
      timeOfDay: 8, // Start at 8:00 AM
      timeSpeed: 1,
      dayCount: 1,
      weather: 'sunny',
      windDirection: 0,
      windStrength: 0,
      weatherEndTime: 0,
      soundEnabled: true,

      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      devSetState: (newState) => set((state) => ({ ...state, ...newState })),

      triggerWeather: (weather, durationSeconds) => set({
        weather,
        windDirection: weather === 'windy' ? Math.random() * 360 : 0,
        windStrength: weather === 'windy' ? 30 + Math.random() * 70 : 0,
        weatherEndTime: Date.now() + durationSeconds * 1000
      }),

      addGrassTrail: (x, y) => set((state) => ({
        grassTrails: [...(state.grassTrails || []), { id: Date.now().toString() + Math.random(), x, y, timestamp: Date.now() }]
      })),

      clearOldGrassTrails: () => set((state) => {
        const now = Date.now();
        const validTrails = (state.grassTrails || []).filter(t => now - t.timestamp < 3000); // Keep trails for 3 seconds
        if (validTrails.length === (state.grassTrails || []).length) return state;
        return { grassTrails: validTrails };
      }),

      removeGrass: (id) => set((state) => ({
        grassDecorations: (state.grassDecorations || []).filter(g => g.id !== id)
      })),

      toggleBuildMode: () => set((state) => ({ buildMode: !state.buildMode })),

      placeFence: (x, y) => set((state) => {
        // Assume fence costs 5 coins
        if (state.coins < 5) return state;
        // Check if fence already exists
        if ((state.fences || []).some(f => f.x === x && f.y === y)) return state;
        return {
          coins: state.coins - 5,
          fences: [...(state.fences || []), { id: `fence-${Date.now()}-${x}-${y}`, x, y, rotation: 0 }]
        };
      }),

      removeFence: (x, y) => set((state) => ({
        fences: (state.fences || []).filter(f => !(f.x === x && f.y === y)),
        coins: state.coins + 2 // Refund 2 coins
      })),

      rotateFence: (x, y) => set((state) => ({
        fences: (state.fences || []).map(f =>
          f.x === x && f.y === y ? { ...f, rotation: (f.rotation + 90) % 360 } : f
        )
      })),

      spawnGrass: () => set((state) => {
        const MAX_GRASS = 50;
        const currentGrassCount = (state.grassDecorations || []).length;
        
        // If we already have the maximum amount of grass, do nothing
        if (currentGrassCount >= MAX_GRASS) return state;
        
        // Only spawn what's missing to reach MAX_GRASS, up to a batch size of 5
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
        return { grassDecorations: [...(state.grassDecorations || []), ...newGrass] };
      }),

      upgradePen: () => set((state) => {
        const penLevel = state.penLevel || 1;
        const upgradeCost = penLevel * 500;
        const levelReq = penLevel * 2;
        if (state.coins < upgradeCost || state.level < levelReq) return state;
        return {
          coins: state.coins - upgradeCost,
          penLevel: penLevel + 1
        };
      }),

      eatGrass: (id, amount) => set((state) => {
        const sheep = state.sheepList.find(s => s.id === id);
        if (!sheep || sheep.health <= 0) return state;

        return {
          sheepList: state.sheepList.map(s => 
            s.id === id ? { ...s, hunger: Math.min(100, s.hunger + amount) } : s
          )
        };
      }),

      cleanAll: () => set((state) => {
        if (state.coins < 10 || !(state.feces?.length > 0)) return state;
        return {
          coins: state.coins - 10,
          feces: []
        };
      }),

      sheepDefecate: (id, x, y) => set((state) => {
        const sheep = state.sheepList.find(s => s.id === id);
        if (!sheep || sheep.health <= 0) return state;
        return {
          feces: [...(state.feces || []), { id: Date.now().toString() + Math.random(), x, y }],
          sheepList: state.sheepList.map(s => s.id === id ? { ...s, hunger: Math.max(0, s.hunger - 15), lastDefecatedAge: s.age } : s)
        };
      }),

      addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),

      clearCorpse: (id) => set((state) => ({
        sheepList: state.sheepList.filter(s => s.id !== id)
      })),

      shearSheep: (id) => set((state) => {
        const sheep = state.sheepList.find(s => s.id === id);
        if (!sheep || (sheep.woolGrowth || 0) < 100 || sheep.health <= 0) return state;
        return {
          wool: state.wool + 1,
          sheepList: state.sheepList.map(s => s.id === id ? { ...s, woolGrowth: 0 } : s)
        };
      }),

      sellSheep: (id) => set((state) => {
        const sheep = state.sheepList.find(s => s.id === id);
        if (!sheep) return state;
        const value = sheep.stage === 'ADULT' ? 150 : sheep.stage === 'GROWING' ? 80 : 30;
        return {
          coins: state.coins + value,
          sheepList: state.sheepList.filter(s => s.id !== id)
        };
      }),

      breedSheep: (id) => set((state) => {
        const sheep = state.sheepList.find(s => s.id === id);
        if (!sheep || sheep.stage !== 'ADULT' || sheep.health <= 0) return state;
        
        const lastBred = sheep.lastBredAge || 0;
        if (sheep.age - lastBred < 600 && lastBred !== 0) return state; // Cooldown 600 ticks

        const partner = state.sheepList.find(s => s.id !== id && s.stage === 'ADULT' && s.health > 0 && s.gender !== sheep.gender);
        if (!partner) return state;

        return {
          sheepList: [
            ...state.sheepList.map(s => s.id === id ? { ...s, lastBredAge: s.age } : s),
            {
              id: Date.now().toString(),
              name: `小羊${state.sheepList.length + 1}`,
              stage: 'BABY',
              gender: Math.random() > 0.5 ? 'MALE' : 'FEMALE',
              age: 0,
              health: 100,
              hunger: 100,
              woolGrowth: 0,
              lastBredAge: 0
            }
          ]
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
        const maxSheep = 4 + (state.penLevel || 1) * 4;
        if (state.coins >= 50 && state.sheepList.length < maxSheep) {
          return {
            coins: state.coins - 50,
            sheepList: [...state.sheepList, {
              id: Date.now().toString(),
              name: `小羊${state.sheepList.length + 1}`,
              stage: 'BABY',
              gender: Math.random() > 0.5 ? 'MALE' : 'FEMALE',
              age: 0,
              health: 100,
              hunger: 100,
              woolGrowth: 0,
              lastBredAge: 0
            }]
          };
        }
        return state;
      }),

      gameTick: () => set((state) => {
        const now = Date.now();
        // Calculate how many ticks passed (e.g., 1 tick per second)
        const ticksPassed = Math.floor((now - state.lastTick) / 1000);
        
        if (ticksPassed <= 0) return state;

        const isNight = state.timeOfDay >= 19 || state.timeOfDay < 6;
        const hungerDecayRate = isNight ? (0.2 / 30) : (1 / 30); // Hunger decays 1 point per 30s (day), 0.2 points per 30s (night)
        
        const effectiveTicks = ticksPassed * (state.timeSpeed || 1);

        const updatedSheep = state.sheepList.map(sheep => {
          if (sheep.health <= 0) return sheep; // Dead sheep don't change
          
          // Decrease stats over time
          const newHunger = Math.max(0, sheep.hunger - (effectiveTicks * hungerDecayRate));
          
          // Health decreases if hungry
          let healthDelta = 0;
          if (newHunger <= 0) healthDelta -= 2;
          else if (newHunger > 80) healthDelta += 1; // Natural healing

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

        const timeIncrement = effectiveTicks * (1 / 60); // 1 real second = 1 game minute (1/60 hour)
        const totalTime = state.timeOfDay + timeIncrement;
        const newTimeOfDay = totalTime % 24;
        const daysPassed = Math.floor(totalTime / 24);
        const newDayCount = (state.dayCount || 1) + daysPassed;

        // Check if weather should end
        let newWeather = state.weather;
        let newWindDirection = state.windDirection;
        let newWindStrength = state.windStrength;
        if (now >= state.weatherEndTime && state.weather !== 'sunny') {
          newWeather = 'sunny';
          newWindDirection = 0;
          newWindStrength = 0;
        }

        // Random weather trigger (10% chance per minute when sunny)
        if (state.weather === 'sunny' && Math.random() < 0.1) {
          const willBeWindy = Math.random() > 0.5;
          newWeather = willBeWindy ? 'windy' : 'rainy';
          const duration = 30 + Math.random() * 60; // 30-90 seconds
          if (willBeWindy) {
            newWindDirection = Math.random() * 360;
            newWindStrength = 30 + Math.random() * 70;
          }
          return {
            sheepList: updatedSheep,
            lastTick: now,
            timeOfDay: newTimeOfDay,
            dayCount: newDayCount,
            weather: newWeather,
            windDirection: newWindDirection,
            windStrength: newWindStrength,
            weatherEndTime: now + duration * 1000
          };
        }

        return {
          sheepList: updatedSheep,
          lastTick: now,
          timeOfDay: newTimeOfDay,
          dayCount: newDayCount,
          weather: newWeather,
          windDirection: newWindDirection,
          windStrength: newWindStrength
        };
      }),
    }),
    {
      name: 'sheep-farm-storage', // IndexedDB/LocalStorage key for PWA offline support
    }
  )
);
