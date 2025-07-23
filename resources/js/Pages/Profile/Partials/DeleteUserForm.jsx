import DangerButton from '@/Components/DangerButton.tsx';
import InputError from '@/Components/InputError.tsx';
import InputLabel from '@/Components/InputLabel.tsx';
import Modal from '@/Components/Modal.tsx';
import SecondaryButton from '@/Components/SecondaryButton.tsx';
import TextInput from '@/Components/TextInput.tsx';
import { useRef, useState } from 'react';
import { useForm as useHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { deleteUserSchema } from '@/schemas/schemas';

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        register,
        handleSubmit,
        setError,
        reset,
        formState: { errors, isSubmitting },
    } = useHookForm({
        resolver: zodResolver(deleteUserSchema),
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = async (data) => {
        try {
            await axios.delete(route('profile.destroy'), {
                data,
                preserveScroll: true,
            });
            closeModal();
        } catch (error) {
            if (error.response?.data?.errors) {
                Object.entries(error.response.data.errors).forEach(([key, value]) => {
                    setError(key, { message: value[0] });
                });
            }
            passwordInput.current.focus();
        }
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);
        reset();
    };

    return (
      <section className={`space-y-6 ${className}`}>
        <header>
          <h2 className="text-lg font-medium text-gray-900">Delete Account</h2>
          <p className="mt-1 text-sm text-gray-600">
            Once your account is deleted, all of its resources and data will be
            permanently deleted.
          </p>
        </header>

        <DangerButton onClick={confirmUserDeletion}>
          Delete Account
        </DangerButton>

        <Modal show={confirmingUserDeletion} onClose={closeModal}>
          <form onSubmit={handleSubmit(deleteUser)} className="p-6 w-full">
            <h2 className="text-lg font-medium text-gray-900">
              Are you sure you want to delete your account?
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Please enter your password to confirm you would like to
              permanently delete your account.
            </p>

            <div className="mt-6">
              <InputLabel
                htmlFor="password"
                value="Password"
                className="sr-only"
              />
              <TextInput
                id="password"
                type="password"
                {...register("password")}
                ref={passwordInput}
                className="mt-1 block w-full"
                placeholder="Password"
              />
              <InputError message={errors.password?.message} className="mt-2" />
            </div>

            <div className="mt-6 flex justify-end">
              <SecondaryButton onClick={closeModal}>Cancel</SecondaryButton>
              <DangerButton className="ms-3" disabled={isSubmitting}>
                Delete Account
              </DangerButton>
            </div>
          </form>
        </Modal>
      </section>
    );
}