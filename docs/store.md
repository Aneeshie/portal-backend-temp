# Store (`src/store.ts`)

A generic in-memory repository built on a `Map`.

```ts
class Store<T extends Entity> {
  create(data: Omit<T, keyof Entity>): T  // adds id + createdAt
  get(id): T | undefined
  all(): T[]
  find(pred): T[]
  update(id, patch: Partial<T>): T | undefined  // the id can't be changed
  delete(id): boolean
}
```

- `T extends Entity` means it can store anything that has an `id` and `createdAt`.
- `create` takes `Omit<T, keyof Entity>`, so callers can't pass their own id. It's generated with `crypto.randomUUID()`.

## Instances

```ts
export const db = {
  users: new Store<AnyUser>(),          // employers and candidates together
  jobs: new Store<Job>(),
  applications: new Store<Application>(),
};
```

Employers and candidates share one store and are told apart by `role`. The same email can be registered once per role.

## Swapping in a real database

Every route goes through `db.*`, so moving to a database (Postgres, Mongo and so on) only means writing a class with the same methods. The routes don't need to change. Note that the methods would become async.
