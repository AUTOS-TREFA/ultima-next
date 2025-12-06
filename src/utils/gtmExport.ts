import type { CustomerJourney, JourneyStep } from '@/services/CustomerJourneyService';

export interface GTMTag {
  accountId: string;
  containerId: string;
  tagId: string;
  name: string;
  type: string;
  parameter: Array<{
    type: string;
    key: string;
    value: string;
  }>;
  firingTriggerId: string[];
  tagFiringOption: string;
}

export interface GTMTrigger {
  accountId: string;
  containerId: string;
  triggerId: string;
  name: string;
  type: string;
  filter?: Array<{
    type: string;
    parameter: Array<{
      type: string;
      key: string;
      value: string;
    }>;
  }>;
  customEventFilter?: Array<{
    type: string;
    parameter: Array<{
      type: string;
      key: string;
      value: string;
    }>;
  }>;
}

export interface GTMExportData {
  exportFormatVersion: number;
  exportTime: string;
  containerVersion: {
    path: string;
    accountId: string;
    containerId: string;
    containerVersionId: string;
    name: string;
    description: string;
    tag: GTMTag[];
    trigger: GTMTrigger[];
    variable: any[];
  };
}

/**
 * Generates GTM-compatible JSON export for a customer journey
 */
export function exportJourneyToGTM(journey: CustomerJourney): GTMExportData {
  const timestamp = new Date().toISOString();
  const accountId = 'ACCOUNT_ID'; // Placeholder
  const containerId = 'CONTAINER_ID'; // Placeholder

  const tags: GTMTag[] = [];
  const triggers: GTMTrigger[] = [];

  journey.steps?.forEach((step, index) => {
    const triggerId = `trigger_${journey.id}_step_${step.step_order}`;
    const tagId = `tag_${journey.id}_step_${step.step_order}`;

    // Create trigger based on trigger type
    const trigger: GTMTrigger = {
      accountId,
      containerId,
      triggerId,
      name: `${journey.name} - ${step.step_name}`,
      type: getTriggerType(step.trigger_type || 'pageview'),
    };

    // Add trigger filters based on type
    if (step.trigger_type === 'pageview') {
      trigger.filter = [
        {
          type: 'equals',
          parameter: [
            { type: 'template', key: 'arg0', value: '{{Page Path}}' },
            { type: 'template', key: 'arg1', value: step.page_route }
          ]
        }
      ];
    } else if (step.trigger_type === 'button_click' && step.trigger_selector) {
      trigger.filter = [
        {
          type: 'matchCssSelector',
          parameter: [
            { type: 'template', key: 'arg0', value: '{{Click Element}}' },
            { type: 'template', key: 'arg1', value: step.trigger_selector }
          ]
        }
      ];
    } else if (step.trigger_type === 'form_submit') {
      trigger.filter = [
        {
          type: 'contains',
          parameter: [
            { type: 'template', key: 'arg0', value: '{{Page Path}}' },
            { type: 'template', key: 'arg1', value: step.page_route }
          ]
        }
      ];
    }

    triggers.push(trigger);

    // Create Google Analytics 4 Event tag
    const tag: GTMTag = {
      accountId,
      containerId,
      tagId,
      name: `GA4 - ${step.event_name}`,
      type: 'gaawe', // Google Analytics 4 Event
      parameter: [
        { type: 'template', key: 'eventName', value: step.event_type },
        { type: 'template', key: 'measurementId', value: '{{GA4 Measurement ID}}' },
        {
          type: 'list',
          key: 'eventParameters',
          value: JSON.stringify([
            {
              type: 'map',
              map: [
                { type: 'template', key: 'name', value: 'event_category' },
                { type: 'template', key: 'value', value: 'customer_journey' }
              ]
            },
            {
              type: 'map',
              map: [
                { type: 'template', key: 'name', value: 'journey_name' },
                { type: 'template', key: 'value', value: journey.name }
              ]
            },
            {
              type: 'map',
              map: [
                { type: 'template', key: 'name', value: 'step_name' },
                { type: 'template', key: 'value', value: step.step_name }
              ]
            },
            {
              type: 'map',
              map: [
                { type: 'template', key: 'name', value: 'step_order' },
                { type: 'template', key: 'value', value: step.step_order.toString() }
              ]
            }
          ])
        }
      ],
      firingTriggerId: [triggerId],
      tagFiringOption: 'oncePerEvent'
    };

    tags.push(tag);
  });

  return {
    exportFormatVersion: 2,
    exportTime: timestamp,
    containerVersion: {
      path: `accounts/${accountId}/containers/${containerId}/versions/0`,
      accountId,
      containerId,
      containerVersionId: '0',
      name: `${journey.name} - Customer Journey`,
      description: `Auto-generated GTM configuration for ${journey.name} customer journey. Created on ${new Date().toLocaleDateString()}.`,
      tag: tags,
      trigger: triggers,
      variable: []
    }
  };
}

/**
 * Maps journey trigger types to GTM trigger types
 */
function getTriggerType(triggerType: string): string {
  switch (triggerType) {
    case 'pageview':
      return 'pageview';
    case 'button_click':
      return 'click';
    case 'form_submit':
      return 'formSubmission';
    case 'custom':
      return 'customEvent';
    default:
      return 'pageview';
  }
}

/**
 * Generates a simplified event tracking configuration for manual implementation
 */
export function exportJourneyEventsSimplified(journey: CustomerJourney): string {
  const events = journey.steps?.map(step => ({
    step_order: step.step_order,
    step_name: step.step_name,
    event_type: step.event_type,
    event_name: step.event_name,
    page_route: step.page_route,
    trigger_type: step.trigger_type,
    trigger_selector: step.trigger_selector,
    description: step.step_description
  })) || [];

  return JSON.stringify({
    journey_name: journey.name,
    journey_route: journey.route,
    landing_page: journey.landing_page,
    description: journey.description,
    events,
    tracking_config: {
      auto_tracking_enabled: journey.auto_tracking_enabled,
      gtm_enabled: journey.gtm_enabled,
      facebook_pixel_enabled: journey.facebook_pixel_enabled
    }
  }, null, 2);
}

/**
 * Downloads the GTM export as a JSON file
 */
export function downloadGTMExport(journey: CustomerJourney) {
  const gtmData = exportJourneyToGTM(journey);
  const blob = new Blob([JSON.stringify(gtmData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `gtm-${journey.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads the simplified events configuration as a JSON file
 */
export function downloadEventsJSON(journey: CustomerJourney) {
  const eventsData = exportJourneyEventsSimplified(journey);
  const blob = new Blob([eventsData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `events-${journey.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
