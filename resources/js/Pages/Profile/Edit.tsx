import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage } from "@inertiajs/react";
import DeleteUserForm from "./Partials/DeleteUserForm";
import UpdatePasswordForm from "./Partials/UpdatePasswordForm";
import UpdateProfileInformationForm from "./Partials/UpdateProfileInformationForm";
import ConnectedAccounts from "./Partials/ConnectedAccounts";
import AccountStatistics from "./Partials/AccountStatistics";
import { Avatar } from "@chakra-ui/react";

interface EditProps {
  mustVerifyEmail: boolean;
  status?: string;
}

export default function Edit({ mustVerifyEmail, status }: EditProps) {
  const user = usePage().props.auth.user;

  return (
    <AuthenticatedLayout
      header={
        <div className="flex flex-col items-center justify-center py-8">
          <div className="relative">
            <Avatar.Root
              colorPalette="orange"
              size="2xl"
              variant="subtle"
              className="w-24 h-24 ring-4 ring-green-200 shadow-lg"
            >
              <Avatar.Fallback
                name={user.name}
                className="text-2xl font-bold"
              />
              <Avatar.Image src={user.avatar} />
            </Avatar.Root>
            <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4">
              <div className="w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-sm"></div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-gray-500 font-medium">{user.email}</p>
          </div>
        </div>
      }
    >
      <Head title="Profile" />

      <div className="py-12  min-h-screen">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Profile Info & Stats */}
            <div className="space-y-8">
              <UpdateProfileInformationForm
                mustVerifyEmail={mustVerifyEmail}
                status={status}
                className="h-auto"
              />

              <AccountStatistics status={status} />
            </div>

            {/* Right Column: Connections, Security & Danger Zone */}
            <div className="space-y-8">
              <ConnectedAccounts />

              <UpdatePasswordForm className="w-full" />

            </div>
              {/* <div className="pt-8 border-t border-gray-200">
                <h3 className="text-xl text-primary-800 font-bold mb-4 px-2">
                  Danger Zone
                </h3>
                <DeleteUserForm className="w-full" />
              </div> */}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
