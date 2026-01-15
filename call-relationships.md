# Canvas Editor 调用关系说明

## 顶层运行链路
- 页面入口 [src/main.ts](src/main.ts) 在 `window.onload` 内创建 `Editor` 实例，注入初始页眉/正文/页脚数据与配置，并将实例暴露到 `window.editor` 以便 Cypress 与控制台使用。
- 工具栏、菜单等 DOM 事件均在 [src/main.ts](src/main.ts) 绑定，事件触发后直接调用 `instance.command.execute*` 系列方法完成格式、插入、模式切换等操作。
- 主要可视组件（弹窗、签名板等）在入口文件中按需初始化，并通过回调调用 `Command`，避免直接操作内部渲染状态。

## 核心类与协作
```
main.ts UI 事件
    ↓ 调用
Command (proxy) ——> CommandAdapt ——> Draw (核心渲染/状态)
                                     ↓
                     Cursor / Range / History / Position / Control / Table* / Search 等子模块
                                     ↓
                    EventBus + Listener + Override 提供订阅、监听、覆写扩展点
    ↓
ContextMenu / Shortcut (均持有 Draw 与 Command，负责交互触发 Command)
    ↓
Register (集中注册上下文菜单、快捷键、i18n)
    ↓
Plugin.use (插件接口，外部挂载扩展能力)
```
- `Editor` 构造器位于 [src/editor/index.ts](src/editor/index.ts)，负责
  - 合并用户配置 (`mergeOption`)、深拷贝初始数据，格式化元素列表
  - 创建 `Listener`、`EventBus`、`Override`
  - 启动 `Draw`（核心渲染 & 交互承载）、`Command`（统一调用入口）、`ContextMenu` 与 `Shortcut`
  - 注册销毁函数 `destroy` 统一回收事件监听与总线
  - 暴露 `use` 方法用于插件注册
- `Command` 在 [src/editor/core/command/Command.ts](src/editor/core/command/Command.ts) 仅做方法代理，实际逻辑由 `CommandAdapt` 承担，保证外部无法直接持有 `Draw` 实例。
- `CommandAdapt` 位于 [src/editor/core/command/CommandAdapt.ts](src/editor/core/command/CommandAdapt.ts)，持有 `Draw` 及其核心子模块（`RangeManager`、`Position`、`HistoryManager`、`CanvasEvent`、`Control`、`WorkerManager`、`Search` 等），实现所有编辑指令（格式、表格、图片、区域、打印、范围获取等）。
- `Draw` 位于 [src/editor/core/draw/Draw.ts](src/editor/core/draw/Draw.ts)，负责容器包装、画布/页创建、渲染调度、懒渲染、模式切换、打印模式、历史与范围管理、各类粒子组件（文本/图片/表格/公式/水印/控件等）、观察者（滚动、选择、图像、鼠标）和交互组件（分组、区域、搜索、画笔等）。

## 典型调用链示例
- “加粗”按钮：`main.ts` DOM 事件 → `Command.executeBold()` → `CommandAdapt.bold()` → 基于 `Draw` 当前范围与样式写入，提交历史并重渲。
- “撤销/重做”：UI 事件 → `executeUndo/executeRedo` → `CommandAdapt.undo/redo` → `HistoryManager`（在 `Draw` 内）回滚元素列表并触发重新绘制。
- “插入表格”：UI 选择行列 → `executeInsertTable` → `CommandAdapt.insertTable` → 通过 `TableOperate`/`TableParticle` 更新元素列表 → `Draw.render` 刷新画布。
- “打印模式”：UI 触发 `executePrint/executePageMode/executePaperDirection` 等 → `CommandAdapt` 调整 `Draw` 模式与纸张参数 → `Draw.setPrintData()` 生成打印态数据并重渲。

## 渲染与状态流转（Draw 内部要点）
- 初始化时包装容器、创建页容器与首个画布，随后实例化光标、范围、位置、历史、背景、页眉页脚、水印、粒子/控件、观察者，并注册全局/画布事件，最后执行首帧 `render`。
- 渲染流程由 `Draw.render` 统筹：计算行列表 → 分页 → 逐页绘制文本/表格/图片/装饰 → 同步光标与选择区 → 触发懒渲染与观察者。
- 交互事件通过 `CanvasEvent`（鼠标键盘）、`GlobalEvent`（全局快捷键、粘贴等）进入，转发给 `RangeManager`、`HistoryManager`、`Control`、`TableOperate` 等子模块；结果统一反映到元素列表并触发重绘。
- 数据获取类命令（如 `getValue`、`getHTML`、`getText`、`getRangeContext`）均由 `CommandAdapt` 调 `Draw` 的查询接口，保持渲染数据与对外 API 一致。

## 扩展点
- `EventBus`/`Listener`：提供内部事件订阅与外部监听能力，便于埋点与自定义行为。
- `Override`：允许对内置行为做安全覆写，常用于替换默认组件或处理策略。
- `Plugin.use`：在 `Editor` 实例上注册插件，插件可通过持有的 `Editor` 与 `Command` 执行自定义扩展（如自定义菜单、快捷键、渲染标记等）。

## 生成说明
- 本文档基于对入口与核心模块源码的静态阅读整理，路径均以仓库根为基准，未包含运行时动态生成的边缘调用。
