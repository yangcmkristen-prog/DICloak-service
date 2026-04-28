"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { parseKnowledgeExcel } from "@/lib/excel";
import { KnowledgeBase } from "@/types/knowledge";
import { useState } from "react";

interface Props {
  knowledgeBase: KnowledgeBase | null;
  onUpdate: (data: KnowledgeBase | null) => void;
}

export function KnowledgePanel({ knowledgeBase, onUpdate }: Props) {
  const [status, setStatus] = useState<string>("");

  const handleFile = async (file: File) => {
    try {
      setStatus("正在解析 Excel...");
      const parsed = await parseKnowledgeExcel(file);
      onUpdate(parsed);
      setStatus("知识库导入成功");
    } catch {
      setStatus("知识库导入失败，请检查文件格式");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>知识库管理</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {status && <p>{status}</p>}
        <div className="space-y-1 text-[13px] text-[var(--muted-foreground)]">
          <p>FAQ：{knowledgeBase?.faqItems.length ?? 0}</p>
          <p>排障：{knowledgeBase?.troubleshootingItems.length ?? 0}</p>
          <p>超范围：{knowledgeBase?.outOfScopeItems.length ?? 0}</p>
          <p>映射：{knowledgeBase?.mappingItems.length ?? 0}</p>
          <p>功能知识：{knowledgeBase?.functionKnowledge.length ?? 0}</p>
          <p>术语：{knowledgeBase?.termItems.length ?? 0}</p>
          <p>
            最后更新时间：
            {knowledgeBase?.lastUpdated ? new Date(knowledgeBase.lastUpdated).toLocaleString() : "未导入"}
          </p>
        </div>
        <Button variant="outline" className="w-full" onClick={() => onUpdate(null)}>
          清空知识库
        </Button>
      </CardContent>
    </Card>
  );
}
