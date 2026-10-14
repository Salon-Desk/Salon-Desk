"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect } from "react";

import { cn } from "@/lib/utils";

export type TabItem = {
  label: string;
  value?: string;
};

type CustomTabWithoutContentProps = {
  tabs: TabItem[];
  activeTab: number;
  onTabChange: (index: number) => void;
  queryKey?: string;
  rightSlot?: ReactNode;
};

const CustomTabWithoutContent = ({
  tabs,
  activeTab,
  onTabChange,
  queryKey = "tab",
  rightSlot,
}: CustomTabWithoutContentProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const param = searchParams.get(queryKey);
    if (!param) {
      return;
    }

    const index = tabs.findIndex(
      (t) => (t.value ?? t.label.toLowerCase()) === param,
    );

    if (index >= 0 && index !== activeTab) {
      onTabChange(index);
    }
  }, [searchParams, queryKey, tabs, activeTab, onTabChange]);

  const handleTabChange = (index: number) => {
    onTabChange(index);

    const tabValue = tabs[index].value ?? tabs[index].label.toLowerCase();

    const params = new URLSearchParams(searchParams.toString());
    params.set(queryKey, tabValue);

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex w-full min-w-0 flex-col">
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
                </button>
              ))}
            </div>
          </div>

          <div className="shrink-0">{rightSlot}</div>
        </div>
      </div>
    </div>
  );
};

export default CustomTabWithoutContent;
