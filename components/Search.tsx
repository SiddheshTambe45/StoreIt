'use client';

import Image from 'next/image';
import React, { useState, useEffect /* useCallback */ } from 'react';
import { Input } from './ui/input';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getFiles } from '@/lib/actions/file.actions';
import { Models } from 'node-appwrite';
import Thumbnail from './Thumbnail';
import FormattedDateTime from './FormattedDateTime';
import { useDebounce } from 'use-debounce';

// const debounce = <T extends (...args: any[]) => void>(
//     func: T,
//     delay: number,
// ): ((...args: Parameters<T>) => void) => {
//     let timer: NodeJS.Timeout;
//     return (...args: Parameters<T>) => {
//         clearTimeout(timer);
//         timer = setTimeout(() => func(...args), delay);
//     };
// };

const Search = () => {
    const [query, setQuery] = useState('');
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('query') || '';
    const [results, setResults] = useState<Models.Document[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const path = usePathname();
    const [debouncedQuery] = useDebounce(query, 300);

    useEffect(() => {
        const fetchFiles = async () => {
            if (debouncedQuery.length === 0) {
                setResults([]);
                setIsOpen(false);
                return router.push(path.replace(searchParams.toString(), ''));
            }
            const files = await getFiles({
                types: [],
                searchText: debouncedQuery,
            });

            setResults(files.documents);
            setIsOpen(true);
        };

        fetchFiles();
    }, [debouncedQuery]);

    // const fetchFiles = useCallback(
    //     debounce(async (searchText: string) => {
    //         if (!searchText) {
    //             setResults([]);
    //             setIsOpen(false);
    //             return router.push(path.replace(searchParams.toString(), ''));
    //         }

    //         const files = await getFiles({ types: [], searchText });
    //         setResults(files.documents);
    //         setIsOpen(true);
    //     }, 500), // Delay of 500ms
    //     [],
    // );

    // useEffect(() => {
    //     fetchFiles(query);
    // }, [query]);

    useEffect(() => {
        if (!searchQuery) {
            setQuery('');
        }
    }, [searchQuery]);

    const handleClickItem = (file: Models.Document) => {
        setIsOpen(false);
        setResults([]);
        router.push(
            `/${file.type === 'video' || file.type === 'audio' ? 'media' : file.type + 's'}?query=${query}`,
        );
    };

    return (
        <div className="search">
            <div className="search-input-wrapper">
                <Image
                    src="/assets/icons/search.svg"
                    alt="search"
                    width={24}
                    height={24}
                />
                <Input
                    value={query}
                    placeholder="Search ..."
                    className="search-input"
                    onChange={(e) => setQuery(e.target.value)}
                />

                {isOpen && (
                    <ul className="search-result">
                        {results.length > 0 ? (
                            results.map((file) => (
                                <li
                                    key={file.$id}
                                    className="flex items-center justify-between"
                                    onClick={() => handleClickItem(file)}
                                >
                                    <div className="flex cursor-pointer items-center gap-4">
                                        <Thumbnail
                                            type={file.type}
                                            extension={file.extension}
                                            url={file.url}
                                            className="size-9 min-w-9"
                                        />
                                        <p className="subtitle-2 line-clamp-1 text-light=100">
                                            {file.name}
                                        </p>
                                    </div>
                                    <FormattedDateTime
                                        date={file.$createdAt}
                                        className="caption line-clamp-1 text-light-200"
                                    />
                                </li>
                            ))
                        ) : (
                            <p className="empty-result">No Results</p>
                        )}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Search;
