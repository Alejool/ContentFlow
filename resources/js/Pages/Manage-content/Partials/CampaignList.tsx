import ModernDatePicker from "@/Components/ui/ModernDatePicker";
import { useTheme } from "@/Hooks/useTheme";
import { convertDate } from "@/Utils/date";
import { Campaign } from "@/types/Campaign";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { format } from "date-fns";
import {
  Edit,
  Eye,
  File,
  Filter,
  Image as ImageIcon,
  MoreVertical,
  Plus,
  Search,
  Share2,
  Trash2,
  Video,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type CampaignListProps = {
  campaigns: Campaign[];
  onEdit: (campaign: Campaign) => void;
  onDelete: (campaignId: number) => void;
  onAdd: () => void;
  onPublish: (campaign: Campaign) => void;
  onViewDetails: (campaign: Campaign) => void;
  isLoading: boolean;
  onFilterChange?: (filters: any) => void;
};

export default function CampaignList({
  campaigns,
  onEdit,
  onDelete,
  onAdd,
  onPublish,
  onViewDetails,
  isLoading,
  onFilterChange,
}: CampaignListProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredCampaigns = campaigns.filter(
    (campaign) =>
      campaign.title.toLowerCase().includes(search.toLowerCase()) ||
      campaign.description.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCampaigns = filteredCampaigns.slice(startIndex, endIndex);

  const handleFilterChange = (key: string, value: string) => {
    if (key === "status") setStatusFilter(value);
    if (key === "date_start") setDateStart(value);
    if (key === "date_end") setDateEnd(value);

    setCurrentPage(1);

    if (onFilterChange) {
      onFilterChange({
        status: key === "status" ? value : statusFilter,
        date_start: key === "date_start" ? value : dateStart,
        date_end: key === "date_end" ? value : dateEnd,
      });
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };
  const colorIcon =
    theme === "dark"
      ? `[&::-webkit-calendar-picker-indicator]:invert 
         [&::-webkit-calendar-picker-indicator]:opacity-80
         [&::-webkit-calendar-picker-indicator]:cursor-pointer`
      : "";

  const shouldOpenUpwards = (index: number) => {
    const totalItems = currentCampaigns.length;
    if (totalItems < 2) {
      return false;
    }
    return index >= totalItems - 2;
  };

  const countMediaFiles = (campaign: Campaign) => {
    if (!campaign.media_files || campaign.media_files.length === 0) {
      return { images: 0, videos: 0, total: 0 };
    }

    const images = campaign.media_files.filter((file) => {
      const fileType = file.file_type?.toLowerCase() || "";
      return (
        fileType.startsWith("image/") ||
        file.file_path?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ||
        file.file_type === "image" ||
        file.file_type?.includes("image")
      );
    }).length;

    const videos = campaign.media_files.filter((file) => {
      const fileType = file.file_type?.toLowerCase() || "";
      return (
        fileType.startsWith("video/") ||
        file.file_path?.match(/\.(mp4|avi|mov|wmv|flv|webm)$/i) ||
        file.file_type === "video" ||
        file.file_type?.includes("video")
      );
    }).length;

    return {
      images,
      videos,
      total: campaign.media_files.length,
    };
  };

  const getThumbnail = (campaign: Campaign) => {
    if (!campaign.media_files || campaign.media_files.length === 0) {
      return {
        type: "none" as const,
        url: null,
      };
    }

    const imageFile = campaign.media_files.find((file) => {
      const fileType = file.file_type?.toLowerCase() || "";
      return (
        fileType.startsWith("image/") ||
        file.file_path?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ||
        file.file_type === "image" ||
        file.file_type?.includes("image")
      );
    });

    if (imageFile && imageFile.file_path) {
      return {
        type: "image" as const,
        url: imageFile.file_path,
      };
    }

    const videoFile = campaign.media_files.find((file) => {
      const fileType = file.file_type?.toLowerCase() || "";
      return (
        fileType.startsWith("video/") ||
        file.file_path?.match(/\.(mp4|avi|mov|wmv|flv|webm)$/i) ||
        file.file_type === "video" ||
        file.file_type?.includes("video")
      );
    });

    if (videoFile && videoFile.file_path) {
      return {
        type: "video" as const,
        url: videoFile.file_path,
      };
    }

    const firstFile = campaign.media_files[0];
    if (firstFile && firstFile.file_path) {
      return {
        type: "unknown" as const,
        url: firstFile.file_path,
      };
    }

    return {
      type: "none" as const,
      url: null,
    };
  };

  return (
    <div
      className={`rounded-lg overflow-hidden shadow-lg border transition-all 
        duration-300 backdrop-blur-lg
        ${
          theme === "dark"
            ? "bg-neutral-800/70 border-neutral-700/70 text-white"
            : "bg-white/70 border-gray-100/70 text-gray-900"
        }
      `}
    >
      <div className="p-6 border-b border-gray-100 dark:border-neutral-700/50">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h2
              className={`text-2xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {t("campaigns.yourContent")}
            </h2>
            <p
              className={`text-sm mt-1 ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {t("campaigns.description")}
            </p>
          </div>
          <button
            onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" />
            {t("campaigns.addNew")}
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50 dark:bg-neutral-900/30 p-4 rounded-lg">
          <div className="flex items-center gap-2 w-full md:w-auto relative">
            <Search
              className={`absolute left-3 w-4 h-4 ${
                theme === "dark" ? "text-gray-500" : "text-gray-400"
              }`}
            />
            <input
              type="text"
              placeholder={t("common.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`pl-9 pr-4 py-2 rounded-lg w-full md:w-64 text-sm border focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all
                ${
                  theme === "dark"
                    ? "bg-neutral-800 border-neutral-700 text-white placeholder-gray-500"
                    : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
                }
              `}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Filter
                className={`w-4 h-4 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              />
              <select
                value={statusFilter}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className={`py-2 pl-3 pr-8 rounded-lg text-sm border focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer
                  ${
                    theme === "dark"
                      ? "bg-neutral-800/70 border-neutral-700/70 text-white"
                      : "bg-white/70 border-gray-200/70 text-gray-700"
                  }
                `}
              >
                <option value="all">{t("campaigns.filters.all")}</option>
                <option value="active">{t("campaigns.filters.active")}</option>
                <option value="upcoming">
                  {t("campaigns.filters.upcoming")}
                </option>
                <option value="completed">
                  {t("campaigns.filters.completed")}
                </option>
                <option value="draft">{t("campaigns.filters.draft")}</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-36">
                <ModernDatePicker
                  selected={
                    dateStart ? new Date(dateStart + "T00:00:00") : null
                  }
                  onChange={(date: Date | null) =>
                    handleFilterChange(
                      "date_start",
                      date ? format(date, "yyyy-MM-dd") : ""
                    )
                  }
                  placeholder={t("common.startDate") || "Start Date"}
                  withPortal
                />
              </div>
              <span
                className={theme === "dark" ? "text-gray-500" : "text-gray-400"}
              >
                -
              </span>
              <div className="w-36">
                <ModernDatePicker
                  selected={dateEnd ? new Date(dateEnd + "T00:00:00") : null}
                  onChange={(date: Date | null) =>
                    handleFilterChange(
                      "date_end",
                      date ? format(date, "yyyy-MM-dd") : ""
                    )
                  }
                  placeholder={t("common.endDate") || "End Date"}
                  minDate={
                    dateStart ? new Date(dateStart + "T00:00:00") : undefined
                  }
                  withPortal
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse z-0">
          <thead
            className={` ${
              theme === "dark"
                ? "bg-neutral-800/90  border-neutral-700"
                : "bg-gray-50/90  border-gray-100"
            }`}
          >
            <tr
              className={`text-xs uppercase tracking-wider border-b
                ${
                  theme === "dark"
                    ? "bg-neutral-800/50  border-neutral-700"
                    : "bg-gray-50  border-gray-100"
                }
              `}
            >
              <th className="px-6 py-4 font-semibold"></th>
              <th className="px-6 py-4 font-semibold">
                {t("campaigns.headers.status")}
              </th>
              <th className="px-6 py-4 font-semibold">
                {t("campaigns.headers.duration")}
              </th>
              <th className="px-6 py-4 font-semibold text-center">
                {t("campaigns.headers.mediaFiles")}
              </th>
              <th className="px-6 py-4 font-semibold text-right">
                {t("campaigns.headers.actions")}
              </th>
            </tr>
          </thead>
          <tbody
            className={`divide-y ${
              theme === "dark" ? "divide-neutral-700/50" : "divide-gray-100"
            }`}
          >
            {currentCampaigns.length > 0 ? (
              currentCampaigns.map((campaign, index) => {
                const mediaCount = countMediaFiles(campaign);
                const thumbnail = getThumbnail(campaign);

                return (
                  <tr
                    key={campaign.id}
                    className={`group transition-colors
                      ${
                        theme === "dark"
                          ? "hover:bg-neutral-700/30"
                          : "hover:bg-gray-50/50"
                      }
                    `}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-lg flex-shrink-0 border overflow-hidden relative flex items-center justify-center
                            ${
                              theme === "dark"
                                ? "border-neutral-700 bg-neutral-800"
                                : "border-gray-200 bg-gray-100"
                            }
                          `}
                        >
                          {thumbnail.type === "image" ? (
                            <>
                              <img
                                src={thumbnail.url || ""}
                                alt={campaign.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const img = e.currentTarget;
                                  img.style.display = "none";
                                  const parent = img.parentElement;
                                  if (parent) {
                                    const icon = document.createElement("div");
                                    icon.className =
                                      "flex items-center justify-center";
                                    icon.innerHTML =
                                      '<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                                    parent.appendChild(icon);
                                  }
                                }}
                              />
                              {mediaCount.total > 1 && (
                                <div className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                                  +{mediaCount.total - 1}
                                </div>
                              )}
                            </>
                          ) : thumbnail.type === "video" ? (
                            <>
                              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                <Video className="w-6 h-6 text-gray-300" />
                              </div>
                              {mediaCount.total > 1 && (
                                <div className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                                  +{mediaCount.total - 1}
                                </div>
                              )}
                            </>
                          ) : thumbnail.type === "unknown" ? (
                            <>
                              <File className="w-6 h-6 text-gray-400" />
                              {mediaCount.total > 1 && (
                                <div className="absolute -top-1 -right-1 bg-gray-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                                  +{mediaCount.total - 1}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-gray-400">
                              <File className="w-6 h-6 mb-1" />
                              <span className="text-xs">No media</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h3
                            className={`font-medium text-sm ${
                              theme === "dark" ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {campaign.title}
                          </h3>
                          <p
                            className={`text-xs mt-0.5 line-clamp-1 ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                          >
                            {campaign.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                          ${getStatusColor(campaign.status)}
                        `}
                      >
                        {campaign.status || "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-xs">
                        <span
                          className={
                            theme === "dark" ? "text-gray-300" : "text-gray-700"
                          }
                        >
                          {t("campaigns.startDate")}:{" "}
                          {convertDate(campaign.start_date || "Not set")}
                        </span>
                        <span
                          className={
                            theme === "dark" ? "text-gray-500" : "text-gray-400"
                          }
                        >
                          {t("campaigns.endDate")}:{" "}
                          {convertDate(campaign.end_date || "Not set")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center gap-1">
                        {mediaCount.total > 0 ? (
                          <div className="flex items-center gap-3">
                            {mediaCount.images > 0 && (
                              <div
                                className="flex items-center gap-1"
                                title={`${mediaCount.images} images`}
                              >
                                <ImageIcon className="w-4 h-4 text-blue-500" />
                                <span className="text-xs font-medium">
                                  {mediaCount.images}
                                </span>
                              </div>
                            )}
                            {mediaCount.videos > 0 && (
                              <div
                                className="flex items-center gap-1"
                                title={`${mediaCount.videos} videos`}
                              >
                                <Video className="w-4 h-4 text-purple-500" />
                                <span className="text-xs font-medium">
                                  {mediaCount.videos}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span
                            className={`text-xs ${
                              theme === "dark"
                                ? "text-gray-500"
                                : "text-gray-400"
                            }`}
                          >
                            No media
                          </span>
                        )}
                        {mediaCount.total > 0 && (
                          <div
                            className={`text-xs ${
                              theme === "dark"
                                ? "text-gray-500"
                                : "text-gray-400"
                            }`}
                          >
                            {mediaCount.total} total
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right relative isolate">
                      <Menu
                        as="div"
                        className="relative inline-block text-left"
                      >
                        <MenuButton
                          className={`p-2 rounded-lg transition-colors`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </MenuButton>
                        <MenuItems
                          className={`absolute z-[100] ${
                            shouldOpenUpwards(index)
                              ? "bottom-full mb-2"
                              : "top-full mt-2"
                          } right-0 w-48 origin-top-right rounded-lg shadow-lg ring-1 ring-primary-500 focus:outline-none
                            ${
                              theme === "dark"
                                ? "bg-neutral-800 ring-neutral-700"
                                : "bg-white"
                            }
                            z-50`}
                        >
                          <div className="p-1">
                            <MenuItem>
                              {({ active }) => (
                                <button
                                  onClick={() => onEdit(campaign)}
                                  className={`flex w-full items-center gap-2 px-3 py-2 rounded-lg text-sm
                                    ${
                                      active
                                        ? theme === "dark"
                                          ? "bg-neutral-700 text-white"
                                          : "bg-gray-50 text-gray-900"
                                        : theme === "dark"
                                        ? "text-gray-300"
                                        : "text-gray-700"
                                    }
                                  `}
                                >
                                  <Edit className="w-4 h-4" />
                                  {t("campaigns.actions.edit")}
                                </button>
                              )}
                            </MenuItem>
                            <MenuItem>
                              {({ active }) => (
                                <button
                                  onClick={() => onPublish(campaign)}
                                  className={`flex w-full items-center gap-2 px-3 py-2 rounded-lg text-sm
                                    ${
                                      active
                                        ? theme === "dark"
                                          ? "bg-neutral-700 text-white"
                                          : "bg-gray-50 text-gray-900"
                                        : theme === "dark"
                                        ? "text-gray-300"
                                        : "text-gray-700"
                                    }
                                  `}
                                >
                                  <Share2 className="w-4 h-4" />
                                  {t("campaigns.actions.publishNow")}
                                </button>
                              )}
                            </MenuItem>
                            <MenuItem>
                              {({ active }) => (
                                <button
                                  onClick={() => onViewDetails(campaign)}
                                  className={`flex w-full items-center gap-2 px-3 py-2 rounded-lg text-sm
                                    ${
                                      active
                                        ? theme === "dark"
                                          ? "bg-neutral-700 text-white"
                                          : "bg-gray-50 text-gray-900"
                                        : theme === "dark"
                                        ? "text-gray-300"
                                        : "text-gray-700"
                                    }
                                  `}
                                >
                                  <Eye className="w-4 h-4" />
                                  {t("campaigns.actions.viewDetails")}
                                </button>
                              )}
                            </MenuItem>
                            <div className="my-1 border-t border-gray-100 dark:border-neutral-700" />
                            <MenuItem>
                              {({ active }) => (
                                <button
                                  onClick={() => onDelete(campaign.id)}
                                  className={`flex w-full items-center gap-2 px-3 py-2 rounded-lg text-sm text-primary-600
                                    ${
                                      active
                                        ? theme === "dark"
                                          ? "bg-primary-900/20"
                                          : "bg-primary-50"
                                        : ""
                                    }
                                  `}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  {t("campaigns.actions.delete")}
                                </button>
                              )}
                            </MenuItem>
                          </div>
                        </MenuItems>
                      </Menu>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center mb-4
                      ${
                        theme === "dark"
                          ? "bg-neutral-800 text-gray-600"
                          : "bg-gray-100 text-gray-400"
                      }
                    `}
                    >
                      <Search className="w-8 h-8" />
                    </div>
                    <h3
                      className={`text-lg font-medium ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      No campaigns found
                    </h3>
                    <p
                      className={`text-sm mt-1 max-w-xs mx-auto ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Try adjusting your search or filters to find what you're
                      looking for.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredCampaigns.length > 0 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-neutral-700">
          <div
            className={`text-sm ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
            <span className="font-medium">
              {Math.min(endIndex, filteredCampaigns.length)}
            </span>{" "}
            of <span className="font-medium">{filteredCampaigns.length}</span>{" "}
            campaigns
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                ${
                  theme === "dark"
                    ? "bg-neutral-700 hover:bg-neutral-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }
              `}
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => {
                  const showPage =
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1);

                  if (!showPage) {
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <span
                          key={page}
                          className={`px-2 ${
                            theme === "dark" ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${
                        currentPage === page
                          ? "bg-primary-500 text-white"
                          : theme === "dark"
                          ? "bg-neutral-700 hover:bg-neutral-600 text-white"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      }
                    `}
                    >
                      {page}
                    </button>
                  );
                }
              )}
            </div>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                ${
                  theme === "dark"
                    ? "bg-neutral-700 hover:bg-neutral-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }
              `}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
