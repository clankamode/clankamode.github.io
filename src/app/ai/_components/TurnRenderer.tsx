'use client';

import { Message } from '@/types/chat';
import { TurnStack } from './TurnStack';
import { TurnCard, TurnCardLoading } from './TurnCard';
import { ArtifactCard } from './ArtifactCard';
import { TextCard } from './TextCard';
import { MODELS } from './constants';

interface TurnData {
    userMessage: Message | null;
    outputs: Message[];
}

function groupMessagesIntoTurns(messages: Message[]): TurnData[] {
    const turns: TurnData[] = [];
    let currentTurn: TurnData | null = null;

    for (const message of messages) {
        if (message.role === 'user') {
            if (currentTurn) {
                turns.push(currentTurn);
            }
            currentTurn = {
                userMessage: message,
                outputs: [],
            };
        } else {
            if (currentTurn) {
                currentTurn.outputs.push(message);
            } else {
                currentTurn = {
                    userMessage: null,
                    outputs: [message],
                };
            }
        }
    }

    if (currentTurn) {
        turns.push(currentTurn);
    }

    return turns;
}

function getOutputKind(message: Message): 'image' | 'text' {
    if (message.generatedImages && message.generatedImages.length > 0) {
        return 'image';
    }
    return 'text';
}

interface TurnRendererProps {
    messages: Message[];
    isLoading: boolean;
    selectedModel: string;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export function TurnRenderer({
    messages,
    isLoading,
    selectedModel,
    messagesEndRef,
}: TurnRendererProps) {
    const turns = groupMessagesIntoTurns(messages);

    const handleCopyPrompt = (content: string) => {
        navigator.clipboard.writeText(content);
    };

    const handleDownload = async (url: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `generated-image-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    const modelName = MODELS.find(m => m.id === selectedModel)?.name || selectedModel;

    return (
        <TurnStack>
            {turns.map((turn, turnIndex) => {
                const isLastTurn = turnIndex === turns.length - 1;
                const hasOutputs = turn.outputs.length > 0;

                // Handle prelude (system/assistant first) - no user prompt
                if (!turn.userMessage) {
                    return (
                        <div key={turnIndex} className="space-y-3">
                            {turn.outputs.map((output, outputIndex) => (
                                <TextCard
                                    key={`prelude-${turnIndex}-${outputIndex}`}
                                    content={output.content}
                                />
                            ))}
                        </div>
                    );
                }

                // Show loading state if this is the last turn with no outputs yet
                if (isLoading && isLastTurn && !hasOutputs) {
                    return (
                        <TurnCardLoading
                            key={turnIndex}
                            prompt={turn.userMessage.content}
                            model={modelName}
                        />
                    );
                }

                // Unified TurnCard with prompt header + outputs body
                return (
                    <TurnCard
                        key={turnIndex}
                        prompt={turn.userMessage.content}
                        model={modelName}
                        onCopy={() => handleCopyPrompt(turn.userMessage!.content)}
                    >
                        {hasOutputs ? (
                            <div className="space-y-4">
                                {turn.outputs.map((output, outputIndex) => {
                                    const kind = getOutputKind(output);

                                    if (kind === 'image' && output.generatedImages) {
                                        return (
                                            <ArtifactCard
                                                key={`output-${turnIndex}-${outputIndex}`}
                                                images={output.generatedImages.map((img, i) => ({
                                                    id: img.id || `img-${turnIndex}-${outputIndex}-${i}`,
                                                    url: img.url,
                                                    mimeType: img.mimeType,
                                                }))}
                                                onDownload={handleDownload}
                                            />
                                        );
                                    }

                                    return (
                                        <TextCard
                                            key={`output-${turnIndex}-${outputIndex}`}
                                            content={output.content}
                                            isStreaming={isLoading && isLastTurn && outputIndex === turn.outputs.length - 1}
                                            onCopy={() => navigator.clipboard.writeText(output.content)}
                                        />
                                    );
                                })}
                            </div>
                        ) : null}
                    </TurnCard>
                );
            })}

            <div ref={messagesEndRef} />
        </TurnStack>
    );
}
