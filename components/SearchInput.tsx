'use client';

import {usePathname, useRouter, useSearchParams} from "next/navigation";
import {useEffect, useRef, useState} from "react";
import Image from "next/image";
import {formUrlQuery, removeKeysFromUrlQuery} from "@jsmastery/utils";

const SearchInput = () => {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Keep a ref so the debounced callback always reads the latest searchParams
    // without making searchParams a dependency (which would re-trigger on every URL change)
    const searchParamsRef = useRef(searchParams);
    searchParamsRef.current = searchParams;

    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            const params = searchParamsRef.current;
            if(searchQuery) {
                const newUrl = formUrlQuery({
                    params: params.toString(),
                    key: "topic",
                    value: searchQuery,
                });

                router.push(newUrl, { scroll: false });
            } else {
                if(pathname === '/companions' && params.has('topic')) {
                    const newUrl = removeKeysFromUrlQuery({
                        params: params.toString(),
                        keysToRemove: ["topic"],
                    });

                    router.push(newUrl, { scroll: false });
                }
            }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, router, pathname]);

    return (
        <div className="relative border border-black rounded-lg items-center flex gap-2 px-2 py-1 h-fit">
            <Image src="/icons/search.svg" alt="search" width={15} height={15} />
            <input
                placeholder="Search companions..."
                className="outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
    )
}
export default SearchInput
