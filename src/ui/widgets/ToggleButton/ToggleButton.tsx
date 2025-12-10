import React from "react";
import "./ToggleButton.css";

export type ToggleButtonSize = "sm" | "md" | "lg";

export interface ToggleButtonProps {
  label: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
  tabIndex?: number;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({
  label,
  active = false,
  disabled = false,
  className,
  onClick,
  ariaLabel,
  tabIndex,
}) => {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`toggle-button ${active ? "active" : ""} ${className || ""}`.trim()}
      onClick={onClick}
      tabIndex={tabIndex}
    >
      {label}
    </button>
  );
};

export default ToggleButton;
