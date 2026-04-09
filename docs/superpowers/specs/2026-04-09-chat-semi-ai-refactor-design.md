# Chat 页面右侧对话区 Semi AI 重构设计

## 背景
当前 `src/pages/Chat/index.tsx` 右侧聊天区使用手写消息列表和输入框实现，状态模型为本地 `Message[]`、`inputValue`、`isTyping`。这套实现适合演示，但不利于后续接入 Semi AI 组件的默认交互、生成中状态、提示词、引用/附件扩展能力。

本次重构仅调整右侧聊天区，左侧数字人区域保持不变。

## 目标
- 使用 Semi `AIChatDialogue` 替换手写消息列表
- 使用 Semi `AIChatInput` 替换手写输入框与发送按钮
- 右侧交互体验尽量贴近 Semi 默认体验
- 将右侧聊天状态统一收敛到 Semi 的消息模型，避免长期维护两套数据结构
- 保持当前页面已有的语言上下文与数字人联动能力

## 非目标
- 不调整左侧数字人区域布局和视觉
- 不引入真实大模型接口
- 不在本次重构中接入附件、引用、技能、模板等高级能力
- 不做与本次右侧对话区无关的页面重构

## 范围
仅修改 `src/pages/Chat/index.tsx` 的右侧聊天区实现。

## 方案选择
采用“直接切到 Semi 原生数据结构”的方案：
- 右侧聊天区以 `AIChatDialogue` 的 `Message[]` 为唯一消息源
- 输入区以 `AIChatInput` 的 `onMessageSend` / `generating` 机制为核心
- 删除旧的 `inputValue`、本地 `Message` 类型和手写气泡渲染逻辑

### 选择原因
- 后续最容易平滑接入真实 AI 接口和流式响应
- 避免保留旧状态再额外做适配层，减少长期维护成本
- 与 Semi 组件设计保持一致，行为更稳定

## 组件与状态设计
页面仍保留在 `src/pages/Chat/index.tsx`，结构如下：
- 左侧：保留当前数字人区域，不改动布局和内容
- 右侧：收敛为“对话展示区 + 输入区”两块
  - `AIChatDialogue`：负责展示聊天记录
  - `AIChatInput`：负责输入、发送和生成中状态

### 状态收敛
保留：
- `digitalHuman`
- `currentLanguage`

新增/调整：
- `chats: Message[]` — 右侧唯一消息源
- `generating: boolean` — 统一表示 assistant 是否正在生成

删除：
- `inputValue`
- 旧的本地 `Message` interface
- 手写输入框和发送按钮相关逻辑
- 手写消息列表渲染逻辑

### 数字人联动
`DigitalHumanStage.isThinking` 继续保留，但改为直接绑定 `generating`，这样右侧生成状态与左侧数字人保持一致。

## 消息模型设计
使用 `AIChatDialogue` 的 `Message[]`。

每条消息至少包含：
- `id`
- `role: 'user' | 'assistant'`
- `content`
- `createdAt`
- `status`

### 内容格式
首版 `content` 仅使用字符串：
- 用户消息直接使用用户输入文本
- assistant 消息直接使用模拟回复文本

后续如果接入富内容、引用、附件或流式块内容，再将 `content` 升级为 `ContentItem[]`。

### 时间字段
统一使用时间戳写入 `createdAt`，避免同时维护 `Date` 与 number 两种格式。

## 输入与发送流程
### 发送流程
1. `AIChatInput.onMessageSend` 收到结构化输入内容
2. 从 `inputContents` 中提取当前需要展示的纯文本
3. 生成并追加一条用户消息到 `chats`
4. 将 `generating` 置为 `true`
5. 追加一条 assistant 占位消息，状态为 `in_progress`
6. 模拟回复完成后，更新该 assistant 消息内容为最终文本，并将状态改为 `completed`
7. 将 `generating` 置为 `false`

### 停止生成
- `AIChatInput.generating` 绑定 `generating`
- `AIChatInput.onStopGenerate` 负责终止当前模拟生成
- 若 assistant 占位消息尚未完成，则将该消息状态更新为 `cancelled`
- 不删除已出现的占位消息，保留中止痕迹，符合 Semi 语义

### 热键
- 使用 `sendHotKey="enter"`
- Enter 发送
- Shift + Enter 换行

## 对话展示设计
### 对话组件配置
`AIChatDialogue` 重点使用：
- `chats`
- `roleConfig`
- `align="leftRight"`
- `mode="bubble"` 或 `mode="userBubble"`

推荐首版优先使用 `mode="bubble"`，减少与默认视觉的偏差。

### 角色配置
通过 `roleConfig` 配置 user 与 assistant 的名称、头像或颜色，使右侧对话区具备完整角色语义，而不是仅展示文本气泡。

### 空状态
不再保留当前手写 SVG 空状态。采用更贴近 Semi 默认体验的方式：
- 当 `chats.length === 0` 时，在对话区显示轻量欢迎文案
- 同时提供 3~4 条 hints 作为建议开场语
- 点击 hints 后可回填或直接触发发送逻辑

这样既保留“开始练习”的引导作用，也减少自绘成本。

## 样式策略
遵循“页面容器定外层，组件承担内部视觉”的策略。

保留：
- 右侧容器整体布局：`flex-1 flex flex-col bg-white/50`
- 输入区外层毛玻璃、顶部分隔线、整体 spacing
- 对话区与输入区的最大宽度约束（如 `max-w-4xl`）

移除：
- 旧的手写消息气泡样式
- 旧的手写输入框聚焦边框与发送按钮渐变样式
- 深度覆盖 Semi 内部聊天气泡样式的做法

原则：
- 尽量少覆写 Semi 内部结构样式
- 只调整页面层 spacing、容器宽度、背景与边界

## 滚动策略
当前页面使用 `messagesEndRef` 在消息更新后滚动到底部。重构后有两种实现路径：
- 继续保留简单的底部锚点滚动
- 或改为使用 `AIChatDialogue` 的 `scrollToBottom` 方法

首版建议优先保留简单稳定的滚动策略；若实际接入后发现与组件结构冲突，再切换为组件实例方法。

## 错误与边界处理
- 发送时若提取不到有效文本，则不追加用户消息
- 停止生成时必须清理未完成的定时器，避免消息状态被异步二次覆盖
- 切换语言路由后，新生成的 assistant 文案仍从 `currentLanguage?.label` 获取语言名
- 不额外引入超出当前场景的错误提示系统

## 验收标准
1. 首屏无消息时，右侧展示欢迎文案与 hints
2. 用户发送消息后，用户消息立即在 `AIChatDialogue` 中显示
3. assistant 消息先显示 `in_progress`，完成后更新为 `completed`
4. `generating` 期间，`AIChatInput` 进入生成中态，左侧数字人同步思考态
5. 点击停止生成后，当前未完成消息进入 `cancelled`，且不会被后续定时器误更新
6. Enter 发送、Shift + Enter 换行符合预期
7. 新消息到来时，对话区能保持滚动到底部
8. 切换不同语言路由后，模拟回复文案中的语言名正确变化

## 实现备注
- 本次重构优先保证状态模型与交互闭环正确
- 组件内部高级能力（附件、引用、模板、技能、流式块内容）暂不启用
- 代码应避免同时保留旧消息结构与新消息结构，确保单一数据源
