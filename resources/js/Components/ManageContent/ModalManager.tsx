import React, { memo } from "react";
import { createPortal } from "react-dom";
import { useManageContentUIStore } from "@/stores/manageContentUIStore";
import { usePublishPublication } from "@/Hooks/publication/usePublishPublication";
import { Campaign } from "@/types/Campaign";
import { Publication } from "@/types/Publication";

// Modals
import AddCampaignModal from "@/Components/ManageContent/modals/AddCampaignModal";
import AddPublicationModal from "@/Components/ManageContent/modals/AddPublicationModal";
import EditCampaignModal from "@/Components/ManageContent/modals/EditCampaignModal";
import EditPublicationModal from "@/Components/ManageContent/modals/EditPublicationModal";
import PublishPublicationModal from "@/Components/ManageContent/modals/PublishPublicationModal";
import ViewCampaignModal from "@/Components/ManageContent/modals/ViewCampaignModal";

interface ModalManagerProps {
    onRefresh: () => void;
}

const ModalManager = memo(({ onRefresh }: ModalManagerProps) => {
    const {
        activeTab,
        selectedItem,
        isAddModalOpen,
        isEditModalOpen,
        isPublishModalOpen,
        isViewDetailsModalOpen,
        openEditModal,
        closeAddModal,
        closeEditModal,
        closePublishModal,
        closeViewDetailsModal,
    } = useManageContentUIStore();


    const { fetchPublishedPlatforms } = usePublishPublication();

    // Helper to determine item type safely
    const isCampaignItem =
        selectedItem &&
        ((selectedItem as any).__type === "campaign" ||
            ("name" in selectedItem && !("title" in selectedItem)));
    const isPublicationItem = selectedItem && !isCampaignItem;

    // Logic for targeting correct modal based on selection or active tab
    const targetIsCampaign =
        isCampaignItem || (activeTab === "campaigns" && !selectedItem);
    const targetIsPublication =
        isPublicationItem || (activeTab === "publications" && !selectedItem);

    return (
        <>
            {isAddModalOpen &&
                createPortal(
                    activeTab === "campaigns" ? (
                        <AddCampaignModal
                            isOpen={isAddModalOpen}
                            onClose={closeAddModal}
                            onSubmit={onRefresh}
                        />
                    ) : (
                        <AddPublicationModal
                            isOpen={isAddModalOpen}
                            onClose={closeAddModal}
                            onSubmit={onRefresh}
                        />
                    ),
                    document.body
                )}

            {createPortal(
                <>
                    {/* Always render Publication Modal (hidden/visible handled internally via CSS for performance) */}
                    <EditPublicationModal
                        isOpen={isEditModalOpen && targetIsPublication}
                        onClose={closeEditModal}
                        publication={targetIsPublication ? (selectedItem as Publication) : null}
                        onSubmit={onRefresh}
                    />

                    {/* Render Campaign Modal conditionally */}
                    {isEditModalOpen && targetIsCampaign && (
                        <EditCampaignModal
                            isOpen={isEditModalOpen}
                            onClose={closeEditModal}
                            campaign={selectedItem as Campaign}
                            onSubmit={onRefresh}
                        />
                    )}
                </>,
                document.body
            )}

            {isPublishModalOpen &&
                createPortal(
                    activeTab === "publications" && (
                        <PublishPublicationModal
                            isOpen={isPublishModalOpen}
                            onClose={(id?: number) => {
                                const idToRefresh = id || selectedItem?.id;
                                closePublishModal();
                                if (idToRefresh) {
                                    fetchPublishedPlatforms(idToRefresh);
                                }
                            }}
                            publication={selectedItem as Publication}
                            onSuccess={onRefresh}
                        />
                    ),
                    document.body
                )}

            {isViewDetailsModalOpen &&
                createPortal(
                    <ViewCampaignModal
                        isOpen={isViewDetailsModalOpen}
                        onClose={closeViewDetailsModal}
                        campaign={selectedItem as any}
                        onEdit={openEditModal}
                    />,

                    document.body
                )}
        </>
    );
});

export default ModalManager;
