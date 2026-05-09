# Feature Specification: 语音交互功能

**Feature**: `20260508-voice-interaction-feature`
**Created**: 2026-05-08
**Status**: Draft
**Input**: 技术提案文档: [voice-interaction_brainstorm.md](../brainstorm/voice-interaction_brainstorm.md)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 麦克风录音与语音识别 (Priority: P1)

**用户角色**：语言学习者

**功能描述**：
用户在聊天页面点击麦克风按钮，系统调用设备麦克风进行录音，实时采集音频流并通过WebSocket发送到后端。后端集成火山引擎RealtimeAPI进行语音识别，实时返回识别结果。用户可以实时看到识别的文字内容（中间态和最终结果），录音结束后自动发送识别的文本消息。

**触发条件**：
- 用户在聊天页面
- 点击麦克风按钮开始录音
- 再次点击停止录音

**业务规则**：
- 点击开始录音，再次点击停止并发送（交互模式）
- 实时显示中间识别结果（灰色文字）
- 识别完成后显示最终结果（黑色文字）
- 自动发送消息到聊天列表

**Why this priority**: 这是功能的核心MVP，没有录音和识别，其他功能都无法进行。用户可以独立测试此功能并验证语音识别的准确性。

**Technical Implementation**:

**前端实现**：
- **新增文件**：
  - `src/components/VoiceRecorder/index.tsx` - 语音录制组件
  - `src/hooks/useVoiceRecorder.ts` - 麦克风录音Hook
  - `src/api/voice.ts` - WebSocket语音API封装
  - `src/types/voice.ts` - 语音相关类型定义

- **修改文件**：
  - `src/components/ChatInput/index.tsx` - 添加麦克风按钮

- **关键技术点**：参见技术提案文档中的实现代码

**后端实现**：
- **新增文件**：
  - `src/voice/voice.module.ts` - 语音模块
  - `src/voice/voice.gateway.ts` - WebSocket网关
  - `src/voice/voice.service.ts` - 语音服务
  - `src/voice/volcengine-realtime.service.ts` - 火山引擎RealtimeAPI客户端
  - `src/voice/dto/voice-event.dto.ts` - 语音事件DTO
  - `src/voice/interfaces/realtime-api.interface.ts` - RealtimeAPI接口定义

- **修改文件**：
  - `src/app.module.ts` - 注册VoiceModule
  - `.env` - 添加火山引擎API配置

**API配置**：
- 连接地址：`wss://openspeech.bytedance.com/api/v3/realtime/dialogue`
- 认证Headers：
  - `X-Api-App-ID`: 2538953542
  - `X-Api-Access-Key`: cd3ba2f0-c88d-4180-b6e5-23a7c235a4ef
  - `X-Api-Resource-Id`: volc.speech.dialog
  - `X-Api-App-Key`: PlgvMymc7f3tQnJ6
- 音频输入：PCM, 16kHz, 16bit, 单声道

**Independent Test**: 可以通过点击麦克风按钮、说话、查看识别结果来独立测试，验证语音识别是否工作正常。

**Acceptance Scenarios**:

1. **Given** 用户在聊天页面，**When** 点击麦克风按钮，**Then** 系统请求麦克风权限并开始录音，显示录音状态
2. **Given** 正在录音中，**When** 用户说话，**Then** 实时显示识别的文字（中间态）
3. **Given** 正在录音中，**When** 用户再次点击麦克风按钮，**Then** 停止录音并发送识别的文本消息到聊天列表
4. **Given** 浏览器不支持MediaRecorder API，**When** 用户点击麦克风按钮，**Then** 显示提示信息"您的浏览器不支持录音功能"

---

### User Story 2 - AI对话与回复播放 (Priority: P2)

**用户角色**：语言学习者

**功能描述**：用户发送语音识别的文本后，系统通过火山引擎RealtimeAPI进行AI对话，生成文字回复和语音回复。前端接收AI的文字回复显示在聊天界面，同时接收音频流并播放。

**触发条件**：用户录音结束并发送消息后，自动触发AI对话

**业务规则**：
- AI生成文字回复并显示在聊天界面
- AI生成语音回复并通过扬声器播放
- 文字回复和语音回复同步进行
- 复用现有的StreamingAudioPlayer播放音频

