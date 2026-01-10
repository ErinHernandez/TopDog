// User Metrics System for Research and Caching Optimization
import { auth } from './firebase';

class UserMetrics {
  constructor() {
    this.metricsKey = 'topdog_user_metrics';
    this.draftCompletionKey = 'topdog_last_draft_completion';
    this.exposureDataKey = 'topdog_exposure_data_cache';
    this.exposureTimestampKey = 'topdog_exposure_data_timestamp';
    this.userId = this.generateUserId();
    this.sessionId = this.generateSessionId();
  }

  // Generate persistent user ID
  generateUserId() {
    try {
      if (typeof window === 'undefined') return null;
      
      let userId = localStorage.getItem('topdog_user_id');
      if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('topdog_user_id', userId);
      }
      return userId;
    } catch (error) {
      return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
  }

  // Generate session ID
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Collect comprehensive personal identifiers
  collectPersonalIdentifiers() {
    try {
      if (typeof window === 'undefined') return {};
      
      return {
        userId: this.userId,
        sessionId: this.sessionId,
        persistentId: this.getPersistentId(),
        email: this.getStoredEmail(),
        username: this.getStoredUsername(),
        phoneNumber: this.getStoredPhone(),
        ipAddress: this.getStoredIP(),
        socialMediaIds: this.getSocialMediaIds(),
        deviceId: this.getDeviceId(),
        browserId: this.getBrowserId(),
        canvasFingerprint: this.getCanvasFingerprint(),
        webglFingerprint: this.getWebGLFingerprint(),
        audioFingerprint: this.getAudioFingerprint(),
        fontFingerprint: this.getFontFingerprint(),
        timestamp: Date.now()
      };
    } catch (error) {
      return { userId: this.userId, sessionId: this.sessionId, timestamp: Date.now() };
    }
  }

  // Collect session data
  collectSessionData() {
    try {
      if (typeof window === 'undefined') return {};
      
      return {
        sessionId: this.sessionId,
        sessionStartTime: this.sessionStartTime,
        sessionDuration: Date.now() - this.sessionStartTime,
        pageViews: this.getPageViews(),
        userInteractions: this.getUserInteractions(),
        scrollDepth: this.getScrollDepth(),
        timeOnPage: this.getTimeOnPage(),
        mouseMovements: this.getMouseMovements(),
        keyboardEvents: this.getKeyboardEvents(),
        touchEvents: this.getTouchEvents(),
        referrer: document.referrer,
        landingPage: this.landingPage,
        utmParams: this.getUTMParams(),
        timestamp: Date.now()
      };
    } catch (error) {
      return { sessionId: this.sessionId, timestamp: Date.now() };
    }
  }

