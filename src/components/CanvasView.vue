<template>
  <canvas ref="canvasRef" class="sim-canvas" @contextmenu.prevent></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { GRID_W, GRID_H, CELL_SIZE, COLORS, BOX_SIZE, BOX_OFFSET } from '../core/constants.js'
import { Box } from '../entities/Box.js'
import { Pallet } from '../entities/Pallet.js'
import { Spawner } from '../entities/Spawner.js'
import { Conveyor } from '../entities/Conveyor.js'
import { ChainConveyor } from '../entities/ChainConveyor.js'
import { ChainTransfer } from '../entities/ChainTransfer.js'
import { Receiver } from '../entities/Receiver.js'
import { Diverter } from '../entities/Diverter.js'
import { createDefaultEntityRegistry } from '../entities/index.js'
import { DefaultPhysics } from '../engine/index.js'
import { useSimulationStore } from '../stores/useSimulationStore.js'

const canvasRef = ref(null)
const store = useSimulationStore()
const { state } = store
const physics = new DefaultPhysics()

let canvas, ctx, dpr
let view = { panX: 0, panY: 0, zoom: 1 }
let initialFit = false
let entityRegistry
let logicalWidth = GRID_W * CELL_SIZE
let logicalHeight = GRID_H * CELL_SIZE

// Interaction state
let isMouseDown = false
let isPanning = false
let isSelectPanning = false
let isSpacePanning = false
let lastPanPos = { x: 0, y: 0 }

// Game loop state
let lastTime = 0
let rafId = null

// ========== Canvas setup ==========

function setupCanvas() {
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
}

function getViewportWidth() { return canvas.width / dpr }
function getViewportHeight() { return canvas.height / dpr }

function handleResize() {
  const newDpr = window.devicePixelRatio || 1
  if (newDpr !== dpr) dpr = newDpr
  resize()
  draw()
}

function resize() {
  const container = canvas.parentElement
  const cssW = container.clientWidth
  const cssH = container.clientHeight
  canvas.style.width = cssW + 'px'
  canvas.style.height = cssH + 'px'
  canvas.width = cssW * dpr
  canvas.height = cssH * dpr

  if (!initialFit) {
    initialFit = true
    view.zoom = 1
    view.panX = (cssW * dpr - logicalWidth) / (2 * dpr)
    view.panY = (cssH * dpr - logicalHeight) / (2 * dpr)
    state.view = { ...view }
  }
}

// ========== Coordinate transforms ==========

function screenToWorld(sx, sy) {
  return {
    x: (sx - view.panX) / view.zoom,
    y: (sy - view.panY) / view.zoom
  }
}

function worldToScreen(wx, wy) {
  return {
    x: wx * view.zoom + view.panX,
    y: wy * view.zoom + view.panY
  }
}

// ========== View operations ==========

function zoomAt(sx, sy, factor) {
  const world = screenToWorld(sx, sy)
  const newZoom = Math.max(COLORS.ZOOM_MIN, Math.min(COLORS.ZOOM_MAX, view.zoom * factor))
  if (newZoom === view.zoom) return
  view.zoom = newZoom
  view.panX = sx - world.x * newZoom
  view.panY = sy - world.y * newZoom
  state.view = { ...view }
}

function panBy(dx, dy) {
  view.panX += dx
  view.panY += dy
  state.view = { ...view }
}

function fitToScreen() {
  const vw = getViewportWidth()
  const vh = getViewportHeight()
  const margin = 40
  const availW = vw - margin * 2
  const availH = vh - margin * 2
  if (availW <= 0 || availH <= 0) return
  const fitZ = Math.min(availW / logicalWidth, availH / logicalHeight, 1.5)
  view.zoom = fitZ
  view.panX = (vw - logicalWidth * fitZ) / 2
  view.panY = (vh - logicalHeight * fitZ) / 2
  state.view = { ...view }
}

