import { reactive } from 'vue'
import { GRID_W, GRID_H, MAX_UNDO } from '../core/constants.js'

function createEmptyGrid() {
  return Array.from({ length: GRID_H }, () => Array(GRID_W).fill(0))
}

const state = reactive({
  grid: createEmptyGrid(),
  boxes: [],
  boxIdCounter: 0,
  spawners: [],
  heatData: createEmptyGrid(),

  isRunning: false,
  simTime: 0,
  activeTimeMs: 0,
  deliveredCount: 0,

  currentTool: 'select',
  buildLength: 1,
  buildSpeed: 60,
  buildInterval: 1,
  buildTransferTime: 2.0,
  lastConveyorDir: 1,

  chainBuildLength: 1,
  chainBuildSpeed: 12,
  chainBuildTransferTime: 3.0,

  boxWidth: 30,
  boxHeight: 20,
  palletWidth: 60,
  palletHeight: 40,

  speed: 1,

  hoverX: -1,
  hoverY: -1,

  spaceHeld: false,
  _spaceDragged: false,

  showHeatMap: false,
  sidebarVisible: true,

  undoHistory: [],

  view: { panX: 0, panY: 0, zoom: 1 },

  // 非响应式回调（由 CanvasView 设置）
  _onDraw: null
})

// 将物理引擎需要的方法挂在 reactive state 上
state.getCell = function(x, y) {
  if (x < 0 || x >= GRID_W || y < 0 || y >= GRID_H) return 0
  return state.grid[y][x]
}

state.addBox = function(box) {
  box.id = ++state.boxIdCounter
  state.boxes.push(box)
  return box
}

export function useSimulationStore() {
  // ========== 网格操作 ==========

  function setCell(x, y, cell) {
    if (x < 0 || x >= GRID_W || y < 0 || y >= GRID_H) return
    state.grid[y][x] = cell
    state._onDraw?.()
  }

  function getCell(x, y) {
    return state.getCell(x, y)
  }

  function clearGrid() {
    state.grid = createEmptyGrid()
    state._onDraw?.()
  }

  // ========== 货物操作 ==========

  function addBox(box) {
    box.id = ++state.boxIdCounter
    state.boxes.push(box)
    return box
  }

  function removeBox(box) {
    const index = state.boxes.indexOf(box)
    if (index > -1) state.boxes.splice(index, 1)
  }

  function clearBoxes() {
    state.boxes.length = 0
    state.activeTimeMs = 0
    state.deliveredCount = 0
    state._onDraw?.()
  }

  // ========== 发货机操作 ==========

  function addSpawner(spawner) {
    state.spawners.push(spawner)
  }

  // ========== 撤销系统 ==========

  function pushUndo() {
    state.undoHistory.push({
      grid: JSON.parse(JSON.stringify(state.grid)),
      spawners: JSON.parse(JSON.stringify(state.spawners))
    })
    if (state.undoHistory.length > MAX_UNDO) {
      state.undoHistory.shift()
    }
  }

  function undo() {
    if (state.undoHistory.length === 0) return false
    const snap = state.undoHistory.pop()
    state.grid = snap.grid
    state.spawners = snap.spawners
    state._onDraw?.()
    return true
  }

  // ========== 仿真控制 ==========

  function startSimulation() {
    state.isRunning = true
  }

  function pauseSimulation() {
    state.isRunning = false
  }

  function stopSimulation() {
    state.isRunning = false
  }

  // ========== 工具操作 ==========

  function selectTool(tool) {
    state.currentTool = tool
    if (tool.startsWith('conveyor-')) {
      state.lastConveyorDir = parseInt(tool.split('-')[1])
    }
  }

  // ========== 数据导出/导入 ==========

  function exportData() {
    return {
      grid: JSON.parse(JSON.stringify(state.grid)),
      spawners: JSON.parse(JSON.stringify(state.spawners)),
      version: 2,
      exportedAt: new Date().toISOString()
    }
  }

  function importData(data) {
    if (data.grid) state.grid = data.grid
    if (data.spawners) state.spawners = data.spawners
    state._onDraw?.()
  }

  function reset() {
    state.grid = createEmptyGrid()
    state.boxes.length = 0
    state.spawners.length = 0
    state.heatData = createEmptyGrid()
    state.activeTimeMs = 0
    state.deliveredCount = 0
    state.undoHistory.length = 0
    state._onDraw?.()
  }

  return {
    state,
    setCell,
    getCell,
    clearGrid,
    addBox,
    removeBox,
    clearBoxes,
    addSpawner,
    pushUndo,
    undo,
    startSimulation,
    pauseSimulation,
    stopSimulation,
    selectTool,
    exportData,
    importData,
    reset
  }
}
