import React from 'react';
import { Button } from './ui/button';
import Image from 'next/image';
import Search from './Search';
import FileUploader from './FileUploader';
import { signOutUser } from '@/lib/actions/user.actions';

const Header = ({
    userId,
    accountId,
}: {
    userId: string;
    accountId: string;
}) => {
    return (
        <header className="header">
            <Search />
            <div className="header-wrapper">
                <FileUploader accountId={accountId} ownerId={userId} />
                <form
                    action={async () => {
                        'use server';
                        await signOutUser();
                    }}
                >
                    <Button type="submit" className="sign-out-button">
                        <Image
                            src="/assets/icons/logout.svg"
                            alt="logout"
                            className="w-6"
                            height={24}
                            width={24}
                        />
                    </Button>
                </form>
            </div>
        </header>
    );
};

export default Header;
