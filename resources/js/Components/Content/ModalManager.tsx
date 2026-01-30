import { usePublishPublication } from "@/Hooks/publication/usePublishPublication";
import { useManageContentUIStore } from "@/stores/manageContentUIStore";
import { usePublicationStore } from "@/stores/publicationStore";
import { Campaign } from "@/types/Campaign";
import { Publication } from "@/types/Publication";
import { memo } from "react";
import { createPortal } from "react-dom";

import AddCampaignModal from "@/Components/Content/modals/AddCampaignModal";
import AddPublicationModal from "@/Components/Content/modals/AddPublicationModal";
import EditCampaignModal from "@/Components/Content/modals/EditCampaignModal";
import EditPublicationModal from "@/Components/Content/modals/EditPublicationModal";
import PublishPublicationModal from "@/Components/Content/modals/PublishPublicationModal";
import ViewCampaignModal from "@/Components/Content/modals/ViewCampaignModal";

interface ModalManagerProps {
  onRefresh: () => void;
}

const ModalManager = memo(({ onRefresh }: ModalManagerProps) => {
  const {
    activeTab,
    selectedItem,
    isAddModalOpen,
    addType,
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

  const isCampaignItem =
    selectedItem &&
    ((selectedItem as any).__type === "campaign" ||
      ("name" in selectedItem && !("title" in selectedItem)));
  const isPublicationItem = selectedItem && !isCampaignItem;

  const targetIsCampaign =
    isCampaignItem || (activeTab === "campaigns" && !selectedItem);
  const targetIsPublication =
    isPublicationItem || (activeTab === "publications" && !selectedItem);

  const publications = usePublicationStore((s) => s.publications);
  const currentPub =
    targetIsPublication && selectedItem?.id
      ? (publications.find((p) => p.id === selectedItem.id) as Publication) ||
        (selectedItem as Publication)
      : null;

  const showAddCampaign =
    addType === "campaign" || (addType === null && activeTab === "campaigns");
  const showAddPublication = !showAddCampaign;

  return (
    <>
      {isAddModalOpen &&
        createPortal(
          showAddCampaign ? (
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
