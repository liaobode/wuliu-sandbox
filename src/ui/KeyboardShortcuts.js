/**
 * 键盘快捷键模块
 */
export class KeyboardShortcuts {
  constructor(state, toolbar) {
    this.state = state;
    this.toolbar = toolbar;
    this._bindEvents();
  }

  _bindEvents() {
    document.addEventListener('keydown', (e) => this._onKeyDown(e));
    document.addEventListener('keyup', (e) => this._onKeyUp(e));

    // 帮助面板关闭按钮
    const helpBackdrop = document.getElementById('help-backdrop');
    if (helpBackdrop) {
      helpBackdrop.addEventListener('click', () => this._closeHelp());
    }

    // 顶部帮助按钮
    const btnHelp = document.getElementById('btn-help');
    if (btnHelp) {
      btnHelp.addEventListener('click', () => this._toggleHelp());
    }
  }

  _toggleHelp() {
    const modal = document.getElementById('help-modal');
    if (modal) {
      modal.classList.toggle('hidden');
    }
  }

  _closeHelp() {
    const modal = document.getElementById('help-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  _onKeyDown(e) {
    // 忽略输入框内的按键
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // 撤销
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
      e.preventDefault();
      this.state.undo();
      return;
    }

    // ESC 关闭面板并回到观察模式
    if (e.key === 'Escape') {
      this._closeHelp();
      this._closeStats();
      this._selectTool('select');
      return;
    }

    // ? 显示帮助面板
    if (e.key === '?') {
      this._toggleHelp();
      return;
    }

    switch (e.key) {
      case '1':
        this._selectTool('conveyor-1');
        break;
      case '2':
        this._selectTool('conveyor-2');
        break;
      case '3':
        this._selectTool('conveyor-3');
        break;
      case '4':
        this._selectTool('conveyor-4');
        break;
      case 'e':
      case 'E':
        this._selectTool('eraser');
        break;
      case 'b':
      case 'B':
        this._selectTool('box');
        break;
      case 'f':
      case 'F':
        this._selectTool('spawner');
        break;
      case 'r':
      case 'R':
        this._selectTool('receiver');
        break;
      case 'd':
      case 'D':
        this._selectTool('diverter');
        break;
      case ' ':
        if (!this.state.spaceHeld) {
          e.preventDefault();
          this.state.spaceHeld = true;
          this.state._spaceDragged = false;
          this.state.emit('space:down');
        }
        break;
      case 's':
      case 'S':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          this.state.emit('ui:save');
        }
        break;
    }
  }

  _onKeyUp(e) {
    if (e.key === ' ') {
      if (!this.state._spaceDragged) {
        this.state.emit('ui:toggle-play');
      }
      this.state.spaceHeld = false;
      this.state.emit('space:up');
    }
  }

  _closeStats() {
    const modal = document.getElementById('stats-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  _selectTool(tool) {
    this.state.selectTool(tool);
    this.toolbar.selectTool(tool);
  }
}