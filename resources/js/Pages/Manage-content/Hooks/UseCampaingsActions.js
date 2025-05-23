import { useState } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

export function useCampaignActions(initialCampaigns) {
    const [contentList, setContentList] = useState(initialCampaigns);

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

    return {
        contentList,
        setContentList,
        handleDeleteCampaign,
    };
}