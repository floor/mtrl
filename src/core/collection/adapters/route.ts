// src/core/collection/adapters/route.ts

import { OPERATORS, createBaseAdapter } from "./base";

const QUERY_PARAMS = {
  [OPERATORS.EQ]: "eq",
  [OPERATORS.NE]: "ne",
  [OPERATORS.GT]: "gt",
  [OPERATORS.GTE]: "gte",
  [OPERATORS.LT]: "lt",
  [OPERATORS.LTE]: "lte",
  [OPERATORS.IN]: "in",
  [OPERATORS.NIN]: "nin",
  [OPERATORS.CONTAINS]: "contains",
  [OPERATORS.STARTS_WITH]: "startsWith",
  [OPERATORS.ENDS_WITH]: "endsWith",
} as const;

/**
 * Pagination strategies supported by the route adapter
 */
export type PaginationStrategy = "cursor" | "offset" | "page";

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  /**
   * Pagination strategy to use
   * @default 'cursor'
   */
  strategy: PaginationStrategy;

  /**
   * Parameter name for pagination cursor
   * @default 'cursor'
   */
  cursorParamName?: string;

  /**
   * Parameter name for page number
   * @default 'page'
   */
  pageParamName?: string;

  /**
   * Parameter name for page size / items per page
   * @default 'per_page'
   */
  perPageParamName?: string;

  /**
   * Parameter name for offset
   * @default 'offset'
   */
  offsetParamName?: string;

  /**
   * Parameter name for limit
   * @default 'limit'
   */
  limitParamName?: string;

  /**
   * Default page size for pagination
   * @default 20
   */
  defaultPageSize?: number;
}

/**
 * Route adapter configuration interface
 */
export interface RouteAdapterConfig {
  /**
   * Base URL for API requests
   */
  base?: string;

  /**
   * API endpoints
   */
  endpoints?: {
    create?: string;
    list?: string;
    update?: string;
    delete?: string;
  };

  /**
   * HTTP headers to include with requests
   */
  headers?: Record<string, string>;

  /**
   * Whether to enable response caching
   */
  cache?: boolean;

  /**
   * Error handler function
   */
  onError?: (error: Error, context?: any) => void;

  /**
   * Custom adapter options
   */
  adapter?: {
    /**
     * Custom response parser
     */
    parseResponse?: (response: any) => any;
  };

  /**
   * Pagination configuration
   */
  pagination?: PaginationConfig;
}

/**
 * Response metadata interface
 */
export interface ResponseMeta {
  /**
   * Cursor for next page (cursor-based pagination)
   */
  cursor: string | null;

  /**
   * Whether there are more items available
   */
  hasNext: boolean;

  /**
   * Total number of items (if available)
   */
  total?: number;

  /**
   * Current page number (page-based pagination)
   */
  page?: number;

  /**
   * Total number of pages (page-based pagination)
   */
  pages?: number;

  /**
   * Current offset (offset-based pagination)
   */
  offset?: number;
}

/**
 * Parsed response interface
 */
export interface ParsedResponse<T = any> {
  /**
   * Items returned in the response
   */
  items: T[];

  /**
   * Pagination metadata
   */
  meta: ResponseMeta;
}

