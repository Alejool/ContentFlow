import InputError from '@/Components/InputError.tsx';
import InputLabel from '@/Components/InputLabel.tsx';
import PrimaryButton from '@/Components/PrimaryButton.tsx';
import TextInput from '@/Components/TextInput.tsx';
import { Transition } from '@headlessui/react';
import { Link, usePage } from '@inertiajs/react';
import { useForm as useHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema } from '@/schemas/schemas';
import { toast } from 'react-toastify';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;

    const {
        register,
        handleSubmit,
        setError,
        watch,
        formState: { errors, isSubmitting },
    } = useHookForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user?.name || '',
            email: user?.email || '',
        },
        // values: {
        //     name: user?.name,
        //     email: user?.email,
        // }
    });
     const watchedName = watch('name');
    const watchedEmail = watch('email');

    const submit = async (data) => {
        try {
            const response = await axios.patch(route('profile.update'), data);
            
            if (response.data.success) {
                toast.success(response.data.message || 'Profile updated successfully');
            } else if(response.data.warning) {
                toast.warning(response.data.message || 'No changes were made');
            }
            else
            {
                toast.error(response.data.message || 'An error occurred while updating profile');
            }
            
        } catch (error) {
            if (error.response?.data?.errors) {
                Object.entries(error.response.data.errors).forEach(([key, value]) => {
                    setError(key, { message: value[0] });
                    toast.error(value[0]);
                });
            } else {
                toast.error(error.response?.data?.message || 'An error occurred while updating profile');
            }
        }
    };

    return (
      <section className={className}>
        <header>
          <h2 className="text-lg font-medium text-gray-900">
            Profile Information
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Update your account's profile information and email address.
          </p>
        </header>

        <form onSubmit={handleSubmit(submit)} className="mt-6 space-y-6">
          <div>
            <InputLabel htmlFor="name" value="Name" />
            <TextInput
              id="name"
              value={watchedName}
              onChange={(e) => register("name").onChange(e)}
              className="mt-1 block w-full"
              autoComplete="name"
            />
            <InputError message={errors.name?.message} className="mt-2" />
          </div>

          <div>
            <InputLabel htmlFor="email" value="Email" />
            <TextInput
              id="email"
              value={watchedEmail}
              onChange={(e) => register("email").onChange(e)}
              type="email"
              disabled={true}
              className="mt-1 block w-full"
              autoComplete="email"
            />
            <InputError message={errors.email?.message} className="mt-2" />
          </div>

          {mustVerifyEmail && user.email_verified_at === null && (
            <div>
              <p className="mt-2 text-sm text-gray-800">
                Your email address is unverified.
                <Link
                  href={route("verification.send")}
                  method="post"
                  as="button"
                  className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Click here to re-send the verification email.
                </Link>
              </p>

              {status === "verification-link-sent" && (
                <div className="mt-2 text-sm font-medium text-green-600">
                  A new verification link has been sent to your email address.
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-4">
            <PrimaryButton
              className="w-full 
                transition-all 
                duration-200 
                flex items-center justify-center gap-3
             bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700
             hover:to-red-700 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
              disabled={isSubmitting}
            >
              Save
            </PrimaryButton>
            <Transition
              show={!isSubmitting && !Object.keys(errors).length}
              enter="transition ease-in-out"
              enterFrom="opacity-0"
              leave="transition ease-in-out"
              leaveTo="opacity-0"
            >
              <p className="text-sm text-gray-600">Saved.</p>
            </Transition>
          </div>
        </form>
      </section>
    );
}