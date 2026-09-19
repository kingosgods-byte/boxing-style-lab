export type DeviceClass =
  | "mobile"
  | "tablet"
  | "desktop";

export interface ResponsiveState {
  width: number;

  height: number;

  devicePixelRatio: number;

  deviceClass: DeviceClass;

  portrait: boolean;

  touchCapable: boolean;
}

export function getDeviceClass(
  width: number
): DeviceClass {
  if (width < 768) {
    return "mobile";
  }

  if (width < 1100) {
    return "tablet";
  }

  return "desktop";
}

export function getResponsiveState():
  ResponsiveState {
  const width =
    window.innerWidth;

  const height =
    window.innerHeight;

  return {
    width,

    height,

    devicePixelRatio:
      window.devicePixelRatio || 1,

    deviceClass:
      getDeviceClass(width),

    portrait:
      height >= width,

    touchCapable:
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0,
  };
}

export function isMobile():
  boolean {
  return (
    getDeviceClass(
      window.innerWidth
    ) === "mobile"
  );
}

export function isTablet():
  boolean {
  return (
    getDeviceClass(
      window.innerWidth
    ) === "tablet"
  );
}

export function isDesktop():
  boolean {
  return (
    getDeviceClass(
      window.innerWidth
    ) === "desktop"
  );
}

export function getSafeViewportHeight():
  number {
  return Math.max(
    window.innerHeight,
    document.documentElement
      .clientHeight
  );
}

export function subscribeToResponsiveChanges(
  callback: (
    state: ResponsiveState
  ) => void
): () => void {
  const handleResize = () => {
    callback(
      getResponsiveState()
    );
  };

  window.addEventListener(
    "resize",
    handleResize
  );

  window.addEventListener(
    "orientationchange",
    handleResize
  );

  callback(
    getResponsiveState()
  );

  return () => {
    window.removeEventListener(
      "resize",
      handleResize
    );

    window.removeEventListener(
      "orientationchange",
      handleResize
    );
  };
}
