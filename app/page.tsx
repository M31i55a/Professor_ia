import React from 'react'
import CompanionCard from '@/components/CompanionCard'
import CompanionsList from '@/components/CompanionsList'
import CTA from '@/components/CTA'
import {recentSessions} from "@/constants/index";


const Page = () => {
  return (
    <main>
      <h1 className='text-2xl underline'>Popular Companions</h1>
      
      <section className='home-section'>
        <CompanionCard 
          id="123"
          name="Albert Einstein"
          topic="Physics"
          subject="Science"
          duration={30}
          color="#F59E0B"
          description="Learn physics with Albert Einstein, the father of modern physics. Explore the mysteries of the universe and unravel the secrets of space and time with this iconic companion."
        />
        <CompanionCard 
          id="456"
          name="Marie Curie"
          topic="Chemistry"
          subject="Science"
          duration={45}
          color="#3B82F6"
          description="Discover the wonders of chemistry with Marie Curie, a pioneer in the field. Learn about radioactivity and the elements that shaped our understanding of the periodic table."
        />
        <CompanionCard 
          id="789"
          name="Isaac Newton"
          topic="Mathematics"
          subject="Mathematics"
          duration={60}
          color="#10B981"
          description="Master mathematics with Isaac Newton, the genius behind calculus and the laws of motion. Dive into the world of numbers and discover the principles that govern our universe."
        />
      </section>

      <section className="home-section">
        <CompanionsList 
          title="Recently completed sessions"
          companions={recentSessions}
          classNames="w-2/3 max-md:w-full"
        />
        <CTA /> 
      </section>
    </main>
  )
}

export default Page