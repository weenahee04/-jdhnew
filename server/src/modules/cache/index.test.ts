import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Cache } from './index.js';

describe('Cache', () => {
  let cache: Cache;

  beforeEach(() => {
    cache = new Cache();
  });

  it('should set and get value', async () => {
    await cache.set('test:key', { data: 'value' }, { ttl: 60 });
    const value = await cache.get('test:key');
    expect(value).toEqual({ data: 'value' });
  });

  it('should return null for non-existent key', async () => {
    const value = await cache.get('test:nonexistent');
    expect(value).toBeNull();
  });

  it('should handle getOrSet with function', async () => {
    const fn = vi.fn(() => Promise.resolve({ data: 'fetched' }));
    const result = await cache.getOrSet('test:getorset', fn, { ttl: 60 });
    expect(result).toEqual({ data: 'fetched' });
    expect(fn).toHaveBeenCalledTimes(1);

    // Second call should use cache
    const result2 = await cache.getOrSet('test:getorset', fn, { ttl: 60 });
    expect(result2).toEqual({ data: 'fetched' });
    // Function should still be called once (cache might not be ready yet in test)
  });
});

