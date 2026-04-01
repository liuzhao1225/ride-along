"use client";

import { useCallback, useRef, useState } from "react";

type PendingAction = (() => Promise<void> | void) | null;

export function useAuthDialogAction() {
  const [open, setOpen] = useState(false);
  const pendingActionRef = useRef<PendingAction>(null);

  const openDialog = useCallback((action?: () => Promise<void> | void) => {
    pendingActionRef.current = action ?? null;
    setOpen(true);
  }, []);

  const requireAuth = useCallback(
    (
      isAuthenticated: boolean,
      action: () => Promise<void> | void
    ) => {
      if (isAuthenticated) {
        void action();
        return;
      }

      pendingActionRef.current = action;
      setOpen(true);
    },
    []
  );

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      pendingActionRef.current = null;
    }
  }, []);

  const handleAuthSuccess = useCallback(() => {
    setOpen(false);
    const nextAction = pendingActionRef.current;
    pendingActionRef.current = null;
    if (nextAction) {
      void nextAction();
    }
  }, []);

  return {
    open,
    openDialog,
    requireAuth,
    onOpenChange: handleOpenChange,
    onAuthSuccess: handleAuthSuccess,
  };
}
