'use client';

import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { navItems } from '@/constants';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import FileUploader from './FileUploader';
import { signOutUser } from '@/lib/actions/user.actions';

interface Props {
    fullName: string;
    email: string;
    avatar: string;
    $id: string;
    accountId: string;
}

const MobileNavigation = ({
    fullName,
    email,
    avatar,
    $id: ownerId,
    accountId,
}: Props) => {
    const [open, setOpen] = useState(false);
    const pathName = usePathname();

    return (
        <header className="mobile-header">
            <Image
                src="/assets/icons/logo-full-brand.svg"
                width={120}
                height={52}
                alt="logo"
                className="h-auto"
            />

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger>
                    <Image
                        src="/assets/icons/menu.svg"
                        alt="menu"
                        width={30}
                        height={30}
                        className=""
                    />
                </SheetTrigger>
                <SheetContent className="shad-sheet h-screen px-3">
                    <SheetTitle>
                        <div className="header-user">
                            <Image
                                src={avatar}
                                alt="avatar"
                                width={44}
                                height={44}
                                className="header-user-avatar"
                            />
                            <div className="block sm:hidden">
                                {' '}
                                {/* lg:block */}
                                <p className="subtitle-2 capitalize">
                                    {fullName}
                                </p>
                                <p className="caption">{email}</p>
                            </div>
                        </div>
                        <Separator className="mb-4 bg-light-200/20" />
                    </SheetTitle>
                    <nav className="mobile-nav">
                        <ul className="mobile-nav-list">
                            {navItems.map(({ url, name, icon }) => (
                                <Link
                                    href={url}
                                    key={name}
                                    className="lg:w-full"
                                >
                                    <li
                                        className={cn(
                                            'mobile-nav-item',
                                            pathName === url && 'shad-active',
                                        )}
                                    >
                                        <Image
                                            src={icon}
                                            alt={name}
                                            width={24}
                                            height={24}
                                            className={cn(
                                                'nav-icon',
                                                pathName === url &&
                                                    'nav-icon-active',
                                            )}
                                        />
                                        <p>{name}</p>
                                    </li>
                                </Link>
                            ))}
                        </ul>
                    </nav>

                    <Separator className="my-5 bg-slate-200/20" />

                    <div className="flex flex-col justify-between gap-5 pb-5">
                        <FileUploader accountId={accountId} ownerId={ownerId} />
                        <Button
                            type="submit"
                            className="mobile-sign-out-button"
                            onClick={async () => await signOutUser()}
                        >
                            <Image
                                src="/assets/icons/logout.svg"
                                alt="logout"
                                height={24}
                                width={24}
                            />
                            <p>Logout</p>
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </header>
    );
};

export default MobileNavigation;
