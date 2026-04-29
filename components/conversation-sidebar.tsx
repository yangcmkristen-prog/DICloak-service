"use client";

import { Conversation } from "@/types/conversation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Check } from "lucide-react";
import { useState } from "react";

interface Props {
  conversations: Conversation[];
  activeId: string;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

export function ConversationSidebar({ conversations, activeId, onCreate, onDelete, onSelect, onRename }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  return (
    <aside className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
      <Button onClick={onCreate} className="w-full">
        <Plus className="mr-1 h-4 w-4" /> 新建对话
      </Button>
      <div className="space-y-2">
        {conversations.map((c) => (
          <div
            key={c.id}
            className={`rounded-md border p-2 ${activeId === c.id ? "border-[var(--primary)] bg-[var(--muted)]" : "border-[var(--border)]"}`}
          >
            {editingId === c.id ? (
              <div className="flex gap-2">
                <Input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} />
                <Button
                  size="sm"
                  onClick={() => {
                    onRename(c.id, draftTitle || c.title);
                    setEditingId(null);
                  }}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <button className="mb-2 w-full text-left text-sm font-medium" onClick={() => onSelect(c.id)}>
                {c.title}
              </button>
            )}
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingId(c.id);
                  setDraftTitle(c.title);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="destructive" size="sm" onClick={() => onDelete(c.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
