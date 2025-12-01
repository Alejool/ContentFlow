import { Head, Link } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import Logo from '@/../assets/logo.png';
import { useRegister } from '@/Hooks/useRegister';
import { ChangeEvent, FormEvent } from 'react';

export default function Register() {
    const {   
        data,
        setData, 
        error,
        loading,
        successMessage,
        errors,
        handleEmailRegister,
        handleGoogleRegister
    } = useRegister();

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setData(name, value);
    };

    return (
        <GuestLayout>
            <Head title="Register" />
            <div className="min-h-screen flex flex-col lg:flex-row">
                <div className="w-full lg:w-1/2
                    bg-gradient-to-b md:bg-gradient-to-r
                  from-red-600 to-purple-500
                flex flex-col items-center justify-center p-8">
                    <div className="text-white text-center">
                            <h1 className="text-4xl font-bold mb-4">Welcome</h1>
                            <p className="text-lg">
                                Register with your email and password
                            </p>
                        </div>
                        <Link href="/">
                            <img
                                src={Logo} // Ruta de tu imagen
                                alt="Register Image"
                                className=" object-cover h-40 fill-current"
                            />
                        </Link>
                    </div>
                
                <div className="w-full lg:w-1/2 flex items-center 
                justify-center
                 p-8">

                    
                    <div className="w-full max-w-md space-y-6">
                        {error && (
                            <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
                                {error}
                            </div>
                        )}
                        
                        {successMessage && (
                            <div className="rounded-md bg-green-50 p-4 text-sm text-green-600">
                                {successMessage}
                            </div>
                        )}

                        <form onSubmit={handleEmailRegister} className="space-y-6">
                            <div>
                                <InputLabel htmlFor="name" value="Name" />
                                <TextInput
                                    id="name"
                                    name="name"
                                    value={data.name}
                                    className="mt-1 block w-full"
                                    autoComplete="name"
                                    isFocused={true}
                                    onChange={handleChange}
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
                                    onChange={handleChange}
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
                                    onChange={handleChange}
                                    required
                                />
                                <InputError message={errors.password} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="password_confirmation" value="Confirm Password" />
                                <TextInput
                                    id="password_confirmation"
                                    type="password"
                                    name="password_confirmation"
                                    value={data.password_confirmation}
                                    className="mt-1 block w-full"
                                    autoComplete="new-password"
                                    onChange={handleChange}
                                    required
                                />
                                <InputError message={errors.password_confirmation} className="mt-2" />
                            </div>

                            <div className="flex items-center justify-between">
                                <Link
                                    href={route('login')}
                                    className="text-sm text-indigo-600 hover:text-indigo-500"
                                >
                                    Already registered?
                                </Link>     
        
                                <PrimaryButton  disabled={loading}  
                                    className="
                                    ms-4 
                                    rounded-md bg-[#FF2D20] px-4 py-2 font-medium
                                     text-white
                                      md:bg-gradient-to-r
                                     from-red-600 to-purple-500
                                    transition hover:bg-[#FF2D20]/90 
                                    focus:outline-none focus:ring-2 focus:ring-[#FF2D20] 
                                    focus:ring-offset-2 disabled:opacity-75"
                        >
                                    {loading ? 'Registering...' : 'Register'}
                                </PrimaryButton>
                            </div>
                        </form>

                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="bg-gray-50 px-2 text-gray-500">
                                        Or continue with
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6">
                                <button
                                    type="button"
                                    onClick={handleGoogleRegister}
                                    disabled={loading}
                                    className="flex items-center justify-center w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                                >
                                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                                        <path
                                            d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                                            fill="#EA4335"
                                        />
                                        <path
                                            d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                                            fill="#4285F4"
                                        />
                                        <path
                                            d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                                            fill="#FBBC05"
                                        />
                                        <path
                                            d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                                            fill="#34A853"
                                        />
                                    </svg>
                                    Google
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
