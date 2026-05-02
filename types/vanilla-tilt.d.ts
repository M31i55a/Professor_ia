declare module 'vanilla-tilt' {
  interface TiltOptions {
    reverse?: boolean;
    max?: number;
    startX?: number;
    startY?: number;
    perspective?: number;
    scale?: number;
    speed?: number;
    transition?: boolean;
    axis?: 'x' | 'y' | null;
    reset?: boolean;
    'reset-to-start'?: boolean;
    easing?: string;
    glare?: boolean;
    'max-glare'?: number;
    'glare-prerender'?: boolean;
    'mouse-event-element'?: string | HTMLElement | null;
    'full-page-listening'?: boolean;
    gyroscope?: boolean;
    gyroscopeMinAngleX?: number;
    gyroscopeMaxAngleX?: number;
    gyroscopeMinAngleY?: number;
    gyroscopeMaxAngleY?: number;
  }

  interface VanillaTiltHTMLElement extends HTMLElement {
    vanillaTilt: {
      destroy: () => void;
    };
  }

  const VanillaTilt: {
    init(element: HTMLElement | HTMLElement[] | NodeList, options?: TiltOptions): void;
  };

  export default VanillaTilt;
}

// Augment the global HTMLElement so refs typed as HTMLDivElement etc. also
// recognise the vanillaTilt property attached at runtime.
declare global {
  interface HTMLElement {
    vanillaTilt?: {
      destroy: () => void;
    };
  }
}
