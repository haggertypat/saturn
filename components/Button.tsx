// components/Button.tsx
import { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

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
            "cursor-pointer bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 px-4 py-2 rounded",
        secondary:
            "cursor-pointer border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 px-4 py-2 rounded",
        ghost:
            "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 px-4 py-2 rounded",
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
