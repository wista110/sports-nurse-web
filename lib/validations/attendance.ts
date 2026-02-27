import { z } from 'zod';

// チェックイン
export const checkInSchema = z.object({
  jobId: z.string().uuid('有効な案件IDを入力してください'),
  nurseId: z.string().uuid('有効な看護師IDを入力してください'),
  location: z.object({
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    address: z.string().optional()
  }).optional(),
  notes: z.string().max(500, 'メモは500文字以内で入力してください').optional()
});

// チェックアウト
export const checkOutSchema = z.object({
  attendanceId: z.string().uuid('有効な出勤記録IDを入力してください'),
  location: z.object({
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    address: z.string().optional()
  }).optional(),
  notes: z.string().max(500, 'メモは500文字以内で入力してください').optional(),
  irregularities: z.string().max(1000, 'イレギュラー報告は1000文字以内で入力してください').optional()
});

// 出勤記録更新
export const updateAttendanceSchema = z.object({
  checkInAt: z.date().optional(),
  checkOutAt: z.date().optional(),
  notes: z.string().max(500, 'メモは500文字以内で入力してください').optional(),
  irregularities: z.string().max(1000, 'イレギュラー報告は1000文字以内で入力してください').optional()
}).refine(data => {
  if (data.checkInAt && data.checkOutAt) {
    return data.checkOutAt > data.checkInAt;
  }
  return true;
}, {
  message: 'チェックアウト時刻はチェックイン時刻より後である必要があります'
});

// 出勤記録検索
export const attendanceSearchSchema = z.object({
  jobId: z.string().uuid().optional(),
  nurseId: z.string().uuid().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  status: z.enum(['checked_in', 'checked_out', 'incomplete']).optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0)
});

// 型定義
export type CheckInInput = z.infer<typeof checkInSchema>;
export type CheckOutInput = z.infer<typeof checkOutSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
export type AttendanceSearchInput = z.infer<typeof attendanceSearchSchema>;

// 出勤記録詳細
export interface AttendanceDetails {
  id: string;
  jobId: string;
  nurseId: string;
  checkInAt?: Date;
  checkOutAt?: Date;
  notes?: string;
  irregularities?: string;
  workDuration?: number; // 分単位
  status: 'checked_in' | 'checked_out' | 'incomplete';
  createdAt: Date;
  job: {
    id: string;
    title: string;
    startAt: Date;
    endAt: Date;
    location: {
      prefecture: string;
      city: string;
      venue: string;
    };
  };
  nurse: {
    id: string;
    name: string;
  };
}

// 出勤統計
export interface AttendanceStats {
  totalWorkHours: number;
  totalJobs: number;
  averageWorkHours: number;
  onTimeRate: number; // 時間通り出勤率
  completionRate: number; // 完了率
  irregularityCount: number;
}

// 位置情報
export interface LocationData {
  latitude?: number;
  longitude?: number;
  address?: string;
  timestamp: Date;
}

// イレギュラー報告タイプ
export enum IrregularityType {
  OVERTIME = 'overtime', // 延長
  EARLY_DEPARTURE = 'early_departure', // 早退
  LATE_ARRIVAL = 'late_arrival', // 遅刻
  BREAK_EXTENSION = 'break_extension', // 休憩延長
  EMERGENCY_RESPONSE = 'emergency_response', // 緊急対応
  OTHER = 'other' // その他
}

// イレギュラー報告
export interface IrregularityReport {
  type: IrregularityType;
  description: string;
  startTime?: Date;
  endTime?: Date;
  additionalCompensation?: number;
}