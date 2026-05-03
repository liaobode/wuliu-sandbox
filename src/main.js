/**
 * 主入口文件
 * 整合所有模块，初始化应用
 */

import { State } from './core/State.js';
import { CanvasRenderer } from './renderer/CanvasRenderer.js';
import { CanvasInteraction } from './ui/CanvasInteraction.js';
import { Toolbar } from './ui/Toolbar.js';
import { KeyboardShortcuts } from './ui/KeyboardShortcuts.js';
import { Storage, PresetsManager } from './data/index.js';
import { DefaultPhysics } from './engine/index.js';

class WarehouseSandbox {
  constructor() {
    // 初始化状态
    this.state = new State();

    // 获取 DOM 元素
    this.canvas = document.getElementById('sim-canvas');

    // 初始化渲染器
    this.renderer = new CanvasRenderer(this.canvas, this.state);

    // 初始化交互
    this.canvasInteraction = new CanvasInteraction(this.canvas, this.state, this.renderer);
    this.toolbar = new Toolbar(this.state);
    this.keyboard = new KeyboardShortcuts(this.state, this.toolbar);

    // 初始化存储
    this.storage = new Storage(this.state);
    this.presets = new PresetsManager(this.state);

    // 初始化物理引擎
    this.physics = new DefaultPhysics();

    // 仿真循环状态
    this.lastTime = 0;
    this.animationFrameId = null;

    // 绑定 UI 事件
    this._bindUIEvents();

    // 自动加载上次保存的布局
    if (this.storage.load()) {
      console.log('已自动恢复上次布局');
    }

    // 初始化画布大小
    this.renderer.resize();
    window.addEventListener('resize', () => this.renderer.resize());

    // 初始绘制
    this.renderer.draw();
  }

