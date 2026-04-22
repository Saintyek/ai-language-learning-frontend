# Feature Specification: 语言学习档案提示词注入

**Feature**: `20260422-profile-prompt-inject`
**Created**: 2026-04-22
**Status**: Draft
**Input**: 用户描述: "请你使用agent team模式,分别用于开发前端(当前项目)和后端(bytedance/code/ai-language-learning),我希望将用户设置的语言学习档案中的数据在用户与AI进行对话时加上提示词约束,学习档案的提示词约束等级应该是最高的,超过场景提示词"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 后端档案提示词注入 (Priority: P1)

当用户与 AI 进行对话时，后端需要获取用户设置的语言学习档案数据，并将其作为系统提示词注入到对话上下文中。学习档案的提示词约束等级必须是最高的，确保其优先级超过场景提示词。

**触发条件**: 用户发送聊天消息时，后端接收到包含 `language` 参数的请求

**业务规则**:
1. 学习档案提示词必须作为最基础的系统提示词注入
2. 场景提示词在档案提示词之后注入
3. 档案提示词包含：语言水平、学习动机、学习目标、每日学习时间

**目标用户**: 所有使用语言学习功能的用户

**Why this priority**: 这是核心功能，没有它后续功能无法正常工作

**Technical Implementation**:

**后端修改 (ai-language-learning-backend)**:

1. **修改 ChatStreamRequestDto** (`src/chat/dto/chat-stream-request.dto.ts`):
   - 添加 `userId` 字段（从认证中间件获取）
   - 可选添加 `profileId` 用于直接传递档案数据

2. **修改 ChatService** (`src/chat/chat.service.ts`):
   - 在 `injectScenePrompt` 方法中，先获取用户档案
   - 注入档案提示词作为第一个 system message
   - 然后再注入场景提示词

3. **创建 ProfilePromptBuilder** (`src/chat/prompts/profile-builder.ts`):
```typescript
interface ProfileData {
  level: 'beginner' | 'intermediate' | 'advanced' | 'master';
  motivations: string[];
  goals: string[];
  dailyTime: string;
}

function buildProfilePrompt(profile: ProfileData, language: string): string {
  // 生成档案约束提示词
  // 包含语言水平、学习动机、学习目标等信息
}
```

4. **修改 prompt 注入顺序**:
```typescript
// chat.service.ts 中的 injectScenePrompt 方法
private async injectScenePrompt(dto: ChatStreamRequestDto): Promise<ChatMessage[]> {
  const messages: ChatMessage[] = [];

  // 1. 最高优先级：学习档案提示词
  if (dto.language && dto.userId) {
    const profile = await this.profileService.getProfile(dto.userId, dto.language);
    if (profile) {
      const profilePrompt = buildProfilePrompt(profile, dto.language);
      messages.push({ role: 'system', content: profilePrompt });
    }
  }

  // 2. 次优先级：场景提示词
  if (dto.scenario && dto.language) {
    const scenePrompt = getScenePrompt(dto.scenario, dto.language);
    if (scenePrompt) {
      messages.push({ role: 'system', content: scenePrompt });
    }
  }

  // 3. 用户消息
  for (const msg of dto.messages) {
    messages.push({ role: msg.role, content: msg.content });
  }

  return messages;
}
```

**Independent Test**: 可以通过单元测试验证提示词注入顺序和内容

**Acceptance Scenarios**:

1. **Given** 用户已设置英语学习档案（中级水平，学习动机为工作），**When** 用户发起英语对话，**Then** 后端注入的提示词包含用户的学习档案信息
2. **Given** 用户未设置某语言的学习档案，**When** 用户发起该语言对话，**Then** 系统正常处理，不注入档案提示词
3. **Given** 用户同时设置了档案和选择了场景，**When** 发起对话，**Then** 档案提示词位于场景提示词之前

---

### User Story 2 - 前端档案数据传递 (Priority: P2)

前端需要在用户发起对话时，确保后端能够获取到正确的用户 ID 和语言信息，以便后端查询用户的学习档案。

**触发条件**: 用户在前端发起聊天对话

**业务规则**:
1. 前端需要传递用户认证信息
2. 前端需要传递当前学习语言
3. 如果用户未设置档案，应提示用户先设置

**Why this priority**: 依赖后端实现完成后才能完整测试

