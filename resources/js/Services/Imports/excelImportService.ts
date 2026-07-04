import axios from 'axios';

export const excelImportService = {
  downloadTemplate: (type: string): Promise<Blob> =>
    axios
      .get(`/api/v1/excel/templates/${type}`, { responseType: 'blob' })
      .then((r) => r.data),

  import: <TResult = unknown>(type: string, file: File): Promise<TResult> => {
    const formData = new FormData();
    formData.append('file', file);
    return axios
      .post(`/api/v1/excel/import/${type}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
};
