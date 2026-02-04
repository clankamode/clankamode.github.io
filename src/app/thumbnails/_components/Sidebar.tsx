'use client';

import type React from "react"
import Link from "next/link"
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

  const menuItems = [
    {
      key: ThumbnailJobStatus.TODO,
      label: "To Do",
      count: statusCounts.todo,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    {
      key: ThumbnailJobStatus.IN_REVIEW,
      label: "In Review",
      count: statusCounts["in-review"],
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )
    },
    {
      key: ThumbnailJobStatus.COMPLETED,
      label: "Completed",
      count: statusCounts.completed,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      key: FAVORITES_VIEW,
      label: "Favorites",
      count: statusCounts.favorites,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      )
    },
  ]

  return (
    <div
      className={`${sidebarOpen ? "w-64 opacity-100" : "w-0 opacity-0 lg:w-64 lg:opacity-100"} transition-all duration-300 bg-white/[0.02] border-r border-white/5 overflow-hidden flex flex-col h-full pt-6`}
    >
      <div className="p-3">
        <button
          type="button"
          onClick={onCreateClick}
          className="group w-full flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-white rounded-lg transition-all duration-200"
        >
          <div className="flex items-center justify-center w-5 h-5 group-hover:text-brand-green transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-sm font-medium">New Job</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="px-2 py-2">
          <div className="px-3 py-2 text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-widest">
            Queue
          </div>

          <div className="space-y-0.5">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setCurrentView(item.key)}
                className={`w-full group relative flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 ${currentView === item.key
                  ? 'text-white bg-white/5'
                  : 'text-muted-foreground hover:text-gray-200 hover:bg-white/[0.03]'
                  }`}
              >
                {currentView === item.key && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-brand-green rounded-r-full shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                )}

                <div className="flex items-center gap-3">
                  <div className={`transition-colors ${currentView === item.key ? 'text-white' : 'text-muted-foreground group-hover:text-white'}`}>
                    {item.icon}
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>

                {item.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-opacity ${currentView === item.key
                    ? 'bg-white/10 text-white opacity-100'
                    : 'bg-white/5 text-white/60 opacity-70 group-hover:opacity-100'
                    }`}>
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto p-3 border-t border-white/5">
        <div className="px-3 py-2 text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-widest">
          Apps
        </div>
        <div className="space-y-0.5">
          <Link href="/ai" className="flex items-center gap-3 px-3 py-2.5 text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            <span className="text-sm">AI Chat</span>
          </Link>
          <Link href="/videos" className="flex items-center gap-3 px-3 py-2.5 text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-sm">Videos</span>
          </Link>

          <div className="flex items-center gap-3 px-3 py-2.5 text-white bg-white/5 rounded-lg transition-all duration-200 relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-brand-green rounded-r-full shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
            <svg className="w-4 h-4 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="text-sm font-medium">Thumbnails</span>
          </div>

          <Link href="/gallery" className="flex items-center gap-3 px-3 py-2.5 text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            <span className="text-sm">Gallery</span>
          </Link>
          <Link href="/clips" className="flex items-center gap-3 px-3 py-2.5 text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            <span className="text-sm">Clips</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
