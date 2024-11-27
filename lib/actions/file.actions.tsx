'use server';

import { createAdminClient, createSessionClient } from '../appwrite';
import { InputFile } from 'node-appwrite/file';
import { appwriteConfig } from '../appwrite/config';
import { ID, Models, Query } from 'node-appwrite';
import {
    constructFileUrl,
    convertFileSize,
    getFileType,
    parseStringify,
} from '../utils';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './user.actions';

const handleError = async (error: unknown, message: string) => {
    console.log(error, message);
    throw error;
};

export const uploadFile = async ({
    file,
    ownerId,
    accountId,
    path,
}: UploadFileProps) => {
    const { storage, databases } = await createAdminClient();

    try {
        const inputFile = InputFile.fromBuffer(file, file.name);

        const bucketFile = await storage.createFile(
            appwriteConfig.bucketId,
            ID.unique(),
            inputFile,
        );

        const fileDocument = {
            type: getFileType(bucketFile.name).type,
            name: bucketFile.name,
            url: constructFileUrl(bucketFile.$id),
            extension: getFileType(bucketFile.name).extension,
            size: bucketFile.sizeOriginal,
            owner: ownerId,
            accountId,
            users: [],
            bucketFileId: bucketFile.$id,
        };

        const newFile = await databases
            .createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.filesCollectionId,
                ID.unique(),
                fileDocument,
            )
            .catch(async (error: unknown) => {
                await storage.deleteFile(
                    appwriteConfig.bucketId,
                    bucketFile.$id,
                );
                handleError(error, 'Failed to create file document');
            });

        revalidatePath(path);

        return parseStringify(newFile);
    } catch (error) {
        handleError(error, 'Failed to upload file');
    }
};

const createQueries = async (
    currentuser: Models.Document,
    types: string[],
    searchText: string,
    sort: string,
    limit?: number,
) => {
    const queries = [
        Query.or([
            Query.equal('owner', [currentuser.$id]),
            Query.contains('users', [currentuser.email]),
        ]),
    ];

    if (types.length > 0) queries.push(Query.equal('type', types));
    if (searchText) queries.push(Query.contains('name', searchText));
    if (limit) queries.push(Query.limit(limit));

    if (sort) {
        const [sortBy, orderBy] = sort.split('-');

        queries.push(
            orderBy === 'asc'
                ? Query.orderAsc(sortBy)
                : Query.orderDesc(sortBy),
        );
    }

    return queries;
};

export const getFiles = async ({
    types = [],
    searchText = '',
    sort = '$createdAt-desc',
    limit,
}: GetFilesProps) => {
    const { databases } = await createAdminClient();

    try {
        const currentuser = await getCurrentUser();

        if (!currentuser) throw new Error('User not found');

        const queries = await createQueries(
            currentuser,
            types,
            searchText,
            sort,
            limit,
        );

        const files = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            queries,
        );

        return parseStringify(files);
    } catch (error) {
        handleError(error, 'Failed to get files');
    }
};

export const renameFile = async ({
    fileId,
    name,
    extension,
    path,
    accountId,
}: RenameFileProps) => {
    const { databases } = await createAdminClient();

    // check if owner is doing this else don't allow

    try {
        const currentuser = await getCurrentUser();

        if (!currentuser) throw new Error('User not found');

        if (currentuser.accountId !== accountId)
            throw new Error(
                "User is not the owner of file, can't rename the file",
            );

        const newName = `${name}.${extension}`;
        const updatedFile = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            fileId,
            { name: newName },
        );

        revalidatePath(path);

        return parseStringify(updatedFile);
    } catch (error) {
        handleError(error, 'Failed to rename the file');
        return null;
    }
};

export const updateFileUsers = async ({
    fileId,
    emails,
    path,
    accountId,
}: UpdateFileUsersProps) => {
    const { databases } = await createAdminClient();

    // check if owner is doing this else don't allow

    try {
        const currentuser = await getCurrentUser();

        if (!currentuser) throw new Error('User not found');

        if (currentuser.accountId !== accountId)
            throw new Error(
                "User is not the owner of file, can't rename the file",
            );
        const updatedFile = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            fileId,
            { users: emails },
        );

        revalidatePath(path);

        return parseStringify(updatedFile);
    } catch (error) {
        handleError(error, 'Failed to rename the file');
    }
};

export const deleteFile = async ({
    fileId,
    bucketFileId,
    path,
    accountId,
}: DeleteFileProps) => {
    const { databases, storage } = await createAdminClient();

    // check if owner is doing this else don't allow

    try {
        const currentuser = await getCurrentUser();

        if (!currentuser) throw new Error('User not found');

        if (currentuser.accountId !== accountId)
            throw new Error(
                "User is not the owner of file, can't rename the file",
            );

        const deletedFile = await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            fileId,
        );

        if (deletedFile) {
            await storage.deleteFile(appwriteConfig.bucketId, bucketFileId);
        }

        revalidatePath(path);

        return parseStringify({ status: 'success' });
    } catch (error) {
        handleError(error, 'Failed to rename the file');
    }
};

// interface GetTotalSpaceUsedProps {
//     fileType: 'all' | 'media' | 'image' | 'other';
// }