function fitToContent() {
  const vw = getViewportWidth()
  const vh = getViewportHeight()

  let minX = Infinity, minY = Infinity
  let maxX = -Infinity, maxY = -Infinity
  let hasItems = false

  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      if (state.grid[y][x] !== 0) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
        hasItems = true
      }
    }
  }
  for (const s of state.spawners) {
    if (s.x < minX) minX = s.x
    if (s.y < minY) minY = s.y
    if (s.x > maxX) maxX = s.x
    if (s.y > maxY) maxY = s.y
    hasItems = true
  }

  if (!hasItems) {
    view.zoom = 1
    view.panX = (vw - logicalWidth) / 2
    view.panY = (vh - logicalHeight) / 2
  } else {
    const margin = 3
    const left = (minX - margin) * CELL_SIZE
    const top = (minY - margin) * CELL_SIZE
    const right = (maxX + margin + 1) * CELL_SIZE
    const bottom = (maxY + margin + 1) * CELL_SIZE
    const areaW = right - left
    const areaH = bottom - top
    const fitZ = Math.min(vw / areaW, vh / areaH, 2)
    view.zoom = Math.max(0.1, fitZ)
    view.panX = vw / 2 - ((left + right) / 2) * view.zoom
    view.panY = vh / 2 - ((top + bottom) / 2) * view.zoom
  }
  state.view = { ...view }
}

// ========== Mouse interaction ==========

