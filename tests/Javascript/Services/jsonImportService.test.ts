import { jsonImportService } from '@/Services/Imports/jsonImportService';
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('axios');

const mockedAxios = vi.mocked(axios);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('jsonImportService.import', () => {
  it('POST /api/v1/json/import with the file as multipart form data', async () => {
    const apiResponse = {
      success: true,
      message: 'Importación completada',
      data: {
        success_count: 2,
        failed_count: 0,
        total: 2,
        publication_ids: [1, 2],
        campaign_ids: [],
      },
    };
    mockedAxios.post = vi.fn().mockResolvedValue({ data: apiResponse });

    const file = new File(['{"publications":[]}'], 'import.json', { type: 'application/json' });
    const result = await jsonImportService.import(file);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      '/api/v1/json/import',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );

    const formData = (mockedAxios.post as ReturnType<typeof vi.fn>).mock.calls[0][1] as FormData;
    expect(formData.get('file')).toBe(file);
    expect(result).toEqual(apiResponse);
  });

  it('propagates request errors', async () => {
    mockedAxios.post = vi.fn().mockRejectedValue(new Error('Network Error'));

    const file = new File(['{}'], 'import.json', { type: 'application/json' });
    await expect(jsonImportService.import(file)).rejects.toThrow('Network Error');
  });
});

describe('jsonImportService.downloadTemplate', () => {
  it('GET /api/v1/json/template as blob', async () => {
    const blob = new Blob(['{}'], { type: 'application/json' });
    mockedAxios.get = vi.fn().mockResolvedValue({ data: blob });

    const result = await jsonImportService.downloadTemplate();

    expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/json/template', {
      responseType: 'blob',
    });
    expect(result).toBe(blob);
  });
});
