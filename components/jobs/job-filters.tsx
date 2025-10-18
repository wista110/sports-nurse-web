"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PREFECTURES } from "@/lib/validations/profile";

const SPORT_CATEGORIES = [
  "サッカー", "野球", "バスケットボール", "バレーボール", "テニス",
  "陸上競技", "水泳", "体操", "柔道", "剣道", "ラグビー", "ゴルフ",
  "マラソン", "トライアスロン", "その他"
];

const COMPENSATION_TYPES = [
  { value: "hourly", label: "時給" },
  { value: "fixed", label: "固定額" },
];

export function JobFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    prefecture: searchParams.get("prefecture") || "",
    city: searchParams.get("city") || "",
    categories: searchParams.get("categories")?.split(",") || [],
    compensationType: searchParams.get("compensationType") || "",
    minCompensation: searchParams.get("minCompensation") || "",
    maxCompensation: searchParams.get("maxCompensation") || "",
    startDate: searchParams.get("startDate") || "",
    endDate: searchParams.get("endDate") || "",
  });

  const handleFilterChange = (key: string, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    handleFilterChange("categories", newCategories);
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        if (Array.isArray(value) && value.length > 0) {
          params.set(key, value.join(","));
        } else if (typeof value === "string" && value.trim()) {
          params.set(key, value.trim());
        }
      }
    });

    router.push(`/jobs?${params.toString()}`);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      prefecture: "",
      city: "",
      categories: [],
      compensationType: "",
      minCompensation: "",
      maxCompensation: "",
      startDate: "",
      endDate: "",
    });
    router.push("/jobs");
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <Label htmlFor="search">キーワード検索</Label>
        <Input
          id="search"
          placeholder="求人タイトルや内容で検索"
          value={filters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
          className="mt-1"
        />
      </div>

      {/* Location */}
      <div className="space-y-3">
        <Label>勤務地</Label>
        <Select
          value={filters.prefecture}
          onValueChange={(value) => handleFilterChange("prefecture", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="都道府県を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">すべて</SelectItem>
            {PREFECTURES.map((prefecture) => (
              <SelectItem key={prefecture} value={prefecture}>
                {prefecture}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Input
          placeholder="市区町村"
          value={filters.city}
          onChange={(e) => handleFilterChange("city", e.target.value)}
        />
      </div>

      {/* Date Range */}
      <div className="space-y-3">
        <Label>開催日</Label>
        <div className="space-y-2">
          <Input
            type="date"
            placeholder="開始日"
            value={filters.startDate}
            onChange={(e) => handleFilterChange("startDate", e.target.value)}
          />
          <Input
            type="date"
            placeholder="終了日"
            value={filters.endDate}
            onChange={(e) => handleFilterChange("endDate", e.target.value)}
          />
        </div>
      </div>

      {/* Sport Categories */}
      <div>
        <Label className="text-sm font-medium">スポーツカテゴリ</Label>
        <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
          {SPORT_CATEGORIES.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={category}
                checked={filters.categories.includes(category)}
                onCheckedChange={() => handleCategoryToggle(category)}
              />
              <Label htmlFor={category} className="text-sm font-normal">
                {category}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Compensation */}
      <div className="space-y-3">
        <Label>報酬</Label>
        <Select
          value={filters.compensationType}
          onValueChange={(value) => handleFilterChange("compensationType", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="報酬タイプ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">すべて</SelectItem>
            {COMPENSATION_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="最低額"
            value={filters.minCompensation}
            onChange={(e) => handleFilterChange("minCompensation", e.target.value)}
          />
          <Input
            type="number"
            placeholder="最高額"
            value={filters.maxCompensation}
            onChange={(e) => handleFilterChange("maxCompensation", e.target.value)}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-4 border-t">
        <Button onClick={applyFilters} className="w-full">
          検索
        </Button>
        <Button onClick={clearFilters} variant="outline" className="w-full">
          条件をクリア
        </Button>
      </div>
    </div>
  );
}