
# Architecture Decision Record: Preventing Component Remounts on Tab Visibility Changes

## Context

When users switch browser tabs or the application loses focus, many top-level providers (AuthProvider, QueryClientProvider, etc.) were unmounting and immediately remounting. This caused a cascade of "initialize → unsubscribe → initialize" operations and reset transient state like audio progress, forms, and react-query caches.

## Decision

We've implemented several patterns to prevent component remounts during visibility state changes:

1. **Ref-based Subscription Management**
   - Store subscriptions in refs to prevent recreation on re-renders
   - Only initialize listeners once per application lifetime
   - Don't unsubscribe on visibility changes

2. **Memoized Provider Configurations**
   - Use `useMemo` for provider props and configurations
   - Ensure provider props don't change on visibility toggles

3. **Visibility-Aware State Updates**
   - Conditionally update React state based on visibility
   - Prevent state changes while tab is hidden
   - Resume interrupted operations when visibility is restored

4. **Stabilized Audio Playback**
   - Remember audio state across visibility changes
   - Resume audio context if it was suspended
   - Update audio state to match reality when visibility is restored

## Consequences

### Positive

- Components maintain their state when switching tabs
- Audio continues playing when tab is not visible
- No more repeated "Initializing auth state listener" logs
- React elements maintain identity across visibility changes
- Better user experience with persistent state

### Negative

- Slightly more complex code with refs and memoization
- Need to be careful with visibility-conditional logic
- Potential memory usage increase from keeping components mounted

## Implementation Notes

1. **AuthContext**: Added subscription refs and visibility-aware state updates
2. **App.tsx**: Used useMemo for consistent provider trees
3. **useAudioPlayer**: Enhanced with visibility effects
4. **ProtectedRoute**: Added stability with initial check refs
5. **Added useVisibilityEffects**: New hook for shared visibility logic

These changes align with React's patterns for optimizing performance while maintaining correct behavior across visibility state changes.
