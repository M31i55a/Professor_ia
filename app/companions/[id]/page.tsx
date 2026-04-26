import {getCompanion} from "@/lib/actions/companion.actions";
import {currentUser} from "@clerk/nextjs/server";
import {redirect} from "next/navigation";
import {getSubjectColor} from "@/lib/utils";
import Image from "next/image";
import CompanionComponent from "@/components/CompanionComponent";

interface CompanionSessionPageProps {
    params: Promise<{ id: string}>;
}

const CompanionSession = async ({ params }: CompanionSessionPageProps) => {
    const { id } = await params;
    const companion = await getCompanion(id);
    const user = await currentUser();

    const { name, subject, title, topic, duration } = companion;

    if(!user) redirect('/sign-in');
    if(!name) redirect('/companions')

    return (
        <main className="session-page-main">
            <article className="session-header">
                <div className="flex items-center gap-3">
                    <div className="size-17 flex items-center justify-center rounded-xl max-md:hidden relative overflow-hidden shrink-0" style={{ backgroundColor: getSubjectColor(subject) }}>
                        <div className="absolute inset-0 bg-linear-to-br from-white/15 to-transparent" />
                        <Image src={`/icons/${subject}.svg`} alt={subject} width={34} height={34} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-lg">{name}</p>
                            <div className="subject-badge max-sm:hidden">{subject}</div>
                        </div>
                        <p className="text-xs text-foreground/60">{topic}</p>
                    </div>
                </div>
                <div
                    className="flex items-center gap-2 text-sm font-semibold max-md:hidden shrink-0 px-4 py-2 rounded-full"
                    style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.22)', color: 'rgb(196,181,253)' }}
                >
                    <span>&#9201;</span>
                    <span>{duration} min</span>
                </div>
            </article>

            <CompanionComponent
                {...companion}
                companionId={id}
                userName={user.firstName!}
                userImage={user.imageUrl!}
            />
        </main>
    )
}

export default CompanionSession
