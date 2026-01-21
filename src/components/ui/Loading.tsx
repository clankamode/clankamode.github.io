import type React from "react"

export default function Loading() {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
                <p className="text-muted-foreground">Loading...</p>
            </div>
        </div>
    )
}
