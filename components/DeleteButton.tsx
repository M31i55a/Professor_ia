'use client';

import { useState, useTransition } from 'react';
import { deleteCompanion } from '@/lib/actions/companion.actions';
import { usePathname } from 'next/navigation';

interface DeleteButtonProps {
  companionId: string;
}

const DeleteButton = ({ companionId }: DeleteButtonProps) => {
  const [isPending, startTransition] = useTransition();
  const [deleted, setDeleted] = useState(false);
  const pathname = usePathname();

  if (deleted) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Delete this companion? This cannot be undone.')) return;

    startTransition(async () => {
      await deleteCompanion(companionId, pathname);
      setDeleted(true);
    });
  };

  return (
    <button
      className="companion-bookmark bg-black"
      onClick={handleClick}
      disabled={isPending}
      aria-label="Delete companion"
    >
      {/* Trash icon */}
      <svg
        width="12"
        height="13"
        viewBox="0 0 12 13"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1 3h10M4 3V2h4v1M2 3l.667 8c0 .552.447 1 1 1h4.666c.553 0 1-.448 1-1L10 3H2z"
          stroke="white"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M4.5 6v3.5M7.5 6v3.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </button>
  );
};

export default DeleteButton;
