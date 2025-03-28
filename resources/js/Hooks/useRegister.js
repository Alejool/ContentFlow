import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { signInWithGoogle, registerWithEmailAndPassword, updateUserProfile } from '@/firebase';
import axios from 'axios';

export const useRegister = () => {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const { data, setData, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const handleEmailRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');

        if (data.password !== data.password_confirmation) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }

        try {
            const userCredential = await registerWithEmailAndPassword(data.email, data.password);
            await updateUserProfile(userCredential.user, {
                displayName: data.name,
            });

            try {
                const response = await axios.post('/api/save-user', {
                    name: data.name,
                    email: data.email,
                    provider: null,
                    provider_id: null,
                    photo_url: null,    
                });
                
                if (response.data.message) {
                    setSuccessMessage(response.data.message);
                    reset('password', 'password_confirmation');
                }
                
            } catch (backendError) {
                // Handle Laravel validation errors
                if (backendError.response?.data?.errors) {
                    const errorMessage = Object.values(backendError.response.data.errors)
                        .flat()
                        .join(' ');
                    setError(prevError => `${prevError ? prevError + '. ' : ''}${errorMessage}`);
                }
                
                // Handle general backend error message
                if (backendError.response?.data?.message) {
                    setError(prevError => `${prevError ? prevError + '. ' : ''}${backendError.response.data.message}`);
                }
                
                if (!backendError.response?.data) {
                    setError(prevError => `${prevError ? prevError + '. ' : ''}An error occurred while saving user data.`);
                }
            }

        } catch (err) {
            console.error('Registration error:', err);
            const firebaseError = getFirebaseErrorMessage(err.code) || 'Error creating account. Please try again.';
            setError(prevError => `${prevError ? prevError + '. ' : ''}${firebaseError}`);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleRegister = async () => {
        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const result = await signInWithGoogle();
            const user = result.user;

            try {
                await axios.post('/api/save-user', {
                    name: user.displayName,
                    email: user.email,
                    provider: 'google',
                    provider_id: user.uid,
                    photo_url: user.photoURL,
                });
            } catch (backendError) {
                console.error('Backend save failed but Google sign-in succeeded:', backendError);
                // Continue with success flow since Google sign-in worked
            }

            setSuccessMessage('Signed in with Google successfully! Redirecting...');
            
            setTimeout(() => {
                window.location.href = route('dashboard');
            }, 1500);

        } catch (err) {
            console.error('Google sign-in error:', err);
            setError(getFirebaseErrorMessage(err.code) || 'Error signing in with Google. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getFirebaseErrorMessage = (errorCode) => {
        switch (errorCode) {
            case 'auth/email-already-in-use':
                return 'Email address is already in use.';
            case 'auth/invalid-email':
                return 'Email address is invalid.';
            case 'auth/weak-password':
                return 'Password is too weak. Please use at least 6 characters.';
            case 'auth/operation-not-allowed':
                return 'Account creation is currently disabled.';
            case 'auth/popup-closed-by-user':
                return 'Google sign-in was canceled. Please try again.';
            default:
                return null;
        }
    };

    return {
        data,
        setData,
        error,
        loading,
        successMessage,
        errors,
        handleEmailRegister,
        handleGoogleRegister
    };
};