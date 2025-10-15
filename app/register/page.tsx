"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  registrationSchema,
  type RegistrationInput,
} from "@/lib/validations/profile";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RegistrationInput>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      role: UserRole.NURSE,
      agreeToTerms: false,
    },
  });

  const selectedRole = watch("role");
  const agreeToTerms = watch("agreeToTerms");

  const onSubmit = async (data: RegistrationInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      // Redirect to profile setup page
      router.push("/profile/setup");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleDescription = (role: UserRole) => {
    switch (role) {
      case UserRole.NURSE:
        return "スポーツイベントで医療サポートを提供する看護師として登録";
      case UserRole.ORGANIZER:
        return "スポーツイベントを主催し、看護師を募集する組織として登録";
      case UserRole.ADMIN:
        return "プラットフォーム管理者として登録（招待制）";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          アカウント作成
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          スポーツナース マッチングプラットフォームへようこそ
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <Label htmlFor="email">メールアドレス *</Label>
              <div className="mt-1">
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register("email")}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password">パスワード *</Label>
              <div className="mt-1">
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  {...register("password")}
                  className={errors.password ? "border-red-500" : ""}
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword">パスワード確認 *</Label>
              <div className="mt-1">
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  {...register("confirmPassword")}
                  className={errors.confirmPassword ? "border-red-500" : ""}
                />
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <Label htmlFor="role">ユーザータイプ *</Label>
              <div className="mt-1">
                <Select
                  id="role"
                  {...register("role")}
                  className={errors.role ? "border-red-500" : ""}
                >
                  <option value={UserRole.NURSE}>看護師</option>
                  <option value={UserRole.ORGANIZER}>イベント主催者</option>
                </Select>
                {errors.role && (
                  <p className="mt-2 text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {getRoleDescription(selectedRole)}
              </p>
            </div>

            {/* Terms Agreement */}
            <div>
              <div className="flex items-start">
                <Checkbox
                  id="agreeToTerms"
                  checked={agreeToTerms}
                  onChange={(e) => setValue("agreeToTerms", e.target.checked)}
                />
                <div className="ml-3 text-sm">
                  <Label htmlFor="agreeToTerms" className="font-medium text-gray-700">
                    利用規約とプライバシーポリシーに同意する *
                  </Label>
                  <p className="text-gray-500">
                    <a href="/terms" className="text-blue-600 hover:underline">
                      利用規約
                    </a>
                    と
                    <a href="/privacy" className="text-blue-600 hover:underline">
                      プライバシーポリシー
                    </a>
                    をお読みください。
                  </p>
                </div>
              </div>
              {errors.agreeToTerms && (
                <p className="mt-2 text-sm text-red-600">{errors.agreeToTerms.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "作成中..." : "アカウントを作成"}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">または</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                既にアカウントをお持ちですか？{" "}
                <a href="/login" className="font-medium text-blue-600 hover:underline">
                  ログイン
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}