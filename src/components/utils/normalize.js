// utils/normalize.js
export const normalizeArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.results)) return res.results;
  return [];
};
