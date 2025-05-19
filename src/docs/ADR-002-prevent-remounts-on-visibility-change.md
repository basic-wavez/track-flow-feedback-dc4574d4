
# Architecture Decision Record: Preventing Duplicate Data Fetches on Tab Visibility Changes

## Context

When users switch browser tabs and return to the app, components were unnecessarily re-fetching data and re-rendering, causing a jarring user experience. This was particularly noticeable in the TrackView component, which would appear to "reload" when returning to the tab, despite React Query being configured with `refetchOnWindowFocus: false`.

Investigation revealed that the issue was not with React Query but with our React component lifecycle management, specifically:

1. The `user` object from AuthContext was being recreated on every session refresh from Supabase
2. Components like TrackView were depending on the full `user` object in effect dependencies
3. When tab visibility changed, Supabase refreshed tokens and created new object references

## Decision

We've implemented several patterns to prevent duplicate data fetching during visibility state changes:

1. **User Object Stabilization**
   - Only update user state if the user ID has actually changed
   - Compare by value (ID) not by reference when updating user state
   - Use `user?.id` as a dependency rather than the entire user object

2. **Visibility-Aware Effects**
   - Add visibility checks in critical useEffect hooks
   - Skip data fetching operations when tab is hidden
   - Use `document.visibilityState === 'visible'` as a guard

3. **Component Memoization**
   - Used React.memo to prevent unnecessary re-renders
   - Memoized provider configurations to ensure stable references

4. **Dependency Optimization**
   - Changed effect dependencies from objects (which change by reference) to primitive values
   - Focused on user IDs, not user objects
   - Created memoized derived values to prevent recalculation

## Implementation

1. **AuthContext.tsx**
   - Modified setUser to compare by ID before updating
   - Memoized context value by user.id instead of the whole user object
   - Added visibility state checks in onAuthStateChange handler

2. **TrackView.tsx**
   - Changed dependency from `user` to `user?.id`
   - Added `document.visibilityState === 'hidden'` guard
   - Applied React.memo to prevent parent re-renders

3. **ProtectedRoute.tsx**
   - Modified dependency from `user` to `userId`
   - Added visibility state awareness

4. **App.tsx**
   - Ensured providers are memoized correctly

5. **useVisibilityEffects.ts**
   - Enhanced with additional utilities for visibility-aware components

## Consequences

### Positive

- Eliminated duplicate data fetches when returning to the tab
- Improved perceived performance by preventing unnecessary re-renders
- Preserved audio playback state across tab switches
- Reduced network usage by preventing redundant API calls
- More deterministic component behavior

### Negative

- Slightly more complex code with additional checks and memoization
- Need to be careful about using primitive values (IDs) instead of objects in dependencies
- Must ensure object identity is preserved correctly to prevent unintended re-renders

## Conclusion

These changes align with React's optimization patterns for managing component lifecycles and preventing unnecessary re-renders and data fetches. The result is a more stable and performant application, especially when users switch between tabs and return to the app.
