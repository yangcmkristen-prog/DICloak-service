import { Conversation } from "@/types/conversation";
import { KnowledgeBase } from "@/types/knowledge";

const CONVERSATION_KEY = "diclok_conversations";
const KNOWLEDGE_KEY = "diclok_knowledge_base";

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
    return JSON.parse(localStorage.getItem(CONVERSATION_KEY) ?? "[]") as Conversation[];
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
    return JSON.parse(localStorage.getItem(KNOWLEDGE_KEY) ?? "null") as KnowledgeBase | null;
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
