import { EventEmitter } from './EventEmitter.js';
import { GRID_W, GRID_H, MAX_UNDO } from './constants.js';

/**
 * 状态管理模块
 * 继承 EventEmitter，在状态变更时发射事件
 */
export class State extends EventEmitter {
  constructor() {
    super();

    // 网格地图: 0=空, 或设施对象
    this.grid = this._createEmptyGrid();

    // 货物数组
    this.boxes = [];
    this.boxIdCounter = 0;

    // 发货机数组
    this.spawners = [];

    // 热力图数据
    this.heatData = this._createEmptyGrid();

    // 仿真状态
    this.isRunning = false;
    this.simTime = 0;
    this.activeTimeMs = 0;
    this.deliveredCount = 0;

    // 建造参数
    this.currentTool = 'select';
    this.buildLength = 1;
    this.buildSpeed = 60;
    this.buildInterval = 1;
    this.buildTransferTime = 2.0;
    this.lastConveyorDir = 1;

    // 全局仿真速度
    this.speed = 1;

    // 鼠标悬停位置
    this.hoverX = -1;
    this.hoverY = -1;

    // 显示热力图
    this.spaceHeld = false;

    this.showHeatMap = false;

    // 撤销历史
    this.undoHistory = [];
  }

  _createEmptyGrid() {
    return Array.from({ length: GRID_H }, () => Array(GRID_W).fill(0));
  }

  // ========== 网格操作 ==========

  /**
   * 设置网格单元
   */
  setCell(x, y, cell) {
    if (x < 0 || x >= GRID_W || y < 0 || y >= GRID_H) return;
    this.grid[y][x] = cell;
    this.emit('state:grid-change', { x, y, cell });
  }

  /**
   * 获取网格单元
   */
  getCell(x, y) {
    if (x < 0 || x >= GRID_W || y < 0 || y >= GRID_H) return 0;
    return this.grid[y][x];
  }

  /**
   * 清空网格
   */
  clearGrid() {
    this.grid = this._createEmptyGrid();
    this.emit('state:grid-cleared');
  }

  // ========== 货物操作 ==========

  /**
   * 添加货物
   */
  addBox(box) {
    box.id = ++this.boxIdCounter;
    this.boxes.push(box);
    this.emit('state:box-spawn', { box });
    return box;
  }

  /**
   * 移除货物
   */
  removeBox(box) {
    const index = this.boxes.indexOf(box);
    if (index > -1) {
      this.boxes.splice(index, 1);
      this.emit('state:box-remove', { box });
    }
  }

  /**
   * 清空所有货物
   */
  clearBoxes() {
    this.boxes = [];
    this.activeTimeMs = 0;
    this.deliveredCount = 0;
    this.emit('state:boxes-cleared');
  }

  // ========== 发货机操作 ==========

  /**
   * 添加发货机
   */
  addSpawner(spawner) {
    this.spawners.push(spawner);
    this.emit('state:spawner-add', { spawner });
  }

  /**
   * 移除发货机
   */
  removeSpawner(x, y) {
    const index = this.spawners.findIndex(s => s.x === x && s.y === y);
    if (index > -1) {
      const spawner = this.spawners.splice(index, 1)[0];
      this.emit('state:spawner-remove', { spawner });
    }
  }

  // ========== 撤销系统 ==========

  /**
   * 保存状态到撤销历史
   */
  pushUndo() {
    this.undoHistory.push({
      grid: JSON.parse(JSON.stringify(this.grid)),
      spawners: JSON.parse(JSON.stringify(this.spawners))
    });
    if (this.undoHistory.length > MAX_UNDO) {
      this.undoHistory.shift();
    }
  }

  /**
   * 撤销
   */
  undo() {
    if (this.undoHistory.length === 0) return false;
    const state = this.undoHistory.pop();
    this.grid = state.grid;
    this.spawners = state.spawners;
    this.emit('state:undo', state);
    return true;
  }

  // ========== 仿真控制 ==========

  /**
   * 开始仿真
   */
  startSimulation() {
    this.isRunning = true;
    this.emit('sim:start');
  }

  /**
   * 暂停仿真
   */
  pauseSimulation() {
    this.isRunning = false;
    this.emit('sim:pause');
  }

  /**
   * 停止仿真
   */
  stopSimulation() {
    this.isRunning = false;
    this.emit('sim:stop');
  }

  // ========== 工具操作 ==========

  /**
   * 选择工具
   */
  selectTool(tool) {
    this.currentTool = tool;
    if (tool.startsWith('conveyor-')) {
      this.lastConveyorDir = parseInt(tool.split('-')[1]);
    }
    this.emit('tool:select', { tool });
  }

  // ========== 数据导出/导入 ==========

  /**
   * 导出数据
   */
  exportData() {
    return {
      grid: this.grid,
      spawners: this.spawners,
      version: 2,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * 导入数据
   */
  importData(data) {
    if (data.grid) this.grid = data.grid;
    if (data.spawners) this.spawners = data.spawners;
    this.emit('state:import', data);
  }

  /**
   * 重置状态
   */
  reset() {
    this.grid = this._createEmptyGrid();
    this.boxes = [];
    this.spawners = [];
    this.heatData = this._createEmptyGrid();
    this.activeTimeMs = 0;
    this.deliveredCount = 0;
    this.undoHistory = [];
    this.emit('state:reset');
  }
}