// export const getTotalSpaceUsed = async (fileType: FileType[] = []) => {
//     try {
//         const currentuser = await getCurrentUser();

//         if (!currentuser) throw new Error('User not found');

//         let spaceused = 0;

//         currentuser.files.forEach((file: Models.Document) => {
//             if (file.type === fileType) {
//                 spaceused = spaceused + file.size;
//             }
//         });

//         return convertFileSize(spaceused);
//     } catch (error) {
//         handleError(error, 'Failed to fetch total space used');
//     }
// };

// export const fetchFileSizes = async (fileTypes: FileType[] = []) => {
//     try {
//         // Fetch sizes for all provided file types in parallel
//         const sizePromises = fileTypes.map(async (type) => {
//             const currentUser = await getCurrentUser();
//             if (!currentUser) throw new Error('User not found');

//             let spaceUsed = 0;
//             currentUser.files.forEach((file: Models.Document) => {
//                 if (file.type === type) {
//                     spaceUsed += file.size;
//                 }
//             });

//             return { type, size: convertFileSize(spaceUsed) };
//         });

//         // Wait for all sizes to resolve
//         const sizes = await Promise.all(sizePromises);

//         // Return an object with sizes categorized by type
//         return sizes.reduce(
//             (acc, { type, size }) => {
//                 acc[type] = size;
//                 return acc;
//             },
//             {} as Record<FileType, string>,
//         );
//     } catch (error) {
//         handleError(error, 'Failed to fetch file sizes');
//         return {};
//     }
// };

// export const fetchFileSizes = async (fileTypes: FileType[] = []) => {
//     try {
//         // Fetch sizes for all provided file types in parallel
//         const sizePromises = fileTypes.map(async (type) => {
//             const currentUser = await getCurrentUser();
//             if (!currentUser) throw new Error('User not found');

//             let spaceUsed = 0;
//             currentUser.files.forEach((file: Models.Document) => {
//                 if (file.type === type) {
//                     spaceUsed += file.size;
//                 }
//             });

//             return { type, size: convertFileSize(spaceUsed) };
//         });

//         // Wait for all sizes to resolve
//         const sizes = await Promise.all(sizePromises);

//         // Return an object with sizes categorized by type
//         return sizes.reduce(
//             (acc, { type, size }) => {
//                 acc[type] = size;
//                 return acc;
//             },
//             {} as Record<string, string>, // <-- Explicitly type the object as Record<string, string>
//         );
//     } catch (error) {
//         handleError(error, 'Failed to fetch file sizes');
//         return {};
//     }
// };

export const fetchFileSizes = async (fileTypes: FileType[] = []) => {
    try {
        // Fetch the current user data once before mapping over file types
        const currentUser = await getCurrentUser();
        if (!currentUser) throw new Error('User not found');

        // Calculate sizes for each file type in parallel
        const sizePromises = fileTypes.map(async (type) => {
            let spaceUsed = 0;
            currentUser.files.forEach((file: Models.Document) => {
                if (file.type === type) {
                    spaceUsed += file.size;
                }
            });

            return { type, size: spaceUsed }; // Return the raw size for each file type
        });

        // Wait for all sizes to resolve
        const sizes = await Promise.all(sizePromises);

        // Aggregate sizes into a key-value pair, no special grouping logic
        const aggregatedSizes = sizes.reduce(
            (acc, { type, size }) => {
                acc[type] = size; // Store each file type's size
                return acc;
            },
            {} as Record<string, number>, // Store sizes as numbers (not formatted)
        );

        // Convert byte sizes into human-readable format (e.g., MB, GB)
        const formattedSizes = Object.keys(aggregatedSizes).reduce(
            (acc, key) => {
                acc[key] = convertFileSize(aggregatedSizes[key]);
                return acc;
            },
            {} as Record<string, string>, // Convert raw size into a human-readable format
        );

        return formattedSizes; // Return the formatted sizes
    } catch (error) {
        handleError(error, 'Failed to fetch file sizes');
        return {};
    }
};

export const getTotalSpaceUsed = async () => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) throw new Error('User is not authenticated');

        const sessionClient = await createSessionClient();

        if (!sessionClient) throw new Error('No valid session available');

        const { databases } = sessionClient; // Destructure `databases` after confirming

        const files = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            [Query.equal('owner', [currentUser.$id])],
        );

        const totalSpace = {
            image: { size: 0, latestDate: '' },
            document: { size: 0, latestDate: '' },
            video: { size: 0, latestDate: '' },
            audio: { size: 0, latestDate: '' },
            other: { size: 0, latestDate: '' },
            used: 0,
            all: 2 * 1024 * 1024 * 1024 /* 2GB available bucket storage */,
        };

        files.documents.forEach((file) => {
            const fileType = file.type as FileType;
            totalSpace[fileType].size += file.size;
            totalSpace.used += file.size;

            if (
                !totalSpace[fileType].latestDate ||
                new Date(file.$updatedAt) >
                    new Date(totalSpace[fileType].latestDate)
            ) {
                totalSpace[fileType].latestDate = file.$updatedAt;
            }
        });

        return parseStringify(totalSpace);
    } catch (error) {
        console.log(error);
        handleError(error, 'Failed to get total space used');
        return null;
    }
};
