import { z } from "zod";
import { NextRequest } from "next/server";
import { globalErrorHandler, createErrorResponse } from "@/lib/errors";

export async function validateRequest<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: Response }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data, error: null };
  } catch (error) {
    const appError = globalErrorHandler(error);
    return { data: null, error: createErrorResponse(appError) };
  }
}

export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { data: T; error: null } | { data: null; error: Response } {
  try {
    const params = Object.fromEntries(searchParams.entries());
    
    // Convert string numbers to actual numbers for numeric fields
    const processedParams = Object.entries(params).reduce((acc, [key, value]) => {
      // Try to parse as number if it looks like a number
      if (typeof value === "string" && /^\d+(\.\d+)?$/.test(value)) {
        acc[key] = parseFloat(value);
      } else if (typeof value === "string" && value.toLowerCase() === "true") {
        acc[key] = true;
      } else if (typeof value === "string" && value.toLowerCase() === "false") {
        acc[key] = false;
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);

    const data = schema.parse(processedParams);
    return { data, error: null };
  } catch (error) {
    const appError = globalErrorHandler(error);
    return { data: null, error: createErrorResponse(appError) };
  }
}

export function createSuccessResponse<T>(data: T, message?: string) {
  return Response.json({
    success: true,
    data,
    ...(message && { message }),
  });
}

export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  }
) {
  return Response.json({
    success: true,
    data,
    pagination: {
      ...pagination,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  });
}

// Common validation patterns
export const commonValidations = {
  id: z.string().min(1, "ID is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, "Invalid phone number").optional(),
  url: z.string().url("Invalid URL"),
  positiveNumber: z.number().min(0, "Must be a positive number"),
  nonEmptyString: z.string().min(1, "This field is required"),
  optionalString: z.string().optional(),
  dateInFuture: z.date().min(new Date(), "Date must be in the future"),
  rating: z.number().int().min(1).max(5),
};

// Japanese-specific validations
export const japaneseValidations = {
  prefecture: z.enum([
    "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
    "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
    "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
    "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
    "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
    "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
    "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
  ], {
    required_error: "Prefecture is required",
    invalid_type_error: "Invalid prefecture",
  }),
  
  sportCategories: z.enum([
    "サッカー", "野球", "バスケットボール", "バレーボール", "テニス",
    "卓球", "バドミントン", "陸上競技", "水泳", "体操", "柔道", "剣道",
    "空手", "ラグビー", "アメリカンフットボール", "ハンドボール",
    "ソフトボール", "ゴルフ", "スキー", "スノーボード", "その他"
  ], {
    required_error: "Sport category is required",
    invalid_type_error: "Invalid sport category",
  }),
  
  nurseSkills: z.enum([
    "救急処置", "外傷処理", "熱中症対応", "心肺蘇生", "AED操作",
    "スポーツマッサージ", "テーピング", "リハビリテーション",
    "栄養指導", "メンタルケア", "薬物管理", "感染症対策"
  ], {
    required_error: "Skill is required",
    invalid_type_error: "Invalid skill",
  }),
};