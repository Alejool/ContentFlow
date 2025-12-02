import Swal from "sweetalert2";
import { toast } from "react-hot-toast";

export function handleDeleteCampaign(id, contentList, setContentList) {
  Swal.fire({
    title: "Are you sure?",
    text: "You will not be able to recover this campaign!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete it!",
  }).then((result) => {
    if (result.isConfirmed) {
      const updatedList = contentList.filter((campaign) => campaign.id !== id);
      setContentList(updatedList);
      toast.success("Campaign deleted successfully!");
    }
  });
}
