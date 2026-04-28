"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { stripReplyTitle } from "@/lib/prompt";
import { useState } from "react";

export function ReplyCards({ issueType, replies }: { issueType: string; replies: string[] }) {
  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle>问题类型</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">{issueType}</CardContent>
      </Card>
      {replies.map((reply, index) => (
        <ReplyCard key={`${reply}-${index}`} title={`回复${index + 1}`} content={reply} />
      ))}
    </div>
  );
}

export function ReplyCard({ title, content }: { title: string; content: string }) {
  const [tip, setTip] = useState("");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(stripReplyTitle(content));
      setTip("已复制");
    } catch {
      setTip("复制失败，请手动复制");
    } finally {
      setTimeout(() => setTip(""), 1500);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>{title}</CardTitle>
        <div className="flex items-center gap-2">
          {tip && <span className="text-xs text-[var(--muted-foreground)]">{tip}</span>}
          <Button variant="outline" size="sm" onClick={copy}>
            复制
          </Button>
        </div>
      </CardHeader>
      <CardContent className="whitespace-pre-wrap text-sm">{content}</CardContent>
    </Card>
  );
}
