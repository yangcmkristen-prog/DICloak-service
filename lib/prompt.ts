import { ConversationMessage } from "@/types/conversation";
import { KnowledgeBase } from "@/types/knowledge";

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

export function buildSupportPrompt(params: {
  question: string;
  history: ConversationMessage[];
  knowledgeBase: KnowledgeBase | null;
}) {
  const historyText = params.history
    .slice(-10)
    .map((m) => `${m.role === "user" ? "客户" : "客服"}: ${m.content}`)
    .join("\n");

  const knowledgeSummary = summarizeKnowledge(params.knowledgeBase);

  return `你是 DICloak 客服助手，请直接输出可发给客户的专业回复。\n\n客户问题：${params.question}\n\n历史上下文：\n${historyText || "无"}\n\n知识库摘要：\n${knowledgeSummary}\n\n输出格式必须严格如下：\n问题类型：xxx\n\n回复1：\nxxx\n\n回复2：\nxxx\n\n回复3：\nxxx\n\n规则：\n1) 只输出可直接发送给客户的内容。\n2) 禁止输出内部分析过程。\n3) 禁止出现“根据知识库”“我查询到”“匹配到”“判断依据”等表达。\n4) 三条回复互相独立，回复2/3不要使用“此外”“另外”“除此之外”。\n5) 若超出 DICloak 业务范围，给出礼貌超范围说明。\n6) 若信息不足，优先生成追问式回复。`;
}

export function parseAssistantBlocks(content: string) {
  const blocks = content
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  const issueType = blocks[0] ?? "问题类型：未识别";
  const replies = blocks.slice(1, 4);
  return { issueType, replies };
}

export function stripReplyTitle(text: string) {
  return text
    .replace(/^\s*(\[?回复\d+\]?|##\s*回复\d+|回复\d+\s*[：:])\s*/i, "")
    .trim();
}
