import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import SocialMediaAccounts from './SocialMediaAccounts';
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
    
    const handleUpdateCampaign = async (data) => {
        const success = await updateCampaign(selectedCampaign.id, data);
        if (success) {
            setIsEditModalOpen(false);
            setSelectedCampaign(null);
            await fetchCampaigns();
        }
    };

    const handleAddCampaign = async (data) => {
        const success = await addCampaign(data);
        if (success) {
            setIsModalOpen(false);
            await fetchCampaigns();
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Manage Content" />
            <div className="min-h-screen bg-gradient-to-br
                
                  ">
                <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header Section */}
                    <div className="mb-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-600 to-orange-700 rounded-2xl mb-6">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
                            ✨ Content Management
                        </h1>
                        
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Organize and manage your multimedia content elegantly and efficiently
                        </p>
                    </div>

                    {/* Content Sections */}
                    <div className="space-y-8">
                        <SocialMediaAccounts />
                        <CampaignList
                            campaigns={campaigns}
                            onEdit={openEditModal}
                            onDelete={deleteCampaign}
                            onAdd={() => setIsModalOpen(true)}
                            isLoading={isLoading}
                        />
                    </div>
                </div>
            </div>
                
            {createPortal(
                <AddCampaignModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleAddCampaign}
                />,
                document.body
            )}

            {createPortal(
                <EditCampaignModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSubmit={handleUpdateCampaign}
                    campaign={selectedCampaign}
                />,
                document.body
            )}
        </AuthenticatedLayout>
    );
}

