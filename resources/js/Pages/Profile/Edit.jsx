import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { Avatar, Circle, Float,Highlight } from "@chakra-ui/react"



export default function Edit({ mustVerifyEmail, status }) {
        const user = usePage().props.auth.user;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col items-center justify-center mt-10">
                    <Avatar.Root 
                        colorPalette="green" 
                        size="2xl" 
                        variant="subtle"
                        className="mx-auto relative" 
                    >
                        <Avatar.Fallback name={user.name} />
                        
                        <div className="absolute bottom-0 right-0">
                            <Circle
                                bg="green.500"
                                size="8px"
                                color="white"
                                outline="0.2em solid"
                                outlineColor="bg"
                            />
                        </div>
                    </Avatar.Root>
                    
                    <div className="mt-2 text-center">
                        <Highlight
                            query="spotlight"
                            styles={{ 
                                px: "3", 
                                py: "1",
                                bg: "orange.subtle", 
                                color: "orange.fg",
                                borderRadius: "md"
                            }}
                            className="font-medium"
                        >
                            {user.name}
                        </Highlight>
                    </div>
                </div>

                
            }
        >
            <Head title="Profile" />

            <div className="py-6">
                <div className="mx-auto max-w-2xl space-y-10 sm:px-6 lg:px-8">

                    <div>
                        <h3 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                            <span className="w-2 h-6 bg-blue-500 rounded-full"></span> Update Profile Information
                        </h3>
                        <div className="mt-2 flex flex-col rounded-2xl bg-white opacity-90 p-6 shadow-lg transition hover:shadow-2xl">
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                                className="mt-1 block w-full"
                            />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                            <span className="w-2 h-6 bg-green-500 rounded-full"></span> Change Password
                        </h3>
                        <div className="mt-2 flex flex-col rounded-2xl bg-white p-6 shadow-lg transition hover:shadow-2xl">
                            <UpdatePasswordForm className="w-full" />
                        </div>
                    </div>

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

