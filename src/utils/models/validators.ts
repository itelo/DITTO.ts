export const arrayLimit = (limit: number) => (val: Array<any>) => {
  return val.length <= limit;
};
