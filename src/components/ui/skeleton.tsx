import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800 shimmer", className)}
      {...props}
    />
  );
}

export { Skeleton };
