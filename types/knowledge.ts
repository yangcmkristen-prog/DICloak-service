export interface BaseKnowledgeItem {
  id: string;
  raw: Record<string, unknown>;
}

export interface FAQItem extends BaseKnowledgeItem {
  question: string;
  answer: string;
}

export interface TroubleshootingItem extends BaseKnowledgeItem {
  issue: string;
  solution: string;
}

export interface OutOfScopeItem extends BaseKnowledgeItem {
  pattern: string;
  response: string;
}

export interface MappingItem extends BaseKnowledgeItem {
  input: string;
  mappedType: string;
}

export interface FunctionKnowledge extends BaseKnowledgeItem {
  functionName: string;
  detail: string;
}

export interface TermItem extends BaseKnowledgeItem {
  term: string;
  definition: string;
}

export interface KnowledgeBase {
  faqItems: FAQItem[];
  troubleshootingItems: TroubleshootingItem[];
  outOfScopeItems: OutOfScopeItem[];
  mappingItems: MappingItem[];
  functionKnowledge: FunctionKnowledge[];
  termItems: TermItem[];
  lastUpdated: number;
}
