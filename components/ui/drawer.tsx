'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface DrawerProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface DrawerContentProps {
  children: React.ReactNode;
  className?: string;
}

interface DrawerHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface DrawerTitleProps {
  children: React.ReactNode;
}

interface DrawerDescriptionProps {
  children: React.ReactNode;
}

interface DrawerTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

const DrawerContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>({
  open: false,
  onOpenChange: () => {},
});

export function Drawer({ children, open = false, onOpenChange }: DrawerProps) {
  const contextValue = React.useMemo(
    () => ({ open, onOpenChange: onOpenChange || (() => {}) }),
    [open, onOpenChange]
  );

  return (
    <DrawerContext.Provider value={contextValue}>
      {children}
      {open && (
        <div 
          className="fixed inset-0 z-50 bg-black/50" 
          onClick={() => onOpenChange?.(false)}
        />
      )}
    </DrawerContext.Provider>
  );
}

export function DrawerTrigger({ children, asChild }: DrawerTriggerProps) {
  const { onOpenChange } = React.useContext(DrawerContext);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: () => onOpenChange(true),
    });
  }

  return (
    <button onClick={() => onOpenChange(true)}>
      {children}
    </button>
  );
}

export function DrawerContent({ children, className }: DrawerContentProps) {
  const { open, onOpenChange } = React.useContext(DrawerContext);

  if (!open) return null;

  return (
    <div className={cn(
      'fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background',
      'animate-in slide-in-from-bottom-80 duration-300',
      className
    )}>
      <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
      {children}
    </div>
  );
}

export function DrawerHeader({ children, className }: DrawerHeaderProps) {
  return (
    <div className={cn('grid gap-1.5 p-4 text-center sm:text-left', className)}>
      {children}
    </div>
  );
}

export function DrawerTitle({ children }: DrawerTitleProps) {
  return (
    <h2 className="text-lg font-semibold leading-none tracking-tight">
      {children}
    </h2>
  );
}

export function DrawerDescription({ children }: DrawerDescriptionProps) {
  return (
    <p className="text-sm text-muted-foreground">
      {children}
    </p>
  );
}