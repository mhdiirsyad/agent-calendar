import { descopeClient, GOOGLE_CALENDAR_ID } from "../config/descope.js";

export async function getCalendarToken(authUserId: string) {
    if (!GOOGLE_CALENDAR_ID || !process.env.DESCOPE_MANAGEMENT_KEY) {
        throw new Error("Connection not configured")
    }

    const response = await descopeClient.management.outboundApplication.fetchToken(
        GOOGLE_CALENDAR_ID,
        authUserId
    )

    const accessToken = response.ok || response.data ? (response.data as { accessToken?: string }).accessToken : undefined

    if (!accessToken) {
        throw new Error("Access Token not present, please reconnect")
    }

    return accessToken
}