import { Href } from 'expo-router';
import { UnifiedWatchlistItem, isPocketBaseItem } from './types';

export class WatchlistItemUtils {
  // Get normalized media type
  static getMediaType(item: UnifiedWatchlistItem, mediaTypeTab?: "movie" | "tv"): "movie" | "tv" {
    if (isPocketBaseItem(item)) {
      return item.media_type?.[0] || "movie";
    }
    return item?.media_type || mediaTypeTab || "movie";
  }

  // Get display ID for navigation
  static getDisplayId(item: UnifiedWatchlistItem): string {
    return item.tmdb_id.toString();
  }

  // Get poster URL
  static getPosterUrl(item: UnifiedWatchlistItem): string | null {
    return item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null;
  }

  // Get release year
  static getReleaseYear(item: UnifiedWatchlistItem): number | null {
    return item.release_date ? new Date(item.release_date).getFullYear() : null;
  }

  // Get formatted added date (for PocketBase items)
  static getFormattedAddedDate(item: UnifiedWatchlistItem): string | null {
    if (!isPocketBaseItem(item) || !item.created) return null;

    const addedDate = new Date(item.created);
    return addedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: addedDate.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
  }

  // Get watched status
  // static getWatchedStatus(item: UnifiedWatchlistItem): boolean {
  //   if (isPocketBaseItem(item)) {
  //     return item.watched_status;
  //   }
  //   return false; // TMDB items default to unwatched
  // }

  // Get personal rating
  static getPersonalRating(item: UnifiedWatchlistItem): number {
    if (isPocketBaseItem(item)) {
      return item.personal_rating || 0;
    }
    return 0; // TMDB items have no personal rating
  }

  // Get notes
  static getNotes(item: UnifiedWatchlistItem): string | null {
    if (isPocketBaseItem(item)) {
      return item.notes || null;
    }
    return null; // TMDB items have no notes
  }

  // Check if item is in watchlist (for TMDB items)
  static isInWatchlist(item: UnifiedWatchlistItem): boolean {
    if (isPocketBaseItem(item)) {
      return true; // PocketBase items are always in watchlist
    }
    return (item as any).isInWatchlist || false;
  }

  // Get navigation route
  static getNavigationRoute(item: UnifiedWatchlistItem): Href {
    const mediaType = this.getMediaType(item);
    const route = mediaType === "movie" ? "/movie" : "/show";
    return `${route}/${item.tmdb_id}`;
  }

  // Get short media type text
  static getShortMediaTypeText(item: UnifiedWatchlistItem): string {
    const mediaType = this.getMediaType(item);
    return mediaType === "movie" ? "Movie" : "TV";
  }

  // Get media type display text
  static getMediaTypeText(item: UnifiedWatchlistItem): string {
    const mediaType = this.getMediaType(item);
    return mediaType === "movie" ? "Movie" : "TV Show";
  }
}



