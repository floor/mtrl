// src/core/collection/adapters/route.ts

import { OPERATORS, createBaseAdapter } from './base';

const QUERY_PARAMS = {
  [OPERATORS.EQ]: 'eq',
  [OPERATORS.NE]: 'ne',
  [OPERATORS.GT]: 'gt',
  [OPERATORS.GTE]: 'gte',
  [OPERATORS.LT]: 'lt',
  [OPERATORS.LTE]: 'lte',
  [OPERATORS.IN]: 'in',
  [OPERATORS.NIN]: 'nin',
  [OPERATORS.CONTAINS]: 'contains',
  [OPERATORS.STARTS_WITH]: 'startsWith',
  [OPERATORS.ENDS_WITH]: 'endsWith'
} as const;

/**
 * Route adapter configuration interface
 */
export interface RouteAdapterConfig {
  base?: string;
  endpoints?: {
    create?: string;
    list?: string;
    update?: string;
    delete?: string;
  };
  headers?: Record<string, string>;
  cache?: boolean;
  onError?: (error: Error, context?: any) => void;
  adapter?: {
    parseResponse?: (response: any) => any;
  };
}

/**
 * Response metadata interface
 */
export interface ResponseMeta {
  cursor: string | null;
  hasNext: boolean;
  total?: number;
  page?: number;
  pages?: number;
}

/**
 * Parsed response interface
 */
export interface ParsedResponse<T = any> {
  items: T[];
  meta: ResponseMeta;
}

