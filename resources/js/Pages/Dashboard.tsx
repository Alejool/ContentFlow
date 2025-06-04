// Pages/Dashboard.tsx
import { Head } from '@inertiajs/react';
import { PageProps } from '@/Types/inertia';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

interface DashboardProps extends PageProps {
    campaigns: Campaign[];
}

export default function Dashboard({ auth, campaigns }: DashboardProps) {
    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />
            {/* Tu componente aquí */}
        </AuthenticatedLayout>
    );
}