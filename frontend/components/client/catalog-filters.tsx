"use client";

import { SearchInput, SegmentedControl } from "@/components/ui";
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
    <div className="sticky top-16 z-30 mb-6 bg-slate-50/95 py-3 backdrop-blur-md">
      <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xs md:flex-row">
        <SegmentedControl
          variant="pills"
          value={category}
          onChange={onCategoryChange}
          className="w-full overflow-x-auto scrollbar-none md:w-auto"
          options={SERVICE_CATEGORIES.map((cat) => ({
            value: cat,
            label: cat,
          }))}
        />

        <div className="flex w-full items-center justify-end gap-2 md:w-auto">
          <SearchInput
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search services or cuts..."
            className="flex-1 md:w-56"
          />
          <select
            value={sortBy}
            aria-label="Sort services catalog"
            onChange={(event) =>
              onSortChange(event.target.value as ServiceSort)
            }
            className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-700 text-xs focus:border-amber-500 focus:outline-hidden"
          >
            <option value="popular">Most Popular</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="duration">Fastest Duration</option>
          </select>
        </div>
      </div>
    </div>
  );
}
