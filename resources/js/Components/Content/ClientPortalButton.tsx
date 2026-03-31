import Button from '@/Components/common/Modern/Button';
import axios from 'axios';
import { Copy, ExternalLink, Link } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface Props {
  publicationId: number;
  status?: string;
}

export default function ClientPortalButton({ publicationId, status }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);

  // Solo tiene sentido para publicaciones pendientes de revisión o en draft
  const validStatuses = ['draft', 'pending_review', 'pending', 'scheduled'];
  if (status && !validStatuses.includes(status)) return null;

  const generateLink = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        route('api.v1.publications.portal-token', { publication: publicationId }),
      );
      const url: string = res.data.data.portal_url;
      setPortalUrl(url);
      await navigator.clipboard.writeText(url);
      toast.success(t('portal.linkCopied', 'Link copiado al portapapeles'));
    } catch {
      toast.error(t('portal.linkError', 'Error al generar el link'));
    } finally {
      setLoading(false);
    }
  };

  const copyAgain = async () => {
    if (!portalUrl) return;
    await navigator.clipboard.writeText(portalUrl);
    toast.success(t('portal.linkCopied', 'Link copiado'));
  };

  if (portalUrl) {
    return (
      <div className="flex items-center gap-2">
        <Button
          onClick={copyAgain}
          variant="secondary"
          size="md"
          icon={Copy}
          title={t('portal.copyLink', 'Copiar link del portal')}
        >
          {t('portal.copyLink', 'Copiar link')}
        </Button>
        <Button
          onClick={() => window.open(portalUrl, '_blank')}
          variant="ghost"
          buttonStyle="icon"
          size="md"
          icon={ExternalLink}
          title={t('portal.openPortal', 'Abrir portal')}
        >
          <span className="sr-only">{t('portal.openPortal', 'Abrir portal')}</span>
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={generateLink}
      disabled={loading}
      loading={loading}
      variant="secondary"
      size="md"
      icon={Link}
      title={t('portal.shareWithClient', 'Compartir con cliente')}
    >
      {t('portal.shareWithClient', 'Compartir con cliente')}
    </Button>
  );
}