function getCanvasCoords(e) {
  const rect = canvas.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

function getGridPos(e) {
  const { x, y } = getCanvasCoords(e)
  const world = screenToWorld(x, y)
  return {
    x: Math.floor(world.x / CELL_SIZE),
    y: Math.floor(world.y / CELL_SIZE)
  }
}

function updateCursor() {
  if (state.spaceHeld) {
    canvas.style.cursor = 'grab'
  } else if (state.currentTool === 'select') {
    canvas.style.cursor = 'default'
  } else {
    canvas.style.cursor = 'crosshair'
  }
}

function onMouseDown(e) {
  if (e.button === 1) {
    e.preventDefault()
    isPanning = true
    lastPanPos = getCanvasCoords(e)
    return
  }

  if (e.button === 0 && state.currentTool === 'select') {
    isSelectPanning = true
    lastPanPos = getCanvasCoords(e)
    return
  }

  if (e.button === 0 && state.spaceHeld) {
    isSpacePanning = true
    state._spaceDragged = false
    lastPanPos = getCanvasCoords(e)
    canvas.style.cursor = 'grabbing'
    return
  }

  isMouseDown = true
  const { x, y } = getGridPos(e)
  handleInteract(x, y)
}

function onMouseMove(e) {
  const { x, y } = getCanvasCoords(e)

  if (isPanning || isSelectPanning || isSpacePanning) {
    const dx = x - lastPanPos.x
    const dy = y - lastPanPos.y
    lastPanPos = { x, y }
    if (dx !== 0 || dy !== 0) {
      panBy(dx, dy)
      draw()
      if (isSpacePanning) state._spaceDragged = true
    }
    return
  }

  const world = screenToWorld(x, y)
  const gx = Math.floor(world.x / CELL_SIZE)
  const gy = Math.floor(world.y / CELL_SIZE)
  const changed = gx !== state.hoverX || gy !== state.hoverY
  state.hoverX = gx
  state.hoverY = gy

  if (isMouseDown) {
    handleInteract(gx, gy)
  } else if (!state.isRunning && changed) {
    draw()
  }
}

function onMouseUp(e) {
  if (e.button === 1) { isPanning = false; return }
  if (isSelectPanning) { isSelectPanning = false; return }
  if (isSpacePanning) {
    isSpacePanning = false
    updateCursor()
    return
  }
  isMouseDown = false
}

function onMouseLeave() {
  isMouseDown = false
  isPanning = false
  isSelectPanning = false
  isSpacePanning = false
  state.hoverX = -1
  state.hoverY = -1
  if (!state.isRunning) draw()
}

function onWheel(e) {
  e.preventDefault()
  const rect = canvas.getBoundingClientRect()
  const sx = e.clientX - rect.left
  const sy = e.clientY - rect.top
  const factor = 1 + Math.abs(e.deltaY) * 0.002
  zoomAt(sx, sy, e.deltaY > 0 ? 1 / factor : factor)
  draw()
}

// ========== Tool interaction ==========

function handleInteract(gx, gy) {
  if (gx < 0 || gx >= GRID_W || gy < 0 || gy >= GRID_H) return
  if (state.isRunning) return

  const tool = state.currentTool
  if (tool === 'select') return

  if (tool.startsWith('conveyor-')) placeConveyor(gx, gy, tool)
  else if (tool === 'chain-transfer') placeChainTransfer(gx, gy)
  else if (tool.startsWith('chain-')) placeChainConveyor(gx, gy, tool)
  else if (tool === 'eraser') erase(gx, gy)
  else if (tool === 'box') placeBox(gx, gy)
  else if (tool === 'pallet') placePallet(gx, gy)
  else if (tool === 'chain-transfer') placeChainTransfer(gx, gy)
  else if (tool === 'spawner') placeSpawner(gx, gy)
  else if (tool === 'receiver') placeReceiver(gx, gy)
  else if (tool === 'diverter') placeDiverter(gx, gy)

  if (!state.isRunning) draw()
}

function placeConveyor(gx, gy, tool) {
  store.pushUndo()
  const dir = parseInt(tool.split('-')[1])

  for (let i = 0; i < state.buildLength; i++) {
    let tx = gx, ty = gy
    if (dir === 1) tx += i
    else if (dir === 2) ty += i
    else if (dir === 3) tx -= i
    else if (dir === 4) ty -= i

    if (tx >= 0 && tx < GRID_W && ty >= 0 && ty < GRID_H) {
      store.setCell(tx, ty, Conveyor.create({
        dir, speed: state.buildSpeed, transferTime: state.buildTransferTime
      }))
    }
  }
}

function placeChainConveyor(gx, gy, tool) {
  store.pushUndo()
  const dir = parseInt(tool.split('-')[1])

  for (let i = 0; i < state.chainBuildLength; i++) {
    let tx = gx, ty = gy
    if (dir === 1) tx += i
    else if (dir === 2) ty += i
    else if (dir === 3) tx -= i
    else if (dir === 4) ty -= i

    if (tx >= 0 && tx < GRID_W && ty >= 0 && ty < GRID_H) {
      store.setCell(tx, ty, ChainConveyor.create({
        dir, speed: state.chainBuildSpeed, transferTime: state.chainBuildTransferTime
      }))
    }
  }
}

function erase(gx, gy) {
  store.pushUndo()

  for (let i = state.boxes.length - 1; i >= 0; i--) {
    const b = state.boxes[i]
    const rx = Math.round(b.x + (b.nextX - b.x) * b.progress)
    const ry = Math.round(b.y + (b.nextY - b.y) * b.progress)
    if (rx === gx && ry === gy) { state.boxes.splice(i, 1); draw(); return }
  }

  for (let i = state.spawners.length - 1; i >= 0; i--) {
    if (state.spawners[i].x === gx && state.spawners[i].y === gy) {
      state.spawners.splice(i, 1); draw(); return
    }
  }

  store.setCell(gx, gy, 0)
}

function placeBox(gx, gy) {
  const cell = store.getCell(gx, gy)
  const hasBox = state.boxes.some(b =>
    (b.x === gx && b.y === gy) || (b.nextX === gx && b.nextY === gy)
  )
  if (!hasBox && Conveyor.isType(cell)) {
    store.addBox(Box.create({ x: gx, y: gy, lastDir: cell.dir, w: state.boxWidth, h: state.boxHeight }))
  }
}

function placePallet(gx, gy) {
  const cell = store.getCell(gx, gy)
  const hasCargo = state.boxes.some(b =>
    (b.x === gx && b.y === gy) || (b.nextX === gx && b.nextY === gy)
  )
  if (!hasCargo && (ChainConveyor.isType(cell) || ChainTransfer.isType(cell))) {
    store.addBox(Pallet.create({ x: gx, y: gy, lastDir: cell.dir, w: state.palletWidth, h: state.palletHeight }))
  }
}

function placeChainTransfer(gx, gy) {
  const cell = store.getCell(gx, gy)
  if (!ChainConveyor.isType(cell)) return
  store.pushUndo()
  store.setCell(gx, gy, ChainTransfer.create({
    dir: cell.dir,
    speed: state.chainBuildSpeed,
    transferTime: state.chainBuildTransferTime
  }))
}

function placeSpawner(gx, gy) {
  const cell = store.getCell(gx, gy)
  const hasSpawner = state.spawners.some(s => s.x === gx && s.y === gy)
  if (!hasSpawner && Conveyor.isType(cell)) {
    store.pushUndo()
    store.addSpawner({ x: gx, y: gy, timer: 0, interval: state.buildInterval * 1000 })
  }
}

function placeReceiver(gx, gy) {
  const cell = store.getCell(gx, gy)
  if (!Receiver.isType(cell)) {
    store.pushUndo()
    store.setCell(gx, gy, Receiver.create())
    state.spawners = state.spawners.filter(s => !(s.x === gx && s.y === gy))
  }
}

function placeDiverter(gx, gy) {
  store.pushUndo()
  const dir1 = state.lastConveyorDir
  const dir2 = (dir1 % 4) + 1
  store.setCell(gx, gy, Diverter.create({
    dir1, dir2, speed: state.buildSpeed, transferTime: state.buildTransferTime
  }))
}

// ========== Rendering ==========

function draw() {
  const vw = getViewportWidth()
  const vh = getViewportHeight()

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, vw, vh)

  ctx.fillStyle = COLORS.CANVAS_BG
  ctx.fillRect(0, 0, vw, vh)

  ctx.save()
  ctx.translate(view.panX, view.panY)
  ctx.scale(view.zoom, view.zoom)

  drawGrid()
  drawEntities()
  drawSpawners()
  drawBoxes()
  drawHeatmap()
  drawPreview()

  ctx.restore()

  drawHUD()
}

