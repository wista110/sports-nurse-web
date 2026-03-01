'use client';

import { ArrowLeft, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface MobileHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export function MobileHeader({ 
  title, 
  showBackButton = false, 
  onBack, 
  actions,
  className 
}: MobileHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <header className={`sticky top-0 z-30 bg-background border-b md:hidden ${className}`}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2 -ml-2"
              aria-label="戻る"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          
          <h1 className="text-lg font-semibold truncate">
            {title}
          </h1>
        </div>

        {actions && (
          <div className="flex items-center space-x-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

// よく使われるヘッダーパターン
export function MobilePageHeader({ 
  title, 
  showBackButton = true 
}: { 
  title: string; 
  showBackButton?: boolean; 
}) {
  return (
    <MobileHeader
      title={title}
      showBackButton={showBackButton}
    />
  );
}

export function MobileDetailHeader({ 
  title, 
  onShare, 
  onFavorite 
}: { 
  title: string; 
  onShare?: () => void; 
  onFavorite?: () => void; 
}) {
  return (
    <MobileHeader
      title={title}
      showBackButton={true}
      actions={
        <Button
          variant="ghost"
          size="sm"
          className="p-2"
          aria-label="その他のオプション"
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
      }
    />
  );
}