export const createRouteAdapter = (config: RouteAdapterConfig = {}) => {
  const base = createBaseAdapter(config);
  let controller: AbortController | null = null;
  const cache = new Map<string, { data: any; timestamp: number }>();
  const urlCache = new Map<string, string>();

  /**
   * Normalizes a base URL to ensure it can be used in URL construction
   * @param baseUrl - Base URL string to normalize
   * @returns Normalized URL that can be used with URL constructor
   */
  const normalizeBaseUrl = (baseUrl?: string): string => {
    if (!baseUrl) return 'http://localhost';
    
    // If it's already an absolute URL, return it
    if (/^https?:\/\//i.test(baseUrl)) {
      return baseUrl;
    }
    
    // For relative URLs starting with /, use current origin
    if (baseUrl.startsWith('/')) {
      return `${window.location.origin}${baseUrl}`;
    }
    
    // For other cases, assume http://
    return `http://${baseUrl}`;
  };

  const buildUrl = (endpoint: string, params: Record<string, any> = {}): string => {
    try {
      const cacheKey = endpoint + JSON.stringify(params);
      
      if (urlCache.has(cacheKey)) {
        return urlCache.get(cacheKey)!;
      }
      
      // Normalize the base URL to ensure it works with URL constructor
      const normalizedBase = normalizeBaseUrl(config.base);
      
      const url = new URL(normalizedBase + endpoint);
      
      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => url.searchParams.append(key, v));
        } else if (value !== null && value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
      
      // For relative URLs, return just the pathname and search if config.base is relative
      if (config.base && config.base.startsWith('/')) {
        const relativeUrl = `${url.pathname}${url.search}`;
        urlCache.set(cacheKey, relativeUrl);
        return relativeUrl;
      }
      
      const urlString = url.toString();
      urlCache.set(cacheKey, urlString);
      return urlString;
    } catch (error) {
      console.error('Error building URL:', error, {
        base: config.base,
        endpoint,
        params
      });
      throw error;
    }
  };

  const transformQuery = (query: Record<string, any>): Record<string, any> => {
    const params: Record<string, any> = {};
    Object.entries(query).forEach(([field, conditions]) => {
      if (typeof conditions === 'object') {
        Object.entries(conditions).forEach(([op, value]) => {
          const paramKey = QUERY_PARAMS[op as keyof typeof QUERY_PARAMS];
          if (paramKey) {
            params[`${field}_${paramKey}`] = value;
          }
        });
      } else {
        params[field] = conditions;
      }
    });
    return params;
  };

  const request = async (url: string, options: RequestInit = {}): Promise<any> => {
    if (controller) {
      controller.abort();
    }
    controller = new AbortController();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
          ...options.headers
        },
        signal: controller.signal
      });

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `HTTP error ${response.status}` };
        }
        console.error('API error response:', errorData);
        return base.handleError(new Error(errorData.message || 'API request failed'));
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return data;
      } else {
        const text = await response.text();
        return text;
      }
    } catch (error) {
      console.error('API request error:', error);
      if ((error as Error).name === 'AbortError') return null;
      return base.handleError(error as Error);
    } finally {
      controller = null;
    }
  };

  const getCache = (key: string): any | null => {
    if (!config.cache) return null;

    const cached = cache.get(key);
    if (!cached) return null;

    const { data, timestamp } = cached;
    const now = Date.now();

    if (now - timestamp > 5 * 60 * 1000) {
      cache.delete(key);
      return null;
    }

    return data;
  };

  const setCache = (key: string, data: any): void => {
    if (!config.cache) return;
    cache.set(key, { data, timestamp: Date.now() });
  };

  /**
   * Parse API response, allowing for custom response format handling
   * @param response - The raw API response
   * @returns Parsed response with standardized format
   */
  const parseResponse = (response: any): ParsedResponse => {
    // If a custom parser is provided in config, use it
    if (config.adapter?.parseResponse) {
      return config.adapter.parseResponse(response);
    }
    
    // Handle standard response format
    if (response && response.items) {
      return response;
    }
    
    // Handle case where response is the items array directly
    if (Array.isArray(response)) {
      return {
        items: response,
        meta: { cursor: null, hasNext: false }
      };
    }
    
    // Check for pagination data in different formats
    let cursor = null;
    let hasNext = false;
    
    if (response) {
      // Look for pagination info in common formats
      const pagination = response.pagination || response.meta || response.page || {};
      
      if (pagination.next || pagination.nextPage) {
        cursor = String(pagination.next || pagination.nextPage);
        hasNext = true;
      } else if (pagination.hasMore || pagination.hasNext) {
        hasNext = true;
        cursor = pagination.cursor || 
                 (pagination.page ? String(pagination.page + 1) : null);
      }
      
      // Try to determine the items array
      const items = response.data || response.items || response.results || response.content || [];
      
      return {
        items,
        meta: { cursor, hasNext }
      };
    }
    
    // Default fallback
    return {
      items: [],
      meta: { cursor: null, hasNext: false }
    };
  };

  return {
    ...base,

    create: async (items: any[]): Promise<ParsedResponse> => {
      const url = buildUrl(config.endpoints?.create || '/create');
      const response = await request(url, {
        method: 'POST',
        body: JSON.stringify({ items })
      });
      return parseResponse(response);
    },

    read: async (query: Record<string, any> = {}, options: Record<string, any> = {}): Promise<ParsedResponse> => {
      // console.log('Route adapter read called with query:', query, 'options:', options);
      
      // Extract pagination params from both query and options, prioritizing query
      const cursor = query.cursor || options.cursor;
      const limit = query.limit || options.limit || 20;
      const search = query.search || options.search;
      const sort = query.sort || options.sort;
      const fields = query.fields || options.fields;
          
      // Filter out pagination and search params from query
      const filteredQuery = { ...query };
      ['cursor', 'page', 'limit', 'sort', 'fields', 'search'].forEach(key => {
        delete filteredQuery[key];
      });
      
      // Prepare parameters, prioritizing cursor-based pagination
      const params: Record<string, any> = {
        ...transformQuery(filteredQuery),
        limit
      };
      
      // Only add cursor if it exists
      if (cursor) {
        params.cursor = cursor;
      }
      
      // Add search parameter if provided
      if (search) {
        params.search = search;
      }
      
      // Add optional parameters if provided
      if (sort) params.sort = sort;
      if (fields) params.fields = fields;
      
      // Clean up undefined params
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });

      const url = buildUrl(config.endpoints?.list || '/list', params);
      const cacheKey = url.toString();

      const cached = getCache(cacheKey);
      if (cached) return cached;

      const response = await request(url);
      const parsed = parseResponse(response);
      setCache(cacheKey, parsed);

      return parsed;
    },

    update: async (items: any[]): Promise<ParsedResponse> => {
      const url = buildUrl(config.endpoints?.update || '/update');
      const response = await request(url, {
        method: 'PUT',
        body: JSON.stringify({ items })
      });
      return parseResponse(response);
    },

    delete: async (ids: string[]): Promise<ParsedResponse> => {
      const url = buildUrl(config.endpoints?.delete || '/delete');
      const response = await request(url, {
        method: 'DELETE',
        body: JSON.stringify({ ids })
      });
      return parseResponse(response);
    },

    query: async (query: Record<string, any> = {}, options: Record<string, any> = {}): Promise<ParsedResponse> => {
      // Extract pagination params from both query and options
      const cursor = query.cursor || options.cursor;
      const limit = query.limit || options.limit || 20;
      const search = query.search || options.search;
      
      // Filter out pagination params from query and options
      const filteredQuery = { ...query };
      const filteredOptions = { ...options };
      ['cursor', 'page', 'limit', 'sort', 'fields', 'search'].forEach(key => {
        delete filteredQuery[key];
        delete filteredOptions[key];
      });
      
      // Build params for cursor-based pagination
      const params = {
        ...transformQuery(filteredQuery),
        ...filteredOptions,
        limit
      };
      
      // Only add cursor if it exists
      if (cursor) {
        params.cursor = cursor;
      }
      
      // Add search parameter if provided
      if (search) {
        params.search = search;
      }

      const url = buildUrl(config.endpoints?.list || '/list', params);
      const response = await request(url);
      return parseResponse(response);
    },

    disconnect: () => {
      if (controller) {
        controller.abort();
        controller = null;
      }
      cache.clear();
      urlCache.clear();
    }
  };
};