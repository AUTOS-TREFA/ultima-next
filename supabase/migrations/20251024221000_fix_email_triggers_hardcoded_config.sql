-- Migration: Fix email notification triggers with hardcoded configuration
-- This fixes the permission denied error by hardcoding the Supabase URL and anon key

-- Function to send email notification for application status changes
CREATE OR REPLACE FUNCTION public.notify_application_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email text;
    user_name text;
    user_first_name text;
    vehicle_title text;
    old_status_label text;
    new_status_label text;
    status_url text;
BEGIN
    -- Only send notification if status actually changed
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        -- Get user information
        SELECT
            p.email,
            COALESCE(p.first_name || ' ' || p.last_name, p.email),
            COALESCE(p.first_name, 'Cliente')
        INTO user_email, user_name, user_first_name
        FROM public.profiles p
        WHERE p.id = NEW.user_id;

        -- Get vehicle title if available
        vehicle_title := COALESCE(NEW.car_info->>'_vehicleTitle', 'Tu vehículo');

        -- Create status URL
        status_url := 'https://trefa.mx/escritorio/solicitudes';

        -- Map status codes to labels
        old_status_label := CASE OLD.status
            WHEN 'draft' THEN 'Borrador'
            WHEN 'submitted' THEN 'Enviada'
            WHEN 'reviewing' THEN 'En Revisión'
            WHEN 'pending_docs' THEN 'Documentos Pendientes'
            WHEN 'approved' THEN 'Aprobada'
            WHEN 'rejected' THEN 'Rechazada'
            ELSE OLD.status
        END;

        new_status_label := CASE NEW.status
            WHEN 'draft' THEN 'Borrador'
            WHEN 'submitted' THEN 'Enviada'
            WHEN 'reviewing' THEN 'En Revisión'
            WHEN 'pending_docs' THEN 'Documentos Pendientes'
            WHEN 'approved' THEN 'Aprobada'
            WHEN 'rejected' THEN 'Rechazada'
            ELSE NEW.status
        END;

        -- Call the Edge Function to send email (async, fire and forget)
        PERFORM
            net.http_post(
                url := 'https://pemgwyymodlwabaexxrb.supabase.co/functions/v1/send-brevo-email',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlbWd3eXltb2Rsd2FiYWV4eHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTE1MTYsImV4cCI6MjA3ODU2NzUxNn0.DZ5YDQpTjpWs3RXqzTzQjy4FZmrwGUqTjKkQjgc9XTw'
                ),
                body := jsonb_build_object(
                    'to', user_email,
                    'toName', user_name,
                    'subject', 'Actualización de tu Solicitud - Trefa Autos',
                    'templateType', 'status_changed',
                    'templateData', jsonb_build_object(
                        'clientName', user_first_name,
                        'vehicleTitle', vehicle_title,
                        'oldStatus', OLD.status,
                        'oldStatusLabel', old_status_label,
                        'newStatus', NEW.status,
                        'newStatusLabel', new_status_label,
                        'statusUrl', status_url
                    )
                )
            );
    END IF;

    RETURN NEW;
END;
$$;

-- Function to send email notification for document status changes
CREATE OR REPLACE FUNCTION public.notify_document_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email text;
    user_name text;
    user_first_name text;
    documents_url text;
BEGIN
    -- Only send notification if status actually changed and it's not the initial insert
    IF NEW.status IS DISTINCT FROM OLD.status AND OLD.status IS NOT NULL THEN
        -- Get user information
        SELECT
            p.email,
            COALESCE(p.first_name || ' ' || p.last_name, p.email),
            COALESCE(p.first_name, 'Cliente')
        INTO user_email, user_name, user_first_name
        FROM public.profiles p
        WHERE p.id = NEW.user_id;

        -- Create documents URL
        documents_url := 'https://trefa.mx/escritorio/solicitudes';

        -- Call the Edge Function to send email (async, fire and forget)
        PERFORM
            net.http_post(
                url := 'https://pemgwyymodlwabaexxrb.supabase.co/functions/v1/send-brevo-email',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlbWd3eXltb2Rsd2FiYWV4eHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTE1MTYsImV4cCI6MjA3ODU2NzUxNn0.DZ5YDQpTjpWs3RXqzTzQjy4FZmrwGUqTjKkQjgc9XTw'
                ),
                body := jsonb_build_object(
                    'to', user_email,
                    'toName', user_name,
                    'subject', 'Actualización de Documento - Trefa Autos',
                    'templateType', 'document_status_changed',
                    'templateData', jsonb_build_object(
                        'clientName', user_first_name,
                        'documentName', NEW.file_name,
                        'documentType', NEW.document_type,
                        'documentStatus', NEW.status,
                        'documentsUrl', documents_url
                    )
                )
            );
    END IF;

    RETURN NEW;
END;
$$;

-- Function to send email notification when application is submitted
CREATE OR REPLACE FUNCTION public.notify_application_submitted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email text;
    user_name text;
    user_first_name text;
    vehicle_title text;
    status_url text;
BEGIN
    -- Only send notification when status changes FROM draft TO submitted
    IF OLD.status = 'draft' AND NEW.status = 'submitted' THEN
        -- Get user information
        SELECT
            p.email,
            COALESCE(p.first_name || ' ' || p.last_name, p.email),
            COALESCE(p.first_name, 'Cliente')
        INTO user_email, user_name, user_first_name
        FROM public.profiles p
        WHERE p.id = NEW.user_id;

        -- Get vehicle title if available
        vehicle_title := COALESCE(NEW.car_info->>'_vehicleTitle', '');

        -- Create status URL
        status_url := 'https://trefa.mx/escritorio/solicitudes';

        -- Call the Edge Function to send email (async, fire and forget)
        PERFORM
            net.http_post(
                url := 'https://pemgwyymodlwabaexxrb.supabase.co/functions/v1/send-brevo-email',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlbWd3eXltb2Rsd2FiYWV4eHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTE1MTYsImV4cCI6MjA3ODU2NzUxNn0.DZ5YDQpTjpWs3RXqzTzQjy4FZmrwGUqTjKkQjgc9XTw'
                ),
                body := jsonb_build_object(
                    'to', user_email,
                    'toName', user_name,
                    'subject', '¡Solicitud Recibida! - Trefa Autos',
                    'templateType', 'application_submitted',
                    'templateData', jsonb_build_object(
                        'clientName', user_first_name,
                        'vehicleTitle', vehicle_title,
                        'submittedAt', NEW.updated_at,
                        'statusUrl', status_url
                    )
                )
            );
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.notify_application_status_change() IS 'Sends email notification when application status changes (hardcoded config)';
COMMENT ON FUNCTION public.notify_document_status_change() IS 'Sends email notification when document status changes (hardcoded config)';
COMMENT ON FUNCTION public.notify_application_submitted() IS 'Sends email notification when application is submitted (hardcoded config)';
