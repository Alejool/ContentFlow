import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

export function useCampaignManagement() {
    const [campaigns, setCampaigns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCampaigns = async () => {
        try {
            const response = await axios.get('/campaigns');
            console.log(response.data.campaigns);
            setCampaigns(response.data.campaigns);
        } catch (error) {
            toast.error('Failed to fetch campaigns');
        } finally {
            setIsLoading(false);
        }
    };

    const addCampaign = async (data) => {
        try {
            const formData = new FormData();
            Object.keys(data).forEach(key => {
                formData.append(key, data[key]);
            });
            
            const response = await axios.post('/campaigns', formData);
            setCampaigns([...campaigns, response.data]);
            toast.success('Campaign added successfully!');
            return true;
        } catch (error) {
            toast.error('Failed to add campaign');
            return false;
        }
    };

    const updateCampaign = async (id, data) => {
        try {
            const response = await axios.put(`/campaigns/${id}`, data);
            setCampaigns(prevCampaigns => 
                prevCampaigns.map(campaign => 
                    campaign.id === id ? response.data : campaign
                )
            );
            toast.success('Campaign updated successfully!');
            await fetchCampaigns(); 
            return true;
        } catch (error) {
            toast.error('Failed to update campaign');
            return false;
        }
    };

    const deleteCampaign = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: 'You will not be able to recover this campaign!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`/campaigns/${id}`);
                setCampaigns(prevCampaigns => 
                    prevCampaigns.filter(campaign => campaign.id !== id)
                );
                await fetchCampaigns(); 
                toast.success('Campaign deleted successfully!');
            } catch (error) {
                toast.error('Failed to delete campaign');
            }
        }
    };

    return {
        campaigns,
        isLoading,
        fetchCampaigns,
        addCampaign,
        updateCampaign,
        deleteCampaign
    };
}
const fetchCampaigns = async () => {
    try {
        const response = await axios.get('/campaigns');
        console.log(response.data.campaigns);
        setCampaigns(response.data.campaigns);
    } catch (error) {
        toast.error('Failed to fetch campaigns');
    } finally {
        setIsLoading(false);
    }
};