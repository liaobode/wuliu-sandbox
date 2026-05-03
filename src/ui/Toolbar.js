/**
 * 工具栏模块
 * 处理工具选择和建造参数
 */
export class Toolbar {
  constructor(state) {
    this.state = state;
    this.toolBtns = document.querySelectorAll('.tool-btn');
    this._bindEvents();
  }

  _bindEvents() {
    // 工具按钮
    this.toolBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.toolBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.state.selectTool(btn.dataset.tool);
      });
    });

    // 建造参数
    this._bindSlider('build-length', 'buildLength', 'build-length-val', v => parseInt(v));
    this._bindSlider('build-speed', 'buildSpeed', 'build-speed-input', v => parseFloat(v));
    this._bindSlider('build-interval', 'buildInterval', 'build-interval-input', v => parseFloat(v), true);
    this._bindSlider('build-transfer', 'buildTransferTime', 'build-transfer-input', v => parseFloat(v), true);

    // 全局速度
    this._bindSlider('speed-slider', 'speed', 'speed-input', v => parseFloat(v));
  }

  _bindSlider(sliderId, stateProp, inputId, parser, isFloat = false) {
    const slider = document.getElementById(sliderId);
    const input = document.getElementById(inputId);
    const display = document.getElementById(inputId.replace('-input', '-val'));

    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = parser(e.target.value);
        this.state[stateProp] = val;
        if (input) input.value = isFloat ? val.toFixed(1) : val;
        if (display) display.innerText = val;
      });
    }

    if (input) {
      input.addEventListener('change', (e) => {
        let val = parser(e.target.value);
        if (isNaN(val) || val <= 0) val = 0.1;
        this.state[stateProp] = val;
        input.value = isFloat ? val.toFixed(1) : val;
        if (slider && val <= parseFloat(slider.max) && val >= parseFloat(slider.min)) {
          slider.value = val;
        }
      });
    }
  }

  /**
   * 更新工具按钮状态
   */
  selectTool(toolName) {
    this.toolBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.tool === toolName);
    });
  }
}