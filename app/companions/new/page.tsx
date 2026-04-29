import React from 'react'
import CompanionForm from "@/components/CompanionForm";
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

const NewCompanion = async () => {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return (
    <main className="w-full max-w-5xl mx-auto px-4">
      <article className='w-full gap-4 flex flex-col'>
        <h1 className="text-center">Companion Builder</h1>

        <CompanionForm />
      </article>
    </main>
  )
}

export default NewCompanion