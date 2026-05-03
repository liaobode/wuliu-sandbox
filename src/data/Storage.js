import { SAVE_KEY } from '../core/constants.js';

/**
 * 数据持久化模块
 */
export class Storage {
  constructor(state) {
    this.state = state;
  }

  /**
   * 保存布局到 localStorage
   */
  save() {
    try {
      const data = {
        grid: this.state.grid,
        spawners: this.state.spawners,
        version: 2
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('保存失败:', e);
      return false;
    }
  }

  /**
   * 从 localStorage 加载布局
   */
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      this.state.importData(data);
      return true;
    } catch (e) {
      console.warn('加载失败:', e);
      return false;
    }
  }

  /**
   * 导出为 JSON 文件
   */
  exportToFile() {
    const data = this.state.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logistics-layout-${Date.now()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /**
   * 从 JSON 文件导入
   */
  importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (data.grid) {
            this.state.pushUndo();
            this.state.importData(data);
            resolve(true);
          } else {
            reject(new Error('格式错误'));
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('读取失败'));
      reader.readAsText(file);
    });
  }
}