-- Enable pg_cron extension if not already enabled
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron extension already exists or cannot be created: %', SQLERRM;
END $$;

-- Remove any existing cron job with the same name (for idempotency)
DO $$
BEGIN
  PERFORM cron.unschedule('send-automated-email-notifications');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No existing cron job to unschedule: %', SQLERRM;
END $$;

-- Schedule the automated email notifications to run daily at 10:00 AM UTC
-- This translates to 4:00 AM CST (Mexico time)
SELECT cron.schedule(
  'send-automated-email-notifications', -- job name
  '0 10 * * *', -- cron schedule: Every day at 10:00 AM UTC (4:00 AM CST)
  $$
  SELECT
    net.http_post(
      url := (SELECT value::text FROM vault.secrets WHERE name = 'SUPABASE_URL') || '/functions/v1/automated-email-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT value::text FROM vault.secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY')
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Verify the cron job was created
SELECT * FROM cron.job WHERE jobname = 'send-automated-email-notifications';

-- Optional: Create a log table to track email notification runs
CREATE TABLE IF NOT EXISTS public.email_notification_logs (
  id BIGSERIAL PRIMARY KEY,
  run_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT,
  results JSONB,
  error TEXT
);

-- Enable RLS on the log table
ALTER TABLE public.email_notification_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to insert logs
CREATE POLICY "Allow service role to insert logs"
  ON public.email_notification_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create policy to allow admins to view logs
CREATE POLICY "Allow authenticated users to view logs"
  ON public.email_notification_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Add helpful comment
COMMENT ON TABLE public.email_notification_logs IS 'Logs for automated email notification runs';