**Why this priority**: 这是核心交互功能，用户需要看到AI的回复才能完成对话流程。依赖于P1的录音和识别功能。

**Technical Implementation**:

**前端实现**：
- **修改文件**：`src/pages/Chat.tsx` - 集成语音功能和AI回复展示
- **关键技术点**：使用现有的`StreamingAudioPlayer`播放音频流，接收WebSocket返回的音频数据并播放，文字回复显示在聊天界面

**后端实现**：
- 接收火山引擎的`ChatResponse`事件（AI文字回复）
- 接收火山引擎的`TTSResponse`事件（音频数据）
- 通过WebSocket转发给前端

**事件流**：客户端 StartSession → 发送音频 TaskRequest → 服务端 ASRResponse → ChatResponse → TTSResponse → 客户端 TTSEnded

**Independent Test**: 可以通过发送文本消息、查看AI回复、播放音频来独立测试，验证对话和播放功能是否正常。

**Acceptance Scenarios**:

1. **Given** 用户发送了消息，**When** AI生成回复，**Then** 文字回复显示在聊天界面，语音回复通过扬声器播放
2. **Given** 正在播放AI语音，**When** 播放完成，**Then** 音频播放器状态更新为idle
3. **Given** AI回复生成失败，**When** 系统检测到错误，**Then** 显示错误提示"AI回复生成失败，请重试"

---

### User Story 3 - 发音分析 (Priority: P3)

**用户角色**：语言学习者

**功能描述**：系统对比用户实际发音的识别文本与标准文本，计算相似度评分（0-100分），识别问题音素，并提供简单的改进建议。分析结果以卡片形式展示在聊天界面中。

**触发条件**：用户录音结束后，AI对话完成后

**业务规则**：
- 发音准确度评分（0-100分）
- 问题音素高亮显示
- 提供简单的改进建议
- 分析结果展示在聊天界面

**Why this priority**: 这是增值功能，帮助用户了解发音质量并改进。依赖于P1和P2完成。

**Technical Implementation**:

**前端实现**：
- **新增文件**：`src/components/PronunciationAnalysis/index.tsx` - 发音分析结果展示组件
- **展示内容**：发音准确度评分、问题音素高亮、简单改进建议

**后端实现**：
- **新增文件**：`src/voice/pronunciation-analysis.service.ts` - 发音分析服务
- **实现方式**：获取用户发音识别文本（ASR结果）、获取标准文本、计算相似度评分、识别问题音素、生成改进建议

**Independent Test**: 可以通过录音、查看发音分析结果来独立测试，验证评分和建议是否合理。

**Acceptance Scenarios**:

1. **Given** 用户录音结束且AI回复完成，**When** 系统进行发音分析，**Then** 显示发音评分、问题音素和改进建议
2. **Given** 用户发音准确度评分为85分，**When** 查看分析结果，**Then** 显示评分为85分，并高亮显示问题音素
3. **Given** 用户发音完全正确，**When** 系统进行发音分析，**Then** 显示评分为100分，提示"发音非常标准"

---

### Edge Cases

- **浏览器权限**：当用户拒绝麦克风权限时，显示提示并引导用户开启权限
- **网络断开**：WebSocket连接断开时，自动重连并保存当前状态
- **API限流**：当火山引擎API达到限流阈值时，提示用户稍后再试
- **音频格式不支持**：当浏览器不支持PCM格式时，降级到支持的格式
- **长时间录音**：限制单次录音时长（如最长60秒），避免API成本过高

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST 提供麦克风按钮，用户点击后请求麦克风权限
- **FR-002**: System MUST 支持点击开始录音，再次点击停止录音的交互模式
- **FR-003**: System MUST 实时采集音频流（PCM格式，16kHz，16bit，单声道）
- **FR-004**: System MUST 通过WebSocket将音频流发送到后端
- **FR-005**: System MUST 集成火山引擎RealtimeAPI进行语音识别
- **FR-006**: System MUST 实时显示语音识别的中间结果和最终结果
- **FR-007**: System MUST 在录音结束后自动发送识别的文本消息
- **FR-008**: System MUST 通过火山引擎RealtimeAPI生成AI文字回复和语音回复
- **FR-009**: System MUST 在聊天界面显示AI的文字回复
- **FR-010**: System MUST 播放AI的语音回复音频
- **FR-011**: System MUST 对比用户发音与标准文本，计算相似度评分
- **FR-012**: System MUST 显示发音准确度评分（0-100分）
- **FR-013**: System MUST 高亮显示问题音素
- **FR-014**: System MUST 提供简单的发音改进建议

