import { useTheme } from "@/Hooks/useTheme";
import { Campaign } from "@/types/Campaign";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import ContentCard from "./ContentCard";

type CampaignListProps = {
  campaigns: Campaign[];
  onEdit: (campaign: Campaign) => void;
  onDelete: (campaignId: number) => void;
  onAdd: () => void;
  isLoading: boolean;
};

export default function CampaignList({
  campaigns,
  onEdit,
  onDelete,
  onAdd,
  isLoading,
}: CampaignListProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [search, setSearch] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(3);

  const filteredCampaigns = campaigns.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);

  const currentItems = filteredCampaigns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goNext = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);
  const goPrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  const useTableView = filteredCampaigns.length > itemsPerPage * 2;

  return (
    <div
      className={`rounded-xl p-6 
        ${theme === "dark" ? "bg-neutral-800/50" : "bg-white/60"}
        shadow-md border 
        ${theme === "dark" ? "border-neutral-700/50" : "border-gray-100"}
      `}
    >
      <h2
        className={`font-bold text-3xl text-center py-6 lg:text-left
          ${theme === "dark" ? "text-white" : "text-gray-800"}`}
      >
        {t("manageContent.campaigns.yourContent")}
      </h2>
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-10 gap-4">
        <div
          className="flex 
            flex-col sm:flex-row 
            gap-4 
            items-center 
            justify-center"
        >
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-lg w-48
              ${
                theme === "dark"
                  ? "bg-neutral-700 text-gray-200 placeholder-gray-400 border border-neutral-600"
                  : "bg-white text-gray-700 placeholder-gray-500 border border-gray-300"
              }`}
            placeholder={t("common.search")}
          />

          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className={`px-6 py-2 rounded-lg
              ${
                theme === "dark"
                  ? "bg-neutral-700 text-gray-200 border border-neutral-600"
                  : "bg-white text-gray-700 border border-gray-300"
              }`}
          >
            <option value={3}>3 {t("common.perPage")}</option>
            <option value={6}>6 {t("common.perPage")}</option>
            <option value={12}>12 {t("common.perPage")}</option>
            <option value={25}>25 {t("common.perPage")}</option>
            <option value={50}>50 {t("common.perPage")}</option>
          </select>
        </div>
      </div>

      {filteredCampaigns.length > 0 && (
        <p
          className={`text-sm mb-4 text-center lg:text-left ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {t("common.showing")} <strong>{currentItems.length}</strong>{" "}
          {t("common.of")} <strong>{filteredCampaigns.length}</strong>{" "}
          {t("common.results")}
        </p>
      )}

      {useTableView ? (
        <div className="overflow-x-auto">
          <table
            className={`w-full rounded-lg overflow-hidden ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          >
            <thead
              className={`${
                theme === "dark" ? "bg-neutral-700" : "bg-gray-200"
              }`}
            >
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">
                  {t("manageContent.campaigns.title")}
                </th>
                <th className="px-4 py-3 text-center">{t("common.actions")}</th>
              </tr>
            </thead>

            <tbody>
              {currentItems.map((c) => (
                <tr
                  key={c.id}
                  className={`border-b  ${
                    theme === "dark" ? "border-neutral-700" : "border-gray-200"
                  }`}
                >
                  <td className="px-4 py-3">{c.id}</td>
                  <td className="px-4 py-3">{c.title}</td>
                  <td
                    className="px-4 py-3 text-center
                        "
                  >
                    <button
                      className="text-blue-500 mx-2"
                      onClick={() => onEdit(c)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-500 mx-2"
                      onClick={() => onDelete(c.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentItems.map((campaign) => (
            <ContentCard
              key={campaign.id}
              content={campaign}
              onEdit={() => onEdit(campaign)}
              onDelete={() => onDelete(campaign.id)}
            />
          ))}

          <div
            className={`flex items-center justify-center p-6 rounded-lg transition-all duration-300 cursor-pointer hover:shadow-lg
              ${
                theme === "dark"
                  ? "bg-neutral-700/30 hover:bg-neutral-700/50 border border-neutral-600"
                  : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
              }`}
            onClick={onAdd}
          >
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2
                ${
                  theme === "dark"
                    ? "bg-gradient-to-r from-orange-600 to-orange-800"
                    : "bg-gradient-to-r from-orange-600 to-orange-700"
                }`}
              >
                <Plus className="w-5 h-5 text-white" />
              </div>
              <span
                className={`text-sm font-semibold ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {t("manageContent.campaigns.addNew")}
              </span>
            </div>
          </div>
        </div>
      )}

      {filteredCampaigns.length === 0 && (
        <div className="text-center py-12">
          <p
            className={`text-gray-500 ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {t("common.noResults")}...
          </p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-10 gap-4">
          <button
            disabled={currentPage === 1}
            onClick={goPrev}
            className={`px-4 py-2 rounded-lg ${
              theme === "dark"
                ? "bg-neutral-700 text-gray-300"
                : "bg-gray-200 text-gray-700"
            } disabled:opacity-40`}
          >
            {t("common.previous")}
          </button>

          <span
            className={`p-2 rounded-lg ${
              theme === "dark"
                ? "bg-neutral-700 text-gray-300"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {currentPage} / {totalPages}
          </span>

          <button
            disabled={currentPage === totalPages}
            onClick={goNext}
            className={`px-4 py-2 rounded-lg ${
              theme === "dark"
                ? "bg-neutral-700 text-gray-300"
                : "bg-gray-200 text-gray-700"
            } disabled:opacity-40`}
          >
            {t("common.next")}
          </button>
        </div>
      )}
    </div>
  );
}
