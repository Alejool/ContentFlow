import React, { useRef } from "react";
import { Transition } from "@headlessui/react";
import { useUpdatePassword } from "../Hooks/useUpdatePassword.ts";

// Icons
const LockIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  </svg>
);

const CheckIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

const EyeIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const EyeOffIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m6.121-3.879a9.973 9.973 0 011.563 3.029m-1.563-3.029L21 21"
    />
  </svg>
);



const ModernInput = ({
  id,
  label,
  type = "text",
  error,
  register,
  placeholder,
  showPasswordToggle = false,
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const inputType = type === "password" && showPassword ? "text" : type;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-gray-900">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          {...register(id)}
          placeholder={placeholder}
          className={`
                        block w-full px-4 py-3 text-gray-900 placeholder-gray-400 
                        bg-white border-2 rounded-xl shadow-sm transition-all duration-200
                        focus:outline-none focus:ring-0 hover:shadow-md
                        ${
                          error
                            ? "border-red-300 focus:border-red-500 bg-red-50"
                            : "border-gray-200 focus:border-blue-500 focus:bg-gray-50"
                        }
                        ${showPasswordToggle ? "pr-12" : ""}
                    `}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

// Success Alert Component
const SuccessAlert = ({ show }) => (
  <Transition
    show={show}
    enter="transform transition duration-300 ease-out"
    enterFrom="translate-y-2 opacity-0"
    enterTo="translate-y-0 opacity-100"
    leave="transform transition duration-200 ease-in"
    leaveFrom="translate-y-0 opacity-100"
    leaveTo="translate-y-2 opacity-0"
  >
    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
        <CheckIcon className="w-5 h-5 text-green-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-green-800">
          Password updated successfully!
        </p>
        <p className="text-xs text-green-600">
          Your account security has been enhanced.
        </p>
      </div>
    </div>
  </Transition>
);



const UpdatePasswordForm= ({
  className = "",
}) => {
  const {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    isSuccess,
    updatePassword,
  } = useUpdatePassword();

  return (
    <div
      className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-8 py-6 bg-gradient-to-r from-red-600 to-orange-700">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <LockIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Update Password</h2>
            <p className="text-blue-100 text-sm mt-1">
              Keep your account secure with a strong password
            </p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-8 py-8">
        {/* Error Summary Section */}
        {Object.keys(errors).length > 0 && (
          <div className="px-8 py-6 bg-red-50 border-b border-red-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-red-800">
                Please correct the following errors:
              </h3>
            </div>
            <ul className="space-y-1 text-sm text-red-700 ml-11">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>• {error.message}</li>
              ))}
            </ul>
          </div>
        )}
        {/* Success Alert */}
        <div className="mb-6">
          <SuccessAlert show={isSuccess} />
        </div>

        <form onSubmit={handleSubmit(updatePassword)} className="space-y-6">
          <ModernInput
            id="current_password"
            label="Current Password"
            type="password"
            placeholder="Enter your current password"
            register={register}
            error={errors.current_password?.message}
            showPasswordToggle
          />

          <ModernInput
            id="password"
            label="New Password"
            type="password"
            placeholder="Enter your new password"
            register={register}
            // error={errors.password?.message}
            showPasswordToggle
          />

          <ModernInput
            id="password_confirmation"
            label="Confirm New Password"
            type="password"
            placeholder="Confirm your new password"
            register={register}
            error={errors.password_confirmation?.message}
            showPasswordToggle
          />

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                                w-full px-6 py-4 text-white font-semibold rounded-xl
                                transition-all duration-200 flex items-center justify-center gap-3
                                ${
                                  isSubmitting
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                                }
                            `}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Updating Password...
                </>
              ) : (
                <>
                  <LockIcon className="w-5 h-5" />
                  Update Password
                </>
              )}
            </button>
          </div>
        </form>

        {/* Security Tips */}
        <div className="mt-8 p-4 bg-orange-50 rounded-xl border border-blue-100">
          <h4 className="text-sm font-semibold text-orange-900 mb-2">
            Password Security Tips:
          </h4>
          <ul className="text-xs text-dark-700 space-y-2">
            <li>
              • Use at least 8 characters with a mix of letters, numbers, and
              symbols
            </li>
            <li>• Avoid using personal information or common words</li>
            <li>• Consider using a password manager for better security</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UpdatePasswordForm;
