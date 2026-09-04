"use client";
import { Descope } from "@descope/nextjs-sdk";
import { useRouter } from "next/navigation";

export default function SignInComponent() {
    const router = useRouter();
    return (
        <div className="descope-wrap">
            <Descope 
                flowId="sign-up-or-in-social"
                autoFocus="skipFirstScreen"
                redirectAfterSuccess="/dashboard"
                onSuccess={() => router.push("/dashboard")}
                onError={(event) => console.error("failed to signin ", event.detail)}
            />
        </div>
    )
}