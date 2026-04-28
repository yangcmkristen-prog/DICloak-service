import { v4 as uuidv4 } from "uuid";
import * as XLSX from "xlsx";
import {
  FAQItem,
  FunctionKnowledge,
  KnowledgeBase,
  MappingItem,
  OutOfScopeItem,
  TermItem,
  TroubleshootingItem,
} from "@/types/knowledge";

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, "");
}

function pick(row: Record<string, unknown>, keys: string[]) {
  const map = new Map<string, unknown>();
  Object.entries(row).forEach(([k, v]) => map.set(normalizeKey(k), v));
  for (const k of keys) {
    const found = map.get(normalizeKey(k));
    if (typeof found === "string") return found.trim();
    if (found != null) return String(found).trim();
  }
  return "";
}

export async function parseKnowledgeExcel(file: File): Promise<KnowledgeBase> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);

  const faqItems: FAQItem[] = [];
  const troubleshootingItems: TroubleshootingItem[] = [];
  const outOfScopeItems: OutOfScopeItem[] = [];
  const mappingItems: MappingItem[] = [];
  const functionKnowledge: FunctionKnowledge[] = [];
  const termItems: TermItem[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    const normalizedName = sheetName.toLowerCase();

    rows.forEach((row) => {
      if (normalizedName === "feature_faq") {
        faqItems.push({
          id: uuidv4(),
          question: pick(row, ["question", "问题", "faq", "ask"]),
          answer: pick(row, ["answer", "回答", "回复", "solution"]),
          raw: row,
        });
      } else if (normalizedName === "troubleshooting") {
        troubleshootingItems.push({
          id: uuidv4(),
          issue: pick(row, ["issue", "problem", "问题", "现象"]),
          solution: pick(row, ["solution", "处理", "answer", "排查"]),
          raw: row,
        });
      } else if (normalizedName === "out_of_scope") {
        outOfScopeItems.push({
          id: uuidv4(),
          pattern: pick(row, ["pattern", "question", "关键词", "问题"]),
          response: pick(row, ["response", "answer", "回复", "建议"]),
          raw: row,
        });
      } else if (normalizedName === "mapping" || normalizedName === "user_routing") {
        mappingItems.push({
          id: uuidv4(),
          input: pick(row, ["input", "question", "query", "问题"]),
          mappedType: pick(row, ["mappedtype", "type", "分类", "route"]),
          raw: row,
        });
      } else if (normalizedName === "function_knowledge") {
        functionKnowledge.push({
          id: uuidv4(),
          functionName: pick(row, ["function", "name", "功能", "模块"]),
          detail: pick(row, ["detail", "description", "说明", "知识"]),
          raw: row,
        });
      } else if (normalizedName === "term" || (normalizedName === "sheet1" && !workbook.SheetNames.includes("term"))) {
        termItems.push({
          id: uuidv4(),
          term: pick(row, ["term", "术语", "关键词", "词条"]),
          definition: pick(row, ["definition", "解释", "说明", "含义"]),
          raw: row,
        });
      }
    });
  }

  return {
    faqItems,
    troubleshootingItems,
    outOfScopeItems,
    mappingItems,
    functionKnowledge,
    termItems,
    lastUpdated: Date.now(),
  };
}
