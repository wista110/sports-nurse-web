'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MobileFormSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  required?: boolean;
  className?: string;
}

export function MobileFormSection({ 
  title, 
  children, 
  defaultExpanded = true,
  required = false,
  className 
}: MobileFormSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card className={className}>
      <CardHeader 
        className="pb-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center space-x-1">
            {title}
            {required && (
              <span className="text-red-500 text-sm" aria-label="必須">
                *
              </span>
            )}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

interface MobileFormProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  className?: string;
}

export function MobileForm({ 
  children, 
  onSubmit, 
  submitLabel = '送信',
  isSubmitting = false,
  className 
}: MobileFormProps) {
  return (
    <form onSubmit={onSubmit} className={cn('space-y-4', className)}>
      {children}
      
      {/* 固定送信ボタン */}
      <div className="sticky bottom-0 bg-background border-t p-4 -mx-4 -mb-4">
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? '送信中...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

// タッチフレンドリーな入力コンポーネント
interface MobileTouchInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel' | 'number';
  required?: boolean;
  error?: string;
}

export function MobileTouchInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  error
}: MobileTouchInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={cn(
          'w-full px-4 py-3 text-base border rounded-lg',
          'focus:ring-2 focus:ring-primary focus:border-primary',
          'touch-manipulation', // タッチ操作の最適化
          error && 'border-red-500 focus:ring-red-500 focus:border-red-500'
        )}
        // モバイル用の入力最適化
        autoComplete={type === 'email' ? 'email' : type === 'tel' ? 'tel' : 'off'}
        inputMode={
          type === 'number' ? 'numeric' : 
          type === 'tel' ? 'tel' : 
          type === 'email' ? 'email' : 'text'
        }
      />
      
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// モバイル用選択コンポーネント
interface MobileTouchSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export function MobileTouchSelect({
  label,
  value,
  onChange,
  options,
  placeholder = '選択してください',
  required = false,
  error
}: MobileTouchSelectProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={cn(
          'w-full px-4 py-3 text-base border rounded-lg bg-background',
          'focus:ring-2 focus:ring-primary focus:border-primary',
          'touch-manipulation',
          error && 'border-red-500 focus:ring-red-500 focus:border-red-500'
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}