import DescopeClient from "@descope/node-sdk"
import { warn } from "node:console"

const projectId = process.env.DESCOPE_PROJECT_ID
const managementKey = process.env.DESCOPE_MANAGEMENT_KEY

if (!projectId) {
    console.warn("ProjectId is missing")
}

export const descopeClient = DescopeClient({
    projectId: projectId || "",
    managementKey: managementKey || "",
})

export const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID
export const GOOGLE_CALENDAR_LABEL = "Google Calendar"