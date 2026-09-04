import { Agent } from "@mastra/core/agent"
import { createAgentMemory } from "../config/memory.js"
import { getAgentInstructions } from "../config/agent-instruction.js"
import { createCalendarTool } from "./agent-tool.services.js"

export type AgentEvent = {
    type: "started" | "progress" | "token" | "completed" | "error",
    message?: string,
    token?: string,
}

export type StreamAgentReplyInput = {
    userId: string,
    authUserId: string,
    threadId: string,
    message: string,
    onEvent: (event: AgentEvent) => void
}

export type ThreadSummary = {
    id: string,
    title: string,
    updatedAt: string,
}

export type ThreadMessage = {
    id: string,
    role: "user" | "assistant" | "system",
    content: string
}

function modelName() {
    return process.env.MODEL_NAME ?? "google/gemini-3.5-flash-lite"
}

function messageText(content: unknown): string {
    if (typeof content === "string") return content.trim();
    if (!content || typeof content !== "object") return "";
    const record = content as {
        content?: unknown,
        parts?: Array<{type?: string, text?: string}>
    }

    if(typeof record.content === "string" && record.content.trim()) {
        return record.content.trim()
    }

    if(!Array.isArray(record.parts)) return "";

    return record.parts.filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text!.trim())
    .filter(Boolean)
    .join("\n")
    .trim()
}

export async function listUserThreads(authUserId: string): Promise<ThreadSummary[]> {
    const memory = createAgentMemory()

    const result = await memory.listThreads({
        filter: {resourceId: authUserId},
        perPage: 30,
        orderBy: {field: 'updatedAt', direction: 'DESC'}
    })

    return result.threads.map((thread) => ({
        id: thread.id,
        title: thread.title?.trim() || "Untitled",
        updatedAt: thread.updatedAt instanceof Date ? thread.updatedAt.toISOString() : String(thread.updatedAt)
    }))
}

export async function getThreadMessages(authUserId: string, threadId: string): Promise<ThreadMessage[]> {
    const memory = createAgentMemory()

    const thread = await memory.getThreadById({
        threadId,
        resourceId: authUserId
    })

    if(!thread || thread.resourceId !== authUserId) {
        throw new Error("Thread not found")
    }

    const recallMessage = await memory.recall({
        threadId,
        resourceId: authUserId,
        perPage: false
    })

    const messages: ThreadMessage[] = []

    for (const message of recallMessage.messages) {
        const content = messageText(message.content)

        if(!content) {
            continue
        }

        const role: ThreadMessage["role"] = message.role === "assistant" || message.role === "user"
        ? message.role : "system"

        messages.push({
            id: message.id,
            role,
            content
        })
    }
    return messages
}

export async function deleteThread(threadId: string): Promise<void> {
    console.log(threadId)
    const memory = createAgentMemory()

    await memory.deleteThread(threadId)
}

export async function agentMessageReply(input: StreamAgentReplyInput) {
    if(!process.env.GOOGLE_API_KEY) {
        throw new Error("GEMINI_API_KEY not provided")
    }

    input.onEvent({
        type: "started",
        message: "Agent is planning"
    })

    const memory = createAgentMemory()

    const agent = new Agent({
        id: "meeting-assistant",
        name: "Meeting Assistant",
        instructions: getAgentInstructions(),
        model: modelName(),
        tools: createCalendarTool(input.authUserId),
        memory: memory
    })

    const result = await agent.stream(input.message, {
        memory: {
            resource: input.authUserId,
            thread: input.threadId
        }
    })

    for await (const chunk of result.fullStream) {
        console.log(chunk)
        if(chunk.type === "tool-call") {
            input.onEvent({
                type: "progress",
                message: `Running ${chunk.payload.toolName}`
            })

            continue
        }

        if(chunk.type === "text-delta") {
            const text = chunk.payload.text

            input.onEvent({
                type: "token",
                token: text
            })
        }
    }

    const thread = await memory.getThreadById({
        threadId: input.threadId,
        resourceId: input.authUserId
    })

    if(thread && !thread.title?.trim()) {
        await memory.updateThread({
            id: input.threadId,
            title: input.message.trim().slice(0, 100),
            metadata: thread.metadata ?? {}
        })
    }

    input.onEvent({
        type: "completed",
        message: "done"
    })
}