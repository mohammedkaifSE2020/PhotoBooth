import { useNavigate, useSearchParams } from 'react-router-dom';
import ShareExport from '@/components/Export/ShareExport';

export default function ShareExportPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get photoId and photoPath from search params
  const photoId = searchParams.get('id') || '';
  const photoPath = searchParams.get('path') || '';

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <ShareExport
      photoId={photoId}
      photoPath={photoPath}
      onClose={handleClose}
    />
  );
}
