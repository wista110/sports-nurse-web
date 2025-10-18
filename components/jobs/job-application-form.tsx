"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import { createApplicationSchema, type CreateApplicationInput } from "@/lib/validations/job";
import type { Job } from "@/types/domain";

interface JobApplicationFormProps {
  job: Job;
  onCancel: () => void;
  onSuccess: () => void;
}

type FormData = CreateApplicationInput;

export function JobApplicationForm({ job, onCancel, onSuccess }: JobApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuoteSection, setShowQuoteSection] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(createApplicationSchema),
    defaultValues: {
      jobId: job.id,
      message: "",
      quote: undefined,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "quote.breakdown",
  });

  const watchedBreakdown = watch("quote.breakdown");

  // Calculate total from breakdown items
  const calculateTotal = () => {
    if (!watchedBreakdown) return 0;
    return watchedBreakdown.reduce((sum, item) => sum + (item?.amount || 0), 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      // If quote section is shown, calculate total
      if (showQuoteSection && data.quote?.breakdown) {
        data.quote.total = calculateTotal();
        data.quote.currency = "JPY";
      } else {
        data.quote = undefined;
      }

      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to submit application");
      }

      onSuccess();
    } catch (error) {
      console.error("Error submitting application:", error);
      alert(error instanceof Error ? error.message : "応募の送信に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Job Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">応募する求人</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <h3 className="font-medium">{job.title}</h3>
            <p className="text-sm text-gray-600">
              {job.location.prefecture} {job.location.city} - {job.location.venue}
            </p>
            <p className="text-sm text-gray-600">
              報酬: {formatCurrency(job.compensation.amount)}
              {job.compensation.type === "hourly" && "/時間"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Application Message */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">応募メッセージ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="message">
              メッセージ <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="message"
              placeholder="自己紹介、経験、質問などを記入してください（10文字以上）"
              rows={6}
              {...register("message")}
              className={errors.message ? "border-red-500" : ""}
            />
            {errors.message && (
              <p className="text-sm text-red-500">{errors.message.message}</p>
            )}
            <p className="text-xs text-gray-500">
              あなたの経験、スキル、この求人への意気込みなどを記入してください。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quote Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">見積もり（任意）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showQuote"
                checked={showQuoteSection}
                onChange={(e) => setShowQuoteSection(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="showQuote">
                カスタム見積もりを提示する
              </Label>
            </div>
            
            <p className="text-sm text-gray-600">
              標準報酬と異なる料金体系を提案したい場合は、詳細な見積もりを作成できます。
            </p>

            {showQuoteSection && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">見積もり項目</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ description: "", amount: 0 })}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    項目を追加
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="flex space-x-2 items-end">
                    <div className="flex-1">
                      <Label htmlFor={`quote.breakdown.${index}.description`}>
                        項目名
                      </Label>
                      <Input
                        {...register(`quote.breakdown.${index}.description`)}
                        placeholder="例: 基本料金、交通費、特別手当"
                      />
                      {errors.quote?.breakdown?.[index]?.description && (
                        <p className="text-sm text-red-500">
                          {errors.quote.breakdown[index]?.description?.message}
                        </p>
                      )}
                    </div>
                    <div className="w-32">
                      <Label htmlFor={`quote.breakdown.${index}.amount`}>
                        金額 (円)
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        {...register(`quote.breakdown.${index}.amount`, {
                          valueAsNumber: true,
                        })}
                        placeholder="0"
                      />
                      {errors.quote?.breakdown?.[index]?.amount && (
                        <p className="text-sm text-red-500">
                          {errors.quote.breakdown[index]?.amount?.message}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={fields.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {fields.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <p>見積もり項目を追加してください</p>
                  </div>
                )}

                {fields.length > 0 && (
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>合計金額:</span>
                      <span className="text-green-600">
                        {formatCurrency(calculateTotal())}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          キャンセル
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "送信中..." : "応募する"}
        </Button>
      </div>
    </form>
  );
}