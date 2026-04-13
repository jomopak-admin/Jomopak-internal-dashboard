import { AppData } from '../types';

export function buildSeedData(): AppData {
  return {
    suppliers: [],
    machines: [],
    quoteEstimates: [],
    artworkRecords: [],
    customerStockReleases: [],
    paperRates: [],
    costProfiles: [],
    pricingTiers: [],
    clients: [],
    products: [],
    jobs: [],
    finishedGoodsStock: [],
    spareParts: [],
    materialReceipts: [],
    productionLogs: [],
    wasteEntries: [],
    paperLogs: [],
    dispatchRecords: [],
    stockChangeLogs: [],
  };
}
