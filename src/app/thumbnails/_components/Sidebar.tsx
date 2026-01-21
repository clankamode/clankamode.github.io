import type React from "react"
import { ThumbnailJobStatus } from "@/types/ThumbnailJob"
import { FAVORITES_VIEW, type ThumbnailView } from "@/app/thumbnails/types"

type SidebarProps = {
    currentView: ThumbnailView
    setCurrentView: (view: ThumbnailView) => void
    statusCounts: {
        todo: number
        "in-review": number
        completed: number
        favorites: number
    }
    sidebarOpen: boolean
    onCreateClick: () => void
}

export default function Sidebar({ currentView, setCurrentView, statusCounts, sidebarOpen, onCreateClick }: SidebarProps) {

    return (
        <div
        className={`w-64 h-full bg-surface-workbench border-r border-border-workbench transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
  
        <nav className="mt-8">
          <div className="px-6 mb-6">
            <button
              onClick={onCreateClick}
              className="w-full bg-brand-green text-black px-4 py-2 rounded-lg hover:bg-brand-green/90 transition-colors font-medium"
            >
              Create New Job
            </button>
          </div>
  
          <div className="space-y-1">
            {[
              { key: ThumbnailJobStatus.TODO, label: "To Do", icon: "📋", count: statusCounts.todo },
              { key: ThumbnailJobStatus.IN_REVIEW, label: "In Review", icon: "👀", count: statusCounts["in-review"] },
              { key: ThumbnailJobStatus.COMPLETED, label: "Completed", icon: "✅", count: statusCounts.completed },
              { key: FAVORITES_VIEW, label: "Favorites", icon: "⭐", count: statusCounts.favorites },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setCurrentView(item.key)}
                className={`w-full flex items-center justify-between px-6 py-3 text-left hover:bg-surface-interactive transition-colors ${
                  currentView === item.key ? "bg-surface-interactive border-r-2 border-brand-green text-foreground" : "text-muted-foreground"
                }`}
              >
                <div className="flex items-center">
                  <span className="mr-3 text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </div>
                <span
                  className={`px-2 py-1 text-sm rounded-full ${
                    currentView === item.key ? "bg-brand-green text-black" : "bg-surface-interactive text-muted-foreground border border-border-subtle"
                  }`}
                >
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    )
}
