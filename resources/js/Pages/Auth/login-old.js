import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Logo from '@/../assets/logo-v2.svg';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            <div className="min-h-screen flex flex-col lg:flex-row">
                {/* Mitad izquierda: Fondo rojo, logo e imagen */}
                <div className="w-full lg:w-1/2 bg-red-600 bg-opacity-90 flex flex-col items-center justify-center p-8">
                    <div className="text-white text-center">
                       
                        <h1 className="text-4xl font-bold mb-4">Welcome</h1>
                        <p className="text-lg">
                            Start session with your email and password
                        </p>
                    </div>
                    <Link href="/">
                        <img
                            src={Logo} // Ruta de tu imagen
                            alt="Register Image"
                            className="w-64 object-cover h-40"
                        />
                    </Link>
                </div>

                {/* Mitad derecha: Formulario de inicio de sesión */}
                <div className="w-full lg:w-1/2 flex items-center justify-center  p-8">
                    <form onSubmit={submit} className="w-full max-w-md space-y-6">
                        {status && (
                            <div className="mb-4 text-sm font-medium text-green-600">
                                {status}
                            </div>
                        )}

                        <div>
                            <InputLabel htmlFor="email" value="Email" />
                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="mt-1 block w-full"
                                autoComplete="username"
                                isFocused={true}
                                onChange={(e) => setData('email', e.target.value)}
                            />
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="password" value="Password" />
                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="mt-1 block w-full"
                                autoComplete="current-password"
                                onChange={(e) => setData('password', e.target.value)}
                            />
                            <InputError message={errors.password} className="mt-2" />
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center">
                                <Checkbox
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                />
                                <span className="ms-2 text-sm text-gray-600">
                                    Remember me
                                </span>
                            </label>

                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="text-sm text-indigo-600 hover:text-indigo-500"
                                >
                                    Forgot your password?
                                </Link>
                            )}
                        </div>

                        <div>
                            <PrimaryButton className="w-full justify-center" disabled={processing}>
                                Log in
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </GuestLayout>
    );
}