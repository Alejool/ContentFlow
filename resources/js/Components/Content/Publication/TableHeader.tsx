interface TableHeaderProps {
  mode: "campaigns" | "publications";
  t: (key: string) => string;
}

export function TableHeader({ mode, t }: TableHeaderProps) {
  if (mode === "campaigns") {
    return (
      <>
        <th className="p-4  font-semibold w-8"></th>
        <th className="p-4  font-semibold">{t("campaigns.table.name")}</th>
        <th className="p-4  font-semibold">Author</th>
        <th className="p-4  font-semibold">
          {t("campaigns.table.status")}
        </th>
        <th className="p-4  font-semibold">
          {t("campaigns.table.publications")}
        </th>
        <th className="p-4  font-semibold text-right">
          {t("campaigns.table.actions")}
        </th>
      </>
    );
  }

  return (
    <>
      <th className="p-4  font-semibold w-8"></th>
      <th className="p-4  font-semibold">
        {t("publications.table.name")}
      </th>
      <th className="p-4  font-semibold">Author</th>
      <th className="p-4  font-semibold">
        {t("publications.table.status")}
      </th>
      <th className="p-4  font-semibold">
        {t("publications.table.media")}
      </th>
      <th className="p-4  font-semibold">
        {t("publications.table.campaign")}
      </th>
      <th className="p-4  font-semibold">
        {t("publications.table.linkedAccount")}
      </th>
      <th className="p-4  font-semibold text-right">
        {t("publications.table.actions")}
      </th>
    </>
  );
}
