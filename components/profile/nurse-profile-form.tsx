"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  nurseProfileSchema,
  PREFECTURES,
  NURSING_SKILLS,
  type NurseProfileInput,
} from "@/lib/validations/profile";

interface NurseProfileFormProps {
  initialData?: Partial<NurseProfileInput>;
  onSubmit: (data: NurseProfileInput) => Promise<void>;
  isLoading?: boolean;
}

export function NurseProfileForm({
  initialData,
  onSubmit,
  isLoading = false,
}: NurseProfileFormProps) {
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    initialData?.skills || []
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<NurseProfileInput>({
    resolver: zodResolver(nurseProfileSchema),
    defaultValues: {
      name: initialData?.name || "",
      phone: initialData?.phone || "",
      city: initialData?.city || "",
      prefecture: initialData?.prefecture || PREFECTURES[0],
      licenseNumber: initialData?.licenseNumber || "",
      skills: initialData?.skills || [],
      yearsOfExperience: initialData?.yearsOfExperience || 0,
      specializations: initialData?.specializations || [],
      bio: initialData?.bio || "",
    },
  });

  const handleSkillToggle = (skill: string) => {
    const updatedSkills = selectedSkills.includes(skill)
      ? selectedSkills.filter((s) => s !== skill)
      : [...selectedSkills, skill];
    
    setSelectedSkills(updatedSkills);
    setValue("skills", updatedSkills as any);
  };

  const onFormSubmit = async (data: NurseProfileInput) => {
    try {
      await onSubmit({ ...data, skills: selectedSkills as any });
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
            <Label htmlFor="name">氏名 *</Label>
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
              placeholder="090-1234-5678"
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

      {/* Professional Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">専門情報</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="licenseNumber">看護師免許番号 *</Label>
            <Input
              id="licenseNumber"
              {...register("licenseNumber")}
              placeholder="RN-123456"
              className={errors.licenseNumber ? "border-red-500" : ""}
            />
            {errors.licenseNumber && (
              <p className="text-sm text-red-500">{errors.licenseNumber.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="yearsOfExperience">経験年数</Label>
            <Input
              id="yearsOfExperience"
              type="number"
              min="0"
              max="50"
              {...register("yearsOfExperience", { valueAsNumber: true })}
              placeholder="5"
              className={errors.yearsOfExperience ? "border-red-500" : ""}
            />
            {errors.yearsOfExperience && (
              <p className="text-sm text-red-500">{errors.yearsOfExperience.message}</p>
            )}
          </div>
        </div>

        {/* Skills Selection */}
        <div className="space-y-2">
          <Label>スキル・専門分野 * (最大10個)</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 border rounded-md">
            {NURSING_SKILLS.map((skill) => (
              <Checkbox
                key={skill}
                id={`skill-${skill}`}
                label={skill}
                checked={selectedSkills.includes(skill)}
                onChange={() => handleSkillToggle(skill)}
              />
            ))}
          </div>
          {errors.skills && (
            <p className="text-sm text-red-500">{errors.skills.message}</p>
          )}
          <p className="text-sm text-gray-500">
            選択済み: {selectedSkills.length}/10
          </p>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">自己紹介</Label>
          <Textarea
            id="bio"
            {...register("bio")}
            placeholder="スポーツ医学に関する経験や専門性について簡潔に記載してください..."
            rows={4}
            className={errors.bio ? "border-red-500" : ""}
          />
          {errors.bio && (
            <p className="text-sm text-red-500">{errors.bio.message}</p>
          )}
          <p className="text-sm text-gray-500">
            {watch("bio")?.length || 0}/500文字
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