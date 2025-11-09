import { marketingConfigService } from './MarketingConfigService';
import { marketingEvents } from './MarketingEventsService';
import { supabase } from '../../supabaseClient';

/**
 * Unified Conversion Tracking Service
 *
 * This service combines:
 * - GTM dataLayer events
 * - Facebook Pixel events
 * - Custom Supabase tracking (via MarketingEventsService)
 *
 * Usage:
 * import { conversionTracking } from '@/services/ConversionTrackingService';
 *
 * // Track a registration
 * conversionTracking.trackRegistration({ userId: '123', email: 'user@email.com' });
 *
 * // Track a form submission
 * conversionTracking.trackFormSubmission('financing_application', { vehicleId: '456' });
 */

export interface ConversionMetadata {
  [key: string]: any;
  userId?: string;
  email?: string;
  vehicleId?: string;
  vehicleName?: string;
  vehiclePrice?: number;
  formName?: string;
  stepNumber?: number;
  stepName?: string;
  applicationId?: string;
  source?: string;
  medium?: string;
  campaign?: string;
}

class ConversionTrackingService {
  private initialized: boolean = false;

  /**
   * Initialize tracking configuration
   * Call this once on app startup
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const config = await marketingConfigService.getConfig();
      if (config) {
        // Initialize GTM if configured
        if (config.gtm_container_id) {
          marketingConfigService.initializeGTM(config.gtm_container_id);
        }

        // Initialize Facebook Pixel if configured
        if (config.facebook_pixel_id) {
          marketingConfigService.initializeFacebookPixel(config.facebook_pixel_id);
        }

        console.log('✅ Conversion tracking initialized with config:', {
          gtm: config.gtm_container_id,
          fb: config.facebook_pixel_id?.substring(0, 5) + '...',
          ga: config.google_analytics_id
        });
        this.initialized = true;
      } else {
        console.warn('⚠️ No marketing config found. Tracking will be limited to Supabase only.');
      }
    } catch (error) {
      console.error('❌ Error initializing conversion tracking:', error);
    }
  }

  /**
   * Track user registration completion
   */
  trackRegistration(metadata: ConversionMetadata = {}): void {
    this.track('CompleteRegistration', 'User Registration Complete', {
      ...metadata,
      page: window.location.pathname
    });
  }

  /**
   * Track lead capture (any form submission that captures lead info)
   */
  trackLead(metadata: ConversionMetadata = {}): void {
    this.track('Lead', 'Lead Captured', {
      ...metadata,
      page: window.location.pathname
    });
  }

  /**
   * Track page view
   */
  trackPageView(pageName?: string, metadata: ConversionMetadata = {}): void {
    this.track('PageView', pageName || document.title, {
      ...metadata,
      url: window.location.href,
      path: window.location.pathname,
      referrer: document.referrer
    });
  }

  /**
   * Track content view (e.g., vehicle detail page)
   */
  trackViewContent(contentName: string, contentType: string, metadata: ConversionMetadata = {}): void {
    this.track('ViewContent', `View ${contentType}: ${contentName}`, {
      ...metadata,
      contentName,
      contentType,
      page: window.location.pathname
    });
  }

  /**
   * Track form submission
   */
  trackFormSubmission(formName: string, metadata: ConversionMetadata = {}): void {
    this.track('Lead', `Form Submitted: ${formName}`, {
      ...metadata,
      formName,
      page: window.location.pathname
    });

    // Also track to existing marketing events service
    marketingEvents.trackFormSubmit(formName, metadata);
  }

