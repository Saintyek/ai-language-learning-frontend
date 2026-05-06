---
last_compound_scan: 2026-05-06
compound_scan_mode: incremental
---

# AI Language Learning Frontend Security

## Core Practices

### I. Authentication Mechanisms

**协议：** Bearer Token（计划中，后端尚未返回 token）

**流程：**
1. 用户通过 `/api/auth/login` 登录
2. 后端返回用户信息（token 待实现）
3. Token 存储在 `localStorage`，有效期 24 小时
4. Token 通过 Authorization header 附加到请求

**位置：**
- 登录 API：`src/api/auth.ts:54-67`
- Token 附加：`src/utils/request.ts:19-24`
- Token 存储：`src/api/auth.ts:89-101`

**Token 生命周期：**
- 过期时间：24 小时 (`AUTH_EXPIRY_TIME = 24 * 60 * 60 * 1000`)
- 存储：`localStorage`，键为 `token`、`userId`、`userInfo`、`authExpiry`
- 清理：检测过期或显式登出

**降级认证：**
当 token 不可用时，使用 `userId` 作为临时标识 (`src/api/auth.ts:97-99`)。

### II. Authorization Patterns

**路由保护：**
- 受保护路由使用 `<RequireAuth>` 组件包装
- 未认证重定向到 `/?auth=required`
- 位置：`src/routes/RequireAuth.tsx:9-15`

**API 授权：**
- Bearer token 在 `Authorization` header
- 401 响应触发自动登出和重定向
- 位置：`src/utils/request.ts:63-74`，`src/api/chat.ts:234-241`

### III. Encryption Practices

**当前状态：** 未实现客户端加密。依赖 HTTPS 进行传输安全。

**敏感数据存储：**
- Token 存储在 `localStorage`（生产环境不安全）
- 建议：使用 `httpOnly` cookie 存储 token

### IV. Audit Logging

**当前状态：** 仅控制台日志。

**位置：**
- 认证状态变化：`src/components/Navbar/hooks/useAuthState.ts`
- API 错误：`src/utils/request.ts:105`

## Fixed Rules

1. **永远不要在源代码中存储 token**
2. **所有认证 API 调用必须包含 Authorization header**
3. **401 响应必须触发登出流程**
4. **认证数据必须有过期时间和自动清理**
5. **敏感操作必须在执行前验证认证**

## Governance

- Token 应从 `localStorage` 迁移到 `httpOnly` cookie（当后端支持时）
- 考虑为基于 cookie 的认证实现 CSRF 保护
- 审计日志应针对生产环境增强

> 🔗 See [Auth Degradation](RELIABILITY.md#ii-degradation-strategy) for authentication fallback chain.

**Version**: 1.0.0 | **Ratified**: 2026-05-06 | **Last Amended**: 2026-05-06
