import { detectCurrentPostIdentity, isLikelyTistoryEditorPage } from './tistoryPostIdentity';
import { createPostSourceRepository } from '../storage/postSourceRepository';
import { chromeLocalStorageDriver } from '../storage/storageDriver';

export const createExtensionBootstrap = () => {
  const repository = createPostSourceRepository(chromeLocalStorageDriver);

  return {
    async mount() {
      if (!isLikelyTistoryEditorPage(window.location)) {
        return;
      }

      const identity = detectCurrentPostIdentity(window.location, document);

      if (!identity) {
        console.info('[tistory-md] editor page detected but no stable post identity was found yet.');
        return;
      }

      await repository.ensurePostRecord(identity);
      console.info('[tistory-md] initialized storage for', identity.storageKey);
    }
  };
};
