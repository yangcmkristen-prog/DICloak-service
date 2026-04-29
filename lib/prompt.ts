import { ConversationMessage } from "@/types/conversation";
import { KnowledgeBase } from "@/types/knowledge";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/storage";

export interface RelevantKnowledge {
  faq: string[];
  troubleshooting: string[];
  outOfScope: string[];
  functionKnowledge: string[];
  summary: string;
}

function summarizeKnowledge(knowledgeBase: KnowledgeBase | null) {
  if (!knowledgeBase) {
    return "当前未导入知识库，请根据通用客服礼仪回答。";
  }

  return [
    `FAQ: ${knowledgeBase.faqItems.length} 条`,
    `排障: ${knowledgeBase.troubleshootingItems.length} 条`,
    `超范围: ${knowledgeBase.outOfScopeItems.length} 条`,
    `映射: ${knowledgeBase.mappingItems.length} 条`,
    `功能知识: ${knowledgeBase.functionKnowledge.length} 条`,
    `术语: ${knowledgeBase.termItems.length} 条`,
  ].join("；");
}

export function buildRelevantKnowledge(question: string, knowledgeBase: KnowledgeBase | null): RelevantKnowledge {
  if (!knowledgeBase) {
    return {
      faq: [],
      troubleshooting: [],
      outOfScope: [],
      functionKnowledge: [],
      summary: "未导入知识库，可按客服通用规范回复。",
    };
  }

  const keywords = question
    .toLowerCase()
    .split(/[\s,，。！？;；:：、]+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 1);

  const match = (text: string) => keywords.some((k) => text.toLowerCase().includes(k));
  const top = 12;

  const faq = knowledgeBase.faqItems
    .filter((item) => match(`${item.question} ${item.answer}`))
    .slice(0, top)
    .map((item) => `Q: ${item.question}\nA: ${item.answer}`);

  const troubleshooting = knowledgeBase.troubleshootingItems
    .filter((item) => match(`${item.issue} ${item.solution}`))
    .slice(0, top)
    .map((item) => `Issue: ${item.issue}\nSolution: ${item.solution}`);

  const outOfScope = knowledgeBase.outOfScopeItems
    .filter((item) => match(`${item.pattern} ${item.response}`))
    .slice(0, top)
    .map((item) => `Pattern: ${item.pattern}\nResponse: ${item.response}`);

  const functionKnowledge = knowledgeBase.functionKnowledge
    .filter((item) => match(`${item.functionName} ${item.detail}`))
    .slice(0, top)
    .map((item) => `${item.functionName}: ${item.detail}`);

  const summary =
    faq.length + troubleshooting.length + outOfScope.length + functionKnowledge.length > 0
      ? "已找到相关知识条目，请优先使用这些条目生成可发给客户的回复。"
      : `未找到强匹配知识条目。知识库统计：${summarizeKnowledge(knowledgeBase)}。请按 DICloak 客服规范回复。`;

  return { faq, troubleshooting, outOfScope, functionKnowledge, summary };
}

export function buildSupportPrompt(params: {
  question: string;
  history: ConversationMessage[];
  systemPrompt?: string;
  relevantKnowledge: RelevantKnowledge;
}) {
  const historyText = params.history
    .slice(-12)
    .map((m) => `${m.role === "user" ? "客户" : "客服"}: ${m.content}`)
    .join("\n");

  const prompt = params.systemPrompt?.trim() || DEFAULT_SYSTEM_PROMPT;

  return `${prompt}\n\n当前客户问题：\n${params.question}\n\n历史上下文：\n${historyText || "无"}\n\n相关知识：\n${JSON.stringify(params.relevantKnowledge, null, 2)}`;
}

export function parseAssistantBlocks(content: string) {
  const issueTypeMatch = content.match(/问题类型\s*[：:]\s*([\s\S]*?)(?:\n\s*\n|$)/);
  const issueType = issueTypeMatch?.[1]?.trim() || "未识别";

  const replies = [1, 2, 3].map((index) => {
    const re = new RegExp(`回复${index}\\s*[：:]\\s*([\\s\\S]*?)(?=\\n\\s*回复[123]\\s*[：:]|$)`, "i");
    const matched = content.match(re)?.[1]?.trim();
    return matched || `（未返回回复${index}内容）`;
  });

  return {
    issueType: `问题类型：${issueType}`,
    replies,
  };
}

export function stripReplyTitle(text: string) {
  return text
    .replace(/^\s*(\[?回复\d+\]?|##\s*回复\d+|回复\d+\s*[：:])\s*/i, "")
    .trim();
}
