// import Header from '@/components/Header';
// import MobileNavigation from '@/components/MobileNavigation';
// import Sidebar from '@/components/Sidebar';
// import { getCurrentUser } from '@/lib/actions/user.actions';
// import { redirect } from 'next/navigation';
// import React from 'react';
// import { Toaster } from '@/components/ui/toaster';

// export const dynamic = 'force-dynamic';

// const Layout = async ({ children }: { children: React.ReactNode }) => {
//     const currentUser = await getCurrentUser();

//     // if (!currentUser) {
//     //     redirect('/sign-in');
//     //     return null; // Explicit return to prevent further rendering
//     // }

//     // if (typeof window === 'undefined' && !currentUser) {
//     //     redirect('/sign-in');
//     // }

//     if (!currentUser) return redirect('/sign-in');

//     return (
//         <main className="flex h-screen">
//             <Sidebar {...currentUser} />
//             <section className="flex h-full flex-1 flex-col">
//                 <MobileNavigation {...currentUser} />
//                 <Header
//                     userId={currentUser.$id}
//                     accountId={currentUser.accountId}
//                 />
//                 <div className="main-content">{children}</div>
//             </section>

//             <Toaster />
//         </main>
//     );
// };

// export default Layout;

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/user.actions';
import Header from '@/components/Header';
import MobileNavigation from '@/components/MobileNavigation';
import Sidebar from '@/components/Sidebar';
import { Toaster } from '@/components/ui/toaster';

export const dynamic = 'force-dynamic';

const Layout = async ({ children }: { children: React.ReactNode }) => {
    try {
        const currentUser = await getCurrentUser();

        if (typeof window === 'undefined' && !currentUser) {
            // Explicit redirection if no currentUser
            return redirect('/sign-in');
        }

        return (
            <main className="flex h-screen">
                <Sidebar {...currentUser} />
                <section className="flex h-full flex-1 flex-col">
                    <MobileNavigation {...currentUser} />
                    <Header
                        userId={currentUser.$id}
                        accountId={currentUser.accountId}
                    />
                    <div className="main-content">{children}</div>
                </section>

                <Toaster />
            </main>
        );
    } catch (error) {
        // If there is an error during user retrieval, redirect to sign-in
        console.error('Error retrieving current user:', error);
        return redirect('/sign-in');
    }
};

export default Layout;
