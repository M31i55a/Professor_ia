'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { addBookmark, removeBookmark } from '@/lib/actions/companion.actions';
import { usePathname } from 'next/navigation';

interface BookmarkButtonProps {
  companionId: string;
  isBookmarked: boolean;
}

const BookmarkButton = ({ companionId, isBookmarked: initial }: BookmarkButtonProps) => {
  const [bookmarked, setBookmarked] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      if (bookmarked) {
        setBookmarked(false);
        await removeBookmark(companionId, pathname);
      } else {
        setBookmarked(true);
        await addBookmark(companionId, pathname);
      }
    });
  };

  return (
    <button
      className="companion-bookmark bg-black"
      onClick={handleClick}
      disabled={isPending}
      aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark companion'}
    >
      <Image
        src={bookmarked ? '/icons/bookmark-filled.svg' : '/icons/bookmark.svg'}
        alt="bookmark"
        width={12.5}
        height={15}
      />
    </button>
  );
};

export default BookmarkButton;
