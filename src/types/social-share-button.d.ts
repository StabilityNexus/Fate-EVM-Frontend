declare module "@aossie-org/social-share-button" {
  export interface ShareOptions {
    container: HTMLElement;
    showButton?: boolean;
    platforms?: string[];
    description?: string;
    theme?: "dark" | "light";
    analytics?: boolean;
  }

  export interface ShareInstance {
    modal: HTMLDivElement | null;
    openModal(): void;
    closeModal(): void;
    destroy(): void;
  }
}

interface Window {
  SocialShareButton?: new (
    options: import("@aossie-org/social-share-button").ShareOptions
  ) => import("@aossie-org/social-share-button").ShareInstance;
}
