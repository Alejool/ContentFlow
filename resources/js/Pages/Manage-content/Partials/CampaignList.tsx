import React from 'react';
import ContentCard from './ContentCard';
import { useTranslation } from 'react-i18next';

export default function CampaignList({ campaigns, onEdit, onDelete, onAdd }) {
    const { t } = useTranslation();

    return (
        <div className="mt-8 bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">{t('manageContent.campaigns.yourContent')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((campaign) => (
                    <ContentCard
                        key={campaign.id}
                        content={campaign}
                        onEdit={() => onEdit(campaign)}
                        onDelete={() => onDelete(campaign.id)}
                    />
                ))}
                <div
                    className="flex items-center justify-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition duration-300 cursor-pointer"
                    onClick={onAdd}
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
                        <span className="text-sm font-semibold">{t('manageContent.campaigns.addNew')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}