import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "destructive" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: "sc-btn-primary",
  secondary: "sc-btn-secondary",
  destructive: "sc-btn-destructive",
  outline: "sc-btn-outline",
  ghost: "sc-btn-ghost",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "sc-btn-sm",
  md: "",
  lg: "sc-btn-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, ...props }, ref) => {
    const classes = [
      "sc-btn",
      variantClass[variant],
      sizeClass[size],
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
