import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export type PreloaderProps = {
  fullScreen?: boolean;
  className?: string;
};

export function Preloader({ fullScreen, className }: PreloaderProps) {
  return (
    <output
      className={cn(
        "flex items-center justify-center",
        fullScreen && "fixed inset-0 z-50 bg-background/80",
        className,
      )}
      aria-live="polite"
      aria-label="Loading"
    >
      <Spinner className="size-8" />
    </output>
  );
}

export default Preloader;
