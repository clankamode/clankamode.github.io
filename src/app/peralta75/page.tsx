"use client"

import { useState, useEffect } from "react"
import { PERALTA_75_LIST, QuestionCategory } from "./consts"

import type { LeetCodeQuestion } from './consts';

// Add custom keyframes for the gradient animation
const gradientAnimation = `
@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
`;

export default function Component() {
  const [isVisible, setIsVisible] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [solvedQuestions, setSolvedQuestions] = useState<Set<number>>(new Set())

  // Load solved questions from localStorage on mount
  useEffect(() => {
    setIsVisible(true);
    const savedSolved = localStorage.getItem('solvedQuestions');
    if (savedSolved) {
      setSolvedQuestions(new Set(JSON.parse(savedSolved)));
    }
  }, []);

  // Save solved questions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('solvedQuestions', JSON.stringify([...solvedQuestions]));
  }, [solvedQuestions]);

  const toggleSolved = (questionId: number, event: React.MouseEvent) => {
    event.preventDefault(); // Prevent the category from expanding/collapsing
    event.stopPropagation(); // Prevent event bubbling
    setSolvedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const groupedQuestions = PERALTA_75_LIST.reduce(
    (acc, question) => {
      if (!acc[question.category]) {
        acc[question.category] = []
      }
      acc[question.category].push(question)
      return acc
    },
    {} as Record<string, LeetCodeQuestion[]>,
  )

  // Define the order of categories
  const categoryOrder = [
    QuestionCategory.ARRAYS_STRINGS,
    QuestionCategory.BACKTRACKING_DP,
    QuestionCategory.LINKED_LISTS,
    QuestionCategory.TREES,
    QuestionCategory.GRAPHS,
    QuestionCategory.DESIGN
  ]

  // Sort categories based on the predefined order
  const sortedCategories = Object.keys(groupedQuestions).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a as QuestionCategory)
    const indexB = categoryOrder.indexOf(b as QuestionCategory)
    return indexA - indexB
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-[#2cbb5d]/10 text-[#2cbb5d]"
      case "Medium":
        return "bg-yellow-500/10 text-yellow-500"
      case "Hard":
        return "bg-red-500/10 text-red-500"
      default:
        return "bg-gray-500/10 text-gray-400"
    }
  }

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
        newExpanded.delete(category)
    } else {
        newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }
  return (
    <>
      <style>{gradientAnimation}</style>
      <div className="min-h-screen bg-[#1a1a1a]">
        <div className="container mx-auto px-4 py-8 max-w-4xl">

          {/* Epic Header */}
          <div className="relative">
            {/* Animated Gradient Background */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-[#2cbb5d]/20 via-[#1a1a1a] to-[#1a1a1a] rounded-3xl -z-10
                animate-[gradient-shift_12s_ease-in-out_infinite] bg-[length:200%_200%]" 
            />
            
            {/* Content with staggered animations */}
            <div className="text-center py-12 px-6">
              {/* Title with animated gradient */}
              <h1 
                className={`text-6xl font-black mb-6 text-transparent bg-clip-text 
                  bg-gradient-to-r from-[#2cbb5d] via-[#25a24f] to-[#2cbb5d] bg-[length:200%_auto]
                  animate-[gradient-shift_12s_ease-in-out_infinite]
                  transition-all duration-1500 transform
                  ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
              >
                PERALTA 75
              </h1>
              
              {/* Subtitle with fade-in and slide-up */}
              <div className="max-w-3xl mx-auto space-y-6">
                <p 
                  className={`text-xl text-gray-300 font-medium leading-relaxed
                    transition-all duration-1500 delay-450 transform
                    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                >
                  After solving 650+ LeetCode problems, reaching the top 0.5% of LeetCode users worldwide, and landing offers at Meta, Amazon, Bloomberg, 
                  and various Silicon Valley startups - I&apos;ve decided to curate a list of questions that were pivotal in my algorthmic journey.
                </p>

                <p 
                  className={`text-xl text-gray-300 font-medium leading-relaxed
                    transition-all duration-1500 delay-450 transform
                    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                >
                    No gotchas, no obscure tricks – just pure, practical problems that will transform how you think about coding and prepare you for any technical interview.
                </p>

                {/* Animated underline */}
                <div 
                  className={`h-1 w-24 mx-auto bg-gradient-to-r from-[#2cbb5d] to-[#25a24f]
                    transition-all duration-1500 delay-750 transform origin-left
                    ${isVisible ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'}`}
                />
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className={`mb-4 transition-all duration-1000 transform
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
          >
            <div className="bg-[#282828] rounded-lg border border-[#3e3e3e] p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-white">Progress</span>
                  <span className="text-sm text-gray-400">
                    {solvedQuestions.size} / {PERALTA_75_LIST.length} problems solved
                  </span>
                </div>
                <span className="text-lg font-semibold text-[#2cbb5d]">
                  {Math.round((solvedQuestions.size / PERALTA_75_LIST.length) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#2cbb5d] rounded-full transition-all duration-500 ease-out"
                  style={{ 
                    width: `${(solvedQuestions.size / PERALTA_75_LIST.length) * 100}%`,
                    backgroundImage: 'linear-gradient(90deg, #2cbb5d 0%, #25a24f 100%)'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {sortedCategories.map((category) => (
              <div key={category} className="bg-[#282828] rounded-lg border border-[#3e3e3e] shadow-sm">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full p-6 hover:bg-[#1a1a1a] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Animated Chevron */}
                      <div 
                        className={`w-6 h-6 flex items-center justify-center transition-transform duration-300
                          ${expandedCategories.has(category) ? 'rotate-180' : 'rotate-0'}`}
                      >
                        <svg 
                          className="w-5 h-5 text-gray-400" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-white">{category}</h3>
                      <span className="ml-2 px-2 py-1 text-xs font-medium bg-[#1a1a1a] text-gray-400 rounded-full">
                        {groupedQuestions[category].length}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {["Easy", "Medium", "Hard"].map((difficulty) => {
                        const count = groupedQuestions[category].filter((q) => q.difficulty === difficulty).length
                        if (count === 0) return null
                        return (
                          <span
                            key={difficulty}
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(difficulty)}`}
                          >
                            {count}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </button>

                {/* Category Content */}
                {expandedCategories.has(category) && (
                  <div className="px-6 pb-6">
                    <div className="space-y-2">
                      {groupedQuestions[category].map((question) => (
                        <div
                          key={question.id}
                          className={`bg-[#1a1a1a] rounded-lg border border-[#3e3e3e] hover:border-[#2cbb5d] transition-colors
                            ${solvedQuestions.has(question.id) ? 'opacity-60' : ''}`}
                        >
                          <div className="p-3">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                {/* Checkbox */}
                                <button
                                  onClick={(e) => toggleSolved(question.id, e)}
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                                    transition-colors duration-200
                                    ${solvedQuestions.has(question.id) 
                                      ? 'bg-[#2cbb5d] border-[#2cbb5d]' 
                                      : 'border-gray-500 hover:border-[#2cbb5d]'}`}
                                >
                                  {solvedQuestions.has(question.id) && (
                                    <svg 
                                      className="w-3 h-3 text-white" 
                                      fill="none" 
                                      stroke="currentColor" 
                                      viewBox="0 0 24 24"
                                    >
                                      <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={3} 
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  )}
                                </button>
                                <div className="min-w-0">
                                  <h4 className={`font-medium truncate ${
                                    solvedQuestions.has(question.id) 
                                      ? 'text-gray-500 line-through' 
                                      : 'text-white'
                                  }`}>
                                    {question.title}
                                  </h4>
                                </div>
                                <a
                                  href={question.leetcodeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-shrink-0 text-gray-400 hover:text-[#ffa116] transition-colors duration-200"
                                  title="View on LeetCode"
                                >
                                  <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6m0 0v6m0-6L10 14"
                                    />
                                  </svg>
                                </a>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(
                                    question.difficulty,
                                  )}`}
                                >
                                  {question.difficulty}
                                </span>
                                {/* <a
                                  href={question.leetcodeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium text-white bg-[#2cbb5d] hover:bg-[#25a24f] rounded-md transition-colors"
                                >
                                  Solve
                                </a> */}
                                {/* LeetCode Link Icon */}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
