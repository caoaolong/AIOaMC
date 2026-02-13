# 运维平台 (AIOaMG)

基于 Vue 3 + Naive UI + Vue Router、后端 Node（ssh2、LangChain）的运维管理平台。

## 功能

1. **服务器管理**：维护服务器信息（IP、端口、用户名、密码或私钥、名称、备注），支持通过 xterm + ssh2 进行 SSH 连接。
2. **服务管理**：每台服务器下可配置运行中的服务（如数据库、Redis 等），记录名称、类型、端口、状态等。
3. **智能体服务管理**：维护智能体相关服务（服务地址、前端地址、后端 API 地址、Python 环境路径等）。
4. **运维智能体**：基于 LangChain 的对话助手，可查询服务器与服务信息，需配置 OpenAI API Key。

## 技术栈

- 前端：Vue 3、Vue Router、Naive UI、xterm.js
- 后端：Express、ssh2、ws（WebSocket）、better-sqlite3、@langchain/openai

## 启动

### 1. 安装依赖

```bash
# 前端
npm install

# 后端
cd server && npm install
```

### 2. 启动后端（必须先启动）

```bash
cd server && npm start
```

后端默认运行在 `http://localhost:3001`，API 前缀 `/api`，SSH WebSocket 路径 `/ssh?serverId=xxx`。

### 3. 启动前端开发

```bash
npm run dev
```

开发时 Vite 会将 `/api` 和 `/ssh` 代理到后端。

### 4. 生产部署

```bash
npm run build
cd server && npm start
```

构建产物在 `dist/`，后端会静态托管 `dist`，可直接访问 `http://localhost:3001`。

## 使用说明

- **服务器**：新增服务器后，在列表点击「SSH 连接」打开终端；点击「服务管理」进入该服务器的服务列表。
- **运维智能体**：在「运维智能体」页选择或新建智能体配置，填写 OpenAI API Key（或设置环境变量），即可对话。当前为纯对话模式，后续可扩展工具调用（如列出服务器、执行只读命令等）。

## 环境变量（可选）

- `OPENAI_API_KEY`：运维智能体使用的 OpenAI API Key（若未在界面填写）。
