/**
 * Service for managing usage limits with real-time updates via WebSocket
 * Replaces constant polling with event-driven updates
 */
class UsageLimitsService {
  constructor() {
    this.limits = null;
    this.listeners = new Set();
    this.isConnected = false;
    this.channel = null;
    this.workspaceId = null;
    this.lastFetch = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * Initialize the service with workspace ID and connect to WebSocket
   */
  async initialize(workspaceId) {
    this.workspaceId = workspaceId;

    // Load initial data from API (cached on server)
    await this.loadInitialLimits();

    // Connect to WebSocket for real-time updates
    this.connectToWebSocket();
  }

  /**
   * Load initial limits data from API (only once or when cache expires)
   */
  async loadInitialLimits() {
    // Check if we have recent cached data
    if (this.limits && this.lastFetch && Date.now() - this.lastFetch < this.cacheTimeout) {
      return this.limits;
    }

    try {
      const response = await fetch('/api/v1/subscription/limits/usage', {
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.limits = await response.json();
      this.lastFetch = Date.now();

      // Notify listeners about initial data
      this.notifyListeners('initial_load');

      return this.limits;
    } catch (error) {
      console.error('Failed to load usage limits:', error);
      throw error;
    }
  }

  /**
   * Connect to WebSocket channel for real-time updates
   */
  connectToWebSocket() {
    if (!window.Echo || !this.workspaceId) {
      console.warn('Echo not available or workspace ID missing');
      return;
    }

    try {
      this.channel = window.Echo.private(`workspace.${this.workspaceId}.limits`);

      this.channel.listen('usage.limits.updated', (data) => {
        console.log('Usage limits updated via WebSocket:', data);

        // Update local limits data
        this.limits = data.limits;
        this.lastFetch = Date.now();

        // Notify all listeners
        this.notifyListeners(data.trigger_action, data);
      });

      this.channel.subscribed(() => {
        this.isConnected = true;
        console.log('Connected to usage limits WebSocket channel');
      });

      this.channel.error((error) => {
        console.error('WebSocket channel error:', error);
        this.isConnected = false;
      });
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.channel) {
      window.Echo.leave(`workspace.${this.workspaceId}.limits`);
      this.channel = null;
      this.isConnected = false;
    }
  }

  /**
   * Get current limits data (from cache, no API call)
   */
  getLimits() {
    return this.limits;
  }

  /**
   * Get specific metric data
   */
  getMetric(metricType) {
    return this.limits?.data?.[metricType] || null;
  }

  /**
   * Check if any limits are reached
   */
  hasLimitsReached() {
    return this.limits?.data?.limits_reached || false;
  }

  /**
   * Check if specific metric can perform action
   */
  canPerformAction(metricType) {
    const metric = this.getMetric(metricType);
    return metric?.can_perform || false;
  }

  /**
   * Get usage percentage for metric
   */
  getUsagePercentage(metricType) {
    const metric = this.getMetric(metricType);
    return metric?.percentage || 0;
  }

  /**
   * Force refresh limits from server
   */
  async forceRefresh() {
    try {
      const response = await fetch('/api/v1/subscription/limits/refresh', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Limits refresh triggered:', result);

      // The updated data will come via WebSocket
      return result;
    } catch (error) {
      console.error('Failed to force refresh limits:', error);
      throw error;
    }
  }

  /**
   * Add listener for limits updates
   */
  addListener(callback) {
    this.listeners.add(callback);

    // If we already have data, call the listener immediately
    if (this.limits) {
      callback(this.limits, 'initial_load');
    }
  }

  /**
   * Remove listener
   */
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Notify all listeners about updates
   */
  notifyListeners(action, data = null) {
    this.listeners.forEach((callback) => {
      try {
        callback(this.limits, action, data);
      } catch (error) {
        console.error('Error in limits listener:', error);
      }
    });
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      hasData: !!this.limits,
      lastFetch: this.lastFetch,
      workspaceId: this.workspaceId,
    };
  }
}

// Create singleton instance
const usageLimitsService = new UsageLimitsService();

export default usageLimitsService;