  /**
   * Track button click
   */
  trackButtonClick(buttonName: string, metadata: ConversionMetadata = {}): void {
    marketingEvents.trackButtonClick(buttonName, metadata);

    // Push to dataLayer for GTM
    if ((window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'button_click',
        buttonName,
        ...metadata,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Track financing application events
   */
  trackApplication = {
    /**
     * Track when user starts application
     */
    started: (metadata: ConversionMetadata = {}): void => {
      marketingEvents.trackEvent('custom', 'Application Started', {
        ...metadata,
        applicationStage: 'started'
      });
    },

    /**
     * Track application step completion
     */
    stepCompleted: (stepNumber: number, stepName: string, metadata: ConversionMetadata = {}): void => {
      marketingEvents.trackEvent('custom', `Application Step ${stepNumber} Complete: ${stepName}`, {
        ...metadata,
        stepNumber,
        stepName,
        applicationStage: `step_${stepNumber}`
      });
    },

    /**
     * Track application submission - LeadComplete
     * Página: /escritorio/aplicacion
     * Cuándo: Usuario envía su solicitud de financiamiento completa
     */
    submitted: (metadata: ConversionMetadata = {}): void => {
      this.track('LeadComplete', 'Lead Complete', {
        ...metadata,
        page: '/escritorio/aplicacion',
        applicationStage: 'submitted',
        value: metadata.vehiclePrice || 0,
        currency: 'MXN',
        content_name: 'Lead Complete',
        status: 'completed'
      });
    },

    /**
     * Track document upload
     */
    documentUploaded: (documentType: string, metadata: ConversionMetadata = {}): void => {
      marketingEvents.trackEvent('custom', documentType, metadata);
    }
  };

  /**
   * Track authentication events
   */
  trackAuth = {
    /**
     * Track OTP request
     */
    otpRequested: (email: string, metadata: ConversionMetadata = {}): void => {
      marketingEvents.trackEvent('custom', email, {
        ...metadata,
        email
      });
    },

    /**
     * Track OTP verification - InitialRegistration
     * Página: /acceder
     * Cuándo: Usuario verifica código OTP exitosamente
     */
    otpVerified: (userId: string, metadata: ConversionMetadata = {}): void => {
      this.track('InitialRegistration', 'Initial Registration', {
        ...metadata,
        page: '/acceder',
        userId,
        method: 'email_otp',
        content_name: 'Initial Registration',
        status: 'completed'
      });
    },

    /**
     * Track Google sign-in - InitialRegistration
     * Página: /acceder
     * Cuándo: Usuario inicia sesión con Google
     */
    googleSignIn: (metadata: ConversionMetadata = {}): void => {
      this.track('InitialRegistration', 'Initial Registration', {
        ...metadata,
        page: '/acceder',
        method: 'google_oauth',
        content_name: 'Initial Registration',
        status: 'completed'
      });
    },

    /**
     * Track logout
     */
    logout: (metadata: ConversionMetadata = {}): void => {
      marketingEvents.trackEvent('custom', 'user_logout', metadata);
    }
  };

  /**
   * Track profile events
   */
  trackProfile = {
    /**
     * Track profile update - PersonalInformationComplete
     * Página: /escritorio/profile
     * Cuándo: Usuario guarda su información personal
     */
    updated: (metadata: ConversionMetadata = {}): void => {
      this.track('PersonalInformationComplete', 'Personal Information Complete', {
        ...metadata,
        page: '/escritorio/profile',
        content_name: 'Personal Information Complete',
        status: 'completed'
      });
    },

    /**
     * Track bank profiling completion - PerfilacionBancariaComplete
     * Página: /escritorio/perfilacion-bancaria
     * Cuándo: Usuario completa el cuestionario de perfilación bancaria
     */
    bankProfilingCompleted: (recommendedBank: string, metadata: ConversionMetadata = {}): void => {
      this.track('PerfilacionBancariaComplete', 'Perfilacion Bancaria Complete', {
        ...metadata,
        page: '/escritorio/perfilacion-bancaria',
        recommendedBank,
        content_name: 'Perfilacion Bancaria Complete',
        status: 'completed'
      });
    }
  };

  /**
   * Core tracking method - sends to all configured platforms
   */
  private async track(eventType: string, eventName: string, metadata: ConversionMetadata = {}): Promise<void> {
    // Get UTM parameters from sessionStorage
    const leadSourceData = sessionStorage.getItem('leadSourceData');
    let utmParams: any = {};
    if (leadSourceData) {
      try {
        const parsed = JSON.parse(leadSourceData);
        utmParams = {
          utm_source: parsed.utm_source,
          utm_medium: parsed.utm_medium,
          utm_campaign: parsed.utm_campaign,
          utm_term: parsed.utm_term,
          utm_content: parsed.utm_content,
          referrer: parsed.referrer,
          fbclid: parsed.fbclid
        };
      } catch (e) {
        console.warn('Error parsing leadSourceData:', e);
      }
    }

    // Send to GTM dataLayer with UTMs
    if ((window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: eventName.toLowerCase().replace(/\s+/g, '_'),
        eventName: eventName,
        eventType: eventType,
        ...metadata,
        ...utmParams,
        timestamp: new Date().toISOString()
      });
      console.log(`✅ GTM Event: ${eventName}`, { ...metadata, ...utmParams });
    }

    // Send directly to Facebook Pixel with UTMs
    if ((window as any).fbq) {
      (window as any).fbq('track', eventType, {
        content_name: eventName,
        ...metadata,
        ...utmParams
      });
      console.log(`✅ Facebook Pixel Event: ${eventType}`, { ...metadata, ...utmParams });
    }

    // Save to tracking_events table with UTMs
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = sessionStorage.getItem('session_id') || crypto.randomUUID();

      await supabase.from('tracking_events').insert({
        event_name: eventName,
        event_type: eventType,
        user_id: user?.id || null,
        session_id: sessionId,
        metadata: metadata,
        utm_source: utmParams.utm_source || null,
        utm_medium: utmParams.utm_medium || null,
        utm_campaign: utmParams.utm_campaign || null,
        created_at: new Date().toISOString()
      });

      console.log(`✅ Saved to tracking_events with UTMs:`, { eventName, ...utmParams });
    } catch (error) {
      console.error('Error saving to tracking_events:', error);
    }

    // Also track to existing marketing events service (Supabase)
    marketingEvents.trackEvent('custom', eventName, {
      eventType,
      ...metadata,
      ...utmParams
    });

    console.log(`📊 Conversion tracked: ${eventType} - ${eventName}`, { ...metadata, ...utmParams });
  }

  /**
   * Get UTM parameters from current session
   */
  getUTMParameters(): { source: string; medium: string; campaign: string } | null {
    const leadSourceData = sessionStorage.getItem('leadSourceData');
    if (leadSourceData) {
      const parsed = JSON.parse(leadSourceData);
      return {
        source: parsed.utm_source || 'direct',
        medium: parsed.utm_medium || 'none',
        campaign: parsed.utm_campaign || 'none'
      };
    }
    return null;
  }

  /**
   * Test if tracking is working
   */
  test(): void {
    const result = marketingConfigService.testTracking();
    console.group('🧪 Tracking Test Results');
    console.log('Config loaded:', result.config ? '✅' : '❌');
    console.log('GTM active:', result.gtm ? '✅' : '❌');
    console.log('Facebook Pixel active:', result.facebook ? '✅' : '❌');
    console.log('UTM Parameters:', this.getUTMParameters());
    console.groupEnd();

    // Fire test event
    this.trackButtonClick('test_button', {
      test: true,
      timestamp: new Date().toISOString()
    });
  }
}

export const conversionTracking = new ConversionTrackingService();

// Auto-initialize on import
if (typeof window !== 'undefined') {
  conversionTracking.initialize();
}
