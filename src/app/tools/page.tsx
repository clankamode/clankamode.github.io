"use client"

import type React from "react"
import { useState } from "react"
import ToolsSidebar, { ToolView } from './_components/ToolsSidebar';
import FactChecker from './_components/FactChecker';

export default function ToolsDashboard() {
  const [currentView, setCurrentView] = useState<ToolView>("fact-checker")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex">
      {/* Sidebar */}
      <ToolsSidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        sidebarOpen={sidebarOpen}
      />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-0 h-screen flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden bg-[#282828] shadow-sm px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-300 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-white">Tools Dashboard</h1>
          <div></div>
        </div>

        {/* Page content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {currentView === "fact-checker" && (
            <FactChecker />
          )}
          {currentView === "timestamp-generator" && (
            <div>
              <h2 className="text-2xl font-semibold text-white mb-6">Timestamp Generator</h2>
              {/* Timestamp generator content will be added here */}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
