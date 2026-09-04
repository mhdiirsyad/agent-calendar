import { descopeMcpAuthRouter, DescopeMcpProvider } from "@descope/mcp-express"
import { Express } from "express"
import { listUpcomingMeetingTools } from "./calendar-tool.js"

export function mountMCP(app: Express) {
    const serverUrl = process.env.SERVER_URL
    const provider = new DescopeMcpProvider({
        serverUrl,
        descopeMcpServerWellKnownUrl: process.env.DESCOPE_MCP_SERVER_WELL_KNOWN_URL,
        projectId: process.env.DESCOPE_PROJECT_ID
    })

    app.use(
        descopeMcpAuthRouter((server) => {
            listUpcomingMeetingTools(server)
        }, provider)
    )

    console.log(`MCP server run in ${serverUrl}/mcp`);
    
}