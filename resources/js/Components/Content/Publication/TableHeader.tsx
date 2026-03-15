interface TableHeaderProps {
  mode: 'campaigns' | 'publications';
  t: (key: string) => string;
}

export function TableHeader({ mode, t }: TableHeaderProps) {
  if (mode === 'campaigns') {
    return (
      <>
        <th className="w-8 p-4 font-semibold"></th>
        <th className="p-4 font-semibold">{t('campaigns.table.name')}</th>
        <th className="p-4 font-semibold">Author</th>
        <th className="p-4 font-semibold">{t('campaigns.table.status')}</th>
        <th className="p-4 font-semibold">{t('campaigns.table.publications')}</th>
        <th className="p-4 text-right font-semibold">{t('campaigns.table.actions')}</th>
      </>
    );
  }

  return (
    <>
      <th className="w-8 p-4 font-semibold"></th>
      <th className="p-4 font-semibold">{t('publications.table.name')}</th>
      <th className="p-4 font-semibold">Author</th>
      <th className="p-4 font-semibold">{t('publications.table.status')}</th>
      <th className="p-4 font-semibold">{t('publications.table.media')}</th>
      <th className="p-4 font-semibold">{t('publications.table.campaign')}</th>
      <th className="p-4 font-semibold">{t('publications.table.linkedAccount')}</th>
      <th className="p-4 text-right font-semibold">{t('publications.table.actions')}</th>
    </>
  );
}
