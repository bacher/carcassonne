import { LOCAL_STORAGE_PREFIX } from '../data/const';

export function saveData<T>(key: string, revision: number, data: T) {
  const json = JSON.stringify({ revision, data });

  window.localStorage.setItem(`${LOCAL_STORAGE_PREFIX}.${key}`, json);
}

export function loadData<T>(key: string, revision: number): T | undefined {
  const json = window.localStorage.getItem(`${LOCAL_STORAGE_PREFIX}.${key}`);

  if (!json) {
    return undefined;
  }

  const item = JSON.parse(json);

  if (item.revision !== revision) {
    return undefined;
  }

  return item.data as T;
}
