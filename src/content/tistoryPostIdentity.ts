const EDITOR_PATH_HINTS = ['/manage', '/post/write', '/category', '/newpost'];

export const isLikelyTistoryEditorPage = (location: Location): boolean => {
  const normalizedPath = location.pathname.toLowerCase();
  return EDITOR_PATH_HINTS.some((hint) => normalizedPath.includes(hint));
};
