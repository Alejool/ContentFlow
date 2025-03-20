import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Logo from '@/../assets/logo-v2.svg';



export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <div className="min-h-screen flex flex-col lg:flex-row">
                {/* Mitad izquierda: Fondo rojo, logo e imagen */}
                <div className="w-full lg:w-1/2 bg-red-600 bg-opacity-90 flex flex-col items-center justify-center p-8">
                    <div className="text-white text-center">
                        <h1 className="text-4xl font-bold mb-4">Welcome</h1>
                        <p className="text-lg">
                            Create an account to get started.
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

                {/* Mitad derecha: Formulario de registro */}
                <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 bg-opacity-70 p-8">
                    <form onSubmit={submit} className="w-full max-w-md space-y-6">
                        <div>
                            <InputLabel htmlFor="name" value="Name" />
                            <TextInput
                                id="name"
                                name="name"
                                value={data.name}
                                className="mt-1 block w-full"
                                autoComplete="name"
                                isFocused={true}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                            />
                            <InputError message={errors.name} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="email" value="Email" />
                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="mt-1 block w-full"
                                autoComplete="username"
                                onChange={(e) => setData('email', e.target.value)}
                                required
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
                                autoComplete="new-password"
                                onChange={(e) => setData('password', e.target.value)}
                                required
                            />
                            <InputError message={errors.password} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="password_confirmation"
                                value="Confirm Password"
                            />
                            <TextInput
                                id="password_confirmation"
                                type="password"
                                name="password_confirmation"
                                value={data.password_confirmation}
                                className="mt-1 block w-full"
                                autoComplete="new-password"
                                onChange={(e) =>
                                    setData('password_confirmation', e.target.value)
                                }
                                required
                            />
                            <InputError
                                message={errors.password_confirmation}
                                className="mt-2"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Link
                                href={route('login')}
                                className="text-sm text-indigo-600 hover:text-indigo-500"
                            >
                                Already registered?
                            </Link>

                            <PrimaryButton className="ms-4" disabled={processing}>
                                Register
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </GuestLayout>
    );
}