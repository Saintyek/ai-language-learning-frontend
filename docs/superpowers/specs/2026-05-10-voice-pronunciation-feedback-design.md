# 语音发音轻量反馈设计

## 背景

当前语音聊天链路已经通过前端录音、后端 WebSocket、火山 RealtimeAPI 完成 ASR、AI 回复和 TTS 播放。项目里曾预留 `PronunciationAnalysis` 卡片和 `pronunciation` 事件类型，但实际后端没有产出发音分析结果，本次不继续沿用独立卡片方案。

本设计目标是在用户自由语音对话中，让 AI 在用户主动开启开关后，把轻量发音反馈融入每次 AI 回复。关闭开关时，语音聊天保持现有行为，不评价发音。

## 用户体验

- 语音输入模态框新增“发音分析”开关。
- 开关默认关闭，且只在当前聊天页面内记住状态。
- 用户刷新页面后，开关恢复关闭。
- 开关关闭时，AI 正常回复用户内容，不分析发音。
- 开关开启时，每轮语音输入后，AI 在回复中包含简短发音反馈。
- 发音反馈以自然语言融入 AI 回复，不显示独立发音分析卡片。

## 功能范围

### 包含

- 前端维护页面级 `pronunciationAnalysisEnabled` 状态。
- `Chat -> useVoiceChat -> useVoiceSession -> start_session` 透传开关状态。
- 后端 `start_session` DTO 和消息类型增加布尔字段。
- 后端构建 RealtimeAPI `system_role` 时按开关追加发音反馈规则。
- 实现阶段删除未使用的 `PronunciationAnalysis` 组件及相关接入代码。

### 不包含

- 不接入额外音频级发音评测 API。
- 不生成音素级严格评分。
- 不展示发音分析卡片。
- 不保存用户发音评分历史。
- 不把开关状态写入 `localStorage` 或服务端用户配置。

## 方案选择

采用“会话级 Prompt 开关”方案：

- 前端在语音会话启动时把 `pronunciationAnalysisEnabled` 传给后端。
- 后端只在开关开启时向 RealtimeAPI 的 `system_role` 注入发音反馈规则。
- RealtimeAPI 在同一条实时回复链路中生成对话回复、轻量发音反馈和 TTS 音频。

该方案改动小，延迟低，并且最贴合当前语音链路。相比前端动态注入文本指令，它不会污染用户对话上下文；相比独立发音分析服务，它不增加额外模型调用和拼接复杂度。

## 前端设计

### 状态位置

`Chat` 页面维护：

- `pronunciationAnalysisEnabled`
- `setPronunciationAnalysisEnabled`

该状态只存在于 React 页面生命周期中，不持久化。页面刷新后 React 状态重新初始化为 `false`。

### 组件传递

参数传递路径：

1. `Chat` 把开关状态和更新函数传给 `useVoiceChat` 与 `ChatInputArea`。
2. `ChatInputArea` 把状态和更新函数传给 `VoiceRecorder`。
3. `VoiceRecorder` 在 `RecordingModal` 中展示开关。
4. `useVoiceChat` 把开关状态传给 `useVoiceSession`。
5. `useVoiceSession` 在 `start_session` 初始消息中携带开关值。

### 模态框交互

`RecordingModal` 增加开关区：

- 标题：`发音分析`
- 说明：`开启后，AI 每次回复都会评价本轮发音`
- 默认值：关闭
- 开启后当前页面内保持开启，直到用户手动关闭或刷新页面

开关展示在识别文本上方或下方均可，但应避免影响“停止录音”主按钮。

### 清理旧组件

实现阶段删除：

- `src/components/PronunciationAnalysis/index.tsx`
- `src/components/PronunciationAnalysis/styles.css`
- `Chat` 页面中对 `PronunciationAnalysis` 的 import 和渲染
- `useVoiceChat` / `useVoiceSession` 中仅服务于独立 `pronunciation` 事件展示的状态和回调

保留与本次 Prompt 开关相关的命名应聚焦 `pronunciationAnalysisEnabled`，避免继续保留卡片式 `PronunciationResult` 状态。

## 后端设计

### WebSocket 消息

`StartSessionMessage` 增加：

- `pronunciationAnalysisEnabled?: boolean`

`StartSessionDto` 增加对应布尔校验，字段可选，默认按 `false` 处理。

### 语音服务参数

`VoiceSessionOptions` 增加：

- `pronunciationAnalysisEnabled?: boolean`

`VoiceGateway` 在启动会话时把开关值传给 `VoiceService.connectToRealtimeApi()`。

### Prompt 构建

`PromptBuilderService` 的构建参数增加：

- `pronunciationAnalysisEnabled?: boolean`

当该值为 `true` 时，在 Realtime `system_role` 中追加轻量发音反馈规则。

建议规则：

- 每次用户通过语音输入后，都必须在回复中包含一段简短“发音反馈”。
- 反馈基于 ASR 可理解度和用户表达自然度，不声称进行了专业音频评测。
- 反馈格式保持简短，避免覆盖主要对话回复。
- 需要明确告诉用户“整体清楚”或“需要注意”。
- 如果发现可能的误读词，给出正确读法或更自然的说法。
- 不输出独立评分，避免制造虚假的音频级精度。

## 数据流

1. 用户点击麦克风按钮。
2. 语音输入模态框打开，用户可切换“发音分析”开关。
3. 前端启动语音会话，并在 `start_session` 中发送开关状态。
4. 后端校验消息，构建 RealtimeAPI `system_role`。
5. 开关关闭时，后端使用现有 Prompt。
6. 开关开启时，后端追加发音反馈 Prompt。
7. 用户语音进入 ASR、对话和 TTS 链路。
8. AI 回复文本和 TTS 音频自然包含发音反馈。

## 错误处理

- 前端开关状态不影响录音权限、音频上传和 WebSocket 连接。
- 如果 `pronunciationAnalysisEnabled` 缺失或类型异常，后端按关闭处理或返回现有校验错误。
- Prompt 注入失败不应中断语音会话；可降级为不开启发音反馈。
- 如果 ASR 结果为空，AI 不应编造发音问题，可提示“这次没有听清，请再说一遍”。

## 测试策略

- 单元测试 `PromptBuilderService`：开关关闭时不包含发音反馈规则，开启时包含规则。
- 后端 DTO 测试或类型检查：`start_session` 可接收可选布尔字段。
- 前端手动验证：开关默认关闭，页面内切换后保持状态，刷新后关闭。
- 端到端手动验证：关闭开关时 AI 不评价发音；开启开关时每轮语音回复都包含简短发音反馈。
- 回归验证：普通文本聊天、语音 ASR、AI 回复、TTS 播放不受影响。

## 验收标准

- 语音输入模态框显示“发音分析”开关。
- 首次进入页面时开关默认关闭。
- 页面内再次打开语音模态框时保留用户上次选择。
- 刷新页面后开关恢复关闭。
- 开关关闭时，AI 回复不包含发音评价。
- 开关开启时，AI 每次语音回复都包含简短发音评价。
- 项目中未使用的独立 `PronunciationAnalysis` 组件和卡片接入被删除。
