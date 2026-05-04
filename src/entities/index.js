// 实体模块导出
export { Entity, EntityRegistry } from './Entity.js';
export { Conveyor } from './Conveyor.js';
export { Diverter } from './Diverter.js';
export { Receiver } from './Receiver.js';
export { Spawner } from './Spawner.js';
export { Box } from './Box.js';
export { Pallet } from './Pallet.js';

// 默认注册所有实体
import { EntityRegistry } from './Entity.js';
import { Conveyor } from './Conveyor.js';
import { ChainConveyor } from './ChainConveyor.js';
import { ChainTransfer } from './ChainTransfer.js';
import { Diverter } from './Diverter.js';
import { Receiver } from './Receiver.js';
import { Spawner } from './Spawner.js';

export function createDefaultEntityRegistry() {
  const registry = new EntityRegistry();
  registry.register(Conveyor);
  registry.register(ChainConveyor);
  registry.register(ChainTransfer);
  registry.register(Diverter);
  registry.register(Receiver);
  registry.register(Spawner);
  return registry;
}