// src/components/ui/Button.tsx
import type { ButtonProps } from "../../types";

const Button = ({
  label,
  variant = "primary",
  className = "",
  type = "button",
  icon: Icon,
  iconPosition = "right",
  onClick,
}: ButtonProps) => {
  const base = "font-poppins font-medium px-2 py-3 text-sm capitalize tracking-widest transition-all rounded-xl cursor-pointer flex items-center justify-center shadow-sm";

  const styles = {
    primary: "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100",
    outline: "border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 bg-white dark:bg-transparent",
  };

  return (
    <button
      className={`${base} ${styles[variant]} ${Icon ? "gap-2" : ""} ${className}`.trim()}
      onClick={onClick}
      type={type}
    >
      {Icon && iconPosition === "left" && <Icon size={18} className="shrink-0" />}
      {label}
      {Icon && iconPosition === "right" && <Icon size={18} className="shrink-0" />}
    </button>
  );
};

export default Button;