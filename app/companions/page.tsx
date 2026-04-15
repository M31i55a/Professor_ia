import { getAllCompanions } from "@/lib/actions/companion.actions";
import CompanionCard from "@/components/CompanionCard";
import { getSubjectColor } from "@/lib/utils";

interface SearchParams {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const CompanionsLibrary = async ({ searchParams }: SearchParams) => {
  const filters = await searchParams;
  const subject = filters.subject ? (filters.subject as string) : '';
  const topic = filters.topic ? (filters.topic as string) : '';
  const page = filters.page ? parseInt(filters.page as string) : 1;

  const companions = await getAllCompanions({ subject, topic, page, limit: 12 });

  return (
    <main className="container mx-auto px-4 py-8">
      <section className="mb-8">
        <h1 className="text-4xl font-bold">Companion Library</h1>
      </section>
      
      <section className="companions-grid">
        {companions && companions.length > 0 ? (
          companions.map((companion) => (
            <CompanionCard
              key={companion.id}
              {...companion}
              color={getSubjectColor(companion.subject)}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No companions found. Try adjusting your filters.</p>
          </div>
        )}
      </section>
    </main>
  )
}

export default CompanionsLibrary