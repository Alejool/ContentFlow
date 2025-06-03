import React, { FormEvent, ChangeEvent, useEffect } from 'react'; // Added React, FormEvent, ChangeEvent, useEffect
import InputError from '@/Components/InputError.tsx';
import InputLabel from '@/Components/InputLabel.tsx';
import PrimaryButton from '@/Components/PrimaryButton.tsx';
import TextInput from '@/Components/TextInput.tsx';
import GuestLayout from '@/Layouts/GuestLayout.tsx';
import { Head, useForm } from '@inertiajs/react';

// Define props for the page if any are passed from the controller
interface ConfirmPasswordPageProps {
    // Example: status?: string;
}

// Define the shape of the form data
interface ConfirmPasswordFormData {
    password: string;
}

export default function ConfirmPassword(props: ConfirmPasswordPageProps) { // Added props typing
    const { data, setData, post, processing, errors, reset } = useForm<ConfirmPasswordFormData>({
        password: '',
    });

    // The original component had an implicit `useEffect` via `isFocused={true}` on TextInput.
    // For explicit control and clarity in TypeScript, if `TextInput`'s `isFocused`
    // prop triggers an effect to focus, that's handled internally by TextInput.
    // If we needed to focus programmatically from here, we'd use a ref.
    // The `isFocused={true}` prop is sufficient as per original behavior.

    const submit = (e: FormEvent) => { // Typed event
        e.preventDefault();

        post((window as any).route('password.confirm'), { // Used (window as any).route for now
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Confirm Password" />

            <div className="mb-4 text-sm text-gray-600">
                This is a secure area of the application. Please confirm your
                password before continuing.
            </div>

            <form onSubmit={submit}>
                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Password" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        isFocused={true}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setData('password', e.target.value)} // Typed event
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4 flex items-center justify-end">
                    <PrimaryButton className="ms-4" disabled={processing}>
                        Confirm
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
