import { Publication, SocialAccount } from "@/types/Publication";

interface PublishModalExampleProps {
  show: boolean;
  publication: Publication;
  socialAccounts: SocialAccount[];
  onClose: () => void;
  onPublished: (data: any) => void;
}

export default function PublishModalExample({
  show,
  publication,
  socialAccounts,
  onClose,
  onPublished,
}: PublishModalExampleProps) {
  return (
    <PublishModal
      show={show}
      publication={publication}
      socialAccounts={socialAccounts}
      onClose={onClose}
      onPublished={onPublished}
    />
  );
}