**Technical Implementation**:

**前端修改 (ai-language-learning-frontend)**:

1. **修改 chat API 调用** (`src/api/chat.ts` 或相关文件):
   - 确保请求中包含认证 token
   - 确保请求中包含当前语言信息

2. **可选：添加档案检查**:
   - 在进入聊天页面前检查是否有档案
   - 如果没有档案，引导用户先设置档案

**Independent Test**: 可以通过 Network 面板验证请求参数是否正确传递

**Acceptance Scenarios**:

1. **Given** 用户已登录并设置了英语档案，**When** 用户发起英语对话，**Then** 请求包含正确的认证信息和语言代码
2. **Given** 用户未设置当前语言的档案，**When** 进入聊天页面，**Then** 系统提示用户先设置档案

---

### User Story 3 - 档案提示词模板设计 (Priority: P3)

设计合理的学习档案提示词模板，确保 AI 能够根据用户的档案信息提供个性化的学习体验。

**Why this priority**: 可以在后期优化，不影响核心功能

**Technical Implementation**:

**创建提示词模板** (`src/chat/prompts/profile-template.ts`):

```typescript
const levelDescriptions = {
  beginner: '初学者',
  intermediate: '中级学习者',
  advanced: '高级学习者',
  master: '精通者'
};

const motivationDescriptions = {
  work: '工作需要',
  travel: '旅行交流',
  exam: '考试准备',
  career: '职业发展',
  entertainment: '娱乐消遣',
  interest: '兴趣爱好'
};

const goalDescriptions = {
  speaking: '口语表达',
  listening: '听力理解',
  reading: '阅读能力',
  writing: '写作能力',
  vocabulary: '词汇积累'
};

export function buildProfilePrompt(profile: LanguageProfile, language: string): string {
  const levelDesc = levelDescriptions[profile.level];
  const motivationList = profile.motivations.map(m => motivationDescriptions[m]).join('、');
  const goalList = profile.goals.map(g => goalDescriptions[g]).join('、');

  return `## 学习者档案约束
你正在与一位${levelDesc}进行对话学习。

### 学习背景
- 学习动机：${motivationList}
- 学习目标：${goalList}
- 每日学习时间：${profile.dailyTime}

### 教学指导
请根据以上信息调整你的回复方式和难度：
1. 语言难度应适合${levelDesc}水平
2. 重点帮助用户提升${goalList}能力
3. 考虑用户的学习动机提供相关话题
4. 回复应简洁明了，适合用户的每日学习时间安排

此档案约束具有最高优先级，请在任何场景设定之上优先考虑学习者的个人情况。`;
}
```

**Independent Test**: 可以通过手动验证生成的提示词是否符合预期

**Acceptance Scenarios**:

1. **Given** 初级用户，**When** 生成档案提示词，**Then** 提示词包含适合初级水平的教学指导
2. **Given** 用户学习目标为口语和听力，**When** 生成档案提示词，**Then** 提示词重点强调口语和听力训练

---

### Edge Cases

- 用户删除了学习档案后继续对话怎么办？系统应正常处理，不注入档案提示词
- 用户切换语言后，档案提示词应自动更新为新语言的档案
- 如果档案数据不完整（如缺少某些字段），系统应使用默认值或优雅降级

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 后端必须能够在聊天请求中识别用户 ID 和目标语言
- **FR-002**: 后端必须能够查询用户指定语言的学习档案
- **FR-003**: 后端必须将学习档案转换为系统提示词并注入到对话上下文
- **FR-004**: 档案提示词必须在场景提示词之前注入，确保最高优先级
- **FR-005**: 如果用户没有设置档案，系统应正常处理对话请求
- **FR-006**: 前端必须确保认证信息正确传递到后端

### Key Entities

- **LanguageProfile**: 用户的学习档案，包含语言水平、学习动机、学习目标、每日学习时间
- **ChatMessage**: 聊天消息，需要根据档案信息进行调整
- **ProfilePrompt**: 从档案生成的系统提示词

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户发起对话时，后端能够成功查询并注入档案提示词
- **SC-002**: 档案提示词在所有系统提示词中具有最高优先级
- **SC-003**: 不同档案的用户能够获得差异化的对话体验
- **SC-004**: 未设置档案的用户仍能正常使用对话功能
