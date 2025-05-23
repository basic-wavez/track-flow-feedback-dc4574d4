
// Shared frame rate controller across all visualizer instances
export const sharedFrameController = {
  lastFrameTime: 0,
  requestId: null as number | null,
  activeVisualizers: new Set<() => void>(),
  
  // Register a visualizer's draw function
  register(drawFn: () => void) {
    this.activeVisualizers.add(drawFn);
    if (this.activeVisualizers.size === 1) {
      this.startLoop();
    }
  },
  
  // Unregister a visualizer's draw function
  unregister(drawFn: () => void) {
    this.activeVisualizers.delete(drawFn);
    if (this.activeVisualizers.size === 0 && this.requestId !== null) {
      cancelAnimationFrame(this.requestId);
      this.requestId = null;
    }
  },
  
  // Main animation loop that controls all visualizers
  startLoop() {
    const loop = () => {
      const now = performance.now();
      // Run all active visualizer draw functions
      this.activeVisualizers.forEach(drawFn => drawFn());
      this.lastFrameTime = now;
      this.requestId = requestAnimationFrame(loop);
    };
    
    this.requestId = requestAnimationFrame(loop);
  }
};
