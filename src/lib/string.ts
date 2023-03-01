export function slugify(str: string) {
  return str.toLowerCase().split(' ').join('_');
}
