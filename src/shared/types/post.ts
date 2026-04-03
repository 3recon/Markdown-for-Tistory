export type PostKind = 'draft' | 'post';
export type PostIdentitySource = 'query' | 'path' | 'dom' | 'fallback';

export interface PostIdentity {
  kind: PostKind;
  origin: string;
  pathname: string;
  postId: string | null;
  source: PostIdentitySource;
  editorContextKey: string;
  storageKey: string;
}

export interface StoredPostSource {
  storageKey: string;
  postId: string | null;
  origin: string;
  pathname: string;
  kind: PostKind;
  source: PostIdentitySource;
  editorContextKey: string;
  aliases: string[];
  markdown: string;
  createdAt: string;
  lastUpdatedAt: string;
}