function drawGrid() {
  const vw = getViewportWidth()
  const vh = getViewportHeight()

  const topLeft = screenToWorld(0, 0)
  const bottomRight = screenToWorld(vw, vh)
  const startX = Math.floor(topLeft.x / CELL_SIZE)
  const startY = Math.floor(topLeft.y / CELL_SIZE)
  const endX = Math.ceil(bottomRight.x / CELL_SIZE)
  const endY = Math.ceil(bottomRight.y / CELL_SIZE)

  let minorStep, majorStep
  if (view.zoom < 0.3) { minorStep = 8; majorStep = 16 }
  else if (view.zoom < 0.6) { minorStep = 4; majorStep = 8 }
  else if (view.zoom < 2.0) { minorStep = 1; majorStep = 4 }
  else { minorStep = 1; majorStep = 1 }

  // 细网格线
  ctx.strokeStyle = COLORS.GRID_LINE
  ctx.lineWidth = Math.max(0.2, 0.4 / view.zoom)
  for (let x = startX; x <= endX; x += minorStep) {
    ctx.beginPath()
    ctx.moveTo(x * CELL_SIZE, startY * CELL_SIZE)
    ctx.lineTo(x * CELL_SIZE, endY * CELL_SIZE)
    ctx.stroke()
  }
  for (let y = startY; y <= endY; y += minorStep) {
    ctx.beginPath()
    ctx.moveTo(startX * CELL_SIZE, y * CELL_SIZE)
    ctx.lineTo(endX * CELL_SIZE, y * CELL_SIZE)
    ctx.stroke()
  }

  // 主网格线
  ctx.strokeStyle = COLORS.GRID_MAJOR_LINE
  ctx.lineWidth = Math.max(0.3, 0.8 / view.zoom)
  for (let x = startX; x <= endX; x += majorStep) {
    ctx.beginPath()
    ctx.moveTo(x * CELL_SIZE, startY * CELL_SIZE)
    ctx.lineTo(x * CELL_SIZE, endY * CELL_SIZE)
    ctx.stroke()
  }
  for (let y = startY; y <= endY; y += majorStep) {
    ctx.beginPath()
    ctx.moveTo(startX * CELL_SIZE, y * CELL_SIZE)
    ctx.lineTo(endX * CELL_SIZE, y * CELL_SIZE)
    ctx.stroke()
  }
}

function drawEntities() {
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      const cell = state.grid[y][x]
      entityRegistry.renderCell(ctx, x, y, cell, { simTime: state.simTime, boxes: state.boxes })
    }
  }
}

function drawSpawners() {
  for (const spawner of state.spawners) {
    Spawner.render(ctx, spawner, { simTime: state.simTime })
  }
}

function drawBoxes() {
  for (const box of state.boxes) {
    Box.render(ctx, box)
  }
}

