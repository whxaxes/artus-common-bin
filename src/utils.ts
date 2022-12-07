export function isInheritFrom(clz, maybeParent) {
  if (clz === maybeParent) return true;
  let curr = clz;
  while (curr) {
    if (curr === maybeParent) return true;
    curr = Object.getPrototypeOf(curr);
  }
  return false;
}
