type Props = {
  size?: "default" | "lg";
  className?: string;
};

export function LogoMark({ size = "default", className = "" }: Props) {
  return (
    <div
      className={`logo-mark ${size === "lg" ? "logo-mark-lg" : ""} ${className}`.trim()}
    >
      ×
    </div>
  );
}
