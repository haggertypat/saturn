// components/Button.tsx
import { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = {
    variant?: Variant;
    className?: string;
    href?: string;
} & (
    | ButtonHTMLAttributes<HTMLButtonElement>
    | AnchorHTMLAttributes<HTMLAnchorElement>
    );

export function Button({
                           children,
                           variant = "primary",
                           className = "",
                           href,
                           ...props
                       }: ButtonProps) {
    const styles = {
        primary:
            "cursor-pointer bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 px-4 py-2 rounded",
        secondary:
            "cursor-pointer border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 px-4 py-2 rounded",
        ghost:
            "cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 px-4 py-2 rounded",
        danger:
            "cursor-pointer border border-red-200 bg-white text-red-600 hover:border-red-300 hover:text-red-700 dark:border-red-500/60 dark:bg-neutral-900 dark:text-red-300 dark:hover:border-red-400 px-4 py-2 rounded",
    };



    const classes = `${styles[variant]} ${className}`;

    if (href) {
        return (
            <a href={href} className={classes} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
                {children}
            </a>
        );
    }

    return (
        <button className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
            {children}
        </button>
    );
}
