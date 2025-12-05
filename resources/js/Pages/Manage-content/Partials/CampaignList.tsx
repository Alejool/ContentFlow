import { useTheme } from "@/Hooks/useTheme";
import { Campaign } from "@/types/Campaign";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  Calendar,
  Edit,
  Eye,
  Filter,
  MoreVertical,
  Plus,
  Search,
  Share2,
  Trash2,
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
  const itemsPerPage = 5;

  // Filter campaigns locally by search
  const filteredCampaigns = campaigns.filter(
    (campaign) =>
      campaign.title.toLowerCase().includes(search.toLowerCase()) ||
      campaign.description.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate pagination
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

  const shouldOpenUpwards = (index: number) => {
    const totalItems = currentCampaigns.length;
    if (totalItems < 2) {
      return false;
    }
    return index >= totalItems - 2;
  };

  return (
    <div
      className={`rounded-lg overflow-hidden shadow-lg border transition-all duration-300
        ${
          theme === "dark"
            ? "bg-neutral-800/50 border-neutral-700/50"
            : "bg-white border-gray-100"
        }
      `}
    >
      {/* Header & Actions */}
      <div className="p-6 border-b border-gray-100 dark:border-neutral-700/50">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h2
              className={`text-2xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {t("manageContent.campaigns.yourContent")}
            </h2>
            <p
              className={`text-sm mt-1 ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Manage, track and analyze your social media campaigns
            </p>
          </div>
          <button
            onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" />
            {t("manageContent.campaigns.addNew")}
          </button>
        </div>

        {/* Filters Toolbar */}
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
              className={`pl-9 pr-4 py-2 rounded-lg w-full md:w-64 text-sm border focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all
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
                className={`py-2 pl-3 pr-8 rounded-lg text-sm border focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer
                  ${
                    theme === "dark"
                      ? "bg-neutral-800 border-neutral-700 text-white"
                      : "bg-white border-gray-200 text-gray-700"
                  }
                `}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Calendar
                className={`w-4 h-4 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              />
              <input
                type="date"
                value={dateStart}
                onChange={(e) =>
                  handleFilterChange("date_start", e.target.value)
                }
                className={`py-2 px-3 rounded-lg text-sm border focus:ring-2 focus:ring-orange-500 focus:border-transparent
                  ${
                    theme === "dark"
                      ? "bg-neutral-800 border-neutral-700 text-white"
                      : "bg-white border-gray-200 text-gray-700"
                  }
                `}
              />
              <span
                className={theme === "dark" ? "text-gray-500" : "text-gray-400"}
              >
                -
              </span>
              <input
                type="date"
                value={dateEnd}
                onChange={(e) => handleFilterChange("date_end", e.target.value)}
                className={`py-2 px-3 rounded-lg text-sm border focus:ring-2 focus:ring-orange-500 focus:border-transparent
                  ${
                    theme === "dark"
                      ? "bg-neutral-800 border-neutral-700 text-white"
                      : "bg-white border-gray-200 text-gray-700"
                  }
                `}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr
              className={`text-xs uppercase tracking-wider border-b
                ${
                  theme === "dark"
                    ? "bg-neutral-800/50 text-gray-400 border-neutral-700"
                    : "bg-gray-50 text-gray-500 border-gray-100"
                }
              `}
            >
              <th className="px-6 py-4 font-semibold">Campaign</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Duration</th>
              <th className="px-6 py-4 font-semibold text-center">Platforms</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody
            className={`divide-y ${
              theme === "dark" ? "divide-neutral-700/50" : "divide-gray-100"
            }`}
          >
            {currentCampaigns.length > 0 ? (
              currentCampaigns.map((campaign, index) => (
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
                        className={`w-12 h-12 rounded-lg flex-shrink-0 bg-cover bg-center border
                          ${
                            theme === "dark"
                              ? "border-neutral-700 bg-neutral-800"
                              : "border-gray-200 bg-gray-100"
                          }
                        `}
                        style={{
                          backgroundImage: campaign.image
                            ? `url(${campaign.image})`
                            : "none",
                        }}
                      >
                        {!campaign.image && (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                            No Img
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
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
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
                        Start: {campaign.start_date || "Not set"}
                      </span>
                      <span
                        className={
                          theme === "dark" ? "text-gray-500" : "text-gray-400"
                        }
                      >
                        End: {campaign.end_date || "Not set"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`text-xs ${
                        theme === "dark" ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      -
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <Menu as="div" className="relative inline-block text-left">
                      <MenuButton
                        className={`p-2 rounded-lg transition-colors
                          ${
                            theme === "dark"
                              ? "hover:bg-neutral-700 text-gray-400"
                              : "hover:bg-gray-100 text-gray-500"
                          }
                        `}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </MenuButton>

                      {/* Menú que se abre hacia arriba para los últimos elementos */}
                      <MenuItems
                        className={`absolute ${
                          shouldOpenUpwards(index)
                            ? "bottom-full mb-2"
                            : "top-full mt-2"
                        } right-0 w-48 origin-top-right rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50
                          ${
                            theme === "dark"
                              ? "bg-neutral-800 ring-neutral-700"
                              : "bg-white"
                          }
                        `}
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
                                Edit
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
                                Publish Now
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
                                View Details
                              </button>
                            )}
                          </MenuItem>
                          <div className="my-1 border-t border-gray-100 dark:border-neutral-700" />
                          <MenuItem>
                            {({ active }) => (
                              <button
                                onClick={() => onDelete(campaign.id)}
                                className={`flex w-full items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600
                                  ${
                                    active
                                      ? theme === "dark"
                                        ? "bg-red-900/20"
                                        : "bg-red-50"
                                      : ""
                                  }
                                `}
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            )}
                          </MenuItem>
                        </div>
                      </MenuItems>
                    </Menu>
                  </td>
                </tr>
              ))
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

      {/* Pagination Controls */}
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
                  // Show first page, last page, current page, and pages around current
                  const showPage =
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1);

                  if (!showPage) {
                    // Show ellipsis
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
                          ? "bg-orange-500 text-white"
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
