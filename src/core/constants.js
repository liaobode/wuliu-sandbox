/**
 * 全局常量配置
 */
export const GRID_W = 64;       // 网格横向数量
export const GRID_H = 48;       // 网格纵向数量
export const CELL_SIZE = 50;    // 每个格子的像素边长
export const BOX_SIZE = 28;     // 纸箱的像素边长
export const PALLET_SIZE = 34;  // 托盘的像素边长

// 货物居中偏移量
export const BOX_OFFSET = (CELL_SIZE - BOX_SIZE) / 2;
export const PALLET_OFFSET = (CELL_SIZE - PALLET_SIZE) / 2;

// 颜色配置
export const COLORS = {
  // ---- 网格/背景（AutoCAD 暗色风格） ----
  CANVAS_BG: '#1a1a2e',
  GRID_LINE: '#2a2a4a',
  GRID_MAJOR_LINE: '#3d3d5c',
  ZOOM_MIN: 0.1,
  ZOOM_MAX: 5.0,

  // ---- 输送带 ----
  BELT_BASE_TOP: '#1e293b',
  BELT_BASE_MID: '#334155',
  BELT_BASE_BOTTOM: '#1e293b',
  BELT_HIGH_SPEED_BASE_TOP: '#0f172a',
  BELT_HIGH_SPEED_BASE_MID: '#1e293b',
  BELT_HIGH_SPEED_BASE_BOTTOM: '#0f172a',
  // 滚轮
  BELT_ROLLER_SHADOW: '#475569',
  BELT_ROLLER_MID: '#64748b',
  BELT_ROLLER_HIGHLIGHT: '#94a3b8',
  BELT_HIGH_SPEED_ROLLER_SHADOW: '#334155',
  BELT_HIGH_SPEED_ROLLER_MID: '#475569',
  BELT_HIGH_SPEED_ROLLER_HIGHLIGHT: '#64748b',
  // 导轨
  BELT_RAIL_TOP: '#cbd5e1',
  BELT_RAIL_MID: '#94a3b8',
  BELT_RAIL_BOTTOM: '#64748b',
  BELT_RAIL_SPECULAR: '#e2e8f0',
  HIGH_SPEED_THRESHOLD: 120,
  DEFAULT_SPEED: 60,
  CHAIN_HIGH_SPEED_THRESHOLD: 90,
  CHAIN_DEFAULT_SPEED: 12,

  // ---- 收货站 ----
  RECEIVER_OUTER: '#065f46',
  RECEIVER_INNER_TOP: '#059669',
  RECEIVER_INNER_BOTTOM: '#047857',
  RECEIVER_GLOW: 'rgba(16, 185, 129, 0.25)',
  RECEIVER_CHECK: '#ecfdf5',

  // ---- 分流器 ----
  DIVERTER_OUTER_TOP: '#164e63',
  DIVERTER_OUTER_BOTTOM: '#083344',
  DIVERTER_INNER_TOP: '#0891b2',
  DIVERTER_INNER_BOTTOM: '#0e7490',
  DIVERTER_ARROW: '#cffafe',

  // ---- 发货机 ----
  SPAWNER_BG: 'rgba(59, 130, 246, 0.15)',
  SPAWNER_BORDER: '#3b82f6',
  SPAWNER_BORDER_GLOW: 'rgba(59, 130, 246, 0.4)',
  SPAWNER_CENTER: '#1e40af',
  SPAWNER_CENTER_HIGHLIGHT: '#3b82f6',
  SPAWNER_LABEL: '#eff6ff',

  // ---- 货物 ----
  BOX_TOP: '#f59e0b',
  BOX_FRONT: '#d97706',
  BOX_SIDE: '#b45309',
  BOX_TAPE: '#fef3c7',
  BOX_TAPE_SHADOW: '#d97706',
  BOX_SHADOW: 'rgba(0, 0, 0, 0.25)',

  // ---- 移载进度条 ----
  PROGRESS_BG: 'rgba(0, 0, 0, 0.6)',
  PROGRESS_BAR: '#3b82f6',

  // ---- 链条输送机 ----
  CHAIN_BASE: '#27272a',
  CHAIN_PLATE: '#3f3f46',
  CHAIN_PLATE_EDGE: '#52525b',
  CHAIN_BOLT: '#71717a',
  CHAIN_LINK_HIGHLIGHT: '#a1a1aa',

  // ---- 链条移载机 ----
  TRANSFER_BASE: '#1a1a1e',
  TRANSFER_PLATFORM: '#2d2d33',
  TRANSFER_PLATFORM_EDGE: '#52525b',
  TRANSFER_CYLINDER: '#71717a',
  TRANSFER_CYLINDER_HEAD: '#a1a1aa',
  TRANSFER_LIFT_PX: 5,  // 顶升高度像素

  // ---- 托盘（蓝色塑料） ----
  PALLET_BODY: '#2563eb',
  PALLET_BODY_LIGHT: '#3b82f6',
  PALLET_BODY_DARK: '#1d4ed8',
  PALLET_GOODS_TOP: '#e2e8f0',
  PALLET_GOODS_SIDE: '#94a3b8',
  PALLET_WRAP: 'rgba(255, 255, 255, 0.15)',

  // ---- 建造预览 ----
  PREVIEW_CONVEYOR: '#3b82f6',
  PREVIEW_RECEIVER: '#10b981',
  PREVIEW_BOX: '#f59e0b',
  PREVIEW_ERASER: '#ef4444',

  // ---- 热力图 ----
  HEATMAP_ALPHA: 0.35
};

// 撤销历史上限
export const MAX_UNDO = 30;

// 粒子数量上限
export const MAX_PARTICLES = 500;

// 本地存储键名
export const SAVE_KEY = 'logistics-sandbox-v2';

// 方向常量
export const DIRECTION = {
  RIGHT: 1,
  DOWN: 2,
  LEFT: 3,
  UP: 4
};

// 方向箭头映射
export const DIRECTION_ARROWS = {
  1: '→',
  2: '↓',
  3: '←',
  4: '↑'
};

// 方向名称映射
export const DIRECTION_NAMES = {
  1: '→ 右',
  2: '↓ 下',
  3: '← 左',
  4: '↑ 上'
};