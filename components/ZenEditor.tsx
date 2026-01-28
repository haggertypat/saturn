"use client";

import type { ChangeEvent, MouseEvent } from "react";
import { useEffect, useLayoutEffect, useRef } from "react";

type ZenEditorProps = {
    title: string;
    onTitleChange: (value: string) => void;
    value: string;
    onChange: (value: string) => void;
    onExit: () => void;
};

export default function ZenEditor({
                                      title,
                                      onTitleChange,
                                      value,
                                      onChange,
                                      onExit,
                                  }: ZenEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const scrollPositionRef = useRef<number | null>(null);

    const moveCursorToClick = (event: MouseEvent<HTMLDivElement>) => {
        const textarea = textareaRef.current;
        if (!textarea || event.target === textarea) return;
        if (
            event.target instanceof HTMLElement &&
            event.target.closest('[data-zen-ignore="true"]')
        ) {
            return;
        }

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
    useLayoutEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;

        const container = scrollContainerRef.current;
        const snapshot = scrollPositionRef.current;
        if (container !== null && snapshot !== null) {
            container.scrollTop = snapshot;
        }
    }, [value]);

    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

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

    const snapshotScrollPosition = () => {
        const container = scrollContainerRef.current;
        if (container) {
            scrollPositionRef.current = container.scrollTop;
        }
    };

    const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        if (scrollPositionRef.current === null) {
            snapshotScrollPosition();
        }
        onChange(event.target.value);
    };

    return (
        <div
            ref={scrollContainerRef}
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
          pb-[70vh]
          prose prose-neutral dark:prose-invert
        "
            >
                <div className="mb-6" data-zen-ignore="true">
                    <input
                        id="title"
                        type="text"
                        maxLength={250}
                        value={title}
                        onChange={(e) => onTitleChange(e.target.value)}
                        placeholder="Untitled"
                        className="
                        entry-title
                        bg-transparent
                        border-none
                        outline-none
                        p-0
                        w-full
                        text-neutral-900 dark:text-neutral-100
                        placeholder:text-gray-400 dark:placeholder:text-neutral-500
                        "
                    />
                </div>
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={handleChange}
                    onBeforeInput={snapshotScrollPosition}
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
