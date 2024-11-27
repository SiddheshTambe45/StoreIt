import Card from '@/components/Card';
import Sort from '@/components/Sort';
import { getFiles, getTotalSpaceUsed } from '@/lib/actions/file.actions';
import { getCurrentUser } from '@/lib/actions/user.actions';
import { convertFileSize, getFileTypesParams } from '@/lib/utils';
import { Models } from 'node-appwrite';
import React from 'react';

const page = async ({ searchParams, params }: SearchParamProps) => {
    const type = ((await params)?.type as string) || '';

    const searchText = ((await searchParams)?.query as string) || '';
    const sort = ((await searchParams)?.sort as string) || '';

    const types = getFileTypesParams(type) as FileType[];

    const files = await getFiles({ types, searchText, sort });

    const currentUser = await getCurrentUser();

    // // Fetch size for the specific file type
    // const sizes = await fetchFileSizes(types);

    // // Normalize type to singular if plural
    // // const normalizedType = type.toLowerCase().replace(/s$/, ''); // Remove plural 's' if any

    // // const totalSize = sizes[normalizedType] || '0 MB';

    // // Combine sizes for multiple types (this part can be done in the frontend)
    // // For example, combining sizes for 'audio' and 'video' under 'media'
    // const combinedMediaSize = types.reduce((acc, fileType) => {
    //     if (sizes[fileType]) {
    //         acc += parseFloat(sizes[fileType].replace(' MB', ''));
    //     }
    //     return acc;
    // }, 0);

    // // Convert back the combined size into a human-readable format
    // const formattedMediaSize = combinedMediaSize
    //     ? `${combinedMediaSize} MB`
    //     : '0 MB';

    const totalSpace = await getTotalSpaceUsed();

    // Function to extract space usage for a given type or combination of types
    const getSpaceForTypes = (types: FileType[]) => {
        let totalUsed = 0;
        let latestDate = '';

        types.forEach((fileType) => {
            if (totalSpace[fileType]) {
                totalUsed += totalSpace[fileType].size; // Add up sizes for the file types
                // Compare dates to get the most recent date across selected types
                if (
                    !latestDate ||
                    new Date(totalSpace[fileType].latestDate) >
                        new Date(latestDate)
                ) {
                    latestDate = totalSpace[fileType].latestDate;
                }
            }
        });

        return { totalUsed, latestDate };
    };

    // Check if the type is a combination (e.g., 'media') and extract the total space for media (video + audio)
    const spaceData = getSpaceForTypes(types);

    // Format the total space used for display
    const formattedTotalUsed = convertFileSize(spaceData.totalUsed);

    return (
        <div className="page-container">
            <section className="w-full">
                <h1 className="h1 capitalize">{type}</h1>
                <div className="total-size-section">
                    <p className="body-1">
                        Total: <span className="h5">{formattedTotalUsed}</span>
                    </p>

                    <div className="sort-container">
                        <p className="body-1 hidden text-light-200 sm:block">
                            Sort By:
                        </p>
                        <Sort />
                    </div>
                </div>
            </section>

            {files.total > 0 ? (
                <section className="file-list">
                    {files.documents.map((file: Models.Document) => (
                        <Card
                            key={file.$id}
                            file={file}
                            currentUser={currentUser}
                        />
                    ))}
                </section>
            ) : (
                <p className="empty-list">No files uploaded.</p>
            )}
        </div>
    );
};

export default page;
