'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { LiveCallIntake } from './LiveCallIntake';
import { Status, Client } from '@/types';

interface LiveCallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statuses: Status[];
  existingClients?: Client[];
  initialStatusId?: string;
  onSuccess?: (client: Client) => void;
}

export function LiveCallModal({
  open,
  onOpenChange,
  statuses,
  existingClients,
  initialStatusId,
  onSuccess,
}: LiveCallModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl bg-transparent">
        <LiveCallIntake
          statuses={statuses}
          existingClients={existingClients}
          initialStatusId={initialStatusId}
          isOpen={open}
          onClose={() => onOpenChange(false)}
          onSuccess={(c) => {
            onSuccess?.(c);
            onOpenChange(false);
          }}
          isInlineDock={false}
        />
      </DialogContent>
    </Dialog>
  );
}
