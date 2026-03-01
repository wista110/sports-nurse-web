'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, Shield, Lock, Eye, EyeOff } from 'lucide-react';

interface ConfirmationItem {
  id: string;
  label: string;
  required: boolean;
  type?: 'checkbox' | 'text' | 'password';
  placeholder?: string;
  expectedValue?: string; // テキスト入力の場合の期待値
}

interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  actionType: 'danger' | 'warning' | 'info';
  confirmationItems: ConfirmationItem[];
  confirmButtonText?: string;
  cancelButtonText?: string;
  onConfirm: (values: Record<string, any>) => void;
  onCancel?: () => void;
  loading?: boolean;
}

export function ConfirmationModal({
  open,
  onOpenChange,
  title,
  description,
  actionType,
  confirmationItems,
  confirmButtonText = '実行',
  cancelButtonText = 'キャンセル',
  onConfirm,
  onCancel,
  loading = false
}: ConfirmationModalProps) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const handleValueChange = (id: string, value: any) => {
    setValues(prev => ({ ...prev, [id]: value }));
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isValid = () => {
    return confirmationItems.every(item => {
      if (!item.required) return true;
      
      const value = values[item.id];
      
      if (item.type === 'checkbox') {
        return value === true;
      }
      
      if (item.type === 'text' || item.type === 'password') {
        if (!value || value.trim() === '') return false;
        
        // 期待値がある場合はチェック
        if (item.expectedValue) {
          return value.trim() === item.expectedValue;
        }
        
        return true;
      }
      
      return !!value;
    });
  };

  const handleConfirm = () => {
    if (isValid()) {
      onConfirm(values);
    }
  };

  const handleCancel = () => {
    setValues({});
    setShowPasswords({});
    onCancel?.();
    onOpenChange(false);
  };

  const getIcon = () => {
    switch (actionType) {
      case 'danger':
        return <AlertTriangle className="w-6 h-6 text-red-500" />;
      case 'warning':
        return <Shield className="w-6 h-6 text-orange-500" />;
      case 'info':
        return <Lock className="w-6 h-6 text-blue-500" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-gray-500" />;
    }
  };

  const getButtonVariant = () => {
    switch (actionType) {
      case 'danger':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'info':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getIcon()}
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription className="text-left">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {confirmationItems.map((item) => (
            <div key={item.id} className="space-y-2">
              {item.type === 'checkbox' ? (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={item.id}
                    checked={values[item.id] || false}
                    onCheckedChange={(checked) => handleValueChange(item.id, checked)}
                  />
                  <Label
                    htmlFor={item.id}
                    className={`text-sm ${item.required ? 'font-medium' : ''}`}
                  >
                    {item.label}
                    {item.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                </div>
              ) : (
                <div>
                  <Label htmlFor={item.id} className="text-sm font-medium">
                    {item.label}
                    {item.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  <div className="relative">
                    <Input
                      id={item.id}
                      type={
                        item.type === 'password' && !showPasswords[item.id]
                          ? 'password'
                          : 'text'
                      }
                      placeholder={item.placeholder}
                      value={values[item.id] || ''}
                      onChange={(e) => handleValueChange(item.id, e.target.value)}
                      className={
                        item.required && 
                        values[item.id] && 
                        item.expectedValue && 
                        values[item.id] !== item.expectedValue
                          ? 'border-red-500'
                          : ''
                      }
                    />
                    {item.type === 'password' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => togglePasswordVisibility(item.id)}
                      >
                        {showPasswords[item.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  {item.expectedValue && values[item.id] && values[item.id] !== item.expectedValue && (
                    <p className="text-xs text-red-500">
                      入力値が正しくありません
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <DialogFooter className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelButtonText}
          </Button>
          <Button
            variant={getButtonVariant()}
            onClick={handleConfirm}
            disabled={!isValid() || loading}
          >
            {loading ? '実行中...' : confirmButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 使用例のためのヘルパー関数
export const createDangerousActionConfirmation = (
  actionName: string,
  targetName: string
): ConfirmationItem[] => [
  {
    id: 'understand',
    label: `この操作により${targetName}が${actionName}されることを理解しています`,
    required: true,
    type: 'checkbox'
  },
  {
    id: 'confirmation',
    label: '確認のため「削除」と入力してください',
    required: true,
    type: 'text',
    placeholder: '削除',
    expectedValue: '削除'
  }
];

export const createPaymentConfirmation = (
  amount: number,
  nurseName: string
): ConfirmationItem[] => [
  {
    id: 'amount_check',
    label: `支払い金額 ¥${amount.toLocaleString()} が正しいことを確認しました`,
    required: true,
    type: 'checkbox'
  },
  {
    id: 'recipient_check',
    label: `支払い先 ${nurseName} が正しいことを確認しました`,
    required: true,
    type: 'checkbox'
  },
  {
    id: 'irreversible',
    label: 'この支払い処理は取り消しできないことを理解しています',
    required: true,
    type: 'checkbox'
  }
];

export const createAdminActionConfirmation = (
  action: string
): ConfirmationItem[] => [
  {
    id: 'admin_password',
    label: '管理者パスワードを入力してください',
    required: true,
    type: 'password',
    placeholder: 'パスワード'
  },
  {
    id: 'responsibility',
    label: `${action}の責任を負うことを確認します`,
    required: true,
    type: 'checkbox'
  }
];