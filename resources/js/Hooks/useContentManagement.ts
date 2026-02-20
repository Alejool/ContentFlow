import { Campaign } from "@/types/Campaign";
import { Publication } from "@/types/Publication";
import axios, { AxiosResponse } from "axios";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

export type ContentItem = Campaign | Publication;
export type ContentEndpoint = "publications" | "campaigns" | "logs";

export function useContentManagement() {
  const { t } = useTranslation();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 5,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = async (
    filters: any = {},
    page: number = 1,
    endpoint: ContentEndpoint = "publications",
  ) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("page", page.toString());
      if (filters.status) params.append("status", filters.status);
      if (filters.date_start) params.append("date_start", filters.date_start);
      if (filters.date_end) params.append("date_end", filters.date_end);

      const response: AxiosResponse = await axios.get(`/api/v1/${endpoint}`, {
        params,
      });

      // Handle both publications and campaigns response structure
      const dataKey =
        endpoint === "publications" ? "publications" : "campaigns";

      const responseData = response.data[dataKey];
      const resultItems = responseData?.data || [];

      setItems(resultItems);
      setPagination({
        current_page: responseData.current_page || 1,
        last_page: responseData.last_page || 1,
        total: responseData.total || 0,
        per_page: responseData.per_page || 5,
      });
    } catch (error) {
      toast.error(t("campaigns.messages.fetchError"));
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = async (
    data: any,
    endpoint: Exclude<ContentEndpoint, "logs"> = "publications",
  ) => {
    try {
      let formData: FormData;
      if (data instanceof FormData) {
        formData = data;
      } else {
        formData = new FormData();
        Object.keys(data).forEach((key) => {
          if (key === "image" && data[key] instanceof FileList) {
            if (data[key].length > 0) {
              formData.append(key, data[key][0]);
            }
          } else if (Array.isArray(data[key])) {
            data[key].forEach((val: any) => formData.append(`${key}[]`, val));
          } else {
            formData.append(key, data[key]);
          }
        });
      }
      await axios.post(`/api/v1/${endpoint}`, formData);
      toast.success(t("campaigns.messages.addSuccess"));
      // Refresh current page
      await fetchItems({}, pagination.current_page, endpoint);
      return true;
    } catch (error) {
      toast.error(t("campaigns.messages.addError"));
      return false;
    }
  };

  const updateItem = async (
    id: number,
    data: any,
    endpoint: Exclude<ContentEndpoint, "logs"> = "publications",
  ) => {
    try {
      let response: AxiosResponse;
      if (data instanceof FormData) {
        response = await axios.post(`/api/v1/${endpoint}/${id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        const hasFile =
          data.image instanceof File ||
          data.image instanceof FileList ||
          (Array.isArray(data.media) &&
            data.media.some((item: any) => item instanceof File));

        if (hasFile) {
          const formData: FormData = new FormData();
          formData.append("_method", "PUT");

          Object.keys(data).forEach((key) => {
            if (key === "image") {
              if (data[key] instanceof FileList && data[key].length > 0) {
                formData.append(key, data[key][0]);
              } else if (data[key] instanceof File) {
                formData.append(key, data[key]);
              }
            } else if (key === "media" && Array.isArray(data[key])) {
              data[key].forEach((file: File) => {
                if (file instanceof File) {
                  formData.append("media[]", file);
                }
              });
            } else {
              // Handle other arrays (like social_accounts)
              if (Array.isArray(data[key])) {
                data[key].forEach((item: any) => {
                  formData.append(`${key}[]`, item);
                });
              } else {
                formData.append(key, data[key] === null ? "" : data[key]);
              }
            }
          });

          response = await axios.post(`/api/v1/${endpoint}/${id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } else {
          response = await axios.put(`/api/v1/${endpoint}/${id}`, data);
        }
      }

      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === id
            ? response.data.campaign ||
              response.data.publication ||
              response.data.item
            : item,
        ),
      );
      toast.success(t("campaigns.messages.updateSuccess"));
      return true;
    } catch (error) {
      toast.error(t("campaigns.messages.updateError"));
      return false;
    }
  };

  const deleteItem = async (
    id: number,
    endpoint: Exclude<ContentEndpoint, "logs"> = "publications",
  ) => {
    try {
      await axios.delete(`/api/v1/${endpoint}/${id}`);
      setItems((prevItems) => prevItems.filter((item) => item.id !== id));
      await fetchItems({}, pagination.current_page, endpoint);
      toast.success(t("campaigns.messages.deleteSuccess"));
      return true;
    } catch (error) {
      toast.error(t("campaigns.messages.deleteError"));
      return false;
    }
  };

  return {
    items,
    pagination,
    isLoading,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
  };
}
