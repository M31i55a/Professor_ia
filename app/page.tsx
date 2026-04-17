import React from 'react'
import CompanionCard from '@/components/CompanionCard'
import CompanionsList from '@/components/CompanionsList'
import CTA from '@/components/CTA'
import { getPopularCompanions, getAllCompanions } from "@/lib/actions/companion.actions";
import { getSubjectColor } from "@/lib/utils";


const Page = async () => {
  const [popularCompanions, recentSessions] = await Promise.all([
    getPopularCompanions(3),
    getAllCompanions({ limit: 5 }),
  ]);

  return (
    <main className="flex flex-col gap-8">
      <section>
        <h1 className="mb-5">Popular Companions</h1>
        {popularCompanions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {popularCompanions.map((companion) => (
              <CompanionCard
                key={companion.id}
                {...companion}
                color={getSubjectColor(companion.subject)}
                description=""
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-6">No popular companions yet. Complete a session to see them here.</p>
        )}
      </section>

      <section className="home-section">
        <CompanionsList
          title="Recently Created Companions"
          companions={recentSessions}
          classNames="flex-1 w-full"
        />
        <CTA />
      </section>
    </main>
  )
}

export default Page