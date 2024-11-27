'use server';

import { ID, Query } from 'node-appwrite';
import { createAdminClient, createSessionClient } from '../appwrite';
import { appwriteConfig } from '../appwrite/config';
import { parseStringify } from '../utils';
import { cookies } from 'next/headers';
import { avatarPlaceholderUrl } from '@/constants';
import { redirect } from 'next/navigation';

const getUserByEmail = async (email: string) => {
    const { databases } = await createAdminClient();

    const result = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        [Query.equal('email', [email])],
    );

    return result.total > 0 ? result.documents[0] : null;
};

const handleError = async (error: unknown, message: string) => {
    console.log(error, message);
    throw error;
};

export const sendEmailOtp = async ({ email }: { email: string }) => {
    const { account } = await createAdminClient();

    try {
        const session = await account.createEmailToken(ID.unique(), email);

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
    try {
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
                    avatar: avatarPlaceholderUrl,
                    accountId,
                    usedStorage: 0, // Initialize usedStorage to 0
                },
            );
        }

        return parseStringify({ accountId });
    } catch (error) {
        return parseStringify({ error });
    }
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
            maxAge: 60 * 60 * 60 * 60,
        });

        console.log('all good this side also');

        return parseStringify({ sessionId: session.$id });
    } catch (error) {
        console.log(error, 'Failed to verify OTP');
    }
};

// export const getCurrentUser = async () => {
//     const sessionClient = await createSessionClient();

//     if (!sessionClient) {
//         return null; // No session, return null
//     }

//     // const { databases, account } = await createSessionClient();

//     const { databases, account } = sessionClient;

//     const result = await account.get();

//     const user = await databases.listDocuments(
//         appwriteConfig.databaseId,
//         appwriteConfig.usersCollectionId,
//         [Query.equal('accountId', result.$id)],
//     );

//     if (user.total <= 0) return null;

//     return parseStringify(user.documents[0]);
// };

// export const getCurrentUser = async () => {
//     try {
//         const { databases, account } = await createSessionClient();

//         const result = await account.get();

//         const user = await databases.listDocuments(
//             appwriteConfig.databaseId,
//             appwriteConfig.usersCollectionId,
//             [Query.equal('accountId', result.$id)],
//         );

//         if (user.total <= 0) return null;

//         return parseStringify(user.documents[0]);
//     } catch (error) {
//         console.log(error);
//     }
// };

export const getCurrentUser = async () => {
    try {
        const sessionClient = await createSessionClient();

        if (!sessionClient) {
            return null; // No session, return null
        }

        // const { databases, account } = await createSessionClient();

        const { databases, account } = sessionClient;

        const result = await account.get();
        const user = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.usersCollectionId,
            [Query.equal('accountId', result.$id)],
        );

        if (user.total <= 0) return null;

        return parseStringify(user.documents[0]);
    } catch (error) {
        console.error('Error fetching current user:', error);
        return null; // Ensure null is returned on error
    }
};

export const signOutUser = async () => {
    const client = await createSessionClient();

    // Check if the client is null
    if (!client) {
        redirect('/sign-in'); // Redirect to sign-in page if no session exists
        return;
    }

    // const { account } = await createSessionClient();

    try {
        const { account } = client; // Safely destructure after the null check
        await account.deleteSession('current');
        (await cookies()).delete('appwrite-session');
    } catch (error) {
        handleError(error, 'Failed to sign out user');
    } finally {
        redirect('/sign-in');
    }
};

export const signInUser = async ({ email }: { email: string }) => {
    try {
        const existingUser = await getUserByEmail(email);

        if (existingUser) {
            await sendEmailOtp({ email });
            console.log('all good so far');

            return parseStringify({ accountId: existingUser.accountId });
        }

        return parseStringify({ accountId: null, error: 'User not found' });
    } catch (error) {
        handleError(error, 'Failed to sign in user');
    }
};
