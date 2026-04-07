import { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={["sc-input", className].filter(Boolean).join(" ")}
    {...props}
  />
));

Input.displayName = "Input";
