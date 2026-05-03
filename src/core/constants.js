/**
 * 全局常量配置
 */
export const GRID_W = 16;       // 网格横向数量
export const GRID_H = 12;       // 网格纵向数量
export const CELL_SIZE = 50;    // 每个格子的像素边长
export const BOX_SIZE = 28;     // 货物的像素边长

// 货物居中偏移量
export const BOX_OFFSET = (CELL_SIZE - BOX_SIZE) / 2;

// 颜色配置
export const COLORS = {
  // 输送带颜色
  BELT_NORMAL: '#334155',
  BELT_HIGH_SPEED: '#1e293b',
  BELT_STRIPE_NORMAL: '#475569',
  BELT_STRIPE_HIGH_SPEED: '#94a3b8',
  BELT_RAIL: '#94a3b8',
  HIGH_SPEED_THRESHOLD: 120,
  DEFAULT_SPEED: 60,

  // 收货站颜色
  RECEIVER_OUTER: '#065f46',
  RECEIVER_INNER: '#10b981',

  // 分流器颜色
  DIVERTER_OUTER: '#155e75',
  DIVERTER_INNER: '#0891b2',

  // 发货机颜色
  SPAWNER_BG: 'rgba(59, 130, 246, 0.2)',
  SPAWNER_BORDER: '#2563eb',
  SPAWNER_CENTER: '#1e3a8a',

  // 货物颜色
  BOX_OUTER: '#d97706',
  BOX_INNER: '#f59e0b',
  BOX_TAPE: '#b45309',

  // 进度条颜色
  PROGRESS_BG: 'rgba(0, 0, 0, 0.5)',
  PROGRESS_BAR: '#3b82f6',

  // 网格颜色
  GRID_LINE: '#e5e7eb',
  GRID_LABEL: '#9ca3af',

  // 预览颜色
  PREVIEW_CONVEYOR: '#3b82f6',
  PREVIEW_RECEIVER: '#10b981',
  PREVIEW_BOX: '#f59e0b',
  PREVIEW_ERASER: '#ef4444',

  // 热力图颜色
  HEATMAP_ALPHA: 0.45
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