"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useMemo } from "react";

import { cn } from "@/lib/utils";

type TabItem = {
  label: string;
  content: ReactNode;
  value?: string;
  count?: number;
};

type CustomTabProps = {
  tabs: TabItem[];
  defaultTab?: number;
  queryKey?: string;
  rightSlot?: ReactNode;
};

const CustomTab = ({
  tabs,
  defaultTab = 0,
  queryKey = "tab",
  rightSlot,
}: CustomTabProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = useMemo(() => {
    const param = searchParams.get(queryKey);
    if (!param) return defaultTab;

    const index = tabs.findIndex(
      (t) => (t.value ?? t.label.toLowerCase()) === param,
    );
    return index >= 0 ? index : defaultTab;
  }, [searchParams, queryKey, tabs, defaultTab]);

  const handleTabChange = (index: number) => {
    const tabValue = tabs[index].value ?? tabs[index].label.toLowerCase();
    const params = new URLSearchParams(searchParams.toString());
    params.set(queryKey, tabValue);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 w-full flex-col">
      <div className="sticky top-0 z-10 shrink-0 bg-background py-2">
        <div className="flex w-full min-w-0 items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="scrollbar-hide flex gap-3 overflow-x-auto whitespace-nowrap">
              {tabs.map((tab, index) => (
                <button
                  type="button"
                  key={tab.value ?? tab.label}
                  onClick={() => handleTabChange(index)}
                  className={cn(
                    "flex shrink-0 cursor-pointer items-center rounded-2xl border-b-2 border-transparent px-4 py-2.5 text-[16px] transition",
                    index === activeTab
                      ? "bg-primary font-semibold text-white"
                      : "border border-light-text bg-background font-normal text-foreground",
                  )}
                >
                  {tab.label}
                  {tab.count !== undefined &&
                    tab.count !== null &&
                    tab.count !== 0 && (
                      <span className="ml-2 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-extrabold text-white">
                        {tab.count}
                      </span>
                    )}
                </button>
              ))}
            </div>
          </div>

          <div className="shrink-0">{rightSlot}</div>
        </div>
      </div>

      <div className="scrollbar-hide z-0 min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto pt-4">
        {tabs[activeTab]?.content}
      </div>
    </div>
  );
};

export default CustomTab;
