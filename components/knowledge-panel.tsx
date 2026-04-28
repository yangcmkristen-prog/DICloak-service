"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { parseKnowledgeExcel, mergeKnowledge } from "@/lib/excel";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/storage";
import { KnowledgeBase } from "@/types/knowledge";
import { useState } from "react";

interface Props {
  knowledgeBase: KnowledgeBase | null;
  onUpdate: (data: KnowledgeBase | null) => void;
  systemPrompt: string;
  onSavePrompt: (value: string) => void;
}

export function KnowledgePanel({ knowledgeBase, onUpdate, systemPrompt, onSavePrompt }: Props) {
  const [status, setStatus] = useState<string>("");
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [promptDraft, setPromptDraft] = useState(systemPrompt);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      setStatus("正在解析 Excel 文件...");
      const parsedList = await Promise.all([...files].map((file) => parseKnowledgeExcel(file).then((r) => r.knowledge)));
      onUpdate(mergeKnowledge(knowledgeBase, parsedList));
      setStatus(`导入成功，共处理 ${files.length} 个文件`);
    } catch {
      setStatus("导入失败，请检查文件格式（xlsx/xls）");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>知识库上传</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <input
            type="file"
            multiple
            accept=".xlsx,.xls"
            onChange={(e) => {
              void handleFiles(e.target.files);
              e.currentTarget.value = "";
            }}
          />
          {status && <p className="text-sm">{status}</p>}
          <Button variant="destructive" className="w-full" onClick={() => onUpdate(null)}>
            清空知识库
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>知识库统计</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-[var(--muted-foreground)]">
          <p>FAQ：{knowledgeBase?.faqItems.length ?? 0}</p>
          <p>排障问题：{knowledgeBase?.troubleshootingItems.length ?? 0}</p>
          <p>超范围问题：{knowledgeBase?.outOfScopeItems.length ?? 0}</p>
          <p>问题映射：{knowledgeBase?.mappingItems.length ?? 0}</p>
          <p>功能知识：{knowledgeBase?.functionKnowledge.length ?? 0}</p>
          <p>术语库：{knowledgeBase?.termItems.length ?? 0}</p>
          <p>最近更新时间：{knowledgeBase?.lastUpdated ? new Date(knowledgeBase.lastUpdated).toLocaleString() : "未导入"}</p>
          <div className="max-h-28 overflow-y-auto rounded border border-[var(--border)] p-2">
            <p className="mb-1 text-xs font-medium">已上传文件</p>
            {(knowledgeBase?.uploadedFiles?.length ?? 0) === 0 ? (
              <p className="text-xs">暂无</p>
            ) : (
              <ul className="space-y-1 text-xs">
                {knowledgeBase?.uploadedFiles?.slice().reverse().map((f) => (
                  <li key={f.id}>
                    {f.name} ({Math.ceil(f.size / 1024)} KB)
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>系统 Prompt 设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {editingPrompt ? (
            <>
              <textarea
                className="min-h-56 w-full rounded-md border border-[var(--border)] p-2 text-sm"
                value={promptDraft}
                onChange={(e) => setPromptDraft(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    onSavePrompt(promptDraft.trim() || DEFAULT_SYSTEM_PROMPT);
                    setEditingPrompt(false);
                  }}
                >
                  保存 Prompt
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPromptDraft(systemPrompt);
                    setEditingPrompt(false);
                  }}
                >
                  取消
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setPromptDraft(DEFAULT_SYSTEM_PROMPT);
                    onSavePrompt(DEFAULT_SYSTEM_PROMPT);
                  }}
                >
                  恢复默认
                </Button>
              </div>
            </>
          ) : (
            <>
              <pre className="max-h-60 overflow-y-auto whitespace-pre-wrap rounded-md border border-[var(--border)] p-2 text-xs">
                {systemPrompt}
              </pre>
              <Button variant="outline" onClick={() => setEditingPrompt(true)}>
                修改 Prompt
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
