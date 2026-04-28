# DICloak 客服助手开发任务

DICloak 客服助手（内部版）是一个基于 Next.js 的客服工作台，用于快速生成 3 条可直接发送给客户的专业回复，并支持本地多对话管理与 Excel 知识库导入。

## 1. 项目介绍

核心能力：

- 输入客户问题，调用 AI 生成 3 条推荐回复（流式展示）
- 左侧多对话管理：新建、删除、重命名、切换会话
- 右侧知识库管理：导入 xlsx/xls、多 sheet 解析、统计、清空
- 浏览器 localStorage 持久化（会话 + 知识库）

## 2. 技术栈

- Framework: Next.js 16（App Router）
- Core: React 19
- Language: TypeScript 5
- UI: shadcn/ui 风格 + Radix Slot
- Styling: Tailwind CSS 4
- LLM: OpenAI Responses API（GPT-5.4）
- Model: gpt-5.4
- Excel: xlsx

## 3. 本地启动方式

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

## 4. 环境变量说明

复制示例文件：

```bash
cp .env.example .env.local
```

在 `.env.local` 中填写：

- `OPENAI_API_KEY`（必填）
- `OPENAI_BASE_URL`（可选，默认 `https://api.openai.com/v1`）
- `OPENAI_MODEL`（可选，默认 `gpt-5.4`）

> 注意：严禁将 API Key 写入前端代码，当前实现仅在 `app/api/chat/route.ts` 服务端读取。

## 5. Vercel 部署步骤

1. 将仓库连接到 Vercel。
2. Framework Preset 选择 **Next.js**。
3. Build Command: `npm run build`
4. Install Command: `npm install`
5. Output Directory: 留空（Next.js 默认）
6. 在 Vercel 项目设置中添加环境变量（见上方）。
7. 点击 Deploy。

## 6. GitHub + Vercel 自动部署说明

- 推荐以 `main` 作为生产分支自动部署。
- 每次合并 PR 到 `main`，Vercel 将自动触发新部署。
- 可为 PR 启用 Preview Deployment 供评审实时查看。

## 7. 知识库 Excel sheet 要求

支持以下 Sheet（大小写不敏感）：

- `feature_faq`
- `user_routing`
- `troubleshooting`
- `out_of_scope`
- `mapping`
- `function_knowledge`
- `term`
- `Sheet1`（仅当 `term` 不存在时作为术语库）

字段映射采用宽松匹配（中英文、别名可容忍），并保留每行 `raw` 原始数据。

## 8. 常见问题排查

### Q1: 点击生成后提示未配置 API Key

请检查 `.env.local` 或 Vercel 环境变量是否设置 `OPENAI_API_KEY`。

### Q2: Excel 导入失败

请确认文件为 `.xlsx/.xls` 且包含至少一个支持的 Sheet。

### Q3: 页面刷新后数据丢失

检查浏览器是否禁用 localStorage，或是否在无痕模式下运行。

### Q4: AI 输出格式不标准

后端已通过 Prompt 约束固定输出格式；若模型仍偏离，可进一步强化 Prompt 或追加格式纠正逻辑。

## 开发脚本

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
```
