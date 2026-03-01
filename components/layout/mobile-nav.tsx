'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Menu, 
  X, 
  Home, 
  Briefcase, 
  MessageSquare, 
  User, 
  Settings,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'ダッシュボード',
    icon: Home,
  },
  {
    href: '/jobs',
    label: '求人',
    icon: Briefcase,
  },
  {
    href: '/inbox',
    label: 'メッセージ',
    icon: MessageSquare,
  },
  {
    href: '/profile',
    label: 'プロフィール',
    icon: User,
  },
  {
    href: '/admin',
    label: '管理',
    icon: Shield,
    roles: ['ADMIN'],
  },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return session?.user?.role && item.roles.includes(session.user.role);
  });

  const toggleNav = () => setIsOpen(!isOpen);
  const closeNav = () => setIsOpen(false);

  return (
    <>
      {/* モバイルメニューボタン */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden"
        onClick={toggleNav}
        aria-label={isOpen ? 'メニューを閉じる' : 'メニューを開く'}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      {/* オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeNav}
          aria-hidden="true"
        />
      )}

      {/* モバイルナビゲーション */}
      <nav
        id="mobile-navigation"
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-background border-r transform transition-transform duration-300 ease-in-out md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="モバイルナビゲーション"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Sports Nurse</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={closeNav}
            aria-label="メニューを閉じる"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="py-4">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeNav}
                className={cn(
                  'flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-muted',
                  isActive 
                    ? 'bg-muted text-foreground border-r-2 border-primary' 
                    : 'text-muted-foreground'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* ユーザー情報 */}
        {session?.user && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-muted/50">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {session.user.profile?.name || session.user.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  {session.user.role === 'NURSE' && '看護師'}
                  {session.user.role === 'ORGANIZER' && '主催者'}
                  {session.user.role === 'ADMIN' && '管理者'}
                </p>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}