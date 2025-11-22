"use client"

import type React from "react"

export type ToolView = "fact-checker" | "timestamp-generator"

type ToolsSidebarProps = {
    currentView: ToolView
    setCurrentView: (view: ToolView) => void
    sidebarOpen: boolean
}

export default function ToolsSidebar({ currentView, setCurrentView, sidebarOpen }: ToolsSidebarProps) {
    return (
        <div
            className={`w-64 h-screen bg-[#282828] shadow-lg transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
        >
            <nav className="mt-8">
                <div className="px-6 mb-6">
                    <h2 className="text-white text-xl font-semibold">Tools</h2>
                </div>

                <div className="space-y-1">
                    {[
                        { key: "fact-checker" as const, label: "Fact Checker", icon: "🔍" },
                        { key: "timestamp-generator" as const, label: "Timestamp Generator", icon: "⏰" },
                    ].map((item) => (
                        <button
                            key={item.key}
                            onClick={() => setCurrentView(item.key)}
                            className={`w-full flex items-center justify-between px-6 py-3 text-left hover:bg-[#1a1a1a] transition-colors ${
                                currentView === item.key ? "bg-[#1a1a1a] border-r-2 border-[#2cbb5d] text-[#2cbb5d]" : "text-gray-300"
                            }`}
                        >
                            <div className="flex items-center">
                                <span className="mr-3 text-lg">{item.icon}</span>
                                <span className="font-medium">{item.label}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </nav>
        </div>
    )
}
