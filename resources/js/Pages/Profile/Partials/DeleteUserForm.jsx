import React, { useState, useRef } from "react";
import { useForm as useHookForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { deleteUserSchema } from "@/schemas/schemas";
import Modal from "@/Components/Modal";
import ModernInput from "@/Components/Modern/ModernInput";
import ModernButton from "@/Components/Modern/ModernButton";
import ModernCard from "@/Components/Modern/ModernCard";
import axios from "axios";

const TrashIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const WarningIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

export default function DeleteUserForm({ className = "" }) {
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
      await axios.delete(route("profile.destroy"), {
        data,
        preserveScroll: true,
      });
      // Redirect usually happens from backend or Inertia, but if axios is used manually:
      window.location.href = "/";
    } catch (error) {
      if (error.response?.data?.errors) {
        Object.entries(error.response.data.errors).forEach(([key, value]) => {
          setError(key, { message: value[0] });
        });
      }
      // Focus password input if error
      // setTimeout(() => passwordInput.current?.focus(), 100);
    }
  };

  const closeModal = () => {
    setConfirmingUserDeletion(false);
    reset();
  };

  return (
    <ModernCard
      title="Delete Account"
      description="Permanently remove your account and data"
      icon={TrashIcon}
      headerColor="red"
      className={className}
    >
      <div className="space-y-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-4">
          <div className="flex-shrink-0 text-red-500">
            <WarningIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-800">
              Warning: Irreversible Action
            </h3>
            <p className="mt-1 text-sm text-red-700">
              Once your account is deleted, all of its resources and data will
              be permanently deleted. Before deleting your account, please
              download any data or information that you wish to retain.
            </p>
          </div>
        </div>

        <ModernButton
          variant="danger"
          onClick={confirmUserDeletion}
          icon={TrashIcon}
        >
          Delete Account
        </ModernButton>
      </div>

      <Modal show={confirmingUserDeletion} onClose={closeModal}>
        <form onSubmit={handleSubmit(deleteUser)} className="p-6">
          <div className="flex items-center gap-3 mb-4 text-red-600">
            <WarningIcon className="w-8 h-8" />
            <h2 className="text-xl font-bold text-gray-900">
              Are you sure you want to delete your account?
            </h2>
          </div>

          <p className="mt-1 text-sm text-gray-600 mb-6">
            Please enter your password to confirm you would like to permanently
            delete your account.
          </p>

          <div className="mt-6">
            <ModernInput
              id="password"
              type="password"
              label="Password"
              register={register}
              error={errors.password?.message}
              placeholder="Enter your password to confirm"
              showPasswordToggle
              autoFocus
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <ModernButton
              type="button"
              variant="secondary"
              onClick={closeModal}
              className="w-auto"
            >
              Cancel
            </ModernButton>

            <ModernButton
              variant="danger"
              disabled={isSubmitting}
              className="w-auto"
            >
              Delete Account
            </ModernButton>
          </div>
        </form>
      </Modal>
    </ModernCard>
  );
}
