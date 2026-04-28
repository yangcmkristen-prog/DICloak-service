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

function ReplyCard({ title, content }: { title: string; content: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await navigator.clipboard.writeText(stripReplyTitle(content));
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
        >
          {copied ? "已复制" : "复制"}
        </Button>
      </CardHeader>
      <CardContent className="whitespace-pre-wrap text-sm">{content}</CardContent>
    </Card>
  );
}
