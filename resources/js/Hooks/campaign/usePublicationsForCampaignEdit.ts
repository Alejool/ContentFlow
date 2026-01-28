import axios from "axios";
import { useEffect, useState } from "react";

export const usePublicationsForCampaignEdit = (
  isOpen: boolean,
  campaignId?: number,
) => {
  const [availablePublications, setAvailablePublications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPublications = async () => {
    if (!isOpen || !campaignId) return;

    setLoading(true);
    try {
      let url = `/api/v1/publications?simplified=true&exclude_assigned=true&include_campaign_id=${campaignId}`;

      const response = await axios.get(url);

      if (response.data?.publications) {
        if (Array.isArray(response.data.publications)) {
          setAvailablePublications(response.data.publications);
        } else if (
          response.data.publications.data &&
          Array.isArray(response.data.publications.data)
        ) {
          setAvailablePublications(response.data.publications.data);
        }
      } else if (Array.isArray(response.data)) {
        setAvailablePublications(response.data);
      }
    } catch (error) {
      console.error("Error fetching publications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && campaignId) {
      fetchPublications();
    }
  }, [isOpen, campaignId]);

  const getThumbnail = (pub: any) => {
    if (!pub.media_files || pub.media_files.length === 0) return null;

    const firstImage = pub.media_files.find((f: any) =>
      f.file_type.includes("image"),
    );
    if (firstImage) {
      const url = firstImage.file_path.startsWith("http")
        ? firstImage.file_path
        : `/storage/${firstImage.file_path}`;
      return { url, type: "image" };
    }

    const hasVideo = pub.media_files.some((f: any) =>
      f.file_type.includes("video"),
    );
    if (hasVideo) {
      return { url: null, type: "video" };
    }

    return null;
  };

  return {
    availablePublications,
    loading,
    getThumbnail,
    refetch: fetchPublications,
  };
};
