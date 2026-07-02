export interface JsonImportItemError {
  path: string;
  errors: string[];
}

export interface JsonImportData {
  success_count: number;
  failed_count: number;
  total: number;
  publication_ids: number[];
  campaign_ids: number[];
}

export interface JsonImportResult {
  success: boolean;
  message: string;
  data?: JsonImportData;
  errors?: JsonImportItemError[];
}
