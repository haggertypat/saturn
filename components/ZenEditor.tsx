"use client";

import type { MouseEvent } from "react";
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

    const moveCursorToClick = (event: MouseEvent<HTMLDivElement>) => {
        const textarea = textareaRef.current;
        if (!textarea || event.target === textarea) return;

        event.preventDefault();
        event.stopPropagation();

        const rect = textarea.getBoundingClientRect();
        const styles = window.getComputedStyle(textarea);
        const lineHeightValue = parseFloat(styles.lineHeight);
        const fontSizeValue = parseFloat(styles.fontSize);
        const lineHeight = Number.isNaN(lineHeightValue)
            ? fontSizeValue * 1.2
            : lineHeightValue;
        const paddingTop = parseFloat(styles.paddingTop) || 0;

        const clickY = event.clientY;
        const relativeY = clickY - rect.top - paddingTop;

        const focusAndSetSelection = (start: number, end: number) => {
            textarea.focus();
            requestAnimationFrame(() => {
                textarea.setSelectionRange(start, end);
            });
        };

        if (relativeY <= 0) {
            focusAndSetSelection(0, 0);
            return;
        }

        const lines = value.split("\n");
        const maxLineIndex = Math.max(0, lines.length - 1);
        const lineIndex = Math.min(
            maxLineIndex,
            Math.floor(relativeY / lineHeight),
        );
        const contentHeight = lines.length * lineHeight;

        if (relativeY >= contentHeight || lineIndex >= lines.length) {
            focusAndSetSelection(value.length, value.length);
            return;
        }

        let cursorIndex = 0;
        for (let i = 0; i < lineIndex; i += 1) {
            const line = lines[i] ?? "";
            cursorIndex += line.length + 1;
        }
        cursorIndex = Math.min(cursorIndex, value.length);

        focusAndSetSelection(cursorIndex, cursorIndex);
    };

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
            onMouseDownCapture={moveCursorToClick}
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