  // Collect device data
  collectDeviceData() {
    try {
      if (typeof window === 'undefined') return {};
      
      return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        languages: navigator.languages,
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        screenWidth: screen.width,
        screenHeight: screen.height,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth,
        devicePixelRatio: window.devicePixelRatio,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),
        connection: navigator.connection ? {
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt,
          saveData: navigator.connection.saveData
        } : null,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory,
        maxTouchPoints: navigator.maxTouchPoints,
        vendor: navigator.vendor,
        product: navigator.product,
        appName: navigator.appName,
        appVersion: navigator.appVersion,
        buildId: navigator.buildId,
        oscpu: navigator.oscpu,
        plugins: this.getPluginList(),
        mimeTypes: this.getMimeTypeList(),
        timestamp: Date.now()
      };
    } catch (error) {
      return { userAgent: navigator?.userAgent, timestamp: Date.now() };
    }
  }

  // Collect location data
  collectLocationData() {
    try {
      if (typeof window === 'undefined') return {};
      
      return {
        ipLocation: this.getStoredIPLocation(),
        gpsLocation: this.getStoredGPSLocation(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),
        locale: navigator.language,
        country: this.getStoredCountry(),
        region: this.getStoredRegion(),
        city: this.getStoredCity(),
        postalCode: this.getStoredPostalCode(),
        timestamp: Date.now()
      };
    } catch (error) {
      return { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, timestamp: Date.now() };
    }
  }

  // Get comprehensive user fingerprint
  getUserFingerprint() {
    try {
      if (typeof window === 'undefined') return {};
      
      return {
        userId: this.userId,
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        language: navigator.language,
        languages: navigator.languages,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        screenWidth: screen.width,
        screenHeight: screen.height,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),
        connection: navigator.connection ? {
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt
        } : null,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory,
        maxTouchPoints: navigator.maxTouchPoints,
        vendor: navigator.vendor,
        referrer: document.referrer,
        url: window.location.href,
        timestamp: Date.now()
      };
    } catch (error) {
      return { userId: this.userId, sessionId: this.sessionId, timestamp: Date.now() };
    }
  }

  // Get all user metrics
  getMetrics() {
    try {
      if (typeof window === 'undefined') return {};
      const metrics = localStorage.getItem(this.metricsKey);
      return metrics ? JSON.parse(metrics) : {};
    } catch (error) {
      console.warn('Failed to get user metrics:', error);
      return {};
    }
  }

  // Save all user metrics
  saveMetrics(metrics) {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(this.metricsKey, JSON.stringify(metrics));
      
      // Send to analytics immediately
      this.sendToAnalytics('metrics_updated', metrics);
    } catch (error) {
      console.warn('Failed to save user metrics:', error);
    }
  }

  // Record draft completion with full personal data
  recordDraftCompletion(tournamentId, tournamentName, draftId, additionalData = {}) {
    try {
      const metrics = this.getMetrics();
      const timestamp = Date.now();
      const fingerprint = this.getUserFingerprint();
      
      // Update last draft completion with full personal data
      metrics.lastDraftCompletion = {
        timestamp,
        tournamentId,
        tournamentName,
        draftId,
        date: new Date(timestamp).toISOString(),
        userId: this.userId,
        sessionId: this.sessionId,
        userFingerprint: fingerprint,
        ...additionalData
      };

      // Track draft completion history with personal identifiers
      if (!metrics.draftCompletions) {
        metrics.draftCompletions = [];
      }
      
      metrics.draftCompletions.push({
        timestamp,
        tournamentId,
        tournamentName,
        draftId,
        date: new Date(timestamp).toISOString(),
        userId: this.userId,
        sessionId: this.sessionId,
        userFingerprint: fingerprint,
        ...additionalData
      });

      // Keep only last 100 completions for performance
      if (metrics.draftCompletions.length > 100) {
        metrics.draftCompletions = metrics.draftCompletions.slice(-100);
      }

      // Update total drafts completed
      metrics.totalDraftsCompleted = (metrics.totalDraftsCompleted || 0) + 1;
      
      // Update last activity
      metrics.lastActivity = timestamp;

      this.saveMetrics(metrics);
      
      // Send to Google Analytics
      this.sendToGoogleAnalytics('draft_completion', {
        tournament_id: tournamentId,
        tournament_name: tournamentName,
        draft_id: draftId,
        user_id: this.userId,
        session_id: this.sessionId,
        total_drafts: metrics.totalDraftsCompleted,
        ...additionalData
      });

      // Send to external analytics API
      this.sendToAnalytics('draft_completion', {
        tournamentId,
        tournamentName,
        draftId,
        userId: this.userId,
        sessionId: this.sessionId,
        userFingerprint: fingerprint,
        totalDraftsCompleted: metrics.totalDraftsCompleted,
        ...additionalData
      });

      // Also store in session storage for immediate access
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(this.draftCompletionKey, timestamp.toString());
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('Draft completion recorded with full personal data:', {
          tournamentName,
          draftId,
          userId: this.userId,
          sessionId: this.sessionId,
          timestamp
        });
      }

      return metrics;
    } catch (error) {
      console.warn('Failed to record draft completion:', error);
      return null;
    }
  }

  // Get last draft completion time
  getLastDraftCompletion() {
    try {
      const metrics = this.getMetrics();
      return metrics.lastDraftCompletion || null;
    } catch (error) {
      console.warn('Failed to get last draft completion:', error);
      return null;
    }
  }

  // Check if user has completed any drafts recently
  hasRecentDraftActivity(hours = 24) {
    try {
      const lastCompletion = this.getLastDraftCompletion();
      if (!lastCompletion) return false;
      
      const now = Date.now();
      const timeDiff = now - lastCompletion.timestamp;
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      return hoursDiff <= hours;
    } catch (error) {
      console.warn('Failed to check recent draft activity:', error);
      return false;
    }
  }

  // Get exposure data cache
  getExposureDataCache() {
    try {
      if (typeof window === 'undefined') return null;
      const cached = localStorage.getItem(this.exposureDataKey);
      const timestamp = localStorage.getItem(this.exposureDataTimestampKey);
      
      if (cached && timestamp) {
        const cacheTime = parseInt(timestamp);
        const now = Date.now();
        const cacheAge = now - cacheTime;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (cacheAge < maxAge) {
          return JSON.parse(decodeURIComponent(cached));
        } else {
          // Cache expired, clear it
          this.clearExposureDataCache();
        }
      }
      return null;
    } catch (error) {
      console.warn('Failed to get exposure data cache:', error);
      this.clearExposureDataCache();
      return null;
    }
  }

  // Save exposure data cache
  saveExposureDataCache(data) {
    try {
      if (typeof window === 'undefined') return;
      const dataString = encodeURIComponent(JSON.stringify(data));
      const timestamp = Date.now().toString();
      
      localStorage.setItem(this.exposureDataKey, dataString);
      localStorage.setItem(this.exposureDataTimestampKey, timestamp);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Exposure data cached successfully');
      }
    } catch (error) {
      console.warn('Failed to save exposure data cache:', error);
    }
  }

  // Clear exposure data cache
  clearExposureDataCache() {
    try {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(this.exposureDataKey);
      localStorage.removeItem(this.exposureDataTimestampKey);
    } catch (error) {
      console.warn('Failed to clear exposure data cache:', error);
    }
  }

  // Record page visit with full personal data
  recordPageVisit(page, referrer = null) {
    try {
      const metrics = this.getMetrics();
      const timestamp = Date.now();
      const fingerprint = this.getUserFingerprint();
      
      if (!metrics.pageVisits) {
        metrics.pageVisits = [];
      }
      
      metrics.pageVisits.push({
        page,
        referrer,
        timestamp,
        date: new Date(timestamp).toISOString(),
        userId: this.userId,
        sessionId: this.sessionId,
        userFingerprint: fingerprint
      });

      // Keep only last 200 page visits
      if (metrics.pageVisits.length > 200) {
        metrics.pageVisits = metrics.pageVisits.slice(-200);
      }

      metrics.lastActivity = timestamp;
      this.saveMetrics(metrics);

      // Send to Google Analytics
      this.sendToGoogleAnalytics('page_view', {
        page_title: page,
        page_location: window.location.href,
        user_id: this.userId,
        session_id: this.sessionId,
        referrer: referrer
      });

      // Send to external analytics
      this.sendToAnalytics('page_visit', {
        page,
        referrer,
        userId: this.userId,
        sessionId: this.sessionId,
        userFingerprint: fingerprint,
        timestamp
      });
    } catch (error) {
      console.warn('Failed to record page visit:', error);
    }
  }

  // Send data to Google Analytics
  sendToGoogleAnalytics(eventName, parameters) {
    try {
      if (typeof window === 'undefined' || !window.gtag) return;
      
      window.gtag('event', eventName, {
        ...parameters,
        custom_map: {
          'user_id': 'user_id',
          'session_id': 'session_id'
        }
      });
    } catch (error) {
      console.warn('Failed to send to Google Analytics:', error);
    }
  }

  // Send data to external analytics API
  async sendToAnalytics(eventName, data) {
    try {
      if (typeof window === 'undefined') return;
      
      // Get Firebase Auth token if available
      let authToken = null;
      if (auth && auth.currentUser) {
        try {
          authToken = await auth.currentUser.getIdToken();
        } catch (error) {
          // If token fetch fails, continue without auth (for development)
          if (process.env.NODE_ENV === 'development') {
            console.warn('Failed to get auth token for analytics:', error);
          }
        }
      }
      
      // Build headers
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Add Authorization header if we have a token
      const isDevelopment = process.env.NODE_ENV === 'development' || 
                          (typeof window !== 'undefined' && window.location.hostname === 'localhost');
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
        if (isDevelopment) {
          console.debug('[Analytics] Sending request with Firebase auth token');
        }
      } else if (isDevelopment) {
        // Development fallback - use dev-token if Firebase Admin is not configured
        headers['Authorization'] = 'Bearer dev-token';
        console.debug('[Analytics] Sending request with dev-token (no Firebase auth token available)');
      } else {
        if (isDevelopment) {
          console.warn('[Analytics] No auth token available and not in development mode');
        }
      }
      
      // Send to your analytics endpoint
      try {
        const response = await fetch('/api/analytics', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            event: eventName,
            data: data,
            timestamp: Date.now(),
            userId: this.userId,
            sessionId: this.sessionId
          })
        });
        
        // Log non-2xx responses in development for debugging
        if (isDevelopment && !response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          console.warn(`Analytics API returned ${response.status}:`, errorText);
        }
      } catch (error) {
        // Silently fail - don't block user experience
        if (isDevelopment) {
          console.warn('Analytics API call failed:', error);
        }
        // Don't re-throw - silently fail to not block user experience
      }
    } catch (error) {
      // Silently fail
      if (process.env.NODE_ENV === 'development') {
        console.warn('Analytics send error:', error);
      }
    }
  }

  // Get user activity summary with personal identifiers
  getActivitySummary() {
    try {
      const metrics = this.getMetrics();
      const now = Date.now();
      const fingerprint = this.getUserFingerprint();
      
      return {
        userId: this.userId,
        sessionId: this.sessionId,
        userFingerprint: fingerprint,
        totalDraftsCompleted: metrics.totalDraftsCompleted || 0,
        lastDraftCompletion: metrics.lastDraftCompletion,
        lastActivity: metrics.lastActivity,
        daysSinceLastDraft: metrics.lastDraftCompletion ? 
          Math.floor((now - metrics.lastDraftCompletion.timestamp) / (1000 * 60 * 60 * 24)) : null,
        hasRecentActivity: this.hasRecentDraftActivity(),
        totalPageVisits: metrics.pageVisits ? metrics.pageVisits.length : 0,
        lastPageVisit: metrics.pageVisits && metrics.pageVisits.length > 0 ? 
          metrics.pageVisits[metrics.pageVisits.length - 1] : null
      };
    } catch (error) {
      console.warn('Failed to get activity summary:', error);
      return {};
    }
  }

  // Export comprehensive user data (with all personal identifiers)
  exportComprehensiveUserData() {
    try {
      const metrics = this.getMetrics();
      const summary = this.getActivitySummary();
      
      return {
        userId: this.userId,
        sessionId: this.sessionId,
        personalIdentifiers: this.collectPersonalIdentifiers(),
        sessionData: this.collectSessionData(),
        deviceData: this.collectDeviceData(),
        locationData: this.collectLocationData(),
        activitySummary: summary,
        draftCompletions: metrics.draftCompletions || [],
        pageVisits: metrics.pageVisits || [],
        lastActivity: metrics.lastActivity,
        totalDraftsCompleted: metrics.totalDraftsCompleted || 0,
        userFingerprint: this.getUserFingerprint(),
        fullMetrics: metrics, // Include everything
        timestamp: Date.now()
      };
    } catch (error) {
      console.warn('Failed to export comprehensive user data:', error);
      return {};
    }
  }

  // Export metrics for research (with personal identifiers)
  exportMetricsForResearch() {
    try {
      const metrics = this.getMetrics();
      const summary = this.getActivitySummary();
      
      // Include personal identifiers for research
      return {
        userId: this.userId,
        sessionId: this.sessionId,
        userFingerprint: this.getUserFingerprint(),
        activitySummary: summary,
        draftCompletions: metrics.draftCompletions || [],
        pageVisits: metrics.pageVisits || [],
        lastActivity: metrics.lastActivity,
        totalDraftsCompleted: metrics.totalDraftsCompleted || 0,
        fullMetrics: metrics // Include everything
      };
    } catch (error) {
      console.warn('Failed to export metrics for research:', error);
      return {};
    }
  }

  // Helper methods for collecting personal identifiers
  getPersistentId() {
    try {
      let persistentId = localStorage.getItem('topdog_persistent_id');
      if (!persistentId) {
        persistentId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('topdog_persistent_id', persistentId);
      }
      return persistentId;
    } catch (error) {
      return 'user_' + Date.now();
    }
  }

  getStoredEmail() {
    try {
      return localStorage.getItem('topdog_user_email') || 
             sessionStorage.getItem('topdog_user_email') || 
             this.extractEmailFromPage() || null;
    } catch (error) {
      return null;
    }
  }

  getStoredUsername() {
    try {
      return localStorage.getItem('topdog_username') || 
             sessionStorage.getItem('topdog_username') || 
             this.extractUsernameFromPage() || null;
    } catch (error) {
      return null;
    }
  }

  getStoredPhone() {
    try {
      return localStorage.getItem('topdog_phone') || 
             sessionStorage.getItem('topdog_phone') || null;
    } catch (error) {
      return null;
    }
  }

  getStoredIP() {
    try {
      return localStorage.getItem('topdog_ip_address') || null;
    } catch (error) {
      return null;
    }
  }

  getSocialMediaIds() {
    try {
      return {
        facebook: this.extractSocialId('facebook'),
        twitter: this.extractSocialId('twitter'),
        instagram: this.extractSocialId('instagram'),
        linkedin: this.extractSocialId('linkedin')
      };
    } catch (error) {
      return {};
    }
  }

  getDeviceId() {
    try {
      let deviceId = localStorage.getItem('topdog_device_id');
      if (!deviceId) {
        deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('topdog_device_id', deviceId);
      }
      return deviceId;
    } catch (error) {
      return 'device_' + Date.now();
    }
  }

  getBrowserId() {
    try {
      let browserId = localStorage.getItem('topdog_browser_id');
      if (!browserId) {
        browserId = 'browser_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('topdog_browser_id', browserId);
      }
      return browserId;
    } catch (error) {
      return 'browser_' + Date.now();
    }
  }

  getCanvasFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('TopDog fingerprint test', 2, 2);
      return canvas.toDataURL();
    } catch (error) {
      return null;
    }
  }

  getWebGLFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return null;
      
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) return null;
      
      return {
        vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
        renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      };
    } catch (error) {
      return null;
    }
  }

  getAudioFingerprint() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const analyser = audioContext.createAnalyser();
      oscillator.connect(analyser);
      oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      return Array.from(dataArray).slice(0, 10).join(',');
    } catch (error) {
      return null;
    }
  }

  getFontFingerprint() {
    try {
      const fonts = ['Arial', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia'];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const baseString = 'abcdefghijklmnopqrstuvwxyz0123456789';
      
      const fontSizes = fonts.map(font => {
        ctx.font = `12px ${font}`;
        return ctx.measureText(baseString).width;
      });
      
      return fontSizes.join(',');
    } catch (error) {
      return null;
    }
  }

  getPluginList() {
    try {
      return Array.from(navigator.plugins).map(plugin => ({
        name: plugin.name,
        description: plugin.description,
        filename: plugin.filename
      }));
    } catch (error) {
      return [];
    }
  }

  getMimeTypeList() {
    try {
      return Array.from(navigator.mimeTypes).map(mimeType => ({
        type: mimeType.type,
        description: mimeType.description,
        enabledPlugin: mimeType.enabledPlugin?.name
      }));
    } catch (error) {
      return [];
    }
  }

  getPageViews() {
    try {
      return this.pageViews || [];
    } catch (error) {
      return [];
    }
  }

  getUserInteractions() {
    try {
      return this.userInteractions || [];
    } catch (error) {
      return [];
    }
  }

  getScrollDepth() {
    try {
      return this.scrollDepth || 0;
    } catch (error) {
      return 0;
    }
  }

  getTimeOnPage() {
    try {
      return this.timeOnPage || 0;
    } catch (error) {
      return 0;
    }
  }

  getMouseMovements() {
    try {
      return this.mouseMovements || [];
    } catch (error) {
      return [];
    }
  }

  getKeyboardEvents() {
    try {
      return this.keyboardEvents || [];
    } catch (error) {
      return [];
    }
  }

  getTouchEvents() {
    try {
      return this.touchEvents || [];
    } catch (error) {
      return [];
    }
  }

  getUTMParams() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return {
        utm_source: urlParams.get('utm_source'),
        utm_medium: urlParams.get('utm_medium'),
        utm_campaign: urlParams.get('utm_campaign'),
        utm_term: urlParams.get('utm_term'),
        utm_content: urlParams.get('utm_content')
      };
    } catch (error) {
      return {};
    }
  }

  getStoredIPLocation() {
    try {
      return localStorage.getItem('topdog_ip_location') || null;
    } catch (error) {
      return null;
    }
  }

  getStoredGPSLocation() {
    try {
      return localStorage.getItem('topdog_gps_location') || null;
    } catch (error) {
      return null;
    }
  }

  getStoredCountry() {
    try {
      return localStorage.getItem('topdog_country') || null;
    } catch (error) {
      return null;
    }
  }

  getStoredRegion() {
    try {
      return localStorage.getItem('topdog_region') || null;
    } catch (error) {
      return null;
    }
  }

  getStoredCity() {
    try {
      return localStorage.getItem('topdog_city') || null;
    } catch (error) {
      return null;
    }
  }

  getStoredPostalCode() {
    try {
      return localStorage.getItem('topdog_postal_code') || null;
    } catch (error) {
      return null;
    }
  }

  extractEmailFromPage() {
    try {
      // Look for email in various page elements
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const pageText = document.body.innerText;
      const emails = pageText.match(emailRegex);
      return emails ? emails[0] : null;
    } catch (error) {
      return null;
    }
  }

  extractUsernameFromPage() {
    try {
      // Look for username in various page elements
      const usernameElements = document.querySelectorAll('[data-username], .username, #username, [name="username"]');
      for (const element of usernameElements) {
        if (element.textContent || element.value) {
          return element.textContent || element.value;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  extractSocialId(platform) {
    try {
      // Look for social media IDs in meta tags or page content
      const metaTag = document.querySelector(`meta[property="og:${platform}:id"]`);
      if (metaTag) return metaTag.getAttribute('content');
      
      // Look for social links
      const socialLink = document.querySelector(`a[href*="${platform}.com"]`);
      if (socialLink) {
        const href = socialLink.getAttribute('href');
        const match = href.match(/\/([^\/]+)$/);
        return match ? match[1] : null;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  trackUserBehavior(eventType, data) {
    try {
      if (!this.userInteractions) this.userInteractions = [];
      
      this.userInteractions.push({
        eventType,
        data,
        timestamp: Date.now(),
        url: window.location.href,
        userId: this.userId,
        sessionId: this.sessionId
      });

      // Keep only last 1000 interactions
      if (this.userInteractions.length > 1000) {
        this.userInteractions = this.userInteractions.slice(-1000);
      }
    } catch (error) {
      console.warn('Failed to track user behavior:', error);
    }
  }
}

// Create singleton instance
const userMetrics = new UserMetrics();

export default userMetrics;
