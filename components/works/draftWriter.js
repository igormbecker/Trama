export function createDraftWriter({ revision, save }) {
  let document;
  let generation = 0;
  let savedGeneration = 0;
  let saving = false;
  return {
    change(nextDocument) {
      document = nextDocument;
      generation += 1;
    },
    pending() {
      return generation !== savedGeneration;
    },
    revision() {
      return revision;
    },
    async flush() {
      if (saving || generation === savedGeneration) return;
      saving = true;
      const sentGeneration = generation;
      try {
        const result = await save(document, revision);
        revision = result.revision;
        savedGeneration = sentGeneration;
        return result;
      } finally {
        saving = false;
      }
    },
  };
}
