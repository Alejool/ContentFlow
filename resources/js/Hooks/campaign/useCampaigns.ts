import axios from "axios";
import { useEffect, useState } from "react";

export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/v1/campaigns");
      if (response.data?.campaigns?.data) {
        setCampaigns(response.data.campaigns.data);
      } else if (Array.isArray(response.data?.campaigns)) {
        setCampaigns(response.data.campaigns);
      }
    } catch (error) {
      console.error("Failed to fetch campaigns", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  return { campaigns, loading, fetchCampaigns };
};
