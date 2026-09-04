import { Request, Router } from "express";
import z from "zod";
import { requireSession } from "../middleware/requireSession";
import { agentMessageReply, deleteThread, getThreadMessages, listUserThreads } from "../services/agent.services.js";

const agentSchema = z.object({
    message: z.string().trim().min(1),
    threadId: z.uuid(),
})

const threadIdSchema = z.uuid()

export const agentRouter = Router()

agentRouter.use(requireSession)

agentRouter.get("/threads", async (req, res) => {
    try {
        const threads = await listUserThreads(req.authentication!.authUserId)
        res.json({ threads })
    } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to get threads"
        res.status(500).json({ error: message })
    }
})

agentRouter.get("/threads/:threadId", async (req, res) => {
    const parsed = threadIdSchema.safeParse(req.params.threadId)
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid ThreadId" })
        return
    }
    try {
        const messages = await getThreadMessages(req.authentication!.authUserId, parsed.data)
        res.json({ threadId: parsed.data, messages })
    } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to get threads"
        res.status(500).json({ error: message })
    }
})

agentRouter.delete("/threads/:threadId", async (req, res) => {
    console.log("delete hit")
    const parsed = threadIdSchema.safeParse(req.params.threadId)
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid ThreadId" })
        return
    }
    try {
        await deleteThread(parsed.data)
        res.json({ message: "Successfully deleted" })
    } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete threads"
        res.status(500).json({ error: message })
    }
})

agentRouter.post("/chat", async (req, res) => {
    const parsed = agentSchema.safeParse(req.body)
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid chat body" })
        return
    }

    res.status(200)
    res.setHeader("Content-Type", "tex/event-stream")
    res.setHeader("Chace-Control", "no-cache, no-transform")
    res.setHeader("Connection", "keep-alive")
    res.flushHeaders()

    const write = (event: Record<string, unknown>) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`)
    }

    try {
        await agentMessageReply({
            authUserId: req.authentication!.authUserId,
            userId: req.authentication!.userId,
            threadId: parsed.data.threadId,
            message: parsed.data.message,
            onEvent: write
        })
    } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to get threads"
        write({ type: "error", message })
    } finally {
        res.end()
    }
})