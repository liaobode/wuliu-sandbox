# 项目 Handoff 文档

## 项目概述

**项目名称：** 2D 输送机仿真沙盒  
**位置：** `/Users/heruibang/Downloads/liaobode-agent/warehouse-sandbox/`  
**技术栈：** 纯 JavaScript + Tailwind CSS (CDN) + Canvas 2D + Rollup

## 项目结构

```
warehouse-sandbox/
├── index.html              # 主 HTML 文件
├── package.json            # 项目配置
├── rollup.config.js        # Rollup 配置
├── dist/
│   └── bundle.js           # 打包后的 JS
└── src/
    ├── main.js             # 入口文件，整合所有模块
    ├── core/
    │   ├── EventEmitter.js # 事件发射器（发布-订阅）
    │   ├── State.js        # 状态管理
    │   └── constants.js    # 常量定义
    ├── engine/
    │   ├── PhysicsEngine.js    # 物理引擎基类
    │   ├── DefaultPhysics.js   # 默认物理实现
    │   └── index.js
    ├── entities/
    │   ├── Entity.js       # 实体基类
    │   ├── Conveyor.js     # 输送带
    │   ├── Diverter.js     # 分流器
    │   ├── Receiver.js     # 收货站
    │   ├── Spawner.js      # 发货机（渲染）
    │   ├── Box.js          # 货物
    │   └── index.js
    ├── renderer/
    │   └── CanvasRenderer.js   # Canvas 渲染器
    ├── ui/
    │   ├── Toolbar.js          # 工具栏逻辑
    │   ├── CanvasInteraction.js # 画布交互
    │   └── KeyboardShortcuts.js # 快捷键
    └── data/
        ├── Storage.js      # 本地存储
        └── Presets.js      # 预设模板
```

## 最近完成的工作

### 1. UI 布局重构
将原来的左侧边栏改为 **顶部工具栏 + 左侧属性面板** 布局：
- 顶部第一行：标题 + 仿真控制（播放/停止/速度）
- 顶部第二行：建设工具按钮 + 预设模板
- 左侧面板：建造设置、数据管理、显示选项

### 2. 快捷键帮助面板
- 按 `?` 键或点击顶部 `?` 按钮显示
- 居中浮动模态面板，分组显示快捷键
- 按 ESC 或点击遮罩关闭

### 3. 仿真数据报告浮动面板
- 仿真结束后弹出浮动面板
- 显示运行时间、完成数量、吞吐率、收货站统计
- 点击确定/遮罩/ESC 关闭

### 4. 分流器修复
- 修复了 counter 递增时机问题（货物离开时才递增）
- 修复了分流预设模板中输送带覆盖分流器的问题

## 关键文件说明

### index.html
- 包含完整的 UI 结构
- 快捷键帮助面板 `#help-modal`
- 仿真报告面板 `#stats-modal`
- 所有按钮和输入框都有 ID，JS 通过 ID 获取

### src/main.js
- `WarehouseSandbox` 类是应用入口
- `_bindUIEvents()` 绑定所有 UI 事件
- `_showStatsModal()` / `_hideStatsModal()` 控制统计面板
- `_togglePlay()` / `_stop()` 控制仿真

### src/ui/KeyboardShortcuts.js
- 处理所有键盘快捷键
- `_toggleHelp()` / `_closeHelp()` 控制帮助面板
- `_closeStats()` 关闭统计面板

### src/engine/DefaultPhysics.js
- `_updateSpawners()` 发货机生成货物
- `_updateBoxes()` 货物移动和碰撞检测
- 分流器逻辑：货物进入时记录 `diverterCell`，离开时递增 `counter`

## 运行命令

```bash
# 安装依赖
npm install

# 构建
npm run build

# 本地服务器（需要另外启动）
python3 -m http.server 3000
# 或
npx serve -l 3000
```

## 待办/可改进项

1. **响应式布局** - 当前布局在小屏幕上可能有问题
2. **分流器功能扩展** - 目前只支持 1:1 交替，可考虑自定义比例
3. **更多预设模板** - 可添加更复杂的布局模板
4. **撤销/重做** - 目前只有撤销，没有重做
5. **粒子效果** - 原版有粒子效果，模块化版本未迁移

## 用户偏好

- 使用中文沟通
- 代码注释使用中文
- 变量和函数命名使用英文
- 执行重要操作前先确认
