'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

// パスから自動的にパンくずリストを生成するマッピング
const pathLabels: Record<string, string> = {
  dashboard: 'ダッシュボード',
  jobs: '求人',
  applications: '応募',
  inbox: 'メッセージ',
  profile: 'プロフィール',
  admin: '管理',
  security: 'セキュリティ',
  payments: '支払い管理',
  reviews: 'レビュー',
  reports: 'レポート',
  escrow: 'エスクロー',
  new: '新規作成',
  edit: '編集',
  offer: 'オファー',
  setup: 'セットアップ',
};

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const pathname = usePathname();

  // itemsが提供されていない場合は、パスから自動生成
  const breadcrumbItems = items || generateBreadcrumbItems(pathname);

  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <nav 
      aria-label="パンくずリスト" 
      className={cn('flex items-center space-x-1 text-sm text-muted-foreground', className)}
    >
      <Link
        href="/dashboard"
        className="flex items-center hover:text-foreground transition-colors"
        aria-label="ホームに戻る"
      >
        <Home className="h-4 w-4" />
      </Link>

      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRight className="h-4 w-4" />
          {item.href && index < breadcrumbItems.length - 1 ? (
            <Link
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span 
              className={cn(
                index === breadcrumbItems.length - 1 
                  ? 'text-foreground font-medium' 
                  : ''
              )}
              aria-current={index === breadcrumbItems.length - 1 ? 'page' : undefined}
            >
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}

function generateBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [];

  let currentPath = '';
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // 動的ルート（IDなど）の処理
    const isId = /^[a-f\d]{24}$|^\d+$/.test(segment);
    const label = isId ? 'ID' : pathLabels[segment] || segment;
    
    // 最後の要素以外はリンクを付ける
    const href = index < segments.length - 1 ? currentPath : undefined;
    
    items.push({ label, href });
  });

  return items;
}

// 特定のページ用のカスタムパンくずリスト
export function JobBreadcrumb({ jobTitle }: { jobTitle: string }) {
  return (
    <Breadcrumb
      items={[
        { label: '求人', href: '/jobs' },
        { label: jobTitle },
      ]}
    />
  );
}

export function ProfileBreadcrumb({ section }: { section?: string }) {
  const items: BreadcrumbItem[] = [
    { label: 'プロフィール', href: '/profile' },
  ];

  if (section) {
    items.push({ label: section });
  }

  return <Breadcrumb items={items} />;
}

export function AdminBreadcrumb({ section, subsection }: { 
  section?: string; 
  subsection?: string; 
}) {
  const items: BreadcrumbItem[] = [
    { label: '管理', href: '/admin' },
  ];

  if (section) {
    items.push({ 
      label: section, 
      href: subsection ? `/admin/${section.toLowerCase()}` : undefined 
    });
  }

  if (subsection) {
    items.push({ label: subsection });
  }

  return <Breadcrumb items={items} />;
}