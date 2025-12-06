import { supabase } from '../../supabaseClient';

export interface JourneyStep {
  id?: string;
  journey_id?: string;
  step_order: number;
  step_name: string;
  step_description?: string;
  page_route: string;
  page_title?: string;
  event_type: string;
  event_name: string;
  event_description?: string;
  trigger_type?: 'pageview' | 'button_click' | 'form_submit' | 'custom' | 'scroll' | 'time_on_page' | 'element_visible' | 'video_play';
  trigger_selector?: string;
  trigger_conditions?: Record<string, any>;
  event_metadata?: Record<string, any>;
  // Button identifier fields for button_click trigger type
  button_identifier_type?: 'text_contains' | 'css_id' | 'css_class' | 'css_selector';
  button_identifier?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerJourney {
  id?: string;
  name: string;
  route: string;
  landing_page: string;
  description?: string;
  status: 'active' | 'draft' | 'paused';
  is_active?: boolean;
  auto_tracking_enabled?: boolean;
  gtm_enabled?: boolean;
  facebook_pixel_enabled?: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  steps?: JourneyStep[];
}

export class CustomerJourneyService {
  /**
   * Get all customer journeys
   */
  static async getAllJourneys(): Promise<CustomerJourney[]> {
    const { data, error } = await supabase
      .from('customer_journeys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer journeys:', error);
      throw error;
    }

    // Fetch steps for each journey
    const journeysWithSteps = await Promise.all(
      (data || []).map(async (journey) => {
        const steps = await this.getJourneySteps(journey.id);
        return {
          ...journey,
          steps,
          is_active: journey.status === 'active'
        };
      })
    );

    return journeysWithSteps;
  }

