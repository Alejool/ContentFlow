interface TableHeaderProps {
  mode: "campaigns" | "publications";
  t: (key: string) => string;
}

export function TableHeader({ mode, t }: TableHeaderProps) {
  if (mode === "campaigns") {
    return (
      <>
        <th className="px-6 py-4 font-semibold w-8"></th>
        <th className="px-6 py-4 font-semibold">{t("campaigns.table.name")}</th>
        <th className="px-6 py-4 font-semibold">
          {t("campaigns.table.status")}
        </th>
        <th className="px-6 py-4 font-semibold">
          {t("campaigns.table.publications")}
        </th>
        <th className="px-6 py-4 font-semibold text-right">
          {t("campaigns.table.actions")}
        </th>
      </>
    );
  }

  return (
    <>
      <th className="px-6 py-4 font-semibold w-8"></th>
      <th className="px-6 py-4 font-semibold">{t("publications.table.name")}</th>
      <th className="px-6 py-4 font-semibold">{t("publications.table.status")}</th>
      <th className="px-6 py-4 font-semibold">{t("publications.table.media")}</th>
      <th className="px-6 py-4 font-semibold">
        {t("publications.table.campaign")}
      </th>
      <th className="px-6 py-4 font-semibold">
        {t("publications.table.linkedAccount")}
      </th>
      <th className="px-6 py-4 font-semibold text-right">
        {t("publications.table.actions")}
      </th>
    </>
  );
}
