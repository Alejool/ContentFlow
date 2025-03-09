import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import SocialMediaAccounts from './SocialMediaAccounts';
import ContentMetrics from './ContentMetrics';
import ContentCard from './ContentCard';
import AddCampaignModal from './AddCampaignModal';
import EditCampaignModal from './EditCampaignModal'; // Nuevo componente para editar
import { handleDeleteCampaign } from '../utils/campaignUtils';

export default function ManageContentPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [contentList, setContentList] = useState([
        {
            id: 1,
            title: 'Summer Campaign',
            description: 'A collection of images and videos for the summer campaign.',
            image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzkybsq1HMrqnRieNMKXyPcQI3JeevUwn4Bw&s',
            date: '2023-10-15',
            hashtags: '#Summer #Campaign #Fun',
        },
    ]);



    // Agregar una nueva campaña
    const handleAddCampaign = (data) => {
        const newCampaign = {
            id: contentList.length + 1,
            title: data.title,
            description: data.description,
            image: URL.createObjectURL(data.image[0]),
            date: new Date().toISOString().split('T')[0],
            hashtags: data.hashtags,
        };
        setContentList([...contentList, newCampaign]);
        setIsModalOpen(false);
        toast.success('Campaign added successfully!');
    };

    // Editar una campaña existente
    const handleEditCampaign = (data) => {
        const updatedList = contentList.map((campaign) =>
            campaign.id === selectedCampaign.id ? { ...campaign, ...data } : campaign
        );
        setContentList(updatedList);
        setIsEditModalOpen(false);
        toast.success('Campaign updated successfully!');
    };

    // Eliminar una campaña
    const handleDeleteCampaign = (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'You will not be able to recover this campaign!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
        }).then((result) => {
            if (result.isConfirmed) {
                const updatedList = contentList.filter((campaign) => campaign.id !== id);
                setContentList(updatedList);
                toast.success('Campaign deleted successfully!');
            }
        });
    };

    // Abrir modal de edición
    const openEditModal = (campaign) => {
        setSelectedCampaign(campaign);
        setIsEditModalOpen(true);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Manage Content" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Manage Content</h1>
                        <p className="mt-2 text-lg text-gray-600">
                            Organize and manage your multimedia content across all connected social media platforms.
                        </p>
                    </div>

                    {/* Social Media Accounts */}
                    <SocialMediaAccounts />

                    {/* Content Metrics */}
                    <ContentMetrics />

                    {/* Content Cards */}
                    <div className="mt-8 bg-white shadow-md rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-6">Your Content</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {contentList.map((content) => (
                                <ContentCard
                                    key={content.id}
                                    content={content}
                                    onEdit={() => openEditModal(content)}
                                    onDelete={() => handleDeleteCampaign(content.id)}
                                />
                            ))}
                            <div
                                className="flex items-center justify-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition duration-300 cursor-pointer"
                                onClick={() => setIsModalOpen(true)}
                            >
                                <button className="flex flex-col items-center text-blue-600 hover:text-blue-700">
                                    <svg
                                        className="w-10 h-10 mb-2"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                        ></path>
                                    </svg>
                                    <span className="text-sm font-semibold">Add New Content</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Campaign Modal */}
            <AddCampaignModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleAddCampaign}
            />

            {/* Edit Campaign Modal */}
            <EditCampaignModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleEditCampaign}
                campaign={selectedCampaign}
            />
        </AuthenticatedLayout>
    );
}