export const createRouteAdapter = (config: RouteAdapterConfig = {}) => {
  const base = createBaseAdapter(config);
  const activeControllers = new Set<AbortController>();
  const cache = new Map<string, { data: any; timestamp: number }>();
  const urlCache = new Map<string, string>();

  // Initialize pagination config from provided configuration
  // This ensures we respect the user's desired pagination strategy
  const paginationConfig: Required<PaginationConfig> = {
    strategy: config.pagination?.strategy || "cursor",
    cursorParamName: config.pagination?.cursorParamName || "cursor",
    pageParamName: config.pagination?.pageParamName || "page",
    perPageParamName: config.pagination?.perPageParamName || "per_page",
    offsetParamName: config.pagination?.offsetParamName || "offset",
    limitParamName: config.pagination?.limitParamName || "limit",
    defaultPageSize: config.pagination?.defaultPageSize || 20,
  };

  /**
   * Normalizes a base URL to ensure it can be used in URL construction
   * @param baseUrl - Base URL string to normalize
   * @returns Normalized URL that can be used with URL constructor
   */
  const normalizeBaseUrl = (baseUrl?: string): string => {
    if (!baseUrl) return "http://localhost";

    // If it's already an absolute URL, return it
    if (/^https?:\/\//i.test(baseUrl)) {
      return baseUrl;
    }

    // For relative URLs starting with /, use current origin
    if (baseUrl.startsWith("/")) {
      return `${window.location.origin}${baseUrl}`;
    }

    // For other cases, assume http://
    return `http://${baseUrl}`;
  };

  const buildUrl = (
    endpoint: string,
    params: Record<string, any> = {}
  ): string => {
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
          value.forEach((v) => url.searchParams.append(key, v));
        } else if (value !== null && value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });

      // For relative URLs, return just the pathname and search if config.base is relative
      if (config.base && config.base.startsWith("/")) {
        const relativeUrl = `${url.pathname}${url.search}`;
        urlCache.set(cacheKey, relativeUrl);
        return relativeUrl;
      }

      const urlString = url.toString();
      urlCache.set(cacheKey, urlString);
      return urlString;
    } catch (error) {
      console.error("Error building URL:", error, {
        base: config.base,
        endpoint,
        params,
      });
      throw error;
    }
  };

  const transformQuery = (query: Record<string, any>): Record<string, any> => {
    const params: Record<string, any> = {};
    Object.entries(query).forEach(([field, conditions]) => {
      if (typeof conditions === "object") {
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

  const request = async (
    url: string,
    options: RequestInit = {}
  ): Promise<any> => {
    // Create a new AbortController for this specific request
    const requestController = new AbortController();
    activeControllers.add(requestController);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...config.headers,
          ...options.headers,
        },
        signal: requestController.signal,
      });

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `HTTP error ${response.status}` };
        }
        console.error("API error response:", errorData);
        return base.handleError(
          new Error(errorData.message || "API request failed")
        );
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        return data;
      } else {
        const text = await response.text();
        return text;
      }
    } catch (error) {
      console.error("API request error:", error);
      if ((error as Error).name === "AbortError") return null;
      return base.handleError(error as Error);
    } finally {
      // Clean up this request's controller
      activeControllers.delete(requestController);
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
   * Creates pagination parameters based on the configured strategy
   * @param query - Query parameters from the request
   * @param options - Additional options
   * @returns Pagination parameters for the request
   */
  const createPaginationParams = (
    query: Record<string, any> = {},
    options: Record<string, any> = {}
  ): Record<string, any> => {
    const params: Record<string, any> = {};

    // Ensure we're using the correct pagination strategy
    const strategy = paginationConfig.strategy;

    switch (strategy) {
      case "cursor": {
        // Cursor-based pagination
        const cursor = query.cursor || options.cursor;
        if (cursor) {
          params[paginationConfig.cursorParamName] = cursor;
        }

        // Add limit parameter
        const limit =
          query.limit || options.limit || paginationConfig.defaultPageSize;
        params[paginationConfig.limitParamName] = limit;
        break;
      }

      case "offset": {
        // Offset-based pagination
        const offset =
          query.offset !== undefined
            ? query.offset
            : options.offset !== undefined
            ? options.offset
            : 0;
        params[paginationConfig.offsetParamName] = offset;

        // Add limit parameter
        const limit =
          query.limit || options.limit || paginationConfig.defaultPageSize;
        params[paginationConfig.limitParamName] = limit;
        break;
      }

      case "page": {
        // Page-based pagination
        const page =
          query.page !== undefined
            ? query.page
            : options.page !== undefined
            ? options.page
            : query.cursor
            ? query.cursor
            : 1; // Use cursor as page if specified

        params[paginationConfig.pageParamName] = page;

        // Add page size parameter
        const perPage =
          query.per_page ||
          query.perPage ||
          query.limit ||
          options.per_page ||
          options.perPage ||
          options.limit ||
          paginationConfig.defaultPageSize;

        params[paginationConfig.perPageParamName] = perPage;
        break;
      }
    }

    return params;
  };

  /**
   * Parse API response, allowing for custom response format handling
   * @param response - The raw API response
   * @param query - Original query parameters
   * @param options - Original options
   * @returns Parsed response with standardized format
   */
  const parseResponse = (
    response: any,
    query: Record<string, any> = {},
    options: Record<string, any> = {}
  ): ParsedResponse => {
    // Handle null response (aborted requests)
    if (response === null || response === undefined) {
      return {
        items: [],
        meta: { cursor: null, hasNext: false, total: 0 },
      };
    }

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
        meta: { cursor: null, hasNext: false },
      };
    }

    // Extract common data fields from the response
    const data =
      response.data ||
      response.items ||
      response.results ||
      response.content ||
      [];
    const meta = response.meta || response.pagination || response.page || {};
    const total = meta.total || response.total || data.length;

    // Initialize metadata object
    const metadata: ResponseMeta = {
      cursor: null,
      hasNext: false,
      total: total,
    };

    // Process metadata based on strategy
    const strategy = paginationConfig.strategy;

    switch (strategy) {
      case "cursor": {
        // For cursor-based pagination
        if (meta.next || meta.nextCursor || meta.nextPage) {
          metadata.cursor = String(
            meta.next || meta.nextCursor || meta.nextPage
          );
          metadata.hasNext = true;
        } else if (meta.hasMore || meta.hasNext) {
          metadata.hasNext = Boolean(meta.hasMore || meta.hasNext);
          metadata.cursor =
            meta.cursor || (meta.page ? String(Number(meta.page) + 1) : null);
        } else {
          // Default determination based on data
          // If items returned equals limit, assume there could be more
          const limit =
            query.limit || options.limit || paginationConfig.defaultPageSize;
          metadata.hasNext = data.length >= limit;

          // Try to generate a cursor based on the last item's ID
          if (metadata.hasNext && data.length > 0) {
            const lastItem = data[data.length - 1];
            metadata.cursor =
              lastItem.id || lastItem._id || String(data.length);
          }
        }
        break;
      }

      case "offset": {
        // For offset-based pagination
        const offset = Number(
          query.offset || options.offset || meta.offset || 0
        );
        const limit = Number(
          query.limit ||
            options.limit ||
            meta.limit ||
            paginationConfig.defaultPageSize
        );
        const fetchedItems = data.length;

        // If total is available, use it to determine if more items exist
        if (total !== undefined) {
          metadata.hasNext = offset + fetchedItems < total;
        } else {
          // If total is not provided, assume more items if we got a full page
          metadata.hasNext = fetchedItems >= limit;
        }

        // Set next cursor/offset
        metadata.cursor = metadata.hasNext
          ? String(offset + fetchedItems)
          : null;

        // Add offset to metadata
        metadata.offset = offset;
        break;
      }

      case "page": {
        // For page-based pagination
        const page = Number(
          query.page || options.page || meta.page || meta.current_page || 1
        );
        const perPage = Number(
          query.per_page ||
            query.perPage ||
            query.limit ||
            options.per_page ||
            options.perPage ||
            options.limit ||
            meta.per_page ||
            meta.perPage ||
            meta.size ||
            meta.limit ||
            paginationConfig.defaultPageSize
        );

        // Store page in the metadata
        metadata.page = page;

        // If we have total pages info
        const totalPages = Number(
          meta.totalPages ||
            meta.total_pages ||
            meta.pages ||
            meta.pageCount ||
            0
        );

        if (totalPages > 0) {
          metadata.hasNext = page < totalPages;
          metadata.pages = totalPages;
        } else if (total !== undefined) {
          // Calculate if more pages exist based on total items
          const calculatedTotalPages = Math.ceil(total / perPage);
          metadata.hasNext = page < calculatedTotalPages;
          metadata.pages = calculatedTotalPages;
        } else {
          // If neither is available, assume more items if we got a full page
          metadata.hasNext = data.length >= perPage;
        }

        // Set next cursor to the next page number
        metadata.cursor = metadata.hasNext ? String(page + 1) : null;
        break;
      }
    }

    return {
      items: data,
      meta: metadata,
    };
  };

  return {
    ...base,

    create: async (items: any[]): Promise<ParsedResponse> => {
      const url = buildUrl(config.endpoints?.create || "/create");
      const response = await request(url, {
        method: "POST",
        body: JSON.stringify({ items }),
      });
      return parseResponse(response);
    },

    read: async (
      query: Record<string, any> = {},
      options: Record<string, any> = {}
    ): Promise<ParsedResponse> => {
      // Filter out pagination and search params from query
      const filteredQuery = { ...query };
      [
        "cursor",
        "page",
        "offset",
        "limit",
        "per_page",
        "perPage",
        "sort",
        "fields",
        "search",
      ].forEach((key) => {
        delete filteredQuery[key];
      });

      // Transform filters
      const filterParams = transformQuery(filteredQuery);

      // Get pagination parameters based on configured strategy
      const paginationParams = createPaginationParams(query, options);

      // Add additional common parameters
      const additionalParams: Record<string, any> = {};

      // Add search parameter if provided
      if (query.search || options.search) {
        additionalParams.search = query.search || options.search;
      }

      // Add sort parameter if provided
      if (query.sort || options.sort) {
        additionalParams.sort = query.sort || options.sort;
      }

      // Add fields parameter if provided
      if (query.fields || options.fields) {
        additionalParams.fields = query.fields || options.fields;
      }

      // Combine all parameters
      const params = {
        ...filterParams,
        ...paginationParams,
        ...additionalParams,
      };

      // Clean up undefined params
      Object.keys(params).forEach((key) => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });

      const url = buildUrl(config.endpoints?.list || "/list", params);
      const cacheKey = url.toString();

      const cached = getCache(cacheKey);
      if (cached) return cached;

      const response = await request(url);
      const parsed = parseResponse(response, query, options);
      setCache(cacheKey, parsed);

      return parsed;
    },

    update: async (items: any[]): Promise<ParsedResponse> => {
      const url = buildUrl(config.endpoints?.update || "/update");
      const response = await request(url, {
        method: "PUT",
        body: JSON.stringify({ items }),
      });
      return parseResponse(response);
    },

    delete: async (ids: string[]): Promise<ParsedResponse> => {
      const url = buildUrl(config.endpoints?.delete || "/delete");
      const response = await request(url, {
        method: "DELETE",
        body: JSON.stringify({ ids }),
      });
      return parseResponse(response);
    },

    query: async (
      query: Record<string, any> = {},
      options: Record<string, any> = {}
    ): Promise<ParsedResponse> => {
      // Filter out pagination and search params from query and options
      const filteredQuery = { ...query };
      const filteredOptions = { ...options };
      [
        "cursor",
        "page",
        "offset",
        "limit",
        "per_page",
        "perPage",
        "sort",
        "fields",
        "search",
      ].forEach((key) => {
        delete filteredQuery[key];
        delete filteredOptions[key];
      });

      // Transform filters
      const filterParams = transformQuery(filteredQuery);

      // Get pagination parameters
      const paginationParams = createPaginationParams(query, options);

      // Add remaining filter options
      const remainingParams = { ...filteredOptions };

      // Add search parameter if provided
      if (query.search || options.search) {
        remainingParams.search = query.search || options.search;
      }

      // Combine all parameters
      const params = {
        ...filterParams,
        ...paginationParams,
        ...remainingParams,
      };

      const url = buildUrl(config.endpoints?.list || "/list", params);
      const response = await request(url);
      return parseResponse(response, query, options);
    },

    /**
     * Change the pagination strategy
     * @param strategy - New pagination strategy
     * @returns Updated adapter
     */
    setPaginationStrategy: (strategy: PaginationStrategy): void => {
      paginationConfig.strategy = strategy;
    },

    /**
     * Get the current pagination configuration
     * @returns Current pagination config
     */
    getPaginationConfig: (): Required<PaginationConfig> => {
      return { ...paginationConfig };
    },

    disconnect: () => {
      // Abort all active requests
      activeControllers.forEach((controller) => controller.abort());
      activeControllers.clear();
      cache.clear();
      urlCache.clear();
    },
  };
};
