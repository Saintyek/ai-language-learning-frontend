# Feature Specification: 聊天页面选词翻译 Tooltip

**Feature**: `20260428-text-translate-tooltip`
**Created**: 2026-04-28
**Status**: Draft
**Input**: User description: "使用agent team模式开发，前端在当前目录，后端在bytedance/code/ai-language-learning-backend。实现在聊天页面翻译用户选择的文本为中文，展示音标/拼音和简单例句。使用Semi组件tooltip，样式参考图片"

**UI 参考图片**: [Image #1](/Users/bytedance/.claude/image-cache/404717b6-415b-4d2e-8563-d7ea6ff760fc/1.png)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 选词翻译 Tooltip 显示 (Priority: P1)

用户在聊天页面选中文本后，系统调用大语言模型翻译选中的文本为中文，并以 Tooltip 形式展示翻译结果，包含：
- 翻译后的中文短语（大字粗体）
- 发音指南/拼音
- 简单例句

**UI 设计规格**（参考图片）：
- 卡片：浅灰色背景，圆角设计
- 左上角：翻译后的中文短语，黑色粗体大字
- 发音指南：显示拼音/音标
- 例句标签：粗体"例如:"
- 例句内容：简单的使用例句
- 右上角：黑色 X 关闭按钮
- 左下角：两个圆形操作按钮
  1. 白色按钮，青色边框，播放/发音图标
  2. 浅灰色按钮，复制图标

**Why this priority**: 这是核心功能，用户选词后立即获得翻译和发音指导是语言学习应用的核心体验。

**Technical Implementation**:

**前端实现**（仓库: ai-language-learning-frontend）：
- 在 `ChatDialogArea.tsx` 中添加文本选择监听
- 创建 `TranslateTooltip` 组件，使用 Semi UI 的 Tooltip 组件
- 组件位置：`src/components/TranslateTooltip/TranslateTooltip.tsx`
- API 调用：新增 `src/api/translate.ts`
- 使用 `window.getSelection()` 获取选中文本
- Tooltip 定位在选中文本附近

**后端实现**（仓库: ai-language-learning-backend）：
- 新建 `translate` 模块
- Controller: `src/translate/translate.controller.ts`
- Service: `src/translate/translate.service.ts`
- DTO: `src/translate/dto/translate-request.dto.ts`
- API 端点: `POST /api/translate`
- 调用已有的 Ark/LLM API 进行翻译

**API 接口设计**：
```typescript
// Request
interface TranslateRequest {
  text: string;        // 要翻译的文本
  sourceLanguage?: string;  // 源语言，默认自动检测
  targetLanguage?: string;  // 目标语言，默认中文
}

// Response
interface TranslateResponse {
  translation: string;     // 翻译结果
  pronunciation: string;   // 拼音/音标
  example: {
    sentence: string;      // 例句
    translation: string;   // 例句翻译
  };
}
```

**Independent Test**: 在聊天页面选中任意文本，Tooltip 正确显示翻译、拼音和例句即可验证。

**Acceptance Scenarios**:

1. **Given** 用户在聊天页面，**When** 选中一段英文文本，**Then** Tooltip 显示中文翻译、拼音和例句
2. **Given** Tooltip 已显示，**When** 点击关闭按钮，**Then** Tooltip 消失
3. **Given** Tooltip 已显示，**When** 点击其他区域，**Then** Tooltip 消失

---

### User Story 2 - 发音播放功能 (Priority: P2)

用户点击 Tooltip 中的播放按钮，可以听到翻译内容的发音。

**Why this priority**: 发音是语言学习的重要部分，但不影响核心翻译功能的完整性。

**Technical Implementation**:
- 使用 Web Speech API (`speechSynthesis`) 进行语音合成
- 或调用 TTS API（如需要更高质量发音）

**Independent Test**: 点击播放按钮能听到语音输出即可验证。

**Acceptance Scenarios**:

1. **Given** Tooltip 已显示，**When** 点击播放按钮，**Then** 播放翻译内容的发音
2. **Given** 正在播放，**When** 再次点击播放按钮，**Then** 停止当前播放

---

### User Story 3 - 复制功能 (Priority: P3)

用户点击 Tooltip 中的复制按钮，可以将翻译内容复制到剪贴板。

**Why this priority**: 便捷功能，提升用户体验但不影响核心学习流程。

**Technical Implementation**:
- 使用 `navigator.clipboard.writeText()` API
- 复制后显示简短的成功提示

**Independent Test**: 点击复制按钮后粘贴能看到翻译内容即可验证。

**Acceptance Scenarios**:

1. **Given** Tooltip 已显示，**When** 点击复制按钮，**Then** 翻译内容复制到剪贴板，显示复制成功提示

---

### Edge Cases

- 选中的文本为空或只有空白字符时，不显示 Tooltip
- 选中的文本过长（超过 500 字符）时，显示提示"选中文本过长，请选择较短的短语"
- 翻译 API 调用失败时，显示错误提示"翻译失败，请稍后重试"
- 快速连续选词时，取消上一个翻译请求，只显示最新的翻译结果

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统 MUST 在用户选中文本后显示翻译 Tooltip
- **FR-002**: 系统 MUST 调用大语言模型进行翻译
- **FR-003**: Tooltip MUST 显示翻译结果、拼音/音标、例句
- **FR-004**: 系统 MUST 使用 Semi UI 组件库的 Tooltip 组件
- **FR-005**: 用户 MUST 能够通过点击关闭按钮或点击其他区域关闭 Tooltip
- **FR-006**: 系统 MUST 支持发音播放功能（P2）
- **FR-007**: 系统 MUST 支持复制翻译内容功能（P3）

### Key Entities

- **TranslateRequest**: 翻译请求，包含源文本、源语言、目标语言
- **TranslateResponse**: 翻译响应，包含翻译结果、拼音、例句

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户选中文本后，Tooltip 在 2 秒内显示翻译结果
- **SC-002**: 翻译准确率达到 90% 以上
- **SC-003**: Tooltip 显示位置正确，不遮挡选中文本
- **SC-004**: 发音播放功能正常工作
- **SC-005**: 复制功能正常工作
