import { ref, onMounted, onUnmounted, computed } from 'vue';

export function useFullscreenDetection() {
  const isFullscreen = ref(false);
  const isKioskMode = ref(false);

  const checkFullscreen = () => {
    isFullscreen.value = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
  };

  const checkKioskMode = () => {
    // Checks if browser appears to be in kiosk mode (approximate)
    const hasMinimalUI = 
      window.innerHeight === screen.height &&
      window.innerWidth === screen.width;
    
    isKioskMode.value = hasMinimalUI;
  };

  const handleFullscreenChange = () => {
    checkFullscreen();
  };

  const handleResize = () => {
    checkKioskMode();
  };

  onMounted(() => {
    checkFullscreen();
    checkKioskMode();
    
    // Fullscreen API listeners
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    // Window resize listener for kiosk mode detection
    window.addEventListener('resize', handleResize);
  });

  onUnmounted(() => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    window.removeEventListener('resize', handleResize);
  });

  const isWallDisplayMode = computed(() => isFullscreen.value || isKioskMode.value);

  return { isFullscreen, isKioskMode, isWallDisplayMode };
}
