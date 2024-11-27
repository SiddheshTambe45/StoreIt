'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import Image from 'next/image';
import React, { useState } from 'react';
import { Button } from './ui/button';
import { sendEmailOtp, verifySecret } from '@/lib/actions/user.actions';
import { redirect, useRouter } from 'next/navigation';

const OTPmodal = ({
    accountId,
    email,
}: {
    accountId: string;
    email: string;
}) => {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setIsLoading(true);

        // const sessionId = await verifySecret({ accountId, password });

        // console.log('sssss');

        // if (sessionId) router.push('/');

        try {
            const sessionId = await verifySecret({ accountId, password });

            // console.log('sssss', sessionId);

            // if (sessionId) router.push('/');

            console.log({ sessionId });
            if (sessionId) {
                // Session is valid, proceed to redirect
                console.log('Session found, redirecting...');
                redirect('/');
            } else {
                console.log('Session not found');
            }
            console.log('OTP verification successfull');
        } catch (error) {
            console.log('Failed to submit OTP', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        sendEmailOtp({ email });
    };

    return (
        <div>
            <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                <AlertDialogContent className="shad-alert-dialog">
                    <AlertDialogHeader className="relative flex justify-center">
                        <AlertDialogTitle className="h2 text-center">
                            Enter your OTP
                            <Image
                                src="/assets/icons/close-dark.svg"
                                alt="close"
                                width={20}
                                height={20}
                                onClick={() => setIsOpen(false)}
                                className="otp-close-button"
                            />
                        </AlertDialogTitle>
                        <AlertDialogDescription className="subtitle-2 text-center text-light-100">
                            We have sent an OTP code to{' '}
                            <span className="pl-1 text-brand">{email}</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <InputOTP
                        maxLength={6}
                        value={password}
                        onChange={setPassword}
                    >
                        <InputOTPGroup className="shad-otp">
                            <InputOTPSlot index={0} className="shad-otp-slot" />
                            <InputOTPSlot index={1} className="shad-otp-slot" />
                            <InputOTPSlot index={2} className="shad-otp-slot" />
                            <InputOTPSlot index={3} className="shad-otp-slot" />
                            <InputOTPSlot index={4} className="shad-otp-slot" />
                            <InputOTPSlot index={5} className="shad-otp-slot" />
                        </InputOTPGroup>
                    </InputOTP>

                    <AlertDialogFooter>
                        <div className="flex w-full flex-col gap-4">
                            <AlertDialogAction
                                onClick={handleSubmit}
                                className="shad-submit-btn h-12"
                                type="button"
                            >
                                Submit
                                {isLoading && (
                                    <Image
                                        src="/assets/icons/loader.svg"
                                        alt="loader"
                                        width={24}
                                        height={24}
                                        className="ml-2 animate-spin"
                                    />
                                )}
                            </AlertDialogAction>

                            <div className="subtitle-2 mt-2 text-center text-light-100">
                                Didn&apos;t get a OTP code?
                                <Button
                                    className="pl-1 text-brand"
                                    variant="link"
                                    type="button"
                                    onClick={handleResendOTP}
                                >
                                    Resend OTP
                                </Button>
                            </div>
                        </div>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default OTPmodal;
