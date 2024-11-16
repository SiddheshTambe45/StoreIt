'use server';

import { ID, Query } from 'node-appwrite';
import { createAdminClient } from '../appwrite';
import { appwriteConfig } from '../appwrite/config';
import { parseStringify } from '../utils';
import { cookies } from 'next/headers';

const getUserByEmail = async (email: string) => {
    const { databases } = await createAdminClient();

    const result = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        [Query.equal('email', [email])],
    );

    return result.total > 0 ? result.documents[0] : null;
};

const handleError = (error: unknown, message: string) => {
    console.log(error, message);
    throw error;
};

export const sendEmailOtp = async ({ email }: { email: string }) => {
    const { account } = await createAdminClient();

    try {
        const session = await account.createEmailToken(ID.unique(), email);

        console.log(session.userId);

        return session.userId;
    } catch (error) {
        handleError(error, 'Failed to send email OTP');
    }
};

export const createAccount = async ({
    fullName,
    email,
}: {
    fullName: string;
    email: string;
}) => {
    const existingAccount = await getUserByEmail(email);

    const accountId = await sendEmailOtp({ email });

    if (!accountId) throw new Error('Failed to send an OTP');

    if (!existingAccount) {
        const { databases } = await createAdminClient();

        await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.usersCollectionId,
            ID.unique(),
            {
                fullName,
                email,
                avatar: '',
                accountId,
            },
        );
    }

    return parseStringify({ accountId });
};

export const verifySecret = async ({
    accountId,
    password,
}: {
    accountId: string;
    password: string;
}) => {
    try {
        const { account } = await createAdminClient();

        const session = await account.createSession(accountId, password);

        (await cookies()).set('appwrite-session', session.secret, {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
        });

        return parseStringify({ sessionId: session.$id });
    } catch (error) {
        console.log(error, 'Failed to verify OTP');
    }
};