  _bindUIEvents() {
    // 播放/暂停按钮
    const btnPlay = document.getElementById('btn-play');
    const btnStop = document.getElementById('btn-stop');

    btnPlay.addEventListener('click', () => this._togglePlay(btnPlay, btnStop));
    btnStop.addEventListener('click', () => this._stop(btnPlay, btnStop));

    // 清理按钮
    document.getElementById('btn-clear-items').addEventListener('click', () => {
      this.state.clearBoxes();
      this._hideStatsModal();
      this.renderer.draw();
    });

    document.getElementById('btn-clear-conveyors').addEventListener('click', () => {
      this.state.clearGrid();
      this.renderer.draw();
    });

    document.getElementById('btn-clear-all').addEventListener('click', () => {
      this.state.reset();
      this._hideStatsModal();
      this.renderer.draw();
    });

    // 保存/加载按钮
    const btnSave = document.getElementById('btn-save');
    const btnLoad = document.getElementById('btn-load');

    btnSave.addEventListener('click', () => {
      if (this.storage.save()) {
        btnSave.textContent = '✅ 已保存';
        setTimeout(() => btnSave.innerHTML = '💾 保存', 1500);
      }
    });

    btnLoad.addEventListener('click', () => {
      if (this.storage.load()) {
        btnLoad.textContent = '✅ 已加载';
        this.renderer.draw();
      } else {
        btnLoad.textContent = '❌ 无存档';
      }
      setTimeout(() => btnLoad.innerHTML = '📂 加载', 1500);
    });

    // 导出/导入按钮
    const btnExport = document.getElementById('btn-export');
    const btnImport = document.getElementById('btn-import');
    const importFile = document.getElementById('import-file');

    btnExport.addEventListener('click', () => {
      this.storage.exportToFile();
      btnExport.textContent = '✅ 已导出';
      setTimeout(() => btnExport.innerHTML = '📤 导出', 1500);
    });

    btnImport.addEventListener('click', () => importFile.click());

    importFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        await this.storage.importFromFile(file);
        btnImport.textContent = '✅ 已导入';
        this.renderer.draw();
      } catch (err) {
        btnImport.textContent = '❌ ' + (err.message || '导入失败');
      }
      setTimeout(() => btnImport.innerHTML = '📥 导入', 1500);
      importFile.value = '';
    });

    // 热力图开关
    const btnHeatmap = document.getElementById('btn-heatmap');
    btnHeatmap.addEventListener('click', () => {
      this.state.showHeatMap = !this.state.showHeatMap;
      btnHeatmap.innerHTML = this.state.showHeatMap
        ? '🗺️ 热力图: <span class="text-green-600 font-bold">开</span>'
        : '🗺️ 热力图: 关';
      btnHeatmap.classList.toggle('bg-orange-50', this.state.showHeatMap);
      btnHeatmap.classList.toggle('border-orange-300', this.state.showHeatMap);
      this.renderer.draw();
    });

    // 预设模板选择
    const presetSelect = document.getElementById('preset-select');
    presetSelect.addEventListener('change', (e) => {
      const key = e.target.value;
      if (key && this.presets.apply(key)) {
        this.renderer.draw();
      }
      presetSelect.value = '';
    });

    // 统计面板关闭按钮
    const statsBackdrop = document.getElementById('stats-backdrop');
    const statsClose = document.getElementById('stats-close');
    const statsOk = document.getElementById('stats-ok');

    if (statsBackdrop) statsBackdrop.addEventListener('click', () => this._hideStatsModal());
    if (statsClose) statsClose.addEventListener('click', () => this._hideStatsModal());
    if (statsOk) statsOk.addEventListener('click', () => this._hideStatsModal());

    // 快捷键事件
    this.state.on('ui:toggle-play', () => btnPlay.click());
    this.state.on('ui:save', () => btnSave.click());
  }

  _showStatsModal() {
    const modal = document.getElementById('stats-modal');
    if (modal) modal.classList.remove('hidden');
  }

  _hideStatsModal() {
    const modal = document.getElementById('stats-modal');
    if (modal) modal.classList.add('hidden');
  }

  _togglePlay(btnPlay, btnStop) {
    if (this.state.isRunning) {
      // 暂停
      this.state.pauseSimulation();
      btnPlay.innerHTML = '▶️ 继续运行';
      btnPlay.className = 'flex items-center justify-center gap-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-bold shadow-md transition-colors text-sm';
      cancelAnimationFrame(this.animationFrameId);
    } else {
      // 开始新仿真时隐藏统计面板
      this._hideStatsModal();
      this.state.activeTimeMs = 0;
      this.state.deliveredCount = 0;
      this.state.heatData = Array.from({ length: 12 }, () => Array(16).fill(0));

      this.state.startSimulation();
      btnPlay.innerHTML = '⏸️ 暂停运行';
      btnPlay.className = 'flex items-center justify-center gap-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-bold shadow-md transition-colors text-sm';
      btnStop.classList.remove('hidden');

      this.lastTime = performance.now();
      this._gameLoop(this.lastTime);
    }
  }

  _stop(btnPlay, btnStop) {
    if (!this.state.isRunning && this.state.activeTimeMs === 0) return;

    this.state.stopSimulation();
    btnPlay.innerHTML = '▶️ 重新运行';
    btnPlay.className = 'flex items-center justify-center gap-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-bold shadow-md transition-colors text-sm';
    cancelAnimationFrame(this.animationFrameId);
    btnStop.classList.add('hidden');

    // 显示统计
    const timeSec = (this.state.activeTimeMs / 1000).toFixed(1);
    const rate = timeSec > 0 ? (this.state.deliveredCount / (this.state.activeTimeMs / 1000)).toFixed(2) : "0.00";

    document.getElementById('stat-time').innerText = timeSec;
    document.getElementById('stat-count').innerText = this.state.deliveredCount;
    document.getElementById('stat-rate').innerText = rate;

    // 收货站统计
    let receiverHTML = '';
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 16; x++) {
        const cell = this.state.grid[y][x];
        if (cell && cell.type === 'receiver' && (cell.collected || 0) > 0) {
          receiverHTML += `<p>📥 收货站(${x},${y}): <span class="font-bold">${cell.collected}</span> 个</p>`;
        }
      }
    }
    document.getElementById('stat-receivers').innerHTML = receiverHTML || '<p class="text-gray-400">无收货站数据</p>';

    // 显示浮动统计面板
    this._showStatsModal();
  }

  _gameLoop(timestamp) {
    if (!this.state.isRunning) return;

    const dt = timestamp - this.lastTime;
    this.lastTime = timestamp;

    const simDt = dt * this.state.speed;
    this.state.activeTimeMs += simDt;
    this.state.simTime += simDt;

    // 更新物理
    this.physics.update(this.state, dt);

    // 渲染
    this.renderer.draw();
    this.renderer.drawHUD();

    this.animationFrameId = requestAnimationFrame((t) => this._gameLoop(t));
  }
}

// 启动应用
window.addEventListener('DOMContentLoaded', () => {
  window.app = new WarehouseSandbox();
});