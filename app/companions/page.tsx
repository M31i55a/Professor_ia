import {getAllCompanions, getMyBookmarkedIds} from "@/lib/actions/companion.actions";
import CompanionCard from "@/components/CompanionCard";
import {getSubjectColor} from "@/lib/utils";
import SearchInput from "@/components/SearchInput";
import SubjectFilter from "@/components/SubjectFilter";
import { auth } from "@clerk/nextjs/server";

const CompanionsLibrary = async ({ searchParams }: SearchParams) => {
    const filters = await searchParams;
    const subject = filters.subject ? filters.subject : '';
    const topic = filters.topic ? filters.topic : '';

    const { userId } = await auth();

    const [companions, bookmarkedIds] = await Promise.all([
        getAllCompanions({ subject, topic }),
        getMyBookmarkedIds(),
    ]);

    return (
        <main className="flex flex-col gap-6">
            <section className="flex justify-between items-center gap-4 max-sm:flex-col max-sm:items-start">
                <h1>Companion Library</h1>
                <div className="flex gap-3 max-sm:w-full">
                    <SearchInput />
                    <SubjectFilter />
                </div>
            </section>
            {companions.length === 0 ? (
                <p className="text-center text-muted-foreground py-20">No companions found. Try a different search or filter.</p>
            ) : (
                <section className="companions-grid">
                    {companions.map((companion) => (
                        <CompanionCard
                            key={companion.id}
                            {...companion}
                            color={getSubjectColor(companion.subject)}
                            isBookmarked={bookmarkedIds.includes(String(companion.id))}
                            isOwner={companion.author === userId}
                        />
                    ))}
                </section>
            )}
        </main>
    )
}

export default CompanionsLibrary