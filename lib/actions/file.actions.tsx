'use server';

import { createAdminClient } from '../appwrite';
import { InputFile } from 'node-appwrite/file';
import { appwriteConfig } from '../appwrite/config';
import { ID, Models, Query } from 'node-appwrite';
import { constructFileUrl, getFileType, parseStringify } from '../utils';
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
}: RenameFileProps) => {
    const { databases } = await createAdminClient();

    // check if owner is doing this else don't allow

    try {
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
    }
};

export const updateFileUsers = async ({
    fileId,
    emails,
    path,
}: UpdateFileUsersProps) => {
    const { databases } = await createAdminClient();

    // check if owner is doing this else don't allow

    try {
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
}: DeleteFileProps) => {
    const { databases, storage } = await createAdminClient();

    // check if owner is doing this else don't allow

    try {
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
