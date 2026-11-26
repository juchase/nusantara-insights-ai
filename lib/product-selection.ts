const STORAGE_KEY = "nusantara-insight:selected-product";
const CHANGE_EVENT = "nusantara-insight:product-selection-changed";

export function getSelectedProductId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setSelectedProductId(productId: string): void {
  if (typeof window === "undefined" || !productId) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, productId);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: productId }));
  } catch {
    // Storage can be unavailable in private browsing; page state still works.
  }
}

export function subscribeSelectedProduct(
  callback: (productId: string | null) => void,
): () => void {
  if (typeof window === "undefined") return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback(event.newValue);
  };
  const onLocalChange = (event: Event) => {
    callback((event as CustomEvent<string>).detail ?? null);
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onLocalChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onLocalChange);
  };
}
