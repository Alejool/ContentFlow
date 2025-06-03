import React, { FormEvent, ChangeEvent } from 'react'; // Added React, FormEvent, ChangeEvent
import InputError from '@/Components/InputError.tsx';
import PrimaryButton from '@/Components/PrimaryButton.tsx';
import TextInput from '@/Components/TextInput.tsx';
import GuestLayout from '@/Layouts/GuestLayout.tsx';
import { Head, useForm, Link } from '@inertiajs/react'; // Added Link
import Logo from '@/../assets/logo.png';

// Define props for the page
interface ForgotPasswordPageProps {
    status?: string;
}

// Define the shape of the form data
interface ForgotPasswordFormData {
    email: string;
}

export default function ForgotPassword({ status }: ForgotPasswordPageProps) { // Typed props
    const { data, setData, post, processing, errors } = useForm<ForgotPasswordFormData>({
        email: '',
    });

    const submit = (e: FormEvent) => { // Typed event
        e.preventDefault();
        post((window as any).route('password.email')); // Used (window as any).route for now
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            <div className="min-h-screen flex flex-col lg:flex-row">
                {/* Mitad izquierda: Fondo rojo, logo e imagen */}
                <div className="w-full lg:w-1/2 bg-red-600 bg-opacity-90 flex flex-col items-center justify-center p-8">
                    <div className="text-white text-center">
                        <h1 className="text-4xl font-bold mb-4">Welcome</h1>
                        <p className="text-lg">
                            Recover your account with your email.
                        </p>
                    </div>
                    <Link href="/">
                        <img
                            src={Logo}
                            alt="Register Image"
                            className="w-64 object-cover h-40"
                        />
                    </Link>
                </div>

                {/* Mitad derecha: Formulario de recuperación de contraseña */}
                <div className="w-full lg:w-1/2 flex items-center justify-center  p-8">
                    <form onSubmit={submit} className="w-full max-w-md space-y-6">
                        <div className="mb-4 text-sm text-gray-600">
                            Forgot your password? No problem. Just let us know your email
                            address and we will email you a password reset link that will
                            allow you to choose a new one.
                        </div>

                        {status && (
                            <div className="mb-4 text-sm font-medium text-green-600">
                                {status}
                            </div>
                        )}

                        <div>
                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="mt-1 block w-full"
                                isFocused={true}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setData('email', e.target.value)} // Typed event
                            />
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        <div className="flex items-center justify-end">
                            <PrimaryButton className="ms-4" disabled={processing}>
                                Email Password Reset Link
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </GuestLayout>
    );
}