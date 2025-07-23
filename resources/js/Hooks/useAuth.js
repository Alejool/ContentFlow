import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth, signInWithGoogle, signInWithFacebook, getAuthResult, loginAnonymously } from '@/firebase';
import axios from 'axios';
import { toast } from 'react-toastify';
import firebase from 'firebase/compat/app';

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
            // Primero autenticar con Firebase
            const result = await signInWithEmailAndPassword(auth, data.email, data.password);
            console.log(result);
            if (result.user) {
            // if (result.true) {
                const idToken = await result.user.accessToken;
                const loginResponse = await axios.post('/login', {
                    email: data.email,
                    password: data.password,
                    remember: data.remember ?? false,
                    firebase_user: {
                        uid: result.user.uid,
                        email: result.user.email,
                        displayName: result.user.displayName,
                        photoURL: result.user.photoURL
                    },
                }, {
                    headers: {   
                        'Authorization': `Bearer ${idToken}`,
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                // console.log(loginResponse);
                if (loginResponse.data.success) {
                    toast.success('Login successful. Redirecting...');
                    setSuccessMessage('Login successful. Redirecting...');
                    if (loginResponse.data.redirect) {
                        window.location.href = loginResponse.data.redirect;
                    }
                }
                if (loginResponse.data.error) {
                    setError(loginResponse.data.error);
                }
            }
        } catch (err) {
            console.error('Login error:', err);
            if (err.response?.data?.error) {
                setError(err.response.data.error);
                toast.error(err.response.data.error);
            } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
                setError('Invalid credentials. Please try again.');
                toast.error('Invalid credentials. Please try again.');
            } else {
                setError('User not found in the system. Please try again.');
                toast.error('User not found in the system. Please try again.');
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
                toast.success('Login sucessfully. Redirecting...');
                window.location.href = route('dashboard');
            }
        } catch (err) {
            setError('Error to start sesion with Google. Please, try again.');
            toast.error('Error to start sesion with Google. Please, try again.');
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