import { useState } from "react";

interface ExpandableValueProps {
  children: React.ReactNode;
  className?: string;
}

export default function ExpandableValue({ children, className = "" }: ExpandableValueProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <p
      className={`text-xl lg:text-2xl font-bold cursor-pointer transition-all ${expanded ? "whitespace-normal break-all" : "truncate"} ${className}`}
      onClick={() => setExpanded(!expanded)}
      title="Clique para expandir"
    >
      {children}
    </p>
  );
}
