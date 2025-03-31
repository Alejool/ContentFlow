import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth, signInWithGoogle, signInWithFacebook, getAuthResult, loginAnonymously } from '@/firebase';
import axios from 'axios';

export const useAuth = () => {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const { data, setData, processing } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const response = await axios.post('/api/check-user', {
                email: data.email,
            });

            const userData = response.data;

            if (userData.provider) {
                setError(`This user was registered with ${userData.provider}. Please login with ${userData.provider}.`);
                setLoading(false);
                return;
            }

            const result = await signInWithEmailAndPassword(auth, data.email, data.password);
            if (result.user) {
                setSuccessMessage('login successful. Redirecting...');
                window.location.href = route('dashboard');
            }
        } catch (err) {
            if (err.response?.data?.error) {
                setError(err.response.data.error);
            } else if (err.code) {
                setError('Credentials incorrect. Please try again.');
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        
        try {
            const result = await signInWithGoogle();
            if (result?.user) {
                setSuccessMessage('Login sucessfully. Redirecting...');
                window.location.href = route('dashboard');
            }
        } catch (err) {
            setError('Error to start sesion with Google. Please, try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleFacebookLogin = async () => {
        setLoading(true);
        setError('');
             
        try {
            const result = await signInWithFacebook();
            if (result?.user) {
                setSuccessMessage('Login sucessfully with Facebook. Redirecting...');
                window.location.href = route('dashboard');
            }
        } catch (err) {
            setError('Error to start sesión with Facebook. Please, try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAnonymousLogin = async () => {
        setLoading(true);       
        setError('');
        
        try {
            const result = await loginAnonymously();
            console.log(result);
            if (result?.user) {
                setSuccessMessage('Login sucessfully with anonymous. Redirecting...');
                window.location.href = route('dashboard');
            }
        } catch (err) {
            setError('Error to start sesión with anonymous. Please, try again.');
        } finally {
            setLoading(false);
        }
    };

    return {
        data,
        setData,
        error,
        loading,
        successMessage,
        processing,
        handleEmailLogin,
        handleGoogleLogin,
        handleFacebookLogin,
        handleAnonymousLogin
    };
};