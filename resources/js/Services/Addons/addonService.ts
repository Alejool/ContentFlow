import type { AddonsSummaryData } from '@/types/Addons/addon';
import axios from 'axios';

export const addonService = {
  getSummary: (): Promise<AddonsSummaryData> =>
    axios.get<AddonsSummaryData>('/api/v1/addons/summary').then((r) => r.data),
};
