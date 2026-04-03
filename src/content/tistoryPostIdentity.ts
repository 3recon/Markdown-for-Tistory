import type { PostIdentity, PostKind } from '../shared/types/post';

const EDITOR_PATH_HINTS = ['/manage', '/post/write', '/category', '/newpost'];
const QUERY_ID_KEYS = ['postId', 'postNo', 'id'];
const DOM_ID_SELECTORS = [
  'input[name="postId"]',
  'input[name="postNo"]',
  'input[name="articleId"]',
  'meta[name="post-id"]',
  '[data-post-id]'
];

const getPathId = (pathname: string): string | null => {
  const match = pathname.match(/\/(\d+)(?:\/)?$/);
  return match?.[1] ?? null;
};

const getQueryId = (location: Location): string | null => {
  const params = new URLSearchParams(location.search);

  for (const key of QUERY_ID_KEYS) {
    const value = params.get(key);
    if (value) {
      return value;
    }
  }

  return null;
};

const getDomId = (documentRef: Document): string | null => {
  for (const selector of DOM_ID_SELECTORS) {
    const element = documentRef.querySelector(selector);

    if (!element) {
      continue;
    }

    if (element instanceof HTMLInputElement && element.value) {
      return element.value;
    }

    const attrValue = element.getAttribute('content') ?? element.getAttribute('data-post-id');
    if (attrValue) {
      return attrValue;
    }
  }

  return null;
};

const inferPostKind = (postId: string | null): PostKind => {
  return postId ? 'post' : 'draft';
};

export const isLikelyTistoryEditorPage = (location: Location): boolean => {
  const normalizedPath = location.pathname.toLowerCase();
  return EDITOR_PATH_HINTS.some((hint) => normalizedPath.includes(hint));
};

export const detectCurrentPostIdentity = (
  location: Location,
  documentRef: Document
): PostIdentity | null => {
  if (!isLikelyTistoryEditorPage(location)) {
    return null;
  }

  const postId = getQueryId(location) ?? getPathId(location.pathname) ?? getDomId(documentRef);
  const kind = inferPostKind(postId);
  const origin = location.origin.toLowerCase();
  const editorPath = location.pathname.toLowerCase();
  const fallbackId = postId ?? `${editorPath}${location.search}`;
  const normalizedId = fallbackId.replace(/[^a-z0-9:/?&=_-]+/gi, '-');
  const storageKey = `${origin}:${kind}:${normalizedId}`;

  return {
    kind,
    origin,
    pathname: location.pathname,
    postId,
    storageKey
  };
};
