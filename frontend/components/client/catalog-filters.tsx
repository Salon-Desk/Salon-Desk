"use client";

import { ArrowUpDown, Search, X } from "lucide-react";
import { SERVICE_CATEGORIES } from "@/lib/data/catalog";

export type ServiceSort =
  | "popular"
  | "price-asc"
  | "price-desc"
  | "duration"
  | "rating";

interface CatalogFiltersProps {
  category: string;
  onCategoryChange: (category: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortBy: ServiceSort;
  onSortChange: (sort: ServiceSort) => void;
}

export function CatalogFilters({
  category,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
}: CatalogFiltersProps) {
  return (
    <div className="sticky top-16 z-30 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 py-2.5 backdrop-blur-xl bg-slate-50/90 transition-all">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white/95 p-3 shadow-sm backdrop-blur-md">
        {/* Top bar: Category Pills (Horizontal scrolling on mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none snap-x">
          {SERVICE_CATEGORIES.map((cat) => {
            const isSelected = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(cat)}
                className={`snap-start shrink-0 rounded-full px-3.5 py-1.5 font-medium text-xs transition-all duration-200 ${
                  isSelected
                    ? "bg-amber-500 font-bold text-slate-950 shadow-sm shadow-amber-500/20 scale-102"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Bottom bar: Search & Sort controls */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search treatments, cuts, or styles..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 transition-colors focus:border-amber-500 focus:bg-white focus:outline-hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="relative shrink-0">
            <select
              value={sortBy}
              aria-label="Sort services catalog"
              onChange={(event) =>
                onSortChange(event.target.value as ServiceSort)
              }
              className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2 pl-7 pr-7 font-semibold text-slate-700 text-xs transition-colors hover:bg-slate-100 focus:border-amber-500 focus:outline-hidden"
            >
              <option value="popular">Popular</option>
              <option value="price-asc">Price: Low</option>
              <option value="price-desc">Price: High</option>
              <option value="duration">Fastest</option>
            </select>
            <ArrowUpDown className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
