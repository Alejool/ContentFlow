import React, { useEffect, FormEvent, ChangeEvent } from 'react'; // Added React, FormEvent, ChangeEvent
import { Head, Link, usePage, PageProps as InertiaPageProps } from '@inertiajs/react'; // Added PageProps
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth"; // Typed FirebaseUser
import { auth, getAuthResult } from '@/firebase';
import Logo from '@/../assets/logo.png';
import GuestLayout from '@/Layouts/GuestLayout.tsx';
import { useAuth } from '@/Hooks/useAuth'; // Assuming useAuth will be typed or we define its return type here

// Define props for the page, extending Inertia's PageProps
interface LoginPageProps extends InertiaPageProps {
    errors?: Record<string, string>; // From usePage().props
    status?: string; // Example, if passed from controller
    canResetPassword?: boolean; // Example, if passed from controller
}

// Define a basic structure for the data from useAuth's useForm
// This should ideally match the actual data structure used by useAuth's useForm
interface AuthFormData {
    email: string;
    password: string;
    remember?: boolean; // Assuming remember is part of the form data in useAuth
    [key: string]: any; // Index signature if useAuth's setData is generic
}

// Define a basic return type for the useAuth hook based on its usage here
// This should ideally come from the useAuth hook itself if it's typed
interface UseAuthReturn {
    data: AuthFormData;
    setData: (key: string, value: any) => void; // Simplified setData, ideally more specific
    error: string | null;
    loading: boolean;
    successMessage: string | null;
    processing: boolean;
    handleEmailLogin: (e: FormEvent) => Promise<void>;
    handleGoogleLogin: () => Promise<void>;
    handleFacebookLogin: () => Promise<void>; // Assuming it exists
    handleAnonymousLogin: () => Promise<void>;
}

export default function Login(props: LoginPageProps) { // Typed props
    // const { errors } = usePage().props; // props.errors can be used directly

    const {
        data,
        setData,
        error,
        loading,
        successMessage,
        processing,
        handleEmailLogin,
        handleGoogleLogin,
        // handleFacebookLogin, // Commented out as it's commented in JSX
        handleAnonymousLogin
    }: UseAuthReturn = useAuth(); // Typed the destructured hook values

    useEffect(() => {
        const checkRedirectResult = async () => {
            try {
                const result = await getAuthResult();
                if (result?.user) {
                    (window as any).location.href = (window as any).route('dashboard');
                }
            } catch (err: any) { // Typed err
                console.error("Error procesando redirección:", err);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
            // Handle user state changes if needed, or leave empty if just for cleanup
        });
        checkRedirectResult();
        return () => unsubscribe();
    }, []);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => { // Typed event and input element
        const { name, value, type, checked } = e.target;
        setData(name, type === 'checkbox' ? checked : value);
    };

    return (
        <GuestLayout>
            <Head title="Start Sesion" /> {/* Corrected title */}
            <div className="min-h-screen flex flex-col lg:flex-row">
                <div
                    className="
                        w-full
                        lg:w-1/2
                        bg-red-400
                        bg-opacity-90
                          bg-gradient-to-b md:bg-gradient-to-r
                        from-red-600 to-purple-500
                        flex
                        flex-col
                        items-center
                        justify-center
                        p-8">
                    <div className="text-white text-center">
                        <h1 className="text-4xl font-bold mb-4">Welcome</h1>
                        <p className="text-lg">
                            Start session with your email and password
                        </p>
                    </div>
                    <Link href="/">
                        <img
                            src={Logo}
                            alt="Register Image"
                            className=" object-cover h-40 fill-current"
                        />
                    </Link>
                </div>

                <div className="w-full lg:w-1/2 flex items-center justify-center  p-8">
                    <div className="w-full max-w-md space-y-6">
                        <form onSubmit={handleEmailLogin}>
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
                            <div className="mb-4">
                                <label htmlFor="email" className="mb-1 block text-sm font-medium"> {/* Added htmlFor */}
                                    Email
                                </label>
                                <input
                                    id="email" // Added id
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    onChange={handleChange}
                                    className="w-full rounded-md border border-gray-300 px-3
                                    py-2 focus:border-[#FF2D20] focus:outline-none focus:ring-[#FF2D20]"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700"> {/* Added htmlFor */}
                                    Password
                                </label>
                                <input
                                    id="password" // Added id
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    onChange={handleChange}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2
                                     focus:border-[#FF2D20] focus:outline-none focus:ring-[#FF2D20]
                                      dark:border-gray-700  "
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={processing || loading}
                                className="w-full rounded-md bg-[#FF2D20] px-4 py-2 font-medium text-white
                                 transition hover:bg-[#FF2D20]/90 focus:outline-none
                                 md:bg-gradient-to-r
                                         from-red-600 to-purple-500
                                 focus:ring-2 focus:ring-[#FF2D20] focus:ring-offset-2 disabled:opacity-75"
                            >
                                {loading ? 'Starting session...' : 'Start sesion'}
                            </button>
                            <div className="mt-8">
                                <div className="relative">
                                    <div className="relative flex  justify-center text-sm">
                                        <span className=" px-2 text-gray-500 ">
                                            Or continue with
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-3 grid gap-3">
                                    <div> {/* Wrapped button for consistent layout if needed */}
                                        <button
                                            type="button"
                                            onClick={handleGoogleLogin}
                                            disabled={loading}
                                            className="flex items-center justify-center w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm"
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
                                   <button
                                        type="button"
                                        onClick={handleAnonymousLogin}
                                        disabled={loading}
                                        className="flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium"
                                    >
                                        <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM6 12a6 6 0 0 0-6 6v1a1 1 0 0 0 1 1h22a1 1 0 0 0 1-1v-1a6 6 0 0 0-6-6H6z" />
                                        </svg>
                                        Anonymous {/* Corrected spelling */}
                                    </button>
                                </div>
                            </div>
                            <div className="mt-6 text-center text-sm">
                                <span className="text-gray-600 dark:text-gray-400"> have you not an account?</span>
                                <Link
                                    href={(window as any).route('register')}
                                    className="
                                        ml-1
                                        md:bg-gradient-to-r
                                        font-bold
                                        text-transparent bg-clip-text
                                        from-red-600 to-purple-500
                                             "
                                >
                                    Register
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}