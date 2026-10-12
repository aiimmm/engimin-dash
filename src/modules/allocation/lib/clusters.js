/**
 * List of registered Cluster IDs (1 to 1000) for Allocation Work Order filter.
 */
export const REGISTERED_CLUSTERS = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  name: `Cluster ${i + 1}`,
}));
