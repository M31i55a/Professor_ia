import React from 'react'
import Image from 'next/image'
import Link from 'next/dist/client/link';

interface CompanionCardProps {
  id: string;
  name: string;
  topic: string;
  subject: string;
  duration: number;
  color: string;
  description: string;
}


const CompanionCard = ({id, name, topic, subject, duration, color, description}: CompanionCardProps) => {
  return (
    <article className="companion-card relative" style={{ backgroundColor: color }}>
      <div className="hidden dark:block absolute inset-0 rounded-4xl bg-black/30 pointer-events-none z-0" />
      <div className="relative z-10 flex justify-between items-center">
        <div className="subject-badge">{subject}</div>

        <button className="companion-bookmark bg-black">
          <Image
            // src={
            //   bookmarked ? "/icons/bookmark-filled.svg" : "/icons/bookmark.svg"
            // }
            src="/icons/bookmark.svg"
            alt="bookmark"
            width={12.5}
            height={15}
          />
        </button>
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