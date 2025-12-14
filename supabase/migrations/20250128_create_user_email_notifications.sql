-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow service role to insert notifications" ON public.user_email_notifications;
DROP POLICY IF EXISTS "Allow users to view own notifications" ON public.user_email_notifications;
DROP POLICY IF EXISTS "Allow admins to view all notifications" ON public.user_email_notifications;

-- Create table to track individual email notifications sent to users
CREATE TABLE IF NOT EXISTS public.user_email_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL, -- 'incomplete_application', 'incomplete_profile', 'agent_digest', 'welcome', etc.
  subject TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent', -- 'sent', 'failed', 'bounced'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_email_notifications_user_id ON public.user_email_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_email_notifications_email_type ON public.user_email_notifications(email_type);
CREATE INDEX IF NOT EXISTS idx_user_email_notifications_sent_at ON public.user_email_notifications(sent_at DESC);

-- Enable RLS
ALTER TABLE public.user_email_notifications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to insert notifications
CREATE POLICY "Allow service role to insert notifications"
  ON public.user_email_notifications
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create policy to allow authenticated users to view their own notifications
CREATE POLICY "Allow users to view own notifications"
  ON public.user_email_notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'sales')
  ));

-- Create policy to allow admins and sales agents to view all notifications
CREATE POLICY "Allow admins to view all notifications"
  ON public.user_email_notifications
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'sales')
  ));

-- Add helpful comment
COMMENT ON TABLE public.user_email_notifications IS 'Track individual email notifications sent to users';
COMMENT ON COLUMN public.user_email_notifications.email_type IS 'Type of email sent: incomplete_application, incomplete_profile, agent_digest, welcome, etc.';
COMMENT ON COLUMN public.user_email_notifications.metadata IS 'Additional data about the email (application_id, vehicle info, etc.)';
