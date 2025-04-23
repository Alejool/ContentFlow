import { useEffect, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import SocialMediaAccounts from './SocialMediaAccounts';
import ContentMetrics from './ContentMetrics';
import CampaignList from './CampaignList';
import AddCampaignModal from './AddCampaignModal';
import EditCampaignModal from './EditCampaignModal';
import { useCampaignManagement } from '@/Hooks/useCampaignManagement';

import { toast } from 'react-toastify';



export default function ManageContentPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    
    const {
        campaigns,
        isLoading,
        fetchCampaigns,
        addCampaign,
        updateCampaign,
        deleteCampaign
    } = useCampaignManagement();

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const openEditModal = (campaign) => {
        setSelectedCampaign(campaign);
        setIsEditModalOpen(true);
    };

    // if (isLoading) {
        
        
    // }

    return (
        <AuthenticatedLayout>
            <Head title="Manage Content" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Manage Content</h1>
                        <p className="mt-2 text-lg text-gray-600">
                            Organize and manage your multimedia content across all connected social media platforms.
                        </p>
                    </div>

                    <SocialMediaAccounts />
                    <ContentMetrics />
                    <CampaignList
                        campaigns={campaigns}
                        onEdit={openEditModal}
                        onDelete={deleteCampaign}
                        onAdd={() => setIsModalOpen(true)}
                    />
                </div>
            </div>

            <AddCampaignModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={addCampaign}
            />

            <EditCampaignModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={(data) => updateCampaign(selectedCampaign.id, data)}
                campaign={selectedCampaign}
            />
        </AuthenticatedLayout>
    );
}