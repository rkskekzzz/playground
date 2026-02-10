type SafeParser<T> = (input: unknown) => T | null;

interface ReadLocalStateArgs<T> {
  key: string;
  safeParse: SafeParser<T>;
}

interface WriteLocalStateArgs<T> {
  key: string;
  value: T;
}

export function buildScopedKey(namespace: string, scope?: string): string {
  return scope ? `${namespace}:${scope}` : namespace;
}

export function readLocalState<T>({
  key,
  safeParse,
}: ReadLocalStateArgs<T>): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as unknown;
    return safeParse(parsedValue);
  } catch (error) {
    console.error(`Failed to read localStorage key: ${key}`, error);
    return null;
  }
}

export function writeLocalState<T>({
  key,
  value,
}: WriteLocalStateArgs<T>): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to write localStorage key: ${key}`, error);
  }
}

export function removeLocalState(key: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove localStorage key: ${key}`, error);
  }
}
