import type { JsonImportResult } from '@/types/jsonImport.types';
import axios from 'axios';

export const jsonImportService = {
  import: (file: File): Promise<JsonImportResult> => {
    const formData = new FormData();
    formData.append('file', file);

    return axios
      .post<JsonImportResult>('/api/v1/json/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  downloadTemplate: (): Promise<Blob> =>
    axios
      .get<Blob>('/api/v1/json/template', { responseType: 'blob' })
      .then((r) => r.data),
};