### Non-Functional Requirements

- **NFR-001**: System MUST 确保WebSocket连接的安全性（API Key不暴露在前端）
- **NFR-002**: System MUST 支持主流浏览器（Chrome, Firefox, Safari, Edge）
- **NFR-003**: System MUST 实现WebSocket自动重连机制
- **NFR-004**: System MUST 监控火山引擎API使用量，避免成本超支

### Key Entities

- **VoiceSession**: 语音会话，包含录音状态、识别结果、AI回复、发音分析结果
- **PronunciationResult**: 发音分析结果，包含评分、问题音素列表、改进建议

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户可以在2秒内启动录音功能（点击麦克风按钮后立即开始录音）
- **SC-002**: 语音识别结果的准确率超过90%（与用户实际说话内容对比）
- **SC-003**: AI文字回复和语音回复在3秒内开始输出（首字延迟）
- **SC-004**: 发音分析结果在1秒内显示（录音结束后）
- **SC-005**: 90%的用户能在首次使用时成功完成语音对话流程
- **SC-006**: 系统支持10个并发WebSocket连接而不降级
- **SC-007**: WebSocket连接断开后在5秒内自动重连成功

## Assumptions & Dependencies

### Assumptions

- 用户使用支持MediaRecorder API的现代浏览器
- 用户已授予麦克风权限
- 火山引擎RealtimeAPI服务稳定可用
- 网络连接稳定，延迟低于200ms

### Dependencies

- **火山引擎RealtimeAPI**: 核心依赖，用于语音识别、AI对话、语音合成
- **MediaRecorder API**: 浏览器API，用于音频采集
- **WebSocket**: 前后端通信协议
- **现有TTS播放器**: StreamingAudioPlayer，用于播放音频流

## API Configuration

### 火山引擎RealtimeAPI配置

**连接信息**：
- 连接地址：`wss://openspeech.bytedance.com/api/v3/realtime/dialogue`
- 协议：WebSocket

**认证参数（HTTP Headers）**：
- `X-Api-App-ID`: 2538953542
- `X-Api-Access-Key`: cd3ba2f0-c88d-4180-b6e5-23a7c235a4ef
- `X-Api-Resource-Id`: volc.speech.dialog
- `X-Api-App-Key`: PlgvMymc7f3tQnJ6

**模型配置**：
- 模型版本：O2.0版本
- 发音人：zh_female_vv_jupiter_bigtts（活泼灵动女声）

**音频格式**：
- 输入：PCM, 16kHz, 16bit, 单声道
- 输出：PCM, 24kHz, 32bit, 单声道

**环境变量配置（.env）**：
```bash
VOLCENGINE_REALTIME_APP_ID=2538953542
VOLCENGINE_REALTIME_ACCESS_KEY=cd3ba2f0-c88d-4180-b6e5-23a7c235a4ef
VOLCENGINE_REALTIME_RESOURCE_ID=volc.speech.dialog
VOLCENGINE_REALTIME_APP_KEY=PlgvMymc7f3tQnJ6
```

## Risk Assessment

| 风险 | 影响 | 缓解措施 |
|-----|------|---------|
| WebSocket连接不稳定 | 高 | 实现自动重连机制，连接断开时保存状态 |
| 浏览器兼容性 | 中 | 检测浏览器支持，不支持时显示提示 |
| RealtimeAPI按量计费 | 高 | 监控使用量，设置配额限制 |

## Out of Scope

- 高级发音分析（音素级别详细分析）
- 多语言支持（仅支持中文）
- 离线模式
- 个性化反馈（基于用户历史数据）
- 唱歌功能

---

**生成时间**：2026-05-08  
**方案状态**：待确认

## Clarifications

### Session 2026-05-08

- Q: 火山引擎RealtimeAPI的具体认证参数是什么？ → A: 认证方式为X-Api-App-ID（2538953542）、X-Api-Access-Key（cd3ba2f0-c88d-4180-b6e5-23a7c235a4ef）、X-Api-Resource-Id（volc.speech.dialog）、X-Api-App-Key（PlgvMymc7f3tQnJ6）
