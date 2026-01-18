'use client'

import { useEffect, useRef } from 'react';

// Hook to auto-grow textarea height
function useAutoGrow(value: string) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    }, [value]);

    return textareaRef;
}

interface ZenEditorProps {
    value: string;
    onChange: (value: string) => void;
    onExit: () => void;
}

export default function ZenEditor({ value, onChange, onExit }: ZenEditorProps) {
    const textareaRef = useAutoGrow(value);

    useEffect(() => {
        // Focus textarea on mount
        textareaRef.current?.focus();

        // Handle ESC key to exit
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onExit();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onExit]);

    // Prevent body scroll when mounted
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-[var(--bg)] overflow-y-auto overflow-x-hidden scrollbar-hide">
            <div className="min-h-screen py-[40vh] px-6">
                <div className="max-w-2xl mx-auto">
                    <div className="prose dark:prose-invert max-w-none">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full resize-none border-0 bg-transparent p-0 outline-none ring-0 focus:ring-0 focus:outline-none"
                style={{
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    lineHeight: 'inherit',
                    color: 'inherit',
                }}
                spellCheck={false}
                autoCorrect="off"
                autoComplete="off"
                autoCapitalize="off"
                rows={1}
            />
                    </div>
                </div>
            </div>

            <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
        </div>
    );
}