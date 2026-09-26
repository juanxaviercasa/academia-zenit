import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface CourseProgressProps {
  value: number;
  variant?: "default" | "success";
  size?: "default" | "sm";
  className?: string;
  showText?: boolean;
}

const colorByVariant = {
  default: "text-indigo-400",
  success: "text-emerald-400",
};

const progressByVariant = {
  default: "default" as const,
  success: "success" as const,
};

const sizeByVariant = {
  default: "text-sm",
  sm: "text-xs",
};

export const CourseProgress = ({
  value,
  variant,
  size,
  className,
  showText = true,
}: CourseProgressProps) => {
  const isComplete = value >= 100;
  const currentVariant = variant || (isComplete ? "success" : "default");

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      <Progress
        className={cn("h-2 bg-slate-800", size === "sm" && "h-1.5")}
        value={value}
        variant={progressByVariant[currentVariant]}
      />
      {showText && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Progreso del curso</span>
          <span
            className={cn(
              "font-medium",
              colorByVariant[currentVariant],
              sizeByVariant[size || "default"]
            )}
          >
            {Math.round(value)}% Completado
          </span>
        </div>
      )}
    </div>
  );
};
