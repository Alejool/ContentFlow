import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";

export function useCampaignManagement() {
  const { t } = useTranslation();
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCampaigns = async () => {
    try {
      const response = await axios.get("/campaigns");
      console.log(response.data.campaigns);
      setCampaigns(response.data.campaigns);
    } catch (error) {
      toast.error(t("campaigns.messages.fetchError"));
    } finally {
      setIsLoading(false);
    }
  };

  const addCampaign = async (data) => {
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
      await fetchCampaigns();
      return true;
    } catch (error) {
      toast.error(t("campaigns.messages.addError"));
      return false;
    }
  };

  const updateCampaign = async (id, data) => {
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
      await fetchCampaigns();
      return true;
    } catch (error) {
      console.error(error);
      toast.error(t("campaigns.messages.updateError"));
      return false;
    }
  };

  const deleteCampaign = async (id) => {
    const result = await Swal.fire({
      title: t("campaigns.messages.confirmDelete.title"),
      text: t("campaigns.messages.confirmDelete.text"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t("campaigns.messages.confirmDelete.confirmButton"),
      cancelButtonText: t("campaigns.messages.confirmDelete.cancelButton"),
    });

    if (result.isConfirmed) {
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
