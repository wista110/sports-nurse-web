'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Home, 
  Briefcase, 
  MessageSquare, 
  User, 
  Shield,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  badge?: number;
}

interface MobileBottomNavProps {
  unreadCount?: number;
}

export function MobileBottomNav({ unreadCount = 0 }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems: NavItem[] = [
    {
      href: '/dashboard',
      label: 'ホーム',
      icon: Home,
    },
    {
      href: '/jobs',
      label: '求人',
      icon: Briefcase,
    },
    {
      href: '/jobs/new',
      label: '投稿',
      icon: Plus,
      roles: ['ORGANIZER'],
    },
    {
      href: '/inbox',
      label: 'メッセージ',
      icon: MessageSquare,
      badge: unreadCount,
    },
    {
      href: '/profile',
      label: 'プロフィール',
      icon: User,
    },
  ];

  // 管理者の場合は管理メニューを追加
  if (session?.user?.role === 'ADMIN') {
    navItems.push({
      href: '/admin',
      label: '管理',
      icon: Shield,
      roles: ['ADMIN'],
    });
  }

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return session?.user?.role && item.roles.includes(session.user.role);
  });

  // 5個以下に制限
  const displayItems = filteredNavItems.slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t md:hidden">
      <div className="flex items-center justify-around px-2 py-1">
        {displayItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center min-w-0 flex-1 px-1 py-2 text-xs font-medium transition-colors relative',
                'hover:text-primary focus:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon className={cn(
                  'h-5 w-5 mb-1',
                  isActive && 'text-primary'
                )} />
                
                {/* バッジ表示 */}
                {item.badge && item.badge > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center min-w-[16px]"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              
              <span className={cn(
                'truncate max-w-full leading-tight',
                isActive && 'text-primary'
              )}>
                {item.label}
              </span>
              
              {/* アクティブインジケーター */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}