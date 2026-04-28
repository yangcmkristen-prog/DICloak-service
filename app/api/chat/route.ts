import { NextResponse } from "next/server";
import { buildSupportPrompt } from "@/lib/prompt";
import { Conversation } from "@/types/conversation";
import { KnowledgeBase } from "@/types/knowledge";

export const runtime = "nodejs";

interface ChatBody {
  question: string;
  conversation: Conversation;
  knowledgeBase: KnowledgeBase | null;
}

function toTextStream(upstream: ReadableStream<Uint8Array>) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.getReader();
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";

          for (const event of events) {
            const lines = event
              .split("\n")
              .filter((line) => line.startsWith("data:"))
              .map((line) => line.slice(5).trim())
              .join("");

            if (!lines || lines === "[DONE]") continue;

            try {
              const json = JSON.parse(lines) as {
                type?: string;
                delta?: string;
                output_text?: string;
              };

              const text = json.delta ?? json.output_text ?? "";
              if (text) controller.enqueue(encoder.encode(text));
            } catch {
              // ignore non-json chunks
            }
          }
        }
      } finally {
        controller.close();
        reader.releaseLock();
      }
    },
  });
}

async function callGpt(prompt: string): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL ?? "gpt-5.4";

  if (!apiKey) {
    throw new Error("未配置 OPENAI_API_KEY，请先配置环境变量");
  }

  const response = await fetch(`${baseUrl}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: prompt,
      stream: true,
      text: { verbosity: "medium" },
    }),
  });

  if (!response.ok || !response.body) {
    const errorText = await response.text();
    throw new Error(`GPT 调用失败: ${response.status} ${errorText}`);
  }

  return toTextStream(response.body);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatBody;
    if (!body.question?.trim()) {
      return NextResponse.json({ error: "问题不能为空" }, { status: 400 });
    }

    const prompt = buildSupportPrompt({
      question: body.question,
      history: body.conversation?.messages ?? [],
      knowledgeBase: body.knowledgeBase,
    });

    const textStream = await callGpt(prompt);

    return new Response(textStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "服务异常";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
