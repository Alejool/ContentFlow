import { z } from 'zod';

// Esquema para actualizar la contraseña
export const passwordSchema = z
    .object({
        current_password: z.string().min(6, 'Current password must be at least 6 characters'),
        password: z.string().min(6, 'New password must be at least 6 characters'),
        password_confirmation: z.string(),
    })
    .refine((data) => data.password === data.password_confirmation, {
        message: 'Passwords do not match',
        path: ['password_confirmation'],
    });

// Esquema para actualizar la información del perfil
export const profileSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
});

// Esquema para eliminar el usuario
export const deleteUserSchema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
});