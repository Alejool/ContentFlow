// firebase.js - Configuración revisada

// LoginPage.jsx - Componente actualizado
import { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth, signInWithGoogle, signInWithFacebook, getAuthResult } from '@/firebase';
import Logo from '@/../assets/logo-v2.svg';
import GuestLayout from '@/Layouts/GuestLayout';


export default function Login() {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { data, setData, post, processing } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        // Verificar si el usuario viene de una redirección de autenticación
        const checkRedirectResult = async () => {
            try {     
                setLoading(true);
                const result = await getAuthResult();
                if (result && result.user) {
                    // Usuario ha iniciado sesión correctamente mediante redirección
                    // window.location.href = route('dashboard');
                   
                }
            } catch (err) {
                console.error("Error procesando redirección:", err);
                setError('Error al procesar el inicio de sesión. Por favor, inténtalo de nuevo.');
            } finally {
                setLoading(false);
            }
        };

        // Comprobar si el usuario ya está autenticado
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            // if (user) {
            //     window.location.href = route('dashboard');
            // }
        });

        checkRedirectResult();

        // Limpiar el listener cuando el componente se desmonte
        return () => unsubscribe();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setData(name, type === 'checkbox' ? checked : value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            await signInWithEmailAndPassword(auth, data.email, data.password);
            // Redirigir al dashboard después del login se hará automáticamente
            // gracias al onAuthStateChanged

        } catch (err) {
            setError('Credenciales incorrectas. Por favor, inténtalo de nuevo.');
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        
        try {
            await signInWithGoogle();
            // No redirigimos aquí, la redirección se maneja automáticamente
        } catch (err) {
            setError('Error al iniciar sesión con Google. Por favor, inténtalo de nuevo.');
            setLoading(false);
        }
    };

    const handleFacebookLogin = async () => {
        setLoading(true);
        setError('');
        
        try {
            await signInWithFacebook();
            // No redirigimos aquí, la redirección se maneja automáticamente
        } catch (err) {
            setError('Error al iniciar sesión con Facebook. Por favor, inténtalo de nuevo.');
            setLoading(false);
        }
    };

    return (
        <GuestLayout>
            <Head title="Iniciar sesión" />
            <div className="min-h-screen flex flex-col lg:flex-row">
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
                
                <div className="w-full lg:w-1/2 flex items-center justify-center  p-8">
                   
                    <div className="w-full max-w-md space-y-6">

                            <form onSubmit={handleSubmit}>
                                        
                                                {error && (
                                                    <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
                                                        {error}
                                                    </div>
                                                )}
                        {/*                         
                        {successMessage && (
                            <div className="rounded-md bg-green-50 p-4 text-sm text-green-600">
                                {successMessage}
                            </div>
                        )} */}
                    
                        <div className="mb-4">
                            <label className="mb-1 block text-sm font-medium  ">
                                Correo electrónico
                            </label>
                            <input
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
                            <label className="mb-1 block text-sm font-medium text-gray-700 ">
                                Contraseña
                            </label>
                            <input
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
                        
                        <div className="mb-6 flex items-center">
                            <input
                                type="checkbox"
                                name="remember"
                                id="remember"
                                checked={data.remember}
                                onChange={handleChange}
                                className="h-4 w-4 rounded border-gray-300 text-[#FF2D20]
                                 focus:ring-[#FF2D20]"
                            />
                            <label htmlFor="remember" className="ml-2 block text-sm text-gray-700
                            ">
                                Recordarme
                            </label>
                        </div>
                        
                        <button
                            type="submit"
                            disabled={processing || loading}
                            className="w-full rounded-md bg-[#FF2D20] px-4 py-2 font-medium text-white
                             transition hover:bg-[#FF2D20]/90 focus:outline-none focus:ring-2 focus:ring-[#FF2D20] focus:ring-offset-2 disabled:opacity-75"
                        >
                            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                        </button>
                    
                    
                        <div className="mt-8">
                            <div className="relative">
                                {/* <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t mb-6 border-gray-300
                                     dark:border-gray-700"></div>
                                </div> */}
                                <div className="relative flex  justify-center text-sm">
                                    <span className=" px-2 text-gray-500 ">
                                        O continúa con
                                    </span>
                                </div>
                            </div>

                        <div className="mt-3 grid gap-3">
                            <div className="">
                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
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

                            {/* <button
                                type="button"
                                onClick={handleFacebookLogin}
                                disabled={loading}
                                className="flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                            >
                                <svg className="mr-2 h-5 w-5" fill="#1877F2" viewBox="0 0 24 24">
                                    <path
                                        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                                    />
                                </svg>
                                Facebook
                            </button> */}

                        </div>
                    </div>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-gray-600 dark:text-gray-400">¿No tienes una cuenta?</span>
                        <Link
                            href={route('register')}
                            className="ml-1 font-medium text-[#FF2D20] hover:text-[#FF2D20]/80"
                        >
                            Regístrate
                        </Link>
                    </div>
                    </form>

                    </div>
                   
                </div>
            </div>
        </GuestLayout>
    );
}