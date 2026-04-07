# 模拟养羊游戏 - 技术开发文档 (TDD)

## 1. 技术栈选型 (Tech Stack)

考虑到游戏需要先做网页版，最终部署为 PWA，且包含复杂的模拟经营状态和未来的社交功能，推荐以下技术栈：

*   **前端框架**: React 19 + TypeScript (利用 Hooks 处理复杂的生命周期和状态)。
*   **构建工具**: Vite (极速构建，原生支持 PWA 插件)。
*   **状态管理**: Zustand (轻量、高性能，非常适合游戏循环和频繁的状态更新，支持持久化)。
*   **UI/样式**: Tailwind CSS + Framer Motion (用于流畅的 UI 动画和小羊的交互反馈)。
*   **本地存储**: IndexedDB / `localforage` (用于 PWA 离线状态下的海量游戏数据存储)。
*   **PWA 支持**: `vite-plugin-pwa` (自动生成 Service Worker，处理离线缓存和应用安装)。
*   **后端/社交 (规划中)**: Firebase (Firestore 用于云存档和好友农场，Auth 用于登录)。

## 2. 系统架构设计 (Architecture)

游戏采用 **"数据驱动 + 游戏循环 (Game Loop)"** 的架构：

1.  **Game Loop (游戏心跳)**: 全局一个 `setInterval` 或 `requestAnimationFrame`，每秒触发一次 `TICK`。
2.  **时间系统**: 现实 1 秒 = 游戏内 1 分钟。控制天气变化、四季更替、小羊饥饿度下降。
3.  **状态分层**:
    *   `playerStore`: 玩家等级、经验、金币、钻石、背包道具。
    *   `farmStore`: 羊圈数据、农场设施、天气状态。
    *   `sheepStore`: 所有小羊的独立状态（健康、饱食、清洁、心情、生病状态）。
4.  **事件总线 (Event System)**: 处理随机奇遇、突发困难（如老鼠侵袭）。

## 3. 核心数据模型 (Data Models)

### 3.1 玩家 (Player)
```typescript
interface Player {
  id: string;
  level: number;
  exp: number;
  coins: number;
  diamonds: number;
  inventory: Record<string, number>; // 道具ID -> 数量
}
```

### 3.2 小羊 (Sheep)
```typescript
interface Sheep {
  id: string;
  breedId: string; // 品种 (普通, 绒山羊, 奶山羊等)
  name: string;
  stage: 'BABY' | 'GROWING' | 'ADULT';
  age: number; // 存活时间
  stats: {
    health: number; // 0-100
    hunger: number; // 0-100 (随时间下降)
    cleanliness: number; // 0-100
    mood: number; // 0-100
  };
  status: 'NORMAL' | 'SICK' | 'HUNGRY' | 'DEAD';
  diseaseType?: 'COLD' | 'DIARRHEA' | 'SKIN'; // 疾病类型
  penId: string; // 所属羊圈
}
```

### 3.3 羊圈 (Pen)
```typescript
interface Pen {
  id: string;
  type: 'BASIC' | 'WARM' | 'VENTILATED' | 'ISOLATION' | 'ADVANCED';
  level: number;
  capacity: number;
  facilities: string[]; // 内部设施 (取暖灯, 自动喂食器)
  cleanliness: number; // 羊圈清洁度，影响小羊生病率
}
```

## 4. 核心机制实现方案

### 4.1 游戏循环与数值衰减 (Game Tick)
使用 Zustand 结合 `useEffect` 实现全局 Tick。
*   每 Tick (例如 1000ms)，遍历所有存活的小羊。
*   `hunger -= 消耗率` (受品种和天气影响)。
*   如果 `hunger < 20`，触发 `HUNGRY` 状态，`health` 开始下降。
*   如果 `cleanliness < 30`，按概率触发生病事件。

### 4.2 困难与事件系统 (Event System)
*   **困难触发器**: 在 Tick 中加入随机数判定。例如：当前是“雨天”且羊圈类型为“BASIC”，则有 5% 概率触发“羊圈漏水”事件。
*   **事件解决**: 弹出事件 UI，玩家需消耗特定道具（如“木板”修补）或操作（点击清理）。超时未解决则扣除小羊健康值。

### 4.3 天气与季节系统 (Weather & Season)
*   设定一个游戏年历（如 30 个现实日为游戏内一年）。
*   根据当前季节权重，每日随机生成天气。
*   天气作为全局 Context，影响所有数值计算（如：冬季 + 暴雪 = 羊圈温度骤降，需消耗电力开启取暖灯，否则小羊健康暴跌）。

## 5. PWA 与离线支持方案

1.  **Manifest 配置**: 在 `vite.config.ts` 中配置 `VitePWA`，设置 `name`, `icons`, `theme_color`, `display: 'standalone'`，使其在手机上可作为独立 App 安装。
2.  **Service Worker**: 缓存所有静态资源（图片、音频、JS/CSS），确保断网状态下游戏可秒开。
3.  **数据持久化**: 使用 `zustand/middleware/persist` 结合 `IndexedDB`。玩家的存档实时保存在本地，下次打开无缝衔接。

## 6. 后端与社交扩展 (Phase 3 规划)

当游戏需要引入“好友农场互访”、“集市售卖”时，引入 Firebase：
*   **云存档**: 本地 IndexedDB 数据定期同步至 Firestore `users/{userId}/saveData`。
*   **好友系统**: Firestore `friends` 集合，记录双向关系。
*   **异步互访**: 访问好友农场时，拉取好友的云端存档进行只读渲染。帮忙清理羊圈时，通过 Cloud Functions 写入一条互助记录，好友上线后结算奖励。

## 7. 开发阶段规划 (Roadmap)

*   **Phase 1 (MVP 核心循环)**: 搭建 PWA 框架，实现基础羊圈、2只小羊的喂养、清理、生老病死循环，以及本地数据存储。
*   **Phase 2 (内容扩充)**: 加入多品种繁育、加工坊、天气系统、随机困难事件。
*   **Phase 3 (社交与商业化)**: 接入 Firebase，实现好友互访、集市交易、排行榜。