  /**
   * Get active customer journeys only
   */
  static async getActiveJourneys(): Promise<CustomerJourney[]> {
    try {
      const { data, error } = await supabase.rpc('get_active_customer_journeys');

      if (error) {
        console.error('Error fetching active journeys:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getActiveJourneys:', error);
      // Fallback to direct query
      const { data } = await supabase
        .from('customer_journeys')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (data) {
        const journeysWithSteps = await Promise.all(
          data.map(async (journey) => {
            const steps = await this.getJourneySteps(journey.id);
            return {
              ...journey,
              steps,
              is_active: true
            };
          })
        );
        return journeysWithSteps;
      }

      return [];
    }
  }

  /**
   * Get a specific journey with its steps
   */
  static async getJourneyById(journeyId: string): Promise<CustomerJourney | null> {
    const { data: journey, error } = await supabase
      .from('customer_journeys')
      .select('*')
      .eq('id', journeyId)
      .single();

    if (error) {
      console.error('Error fetching journey:', error);
      throw error;
    }

    if (!journey) return null;

    const steps = await this.getJourneySteps(journeyId);
    return {
      ...journey,
      steps,
      is_active: journey.status === 'active'
    };
  }

  /**
   * Get steps for a specific journey
   */
  static async getJourneySteps(journeyId: string): Promise<JourneyStep[]> {
    const { data, error } = await supabase
      .from('journey_steps')
      .select('*')
      .eq('journey_id', journeyId)
      .order('step_order', { ascending: true });

    if (error) {
      console.error('Error fetching journey steps:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Create a new customer journey
   */
  static async createJourney(
    journey: Omit<CustomerJourney, 'id' | 'created_at' | 'updated_at'>,
    steps: Omit<JourneyStep, 'id' | 'journey_id' | 'created_at' | 'updated_at'>[]
  ): Promise<CustomerJourney> {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Insert journey
    const { data: newJourney, error: journeyError } = await supabase
      .from('customer_journeys')
      .insert([{
        ...journey,
        created_by: user?.id,
        auto_tracking_enabled: journey.auto_tracking_enabled ?? true,
        gtm_enabled: journey.gtm_enabled ?? true,
        facebook_pixel_enabled: journey.facebook_pixel_enabled ?? true
      }])
      .select()
      .single();

    if (journeyError) {
      console.error('Error creating journey:', journeyError);
      throw journeyError;
    }

    // Insert steps
    if (steps.length > 0) {
      const stepsWithJourneyId = steps.map(step => ({
        ...step,
        journey_id: newJourney.id,
        trigger_type: step.trigger_type || 'pageview',
        event_metadata: step.event_metadata || {}
      }));

      const { data: newSteps, error: stepsError } = await supabase
        .from('journey_steps')
        .insert(stepsWithJourneyId)
        .select();

      if (stepsError) {
        console.error('Error creating journey steps:', stepsError);
        // Rollback journey creation
        await supabase.from('customer_journeys').delete().eq('id', newJourney.id);
        throw stepsError;
      }

      return {
        ...newJourney,
        steps: newSteps,
        is_active: newJourney.status === 'active'
      };
    }

    return {
      ...newJourney,
      steps: [],
      is_active: newJourney.status === 'active'
    };
  }

  /**
   * Update a customer journey
   */
  static async updateJourney(
    journeyId: string,
    updates: Partial<CustomerJourney>
  ): Promise<CustomerJourney> {
    const { steps, ...journeyUpdates } = updates;

    // Update journey
    const { data: updatedJourney, error: journeyError } = await supabase
      .from('customer_journeys')
      .update(journeyUpdates)
      .eq('id', journeyId)
      .select()
      .single();

    if (journeyError) {
      console.error('Error updating journey:', journeyError);
      throw journeyError;
    }

    // If steps are provided, update them
    if (steps) {
      await this.updateJourneySteps(journeyId, steps);
    }

    const updatedSteps = await this.getJourneySteps(journeyId);
    return {
      ...updatedJourney,
      steps: updatedSteps,
      is_active: updatedJourney.status === 'active'
    };
  }

  /**
   * Update journey steps (delete old ones and insert new ones)
   */
  static async updateJourneySteps(
    journeyId: string,
    steps: JourneyStep[]
  ): Promise<void> {
    // Delete existing steps
    await supabase
      .from('journey_steps')
      .delete()
      .eq('journey_id', journeyId);

    // Insert new steps
    if (steps.length > 0) {
      const stepsWithJourneyId = steps.map(step => ({
        ...step,
        journey_id: journeyId,
        id: undefined // Remove id if present to let DB generate new ones
      }));

      const { error } = await supabase
        .from('journey_steps')
        .insert(stepsWithJourneyId);

      if (error) {
        console.error('Error updating journey steps:', error);
        throw error;
      }
    }
  }

  /**
   * Delete a customer journey (cascades to steps)
   */
  static async deleteJourney(journeyId: string): Promise<void> {
    const { error } = await supabase
      .from('customer_journeys')
      .delete()
      .eq('id', journeyId);

    if (error) {
      console.error('Error deleting journey:', error);
      throw error;
    }
  }

  /**
   * Toggle journey status (active/paused)
   */
  static async toggleJourneyStatus(journeyId: string): Promise<CustomerJourney> {
    // Get current status
    const journey = await this.getJourneyById(journeyId);
    if (!journey) throw new Error('Journey not found');

    const newStatus = journey.status === 'active' ? 'paused' : 'active';

    return this.updateJourney(journeyId, { status: newStatus });
  }

  /**
   * Activate a journey
   */
  static async activateJourney(journeyId: string): Promise<CustomerJourney> {
    return this.updateJourney(journeyId, { status: 'active' });
  }

  /**
   * Get journey by route (useful for tracking)
   */
  static async getJourneyByRoute(route: string): Promise<CustomerJourney | null> {
    const { data: journey, error } = await supabase
      .from('customer_journeys')
      .select('*')
      .eq('route', route)
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      console.error('Error fetching journey by route:', error);
      throw error;
    }

    if (!journey) return null;

    const steps = await this.getJourneySteps(journey.id);
    return {
      ...journey,
      steps,
      is_active: true
    };
  }
}

export default CustomerJourneyService;
