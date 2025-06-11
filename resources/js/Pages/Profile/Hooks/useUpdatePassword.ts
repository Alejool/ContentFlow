import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import axios from 'axios';
import { passwordSchema } from '@/schemas/schemas';

interface PasswordFormData {
    current_password: string;
    password: string;
    password_confirmation: string;
}

interface UseUpdatePasswordReturn {
    register: ReturnType<typeof useForm>['register'];
    handleSubmit: ReturnType<typeof useForm>['handleSubmit'];
    errors: ReturnType<typeof useForm>['formState']['errors'];
    isSubmitting: boolean;
    isSuccess: boolean;
    updatePassword: (data: PasswordFormData) => Promise<void>;
    resetForm: () => void;
}

export const useUpdatePassword = (): UseUpdatePasswordReturn => {
    const [isSuccess, setIsSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        setError,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            current_password: '',
            password: '',
            password_confirmation: '',
        },
    });

    const updatePassword = async (data: PasswordFormData): Promise<void> => {
        try {
            setIsSuccess(false);
            
            await axios.put(route('password.update'), data, {
                preserveScroll: true,
            });
            
            reset();
            setIsSuccess(true);
            
            // Hide success message after 3 seconds
            setTimeout(() => {
                setIsSuccess(false);
            }, 3000);
            
        } catch (error: any) {
            setIsSuccess(false);
            
            if (error.response?.data?.errors) {
                Object.entries(error.response.data.errors).forEach(([key, messages]) => {
                    if (Array.isArray(messages)) {
                        setError(key as keyof PasswordFormData, { 
                            message: messages[0] 
                        });
                    }
                });
            } else {
                // Generic error handling
                setError('current_password', {
                    message: 'An error occurred while updating your password. Please try again.'
                });
            }
        }
    };

    const resetForm = (): void => {
        reset();
        setIsSuccess(false);
    };

    return {
        register,
        handleSubmit,
        errors,
        isSubmitting,
        isSuccess,
        updatePassword,
        resetForm,
    };
};