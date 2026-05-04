import { GRID_W, GRID_H, CELL_SIZE } from '../core/constants.js';
import { Conveyor } from '../entities/Conveyor.js';
import { Receiver } from '../entities/Receiver.js';
import { Box } from '../entities/Box.js';

/**
 * 画布交互模块
 * 处理鼠标事件和建造逻辑
 */
export class CanvasInteraction {
  constructor(canvas, state, renderer) {
    this.canvas = canvas;
    this.state = state;
    this.renderer = renderer;
    this.isMouseDown = false;
    this.isPanning = false;
    this.isSelectPanning = false;
    this.isSpacePanning = false;
    this._lastPanPos = { x: 0, y: 0 };

    this._bindEvents();
    this._updateCursor();
    this.state.on('tool:select', () => this._updateCursor());
    this.state.on('space:down', () => this._updateCursor());
    this.state.on('space:up', () => this._updateCursor());
  }

  _bindEvents() {
    this.canvas.addEventListener('mousedown', (e) => this._onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this._onMouseUp(e));
    this.canvas.addEventListener('mouseleave', () => this._onMouseLeave());
    this.canvas.addEventListener('contextmenu', (e) => this._onContextMenu(e));
    this.canvas.addEventListener('wheel', (e) => this._onWheel(e), { passive: false });
  }

  _getCanvasCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  _getGridPos(e) {
    const { x, y } = this._getCanvasCoords(e);
    const world = this.renderer.screenToWorld(x, y);
    return {
      x: Math.floor(world.x / CELL_SIZE),
      y: Math.floor(world.y / CELL_SIZE)
    };
  }

  _onMouseDown(e) {
    // 中键平移
    if (e.button === 1) {
      e.preventDefault();
      this.isPanning = true;
      this._lastPanPos = this._getCanvasCoords(e);
      return;
    }

    // 选择模式下左键拖拽平移
    if (e.button === 0 && this.state.currentTool === 'select') {
      this.isSelectPanning = true;
      this._lastPanPos = this._getCanvasCoords(e);
      return;
    }

    // 空格 + 左键拖拽平移（任意模式）
    if (e.button === 0 && this.state.spaceHeld) {
      this.isSpacePanning = true;
      this.state._spaceDragged = false;
      this._lastPanPos = this._getCanvasCoords(e);
      this.canvas.style.cursor = 'grabbing';
      return;
    }

    this.isMouseDown = true;
    const { x, y } = this._getGridPos(e);
    this._handleInteract(x, y);
  }

  _onMouseMove(e) {
    const { x, y } = this._getCanvasCoords(e);

    // 平移（中键 / 选择模式左键拖拽 / 空格+左键拖拽）
    if (this.isPanning || this.isSelectPanning || this.isSpacePanning) {
      const dx = x - this._lastPanPos.x;
      const dy = y - this._lastPanPos.y;
      this._lastPanPos = { x, y };
      if (dx !== 0 || dy !== 0) {
        this.renderer.panBy(dx, dy);
        this.renderer.draw();
        if (this.isSpacePanning) this.state._spaceDragged = true;
      }
      return;
    }

    const world = this.renderer.screenToWorld(x, y);
    const gx = Math.floor(world.x / CELL_SIZE);
    const gy = Math.floor(world.y / CELL_SIZE);
    const changed = gx !== this.state.hoverX || gy !== this.state.hoverY;
    this.state.hoverX = gx;
    this.state.hoverY = gy;

    if (this.isMouseDown) {
      this._handleInteract(gx, gy);
    } else if (!this.state.isRunning && changed) {
      this.renderer.draw();
    }
  }

  _onMouseUp(e) {
    if (e.button === 1) {
      this.isPanning = false;
      return;
    }
    if (this.isSelectPanning) {
      this.isSelectPanning = false;
      return;
    }
    if (this.isSpacePanning) {
      this.isSpacePanning = false;
      this._updateCursor();
      return;
    }
    this.isMouseDown = false;
  }

  _onMouseLeave() {
    this.isMouseDown = false;
    this.isPanning = false;
    this.isSelectPanning = false;
    this.isSpacePanning = false;
    this.state.hoverX = -1;
    this.state.hoverY = -1;
    if (!this.state.isRunning) {
      this.renderer.draw();
    }
  }

  _onWheel(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const factor = 1 + Math.abs(e.deltaY) * 0.002;
    this.renderer.zoomAt(sx, sy, e.deltaY > 0 ? 1 / factor : factor);
    this.renderer.draw();
  }

