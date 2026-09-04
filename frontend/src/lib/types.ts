export type ConnectionStatus = "connected" | "disconnected" | "pending"
export type ConnectionInfo = {
    label: string;
    status: ConnectionStatus
}

export type Message = {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
}