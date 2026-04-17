import React from 'react'
import Image from 'next/image'
import Link from 'next/dist/client/link';
import BookmarkButton from '@/components/BookmarkButton';
import DeleteButton from '@/components/DeleteButton';

interface CompanionCardProps {
  id: string;
  name: string;
  topic: string;
  subject: string;
  duration: number;
  color: string;
  description: string;
  isBookmarked?: boolean;
  isOwner?: boolean;
}


const CompanionCard = ({id, name, topic, subject, duration, color, description, isBookmarked = false, isOwner = false}: CompanionCardProps) => {
  return (
    <article className="companion-card relative" style={{ backgroundColor: color }}>
      <div className="hidden dark:block absolute inset-0 rounded-4xl bg-black/30 pointer-events-none z-0" />
      <div className="relative z-10 flex justify-between items-center">
        <div className="subject-badge">{subject}</div>

        <div className="flex items-center gap-2">
          {isOwner && <DeleteButton companionId={String(id)} />}
          <BookmarkButton companionId={String(id)} isBookmarked={isBookmarked} />
        </div>
      </div>

      <h2 className="relative z-10 text-2xl font-bold">{name}</h2>
      <p className="relative z-10 text-sm">{topic}</p>
      <div className="relative z-10 flex items-center gap-2">
        <Image
          src="/icons/clock.svg"
          alt="duration"
          width={13.5}
          height={13.5}
        />
        <p className="text-sm">{duration} minutes</p>
      </div>

      <Link href={`/companions/${id}`} className="relative z-10 w-full">
        <button className="btn-primary w-full justify-center bg-black">
          Launch Lesson
        </button>
      </Link>
    </article>
  )
}

export default CompanionCard