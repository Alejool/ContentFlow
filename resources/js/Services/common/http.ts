/**
 * Shared axios params serializer for Laravel-style array params (`key[]=a&key[]=b`).
 */
export const arrayParamsSerializer = {
  indexes: null as null,
  serialize: (params: Record<string, unknown>) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(`${key}[]`, String(v)));
      } else if (value !== null && value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    return searchParams.toString();
  },
};
