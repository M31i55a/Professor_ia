import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import CompanionCard from "@/components/CompanionCard";
import { getBookmarkedCompanions } from "@/lib/actions/companion.actions";
import { getSubjectColor } from "@/lib/utils";

const BookmarkedPage = async () => {
    const { userId } = await auth();

    if (!userId) redirect("/sign-in");

    const companions = await getBookmarkedCompanions(userId);

    return (
        <main className="flex flex-col gap-6">
            <section className="flex items-center gap-4">
                <h1>Bookmarked Companions</h1>
            </section>

            {companions.length === 0 ? (
                <p className="text-center text-muted-foreground py-20">
                    No bookmarks yet. Click the bookmark icon on any companion to save it here.
                </p>
            ) : (
                <section className="companions-grid">
                    {companions.map((companion) => (
                        <CompanionCard
                            key={companion.id}
                            {...companion}
                            color={getSubjectColor(companion.subject)}
                            isBookmarked={true}
                        />
                    ))}
                </section>
            )}
        </main>
    );
};

export default BookmarkedPage;
