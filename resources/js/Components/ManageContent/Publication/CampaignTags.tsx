import { Publication } from "@/types/Publication";

interface CampaignTagsProps {
  publication: Publication;
  t: (key: string) => string;
}

export default function CampaignTags({
  publication,
  t,
}: CampaignTagsProps) {
  const campaigns = publication.campaigns || [];

  if (campaigns.length === 0) {
    return (
      <span
        className="text-xs italic text-gray-400 dark:text-gray-500"
      >
        {t("publications.table.noCampaign")}
      </span>
    );
  }

  const handleCampaignClick = (campaignId: number) => {
    const campaignTab = document.querySelector(
      '[data-tab="campaigns"]'
    ) as HTMLButtonElement;
    if (campaignTab) {
      campaignTab.click();
      setTimeout(() => {
        const campaignRow = document.querySelector(
          `[data-campaign-id="${campaignId}"]`
        );
        if (campaignRow) {
          campaignRow.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          const expandButton = campaignRow.querySelector(
            "button[data-expand]"
          ) as HTMLButtonElement;
          if (expandButton && !expandButton.getAttribute("data-expanded")) {
            expandButton.click();
          }
        }
      }, 100);
    }
  };

  return (
    <div className="flex flex-wrap gap-1">
      {campaigns.map((campaign) => (
        <button
          key={campaign.id}
          onClick={() => handleCampaignClick(campaign.id)}
          className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium transition-all bg-primary-100 text-primary-800 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50"
          title={`Click to view ${campaign.name || campaign.title}`}
        >
          {campaign.name || campaign.title}
        </button>
      ))}
    </div>
  );
}
