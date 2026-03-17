import { usePublishPublication } from '@/Hooks/publication/usePublishPublication';
import { useManageContentUIStore } from '@/stores/manageContentUIStore';
import { Campaign } from '@/types/Campaign';
import { Publication } from '@/types/Publication';
import React, { memo } from 'react';
import { createPortal } from 'react-dom';

// Modals
import AddCampaignModal from '@/Components/Content/modals/AddCampaignModal';
import AddPublicationModal from '@/Components/Content/modals/AddPublicationModal';
import EditCampaignModal from '@/Components/Content/modals/EditCampaignModal';
import EditPublicationModal from '@/Components/Content/modals/EditPublicationModal';
import PublishPublicationModal from '@/Components/Content/modals/PublishPublicationModal';
import ViewPublicationModal from '@/Components/Content/modals/ViewPublicationModal';
import { usePublicationStore } from '@/stores/publicationStore';

interface ModalManagerProps {
  onRefresh: () => void;
}

const ModalManager = memo(({ onRefresh }: ModalManagerProps) => {
  const manageContentUI = useManageContentUIStore();

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
  } = manageContentUI;

  const { fetchPublishedPlatforms, publishing } = usePublishPublication();

  // Helper to determine item type safely
  const isCampaignItem =
    selectedItem &&
    ((selectedItem as any).__type === 'campaign' ||
      ('name' in selectedItem && !('title' in selectedItem)));
  const isPublicationItem = selectedItem && !isCampaignItem;

  // Logic for targeting correct modal based on selection or active tab
  const targetIsCampaign = isCampaignItem || (activeTab === 'campaigns' && !selectedItem);
  const targetIsPublication = isPublicationItem || (activeTab === 'publications' && !selectedItem);

  // CRITICAL: Get FRESH data from stores to ensure reactivity when background processes update them
  const publications = usePublicationStore((s) => s.publications);
  
  // IMPORTANT: Stabilize publication data while publishing to prevent re-renders
  // that cause connectedAccounts to become empty momentarily
  const [stablePublication, setStablePublication] = React.useState<Publication | null>(null);
  
  React.useEffect(() => {
    if (isPublishModalOpen && targetIsPublication && selectedItem?.id) {
      const freshPub = publications.find((p) => p.id === selectedItem.id) as Publication;
      const pubToUse = freshPub || (selectedItem as Publication);
      
      // Only update if not currently publishing to prevent data flickering
      if (!publishing) {
        setStablePublication(pubToUse);
      }
    } else if (!isPublishModalOpen) {
      // Reset when modal closes
      setStablePublication(null);
    }
  }, [isPublishModalOpen, targetIsPublication, selectedItem?.id, publications, publishing]);
  
  const currentPub = stablePublication || (
    targetIsPublication && selectedItem?.id
      ? (publications.find((p) => p.id === selectedItem.id) as Publication) ||
        (selectedItem as Publication)
      : null
  );

  // Debug log to track publication updates
  if (currentPub && isEditModalOpen) {
  }

  // Determine which Add Modal to show
  // Prefer addType from store, fallback to activeTab logic
  const showAddCampaign = addType === 'campaign' || (addType === null && activeTab === 'campaigns');
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
        activeTab === 'publications' &&
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
            publication={currentPub}
            onSuccess={onRefresh}
          />,
          document.body,
        )}

      {isViewDetailsModalOpen &&
        createPortal(
          <ViewPublicationModal
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
