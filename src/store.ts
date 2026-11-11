import type { Entity, AnyUser, Job, Application } from "./types";

// Generic in-memory repository
export class Store<T extends Entity> {
  private items = new Map<string, T>();

  create(data: Omit<T, keyof Entity>): T {
    const item = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() } as T;
    this.items.set(item.id, item);
    return item;
  }
  get(id: string): T | undefined {
    return this.items.get(id);
  }
  all(): T[] {
    return [...this.items.values()];
  }
  find(pred: (item: T) => boolean): T[] {
    return this.all().filter(pred);
  }
  update(id: string, patch: Partial<T>): T | undefined {
    const item = this.items.get(id);
    if (!item) return undefined;
    const updated = { ...item, ...patch, id: item.id };
    this.items.set(id, updated);
    return updated;
  }
  delete(id: string): boolean {
    return this.items.delete(id);
  }
}

export const db = {
  users: new Store<AnyUser>(),
  jobs: new Store<Job>(),
  applications: new Store<Application>(),
};
