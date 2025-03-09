import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import IconsProfile from '@/../assets/Icons/profile.svg';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4 text-gray-900">
                    <img src={IconsProfile} alt="Profile" className="h-12 w-auto" />
                    <h2 className="text-4xl font-extrabold text-gray-800 drop-shadow-lg">
                        Profile
                    </h2>
                </div>
            }
        >
            <Head title="Profile" />

            <div className="py-6">
                <div className="mx-auto max-w-2xl space-y-10 sm:px-6 lg:px-8">

                    {/* Update Profile Information */}
                    <div>
                        <h3 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                            <span className="w-2 h-6 bg-blue-500 rounded-full"></span> Update Profile Information
                        </h3>
                        <div className="mt-2 flex flex-col rounded-2xl bg-white opacity-90 p-6 shadow-lg transition hover:shadow-2xl">
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Update Password */}
                    <div>
                        <h3 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                            <span className="w-2 h-6 bg-green-500 rounded-full"></span> Change Password
                        </h3>
                        <div className="mt-2 flex flex-col rounded-2xl bg-white p-6 shadow-lg transition hover:shadow-2xl">
                            <UpdatePasswordForm className="w-full" />
                        </div>
                    </div>

                    {/* Delete Account */}
                    <div>
                        <h3 className="text-xl font-semibold text-red-600 flex items-center gap-2">
                            <span className="w-2 h-6 bg-red-500 rounded-full"></span> Delete Account
                        </h3>
                        <p className="text-red-600 font-medium bg-red-100 p-3 rounded-md">
                            ⚠️ Warning: This action is irreversible. Proceed with caution.
                        </p>
                        <div className="mt-2 flex flex-col rounded-2xl bg-white p-6 shadow-lg border border-red-400 transition hover:shadow-2xl">
                            <DeleteUserForm className="w-full" />
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
