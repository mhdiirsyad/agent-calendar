import { Router } from "express";
import { requireSession } from "../middleware/requireSession.js";
import { createCalendarConnectUrl, getCalendarConnection, refreshCalendarConnection } from "../services/connection.services.js";

export const connectionRouter = Router()

connectionRouter.use(requireSession)

connectionRouter.get("/", async (req, res) => {
    try {
        const connection = await getCalendarConnection(req.auth!.userId)
        res.json({ connection })
    } catch {
        res.status(500).json({ error: "couldn't load connection" })
    }
})

connectionRouter.post('/connect', async(req, res) => {
    try {
        const refreshToken = typeof req.body?.refreshToken === "string" ? req.body?.refreshToken : ""
        if(!refreshToken) {
            res.json({error: "refresh token is required"})
            return
        }

        const redirectUrl = typeof req.body?.redirectUrl === "string" ? req.body?.redirectUrl : (process.env.APP_URL ?? "localhost:3000/dahsboard")
        const result = await createCalendarConnectUrl({
            userId: req.auth!.userId,
            refreshToken,
            redirectUrl
        })

        res.json(result)
    } catch {
        res.status(500).json({error: "cannot start connection"})
    }
})

connectionRouter.post("/refresh-status", async(req, res) => {
    try {
        const connection = await refreshCalendarConnection({
            authUserId: req.auth!.authUserId,
            userId: req.auth!.userId
        })

        res.json({connection})
    } catch {
        res.status(500).json({error: "cannot refresh connection"})
    }
})