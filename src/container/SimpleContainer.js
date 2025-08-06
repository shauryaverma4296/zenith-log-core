/**
 * Simple dependency injection container without external dependencies
 */
export class SimpleContainer {
  constructor() {
    this.instances = new Map();
    this.factories = new Map();
    this.singletons = new Set();
  }

  /**
   * Register a singleton instance
   * @param {string} key - Registration key
   * @param {*} instance - Instance to register
   */
  registerInstance(key, instance) {
    this.instances.set(key, instance);
  }

  /**
   * Register a factory function
   * @param {string} key - Registration key
   * @param {Function} factory - Factory function
   * @param {boolean} singleton - Whether to treat as singleton
   */
  registerFactory(key, factory, singleton = false) {
    this.factories.set(key, factory);
    if (singleton) {
      this.singletons.add(key);
    }
  }

  /**
   * Register a class constructor
   * @param {string} key - Registration key
   * @param {Function} constructor - Class constructor
   * @param {boolean} singleton - Whether to treat as singleton
   */
  registerClass(key, constructor, singleton = false) {
    this.registerFactory(key, () => new constructor(), singleton);
  }

  /**
   * Resolve a dependency
   * @param {string} key - Registration key
   * @returns {*} Resolved instance
   */
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

  /**
   * Check if a key is registered
   * @param {string} key - Registration key
   * @returns {boolean}
   */
  has(key) {
    return this.instances.has(key) || this.factories.has(key);
  }

  /**
   * Clear all registrations
   */
  clear() {
    this.instances.clear();
    this.factories.clear();
    this.singletons.clear();
  }

  /**
   * Clear only instances (keeping registrations)
   */
  clearInstances() {
    // Only clear singleton instances, keep direct instances
    for (const key of this.singletons) {
      if (this.instances.has(key) && this.factories.has(key)) {
        this.instances.delete(key);
      }
    }
  }
}

// Create global container instance
export const container = new SimpleContainer();
