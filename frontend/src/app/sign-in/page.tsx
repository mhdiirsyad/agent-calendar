import RedirectIfAuthenticated from "@/components/auth/redirectIfAuthenticated";
import SignInComponent from "@/components/auth/sign-in";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function SignInPage() {
    return (
        <main className="app-shell-bg min-h-svh flex items-center justify-center">
            <Card className="w-full max-w-md rounded-lg border border-border/70 bg-card/90 shadow-none ring-1 ring-border/50">
                <CardHeader className="flex flex-col items-center text-center">
                    <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                        <Sparkles className="size-5"/>
                    </div>
                    <CardTitle className="font-heading text-3xl font-semibold tracking-tight">
                        AI Calendar Assistant
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                        Sign in to your Google account to get started.
                    </CardDescription>
                </CardHeader>
                
                <RedirectIfAuthenticated>
                    <SignInComponent />
                </RedirectIfAuthenticated>
            </Card>
        </main>
    )
}