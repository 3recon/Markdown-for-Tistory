export type PostKind = 'draft' | 'post';

export interface PostIdentity {
  kind: PostKind;
  origin: string;
  pathname: string;
  postId: string | null;
  storageKey: string;
}

export interface StoredPostSource {
  storageKey: string;
  postId: string | null;
  origin: string;
  pathname: string;
  markdown: string;
  lastUpdatedAt: string;
}
