"use client"

import { useState } from "react"

export default function FactChecker() {
    const [text, setText] = useState("")
    const [isChecking, setIsChecking] = useState(false)
    const [results, setResults] = useState<string[]>([])

    const handleCheck = async () => {
        if (!text.trim()) return
        
        setIsChecking(true)
        try {
            const response = await fetch('/api/fact-check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to check facts');
            }

            // Split the results by bullet points and filter out empty lines
            const factResults = data.results
                .split('\n')
                .map((line: string) => line.trim())
                .filter((line: string) => line.length > 0);

            setResults(factResults);
        } catch (error) {
            console.error('Error checking facts:', error);
            setResults(['Error: Failed to check facts. Please try again.']);
        } finally {
            setIsChecking(false)
        }
    }

    return (
        <div className="w-full">
            <div className="bg-[#282828] rounded-lg p-6 shadow-lg">
                <div className="mb-6">
                    <label htmlFor="text" className="block text-sm font-medium text-gray-300 mb-2">
                        Paste your YouTube video transcript here
                    </label>
                    <textarea
                        id="text"
                        rows={4}
                        className="w-full px-3 py-2 bg-[#1a1a1a] text-white rounded-lg border border-gray-600 focus:border-[#2cbb5d] focus:ring-1 focus:ring-[#2cbb5d] focus:outline-none transition-colors"
                        placeholder="Paste your video transcript here. Include timestamps if available..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                </div>

                <button
                    onClick={handleCheck}
                    disabled={isChecking || !text.trim()}
                    className={`w-full bg-[#2cbb5d] text-white px-4 py-2 rounded-lg font-medium transition-colors
                        ${isChecking || !text.trim() 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-[#25a24f]'
                        }`}
                >
                    {isChecking ? 'Checking...' : 'Check Video Facts'}
                </button>
            </div>

            {results.length > 0 && (
                <div className="mt-6 bg-[#282828] rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-medium text-white mb-4">Results</h3>
                    <div className="space-y-4">
                        {results.map((result, index) => (
                            <div 
                                key={index}
                                className="p-4 bg-[#1a1a1a] rounded-lg border border-gray-600"
                            >
                                <p className="text-gray-300">{result}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
