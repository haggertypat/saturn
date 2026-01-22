"use client";

import { useEffect, useRef } from "react";

type ZenEditorProps = {
    value: string;
    onChange: (value: string) => void;
    onExit: () => void;
};

export default function ZenEditor({
                                      value,
                                      onChange,
                                      onExit,
                                  }: ZenEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    // Auto-grow textarea so the PAGE scrolls, not the textarea
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
        textareaRef.current?.focus();
    }, [value]);

    // ESC to exit zen mode
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onExit();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onExit]);

    return (
        <div
            className="
        fixed inset-0 z-50
        h-screen w-screen
        overflow-y-auto
        scrollbar-none
        bg-background text-gray-900
         dark:text-gray-100
      "
        >
            <div
                className="
          mx-auto
          max-w-[42rem]
          px-6
          py-24
          prose prose-neutral dark:prose-invert
        "
            >
        <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            autoComplete="off"
            className="
            block w-full
            resize-none
            bg-transparent
            border-none
            outline-none
            focus:outline-none
            font-inherit
            leading-inherit
            whitespace-pre-wrap
          "
        />
            </div>
        </div>
    );
}
