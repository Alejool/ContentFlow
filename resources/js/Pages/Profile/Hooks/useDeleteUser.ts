import { useForm as useHookForm, UseFormRegister, UseFormHandleSubmit, FieldErrors, UseFormSetError, UseFormReset } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { deleteUserSchema } from '@/schemas/schemas';
import axios, { AxiosError } from 'axios';
import { z } from 'zod';
import { useRef, RefObject } from 'react';

// Types
type DeleteUserFormData = z.infer<typeof deleteUserSchema>;

interface ApiResponse {
    errors?: Record<string, string[]>;
    message?: string;
}

interface DeleteUserResult {
    success?: boolean;
    error?: boolean;
}

interface UseDeleteUserReturn {
    register: UseFormRegister<DeleteUserFormData>;
    handleSubmit: UseFormHandleSubmit<DeleteUserFormData>;
    errors: FieldErrors<DeleteUserFormData>;
    isSubmitting: boolean;
    reset: UseFormReset<DeleteUserFormData>;
    setError: UseFormSetError<DeleteUserFormData>;
    deleteUser: (data: DeleteUserFormData) => Promise<DeleteUserResult>;
    passwordInputRef: RefObject<HTMLInputElement>;
}

// Declare global route function
declare global {
    function route(name: string): string;
}

export const useDeleteUser = (): UseDeleteUserReturn => {
    const passwordInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        setError,
        reset,
        formState: { errors, isSubmitting },
    } = useHookForm<DeleteUserFormData>({
        resolver: zodResolver(deleteUserSchema),
    });

    const deleteUser = async (data: DeleteUserFormData): Promise<DeleteUserResult> => {
        try {
            await axios.delete(route('profile.destroy'), {
                data,
                // Removed preserveScroll as it's not a valid axios option
            });

            return { success: true };

        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;

            if (axiosError.response?.data?.errors) {
                Object.entries(axiosError.response.data.errors).forEach(([key, value]) => {
                    setError(key as keyof DeleteUserFormData, { 
                        type: 'server',
                        message: Array.isArray(value) ? value[0] : value 
                    });
                });
            }

            // Focus password input on error
            if (passwordInputRef.current) {
                passwordInputRef.current.focus();
            }

            return { error: true };
        }
    };

    return {
        register,
        handleSubmit,
        errors,
        isSubmitting,
        reset,
        setError,
        deleteUser,
        passwordInputRef,
    };
};