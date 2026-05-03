/**
 * 物理引擎基类
 */
export class PhysicsEngine {
  /**
   * 更新物理状态
   * @param {State} state - 游戏状态
   * @param {number} dt - 时间增量（毫秒）
   */
  update(state, dt) {
    throw new Error('PhysicsEngine.update() must be implemented');
  }
}