  _updateCursor() {
    if (this.state.spaceHeld) {
      this.canvas.style.cursor = 'grab';
    } else if (this.state.currentTool === 'select') {
      this.canvas.style.cursor = 'default';
    } else {
      this.canvas.style.cursor = 'crosshair';
    }
  }

  _onContextMenu(e) {
    e.preventDefault();
    // TODO: 实现右键菜单
  }

  _handleInteract(gx, gy) {
    if (gx < 0 || gx >= GRID_W || gy < 0 || gy >= GRID_H) return;

    const tool = this.state.currentTool;

    if (tool === 'select') return;

    if (tool.startsWith('conveyor-')) {
      this._placeConveyor(gx, gy, tool);
    } else if (tool === 'eraser') {
      this._erase(gx, gy);
    } else if (tool === 'box') {
      this._placeBox(gx, gy);
    } else if (tool === 'spawner') {
      this._placeSpawner(gx, gy);
    } else if (tool === 'receiver') {
      this._placeReceiver(gx, gy);
    } else if (tool === 'diverter') {
      this._placeDiverter(gx, gy);
    }

    if (!this.state.isRunning) {
      this.renderer.draw();
    }
  }

  _placeConveyor(gx, gy, tool) {
    this.state.pushUndo();
    const dir = parseInt(tool.split('-')[1]);

    for (let i = 0; i < this.state.buildLength; i++) {
      let targetX = gx;
      let targetY = gy;

      if (dir === 1) targetX += i;
      else if (dir === 2) targetY += i;
      else if (dir === 3) targetX -= i;
      else if (dir === 4) targetY -= i;

      if (targetX >= 0 && targetX < GRID_W && targetY >= 0 && targetY < GRID_H) {
        this.state.setCell(targetX, targetY, Conveyor.create({
          dir,
          speed: this.state.buildSpeed,
          transferTime: this.state.buildTransferTime
        }));
      }
    }
  }

  _erase(gx, gy) {
    this.state.pushUndo();

    // 先尝试删除货物
    let removed = false;
    for (let i = this.state.boxes.length - 1; i >= 0; i--) {
      const b = this.state.boxes[i];
      const renderX = Math.round(b.x + (b.nextX - b.x) * b.progress);
      const renderY = Math.round(b.y + (b.nextY - b.y) * b.progress);
      if (renderX === gx && renderY === gy) {
        this.state.boxes.splice(i, 1);
        removed = true;
        break;
      }
    }

    // 再尝试删除发货机
    if (!removed) {
      for (let i = this.state.spawners.length - 1; i >= 0; i--) {
        if (this.state.spawners[i].x === gx && this.state.spawners[i].y === gy) {
          this.state.spawners.splice(i, 1);
          removed = true;
          break;
        }
      }
    }

    // 最后删除网格内容
    if (!removed) {
      this.state.setCell(gx, gy, 0);
    }
  }

  _placeBox(gx, gy) {
    const cell = this.state.getCell(gx, gy);
    const hasBox = this.state.boxes.some(b =>
      (b.x === gx && b.y === gy) ||
      (b.nextX === gx && b.nextY === gy)
    );

    if (!hasBox && Conveyor.isType(cell)) {
      this.state.addBox(Box.create({ x: gx, y: gy, lastDir: cell.dir }));
    }
  }

  _placeSpawner(gx, gy) {
    const cell = this.state.getCell(gx, gy);
    const hasSpawner = this.state.spawners.some(s => s.x === gx && s.y === gy);

    if (!hasSpawner && Conveyor.isType(cell)) {
      this.state.pushUndo();
      this.state.addSpawner({
        x: gx,
        y: gy,
        timer: 0,
        interval: this.state.buildInterval * 1000
      });
    }
  }

  _placeReceiver(gx, gy) {
    const cell = this.state.getCell(gx, gy);
    if (!Receiver.isType(cell)) {
      this.state.pushUndo();
      this.state.setCell(gx, gy, Receiver.create());
      this.state.spawners = this.state.spawners.filter(s => !(s.x === gx && s.y === gy));
    }
  }

  _placeDiverter(gx, gy) {
    this.state.pushUndo();
    const dir1 = this.state.lastConveyorDir;
    const dir2 = (dir1 % 4) + 1;

    this.state.setCell(gx, gy, {
      type: 'diverter',
      dir1,
      dir2,
      speed: this.state.buildSpeed,
      transferTime: this.state.buildTransferTime,
      counter: 0
    });
  }
}