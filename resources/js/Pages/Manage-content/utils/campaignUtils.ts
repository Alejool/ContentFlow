import { toast } from "react-hot-toast";

export function handleDeleteCampaign(id: number, contentList: any, setContentList: any) {
  const updatedList = contentList.filter((campaign: any) => campaign.id !== id);
  setContentList(updatedList);
  toast.success("Campaign deleted successfully!");
}
