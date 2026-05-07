# Quickstart: Streaming TTS Voice

**Feature**: `streaming-tts-voice` | **Date**: 2026-05-07

## 环境准备

### 后端配置

1. 添加环境变量到 `.env`:
```bash
# 火山引擎 TTS 配置
VOLCENGINE_TTS_API_KEY=your-api-key-here
VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0
VOLCENGINE_TTS_DEFAULT_SPEAKER=zh_female_vv_uranus_bigtts
```

2. 安装依赖:
```bash
cd ai-language-learning-backend
npm install ws
npm install -D @types/ws
```

### 前端配置

无需额外配置，使用浏览器原生 API。

## 开发步骤

### Phase 1: 后端 TTS 模块 (预计 2 天)

1. **创建 TTS 模块结构**
   ```bash
   cd ai-language-learning-backend/src
   mkdir -p tts/dto tts/interfaces
   ```

2. **实现核心文件**
   - `tts/interfaces/volcengine-tts.interface.ts` - 协议接口定义
   - `tts/tts.service.ts` - WebSocket 客户端服务
   - `tts/tts.controller.ts` - API 端点
   - `tts/dto/tts-stream.dto.ts` - 请求 DTO
   - `tts/tts.module.ts` - 模块定义

3. **集成到 ChatService**
   - 修改 `chat/chat.service.ts` 集成 TTS 流式输出
   - 添加 `enableTTS` 参数控制

### Phase 2: 前端播放器 (预计 1.5 天)

1. **创建 API 和工具类**
   ```bash
   cd ai-language-learning-frontend/src
   touch api/tts.ts utils/audioPlayer.ts
   ```

2. **实现核心文件**
   - `api/tts.ts` - SSE 流式 API 调用
   - `utils/audioPlayer.ts` - 流式音频播放器
   - `hooks/useStreamingTTS.ts` - TTS Hook

3. **集成到 Chat 页面**
   - 修改 `pages/Chat/hooks/useChat.ts` 集成 TTS

### Phase 3: 测试与优化 (预计 1 天)

1. 单元测试
2. 集成测试
3. 性能优化

## 验证清单

### 后端验证

- [ ] WebSocket 连接成功建立
- [ ] 首包音频延迟 < 500ms
- [ ] 断线重连正常工作
- [ ] SSE 事件正确推送

### 前端验证

- [ ] 音频队列正常工作
- [ ] 播放/暂停/停止功能正常
- [ ] TTS 服务不可用时降级处理

## 常见问题

### Q: WebSocket 连接失败
A: 检查 API Key 是否正确配置，网络是否可达 `openspeech.bytedance.com`

### Q: 音频播放卡顿
A: 检查音频队列缓冲策略，增加预加载时长

### Q: 首包延迟过高
A: 考虑连接复用或提前建立连接

## 参考文档

- [火山引擎 TTS WebSocket 双向流式-V3 API](https://www.volcengine.com/docs/6561/1329505)
- [MDN Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
