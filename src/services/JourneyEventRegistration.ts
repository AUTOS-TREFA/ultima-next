import { conversionTracking } from './ConversionTrackingService';
import { CustomerJourneyService, type CustomerJourney, type JourneyStep } from './CustomerJourneyService';

/**
 * Service to register customer journey events with the tracking system
 * This ensures that when a journey is activated, all its events are automatically tracked
 */
export class JourneyEventRegistrationService {
  private registeredJourneys: Set<string> = new Set();

  /**
   * Initialize and register all active journeys
   */
  async initializeActiveJourneys(): Promise<void> {
    try {
      const activeJourneys = await CustomerJourneyService.getActiveJourneys();

      for (const journey of activeJourneys) {
        if (journey.auto_tracking_enabled && journey.id) {
          await this.registerJourneyEvents(journey);
        }
      }

      console.log(`✅ Initialized ${this.registeredJourneys.size} active customer journeys`);
    } catch (error) {
      console.error('❌ Error initializing active journeys:', error);
    }
  }

  /**
   * Register all events for a specific journey
   */
  async registerJourneyEvents(journey: CustomerJourney): Promise<void> {
    if (!journey.id || !journey.steps || journey.steps.length === 0) {
      console.warn('⚠️ Journey has no steps to register:', journey.name);
      return;
    }

    // Skip if already registered
    if (this.registeredJourneys.has(journey.id)) {
      console.log(`ℹ️ Journey "${journey.name}" already registered`);
      return;
    }

    console.log(`📝 Registering journey: ${journey.name} (${journey.steps.length} steps)`);

    // Register each step as a trackable event
    for (const step of journey.steps) {
      this.registerStepEvent(journey, step);
    }

    this.registeredJourneys.add(journey.id);
    console.log(`✅ Registered journey: ${journey.name}`);
  }

  /**
   * Register a single step as a trackable event
   */
  private registerStepEvent(journey: CustomerJourney, step: JourneyStep): void {
    const eventConfig = {
      journeyId: journey.id,
      journeyName: journey.name,
      stepOrder: step.step_order,
      stepName: step.step_name,
      eventType: step.event_type,
      eventName: step.event_name,
      pageRoute: step.page_route,
      triggerType: step.trigger_type,
      triggerSelector: step.trigger_selector,
      metadata: step.event_metadata
    };

    // Set up page view tracking
    if (step.trigger_type === 'pageview') {
      this.setupPageViewTracking(eventConfig);
    }

    // Set up button click tracking
    if (step.trigger_type === 'button_click' && step.trigger_selector) {
      this.setupClickTracking(eventConfig);
    }

    // Set up form submit tracking
    if (step.trigger_type === 'form_submit') {
      this.setupFormSubmitTracking(eventConfig);
    }

    console.log(`  ✓ Registered: ${step.step_name} (${step.event_type})`);
  }

  /**
   * Set up automatic page view tracking for a step
   */
  private setupPageViewTracking(config: any): void {
    // Page view tracking is handled by individual pages
    // This registration ensures the event is known to the system
    if (typeof window !== 'undefined') {
      // Store in window for page-level access
      if (!(window as any).__journeyEvents) {
        (window as any).__journeyEvents = {};
      }
      (window as any).__journeyEvents[config.pageRoute] = {
        eventType: config.eventType,
        eventName: config.eventName,
        stepOrder: config.stepOrder,
        journeyName: config.journeyName
      };
    }
  }

  /**
   * Set up automatic click tracking for buttons/elements
   */
  private setupClickTracking(config: any): void {
    if (typeof window === 'undefined') return;

    // Wait for DOM to be ready
    const setupListener = () => {
      const elements = document.querySelectorAll(config.triggerSelector);

      elements.forEach((element) => {
        // Avoid duplicate listeners
        if ((element as any).__journeyTracked) return;
        (element as any).__journeyTracked = true;

        element.addEventListener('click', () => {
          conversionTracking.trackEvent(config.eventType, config.eventName, {
            journeyId: config.journeyId,
            journeyName: config.journeyName,
            stepOrder: config.stepOrder,
            stepName: config.stepName,
            pageRoute: config.pageRoute,
            triggerType: 'button_click',
            ...config.metadata
          });
        });
      });
    };

    // Try to set up now if DOM is ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setupListener();
    } else {
      document.addEventListener('DOMContentLoaded', setupListener);
    }

    // Also set up on route changes (for SPAs)
    window.addEventListener('popstate', setupListener);
  }

  /**
   * Set up automatic form submit tracking
   */
  private setupFormSubmitTracking(config: any): void {
    if (typeof window === 'undefined') return;

    // Store form submit handler for the page route
    if (!(window as any).__journeyFormHandlers) {
      (window as any).__journeyFormHandlers = {};
    }

    (window as any).__journeyFormHandlers[config.pageRoute] = {
      eventType: config.eventType,
      eventName: config.eventName,
      stepOrder: config.stepOrder,
      journeyName: config.journeyName,
      metadata: config.metadata
    };
  }

  /**
   * Unregister a journey's events
   */
  unregisterJourneyEvents(journeyId: string): void {
    this.registeredJourneys.delete(journeyId);
    console.log(`🗑️ Unregistered journey: ${journeyId}`);
  }

  /**
   * Get all registered journey IDs
   */
  getRegisteredJourneys(): string[] {
    return Array.from(this.registeredJourneys);
  }

  /**
   * Check if a journey is registered
   */
  isJourneyRegistered(journeyId: string): boolean {
    return this.registeredJourneys.has(journeyId);
  }

  /**
   * Re-initialize all journeys (useful after updates)
   */
  async reinitialize(): Promise<void> {
    this.registeredJourneys.clear();
    if (typeof window !== 'undefined') {
      (window as any).__journeyEvents = {};
      (window as any).__journeyFormHandlers = {};
    }
    await this.initializeActiveJourneys();
  }
}

// Export singleton instance
export const journeyEventRegistration = new JourneyEventRegistrationService();

// Auto-initialize on import (browser only)
if (typeof window !== 'undefined') {
  // Initialize after a short delay to ensure everything is loaded
  setTimeout(() => {
    journeyEventRegistration.initializeActiveJourneys();
  }, 1000);
}
