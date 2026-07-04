import axios from 'axios';

export interface ExportDownload {
  blob: Blob;
  historyDays?: string;
  startDate?: string;
  contentDisposition?: string;
}

export const exportService = {
  download: (endpoint: string, params: Record<string, unknown>): Promise<ExportDownload> =>
    axios.get(endpoint, { params, responseType: 'blob' }).then((r) => ({
      blob: r.data,
      historyDays: r.headers['x-export-history-days'],
      startDate: r.headers['x-export-start-date'],
      contentDisposition: r.headers['content-disposition'],
    })),
};
