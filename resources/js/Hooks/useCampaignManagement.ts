import axios from "axios";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";


interface Campaign {
  id: number;
}

export function useCampaignManagement() {
  const { t } = useTranslation();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCampaigns = async (filters: any = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.date_start) params.append("date_start", filters.date_start);
      if (filters.date_end) params.append("date_end", filters.date_end);

      const response = await axios.get(`/campaigns?${params.toString()}`);
      console.log(response.data.campaigns);
      // Handle pagination response structure if needed, assuming API returns { campaigns: { data: [...] } } or just { campaigns: [...] }
      // Based on controller, it returns paginate object. So response.data.campaigns.data is the array.
      // But previous code expected response.data.campaigns to be the array.
      // Controller was updated to return paginate(10).
      // So response.data.campaigns will be the paginator object.
      // We need to set campaigns to response.data.campaigns.data if it exists, or response.data.campaigns if it's a simple array.

      const campaignsData =
        response.data.campaigns.data || response.data.campaigns;
      setCampaigns(campaignsData);
    } catch (error) {
      toast.error(t("campaigns.messages.fetchError"));
    } finally {
      setIsLoading(false);
    }
  };

  const addCampaign = async (data: any) => {
    try {
      let formData;
      if (data instanceof FormData) {
        formData = data;
      } else {
        formData = new FormData();
        Object.keys(data).forEach((key) => {
          if (key === "image" && data[key] instanceof FileList) {
            if (data[key].length > 0) {
              formData.append(key, data[key][0]);
            }
          } else {
            formData.append(key, data[key]);
          }
        });
      }
      await axios.post("/campaigns", formData);
      toast.success(t("campaigns.messages.addSuccess"));
      return true;
    } catch (error) {
      toast.error(t("campaigns.messages.addError"));
      return false;
    }
  };

  const updateCampaign = async (id: number, data: any) => {
    try {
      let response;
      if (data instanceof FormData) {
        response = await axios.post(`/campaigns/${id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        const hasFile =
          data.image instanceof File || data.image instanceof FileList;

        if (hasFile) {
          const formData = new FormData();
          formData.append("_method", "PUT");

          Object.keys(data).forEach((key) => {
            if (key === "image") {
              if (data[key] instanceof FileList && data[key].length > 0) {
                formData.append(key, data[key][0]);
              } else if (data[key] instanceof File) {
                formData.append(key, data[key]);
              }
            } else {
              formData.append(key, data[key] === null ? "" : data[key]);
            }
          });

          response = await axios.post(`/campaigns/${id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } else {
          response = await axios.put(`/campaigns/${id}`, data);
        }
      }

      setCampaigns((prevCampaigns) =>
        prevCampaigns.map((campaign) =>
          campaign.id === id ? response.data.campaign : campaign
        )
      );
      toast.success(t("campaigns.messages.updateSuccess"));
      return true;
    } catch (error) {
      console.error(error);
      toast.error(t("campaigns.messages.updateError"));
      return false;
    }
  };

  const deleteCampaign = async (id: number) => {
    try {
      await axios.delete(`/campaigns/${id}`);
      setCampaigns((prevCampaigns) =>
        prevCampaigns.filter((campaign) => campaign.id !== id)
      );
      await fetchCampaigns();
      toast.success(t("campaigns.messages.deleteSuccess"));
    } catch (error) {
      toast.error(t("campaigns.messages.deleteError"));
    }
  };

  return {
    campaigns,
    isLoading,
    fetchCampaigns,
    addCampaign,
    updateCampaign,
    deleteCampaign,
  };
}
