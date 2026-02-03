'use client';

import { useState, useRef, useEffect } from 'react';

interface Model {
    id: string;
    name: string;
}

interface ModelSelectorProps {
    models: readonly Model[];
    selectedModel: string;
    onSelect: (modelId: string) => void;
    disabled?: boolean;
}

export function ModelSelector({
    models,
    selectedModel,
    onSelect,
    disabled = false,
}: ModelSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedModelData = models.find((m) => m.id === selectedModel);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (modelId: string) => {
        onSelect(modelId);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`flex items-center gap-2 text-xl md:text-2xl font-medium transition-all duration-200 ${disabled
                        ? 'text-muted-foreground cursor-not-allowed opacity-50'
                        : 'text-foreground hover:text-white cursor-pointer'
                    }`}
            >
                <span>{selectedModelData?.name || 'Select Model'}</span>
                <svg
                    className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 rounded-xl border border-white/10 bg-[#18181b]/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-1">
                        {models.map((model) => (
                            <button
                                key={model.id}
                                type="button"
                                onClick={() => handleSelect(model.id)}
                                className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between group ${model.id === selectedModel
                                        ? 'bg-white/10 text-white'
                                        : 'text-muted-foreground hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <span className="font-medium">{model.name}</span>
                                {model.id === selectedModel && (
                                    <svg className="w-4 h-4 text-brand-green" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
