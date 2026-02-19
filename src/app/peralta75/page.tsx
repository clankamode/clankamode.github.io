"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
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
        return "bg-brand-green/10 text-brand-green border-brand-green/20"
      case "Medium":
        return "bg-brand-amber/10 text-brand-amber border-brand-amber/20"
      case "Hard":
        return "bg-brand-gold/10 text-brand-gold border-brand-gold/20"
      default:
        return "bg-muted text-muted-foreground border-transparent"
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
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-8 max-w-4xl">

          {/* Epic Header */}
          <div className="relative">
            {/* Animated Gradient Background */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-brand-green/10 via-background to-background rounded-3xl -z-10
                animate-[gradient-shift_12s_ease-in-out_infinite] bg-[length:200%_200%]"
            />

            {/* Content with staggered animations */}
            <div className="text-center py-12 px-6">
              {/* Title with animated gradient */}
              <h1
                className={`text-7xl font-black mb-6 text-foreground font-sans tracking-tighter
                  transition-all duration-1500 transform
                  ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
              >
                PERALTA <span className="text-brand-green">75</span>
              </h1>

              {/* Subtitle with fade-in and slide-up */}
              <div className="max-w-3xl mx-auto space-y-6 text-muted-foreground">
                <p
                  className={`text-2xl font-medium leading-relaxed
                    transition-all duration-1500 delay-450 transform
                    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                >
                  After solving 650+ LeetCode problems, reaching the top 0.5% of LeetCode users worldwide, and landing offers at Meta, Amazon, Bloomberg,
                  and various Silicon Valley startups - I&apos;ve decided to curate a list of questions that were pivotal in my algorthmic journey.
                </p>

                <p
                  className={`text-2xl font-medium leading-relaxed
                    transition-all duration-1500 delay-450 transform
                    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                >
                  No gotchas, no obscure tricks – just pure, practical problems that will transform how you think about coding and prepare you for any technical interview.
                </p>

                {/* Animated underline */}
                <div
                  className={`h-1 w-24 mx-auto bg-brand-green
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
            <div className="bg-surface-1 backdrop-blur-md rounded-xl border border-border-subtle p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-foreground tracking-tight">Progress</span>
                  <span className="text-lg text-muted-foreground font-mono">
                    {solvedQuestions.size} / {PERALTA_75_LIST.length}
                  </span>
                </div>
                <span className="text-xl font-bold text-brand-green drop-shadow-[0_0_8px_rgba(44,187,93,0.5)]">
                  {Math.round((solvedQuestions.size / PERALTA_75_LIST.length) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-border-subtle rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-green rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(44,187,93,0.5)]"
                  style={{
                    width: `${(solvedQuestions.size / PERALTA_75_LIST.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {sortedCategories.map((category) => (
              <div key={category} className="bg-surface-1 backdrop-blur-md rounded-xl border border-border-subtle shadow-sm overflow-hidden transition-all duration-300 hover:border-border-interactive">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full p-6 hover:bg-surface-interactive transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Animated Chevron */}
                      <div
                        className={`w-8 h-8 flex items-center justify-center rounded-full bg-surface-interactive transition-all duration-300 group-hover:bg-brand-green/20 group-hover:text-brand-green
                          ${expandedCategories.has(category) ? 'rotate-180 bg-brand-green/20 text-brand-green' : 'rotate-0 text-muted-foreground'}`}
                      >
                        <svg
                          className="w-5 h-5"
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
                      <h3 className="text-2xl font-bold text-foreground font-display tracking-tight group-hover:text-brand-green transition-colors">{category}</h3>
                      <span className={`px-2.5 py-0.5 text-sm font-mono font-medium rounded-full transition-colors
                        ${expandedCategories.has(category) ? 'bg-brand-green/20 text-brand-green' : 'bg-surface-interactive text-muted-foreground'}`}>
                        {groupedQuestions[category].length}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {["Easy", "Medium", "Hard"].map((difficulty) => {
                        const count = groupedQuestions[category].filter((q) => q.difficulty === difficulty).length
                        if (count === 0) return null
                        return (
                          <span
                            key={difficulty}
                            className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-full border ${getDifficultyColor(difficulty)} bg-opacity-10 backdrop-blur-sm`}
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
                  <div className="px-6 pb-6 bg-surface-workbench">
                    <div className="space-y-3 pt-4">
                      {groupedQuestions[category].map((question) => (
                        <div
                          key={question.id}
                          className={`rounded-lg border transition-all duration-300 group
                            ${solvedQuestions.has(question.id)
                              ? 'bg-brand-green/5 border-brand-green/20 opacity-70 hover:opacity-100'
                              : 'bg-surface-1 border-border-subtle hover:border-brand-green/30 hover:bg-surface-interactive hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)]'}`}
                        >
                          <div className="p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                {/* Checkbox */}
                                <button
                                  onClick={(e) => toggleSolved(question.id, e)}
                                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0
                                    transition-all duration-300
                                    ${solvedQuestions.has(question.id)
                                      ? 'bg-brand-green border-brand-green shadow-[0_0_10px_rgba(44,187,93,0.4)]'
                                      : 'border-muted-foreground/50 hover:border-brand-green hover:shadow-[0_0_10px_-2px_rgba(44,187,93,0.3)]'}`}
                                >
                                  {solvedQuestions.has(question.id) && (
                                    <svg
                                      className="w-3.5 h-3.5 text-white"
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
                                  <h4 className={`font-medium truncate font-sans text-lg transition-colors ${solvedQuestions.has(question.id)
                                    ? 'text-muted-foreground line-through decoration-brand-green/50'
                                    : 'text-foreground group-hover:text-brand-green'
                                    }`}>
                                    {question.title}
                                  </h4>
                                </div>
                                <Link
                                  href={`/code-editor/practice/${question.id}`}
                                  className="flex-shrink-0 px-3 py-1 text-xs font-semibold rounded-md bg-brand-green/10 text-brand-green border border-brand-green/20 hover:bg-brand-green/20 transition-all duration-200 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0"
                                  title="Solve in Code Editor"
                                >
                                  Solve
                                </Link>
                                <a
                                  href={question.leetcodeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-shrink-0 text-muted-foreground hover:text-text-primary transition-all duration-200 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0"
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
                                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                    />
                                  </svg>
                                </a>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <span
                                  className={`px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full border bg-opacity-10 ${getDifficultyColor(
                                    question.difficulty,
                                  )}`}
                                >
                                  {question.difficulty}
                                </span>
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
