'use client';

import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CallNotepad } from './CallNotepad';
import { Status, Client } from '@/types';

interface CallNotepadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statuses: Status[];
  onSuccess?: (client: Client) => void;
}

export function CallNotepadModal({
  open,
  onOpenChange,
}: CallNotepadModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl bg-transparent">
        <CallNotepad
          onClose={() => onOpenChange(false)}
          isInline={false}
        />
      </DialogContent>
    </Dialog>
  );
}
