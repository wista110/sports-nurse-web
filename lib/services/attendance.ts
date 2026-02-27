import { prisma } from '@/lib/prisma';
import { auditService } from '@/lib/services/audit';
import {
  CheckInInput,
  CheckOutInput,
  UpdateAttendanceInput,
  AttendanceSearchInput,
  AttendanceDetails,
  AttendanceStats,
  LocationData,
  IrregularityType
} from '@/lib/validations/attendance';
import { AppError, ErrorType } from '@/lib/errors';

export class AttendanceService {
  /**
   * チェックイン処理
   */
  static async checkIn(input: CheckInInput, actorId: string): Promise<AttendanceDetails> {
    const { jobId, nurseId, location, notes } = input;

    // 案件と看護師の確認
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        applications: {
          where: { nurseId, status: 'ACCEPTED' }
        },
        organizer: {
          select: { id: true, profile: true }
        }
      }
    });

    if (!job) {
      throw new AppError(
        ErrorType.NOT_FOUND,
        'JOB_NOT_FOUND',
        '指定された案件が見つかりません',
        404
      );
    }

    if (job.applications.length === 0) {
      throw new AppError(
        ErrorType.BUSINESS_LOGIC,
        'NO_ACCEPTED_APPLICATION',
        'この案件への承認された応募が見つかりません',
        400
      );
    }

    // 案件ステータス確認
    if (job.status !== 'ESCROW_HOLDING' && job.status !== 'IN_PROGRESS') {
      throw new AppError(
        ErrorType.BUSINESS_LOGIC,
        'INVALID_JOB_STATUS',
        'チェックインはエスクロー預り中または実施中の案件でのみ可能です',
        400
      );
    }

    // 既存の出勤記録確認
    const existingAttendance = await prisma.attendanceRecord.findUnique({
      where: {
        jobId_nurseId: { jobId, nurseId }
      }
    });

    if (existingAttendance && existingAttendance.checkInAt) {
      throw new AppError(
        ErrorType.BUSINESS_LOGIC,
        'ALREADY_CHECKED_IN',
        '既にチェックイン済みです',
        400
      );
    }

    const now = new Date();

    try {
      const result = await prisma.$transaction(async (tx) => {
        // 出勤記録作成または更新
        const attendance = await tx.attendanceRecord.upsert({
          where: {
            jobId_nurseId: { jobId, nurseId }
          },
          create: {
            jobId,
            nurseId,
            checkInAt: now,
            notes,
            irregularities: location ? JSON.stringify({ checkIn: location }) : undefined
          },
          update: {
            checkInAt: now,
            notes,
            irregularities: location ? JSON.stringify({ checkIn: location }) : undefined
          }
        });

        // 案件ステータス更新
        await tx.job.update({
          where: { id: jobId },
          data: { status: 'IN_PROGRESS' }
        });

        return attendance;
      });

      // 監査ログ記録
      await auditService.logAction({
        actorId,
        action: 'ATTENDANCE_CHECK_IN',
        target: `attendance:${result.id}`,
        metadata: {
          jobId,
          nurseId,
          checkInTime: now.toISOString(),
          location: location || null
        }
      });

      return this.formatAttendanceDetails(result, job);
    } catch (error) {
      throw new AppError(
        ErrorType.SYSTEM,
        'CHECK_IN_FAILED',
        'チェックイン処理に失敗しました',
        500,
        { originalError: error }
      );
    }
  }

  /**
   * チェックアウト処理
   */
  static async checkOut(input: CheckOutInput, actorId: string): Promise<AttendanceDetails> {
    const { attendanceId, location, notes, irregularities } = input;

    const attendance = await prisma.attendanceRecord.findUnique({
      where: { id: attendanceId },
      include: {
        job: {
          include: {
            organizer: {
              select: { id: true, profile: true }
            }
          }
        },
        nurse: {
          select: { id: true, profile: true }
        }
      }
    });

    if (!attendance) {
      throw new AppError(
        ErrorType.NOT_FOUND,
        'ATTENDANCE_NOT_FOUND',
        '指定された出勤記録が見つかりません',
        404
      );
    }

    if (!attendance.checkInAt) {
      throw new AppError(
        ErrorType.BUSINESS_LOGIC,
        'NOT_CHECKED_IN',
        'チェックインが完了していません',
        400
      );
    }

    if (attendance.checkOutAt) {
      throw new AppError(
        ErrorType.BUSINESS_LOGIC,
        'ALREADY_CHECKED_OUT',
        '既にチェックアウト済みです',
        400
      );
    }

    const now = new Date();

    try {
      // 既存のイレギュラー情報を取得
      let existingIrregularities = {};
      if (attendance.irregularities) {
        try {
          existingIrregularities = JSON.parse(attendance.irregularities);
        } catch (e) {
          // JSON解析エラーは無視
        }
      }

      // 新しいイレギュラー情報を追加
      const updatedIrregularities = {
        ...existingIrregularities,
        checkOut: location,
        ...(irregularities && { report: irregularities })
      };

      const result = await prisma.attendanceRecord.update({
        where: { id: attendanceId },
        data: {
          checkOutAt: now,
          notes: notes || attendance.notes,
          irregularities: JSON.stringify(updatedIrregularities)
        },
        include: {
          job: {
            include: {
              organizer: {
                select: { id: true, profile: true }
              }
            }
          },
          nurse: {
            select: { id: true, profile: true }
          }
        }
      });

      // 監査ログ記録
      await auditService.logAction({
        actorId,
        action: 'ATTENDANCE_CHECK_OUT',
        target: `attendance:${attendanceId}`,
        metadata: {
          jobId: attendance.jobId,
          nurseId: attendance.nurseId,
          checkOutTime: now.toISOString(),
          workDuration: this.calculateWorkDuration(attendance.checkInAt, now),
          location: location || null,
          irregularities: irregularities || null
        }
      });

      return this.formatAttendanceDetails(result, result.job);
    } catch (error) {
      throw new AppError(
        ErrorType.SYSTEM,
        'CHECK_OUT_FAILED',
        'チェックアウト処理に失敗しました',
        500,
        { originalError: error }
      );
    }
  }

  /**
   * 出勤記録を取得
   */
  static async getAttendanceRecord(jobId: string, nurseId: string): Promise<AttendanceDetails | null> {
    const attendance = await prisma.attendanceRecord.findUnique({
      where: {
        jobId_nurseId: { jobId, nurseId }
      },
      include: {
        job: {
          include: {
            organizer: {
              select: { id: true, profile: true }
            }
          }
        },
        nurse: {
          select: { id: true, profile: true }
        }
      }
    });

    if (!attendance) {
      return null;
    }

    return this.formatAttendanceDetails(attendance, attendance.job);
  }

  /**
   * 出勤記録一覧を取得
   */
  static async getAttendanceRecords(filters: AttendanceSearchInput): Promise<AttendanceDetails[]> {
    const { jobId, nurseId, startDate, endDate, status, limit, offset } = filters;

    const whereClause: any = {};

    if (jobId) whereClause.jobId = jobId;
    if (nurseId) whereClause.nurseId = nurseId;

    if (startDate || endDate) {
      whereClause.job = {
        ...(startDate && { startAt: { gte: startDate } }),
        ...(endDate && { endAt: { lte: endDate } })
      };
    }

    // ステータスフィルター
    if (status) {
      switch (status) {
        case 'checked_in':
          whereClause.checkInAt = { not: null };
          whereClause.checkOutAt = null;
          break;
        case 'checked_out':
          whereClause.checkInAt = { not: null };
          whereClause.checkOutAt = { not: null };
          break;
        case 'incomplete':
          whereClause.OR = [
            { checkInAt: null },
            { checkOutAt: null }
          ];
          break;
      }
    }

    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: whereClause,
      include: {
        job: {
          include: {
            organizer: {
              select: { id: true, profile: true }
            }
          }
        },
        nurse: {
          select: { id: true, profile: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    return attendanceRecords.map(record => 
      this.formatAttendanceDetails(record, record.job)
    );
  }

  /**
   * 看護師の出勤統計を取得
   */
  static async getAttendanceStats(nurseId: string): Promise<AttendanceStats> {
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: { 
        nurseId,
        checkInAt: { not: null },
        checkOutAt: { not: null }
      },
      include: {
        job: true
      }
    });

    const totalJobs = attendanceRecords.length;
    let totalWorkMinutes = 0;
    let onTimeCount = 0;
    let irregularityCount = 0;

    attendanceRecords.forEach(record => {
      if (record.checkInAt && record.checkOutAt) {
        const workMinutes = this.calculateWorkDuration(record.checkInAt, record.checkOutAt);
        totalWorkMinutes += workMinutes;

        // 時間通り出勤判定（開始時刻の15分前から15分後まで）
        const jobStartTime = new Date(record.job.startAt);
        const checkInTime = new Date(record.checkInAt);
        const timeDiff = Math.abs(checkInTime.getTime() - jobStartTime.getTime()) / (1000 * 60);
        
        if (timeDiff <= 15) {
          onTimeCount++;
        }

        // イレギュラー報告の確認
        if (record.irregularities) {
          try {
            const irregularities = JSON.parse(record.irregularities);
            if (irregularities.report) {
              irregularityCount++;
            }
          } catch (e) {
            // JSON解析エラーは無視
          }
        }
      }
    });

    const totalWorkHours = totalWorkMinutes / 60;
    const averageWorkHours = totalJobs > 0 ? totalWorkHours / totalJobs : 0;
    const onTimeRate = totalJobs > 0 ? (onTimeCount / totalJobs) * 100 : 0;
    const completionRate = 100; // チェックイン・アウト完了済みのレコードのみを対象としているため

    return {
      totalWorkHours,
      totalJobs,
      averageWorkHours,
      onTimeRate,
      completionRate,
      irregularityCount
    };
  }

  /**
   * 出勤記録を更新（管理者用）
   */
  static async updateAttendanceRecord(
    attendanceId: string, 
    input: UpdateAttendanceInput, 
    actorId: string
  ): Promise<AttendanceDetails> {
    const attendance = await prisma.attendanceRecord.findUnique({
      where: { id: attendanceId },
      include: {
        job: {
          include: {
            organizer: {
              select: { id: true, profile: true }
            }
          }
        },
        nurse: {
          select: { id: true, profile: true }
        }
      }
    });

    if (!attendance) {
      throw new AppError(
        ErrorType.NOT_FOUND,
        'ATTENDANCE_NOT_FOUND',
        '指定された出勤記録が見つかりません',
        404
      );
    }

    try {
      const result = await prisma.attendanceRecord.update({
        where: { id: attendanceId },
        data: {
          ...(input.checkInAt && { checkInAt: input.checkInAt }),
          ...(input.checkOutAt && { checkOutAt: input.checkOutAt }),
          ...(input.notes && { notes: input.notes }),
          ...(input.irregularities && { irregularities: input.irregularities })
        },
        include: {
          job: {
            include: {
              organizer: {
                select: { id: true, profile: true }
              }
            }
          },
          nurse: {
            select: { id: true, profile: true }
          }
        }
      });

      // 監査ログ記録
      await auditService.logAction({
        actorId,
        action: 'ATTENDANCE_UPDATED',
        target: `attendance:${attendanceId}`,
        metadata: {
          changes: input,
          jobId: attendance.jobId,
          nurseId: attendance.nurseId
        }
      });

      return this.formatAttendanceDetails(result, result.job);
    } catch (error) {
      throw new AppError(
        ErrorType.SYSTEM,
        'ATTENDANCE_UPDATE_FAILED',
        '出勤記録の更新に失敗しました',
        500,
        { originalError: error }
      );
    }
  }

  /**
   * 勤務時間を計算（分単位）
   */
  private static calculateWorkDuration(checkIn: Date, checkOut: Date): number {
    return Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60));
  }

  /**
   * 出勤記録の詳細情報をフォーマット
   */
  private static formatAttendanceDetails(attendance: any, job: any): AttendanceDetails {
    const workDuration = attendance.checkInAt && attendance.checkOutAt
      ? this.calculateWorkDuration(attendance.checkInAt, attendance.checkOutAt)
      : undefined;

    let status: 'checked_in' | 'checked_out' | 'incomplete';
    if (attendance.checkInAt && attendance.checkOutAt) {
      status = 'checked_out';
    } else if (attendance.checkInAt) {
      status = 'checked_in';
    } else {
      status = 'incomplete';
    }

    return {
      id: attendance.id,
      jobId: attendance.jobId,
      nurseId: attendance.nurseId,
      checkInAt: attendance.checkInAt,
      checkOutAt: attendance.checkOutAt,
      notes: attendance.notes,
      irregularities: attendance.irregularities,
      workDuration,
      status,
      createdAt: attendance.createdAt,
      job: {
        id: job.id,
        title: job.title,
        startAt: job.startAt,
        endAt: job.endAt,
        location: job.location
      },
      nurse: {
        id: attendance.nurse?.id || attendance.nurseId,
        name: attendance.nurse?.profile?.name || '名前未設定'
      }
    };
  }
}

export const attendanceService = AttendanceService;