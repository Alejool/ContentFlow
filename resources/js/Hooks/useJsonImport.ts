import { jsonImportService } from '@/Services/Imports/jsonImportService';
import type { JsonImportResult } from '@/types/jsonImport.types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useJsonImport() {
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: (file: File) => jsonImportService.import(file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['publications'] });
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  const downloadTemplate = async (): Promise<void> => {
    const blob = await jsonImportService.downloadTemplate();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_importacion.json');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return {
    importFile: importMutation.mutateAsync,
    isImporting: importMutation.isPending,
    result: (importMutation.data ?? null) as JsonImportResult | null,
    reset: importMutation.reset,
    downloadTemplate,
  };
}
