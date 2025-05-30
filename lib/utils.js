// Utility functions for performance optimization

/**
 * Debounce function để giảm số lần gọi API
 * @param {Function} func - Function cần debounce
 * @param {number} wait - Thời gian đợi (ms)
 * @param {boolean} immediate - Có thực thi ngay lập tức không
 */
export function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

/**
 * Throttle function để giới hạn tần suất gọi API
 * @param {Function} func - Function cần throttle
 * @param {number} limit - Thời gian giới hạn (ms)
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Simple cache implementation for API responses
 */
export class SimpleCache {
  constructor(ttl = 60000) { // Default TTL: 1 minute
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    const expiry = Date.now() + this.ttl;
    this.cache.set(key, { value, expiry });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}

/**
 * Check if the current tab is visible (để tránh polling khi tab không active)
 */
export function isTabVisible() {
  return !document.hidden;
}

/**
 * Add visibility change listener để dừng polling khi tab không active
 */
export function addVisibilityChangeListener(callback) {
  document.addEventListener('visibilitychange', callback);
  return () => document.removeEventListener('visibilitychange', callback);
}
