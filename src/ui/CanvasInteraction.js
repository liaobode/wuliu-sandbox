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

    this._bindEvents();
  }

  _bindEvents() {
    this.canvas.addEventListener('mousedown', (e) => this._onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this._onMouseUp());
    this.canvas.addEventListener('mouseleave', () => this._onMouseLeave());
    this.canvas.addEventListener('contextmenu', (e) => this._onContextMenu(e));
  }

  _getGridPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = Math.floor(((e.clientX - rect.left) * scaleX) / CELL_SIZE);
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / CELL_SIZE);
    return { x, y };
  }

  _onMouseDown(e) {
    this.isMouseDown = true;
    const { x, y } = this._getGridPos(e);
    this._handleInteract(x, y);
  }

  _onMouseMove(e) {
    const { x, y } = this._getGridPos(e);
    const changed = x !== this.state.hoverX || y !== this.state.hoverY;
    this.state.hoverX = x;
    this.state.hoverY = y;

    if (this.isMouseDown) {
      this._handleInteract(x, y);
    } else if (!this.state.isRunning && changed) {
      this.renderer.draw();
    }
  }

  _onMouseUp() {
    this.isMouseDown = false;
  }

  _onMouseLeave() {
    this.isMouseDown = false;
    this.state.hoverX = -1;
    this.state.hoverY = -1;
    if (!this.state.isRunning) {
      this.renderer.draw();
    }
  }

  _onContextMenu(e) {
    e.preventDefault();
    // TODO: 实现右键菜单
  }

  _handleInteract(gx, gy) {
    if (gx < 0 || gx >= GRID_W || gy < 0 || gy >= GRID_H) return;

    const tool = this.state.currentTool;

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