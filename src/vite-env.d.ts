/// <reference types="vite/client" />

interface WorkerConstructor {
  new (scriptURL: URL | string, options?: WorkerOptions): Worker;
}