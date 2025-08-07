class SimpleContainer {
  constructor() {
    this.instances = new Map();
    this.factories = new Map();
    this.singletons = new Set();
  }

  registerInstance(key, instance) {
    this.instances.set(key, instance);
  }

  registerFactory(key, factory, singleton = false) {
    this.factories.set(key, factory);
    if (singleton) {
      this.singletons.add(key);
    }
  }

  registerClass(key, constructor, singleton = false) {
    this.registerFactory(key, () => new constructor(), singleton);
  }

  resolve(key) {
    // Check if we have a direct instance
    if (this.instances.has(key)) {
      return this.instances.get(key);
    }

    // Check if we have a factory
    if (this.factories.has(key)) {
      const factory = this.factories.get(key);

      // For singletons, create once and store
      if (this.singletons.has(key)) {
        if (!this.instances.has(key)) {
          const instance = factory();
          this.instances.set(key, instance);
        }
        return this.instances.get(key);
      }

      // For non-singletons, create new instance each time
      return factory();
    }

    throw new Error(`No registration found for key: ${key}`);
  }

  has(key) {
    return this.instances.has(key) || this.factories.has(key);
  }

  clear() {
    this.instances.clear();
    this.factories.clear();
    this.singletons.clear();
  }

  clearInstances() {
    for (const key of this.singletons) {
      if (this.instances.has(key) && this.factories.has(key)) {
        this.instances.delete(key);
      }
    }
  }
}

const container = new SimpleContainer();

module.exports = { SimpleContainer, container };
