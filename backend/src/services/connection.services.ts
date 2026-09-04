import { descopeClient, GOOGLE_CALENDAR_LABEL, GOOGLE_CALENDAR_ID } from "../config/descope.js";
import { getCalendarConnectionRow, upsertCalendarConnection } from "../repositories/connection.repository.js";

function getAppId() {
    if (!GOOGLE_CALENDAR_ID) {
        throw new Error("GOOGLE_CLIENT_ID is missing")
    }
    return GOOGLE_CALENDAR_ID
}

export async function getCalendarConnection(userId: string) {
    const result = await getCalendarConnectionRow(userId)
    return {
        label: GOOGLE_CALENDAR_LABEL,
        status: result?.status ?? ("disconnected" as const)
    }
}

export async function createCalendarConnectUrl(input: {
    userId: string,
    refreshToken: string,
    redirectUrl: string
}) {
    const response = await descopeClient.outbound.connect(
        getAppId(),
        { redirectUrl: input.redirectUrl },
        input.refreshToken
    )

    if (!response.ok || !response.data?.url) {
        throw new Error("couldn't start connection")
    }

    const res = await upsertCalendarConnection({
        user_id: input.userId,
        status: "pending"
    })

    return { url: response.data.url }
}

export async function refreshCalendarConnection(input: {
    userId: string,
    authUserId: string,
}) {
    const response = await descopeClient.management.outboundApplication.fetchToken(
        getAppId(),
        input.authUserId
    )

    const status = response.ok && response.data ? "connected" : "disconnected"

    const row = await upsertCalendarConnection({
        user_id: input.userId,
        status
    })

    return {
        label: GOOGLE_CALENDAR_LABEL,
        status: row.status
    }
}