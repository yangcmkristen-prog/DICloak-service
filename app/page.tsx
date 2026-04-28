"use client";

import { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Conversation, ConversationMessage } from "@/types/conversation";
import { KnowledgeBase } from "@/types/knowledge";
import { loadConversations, loadKnowledgeBase, saveConversations, saveKnowledgeBase } from "@/lib/storage";
import { parseAssistantBlocks } from "@/lib/prompt";
import { ConversationSidebar } from "@/components/conversation-sidebar";
import { KnowledgePanel } from "@/components/knowledge-panel";
import { ReplyCards } from "@/components/reply-cards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

function createConversation(): Conversation {
  const now = Date.now();
  return { id: uuidv4(), title: "新对话", createdAt: now, updatedAt: now, messages: [] };
}

export default function HomePage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [question, setQuestion] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loaded = loadConversations();
    if (loaded.length) {
      setConversations(loaded);
      setActiveId(loaded[0].id);
    } else {
      const initial = createConversation();
      setConversations([initial]);
      setActiveId(initial.id);
    }
    setKnowledgeBase(loadKnowledgeBase());
  }, []);

  useEffect(() => saveConversations(conversations), [conversations]);
  useEffect(() => saveKnowledgeBase(knowledgeBase), [knowledgeBase]);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeId) ?? conversations[0],
    [activeId, conversations],
  );

  const submit = async () => {
    if (!question.trim() || !activeConversation) {
      setError("请输入客户问题后再生成");
      return;
    }
    setError("");
    setLoading(true);

    const userMessage: ConversationMessage = {
      id: uuidv4(),
      role: "user",
      content: question,
      createdAt: Date.now(),
    };

    let assistantText = "";
    setStreamingText("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, conversation: activeConversation, knowledgeBase }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "AI 调用失败");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantText += chunk;
        setStreamingText(assistantText);
      }

      const assistantMessage: ConversationMessage = {
        id: uuidv4(),
        role: "assistant",
        content: assistantText,
        createdAt: Date.now(),
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? {
                ...c,
                updatedAt: Date.now(),
                messages: [...c.messages, userMessage, assistantMessage],
                title: c.messages.length === 0 ? question.slice(0, 16) || "新对话" : c.title,
              }
            : c,
        ),
      );
      setQuestion("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "请求失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen grid-cols-1 gap-4 p-4 lg:grid-cols-[260px_1fr_320px]">
      <ConversationSidebar
        conversations={conversations}
        activeId={activeConversation?.id ?? ""}
        onCreate={() => {
          const c = createConversation();
          setConversations((prev) => [c, ...prev]);
          setActiveId(c.id);
        }}
        onDelete={(id) => {
          setConversations((prev) => prev.filter((c) => c.id !== id));
          if (activeId === id && conversations.length > 1) {
            const next = conversations.find((c) => c.id !== id);
            if (next) setActiveId(next.id);
          }
        }}
        onSelect={setActiveId}
        onRename={(id, title) =>
          setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title, updatedAt: Date.now() } : c)))
        }
      />

      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>客户问题输入</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="请输入客户提问内容..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={loading}
            />
            {!knowledgeBase && <p className="text-sm text-[var(--muted-foreground)]">提示：当前未导入知识库，仍可继续生成。</p>}
            {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
            <Button onClick={submit} disabled={loading}>
              {loading ? "生成中..." : "生成 3 条推荐回复"}
            </Button>
          </CardContent>
        </Card>

        {streamingText && <ReplyCards {...parseAssistantBlocks(streamingText)} />}

        <Card>
          <CardHeader>
            <CardTitle>对话历史</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeConversation?.messages.map((message) => (
              <div key={message.id} className="rounded-md border border-[var(--border)] p-2 text-sm">
                <p className="mb-1 font-medium">{message.role === "user" ? "客户" : "助手"}</p>
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {new Date(message.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <KnowledgePanel knowledgeBase={knowledgeBase} onUpdate={setKnowledgeBase} />
    </main>
  );
}
