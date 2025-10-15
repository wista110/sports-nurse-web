"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  organizerProfileSchema,
  PREFECTURES,
  type OrganizerProfileInput,
} from "@/lib/validations/profile";

interface OrganizerProfileFormProps {
  initialData?: Partial<OrganizerProfileInput>;
  onSubmit: (data: OrganizerProfileInput) => Promise<void>;
  isLoading?: boolean;
}

const ORGANIZATION_TYPES = [
  { value: "sports_club", label: "スポーツクラブ・チーム" },
  { value: "school", label: "学校・教育機関" },
  { value: "municipality", label: "自治体・公共機関" },
  { value: "private_company", label: "民間企業" },
  { value: "npo", label: "NPO・非営利団体" },
  { value: "other", label: "その他" },
] as const;

export function OrganizerProfileForm({
  initialData,
  onSubmit,
  isLoading = false,
}: OrganizerProfileFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<OrganizerProfileInput>({
    resolver: zodResolver(organizerProfileSchema),
    defaultValues: {
      name: initialData?.name || "",
      phone: initialData?.phone || "",
      city: initialData?.city || "",
      prefecture: initialData?.prefecture || PREFECTURES[0],
      organizationName: initialData?.organizationName || "",
      organizationType: initialData?.organizationType || "sports_club",
      representativeName: initialData?.representativeName || "",
      businessRegistrationNumber: initialData?.businessRegistrationNumber || "",
      website: initialData?.website || "",
      description: initialData?.description || "",
    },
  });

  const onFormSubmit = async (data: OrganizerProfileInput) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Profile update failed:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">基本情報</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">担当者名 *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="山田 太郎"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">電話番号</Label>
            <Input
              id="phone"
              {...register("phone")}
              placeholder="03-1234-5678"
              className={errors.phone ? "border-red-500" : ""}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="prefecture">都道府県 *</Label>
            <Select
              id="prefecture"
              {...register("prefecture")}
              className={errors.prefecture ? "border-red-500" : ""}
            >
              {PREFECTURES.map((prefecture) => (
                <option key={prefecture} value={prefecture}>
                  {prefecture}
                </option>
              ))}
            </Select>
            {errors.prefecture && (
              <p className="text-sm text-red-500">{errors.prefecture.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">市区町村 *</Label>
            <Input
              id="city"
              {...register("city")}
              placeholder="新宿区"
              className={errors.city ? "border-red-500" : ""}
            />
            {errors.city && (
              <p className="text-sm text-red-500">{errors.city.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Organization Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">組織情報</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="organizationName">組織名 *</Label>
            <Input
              id="organizationName"
              {...register("organizationName")}
              placeholder="○○スポーツクラブ"
              className={errors.organizationName ? "border-red-500" : ""}
            />
            {errors.organizationName && (
              <p className="text-sm text-red-500">{errors.organizationName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="organizationType">組織タイプ *</Label>
            <Select
              id="organizationType"
              {...register("organizationType")}
              className={errors.organizationType ? "border-red-500" : ""}
            >
              {ORGANIZATION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
            {errors.organizationType && (
              <p className="text-sm text-red-500">{errors.organizationType.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="representativeName">代表者名 *</Label>
            <Input
              id="representativeName"
              {...register("representativeName")}
              placeholder="田中 花子"
              className={errors.representativeName ? "border-red-500" : ""}
            />
            {errors.representativeName && (
              <p className="text-sm text-red-500">{errors.representativeName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessRegistrationNumber">事業者登録番号</Label>
            <Input
              id="businessRegistrationNumber"
              {...register("businessRegistrationNumber")}
              placeholder="1234567890123"
              className={errors.businessRegistrationNumber ? "border-red-500" : ""}
            />
            {errors.businessRegistrationNumber && (
              <p className="text-sm text-red-500">{errors.businessRegistrationNumber.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">ウェブサイト</Label>
          <Input
            id="website"
            type="url"
            {...register("website")}
            placeholder="https://example.com"
            className={errors.website ? "border-red-500" : ""}
          />
          {errors.website && (
            <p className="text-sm text-red-500">{errors.website.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">組織説明</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="組織の活動内容、理念、実績などを記載してください..."
            rows={4}
            className={errors.description ? "border-red-500" : ""}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          )}
          <p className="text-sm text-gray-500">
            {watch("description")?.length || 0}/1000文字
          </p>
        </div>
      </div>

      {/* Verification Status Display */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">認証状況</h3>
        <div className="p-4 bg-gray-50 rounded-md">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm font-medium">認証待ち</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            プロフィール情報の確認後、認証処理を行います。認証完了まで1-3営業日程度お時間をいただきます。
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="px-8"
        >
          {isLoading ? "保存中..." : "プロフィールを保存"}
        </Button>
      </div>
    </form>
  );
}