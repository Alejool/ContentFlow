import { usePublishPublication } from "@/Hooks/publication/usePublishPublication";
import { useContentUIStore } from "@/stores/contentUIStore";
import { useManageContentUIStore } from "@/stores/manageContentUIStore";
import { Campaign } from "@/types/Campaign";
import { Publication } from "@/types/Publication";
import { memo } from "react";
import { createPortal } from "react-dom";

// Modals
import AddCampaignModal from "@/Components/ManageContent/modals/AddCampaignModal";
import AddPublicationModal from "@/Components/ManageContent/modals/AddPublicationModal";
import EditCampaignModal from "@/Components/ManageContent/modals/EditCampaignModal";
import EditPublicationModal from "@/Components/ManageContent/modals/EditPublicationModal";
import PublishPublicationModal from "@/Components/ManageContent/modals/PublishPublicationModal";
import ViewCampaignModal from "@/Components/ManageContent/modals/ViewCampaignModal";
import { usePublicationStore } from "@/stores/publicationStore";

interface ModalManagerProps {
  onRefresh: () => void;
}

const ModalManager = memo(({ onRefresh }: ModalManagerProps) => {
  const contentUI = useContentUIStore();
  const manageContentUI = useManageContentUIStore();

  // Pick the active UI state based on which one has a selection
  const uiState = manageContentUI.selectedItem ? manageContentUI : contentUI;

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
  } = uiState;

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

  // CRITICAL: Get FRESH data from stores to ensure reactivity when background processes update them
  const publications = usePublicationStore((s) => s.publications);
  const currentPub =
    targetIsPublication && selectedItem?.id
      ? (publications.find((p) => p.id === selectedItem.id) as Publication) ||
        (selectedItem as Publication)
      : null;

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
          document.body,
        )}

      {createPortal(
        <>
          <EditPublicationModal
            isOpen={isEditModalOpen && targetIsPublication}
            onClose={closeEditModal}
            publication={currentPub}
            onSubmit={onRefresh}
          />

          {isEditModalOpen && targetIsCampaign && (
            <EditCampaignModal
              isOpen={isEditModalOpen}
              onClose={closeEditModal}
              campaign={selectedItem as Campaign}
              onSubmit={onRefresh}
            />
          )}
        </>,
        document.body,
      )}

      {isPublishModalOpen &&
        activeTab === "publications" &&
        createPortal(
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
          />,
          document.body,
        )}

      {isViewDetailsModalOpen &&
        createPortal(
          <ViewCampaignModal
            isOpen={isViewDetailsModalOpen}
            onClose={closeViewDetailsModal}
            campaign={selectedItem as any}
            onEdit={openEditModal}
          />,
          document.body,
        )}
    </>
  );
});

export default ModalManager;