function drawHeatmap() {
  if (!state.showHeatMap) return

  let maxHeat = 0
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      if (state.heatData[y][x] > maxHeat) maxHeat = state.heatData[y][x]
    }
  }

  if (maxHeat > 0) {
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const v = state.heatData[y][x]
        if (v > 0) {
          const intensity = Math.min(v / maxHeat, 1)
          const hue = (1 - intensity) * 240
          ctx.fillStyle = `hsla(${hue}, 80%, ${50 + intensity * 10}%, ${COLORS.HEATMAP_ALPHA})`
          ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2)
        }
      }
    }
  }
}

function drawPreview() {
  if (state.isRunning) return
  if (state.hoverX < 0 || state.hoverX >= GRID_W) return
  if (state.hoverY < 0 || state.hoverY >= GRID_H) return

  const px = state.hoverX * CELL_SIZE
  const py = state.hoverY * CELL_SIZE
  const tool = state.currentTool
  const cellSize = CELL_SIZE

  ctx.save()
  ctx.globalAlpha = 0.35

  if (tool.startsWith('conveyor-')) {
    const dir = parseInt(tool.split('-')[1])
    for (let i = 0; i < state.buildLength; i++) {
      let tx = state.hoverX, ty = state.hoverY
      if (dir === 1) tx += i
      else if (dir === 2) ty += i
      else if (dir === 3) tx -= i
      else if (dir === 4) ty -= i

      if (tx >= 0 && tx < GRID_W && ty >= 0 && ty < GRID_H) {
        const cx = tx * cellSize, cy = ty * cellSize
        ctx.fillStyle = COLORS.PREVIEW_CONVEYOR
        ctx.beginPath()
        ctx.roundRect(cx + 2, cy + 2, cellSize - 4, cellSize - 4, 3)
        ctx.fill()
        const arrows = ['→', '↓', '←', '↑']
        ctx.globalAlpha = 0.7
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 20px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(arrows[dir - 1], cx + cellSize / 2, cy + cellSize / 2)
        ctx.globalAlpha = 0.35
      }
    }
  } else if (tool === 'chain-transfer') {
    ctx.fillStyle = '#3d3d38'
    ctx.beginPath(); ctx.roundRect(px + 2, py + 2, cellSize - 4, cellSize - 4, 4); ctx.fill()
    ctx.fillStyle = '#71717a'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('⇅', px + cellSize / 2, py + cellSize / 2)
  } else if (tool.startsWith('chain-')) {
    const dir = parseInt(tool.split('-')[1])
    for (let i = 0; i < state.chainBuildLength; i++) {
      let tx = state.hoverX, ty = state.hoverY
      if (dir === 1) tx += i
      else if (dir === 2) ty += i
      else if (dir === 3) tx -= i
      else if (dir === 4) ty -= i

      if (tx >= 0 && tx < GRID_W && ty >= 0 && ty < GRID_H) {
        const cx = tx * cellSize, cy = ty * cellSize
        ctx.fillStyle = '#52525b'
        ctx.beginPath()
        ctx.roundRect(cx + 2, cy + 2, cellSize - 4, cellSize - 4, 3)
        ctx.fill()
        const arrows = ['→', '↓', '←', '↑']
        ctx.globalAlpha = 0.7
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 20px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(arrows[dir - 1], cx + cellSize / 2, cy + cellSize / 2)
        ctx.globalAlpha = 0.35
      }
    }
  } else if (tool === 'receiver') {
    ctx.fillStyle = COLORS.PREVIEW_RECEIVER
    ctx.beginPath(); ctx.roundRect(px + 2, py + 2, cellSize - 4, cellSize - 4, 4); ctx.fill()
  } else if (tool === 'spawner') {
    ctx.fillStyle = COLORS.PREVIEW_CONVEYOR
    ctx.beginPath(); ctx.roundRect(px + 2, py + 2, cellSize - 4, cellSize - 4, 4); ctx.fill()
  } else if (tool === 'box') {
    const bw = state.boxWidth, bh = state.boxHeight
    const boxOffX = (cellSize - bw) / 2, boxOffY = (cellSize - bh) / 2
    ctx.fillStyle = COLORS.PREVIEW_BOX
    ctx.beginPath(); ctx.roundRect(px + boxOffX, py + boxOffY, bw, bh, 3); ctx.fill()
  } else if (tool === 'pallet') {
    const pw = state.palletWidth, ph = state.palletHeight
    const palletOffX = (cellSize - pw) / 2, palletOffY = (cellSize - ph) / 2
    ctx.fillStyle = '#3b82f6'
    ctx.beginPath(); ctx.roundRect(px + palletOffX, py + palletOffY, pw, ph, 3); ctx.fill()
  } else if (tool === 'eraser') {
    ctx.fillStyle = COLORS.PREVIEW_ERASER
    ctx.beginPath(); ctx.roundRect(px + 2, py + 2, cellSize - 4, cellSize - 4, 4); ctx.fill()
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(px + 12, py + 12); ctx.lineTo(px + cellSize - 12, py + cellSize - 12)
    ctx.moveTo(px + cellSize - 12, py + 12); ctx.lineTo(px + 12, py + cellSize - 12)
    ctx.stroke()
  }

  ctx.restore()
}

