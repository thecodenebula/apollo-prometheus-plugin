export const filterUndefined = (from: { [label: string]: string | number | undefined }) =>
  Object.fromEntries(Object.entries(from).filter(([_, o]) => o));
