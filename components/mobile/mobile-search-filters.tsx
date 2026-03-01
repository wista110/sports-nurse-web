'use client';

import { useState } from 'react';
import { Filter, X, MapPin, Calendar, Yen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';

interface SearchFilters {
  keyword: string;
  prefecture: string;
  category: string;
  minCompensation: string;
  maxCompensation: string;
  startDate: string;
  endDate: string;
  isUrgent: boolean;
}

interface MobileSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  activeFilterCount: number;
}

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

const CATEGORIES = [
  'サッカー', 'バスケットボール', 'バレーボール', 'テニス', '野球',
  'ソフトボール', 'ラグビー', 'ハンドボール', 'バドミントン', '卓球',
  '陸上競技', '水泳', '体操', '柔道', '剣道', '空手', 'その他'
];

export function MobileSearchFilters({
  filters,
  onFiltersChange,
  onSearch,
  activeFilterCount
}: MobileSearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleFilterChange = (key: keyof SearchFilters, value: string | boolean) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onSearch();
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters: SearchFilters = {
      keyword: '',
      prefecture: '',
      category: '',
      minCompensation: '',
      maxCompensation: '',
      startDate: '',
      endDate: '',
      isUrgent: false,
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    onSearch();
    setIsOpen(false);
  };

  return (
    <div className="space-y-3">
      {/* 検索バー */}
      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <Input
            placeholder="求人を検索..."
            value={filters.keyword}
            onChange={(e) => onFiltersChange({ ...filters, keyword: e.target.value })}
            className="pr-10"
          />
          <Button
            size="sm"
            onClick={onSearch}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2"
          >
            検索
          </Button>
        </div>
      </div>

      {/* フィルターボタン */}
      <div className="flex items-center justify-between">
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              フィルター
              {activeFilterCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </DrawerTrigger>

          <DrawerContent className="max-h-[80vh]">
            <DrawerHeader>
              <DrawerTitle>検索フィルター</DrawerTitle>
            </DrawerHeader>

            <div className="px-4 pb-4 space-y-4 overflow-y-auto">
              {/* 地域 */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>地域</span>
                </Label>
                <Select
                  value={localFilters.prefecture}
                  onValueChange={(value) => handleFilterChange('prefecture', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="都道府県を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">すべての地域</SelectItem>
                    {PREFECTURES.map(prefecture => (
                      <SelectItem key={prefecture} value={prefecture}>
                        {prefecture}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* カテゴリー */}
              <div className="space-y-2">
                <Label>スポーツカテゴリー</Label>
                <Select
                  value={localFilters.category}
                  onValueChange={(value) => handleFilterChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="カテゴリーを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">すべてのカテゴリー</SelectItem>
                    {CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 報酬 */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-1">
                  <Yen className="h-4 w-4" />
                  <span>報酬</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="number"
                      placeholder="最低額"
                      value={localFilters.minCompensation}
                      onChange={(e) => handleFilterChange('minCompensation', e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="最高額"
                      value={localFilters.maxCompensation}
                      onChange={(e) => handleFilterChange('maxCompensation', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* 日程 */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>開催日程</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="date"
                      value={localFilters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      type="date"
                      value={localFilters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* 急募 */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="urgent"
                  checked={localFilters.isUrgent}
                  onChange={(e) => handleFilterChange('isUrgent', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="urgent">急募のみ表示</Label>
              </div>

              {/* アクションボタン */}
              <div className="flex space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="flex-1"
                >
                  クリア
                </Button>
                <Button
                  onClick={handleApplyFilters}
                  className="flex-1"
                >
                  適用
                </Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>

        {/* アクティブフィルター表示 */}
        {activeFilterCount > 0 && (
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <span>{activeFilterCount}個のフィルター適用中</span>
          </div>
        )}
      </div>
    </div>
  );
}