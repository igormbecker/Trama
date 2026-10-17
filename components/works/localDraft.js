const databaseName = "trama-drafts";

async function connect() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("drafts");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error("Local drafts are unavailable."));
  });
}

export async function localDraft(action, key, value) {
  const database = await connect();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(
        "drafts",
        action === "read" ? "readonly" : "readwrite",
      );
      const store = transaction.objectStore("drafts");
      const request =
        action === "read"
          ? store.get(key)
          : action === "write"
            ? store.put(value, key)
            : store.delete(key);
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
}
