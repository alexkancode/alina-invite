export interface PhotoAsset {
  id: string;
  name: string;
  path: string;
}

export interface OverlayAsset {
  id: string;
  name: string;
  path: string;
  blendMode: string;
  opacity: number;
}

export interface TabState {
  activeTab: string;
  photoAssets: PhotoAsset[];
  overlayAssets: OverlayAsset[];
}

type Subscriber = (state: TabState) => void;

export class AdminTabManager {
  private state: TabState;
  private subscribers: Set<Subscriber>;
  private validTabs = ['photos', 'overlays'];

  constructor() {
    this.state = {
      activeTab: 'photos',
      photoAssets: [],
      overlayAssets: []
    };
    this.subscribers = new Set();
  }

  getState(): TabState {
    return {
      activeTab: this.state.activeTab,
      photoAssets: [...this.state.photoAssets],
      overlayAssets: [...this.state.overlayAssets]
    };
  }

  setActiveTab(tabId: string): void {
    if (!this.validTabs.includes(tabId)) {
      throw new Error(`Invalid tab name: ${tabId}`);
    }

    this.state.activeTab = tabId;
    this.notifySubscribers();
  }

  updatePhotoAssets(assets: PhotoAsset[]): void {
    this.validatePhotoAssets(assets);
    this.state.photoAssets = [...assets];
    this.notifySubscribers();
  }

  updateOverlayAssets(assets: OverlayAsset[]): void {
    this.validateOverlayAssets(assets);
    this.state.overlayAssets = [...assets];
    this.notifySubscribers();
  }

  subscribe(subscriber: Subscriber): () => void {
    this.subscribers.add(subscriber);

    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  private notifySubscribers(): void {
    const currentState = this.getState();
    this.subscribers.forEach(subscriber => {
      subscriber(currentState);
    });
  }

  private validatePhotoAssets(assets: PhotoAsset[]): void {
    for (const asset of assets) {
      if (!asset.id || !asset.name || !asset.path) {
        throw new Error('Invalid asset structure: missing required fields');
      }
    }
  }

  private validateOverlayAssets(assets: OverlayAsset[]): void {
    for (const asset of assets) {
      if (!asset.id || !asset.name || !asset.path || !asset.blendMode || typeof asset.opacity !== 'number') {
        throw new Error('Invalid asset structure: missing required fields');
      }
    }
  }
}