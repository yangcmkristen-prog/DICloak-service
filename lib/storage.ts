import { Conversation } from "@/types/conversation";
import { KnowledgeBase } from "@/types/knowledge";

const CONVERSATION_KEY = "diclok_conversations";
const KNOWLEDGE_KEY = "diclok_knowledge_base";
const SYSTEM_PROMPT_KEY = "diclok_system_prompt";

export const DEFAULT_SYSTEM_PROMPT = `你是 DICloak 的 AI 客服助手。

你的任务：基于知识库，直接生成 2-3 条可发送给客户的完整回复成品。

核心规则：
- 只输出可直接发送给客户的话术成品
- 不输出分析过程
- 不输出检索过程
- 不输出判断依据
- 不出现“根据知识库”“根据FAQ”“我查询到”“我匹配到”“命中”“判断”等内部表达
- 每条回复必须互相独立
- 第二、第三条回复不要使用“此外”“另外”“除此之外”等依赖上一条的连接词
- 如果客户问题信息不足，优先生成追问式回复
- 如果客户问题不属于 DICloak 业务范围，输出礼貌的超范围说明
- 根据客户语言回复客户

输出格式必须为：

问题类型：
xxx

回复1：
xxx

回复2：
xxx

回复3：
xxx`;

function canUseStorage() {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

export function loadConversations(): Conversation[] {
  if (!canUseStorage()) return [];
  try {
    const items = JSON.parse(localStorage.getItem(CONVERSATION_KEY) ?? "[]") as Conversation[];
    return items.map((c) => ({ ...c, messages: c.messages ?? [] }));
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(CONVERSATION_KEY, JSON.stringify(conversations));
}

export function loadKnowledgeBase(): KnowledgeBase | null {
  if (!canUseStorage()) return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(KNOWLEDGE_KEY) ?? "null") as KnowledgeBase | null;
    if (!parsed) return null;
    return {
      ...parsed,
      uploadedFiles: parsed.uploadedFiles ?? [],
    };
  } catch {
    return null;
  }
}

export function saveKnowledgeBase(knowledge: KnowledgeBase | null) {
  if (!canUseStorage()) return;
  if (!knowledge) {
    localStorage.removeItem(KNOWLEDGE_KEY);
    return;
  }
  localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(knowledge));
}

export function loadSystemPrompt() {
  if (!canUseStorage()) return DEFAULT_SYSTEM_PROMPT;
  return localStorage.getItem(SYSTEM_PROMPT_KEY) ?? DEFAULT_SYSTEM_PROMPT;
}

export function saveSystemPrompt(value: string) {
  if (!canUseStorage()) return;
  localStorage.setItem(SYSTEM_PROMPT_KEY, value);
}
