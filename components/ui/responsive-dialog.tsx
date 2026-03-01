'use client';

import * as React from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './drawer';

interface ResponsiveDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface ResponsiveDialogContentProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveDialogHeaderProps {
  children: React.ReactNode;
}

interface ResponsiveDialogTitleProps {
  children: React.ReactNode;
}

interface ResponsiveDialogDescriptionProps {
  children: React.ReactNode;
}

interface ResponsiveDialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

const ResponsiveDialogContext = React.createContext<{
  isDesktop: boolean;
}>({ isDesktop: true });

export function ResponsiveDialog({ 
  children, 
  open, 
  onOpenChange 
}: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const contextValue = React.useMemo(
    () => ({ isDesktop }),
    [isDesktop]
  );

  if (isDesktop) {
    return (
      <ResponsiveDialogContext.Provider value={contextValue}>
        <Dialog open={open} onOpenChange={onOpenChange}>
          {children}
        </Dialog>
      </ResponsiveDialogContext.Provider>
    );
  }

  return (
    <ResponsiveDialogContext.Provider value={contextValue}>
      <Drawer open={open} onOpenChange={onOpenChange}>
        {children}
      </Drawer>
    </ResponsiveDialogContext.Provider>
  );
}

export function ResponsiveDialogTrigger({ 
  children, 
  asChild 
}: ResponsiveDialogTriggerProps) {
  const { isDesktop } = React.useContext(ResponsiveDialogContext);

  if (isDesktop) {
    return <DialogTrigger asChild={asChild}>{children}</DialogTrigger>;
  }

  return <DrawerTrigger asChild={asChild}>{children}</DrawerTrigger>;
}

export function ResponsiveDialogContent({ 
  children, 
  className 
}: ResponsiveDialogContentProps) {
  const { isDesktop } = React.useContext(ResponsiveDialogContext);

  if (isDesktop) {
    return (
      <DialogContent className={className}>
        {children}
      </DialogContent>
    );
  }

  return (
    <DrawerContent className={className}>
      <div className="px-4 pb-4">
        {children}
      </div>
    </DrawerContent>
  );
}

export function ResponsiveDialogHeader({ children }: ResponsiveDialogHeaderProps) {
  const { isDesktop } = React.useContext(ResponsiveDialogContext);

  if (isDesktop) {
    return <DialogHeader>{children}</DialogHeader>;
  }

  return <DrawerHeader className="text-left">{children}</DrawerHeader>;
}

export function ResponsiveDialogTitle({ children }: ResponsiveDialogTitleProps) {
  const { isDesktop } = React.useContext(ResponsiveDialogContext);

  if (isDesktop) {
    return <DialogTitle>{children}</DialogTitle>;
  }

  return <DrawerTitle>{children}</DrawerTitle>;
}

export function ResponsiveDialogDescription({ 
  children 
}: ResponsiveDialogDescriptionProps) {
  const { isDesktop } = React.useContext(ResponsiveDialogContext);

  if (isDesktop) {
    return <DialogDescription>{children}</DialogDescription>;
  }

  return <DrawerDescription>{children}</DrawerDescription>;
}