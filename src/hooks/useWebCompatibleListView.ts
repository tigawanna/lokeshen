import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions } from "react-native";

interface UseResponsiveListViewOptions {
  key: string; // Unique identifier for this list view
  minItemWidth?: number; // Minimum width per item in pixels
  maxColumns?: number; // Maximum number of columns
  padding?: number; // Horizontal padding to account for
}

interface PersistedListViewState {
  orientation: "grid" | "list";
  columns?: number;
}

export function useResponsiveListView(options: UseResponsiveListViewOptions) {
  const {
    key,
    minItemWidth = 190, // Default minimum width for movie/show cards
    maxColumns = 6, // Reasonable max for readability
    padding = 32, // Default padding (16px on each side)
  } = options;

  const [orientation, setOrientation] = useState<"grid" | "list">("grid");
  const [columns, setColumns] = useState(2);
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get("window").width
  );
  const [isLoading, setIsLoading] = useState(true);

  // Use ref to avoid recreating storageKey on every render
  const storageKeyRef = useRef(`listview_${key}`);

  // Memoized persist function to avoid recreating on every render
  const persistState = useCallback(
    async (newOrientation: "grid" | "list", newColumns?: number) => {
      try {
        const state: PersistedListViewState = {
          orientation: newOrientation,
          columns: newOrientation === "grid" ? newColumns : undefined,
        };
        await AsyncStorage.setItem(
          storageKeyRef.current,
          JSON.stringify(state)
        );
      } catch (error) {
        console.warn(`Failed to persist list view state for ${key}:`, error);
      }
    },
    [key]
  );

  // Load persisted state on mount - only depends on key
  useEffect(() => {
    const loadPersistedState = async () => {
      try {
        const stored = await AsyncStorage.getItem(storageKeyRef.current);
        if (stored) {
          const parsed: PersistedListViewState = JSON.parse(stored);
          setOrientation(parsed.orientation);
          if (parsed.columns && parsed.orientation === "grid") {
            setColumns(parsed.columns);
          }
        }
      } catch (error) {
        console.warn(`Failed to load list view state for ${key}:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPersistedState();
  }, [key]);

  // Enhanced setOrientation that persists changes
  const setOrientationWithPersistence = useCallback(
    (newOrientation: "grid" | "list") => {
      setOrientation(newOrientation);
      if (newOrientation === "list") {
        setColumns(1);
        persistState(newOrientation, 1);
      } else {
        // Calculate optimal columns immediately to prevent flash
        const availableWidth = screenWidth - padding;
        const calculatedColumns = Math.floor(availableWidth / minItemWidth);
        const optimalColumns = Math.max(2, Math.min(calculatedColumns, maxColumns));
        
        setColumns(optimalColumns);
        persistState(newOrientation, optimalColumns);
      }
    },
    [persistState, screenWidth, padding, minItemWidth, maxColumns]
  );

  // Screen width listener - no dependencies needed
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setScreenWidth(window.width);
    });

    return () => subscription?.remove();
  }, []);

  // Column calculation effect - only for screen width changes and initial load
  useEffect(() => {
    // Only calculate columns after initial load to avoid overriding persisted values
    if (isLoading) return;

    // Only recalculate columns for grid mode when screen width changes
    if (orientation === "grid") {
      const availableWidth = screenWidth - padding;
      const calculatedColumns = Math.floor(availableWidth / minItemWidth);
      const optimalColumns = Math.max(2, Math.min(calculatedColumns, maxColumns));

      // Only update if columns actually changed to prevent unnecessary renders
      if (columns !== optimalColumns) {
        setColumns(optimalColumns);
      }
    }
  }, [
    screenWidth,
    minItemWidth,
    maxColumns,
    padding,
    isLoading,
    columns,
    orientation,
  ]);

  // Separate effect for persisting column changes when screen size changes
  useEffect(() => {
    if (isLoading || orientation !== "grid") return;

    // Debounce persistence to avoid excessive writes (only for screen size changes)
    const timeoutId = setTimeout(() => {
      persistState(orientation, columns);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [columns, orientation, isLoading, persistState]);

  return {
    orientation,
    setOrientation: setOrientationWithPersistence,
    columns,
    screenWidth,
    isTablet: screenWidth >= 768,
    isDesktop: screenWidth >= 1024,
    isLoadingOrientation:isLoading, // Useful for preventing flash of default state
  };
}
