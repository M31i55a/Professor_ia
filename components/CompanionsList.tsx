
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {cn, getSubjectColor} from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

interface CompanionsListProps {
    title: string;
    companions?: Companion[];
    classNames?: string;
}

const CompanionsList = ({ title, companions, classNames }: CompanionsListProps) => {
    return (
        <article className={cn('companion-list', classNames)}>
            <h2 className="font-bold text-xl">{title}</h2>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-sm w-2/3">Lessons</TableHead>
                        <TableHead className="text-sm">Subject</TableHead>
                        <TableHead className="text-sm text-right">Duration</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {companions?.map(({id, subject, name, topic, duration}) => (
                        <TableRow key={id}>
                            <TableCell className="py-2">
                                <Link href={`/companions/${id}`}>
                                    <div className="flex items-center gap-2">
                                        <div className="size-10 flex items-center justify-center rounded-lg max-md:hidden shrink-0" style={{ backgroundColor: getSubjectColor(subject) }}>
                                            <Image
                                                src={`/icons/${subject}.svg`}
                                                alt={subject}
                                                width={22}
                                                height={22} />
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <p className="font-bold text-sm">
                                                {name}
                                            </p>
                                            <p className="text-xs text-foreground/60">
                                                {topic}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            </TableCell>
                            <TableCell className="py-2">
                                <div className="subject-badge w-fit max-md:hidden">
                                    {subject}
                                </div>
                                <div className="flex items-center justify-center rounded-lg w-fit p-1.5 md:hidden" style={{backgroundColor: getSubjectColor(subject)}}>
                            <Image
                                src={`/icons/${subject}.svg`}
                                alt={subject}
                                width={14}
                                height={14}
                            />
                                </div>
                            </TableCell>
                            <TableCell className="py-2">
                                <div className="flex items-center gap-1.5 w-full justify-end">
                                    <p className="text-sm">
                                        {duration}{' '}
                                        <span className="max-md:hidden">mins</span>
                                    </p>
                                    <Image src="/icons/clock.svg" alt="minutes" width={11} height={11} className="md:hidden" />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </article>
    )
}

export default CompanionsList;