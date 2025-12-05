import { useState } from "react";
import { toast } from "react-hot-toast";

interface Campaign {
  id: number;
}

export function useCampaignActions(initialCampaigns: Campaign[]) {
  const [contentList, setContentList] = useState(initialCampaigns);

  const handleDeleteCampaign = (id: number) => {
    const updatedList = contentList.filter((campaign: Campaign) => campaign.id !== id);
    setContentList(updatedList);
    toast.success("Campaign deleted successfully!");
  };

  return {
    contentList,
    setContentList,
    handleDeleteCampaign,
  };
}
