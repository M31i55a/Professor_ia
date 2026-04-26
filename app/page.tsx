import React from 'react'
import CompanionCard from '@/components/CompanionCard'
import CompanionsList from '@/components/CompanionsList'
import CTA from '@/components/CTA'
import { getPopularCompanions, getAllCompanions, getMyBookmarkedIds } from "@/lib/actions/companion.actions";
import { getSubjectColor } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";


const Page = async () => {
  const { userId } = await auth();

  const [popularCompanions, recentSessions, bookmarkedIds] = await Promise.all([
    getPopularCompanions(3),
    getAllCompanions({ limit: 5 }),
    getMyBookmarkedIds(),
  ]);

  return (
    <main className="flex flex-col gap-8">
      <section className="home-section">
        <div className="flex flex-col gap-5 flex-1 min-w-0">
          <div>
            <h1 className="mb-4">Popular Companions</h1>
            {popularCompanions.length > 0 ? (
              <div className="grid grid-cols-3 max-sm:grid-cols-2 gap-2.5">
                {popularCompanions.map((companion) => (
                  <CompanionCard
                    key={companion.id}
                    {...companion}
                    color={getSubjectColor(companion.subject)}
                    description=""
                    isBookmarked={bookmarkedIds.includes(String(companion.id))}
                    isOwner={companion.author === userId}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-6">No popular companions yet. Complete a session to see them here.</p>
            )}
          </div>
          <CompanionsList
            title="Recently Created Companions"
            companions={recentSessions}
            classNames="w-full"
          />
        </div>
        <CTA className="self-start" />
      </section>
    </main>
  )
}

export default Page