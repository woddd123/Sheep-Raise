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

interface GameState {
  level: number;
  penLevel: number;
  exp: number;
  coins: number;
  wool: number;
  sheepList: Sheep[];
  feces: { id: string, x: number, y: number }[];
  lastTick: number;
  troughCapacity: number;
  maxTroughCapacity: number;
  timeOfDay: number; // 0 to 24 hours
  
  // Actions
  fillTrough: () => void;
  upgradeTrough: () => void;
  upgradePen: () => void;
  eatFromTrough: (id: string) => void;
  cleanAll: () => void;
  sheepDefecate: (id: string, x: number, y: number) => void;
  gameTick: () => void;
  addSheep: () => void;
  addCoins: (amount: number) => void;
  clearCorpse: (id: string) => void;
  shearSheep: (id: string) => void;
  sellSheep: (id: string) => void;
  breedSheep: (id: string) => void;
  sellWool: () => void;
  devSetState: (newState: Partial<GameState>) => void;
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
      lastTick: Date.now(),
      troughCapacity: 0,
      maxTroughCapacity: 100,
      timeOfDay: 8, // Start at 8:00 AM

      devSetState: (newState) => set((state) => ({ ...state, ...newState })),

      fillTrough: () => set((state) => {
        if (state.coins < 10 || state.troughCapacity >= state.maxTroughCapacity) return state;
        return {
          coins: state.coins - 10,
          troughCapacity: state.maxTroughCapacity
        };
      }),

      upgradeTrough: () => set((state) => {
        const upgradeCost = 100 * (state.maxTroughCapacity / 100);
        if (state.coins < upgradeCost) return state;
        return {
          coins: state.coins - upgradeCost,
          maxTroughCapacity: state.maxTroughCapacity + 100
        };
      }),

      eatFromTrough: (id) => set((state) => {
        if (state.troughCapacity <= 0) return state;
        const sheep = state.sheepList.find(s => s.id === id);
        if (!sheep || sheep.hunger >= 100 || sheep.health <= 0) return state;

        // Eating speed depends on growth stage
        let maxEatPerBite = 10; // BABY
        if (sheep.stage === 'GROWING') maxEatPerBite = 20;
        if (sheep.stage === 'ADULT') maxEatPerBite = 40;

        const eatAmount = Math.min(maxEatPerBite, 100 - sheep.hunger, state.troughCapacity);
        const newCapacity = Math.max(0, state.troughCapacity - eatAmount);

        return {
          troughCapacity: newCapacity,
          sheepList: state.sheepList.map(s => 
            s.id === id ? { ...s, hunger: s.hunger + eatAmount } : s
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
        const hungerDecayRate = isNight ? 0.2 : 1; // Hunger decays 5x slower at night

        const updatedSheep = state.sheepList.map(sheep => {
          if (sheep.health <= 0) return sheep; // Dead sheep don't change
          
          // Decrease stats over time
          const newHunger = Math.max(0, sheep.hunger - (ticksPassed * hungerDecayRate));
          
          // Health decreases if hungry
          let healthDelta = 0;
          if (newHunger <= 0) healthDelta -= 2;
          else if (newHunger > 80) healthDelta += 1; // Natural healing

          let newWoolGrowth = sheep.woolGrowth || 0;
          if (sheep.stage === 'ADULT') {
            newWoolGrowth = Math.min(100, newWoolGrowth + (ticksPassed * 0.5));
          }

          return {
            ...sheep,
            age: sheep.age + ticksPassed,
            hunger: newHunger,
            health: Math.max(0, Math.min(100, sheep.health + (healthDelta * ticksPassed))),
            stage: sheep.age > 1920 ? 'ADULT' : sheep.age > 960 ? 'GROWING' : 'BABY',
            woolGrowth: newWoolGrowth,
            lastBredAge: sheep.lastBredAge || 0
          };
        });

        const newTimeOfDay = (state.timeOfDay + ticksPassed * 0.25) % 24; // 1 real second = 15 in-game minutes

        return {
          sheepList: updatedSheep,
          lastTick: now,
          timeOfDay: newTimeOfDay
        };
      }),
    }),
    {
      name: 'sheep-farm-storage', // IndexedDB/LocalStorage key for PWA offline support
    }
  )
);
