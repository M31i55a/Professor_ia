// Extend HTMLElement to include the vanillaTilt instance that vanilla-tilt
// attaches to DOM elements at runtime.
interface HTMLElement {
  vanillaTilt?: {
    destroy: () => void;
  };
}
