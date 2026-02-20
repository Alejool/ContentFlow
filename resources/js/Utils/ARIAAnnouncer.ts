/**
 * ARIAAnnouncer Utility
 * 
 * Manages ARIA live regions for screen reader announcements.
 * Creates polite and assertive live regions that can announce
 * dynamic content updates to assistive technologies.
 * 
 * Requirements: 7.3
 */

type AnnouncementPriority = 'polite' | 'assertive';

interface LiveRegions {
  polite: HTMLDivElement | null;
  assertive: HTMLDivElement | null;
}

class ARIAAnnouncer {
  private liveRegions: LiveRegions = {
    polite: null,
    assertive: null,
  };
  private isInitialized = false;
  private announcementQueue: Array<{ message: string; priority: AnnouncementPriority; timeout?: number }> = [];
  private isProcessing = false;

  /**
   * Initialize and mount live regions to the DOM
   * Should be called once on app initialization
   */
  initialize(): void {
    if (this.isInitialized) {
      return;
    }

    // Create polite live region
    this.liveRegions.polite = this.createLiveRegion('polite');
    
    // Create assertive live region
    this.liveRegions.assertive = this.createLiveRegion('assertive');

    // Mount to document body
    if (typeof document !== 'undefined') {
      document.body.appendChild(this.liveRegions.polite);
      document.body.appendChild(this.liveRegions.assertive);
      this.isInitialized = true;
    }
  }

  /**
   * Create a live region element with proper ARIA attributes
   */
  private createLiveRegion(priority: AnnouncementPriority): HTMLDivElement {
    const region = document.createElement('div');
    
    // Set ARIA attributes
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', priority);
    region.setAttribute('aria-atomic', 'true');
    
    // Visually hidden but accessible to screen readers
    region.style.position = 'absolute';
    region.style.left = '-10000px';
    region.style.width = '1px';
    region.style.height = '1px';
    region.style.overflow = 'hidden';
    
    // Add ID for debugging
    region.id = `aria-live-region-${priority}`;
    
    return region;
  }

  /**
   * Announce a message to screen readers
   * 
   * @param message - The message to announce
   * @param priority - 'polite' (default) or 'assertive'
   * @param timeout - Optional timeout in ms to clear the message (default: 1000ms)
   */
  announce(
    message: string,
    priority: AnnouncementPriority = 'polite',
    timeout: number = 1000
  ): void {
    if (!this.isInitialized) {
      console.warn('ARIAAnnouncer: Not initialized. Call initialize() first.');
      return;
    }

    if (!message || message.trim() === '') {
      return;
    }

    // Add to queue
    this.announcementQueue.push({ message, priority, timeout });
    
    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process announcement queue sequentially
   */
  private async processQueue(): Promise<void> {
    if (this.announcementQueue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const announcement = this.announcementQueue.shift();
    
    if (!announcement) {
      this.isProcessing = false;
      return;
    }

    const { message, priority, timeout } = announcement;
    const region = this.liveRegions[priority];

    if (!region) {
      this.processQueue();
      return;
    }

    // Set the message
    region.textContent = message;

    // Clear after timeout
    if (timeout && timeout > 0) {
      await new Promise(resolve => setTimeout(resolve, timeout));
      region.textContent = '';
      
      // Small delay before next announcement
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Process next in queue
    this.processQueue();
  }

  /**
   * Clear all announcements immediately
   */
  clear(): void {
    if (!this.isInitialized) {
      return;
    }

    // Clear queue
    this.announcementQueue = [];
    this.isProcessing = false;

    // Clear live regions
    if (this.liveRegions.polite) {
      this.liveRegions.polite.textContent = '';
    }
    if (this.liveRegions.assertive) {
      this.liveRegions.assertive.textContent = '';
    }
  }

  /**
   * Check if announcer is active and initialized
   */
  isActive(): boolean {
    return this.isInitialized;
  }

  /**
   * Cleanup and remove live regions from DOM
   * Useful for testing or unmounting
   */
  destroy(): void {
    if (!this.isInitialized) {
      return;
    }

    this.clear();

    // Remove from DOM
    if (this.liveRegions.polite && this.liveRegions.polite.parentNode) {
      this.liveRegions.polite.parentNode.removeChild(this.liveRegions.polite);
    }
    if (this.liveRegions.assertive && this.liveRegions.assertive.parentNode) {
      this.liveRegions.assertive.parentNode.removeChild(this.liveRegions.assertive);
    }

    this.liveRegions = {
      polite: null,
      assertive: null,
    };
    this.isInitialized = false;
  }
}

// Export singleton instance
export const ariaAnnouncer = new ARIAAnnouncer();

// Export class for testing
export { ARIAAnnouncer };
