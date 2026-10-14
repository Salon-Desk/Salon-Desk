import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  valueClassName?: string;
  className?: string;
};

export function StatCard({
  label,
  value,
  valueClassName,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "flex min-h-[97px] flex-col gap-3 rounded-lg border border-[#E5E7EB] bg-white p-5",
        className,
      )}
    >
      <p className="text-[13px] font-semibold leading-4 text-[#64748B]">
        {label}
      </p>
      <p
        className={cn(
          "text-2xl font-extrabold leading-[29px] tracking-tight text-[#111827]",
          valueClassName,
        )}
      >
        {value}
      </p>
    </div>
  );
}

export default StatCard;
