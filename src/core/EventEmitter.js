/**
 * 事件发射器 - 模块通信基础
 * 实现发布-订阅模式，支持模块间松耦合通信
 */
export class EventEmitter {
  constructor() {
    this._events = new Map();
  }

  /**
   * 订阅事件
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   * @returns {Function} 取消订阅函数
   */
  on(event, callback) {
    if (!this._events.has(event)) {
      this._events.set(event, new Set());
    }
    this._events.get(event).add(callback);

    // 返回取消订阅函数
    return () => this.off(event, callback);
  }

  /**
   * 订阅一次性事件
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  once(event, callback) {
    const wrapper = (data) => {
      this.off(event, wrapper);
      callback(data);
    };
    this.on(event, wrapper);
  }

  /**
   * 取消订阅
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    const callbacks = this._events.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * 发射事件
   * @param {string} event - 事件名称
   * @param {*} data - 事件数据
   */
  emit(event, data) {
    const callbacks = this._events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          console.error(`EventEmitter: Error in "${event}" handler:`, err);
        }
      });
    }
  }

  /**
   * 清除所有事件监听
   */
  clearAll() {
    this._events.clear();
  }
}