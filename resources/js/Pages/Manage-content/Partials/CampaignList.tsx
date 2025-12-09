import ModernDatePicker from "@/Components/ui/ModernDatePicker";
import { useTheme } from "@/Hooks/useTheme";
import { Campaign } from "@/types/Campaign";
import { Publication } from "@/types/Publication";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  File,
  Filter,
  Layers,
  Plus,
  Rocket,
  Search,
  Trash2,
} from "lucide-react";
import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";

type CampaignListProps = {
  items: (Campaign | Publication)[];
  mode: "campaigns" | "publications";
  onEdit: (item: any) => void;
  onDelete: (itemId: number) => void;
  onAdd: () => void;
  onPublish: (item: any) => void;
  onViewDetails: (item: any) => void;
  isLoading: boolean;
  onFilterChange?: (filters: any) => void;
};

export default function CampaignList({
  items,
  mode,
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
  const [platformFilter, setPlatformFilter] = useState("all"); // For publications
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCampaigns, setExpandedCampaigns] = useState<number[]>([]);

  const itemsPerPage = 10;

  // Filter Logic
  const filteredItems = items.filter((item) => {
    const searchLower = search.toLowerCase();
    // Handle both Campaign (name) and Publication (title)
    const title = (
      (item as Campaign).name ||
      (item as Publication).title ||
      ""
    ).toLowerCase();
    const description = (item.description || "").toLowerCase();
    const searchMatch =
      title.includes(searchLower) || description.includes(searchLower);

    // TODO: Add platform filtering logic if backend supports it or if we filter client-side
    // const platformMatch = platformFilter === 'all' || ...

    return searchMatch;
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  const toggleExpand = (id: number) => {
    setExpandedCampaigns((prev) =>
      prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id]
    );
  };

  const handleFilterChange = (key: string, value: string) => {
    if (key === "status") setStatusFilter(value);
    if (key === "platform") setPlatformFilter(value);
    if (key === "date_start") setDateStart(value);
    if (key === "date_end") setDateEnd(value);

    setCurrentPage(1); // Reset to page 1

    if (onFilterChange) {
      onFilterChange({
        status: key === "status" ? value : statusFilter,
        platform: key === "platform" ? value : platformFilter, // Ensure backend handles this
        date_start: key === "date_start" ? value : dateStart,
        date_end: key === "date_end" ? value : dateEnd,
      });
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
      case "published":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  // Helper to count media for a Publication
  const countMediaFiles = (pub: Publication) => {
    if (!pub.media_files || pub.media_files.length === 0) {
      return { images: 0, videos: 0, total: 0 };
    }
    const images = pub.media_files.filter((f) =>
      f.file_type.includes("image")
    ).length;
    const videos = pub.media_files.filter((f) =>
      f.file_type.includes("video")
    ).length;
    return { images, videos, total: pub.media_files.length };
  };

  // Helper to get thumbnail for Publication
  const getThumbnail = (pub: Publication) => {
    if (!pub.media_files || pub.media_files.length === 0) return null;
    return pub.media_files[0].file_path; // Simple check for now
  };

  return (
    <div
      className={`rounded-lg overflow-hidden shadow-lg border transition-all duration-300 backdrop-blur-lg ${
        theme === "dark"
          ? "bg-neutral-800/70 border-neutral-700/70 text-white"
          : "bg-white/70 border-gray-100/70 text-gray-900"
      }`}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-neutral-700/50">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h2
              className={`text-2xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {mode === "campaigns"
                ? t("campaigns.yourCampaigns") || "Campaign Groups"
                : t("campaigns.yourContent") || "Your Publications"}
            </h2>
            <p
              className={`text-sm mt-1 ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {mode === "campaigns"
                ? "Manage your content groups and goals"
                : "Manage your individual posts and media"}
            </p>
          </div>
          <button
            onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" />
            {mode === "campaigns"
              ? t("campaigns.addNewGroup") || "New Campaign"
              : t("campaigns.addNew") || "New Publication"}
          </button>
        </div>

        {/* Filters */}
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
              className={`pl-9 pr-4 py-2 rounded-lg w-full md:w-64 text-sm border focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                theme === "dark"
                  ? "bg-neutral-800 border-neutral-700 text-white placeholder-gray-500"
                  : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
              }`}
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
                className={`py-2 pl-3 pr-8 rounded-lg text-sm border focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer ${
                  theme === "dark"
                    ? "bg-neutral-800/70 border-neutral-700/70 text-white"
                    : "bg-white/70 border-gray-200/70 text-gray-700"
                }`}
              >
                <option value="all">{t("campaigns.filters.all")}</option>
                <option value="active">{t("campaigns.filters.active")}</option>
                <option value="draft">{t("campaigns.filters.draft")}</option>
                {mode === "campaigns" && (
                  <option value="completed">
                    {t("campaigns.filters.completed")}
                  </option>
                )}
              </select>
            </div>

            {mode === "publications" && (
              <div className="flex items-center gap-2">
                <select
                  value={platformFilter}
                  onChange={(e) =>
                    handleFilterChange("platform", e.target.value)
                  }
                  className={`py-2 pl-3 pr-8 rounded-lg text-sm border focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer ${
                    theme === "dark"
                      ? "bg-neutral-800/70 border-neutral-700/70 text-white"
                      : "bg-white/70 border-gray-200/70 text-gray-700"
                  }`}
                >
                  <option value="all">All Platforms</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="twitter">Twitter</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="tiktok">TikTok</option>
                </select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="w-32">
                <ModernDatePicker
                  selected={dateStart ? new Date(dateStart) : null}
                  onChange={(d) =>
                    handleFilterChange(
                      "date_start",
                      d ? format(d, "yyyy-MM-dd") : ""
                    )
                  }
                  placeholder="Start"
                  withPortal
                />
              </div>
              <span className="text-gray-400">-</span>
              <div className="w-32">
                <ModernDatePicker
                  selected={dateEnd ? new Date(dateEnd) : null}
                  onChange={(d) =>
                    handleFilterChange(
                      "date_end",
                      d ? format(d, "yyyy-MM-dd") : ""
                    )
                  }
                  placeholder="End"
                  withPortal
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse z-0">
          <thead
            className={`${
              theme === "dark"
                ? "bg-neutral-800/90 border-neutral-700"
                : "bg-gray-50/90 border-gray-100"
            }`}
          >
            <tr
              className={`text-xs uppercase tracking-wider border-b ${
                theme === "dark"
                  ? "bg-neutral-800/50 border-neutral-700"
                  : "bg-gray-50 border-gray-100"
              }`}
            >
              <th className="px-6 py-4 font-semibold w-8"></th>
              <th className="px-6 py-4 font-semibold">{t("common.name")}</th>
              <th className="px-6 py-4 font-semibold">
                {t("campaigns.headers.status")}
              </th>
              <th className="px-6 py-4 font-semibold">
                {mode === "campaigns" ? "Publications" : "Media"}
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
            {currentItems.length > 0 ? (
              currentItems.map((item, index) => (
                <Fragment key={item.id}>
                  <tr
                    className={`group transition-colors ${
                      theme === "dark"
                        ? "hover:bg-neutral-700/30"
                        : "hover:bg-gray-50/50"
                    } ${
                      expandedCampaigns.includes(item.id)
                        ? theme === "dark"
                          ? "bg-neutral-800"
                          : "bg-gray-50"
                        : ""
                    }`}
                  >
                    <td className="px-2 py-4 text-center">
                      {mode === "campaigns" && (
                        <button
                          onClick={() => toggleExpand(item.id)}
                          className={`p-1 rounded-full transition-colors ${
                            theme === "dark"
                              ? "hover:bg-white/10"
                              : "hover:bg-black/5"
                          }`}
                        >
                          {expandedCampaigns.includes(item.id) ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {/* Icon/Thumbnail */}
                        <div
                          className={`w-12 h-12 rounded-lg flex-shrink-0 border overflow-hidden flex items-center justify-center ${
                            theme === "dark"
                              ? "border-neutral-700 bg-neutral-800"
                              : "border-gray-200 bg-gray-100"
                          }`}
                        >
                          {mode === "campaigns" ? (
                            <Layers className="w-6 h-6 text-gray-400" />
                          ) : getThumbnail(item as Publication) ? (
                            <img
                              src={getThumbnail(item as Publication)!}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <File className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h3
                            className={`font-medium text-sm ${
                              theme === "dark" ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {mode === "campaigns"
                              ? (item as Campaign).name
                              : (item as Publication).title || "Untitled"}
                          </h3>
                          <p
                            className={`text-xs mt-0.5 line-clamp-1 ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                          >
                            {(item as Campaign).description || "No description"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(
                          item.status
                        )}`}
                      >
                        {item.status || "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {mode === "campaigns" ? (
                        <span>
                          {(item as Campaign).publications_count ||
                            (item as Campaign).publications?.length ||
                            0}{" "}
                          items
                        </span>
                      ) : (
                        <span>
                          {(item as Publication).media_files?.length || 0} files
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {mode === "publications" && (
                          <button
                            onClick={() => onPublish(item)}
                            className="p-2 text-green-500 hover:bg-green-50 rounded-lg dark:hover:bg-green-900/20"
                            title={t("campaigns.actions.publish") || "Publish"}
                          >
                            <Rocket className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onEdit(item)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg dark:hover:bg-blue-900/20"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Nested Publications for Campaigns */}
                  {mode === "campaigns" &&
                    expandedCampaigns.includes(item.id) && (
                      <tr>
                        <td
                          colSpan={5}
                          className={`px-0 ${
                            theme === "dark"
                              ? "bg-neutral-900/30"
                              : "bg-gray-50/50"
                          }`}
                        >
                          <div className="px-12 py-4">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 pl-2 border-l-2 border-primary-500">
                              Associated Publications
                            </div>
                            {(item as Campaign).publications &&
                            (item as Campaign).publications!.length > 0 ? (
                              <div className="grid grid-cols-1 gap-2">
                                {(item as Campaign).publications!.map((pub) => (
                                  <div
                                    key={pub.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border ml-2 ${
                                      theme === "dark"
                                        ? "bg-neutral-800 border-neutral-700"
                                        : "bg-white border-gray-200"
                                    }`}
                                  >
                                    {/* Pub Thumbnail */}
                                    <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                                      {pub.media_files?.[0] ? (
                                        <img
                                          src={pub.media_files[0].file_path}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <File className="w-4 h-4 text-gray-400" />
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <div
                                        className={`text-sm font-medium ${
                                          theme === "dark"
                                            ? "text-gray-200"
                                            : "text-gray-800"
                                        }`}
                                      >
                                        {pub.title}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {format(
                                          new Date(pub.created_at),
                                          "MMM d, yyyy"
                                        )}
                                      </div>
                                    </div>
                                    <div
                                      className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                                        pub.status
                                      )}`}
                                    >
                                      {pub.status}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 italic ml-4">
                                No publications attached.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                </Fragment>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No {mode} found.{" "}
                  {mode === "campaigns"
                    ? "Create a group to organize your content."
                    : "Start creating content!"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
