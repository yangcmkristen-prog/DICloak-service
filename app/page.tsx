"use client";

import { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Conversation, ConversationMessage } from "@/types/conversation";
import { KnowledgeBase } from "@/types/knowledge";
import {
  DEFAULT_SYSTEM_PROMPT,
  loadConversations,
  loadKnowledgeBase,
  loadSystemPrompt,
  saveConversations,
  saveKnowledgeBase,
  saveSystemPrompt,
} from "@/lib/storage";
import { buildRelevantKnowledge, parseAssistantBlocks } from "@/lib/prompt";
import { ConversationSidebar } from "@/components/conversation-sidebar";
import { KnowledgePanel } from "@/components/knowledge-panel";
import { ReplyCard, ReplyCards } from "@/components/reply-cards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

function createConversation(): Conversation {
  const now = Date.now();
  const hhmm = new Date(now).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  return { id: uuidv4(), title: `新对话 ${hhmm}`, createdAt: now, updatedAt: now, messages: [] };
}

type MainTab = "chat" | "knowledge";

export default function HomePage() {
  const [mainTab, setMainTab] = useState<MainTab>("chat");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [question, setQuestion] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

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
    setSystemPrompt(loadSystemPrompt());
  }, []);

  useEffect(() => saveConversations(conversations), [conversations]);
  useEffect(() => saveKnowledgeBase(knowledgeBase), [knowledgeBase]);
  useEffect(() => saveSystemPrompt(systemPrompt), [systemPrompt]);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeId) ?? conversations[0],
    [activeId, conversations],
  );

  const submit = async () => {
    if (!question.trim() || !activeConversation) {
      setError("请输入客户问题后再发送");
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
      const relevantKnowledge = buildRelevantKnowledge(question, knowledgeBase);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          conversation: { ...activeConversation, messages: [...activeConversation.messages, userMessage] },
          systemPrompt,
          relevantKnowledge,
        }),
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

      const parsed = parseAssistantBlocks(assistantText);
      const assistantMessage: ConversationMessage = {
        id: uuidv4(),
        role: "assistant",
        content: assistantText,
        createdAt: Date.now(),
        parsed,
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== activeConversation.id) return c;
          return {
            ...c,
            updatedAt: Date.now(),
            messages: [...c.messages, userMessage, assistantMessage],
            title: c.messages.length === 0 ? question.slice(0, 20).trim() || c.title : c.title,
          };
        }),
      );
      setQuestion("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "请求失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1400px] space-y-4 p-4">
      <header className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <h1 className="text-xl font-semibold">DICloak 客服助手</h1>
        <div className="mt-3 flex gap-2">
          <Button variant={mainTab === "chat" ? "default" : "outline"} onClick={() => setMainTab("chat")}>
            对话
          </Button>
          <Button variant={mainTab === "knowledge" ? "default" : "outline"} onClick={() => setMainTab("knowledge")}>
            知识库管理
          </Button>
        </div>
      </header>

      {mainTab === "chat" ? (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
          <ConversationSidebar
            conversations={conversations}
            activeId={activeConversation?.id ?? ""}
            onCreate={() => {
              const c = createConversation();
              setConversations((prev) => [c, ...prev]);
              setActiveId(c.id);
            }}
            onDelete={(id) => {
              setConversations((prev) => {
                const next = prev.filter((c) => c.id !== id);
                if (!next.length) {
                  const created = createConversation();
                  setActiveId(created.id);
                  return [created];
                }
                if (activeId === id) setActiveId(next[0].id);
                return next;
              });
            }}
            onSelect={setActiveId}
            onRename={(id, title) =>
              setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title, updatedAt: Date.now() } : c)))
            }
          />

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>生成回复</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="请输入客户问题...（Enter 发送，Shift + Enter 换行）"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (!loading) void submit();
                    }
                  }}
                  disabled={loading}
                />
                {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
                {!knowledgeBase && <p className="text-sm text-[var(--muted-foreground)]">提示：当前未导入知识库，将按通用规则回复。</p>}
                <Button onClick={() => void submit()} disabled={loading}>
                  {loading ? "生成中..." : "发送并生成回复"}
                </Button>
              </CardContent>
            </Card>

            {(streamingText || loading) && (
              <Card>
                <CardHeader>
                  <CardTitle>本轮生成结果 {loading ? "(流式生成中...)" : ""}</CardTitle>
                </CardHeader>
                <CardContent>
                  {streamingText ? <ReplyCards {...parseAssistantBlocks(streamingText)} /> : <p className="text-sm">正在等待模型返回...</p>}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>对话历史</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {activeConversation?.messages.length ? (
                  activeConversation.messages.map((message) => {
                    const expanded = !!expandedMap[message.id];
                    const parsed = message.role === "assistant" ? message.parsed ?? parseAssistantBlocks(message.content) : undefined;
                    return (
                      <div key={message.id} className="rounded-md border border-[var(--border)] p-2">
                        <button
                          className="flex w-full items-center justify-between text-left"
                          onClick={() => setExpandedMap((prev) => ({ ...prev, [message.id]: !expanded }))}
                        >
                          <span className="font-medium text-sm">{message.role === "user" ? "客户问题" : "助手回复"}</span>
                          <span className="text-xs text-[var(--muted-foreground)]">{new Date(message.createdAt).toLocaleString()}</span>
                        </button>
                        {expanded && (
                          <div className="mt-2 space-y-2">
                            {message.role === "user" ? (
                              <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                            ) : (
                              <>
                                <p className="text-sm font-medium">{parsed?.issueType}</p>
                                {(parsed?.replies ?? []).map((reply, idx) => (
                                  <ReplyCard key={`${message.id}-${idx}`} title={`回复${idx + 1}`} content={reply} />
                                ))}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-[var(--muted-foreground)]">当前对话暂无历史。</p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <KnowledgePanel
            knowledgeBase={knowledgeBase}
            onUpdate={setKnowledgeBase}
            systemPrompt={systemPrompt}
            onSavePrompt={setSystemPrompt}
          />
        </section>
      )}
    </main>
  );
}
