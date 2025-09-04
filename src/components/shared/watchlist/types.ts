import { WatchlistItemsResponse } from "@/lib/pb/types/pb-types";

// Base interface for watchlist items that can come from TMDB or PocketBase
export interface BaseWatchlistItem {
  id: string | number;
  tmdb_id: number;
  title: string;
  name?: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
  vote_average?: number;
  genre_ids?: Record<string, any> | any[] | null;
  media_type: "movie" | "tv" | ("movie" | "tv")[];
  original_language?: string;

  origin_country?: string[];

  // User-specific fields (optional for TMDB data)
  watched_status?: boolean;
  personal_rating?: number;
  notes?: string;
  created?: string;
  updated?: string;
  user_id?: string | string[];
}

// PocketBase watchlist item (extends base with required user fields)
export type PocketBaseWatchlistItem = WatchlistItemsResponse;

// TMDB item enriched with user data
export interface EnrichedTMDBItem extends BaseWatchlistItem {
  id: number;
  media_type: "movie" | "tv";
  // These will be populated client-side based on user's watchlist
  isInWatchlist?: boolean;
  watchlistItemId?: string;
  watched?: boolean; // From TMDB hooks
  inWatchList?: string[]; // Array of watchlist names from TMDB hooks
}

// Unified interface that combines all possible properties
export interface UnifiedWatchlistItem extends BaseWatchlistItem {
  id: string | number;
  tmdb_id: number;
  title: string;
  name?: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
  vote_average?: number;
  genre_ids?: Record<string, any> | any[] | null;
  media_type: "movie" | "tv" | ("movie" | "tv")[];
  original_language?: string;
  origin_country?: string[];

  // User-specific fields (optional for TMDB data)
  watched_status?: boolean;
  personal_rating?: number;
  notes?: string;
  created?: string;
  updated?: string;
  user_id?: string | string[];

  // TMDB enrichment fields
  isInWatchlist?: boolean;
  watchlistItemId?: string;
  watched?: boolean; // From TMDB hooks
  inWatchList?: string[]; // Array of watchlist names from TMDB hooks

  // PocketBase specific fields
  collectionId?: string;
  collectionName?: string;
  added_by?: string | string[];
  metadata?: any;
}

// Type guards
export function isPocketBaseItem(item: UnifiedWatchlistItem): item is UnifiedWatchlistItem & PocketBaseWatchlistItem {
  return typeof item.id === "string" && Array.isArray(item.media_type) && 'collectionId' in item;
}

export function isTMDBItem(item: UnifiedWatchlistItem): item is UnifiedWatchlistItem & EnrichedTMDBItem {
  return typeof item.id === "number" && typeof item.media_type === "string";
}

// Helper function to convert any item to UnifiedWatchlistItem format
export function toUnifiedWatchlistItem(item: PocketBaseWatchlistItem | EnrichedTMDBItem | any): UnifiedWatchlistItem {
  return {
    ...item,
    // Ensure required fields are present
    tmdb_id: item.tmdb_id || (typeof item.id === 'number' ? item.id : 0),
    title: item.title || item.name || 'Unknown Title',
    media_type: item.media_type || 'movie',
  } as UnifiedWatchlistItem;
}

// Convenience type aliases for different contexts
export type WatchlistItem = UnifiedWatchlistItem;
export type MediaItem = UnifiedWatchlistItem;

// For components that specifically work with TMDB data
export type TMDBMediaItem = UnifiedWatchlistItem & {
  id: number;
  media_type: "movie" | "tv";
  watched?: boolean;
  inWatchList?: string[];
};
