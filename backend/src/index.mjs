import "dotenv/config"
import express from "express"
import cors from "cors"
import { getPool } from "./db/pool.js"
import { connectionRouter } from "./routes/connection.routes.js"
import { agentRouter } from "./routes/agents.routes.js"
import { mountMCP } from "./mcp/mount.js"

const app = express()
const pool = getPool()
const appOrigin = process.env.APP_URL ?? "http://localhost:3000"
const port = process.env.PORT || 4000

app.use(cors({
    origin: appOrigin,
    credentials: true,
}))

app.use(express.json())

app.get("/health", async(_req, res) => {
    try {
        await pool.query("SELECT 1")
        res.json({
            status: "ok",
            message: "server running",
            database: "up"
        })
    } catch {
        res.status(503).json({
            status: "failed",
            message: "Internal server error",
            database: "down"
        })
    }
})

app.use("/api/connection", connectionRouter)
app.use("/api/agent", agentRouter)
mountMCP(app)

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => console.log(`Server running on port ${port}`));
}

export default app;