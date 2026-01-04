
import React, { useState } from 'react';
import ContentCard from './ContentCard';
import PublicationTable from '@/Components/ManageContent/Publication/PublicationTable'; // Reuse existing table
import CampaignTable from '@/Components/ManageContent/Campaign/CampaignTable'; // Reuse existing table
import { LayoutGrid, List as ListIcon, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Pagination from '@/Components/ManageContent/common/Pagination';


interface ContentListProps {
    items: any[];
    mode: 'publications' | 'campaigns';
    onEdit: (item: any) => void;
    onDelete: (id: number) => void;
    onViewDetails?: (item: any) => void;
    onPublish?: (item: any) => void;
    isLoading: boolean;
    pagination: any;
    onPageChange: (page: number) => void;
    connectedAccounts?: any[];
    // .. add other props needed for tables
    onEditRequest?: (item: any) => void;
    expandedCampaigns?: number[];
    toggleExpand?: (id: number) => void;
}

export default function ContentList(props: ContentListProps) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [isPending, startTransition] = React.useTransition();
    const { t } = useTranslation();

    const { items, isLoading, mode } = props;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (!items || items.length === 0) {
        return (
            <div className="text-center py-20 text-gray-400">
                No content found.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* View Toggle */}
            <div className="flex justify-end mb-2">
                <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex items-center gap-1">
                    <button
                        onClick={() => startTransition(() => setViewMode('grid'))}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Grid View"
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => startTransition(() => setViewMode('list'))}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                        title="List View"
                    >
                        <ListIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {items.map((item) => (
                        <ContentCard
                            key={item.id}
                            item={item}
                            type={mode === 'campaigns' ? 'campaign' : 'publication'}
                            onEdit={props.onEdit}
                            onDelete={props.onDelete}
                            onViewDetails={props.onViewDetails}
                            onPublish={props.onPublish}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-gray-800 w-full overflow-x-auto">
                    {mode === 'campaigns' ? (
                        <CampaignTable
                            {...props}
                            // Pass specific props expected by CampaignTable that might be missing in basic props
                            t={t}
                            expandedCampaigns={props.expandedCampaigns || []}
                            toggleExpand={props.toggleExpand || (() => { })}
                            onViewDetails={props.onViewDetails || (() => { })}
                        />
                    ) : (
                        <PublicationTable
                            {...props}
                            t={t}
                            connectedAccounts={props.connectedAccounts || []}
                            onPublish={props.onPublish || (() => { })}
                        />
                    )}
                </div>
            )}

            {props.pagination && props.pagination.last_page > 1 && (
                <div className="mt-6">
                    <Pagination
                        pagination={props.pagination}
                        onPageChange={props.onPageChange}
                        t={t}
                    />
                </div>
            )}
        </div>
    );
}
