"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { createJobSchema, type CreateJobInput } from "@/lib/validations/job";
import { PREFECTURES } from "@/lib/validations/profile";

const SPORT_CATEGORIES = [
  "サッカー", "野球", "バスケットボール", "バレーボール", "テニス",
  "陸上競技", "水泳", "体操", "柔道", "剣道", "ラグビー", "ゴルフ",
  "マラソン", "トライアスロン", "その他"
];

type FormData = Omit<CreateJobInput, "startAt" | "endAt" | "deadline"> & {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  deadlineDate: string;
  deadlineTime: string;
  categories: string[];
};

export function JobCreationForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      title: "",
      description: "",
      categories: [],
      location: {
        prefecture: "",
        city: "",
        venue: "",
        address: "",
      },
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      headcount: 1,
      compensation: {
        type: "hourly",
        amount: 0,
        currency: "JPY",
      },
      deadlineDate: "",
      deadlineTime: "",
    },
  });

  const watchedCategories = watch("categories") || [];

  const handleCategoryToggle = (category: string) => {
    const newCategories = watchedCategories.includes(category)
      ? watchedCategories.filter(c => c !== category)
      : [...watchedCategories, category];
    setValue("categories", newCategories);
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      // Convert date/time strings to Date objects
      const startAt = new Date(`${data.startDate}T${data.startTime}`);
      const endAt = new Date(`${data.endDate}T${data.endTime}`);
      const deadline = new Date(`${data.deadlineDate}T${data.deadlineTime}`);

      const jobData: CreateJobInput = {
        title: data.title,
        description: data.description,
        categories: data.categories,
        location: data.location,
        startAt,
        endAt,
        headcount: data.headcount,
        compensation: data.compensation,
        deadline,
      };

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to create job");
      }

      // If not saving as draft, publish immediately
      if (!isDraft) {
        const publishResponse = await fetch(`/api/jobs/${result.data.id}/publish`, {
          method: "POST",
        });

        if (!publishResponse.ok) {
          console.warn("Failed to publish job immediately");
        }
      }

      router.push(`/jobs/${result.data.id}`);
    } catch (error) {
      console.error("Error creating job:", error);
      alert(error instanceof Error ? error.message : "求人の作成に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">
              求人タイトル <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="例: サッカー大会での看護師募集"
              {...register("title")}
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">
              募集内容 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="求人の詳細、必要なスキル、業務内容などを記入してください"
              rows={6}
              {...register("description")}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
            )}
          </div>

          <div>
            <Label>
              スポーツカテゴリ <span className="text-red-500">*</span>
            </Label>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
              {SPORT_CATEGORIES.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={category}
                    checked={watchedCategories.includes(category)}
                    onCheckedChange={() => handleCategoryToggle(category)}
                  />
                  <Label htmlFor={category} className="text-sm font-normal">
                    {category}
                  </Label>
                </div>
              ))}
            </div>
            {errors.categories && (
              <p className="text-sm text-red-500 mt-1">{errors.categories.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle>開催場所</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="prefecture">
                都道府県 <span className="text-red-500">*</span>
              </Label>
              <Select onValueChange={(value) => setValue("location.prefecture", value)}>
                <SelectTrigger className={errors.location?.prefecture ? "border-red-500" : ""}>
                  <SelectValue placeholder="都道府県を選択" />
                </SelectTrigger>
                <SelectContent>
                  {PREFECTURES.map((prefecture) => (
                    <SelectItem key={prefecture} value={prefecture}>
                      {prefecture}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.location?.prefecture && (
                <p className="text-sm text-red-500 mt-1">{errors.location.prefecture.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="city">
                市区町村 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="city"
                placeholder="例: 新宿区"
                {...register("location.city")}
                className={errors.location?.city ? "border-red-500" : ""}
              />
              {errors.location?.city && (
                <p className="text-sm text-red-500 mt-1">{errors.location.city.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="venue">
              会場名 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="venue"
              placeholder="例: 新宿スポーツセンター"
              {...register("location.venue")}
              className={errors.location?.venue ? "border-red-500" : ""}
            />
            {errors.location?.venue && (
              <p className="text-sm text-red-500 mt-1">{errors.location.venue.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="address">住所（任意）</Label>
            <Input
              id="address"
              placeholder="例: 東京都新宿区西新宿1-1-1"
              {...register("location.address")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Date and Time */}
      <Card>
        <CardHeader>
          <CardTitle>開催日時</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">
                開始日 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
                className={errors.startDate ? "border-red-500" : ""}
              />
              {errors.startDate && (
                <p className="text-sm text-red-500 mt-1">{errors.startDate.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="startTime">
                開始時刻 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startTime"
                type="time"
                {...register("startTime")}
                className={errors.startTime ? "border-red-500" : ""}
              />
              {errors.startTime && (
                <p className="text-sm text-red-500 mt-1">{errors.startTime.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="endDate">
                終了日 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endDate"
                type="date"
                {...register("endDate")}
                className={errors.endDate ? "border-red-500" : ""}
              />
              {errors.endDate && (
                <p className="text-sm text-red-500 mt-1">{errors.endDate.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="endTime">
                終了時刻 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endTime"
                type="time"
                {...register("endTime")}
                className={errors.endTime ? "border-red-500" : ""}
              />
              {errors.endTime && (
                <p className="text-sm text-red-500 mt-1">{errors.endTime.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compensation and Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>報酬・募集要項</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="headcount">
              募集人数 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="headcount"
              type="number"
              min="1"
              {...register("headcount", { valueAsNumber: true })}
              className={errors.headcount ? "border-red-500" : ""}
            />
            {errors.headcount && (
              <p className="text-sm text-red-500 mt-1">{errors.headcount.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="compensationType">
                報酬タイプ <span className="text-red-500">*</span>
              </Label>
              <Select onValueChange={(value: "hourly" | "fixed") => setValue("compensation.type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="報酬タイプを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">時給</SelectItem>
                  <SelectItem value="fixed">固定額</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount">
                金額 (円) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                min="0"
                placeholder="例: 3000"
                {...register("compensation.amount", { valueAsNumber: true })}
                className={errors.compensation?.amount ? "border-red-500" : ""}
              />
              {errors.compensation?.amount && (
                <p className="text-sm text-red-500 mt-1">{errors.compensation.amount.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Application Deadline */}
      <Card>
        <CardHeader>
          <CardTitle>応募締切</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="deadlineDate">
                締切日 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="deadlineDate"
                type="date"
                {...register("deadlineDate")}
                className={errors.deadlineDate ? "border-red-500" : ""}
              />
              {errors.deadlineDate && (
                <p className="text-sm text-red-500 mt-1">{errors.deadlineDate.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="deadlineTime">
                締切時刻 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="deadlineTime"
                type="time"
                {...register("deadlineTime")}
                className={errors.deadlineTime ? "border-red-500" : ""}
              />
              {errors.deadlineTime && (
                <p className="text-sm text-red-500 mt-1">{errors.deadlineTime.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isDraft"
            checked={isDraft}
            onCheckedChange={setIsDraft}
          />
          <Label htmlFor="isDraft" className="text-sm">
            下書きとして保存（後で公開可能）
          </Label>
        </div>

        <div className="flex space-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            キャンセル
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "作成中..." : isDraft ? "下書き保存" : "作成・公開"}
          </Button>
        </div>
      </div>
    </form>
  );
}