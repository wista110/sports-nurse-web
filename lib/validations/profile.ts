import { z } from "zod";
import { UserRole } from "@prisma/client";

// Japanese prefectures
export const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
] as const;

// Predefined nursing skills for sports medicine
export const NURSING_SKILLS = [
  "応急処置", // First Aid
  "外傷処置", // Trauma Care
  "熱中症対応", // Heat Illness Management
  "心肺蘇生法", // CPR
  "AED操作", // AED Operation
  "スポーツ外傷", // Sports Injuries
  "リハビリテーション", // Rehabilitation
  "栄養指導", // Nutritional Guidance
  "メンタルヘルス", // Mental Health
  "薬物管理", // Medication Management
  "感染症対策", // Infection Control
  "バイタルサイン測定", // Vital Signs Monitoring
  "整形外科", // Orthopedics
  "内科", // Internal Medicine
  "小児科", // Pediatrics
] as const;

// Base profile schema
export const baseProfileSchema = z.object({
  name: z.string()
    .min(1, "名前は必須です")
    .max(100, "名前は100文字以内で入力してください"),
  phone: z.string()
    .regex(/^[\d\-\+\(\)\s]+$/, "有効な電話番号を入力してください")
    .optional()
    .or(z.literal("")),
  city: z.string()
    .min(1, "市区町村は必須です")
    .max(50, "市区町村は50文字以内で入力してください"),
  prefecture: z.enum(PREFECTURES, {
    errorMap: () => ({ message: "都道府県を選択してください" })
  }),
});

// Nurse-specific profile schema
export const nurseProfileSchema = baseProfileSchema.extend({
  licenseNumber: z.string()
    .min(1, "看護師免許番号は必須です")
    .max(20, "免許番号は20文字以内で入力してください")
    .regex(/^[A-Za-z0-9\-]+$/, "免許番号は英数字とハイフンのみ使用できます"),
  skills: z.array(z.enum(NURSING_SKILLS))
    .min(1, "少なくとも1つのスキルを選択してください")
    .max(10, "スキルは最大10個まで選択できます"),
  yearsOfExperience: z.number()
    .min(0, "経験年数は0年以上で入力してください")
    .max(50, "経験年数は50年以下で入力してください")
    .optional(),
  specializations: z.array(z.string())
    .max(5, "専門分野は最大5つまで選択できます")
    .optional(),
  bio: z.string()
    .max(500, "自己紹介は500文字以内で入力してください")
    .optional(),
});

// Organizer-specific profile schema
export const organizerProfileSchema = baseProfileSchema.extend({
  organizationName: z.string()
    .min(1, "組織名は必須です")
    .max(100, "組織名は100文字以内で入力してください"),
  organizationType: z.enum([
    "sports_club", "school", "municipality", "private_company", "npo", "other"
  ], {
    errorMap: () => ({ message: "組織タイプを選択してください" })
  }),
  representativeName: z.string()
    .min(1, "代表者名は必須です")
    .max(100, "代表者名は100文字以内で入力してください"),
  businessRegistrationNumber: z.string()
    .regex(/^[\d\-]+$/, "事業者登録番号は数字とハイフンのみ使用できます")
    .optional()
    .or(z.literal("")),
  website: z.string()
    .url("有効なURLを入力してください")
    .optional()
    .or(z.literal("")),
  description: z.string()
    .max(1000, "組織説明は1000文字以内で入力してください")
    .optional(),
  verificationStatus: z.enum(["pending", "verified", "rejected"])
    .default("pending"),
});

// Complete profile update schema that handles role-specific validation
export const profileUpdateSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal(UserRole.NURSE),
    profile: nurseProfileSchema,
  }),
  z.object({
    role: z.literal(UserRole.ORGANIZER),
    profile: organizerProfileSchema,
  }),
  z.object({
    role: z.literal(UserRole.ADMIN),
    profile: baseProfileSchema,
  }),
]);

// Registration schema with role selection
export const registrationSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string()
    .min(8, "パスワードは8文字以上で入力してください")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "パスワードは大文字、小文字、数字をそれぞれ1文字以上含む必要があります"
    ),
  confirmPassword: z.string(),
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: "ユーザータイプを選択してください" })
  }),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "利用規約に同意する必要があります"
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "パスワードが一致しません",
  path: ["confirmPassword"],
});

// Type exports
export type BaseProfileInput = z.infer<typeof baseProfileSchema>;
export type NurseProfileInput = z.infer<typeof nurseProfileSchema>;
export type OrganizerProfileInput = z.infer<typeof organizerProfileSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type RegistrationInput = z.infer<typeof registrationSchema>;

// Helper functions
export function getProfileSchemaForRole(role: UserRole) {
  switch (role) {
    case UserRole.NURSE:
      return nurseProfileSchema;
    case UserRole.ORGANIZER:
      return organizerProfileSchema;
    case UserRole.ADMIN:
      return baseProfileSchema;
    default:
      return baseProfileSchema;
  }
}

export function validateProfileForRole(role: UserRole, data: any) {
  const schema = getProfileSchemaForRole(role);
  return schema.safeParse(data);
}