import PublicationDesktopRow from '@/Components/Content/Publication/PublicationDesktopRow';
import PublicationMobileRow from '@/Components/Content/Publication/PublicationMobileRow';
import PublicationMobileRowSkeleton from '@/Components/Content/Publication/PublicationMobileRowSkeleton';
import PublicationRowSkeleton from '@/Components/Content/Publication/PublicationRowSkeleton';
import { TableHeader } from '@/Components/Content/Publication/TableHeader';
import AdvancedPagination from '@/Components/common/ui/AdvancedPagination';
import EmptyState from '@/Components/common/ui/EmptyState';
import TableContainer from '@/Components/common/ui/TableContainer';
import { Publication } from '@/types/Publication';
import { memo, useCallback, useEffect, useState } from 'react';

interface PublicationTableProps {
  items: Publication[];
  t: (key: string) => string;
  connectedAccounts: { id: number; platform: string; [key: string]: unknown }[];
  onEdit: (item: Publication) => void;
  onDelete: (id: number) => void;
  onPublish: (item: Publication) => void;
  onEditRequest?: (item: Publication) => void;
  onViewDetails?: (item: Publication) => void;
  onDuplicate?: (id: number) => void;
  isLoading?: boolean;
  permissions?: string[];
  pagination?: {
    current_page: number;
    last_page: number;
    total: number;
    per_page?: number;
  };
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  remoteLocks?: Record<number, { user_id: number; user_name: string; expires_at: string }>;
  onPreviewMedia?: (
    media: {
      url: string;
      type: 'image' | 'video';
      title?: string;
    }[],
    initialIndex?: number,
  ) => void;
}

const PublicationTable = memo(
  function PublicationTable({
    items,
    t,
    connectedAccounts,
    onEdit,
    onDelete,
    onPublish,
    onEditRequest,
    onViewDetails,
    onDuplicate,
    isLoading,
    permissions,
    pagination,
    onPageChange,
    onPerPageChange,
    remoteLocks = {},
    onPreviewMedia,
  }: PublicationTableProps) {
    const [smoothLoading, setSmoothLoading] = useState(isLoading);

    useEffect(() => {
      let timer: ReturnType<typeof setTimeout>;
      if (!isLoading) {
        timer = setTimeout(() => setSmoothLoading(false), 300);
      } else {
        timer = setTimeout(() => setSmoothLoading(true), 0);
      }
      return () => clearTimeout(timer);
    }, [isLoading]);

    const getStatusColor = useCallback((status?: string) => {
      switch (status) {
        case 'published':
          return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
        case 'publishing':
          return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
        case 'draft':
          return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        case 'scheduled':
          return 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400';
        case 'failed':
          return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
        case 'pending_review':
          return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
        case 'approved':
          return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
        case 'rejected':
          return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
        default:
          return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      }
    }, []);

    return (
      <TableContainer
        title={t('publications.title') || 'Publicaciones'}
        subtitle={t('publications.subtitle') || 'Gestiona tu contenido en redes sociales'}
      >
        <div className="transition-opacity duration-300">
          <div className="hidden lg:block">
            <div className="grid grid-cols-1 grid-rows-1">
              <div
                className={`col-start-1 row-start-1 transition-all duration-500 ${smoothLoading ? 'invisible opacity-0' : 'visible opacity-100'}`}
              >
                {items.length === 0 ? (
                  <EmptyState
                    title={t('publications.table.emptyState.title')}
                    description={
                      t('publications.table.emptyState.description') ||
                      'No se encontraron publicaciones.'
                    }
                    className="border-none bg-transparent shadow-none"
                  />
                ) : (
                  <div className="w-full overflow-x-auto">
                    <table className="z-0 w-full border-collapse text-left">
                      <thead className="sticky top-0 z-10 border-gray-100 bg-gray-50/50 dark:border-neutral-800 dark:bg-neutral-900/50">
                        <tr className="border-b bg-gray-50/80 text-xs uppercase tracking-wider text-gray-500 dark:bg-neutral-900/80 dark:text-gray-400">
                          <TableHeader mode="publications" t={t} />
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr
                            key={item.id}
                            onClick={() => onViewDetails?.(item)}
                            className="cursor-pointer border-b border-gray-50 transition-colors hover:bg-gray-50/30 dark:border-neutral-800 dark:hover:bg-neutral-800/30"
                          >
                            <PublicationDesktopRow
                              item={item}
                              t={t}
                              connectedAccounts={connectedAccounts}
                              getStatusColor={getStatusColor}
                              onEdit={onEdit}
                              onDelete={onDelete}
                              onPublish={onPublish}
                              onEditRequest={onEditRequest}
                              onViewDetails={onViewDetails}
                              onDuplicate={onDuplicate}
                              remoteLock={remoteLocks[item.id]}
                              permissions={permissions || []}
                              onPreviewMedia={onPreviewMedia}
                            />
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {smoothLoading && (
                <div className="animate-out fade-out fill-mode-forwards z-20 col-start-1 row-start-1 bg-white/50 duration-500 dark:bg-neutral-900/50">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        <TableHeader mode="publications" t={t} />
                      </tr>
                    </thead>
                    <tbody>
                      {[...Array(pagination?.per_page || 10)].map((_, i) => (
                        <PublicationRowSkeleton key={i} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="lg:hidden">
            {!smoothLoading && items.length === 0 ? (
              <EmptyState
                title={t('publications.table.emptyState.title')}
                description={
                  t('publications.table.emptyState.description') ||
                  'No se encontraron publicaciones.'
                }
                imageSize="sm"
              />
            ) : (
              <div className="grid grid-cols-1 grid-rows-1">
                <div
                  className={`col-start-1 row-start-1 transition-all duration-500 ${smoothLoading ? 'invisible opacity-0' : 'visible opacity-100'}`}
                >
                  <PublicationMobileRow
                    items={items}
                    t={t}
                    connectedAccounts={connectedAccounts}
                    getStatusColor={getStatusColor}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onPublish={onPublish}
                    onEditRequest={onEditRequest}
                    onViewDetails={onViewDetails}
                    onDuplicate={onDuplicate}
                    remoteLocks={remoteLocks}
                    permissions={permissions}
                    onPreviewMedia={onPreviewMedia}
                  />
                </div>

                {smoothLoading && (
                  <div className="animate-out fade-out fill-mode-forwards z-20 col-start-1 row-start-1 bg-white duration-500 dark:bg-neutral-900">
                    <PublicationMobileRowSkeleton />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {pagination && (
          <AdvancedPagination
            currentPage={pagination.current_page}
            lastPage={pagination.last_page}
            total={pagination.total}
            perPage={pagination.per_page || 12}
            onPageChange={onPageChange || (() => {})}
            onPerPageChange={onPerPageChange || (() => {})}
            t={t}
            isLoading={isLoading}
          />
        )}
      </TableContainer>
    );
  },
);

export default PublicationTable;
