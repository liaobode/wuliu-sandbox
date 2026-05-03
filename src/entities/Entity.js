/**
 * 实体基类
 * 所有设施（输送带、分流器、发货机、收货站）的基类
 * 支持插件化注册
 */
export class Entity {
  static type = 'entity';

  /**
   * 注册实体到引擎
   * @param {Object} engine - 引擎实例
   */
  static register(engine) {
    engine.entityRegistry.set(this.type, this);
  }

  /**
   * 检查单元格是否为此类型
   * @param {*} cell - 网格单元格
   * @returns {boolean}
   */
  static isType(cell) {
    return cell !== null && typeof cell === 'object' && cell.type === this.type;
  }

  /**
   * 创建实体数据
   * @param {Object} options - 配置选项
   * @returns {Object} 实体数据对象
   */
  static create(options = {}) {
    return {
      type: this.type,
      ...options
    };
  }

  /**
   * 渲染实体
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   * @param {number} x - 网格 x 坐标
   * @param {number} y - 网格 y 坐标
   * @param {Object} cell - 单元格数据
   * @param {Object} options - 额外选项
   */
  static render(ctx, x, y, cell, options = {}) {
    throw new Error('Entity.render() must be implemented by subclass');
  }
}

/**
 * 实体注册表
 * 管理所有已注册的实体类型
 */
export class EntityRegistry {
  constructor() {
    this.entities = new Map();
  }

  /**
   * 注册实体
   * @param {typeof Entity} EntityClass - 实体类
   */
  register(EntityClass) {
    this.entities.set(EntityClass.type, EntityClass);
  }

  /**
   * 获取实体类
   * @param {string} type - 实体类型
   * @returns {typeof Entity|undefined}
   */
  get(type) {
    return this.entities.get(type);
  }

  /**
   * 检查单元格是否为已注册的实体
   * @param {*} cell - 网格单元格
   * @returns {typeof Entity|null}
   */
  getEntityForCell(cell) {
    if (cell === null || cell === 0) return null;

    // 检查是否是输送带（没有 type 属性但有 dir）
    if (cell.dir !== undefined && !cell.type) {
      return this.entities.get('conveyor');
    }

    if (cell.type) {
      return this.entities.get(cell.type);
    }

    return null;
  }

  /**
   * 渲染单元格
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x
   * @param {number} y
   * @param {*} cell
   * @param {Object} options
   */
  renderCell(ctx, x, y, cell, options = {}) {
    const EntityClass = this.getEntityForCell(cell);
    if (EntityClass) {
      EntityClass.render(ctx, x, y, cell, options);
    }
  }
}