function drawHUD() {
  if (!state.isRunning && state.activeTimeMs === 0) return

  const vw = getViewportWidth()
  const padding = 10
  const timeSec = state.activeTimeMs / 1000
  const rate = timeSec > 0 ? state.deliveredCount / timeSec : 0
  const lines = [
    `📦 ${state.boxes.length}  |  ✅ ${state.deliveredCount}`,
    `⏱️ ${timeSec.toFixed(1)}s  |  📊 ${rate.toFixed(2)}/s  |  ⚡${state.speed.toFixed(1)}x`
  ]

  ctx.save()
  ctx.font = 'bold 12px monospace'
  const maxW = Math.max(...lines.map(l => ctx.measureText(l).width))
  const boxH = lines.length * 18 + padding
  const boxW = maxW + padding * 2
  const bx = vw - boxW - 8
  const by = 8

  const hudGrad = ctx.createLinearGradient(bx, by, bx, by + boxH)
  hudGrad.addColorStop(0, 'rgba(0, 0, 0, 0.65)')
  hudGrad.addColorStop(1, 'rgba(0, 0, 0, 0.75)')
  ctx.fillStyle = hudGrad
  ctx.beginPath(); ctx.roundRect(bx, by, boxW, boxH, 6); ctx.fill()

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'; ctx.lineWidth = 1; ctx.stroke()

  ctx.fillStyle = '#cbd5e1'
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'
  lines.forEach((line, i) => {
    ctx.fillText(line, bx + padding, by + padding / 2 + i * 18)
  })

  ctx.restore()
}

// ========== Game loop ==========

function gameLoop(timestamp) {
  if (!state.isRunning) return

  const dt = Math.min(timestamp - lastTime, 200)
  lastTime = timestamp

  const simDt = dt * state.speed
  state.activeTimeMs += simDt
  state.simTime += simDt

  physics.update(state, dt)

  draw()
  drawHUD()

  rafId = requestAnimationFrame(gameLoop)
}

// Set draw callback so store methods trigger redraw
state._onDraw = () => { if (!state.isRunning) draw() }

// Auto-start/stop game loop when simulation toggles
watch(() => state.isRunning, (running) => {
  if (running) {
    lastTime = performance.now()
    rafId = requestAnimationFrame(gameLoop)
  } else {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }
})

// ========== Lifecycle ==========

onMounted(() => {
  canvas = canvasRef.value
  ctx = canvas.getContext('2d')
  dpr = window.devicePixelRatio || 1

  entityRegistry = createDefaultEntityRegistry()

  canvas.addEventListener('mousedown', onMouseDown)
  canvas.addEventListener('mousemove', onMouseMove)
  canvas.addEventListener('mouseup', onMouseUp)
  canvas.addEventListener('mouseleave', onMouseLeave)
  canvas.addEventListener('wheel', onWheel, { passive: false })

  window.addEventListener('resize', handleResize)

  updateCursor()

  // React to tool changes
  watch(() => state.currentTool, updateCursor)

  // Defer initial draw to next frame so container has final size
  requestAnimationFrame(() => {
    handleResize()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (rafId) cancelAnimationFrame(rafId)
})

defineExpose({ fitToContent, gameLoop, draw, updateCursor })
</script>

<style scoped>
.sim-canvas {
  background-color: #1a1a2e;
  cursor: default;
}
</style>
