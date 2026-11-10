'use client';
import { Note, User } from '@/types';
import { formatDateTime, timeAgo, getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trash2 } from 'lucide-react';

interface NoteItemProps {
  note: Note;
  currentUser?: User | null;
  onDelete?: (noteId: string) => void;
}

export function NoteItem({ note, currentUser, onDelete }: NoteItemProps) {
  const author = typeof note.createdBy === 'object' ? note.createdBy : null;
  const authorName = author?.name || 'Staff';
  const authorId = author?._id || (typeof note.createdBy === 'string' ? note.createdBy : '');

  const canDelete =
    currentUser?.role === 'admin' ||
    (currentUser?._id && authorId === currentUser._id);

  return (
    <div className="flex gap-3 p-3.5 rounded-xl bg-gray-50/70 border border-gray-100 hover:bg-gray-50 transition-colors group">
      <Avatar className="h-7 w-7 mt-0.5">
        <AvatarFallback className="text-[10px] bg-[#2C8567]/15 text-[#2C8567] font-medium">
          {getInitials(authorName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-900">{authorName}</span>
            <span className="text-[11px] text-gray-400" title={formatDateTime(note.createdAt)}>
              {timeAgo(note.createdAt)}
            </span>
          </div>
          {canDelete && onDelete && (
            <button
              onClick={() => onDelete(note._id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 rounded transition-opacity"
              title="Delete note"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
          {note.content}
        </p>
      </div>
    </div>
  );
}
