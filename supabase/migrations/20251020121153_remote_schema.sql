

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgsodium";






CREATE SCHEMA IF NOT EXISTS "private";


ALTER SCHEMA "private" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgrouting" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "postgres_fdw" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "tablefunc" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "wrappers" WITH SCHEMA "extensions";






CREATE TYPE "public"."user_role" AS ENUM (
    'user',
    'admin',
    'sales'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE TYPE "public"."user_vehicle_for_sale_status" AS ENUM (
    'draft',
    'in_inspection',
    'listed',
    'sold',
    'rejected'
);


ALTER TYPE "public"."user_vehicle_for_sale_status" OWNER TO "postgres";


CREATE TYPE "public"."vacancy_status" AS ENUM (
    'draft',
    'published',
    'archived'
);


ALTER TYPE "public"."vacancy_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."autos"() RETURNS "json"
    LANGUAGE "sql" STABLE
    AS $$ --
SELECT json_agg(t) FROM private.autos() t; $$;


ALTER FUNCTION "private"."autos"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_advisor"("user_id_to_assign" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    available_advisor_id uuid;
BEGIN
    -- Find the sales advisor with the oldest last_assigned_at timestamp
    SELECT id
    INTO available_advisor_id
    FROM public.profiles
    WHERE role = 'sales'
    ORDER BY last_assigned_at ASC NULLS FIRST
    LIMIT 1;

    -- If an advisor is found, assign them to the user and update their timestamp
    IF available_advisor_id IS NOT NULL THEN
        -- Assign the advisor to the user
        UPDATE public.profiles
        SET asesor_asignado_id = available_advisor_id
        WHERE id = user_id_to_assign;

        -- Update the advisor's last_assigned_at timestamp
        UPDATE public.profiles
        SET last_assigned_at = now()
        WHERE id = available_advisor_id;
    END IF;

    -- Return the ID of the assigned advisor
    RETURN available_advisor_id;
END;
$$;


ALTER FUNCTION "public"."assign_advisor"("user_id_to_assign" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cache_vehicle_data"("vehicle_data" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
  INSERT INTO cache (
    ordencompra, titulo, separado, vendido, autoano, automarca,
    autocombustible, automotor, autosubmarcaversion, autoprecio,
    autotransmision, autogarantia, autokilometraje, enganche,
    mensualidad, pagomensual, plazomax, plazo, feature_image,
    ordenstatus, descripcion, metadescripcion, liga_wp,
    liga_financiamiento_portal, autocilindros, color_exterior,
    color_interior, precio_reduccion, nosiniestros, detalles_esteticos,
    galeria_exterior, galeria_interior, fotos_exterior, fotos_interior,
    fotosinterior, fichatecnica, marcas, models, state, sucursal,
    wordpress_updated_at
  )
  VALUES (
    vehicle_data->>'ordencompra',
    vehicle_data->>'titulo',
    (vehicle_data->>'separado')::boolean,
    (vehicle_data->>'vendido')::boolean,
    (vehicle_data->>'autoano')::integer,
    vehicle_data->>'automarca',
    vehicle_data->>'autocombustible',
    vehicle_data->>'automotor',
    vehicle_data->>'autosubmarcaversion',
    (vehicle_data->>'autoprecio')::numeric,
    vehicle_data->>'autotransmision',
    vehicle_data->>'autogarantia',
    (vehicle_data->>'autokilometraje')::integer,
    (vehicle_data->>'enganche')::numeric,
    (vehicle_data->>'mensualidad')::numeric,
    (vehicle_data->>'pagomensual')::numeric,
    (vehicle_data->>'plazomax')::integer,
    vehicle_data->>'plazo',
    vehicle_data->>'feature_image',
    vehicle_data->>'ordenstatus',
    vehicle_data->>'descripcion',
    vehicle_data->>'metadescripcion',
    vehicle_data->>'liga_wp',
    vehicle_data->>'liga_financiamiento_portal',
    vehicle_data->>'autocilindros',
    vehicle_data->>'color_exterior',
    vehicle_data->>'color_interior',
    vehicle_data->>'precio_reduccion',
    vehicle_data->>'nosiniestros',
    vehicle_data->>'detalles_esteticos',
    (vehicle_data->>'galeria_exterior')::integer[],
    (vehicle_data->>'galeria_interior')::integer[],
    (vehicle_data->>'fotos_exterior')::text[],
    (vehicle_data->>'fotos_interior')::text[],
    vehicle_data->>'fotosinterior',
    vehicle_data->'fichatecnica',
    (vehicle_data->>'marcas')::text[],
    (vehicle_data->>'models')::text[],
    (vehicle_data->>'state')::text[],
    (vehicle_data->>'sucursal')::text[],
    now()
  )
  ON CONFLICT (ordencompra) 
  DO UPDATE SET
    titulo = EXCLUDED.titulo,
    separado = EXCLUDED.separado,
    vendido = EXCLUDED.vendido,
    autoano = EXCLUDED.autoano,
    automarca = EXCLUDED.automarca,
    autocombustible = EXCLUDED.autocombustible,
    automotor = EXCLUDED.automotor,
    autosubmarcaversion = EXCLUDED.autosubmarcaversion,
    autoprecio = EXCLUDED.autoprecio,
    autotransmision = EXCLUDED.autotransmision,
    autogarantia = EXCLUDED.autogarantia,
    autokilometraje = EXCLUDED.autokilometraje,
    enganche = EXCLUDED.enganche,
    mensualidad = EXCLUDED.mensualidad,
    pagomensual = EXCLUDED.pagomensual,
    plazomax = EXCLUDED.plazomax,
    plazo = EXCLUDED.plazo,
    feature_image = EXCLUDED.feature_image,
    ordenstatus = EXCLUDED.ordenstatus,
    descripcion = EXCLUDED.descripcion,
    metadescripcion = EXCLUDED.metadescripcion,
    liga_wp = EXCLUDED.liga_wp,
    liga_financiamiento_portal = EXCLUDED.liga_financiamiento_portal,
    autocilindros = EXCLUDED.autocilindros,
    color_exterior = EXCLUDED.color_exterior,
    color_interior = EXCLUDED.color_interior,
    precio_reduccion = EXCLUDED.precio_reduccion,
    nosiniestros = EXCLUDED.nosiniestros,
    detalles_esteticos = EXCLUDED.detalles_esteticos,
    galeria_exterior = EXCLUDED.galeria_exterior,
    galeria_interior = EXCLUDED.galeria_interior,
    fotos_exterior = EXCLUDED.fotos_exterior,
    fotos_interior = EXCLUDED.fotos_interior,
    fotosinterior = EXCLUDED.fotosinterior,
    fichatecnica = EXCLUDED.fichatecnica,
    marcas = EXCLUDED.marcas,
    models = EXCLUDED.models,
    state = EXCLUDED.state,
    sucursal = EXCLUDED.sucursal,
    wordpress_updated_at = EXCLUDED.wordpress_updated_at,
    updated_at = now();
END;$$;


ALTER FUNCTION "public"."cache_vehicle_data"("vehicle_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_user_onboarding"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.profiles
  SET has_completed_onboarding = TRUE
  WHERE id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."complete_user_onboarding"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."copy_all_thumbnails_to_inventario"() RETURNS integer
    LANGUAGE "sql"
    AS $$
  WITH src AS (
    SELECT
      vc.ordencompra,
      vc.thumbnail,
      COALESCE(vc.thumbnail_webp, vc.thumnbnail_webp) AS thumbnail_webp,
      vc.feature_image,
      vc.viewCount
    FROM public.vehicles_cache vc
    WHERE vc.ordencompra IS NOT NULL AND btrim(vc.ordencompra) <> ''
  ),
  upd AS (
    UPDATE public.inventario_cache ic
       SET thumbnail = s.thumbnail,
           thumbnail_webp = s.thumbnail_webp,
           feature_image = s.feature_image,
           viewCount = s.viewCount,
           updated_at = now()
      FROM src s
     WHERE ic.ordencompra = s.ordencompra
     RETURNING 1
  )
  SELECT COUNT(*)::int FROM upd;
$$;


ALTER FUNCTION "public"."copy_all_thumbnails_to_inventario"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."copy_inventario_to_cache"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $_$
declare
  cols text;         -- comma-separated column list excluding record_id
  set_list text;     -- "col = excluded.col, ..." excluding record_id
begin
  -- Ensure destination table exists with same structure (including indexes/constraints)
  execute $ddl$
    create table if not exists public.cache (like private.inventario including all)
  $ddl$;

  -- Build list of columns excluding the conflict key
  select string_agg(quote_ident(column_name), ', ')
    into cols
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'cache'
    and column_name <> 'record_id';

  -- Build SET list for update
  select string_agg(format('%1$s = excluded.%1$s', quote_ident(column_name)), ', ')
    into set_list
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'cache'
    and column_name <> 'record_id';

  -- Safety: if table has only record_id, nothing to update
  if set_list is null then
    set_list := '';
  end if;

  -- Perform upsert dynamically
  execute format(
    'insert into public.cache select * from private.inventario
     on conflict (%1$s) do update set %2$s
     where public.cache.%1$s = excluded.%1$s;',
    'record_id',
    set_list
  );
end;
$_$;


ALTER FUNCTION "public"."copy_inventario_to_cache"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  SELECT auth.uid();
$$;


ALTER FUNCTION "public"."current_user_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_empty_ordencompra_comprado"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  DELETE FROM public.inventario_cache ic
  WHERE ic.ordenstatus = 'comprado'
    AND (ic.ordencompra IS NULL OR btrim(ic.ordencompra) = '');
END;
$$;


ALTER FUNCTION "public"."delete_empty_ordencompra_comprado"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."expand_cache_from_data"("p_only_missing" boolean DEFAULT false) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
/*
  Expands jsonb "data" into matching scalar columns in public.cache.
  - p_only_missing=true updates only NULL columns.
  - Returns number of rows updated.
*/
DECLARE
  col RECORD;
  sql text := '';
  set_clauses text := '';
  updated_count integer;
BEGIN
  -- Build SET clauses for all matching scalar columns
  FOR col IN
    SELECT
      c.column_name,
      format_type(a.atttypid, a.atttypmod) AS full_type,
      c.data_type
    FROM information_schema.columns c
    JOIN pg_catalog.pg_attribute a
      ON a.attrelid = 'public.cache'::regclass
     AND a.attname = c.column_name
     AND a.attnum > 0
     AND NOT a.attisdropped
    WHERE c.table_schema = 'public'
      AND c.table_name = 'cache'
      AND c.column_name NOT IN ('data', 'updated_at')  -- skip jsonb and audit
      AND c.data_type NOT IN ('json', 'jsonb')         -- skip complex
  LOOP
    -- For arrays/complex types you can add handling later; here we do scalars
    set_clauses := set_clauses || CASE
      WHEN set_clauses = '' THEN '' ELSE ', ' END ||
      format(
        '%1$I = COALESCE(' ||
          'CASE WHEN data ? %2$L THEN ' ||
            'CASE WHEN public.try_cast_text(data->>%2$L, %3$L::regtype) IS NULL THEN NULL ' ||
                 'ELSE (public.try_cast_text(data->>%2$L, %3$L::regtype))::%4$s END ' ||
          'ELSE NULL END' ||
          '%5$s, %1$I)',
        col.column_name,
        col.column_name,
        col.full_type,
        col.full_type,
        CASE
          WHEN p_only_missing THEN format(' FILTER (WHERE %1$I IS NULL)', col.column_name)
          ELSE ''
        END
      );
  END LOOP;

  IF set_clauses = '' THEN
    RAISE NOTICE 'No eligible columns to expand.';
    RETURN 0;
  END IF;

  sql := format('UPDATE public.cache SET %s, updated_at = now() WHERE data IS NOT NULL;', set_clauses);

  EXECUTE sql;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$_$;


ALTER FUNCTION "public"."expand_cache_from_data"("p_only_missing" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_auto_with_images"("ident" "text", "by" "text" DEFAULT 'record_id'::"text") RETURNS TABLE("result" "jsonb")
    LANGUAGE "sql" STABLE
    AS $$
WITH base AS (
  SELECT c.* FROM public.autos_normalizados_cache c
  WHERE (CASE WHEN by = 'record_id' THEN c.record_id::text = ident ELSE c.ordencompra = ident END)
  LIMIT 1
), imgs AS (
  SELECT li.id, li.listing_id, li.storage_key, li.role, li.size, li.position, li.metadata, li.created_at
  FROM public.listing_images li
  WHERE li.listing_id::text = (SELECT COALESCE(base.record_id::text, base.ordencompra) FROM base)
  ORDER BY COALESCE(li.position::bigint, EXTRACT(EPOCH FROM li.created_at)::bigint)
), imgs_by_role AS (
  SELECT listing_id,
    jsonb_object_agg(role, images) AS images_by_role,
    jsonb_agg(image_row ORDER BY img_order) AS images_flat
  FROM (
    SELECT listing_id, role,
      jsonb_agg(jsonb_build_object('id', id, 'storage_key', storage_key, 'role', role, 'size', size, 'position', position, 'metadata', metadata, 'created_at', created_at) ORDER BY COALESCE(position::bigint, EXTRACT(EPOCH FROM created_at)::bigint)) AS images,
      jsonb_build_object('id', id, 'storage_key', storage_key, 'role', role, 'size', size, 'position', position, 'metadata', metadata, 'created_at', created_at) AS image_row,
      row_number() OVER (PARTITION BY listing_id ORDER BY COALESCE(position::bigint, EXTRACT(EPOCH FROM created_at)::bigint)) AS img_order
    FROM imgs
    GROUP BY listing_id, role, id, storage_key, role, size, position, metadata, created_at
  ) sub
  GROUP BY listing_id
)
SELECT to_jsonb(b.*) || jsonb_build_object('images_by_role', COALESCE(ibr.images_by_role, '{}'::jsonb), 'images', COALESCE(ibr.images_flat, '[]'::jsonb)) AS result
FROM base b
LEFT JOIN imgs_by_role ibr ON ibr.listing_id::text = b.record_id::text;
$$;


ALTER FUNCTION "public"."get_auto_with_images"("ident" "text", "by" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_crm_dashboard_stats"() RETURNS TABLE("total_leads" bigint, "contacted_leads" bigint, "pending_contact_leads" bigint, "total_applications" bigint, "active_applications" bigint, "approved_applications" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Check if the current user has admin or sales role
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'sales')
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin or sales role required.';
    END IF;

    RETURN QUERY
    SELECT
        (SELECT COUNT(*)::bigint FROM profiles WHERE role = 'user') AS total_leads,
        (SELECT COUNT(*)::bigint FROM profiles WHERE role = 'user' AND contactado = true) AS contacted_leads,
        (SELECT COUNT(*)::bigint FROM profiles WHERE role = 'user' AND contactado = false) AS pending_contact_leads,
        (SELECT COUNT(*)::bigint FROM financing_applications) AS total_applications,
        (SELECT COUNT(*)::bigint FROM financing_applications WHERE status IN ('submitted', 'reviewing', 'pending_docs')) AS active_applications,
        (SELECT COUNT(*)::bigint FROM financing_applications WHERE status = 'approved') AS approved_applications;
END;
$$;


ALTER FUNCTION "public"."get_crm_dashboard_stats"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_crm_dashboard_stats"() IS 'Returns aggregated CRM statistics. VOLATILE to allow SET commands.';



CREATE OR REPLACE FUNCTION "public"."get_distinct_ordenstatus"() RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_agg(DISTINCT ordenstatus) INTO result FROM inventario_cache;
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_distinct_ordenstatus"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_filter_options"() RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    result jsonb;
BEGIN
    WITH vehicle_base AS (
        SELECT marca, autoano, clasificacionid, transmision, combustible, sucursal, autogarantia, promociones, precio, enganche_minimo
        FROM inventario_cache
        WHERE ordenstatus = 'Comprado'
    ),
    marcas_agg AS (
        SELECT marca AS name, COUNT(*) AS count FROM vehicle_base WHERE marca IS NOT NULL AND marca != '' GROUP BY marca
    ),
    years_agg AS (
        SELECT autoano AS name, COUNT(*) AS count FROM vehicle_base WHERE autoano IS NOT NULL GROUP BY autoano
    ),
    classifications_agg AS (
        SELECT name, COUNT(*) AS count FROM (SELECT unnest(string_to_array(clasificacionid, ',')) AS name FROM vehicle_base) s WHERE name IS NOT NULL AND name != '' GROUP BY name
    ),
    transmissions_agg AS (
        SELECT transmision AS name, COUNT(*) AS count FROM vehicle_base WHERE transmision IS NOT NULL AND transmision != '' GROUP BY transmision
    ),
    combustibles_agg AS (
        SELECT combustible AS name, COUNT(*) AS count FROM vehicle_base WHERE combustible IS NOT NULL AND combustible != '' GROUP BY combustible
    ),
    sucursales_agg AS (
        SELECT name, COUNT(*) AS count FROM (SELECT unnest(string_to_array(sucursal, ',')) AS name FROM vehicle_base) s WHERE name IS NOT NULL AND name != '' GROUP BY name
    ),
    warranties_agg AS (
        SELECT autogarantia AS name, COUNT(*) AS count FROM vehicle_base WHERE autogarantia IS NOT NULL AND autogarantia != '' GROUP BY autogarantia
    ),
    promotions_agg AS (
        SELECT value AS name, COUNT(*) AS count
        FROM vehicle_base, jsonb_array_elements_text(promociones)
        WHERE value IS NOT NULL AND value != ''
        GROUP BY name
    ),
    price_range AS (
        SELECT min(precio) AS minprice, max(precio) AS maxprice, min(enganche_minimo) AS minenganche, max(enganche_minimo) AS maxenganche FROM vehicle_base
    )
    SELECT jsonb_build_object(
        'marcas', (SELECT jsonb_agg(t) FROM marcas_agg t),
        'years', (SELECT jsonb_agg(t) FROM years_agg t ORDER BY name DESC),
        'classifications', (SELECT jsonb_agg(t) FROM classifications_agg t),
        'transmissions', (SELECT jsonb_agg(t) FROM transmissions_agg t),
        'combustibles', (SELECT jsonb_agg(t) FROM combustibles_agg t),
        'sucursales', (SELECT jsonb_agg(t) FROM sucursales_agg t),
        'warranties', (SELECT jsonb_agg(t) FROM warranties_agg t),
        'promotions', (SELECT jsonb_agg(t) FROM promotions_agg t),
        'minPrice', (SELECT minprice FROM price_range),
        'maxPrice', (SELECT maxprice FROM price_range),
        'minEnganche', (SELECT minenganche FROM price_range),
        'maxEnganche', (SELECT maxenganche FROM price_range)
    ) INTO result;

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_filter_options"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_inventario_cache_schema"() RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_agg(jsonb_build_object('column_name', column_name, 'data_type', data_type))
    INTO result
    FROM information_schema.columns
    WHERE table_name = 'inventario_cache';
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_inventario_cache_schema"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_leads_for_dashboard"() RETURNS TABLE("id" "uuid", "first_name" "text", "last_name" "text", "email" "text", "phone" "text", "source" "text", "contactado" boolean, "asesor_asignado" "text", "latest_app_status" "text", "latest_app_car_info" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Explicitly check role for an extra layer of security on the function call itself.
    IF (SELECT public.get_my_role()) NOT IN ('admin', 'sales') THEN
        RAISE EXCEPTION 'Permission denied to access leads dashboard.';
    END IF;

    -- The function runs with the caller's permissions, so RLS policies on underlying tables are automatically applied.
    RETURN QUERY
    SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.email,
        p.phone,
        p.source,
        p.contactado,
        (SELECT u.email FROM auth.users u WHERE u.id = p.asesor_asignado) as asesor_asignado,
        latest_app.status as latest_app_status,
        latest_app.car_info as latest_app_car_info
    FROM
        public.profiles p
    LEFT JOIN LATERAL (
        SELECT fa.status, fa.car_info
        FROM public.financing_applications fa
        WHERE fa.user_id = p.id
        ORDER BY fa.created_at DESC
        LIMIT 1
    ) latest_app ON true
    ORDER BY p.updated_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_leads_for_dashboard"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_leads_with_details"() RETURNS TABLE("id" "uuid", "first_name" "text", "last_name" "text", "email" "text", "phone" "text", "source" "text", "contactado" boolean, "asesor_asignado" "text", "latest_app_status" "text", "latest_app_car_info" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Check authorization using helper function (avoids RLS recursion)
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'sales')
    ) THEN
        RAISE EXCEPTION 'Permission denied to access leads';
    END IF;

    RETURN QUERY
    SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.email,
        p.phone,
        p.source,
        p.contactado,
        (SELECT u.email FROM auth.users u WHERE u.id = p.asesor_asignado) as asesor_asignado,
        latest_app.status as latest_app_status,
        latest_app.car_info as latest_app_car_info
    FROM
        profiles p
    LEFT JOIN LATERAL (
        SELECT fa.status, fa.car_info
        FROM financing_applications fa
        WHERE fa.user_id = p.id
        ORDER BY fa.created_at DESC
        LIMIT 1
    ) latest_app ON true
    WHERE p.role = 'user'
    ORDER BY p.updated_at DESC NULLS LAST;
END;
$$;


ALTER FUNCTION "public"."get_leads_with_details"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_leads_with_details"() IS 'Returns all leads with their latest application details. Requires admin or sales role. VOLATILE to allow SET commands.';



CREATE OR REPLACE FUNCTION "public"."get_my_role"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  -- A custom claim is set in the JWT by the handle_new_user trigger.
  -- This is a performant and non-recursive way to get the user's role.
  SELECT auth.jwt()->>'user_role';
$$;


ALTER FUNCTION "public"."get_my_role"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_my_role"() IS 'Gets the role of the current user from their JWT claims. Non-recursive and performant.';



CREATE OR REPLACE FUNCTION "public"."get_next_sales_agent"() RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    agent_ids uuid[];
    agent_count int;
    next_agent_index int;
    next_agent_id uuid;
BEGIN
    -- Get all agent IDs with 'sales' role
    SELECT array_agg(id) INTO agent_ids FROM profiles WHERE role = 'sales';
    agent_count := array_length(agent_ids, 1);

    IF agent_count IS NULL OR agent_count = 0 THEN
        RETURN NULL; -- No sales agents available
    END IF;

    -- Get the last assigned index, default to 0 if not set
    SELECT last_assigned_index INTO next_agent_index FROM agent_assignment_state LIMIT 1;
    IF next_agent_index IS NULL THEN
        next_agent_index := 0;
    END IF;

    -- Calculate the next index
    next_agent_index := (next_agent_index + 1) % agent_count;

    -- Get the next agent's ID
    next_agent_id := agent_ids[next_agent_index + 1]; -- Arrays are 1-based in PostgreSQL

    -- Update the state for the next assignment
    UPDATE agent_assignment_state SET last_assigned_index = next_agent_index;

    RETURN next_agent_id;
END;
$$;


ALTER FUNCTION "public"."get_next_sales_agent"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_next_sales_agent"() IS 'Returns the next sales agent in round-robin fashion. Updates assignment state. VOLATILE to allow SET commands and state modifications.';



CREATE OR REPLACE FUNCTION "public"."get_popular_vehicles"("limit_count" integer DEFAULT 10) RETURNS TABLE("ordencompra" "text", "titulo" "text", "autoprecio" numeric, "view_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vc.ordencompra,
    vc.titulo,
    vc.autoprecio,
    vc.view_count
  FROM vehicle_cache vc
  WHERE vc.vendido = false AND vc.ordenstatus = 'Comprado'
  ORDER BY vc.view_count DESC, vc.cached_at DESC
  LIMIT limit_count;
END;
$$;


ALTER FUNCTION "public"."get_popular_vehicles"("limit_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_secure_client_profile"("client_id" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    current_user_role text;
    is_authorized boolean := false;
    result json;
BEGIN
    -- Get the role of the requesting user
    SELECT role INTO current_user_role
    FROM profiles
    WHERE id = auth.uid();

    -- Check authorization
    IF current_user_role IN ('admin', 'sales') THEN
        is_authorized := true;
    ELSIF current_user_role = 'user' AND auth.uid() = client_id THEN
        -- Users can access their own profile
        is_authorized := true;
    END IF;

    IF NOT is_authorized THEN
        RETURN NULL;  -- Return NULL if unauthorized
    END IF;

    -- Build the result JSON
    SELECT json_build_object(
        'profile', (
            SELECT row_to_json(profiles.*)
            FROM profiles
            WHERE profiles.id = client_id
        ),
        'applications', (
            SELECT COALESCE(json_agg(fa.*), '[]'::json)
            FROM financing_applications fa
            WHERE fa.user_id = client_id
            ORDER BY fa.created_at DESC
        ),
        'tags', (
            SELECT COALESCE(
                json_agg(json_build_object('id', lt.id, 'tag_name', lt.tag_name, 'color', lt.color)),
                '[]'::json
            )
            FROM lead_tag_associations lta
            JOIN lead_tags lt ON lt.id = lta.tag_id
            WHERE lta.lead_id = client_id
        ),
        'reminders', (
            SELECT COALESCE(json_agg(lr.*), '[]'::json)
            FROM lead_reminders lr
            WHERE lr.lead_id = client_id
            ORDER BY lr.reminder_date ASC
        ),
        'documents', (
            SELECT COALESCE(
                json_agg(json_build_object(
                    'id', ud.id,
                    'fileName', ud.file_name,
                    'documentType', ud.document_type,
                    'uploadedAt', ud.created_at,
                    'status', ud.status,
                    'applicationId', ud.application_id
                )),
                '[]'::json
            )
            FROM uploaded_documents ud
            WHERE ud.user_id = client_id
            ORDER BY ud.created_at DESC
        )
    ) INTO result;

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_secure_client_profile"("client_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_secure_client_profile"("client_id" "uuid") IS 'Securely retrieves complete client profile with related data. VOLATILE to allow SET commands.';



CREATE OR REPLACE FUNCTION "public"."get_thumbnails_for_list"("p_record_ids" "text"[] DEFAULT NULL::"text"[], "p_limit" integer DEFAULT NULL::integer, "p_offset" integer DEFAULT NULL::integer) RETURNS TABLE("record_id" "text", "thumbnail" "text", "thumbnail_webp" "text", "gallery_thumbnails" "jsonb")
    LANGUAGE "sql"
    AS $$
  WITH base AS (
    SELECT
      anc.record_id::text AS record_id,
      anc.thumbnail,
      anc.thumbnail_webp,
      COALESCE(anc.gallery_thumbnails, '[]'::jsonb) AS gallery_thumbnails,
      anc.feature_image,
      anc.feature_image_webp
    FROM public.autos_normalizados_cache anc
    WHERE
      (p_record_ids IS NULL OR anc.record_id = ANY (p_record_ids))
    ORDER BY anc.cached_at DESC NULLS LAST
    LIMIT CASE WHEN p_limit IS NULL THEN NULL ELSE p_limit END
    OFFSET CASE WHEN p_offset IS NULL THEN 0 ELSE p_offset END
  )
  SELECT
    record_id,
    COALESCE(
      thumbnail,
      CASE WHEN feature_image IS NOT NULL THEN
        CONCAT(
          'https://jjepfehmuybpctdzipnu.supabase.co',
          '/storage/v1/object/public/fotos_airtable/',
          regexp_replace(feature_image, '^/*', '')
        )
      ELSE NULL END
    )::text AS thumbnail,
    COALESCE(
      thumbnail_webp,
      CASE WHEN feature_image_webp IS NOT NULL THEN
        CONCAT(
          'https://jjepfehmuybpctdzipnu.supabase.co',
          '/storage/v1/object/public/fotos_airtable/',
          regexp_replace(feature_image_webp, '^/*', '')
        )
      ELSE NULL END
    )::text AS thumbnail_webp,
    gallery_thumbnails
  FROM base;
$$;


ALTER FUNCTION "public"."get_thumbnails_for_list"("p_record_ids" "text"[], "p_limit" integer, "p_offset" integer) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."financing_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "car_info" "jsonb",
    "personal_info_snapshot" "jsonb",
    "application_data" "jsonb",
    "selected_banks" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."financing_applications" OWNER TO "postgres";


COMMENT ON TABLE "public"."financing_applications" IS 'User financing applications';



CREATE OR REPLACE FUNCTION "public"."get_user_applications"("p_user_id" "uuid") RETURNS SETOF "public"."financing_applications"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Authorization Check:
    -- Allow access if the requester is the owner of the applications,
    -- or if the requester is an admin or sales agent.
    IF NOT (
        auth.uid() = p_user_id OR
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'sales')
    ) THEN
        RAISE EXCEPTION 'Permission denied: You are not authorized to view these applications.';
    END IF;

    -- Return the applications for the specified user
    RETURN QUERY
    SELECT *
    FROM public.financing_applications
    WHERE user_id = p_user_id
    ORDER BY created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_user_applications"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_applications"("p_user_id" "uuid") IS 'Returns all financing applications for a given user. Requires ownership or an admin/sales role. Marked as VOLATILE to allow for session-level settings like search_path.';



CREATE OR REPLACE FUNCTION "public"."get_vacancies_with_application_count"() RETURNS TABLE("id" "uuid", "title" "text", "location" "text", "job_type" "text", "salary_range" "text", "description" "text", "requirements" "text", "benefits" "text", "status" "text", "schedule" "text", "image_url" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "application_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Check authorization
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'sales')
    ) THEN
        RAISE EXCEPTION 'Permission denied to access vacancies with counts';
    END IF;

    RETURN QUERY
    SELECT
        v.id,
        v.title,
        v.location,
        v.job_type,
        v.salary_range,
        v.description,
        v.requirements,
        v.benefits,
        v.status,
        v.schedule,
        v.image_url,
        v.created_at,
        v.updated_at,
        COALESCE(COUNT(va.id), 0)::bigint as application_count
    FROM
        vacancies v
    LEFT JOIN vacancy_applications va ON va.vacancy_id = v.id
    GROUP BY v.id, v.title, v.location, v.job_type, v.salary_range, v.description,
             v.requirements, v.benefits, v.status, v.schedule, v.image_url,
             v.created_at, v.updated_at
    ORDER BY v.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_vacancies_with_application_count"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_vacancies_with_application_count"() IS 'Returns all vacancies with application counts. Requires admin or sales role. VOLATILE to allow SET commands.';



CREATE OR REPLACE FUNCTION "public"."handle_application_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Check if the 'status' column was actually updated and has a new value
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    --
    -- This is where you would call your email sending logic.
    -- The recommended approach is to invoke a Supabase Edge Function
    -- which can securely handle API keys and call an email service like Brevo.
    --
    -- Example of invoking an Edge Function:
    --
    -- SELECT net.http_post(
    --    url := 'https://<project_ref>.supabase.co/functions/v1/send-status-email',
    --    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <SUPABASE_SERVICE_ROLE_KEY>"}'::jsonb,
    --    body := json_build_object(
    --        'application_id', NEW.id,
    --        'user_id', NEW.user_id,
    --        'new_status', NEW.status,
    --        'old_status', OLD.status
    --    )::text
    -- );
    --
    -- For now, we will just log this event to the database log for debugging.
    -- In Supabase Studio, check Logs -> PostgREST Logs to see this message.
    RAISE LOG 'Application % status changed from % to %', NEW.id, OLD.status, NEW.status;
    
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_application_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    user_role TEXT := 'user';
    admin_emails TEXT[] := ARRAY[
        'marianomorales@outlook.com',
        'mariano.morales@autostrefa.mx',
        'genauservices@gmail.com'
    ];
BEGIN
    -- Determine role based on email
    IF NEW.email = ANY(admin_emails) THEN
        user_role := 'admin';
    END IF;

    -- Insert the new profile
    INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        phone,
        role,
        metadata,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', SPLIT_PART(NEW.raw_user_meta_data->>'full_name', ' ', 1)),
        COALESCE(NEW.raw_user_meta_data->>'last_name', NULLIF(SUBSTRING(NEW.raw_user_meta_data->>'full_name' FROM POSITION(' ' IN NEW.raw_user_meta_data->>'full_name') + 1), '')),
        NEW.phone,
        user_role,
        COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING; -- Prevent duplicate key errors

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_vehicle_views"("vehicle_ordencompra" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE public.inventario_cache
  SET
    view_count = COALESCE(view_count, 0) + 1
  WHERE ordencompra = vehicle_ordencompra;
END;
$$;


ALTER FUNCTION "public"."increment_vehicle_views"("vehicle_ordencompra" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_or_sales"() RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'sales');
END;
$$;


ALTER FUNCTION "public"."is_admin_or_sales"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_vehicles_cache"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
  -- Upsert all rows from private.inventario into public.autos_cache
  INSERT INTO public.vehicles_cache (
    id, vin, ordencompra, precio, additional_image_link, ordenstatus, description,
    garantia, enganche_minimo, plazomax, pagomensual, video_url, title, autoano,
    titulometa, clasificacionid, rezago, consigna, internal_label, custom_label_1,
    transmision, combustible, ligawp, formulafinanciamiento,
    separado, kilometraje_compra, kilometraje_sucursal, reel_url, sucursalid,
    ubicacion, sucursal, vendido, tipo_de_combustible, rfdm, autogarantia,
    fotosexterior, fotosinterior, foto_url, fotooficial, ingreso_inventario, oferta, record_id, slug, 
    factura, numero_duenos, con_oferta, promociones, fecha_synced
  )
  SELECT
    id::text,
    COALESCE(vin::text, NULL),
    COALESCE(ordencompra::text, NULL),
    COALESCE(precio::numeric, NULL),
    COALESCE(additional_image_link::text, NULL),
    COALESCE(ordenstatus::text, NULL),
    COALESCE(description::text, NULL),
    COALESCE(garantia::text, NULL),
    COALESCE(enganche_minimo::numeric, NULL),
    COALESCE(plazomax::numeric, NULL),
    COALESCE(pagomensual::numeric, NULL),
    COALESCE(video_url::text, NULL),
    COALESCE(title::text, NULL),
    COALESCE(autoano::numeric, NULL),
    COALESCE(titulometa::text, NULL),
    COALESCE(clasificacionid::text, NULL),
    COALESCE(rezago::boolean, NULL),
    COALESCE(consigna::boolean, NULL),
    COALESCE(internal_label::text, NULL),
    COALESCE(custom_label_1::text, NULL),
    COALESCE(transmision::text, NULL),
    COALESCE(combustible::text, NULL),
    COALESCE(formulafinanciamiento::text, NULL),
    COALESCE(separado::boolean, NULL),
    COALESCE(kilometraje_compra::numeric, NULL),
    COALESCE(kilometraje_sucursal::numeric, NULL),
    COALESCE(reel_url::numeric, NULL),
    COALESCE(sucursalid::text, NULL),
    COALESCE(ubicacion::text, NULL),
    COALESCE(sucursal::text, NULL),
    COALESCE(vendido::boolean, NULL),
    COALESCE(tipo_de_combustible::text, NULL),
    COALESCE(rfdm::jsonb, NULL),
    COALESCE(autogarantia::text, NULL),
    COALESCE(fotosexterior::jsonb, NULL),
    COALESCE(fotosinterior::jsonb, NULL),
    COALESCE(foto_url::text, NULL),
    COALESCE(fotooficial::text, NULL),
    COALESCE(ingreso_inventario::timestamp with time zone, NULL),
    COALESCE(oferta::numeric, NULL),
    COALESCE(record_id::uuid, NULL),
    COALESCE(slug::text, NULL),
    COALESCE(factura::text, NULL),
    COALESCE(numero_duenos::numeric, NULL),
    COALESCE(con_oferta::boolean, NULL),
    COALESCE(promociones::jsonb, NULL),
    now() at time zone 'UTC'
  FROM private.inventario
  ON CONFLICT (id) DO UPDATE SET
    vin = EXCLUDED.vin,
    ordencompra = EXCLUDED.ordencompra,
    precio = EXCLUDED.precio,
    additional_image_link = EXCLUDED.additional_image_link,
    ordenstatus = EXCLUDED.ordenstatus,
    description = EXCLUDED.description,
    garantia = EXCLUDED.garantia,
    enganche_minimo = EXCLUDED.enganche_minimo,
    plazomax = EXCLUDED.plazomax,
    pagomensual = EXCLUDED.pagomensual,
    video_url = EXCLUDED.video_url,
    title = EXCLUDED.title,
    autoano = EXCLUDED.autoano,
    titulometa = EXCLUDED.titulometa,
    clasificacionid = EXCLUDED.clasificacionid,
    rezago = EXCLUDED.rezago,
    consigna = EXCLUDED.consigna,
    internal_label = EXCLUDED.internal_label,
    custom_label_1 = EXCLUDED.custom_label_1,
    transmision = EXCLUDED.transmision,
    kilometraje_sucursal = EXCLUDED.kilometraje_sucursal,
    combustible = EXCLUDED.combustible,
    formulafinanciamiento = EXCLUDED.formulafinanciamiento,
    separado = EXCLUDED.separado,
    kilometraje_compra = EXCLUDED.kilometraje_compra,
    kilometraje_sucursal = EXCLUDED.kilometraje_sucursal,
    reel_url = EXCLUDED.reel_url,
    sucursalid = EXCLUDED.sucursalid,
    ubicacion = EXCLUDED.ubicacion,
    sucursal = EXCLUDED.sucursal,
    vendido = EXCLUDED.vendido,
    tipo_de_combustible = EXCLUDED.tipo_de_combustible,
    rfdm = EXCLUDED.rfdm,
    autogarantia = EXCLUDED.autogarantia,
    fotosexterior = EXCLUDED.fotosexterior,
    fotosinterior = EXCLUDED.fotosinterior,
    foto_url = EXCLUDED.foto_url,
    fotooficial = EXCLUDED.fotooficial,
    ingreso_inventario = EXCLUDED.ingreso_inventario,
    oferta = EXCLUDED.oferta,
    record_id = EXCLUDED.record_id,
    slug = EXCLUDED.slug,
    factura = EXCLUDED.factura,
    numero_duenos = EXCLUDED.numero_duenos,
    con_oferta = EXCLUDED.con_oferta,
    promociones = EXCLUDED.promociones,
    fecha_synced = EXCLUDED.fecha_synced;
END;$$;


ALTER FUNCTION "public"."refresh_vehicles_cache"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."run_copy_inventario_to_cache"() RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select public.copy_inventario_to_cache();
$$;


ALTER FUNCTION "public"."run_copy_inventario_to_cache"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventario_cache" (
    "id" bigint NOT NULL,
    "ordencompra" "text",
    "precio" numeric,
    "additional_image_link" "text",
    "ordenstatus" "text",
    "description" "text",
    "garantia" "text",
    "enganchemin" numeric,
    "plazomax" numeric,
    "pagomensual" numeric,
    "video_url" "text",
    "ordenfolio" "text",
    "title" "text",
    "titulometa" "text",
    "carroceria" "text",
    "rezago" boolean,
    "consigna" boolean,
    "marca" "text",
    "modelo" "text",
    "promociones" "jsonb",
    "combustible" "text",
    "AutoMotor" "text",
    "formulafinanciamiento" "text",
    "separado" boolean,
    "reel_url" "text",
    "ubicacion" "text",
    "vendido" boolean,
    "rfdm" "jsonb",
    "vin" "text",
    "fotosexterior" "jsonb",
    "fotosinterior" "jsonb",
    "feature_image" "text",
    "ingreso_inventario" timestamp with time zone,
    "oferta" numeric,
    "factura" "text",
    "numero_duenos" numeric,
    "con_oferta" boolean,
    "last_synced_at" timestamp with time zone,
    "enganche_recomendado" "text",
    "mensualidad_recomendada" numeric,
    "mensualidad_minima" numeric,
    "slug" "text",
    "enganche_con_bono" numeric,
    "liga_boton_con_whatsapp" "text",
    "record_id" "text" NOT NULL,
    "fotos_interior_url" "jsonb",
    "fotos_exterior_url" "jsonb",
    "feature_image_url" "text",
    "autotransmision" "text",
    "descripcion" "text",
    "data" "jsonb",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "cilindros" "text",
    "viewcount" numeric,
    "clasificacionid" "text",
    "autoano" integer,
    "kilometraje" "jsonb",
    "created_at" timestamp with time zone,
    "autocombustible" "jsonb",
    "view_count" numeric
);


ALTER TABLE "public"."inventario_cache" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_vehicles"("search_term" "text") RETURNS SETOF "public"."inventario_cache"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM inventario_cache
  WHERE
    similarity(search_term, title) > 0.3 OR
    similarity(search_term, marca) > 0.3 OR
    similarity(search_term, modelo) > 0.3;
END;
$$;


ALTER FUNCTION "public"."search_vehicles"("search_term" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END; $$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_user_id_from_auth"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
  IF NEW.uid IS NULL THEN
    NEW.uid := auth.uid();
  END IF;
  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."set_user_id_from_auth"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_application"("application_data" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  new_application_id uuid;
  user_id_from_data uuid;
BEGIN
  -- Extract user_id from the application data
  user_id_from_data := (application_data->>'user_id')::uuid;

  -- Insert into financing_applications and get the new ID
  INSERT INTO public.financing_applications (user_id, car_info, personal_info, employment_info, financial_info, documents, status)
  VALUES (
    user_id_from_data,
    application_data->'car_info',
    application_data->'personal_info',
    application_data->'employment_info',
    application_data->'financial_info',
    application_data->'documents',
    'submitted'
  ) RETURNING id INTO new_application_id;

  -- Update the user's profile with the application ID
  UPDATE public.profiles
  SET
    first_name = application_data->'personal_info'->>'first_name',
    last_name = application_data->'personal_info'->>'last_name',
    phone = application_data->'personal_info'->>'phone'
  WHERE id = user_id_from_data;

  RETURN new_application_id;
END;
$$;


ALTER FUNCTION "public"."submit_application"("application_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_autos_normalizados_cache"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $_$BEGIN
  -- Clear the cache
  TRUNCATE TABLE public.cache;

  -- Insert fresh data: pick one row per ordencompra (fallback to record_id) choosing latest last_synced_at
  WITH src AS (
    SELECT *,
      COALESCE(ordencompra, record_id::text) AS oc,
      ROW_NUMBER() OVER (
        PARTITION BY COALESCE(ordencompra, record_id::text)
        ORDER BY COALESCE(last_synced_at, NOW()) DESC
      ) AS rn
    FROM private.inventario
  )
  INSERT INTO public.cache(
      id,
      record_id,
      vin,
      ordencompra,
      auto,
      last_synced_at,
      titulo,
      marca,
      modelo,
      submarca_version,
      ano,
      kilometraje,
      combustible,
      transmision,
      motor,
      cilindros,
      color_exterior,
      color_interior,
      numero_duenos,
      description,
      descripcion,
      factura,
      precio,
      moneda,
      enganche_minimo,
      enganche_recomendado,
      pagomensual,
      mensualidad_minima,
      mensualidad_recomendada,
      plazomax,
      enganche_con_bono,
      vendido,
      separado,
      consigna,
      rezago,
      oferta,
      utilitario,
      blindado,
      alta_gama,
      ordenstatus,
      fecha_ingreso,
      fecha_vendido,
      fecha_procesado,
      mes_vendido,
      ultima_actualizacion,
      ultima_modificacion_por,
      edad_en_inventario,
      reel_url,
      video_id,
      permalink,
      titulometa,
      slug,
      formulafinanciamiento,
      formula_financiamiento_facebook,
      formula_financiamiento_landing,
      ubicacion,
      sucursal_compra,
      garantia,
      promociones,
      ofertas,
      clasificacionid,
      internal_label,
      custom_label_1,
      custom_label_4,
      rfdm,
      airtable_id,
      feature_image,
      fotos_exterior,
      fotos_interior,
      autokilometraje
  )
  SELECT
      id,
      record_id,
      vin,
      ordencompra,
      COALESCE(auto, title || ' ' || marca || ' ' || modelo) AS auto,
      COALESCE(last_synced_at, NOW()) AS last_synced_at,
      title AS titulo,
      marca,
      modelo,
      NULL AS submarca_version,
      COALESCE(NULLIF(autoano::text, '')::integer, 0) AS ano,
      COALESCE(NULLIF(autokilometraje::numeric, '')::integer, NULLIF(kilometraje_compra::numeric, '')::integer, 0) AS kilometraje,
      COALESCE(autocombustible, combustible, '') AS combustible,
      autotransmision AS transmision,
      automotor AS motor,
      autocilindros AS cilindros,
      NULL AS color_exterior,
      NULL AS color_interior,
      numero_duenos,
      description,
      descripcion,
      factura,
      COALESCE(NULLIF(precio::text, '')::numeric, 0) AS precio,
      'MXN' AS moneda,
      COALESCE(NULLIF(enganche_minimo::text, '')::numeric, 0) AS enganche_minimo,
      COALESCE(NULLIF(enganche_recomendado::text, '')::numeric, 0) AS enganche_recomendado,
      COALESCE(NULLIF(pagomensual::text, '')::numeric, 0) AS pagomensual,
      COALESCE(NULLIF(mensualidad_minima::text, '')::numeric, 0) AS mensualidad_minima,
      COALESCE(NULLIF(mensualidad_recomendada::text, '')::numeric, 0) AS mensualidad_recomendada,
      COALESCE(NULLIF(plazomax::text, '')::integer, 0) AS plazomax,
      COALESCE(NULLIF(enganche_con_bono::text, '')::numeric, 0) AS enganche_con_bono,
      COALESCE(CASE WHEN COALESCE(vendido::text, '') ~* '^(1|t|true|y|yes)$' THEN true ELSE false END, false) AS vendido,
      COALESCE(CASE WHEN COALESCE(separado::text, '') ~* '^(1|t|true|y|yes)$' THEN true ELSE false END, false) AS separado,
      COALESCE(CASE WHEN COALESCE(consigna::text, '') ~* '^(1|t|true|y|yes)$' THEN true ELSE false END, false) AS consigna,
      COALESCE(CASE WHEN COALESCE(rezago::text, '') ~* '^(1|t|true|y|yes)$' THEN true ELSE false END, false) AS rezago,
      COALESCE(CASE WHEN COALESCE(oferta::text, '') ~* '^(1|t|true|y|yes)$' THEN true ELSE false END, false) AS oferta,
      false AS utilitario,
      false AS blindado,
      false AS alta_gama,
      ordenstatus,
      ingreso_inventario AS fecha_ingreso,
      NULL AS fecha_vendido,
      NULL AS fecha_procesado,
      NULL AS mes_vendido,
      NOW() AS ultima_actualizacion,
      NULL AS ultima_modificacion_por,
      NULL AS edad_en_inventario,
      reel_url,
      video_url AS video_id,
      NULL AS permalink,
      titulometa,
      slug,
      formulafinanciamiento,
      NULL AS formula_financiamiento_facebook,
      NULL AS formula_financiamiento_landing,
      ubicacion,
      sucursal AS sucursal_compra,
      COALESCE(garantia, autogarantia, '') AS garantia,
      COALESCE(promociones::jsonb, '{}'::jsonb) AS promociones,
      '{}'::jsonb AS ofertas,
      clasificacionid,
      internal_label,
      custom_label_1,
      NULL AS custom_label_4,
      COALESCE(rfdm::jsonb, '{}'::jsonb) AS rfdm,
      airtable_id,
      feature_image,
      COALESCE(fotos_exterior::jsonb, '{}'::jsonb) AS fotos_exterior,
      COALESCE(fotos_interior::jsonb, '{}'::json) AS fotos_interior,
      CASE WHEN trim(COALESCE(kilometraje_sucursal::text, '')) ~ '^[-+]?[0-9]*\.?[0-9]+$' THEN trim(kilometraje_sucursal::text)::numeric ELSE NULL END AS autokilometraje  WHERE rn = 1;
END;$_$;


ALTER FUNCTION "public"."sync_autos_normalizados_cache"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_inventario_to_cache"("p_tenant_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("inserted_count" bigint, "updated_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
  -- Column metadata for cache
  cache_cols jsonb;
  -- Comma-separated target column list for INSERT
  tgt_cols text;
  -- Comma-separated SELECT list producing values for each target column
  src_select_list text;
  -- ON CONFLICT SET list
  set_list text;
  -- Optional WHERE filter on source
  v_filter text := '';
  v_sql text;
BEGIN
  /*
    Build a JSONB array of cache columns with names and types.
    We will:
    - Always include record_id
    - For each other column c, if src.data has that key, use data->>c cast to c's type
      else use src.c if it exists, else NULL::type
  */
  WITH cols AS (
    SELECT
      c.ordinal_position,
      c.column_name,
      c.data_type,
      format_type(a.atttypid, a.atttypmod) AS full_type,
      (c.column_name = 'record_id') AS is_pk
    FROM information_schema.columns c
    JOIN pg_catalog.pg_attribute a
      ON a.attrelid = format('public.%I', c.table_name)::regclass
     AND a.attname = c.column_name
     AND a.attnum > 0
     AND NOT a.attisdropped
    WHERE c.table_schema = 'public'
      AND c.table_name = 'cache'
    ORDER BY c.ordinal_position
  )
  SELECT jsonb_agg(
           jsonb_build_object(
             'name', column_name,
             'full_type', full_type,
             'is_pk', is_pk
           ) ORDER BY ordinal_position
         )
  INTO cache_cols
  FROM cols;

  IF cache_cols IS NULL THEN
    RAISE EXCEPTION 'Could not read column metadata for public.cache';
  END IF;

  /*
    Build the target column list for INSERT
  */
  SELECT string_agg(format('%I', (col->>'name')), ', ')
  INTO tgt_cols
  FROM jsonb_array_elements(cache_cols) col;

  /*
    For each column in cache:
      - If column is record_id: prefer src.record_id (must exist in source)
      - Else:
         Value resolution precedence:
           1) COALESCE( cast_from_json(data->>name), src.name::type ) if src has column
           2) cast_from_json(data->>name) if src column missing
           3) NULL::type
      We will generate:
        COALESCE(
          NULLIF(src.data->>'col', '')::coltype,
          src.col::coltype
        ) AS col
      with guards for when src.col doesn’t exist using dynamic SQL that references only safe names.
    Assumptions:
      - private.inventario has columns: record_id, data jsonb, plus potentially overlapping typed columns.
  */
  WITH pieces AS (
    SELECT
      (col->>'name') AS name,
      (col->>'full_type') AS full_type,
      (col->>'is_pk')::boolean AS is_pk
    FROM jsonb_array_elements(cache_cols) col
  )
  SELECT string_agg(expr, ', ')
  INTO src_select_list
  FROM (
    SELECT
      CASE
        WHEN is_pk THEN format('src.%1$I::%2$s AS %1$I', name, full_type)
        WHEN name = 'data' THEN -- never expand into "data" column itself; just carry through if exists
          'src.data'
        ELSE
          -- Try JSON value first; cast to the cache column type
          -- If JSON missing/empty or cast fails, fall back to src column if it exists; else NULL::type
          format(
            'COALESCE( (%1$s), %2$s ) AS %3$I',
            -- JSON candidate: NULLIF to treat empty string as NULL then cast
            format('NULLIF(src.data->>%3$L, '''')::%2$s', name, full_type, name),
            -- Fallback: src.column if it exists; otherwise NULL::type
            format(
              'CASE WHEN (SELECT 1 FROM information_schema.columns WHERE table_schema=''private'' AND table_name=''inventario'' AND column_name=%3$L) IS NOT NULL THEN src.%3$I::%2$s ELSE NULL::%2$s END',
              name, full_type, name
            ),
            name
          )
      END AS expr
    FROM pieces
    ORDER BY name
  ) s;

  /*
    Build ON CONFLICT SET list for all non-PK columns
  */
  WITH pieces AS (
    SELECT
      (col->>'name') AS name,
      (col->>'is_pk')::boolean AS is_pk
    FROM jsonb_array_elements(cache_cols) col
  )
  SELECT string_agg(format('%1$I = EXCLUDED.%1$I', name), ', ')
  INTO set_list
  FROM pieces
  WHERE NOT is_pk;

  IF p_tenant_id IS NOT NULL THEN
    v_filter := 'WHERE src.tenant_id = $1';
  END IF;

  v_sql := format($f$
    WITH upserted AS (
      INSERT INTO public.cache (%1$s)
      SELECT %2$s
      FROM private.inventario src
      %3$s
      ON CONFLICT (record_id) DO UPDATE SET %4$s
      RETURNING xmax = 0 AS was_insert
    )
    SELECT
      COUNT(*) FILTER (WHERE was_insert) AS inserted_count,
      COUNT(*) FILTER (WHERE NOT was_insert) AS updated_count;
  $f$, tgt_cols, src_select_list, v_filter, set_list);

  IF p_tenant_id IS NULL THEN
    RETURN QUERY EXECUTE v_sql;
  ELSE
    RETURN QUERY EXECUTE v_sql USING p_tenant_id;
  END IF;
END;
$_$;


ALTER FUNCTION "public"."sync_inventario_to_cache"("p_tenant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."try_cast_text"("val" "text", "typ" "regtype") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  PERFORM ('SELECT ' || quote_nullable(val) || '::' || typ::text)::text;
  RETURN val;
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."try_cast_text"("val" "text", "typ" "regtype") OWNER TO "postgres";


CREATE FOREIGN DATA WRAPPER "admin_videos" HANDLER "extensions"."airtable_fdw_handler" VALIDATOR "extensions"."airtable_fdw_validator";




CREATE FOREIGN DATA WRAPPER "autos" HANDLER "extensions"."airtable_fdw_handler" VALIDATOR "extensions"."airtable_fdw_validator";




CREATE FOREIGN DATA WRAPPER "clientes" HANDLER "extensions"."airtable_fdw_handler" VALIDATOR "extensions"."airtable_fdw_validator";




CREATE FOREIGN DATA WRAPPER "ordencompra" HANDLER "extensions"."airtable_fdw_handler" VALIDATOR "extensions"."airtable_fdw_validator";




CREATE SERVER "admin_videos_server" FOREIGN DATA WRAPPER "admin_videos" OPTIONS (
    "api_key_id" '064fe7df-7cbd-4b5e-bae4-c66bca775a0a'
);


ALTER SERVER "admin_videos_server" OWNER TO "postgres";


CREATE SERVER "autos_server" FOREIGN DATA WRAPPER "autos" OPTIONS (
    "api_key_id" 'a76c2476-e235-47e4-9d66-abb3d1cc4f9c'
);


ALTER SERVER "autos_server" OWNER TO "postgres";


CREATE SERVER "clientes_server" FOREIGN DATA WRAPPER "clientes" OPTIONS (
    "api_key_id" '176952a8-99f3-4652-92f1-fa44637ddd2a'
);


ALTER SERVER "clientes_server" OWNER TO "postgres";


CREATE SERVER "ordencompra_server" FOREIGN DATA WRAPPER "ordencompra" OPTIONS (
    "api_key_id" '10a3cd0c-27bd-47a8-869a-f01a3cac86a8'
);


ALTER SERVER "ordencompra_server" OWNER TO "postgres";


CREATE FOREIGN TABLE "private"."inventario" (
    "ordencompra" "text",
    "precio" numeric,
    "additional_image_link" "text",
    "ordenstatus" "text",
    "description" "text",
    "garantia" "text",
    "enganche_minimo" numeric,
    "plazomax" numeric,
    "pagomensual" numeric,
    "video_url" "text",
    "id" "uuid",
    "title" "text",
    "autoano" numeric,
    "titulometa" "text",
    "carroceria" "text",
    "rezago" boolean,
    "consigna" boolean,
    "internal_label" "text",
    "custom_label_1" "text",
    "autotransmision" "text",
    "descripcion" "text",
    "marca" "text",
    "modelo" "text",
    "promociones" "jsonb",
    "autokilometraje" "text",
    "autocombustible" "text",
    "formulafinanciamiento" "text",
    "separado" boolean,
    "kilometraje_compra" numeric,
    "kilometraje_sucursal" numeric,
    "reel_url" "text",
    "airtable_id" "text",
    "ubicacion" "text",
    "sucursal" "text",
    "vendido" boolean,
    "combustible" "text",
    "rfdm" "jsonb",
    "vin" "text",
    "autogarantia" "text",
    "fotosexterior" "jsonb",
    "fotosinterior" "jsonb",
    "foto_url" "text",
    "enganche_con_bono" numeric,
    "ingreso_inventario" "date",
    "oferta" numeric,
    "factura" "text",
    "numero_duenos" numeric,
    "con_oferta" boolean,
    "last_synced_at" timestamp with time zone,
    "enganche_recomendado" numeric,
    "mensualidad_recomendada" numeric,
    "mensualidad_minima" numeric,
    "automotor" "text",
    "autocilindros" numeric,
    "feature_image" "text",
    "slug" "text",
    "auto" "text",
    "liga_boton_con_whatsapp" "text",
    "record_id" "text",
    "fotos_exterior" "jsonb",
    "fotos_interior" "jsonb",
    "fotos_exterior_url" "jsonb",
    "fotos_interior_url" "jsonb",
    "feature_image_url" "text",
    "clasificacionid" "text"
)
SERVER "autos_server"
OPTIONS (
    "base_id" 'appbOPKYqQRW2HgyB',
    "id" '5178780',
    "schema" 'private',
    "table_id" 'tblOjECDJDZlNv8At'
);


ALTER FOREIGN TABLE "private"."inventario" OWNER TO "postgres";


CREATE FOREIGN TABLE "public"."Admin de Videos" (
    "Video ID" "uuid"
)
SERVER "admin_videos_server"
OPTIONS (
    "base_id" 'tblsKadBBFasMBoue',
    "schema" 'public',
    "table_id" 'bipgMSIZi3b4EVUfA'
);


ALTER FOREIGN TABLE "public"."Admin de Videos" OWNER TO "postgres";


CREATE FOREIGN TABLE "public"."Inventario" (
    "ordencompra" "text",
    "precio" numeric,
    "rezago" boolean,
    "vin" "text",
    "availability" "text",
    "condition" "text",
    "ordenstatus" "text",
    "copy_facebook" "text",
    "precio_ajustado" numeric,
    "precio_facebook" "text",
    "enganche_facebook" "text",
    "internal_label" "text",
    "video_reel" "text",
    "[video]reel.mp4" "text",
    "autotransmision" "text",
    "custom_label_1" "text",
    "Rezago" boolean,
    "clasificacionid" "text",
    "additional_image_link" "text",
    "autoano" numeric,
    "ordenfecha" "date",
    "automarca" "text",
    "autosubmarcaversion" "text",
    "title" "text",
    "slug" "text",
    "ligawp" "text",
    "formulafinanciamiento" "text",
    "formulafinanciamientolanding" "text",
    "enganchemin" numeric,
    "enganche_ajustado" numeric,
    "pagomensual" numeric,
    "plazomax" numeric,
    "consigna" boolean,
    "description" "text",
    "descripcion_facebook" "text",
    "currency" "text",
    "mensualidad_recomendada" numeric,
    "titulometa" "text",
    "autokilometraje" numeric,
    "combustible" "text",
    "foto_url" "text",
    "galeriaexterior" "text",
    "galeriainterior" "text",
    "garantia" "text",
    "autogarantia" "text",
    "ubicacion" "text",
    "foto_catalogo" "text",
    "fotooficial" "text",
    "separado" boolean,
    "vendido" boolean,
    "utilitario" boolean,
    "auto_blindado" boolean,
    "sucursald" "text",
    "sucursalid" "text"
)
SERVER "ordencompra_server"
OPTIONS (
    "base_id" 'appbOPKYqQRW2HgyB',
    "id" '72088',
    "schema" 'public',
    "table_id" 'tblOjECDJDZlNv8At'
);


ALTER FOREIGN TABLE "public"."Inventario" OWNER TO "postgres";


CREATE FOREIGN TABLE "public"."Registros" (
    "ID del Registro" "text",
    "Full Name" "text",
    "Phone" numeric,
    "Email" "text",
    "MonthlyIncome" "text",
    "CreatedTime" "date",
    "LastUpdate" "date"
)
SERVER "clientes_server"
OPTIONS (
    "base_id" 'appbOPKYqQRW2HgyB',
    "schema" 'public',
    "table_id" 'tblyk4IeJcGBTwYMg'
);


ALTER FOREIGN TABLE "public"."Registros" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent_assignment_state" (
    "id" integer DEFAULT 1 NOT NULL,
    "last_assigned_index" integer DEFAULT 0
);


ALTER TABLE "public"."agent_assignment_state" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_config" (
    "key" "text" NOT NULL,
    "value" "jsonb"
);


ALTER TABLE "public"."app_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "vehicle_id" "uuid" NOT NULL,
    "estado" "text" DEFAULT 'pendiente'::"text" NOT NULL,
    "ingreso_mensual" numeric(10,2) NOT NULL,
    "empleo" "text" NOT NULL,
    "tiempo_empleo" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."autos_normalizados_cache" (
    "id" "text" NOT NULL,
    "vin" "text",
    "ordencompra" "text",
    "auto" "text",
    "intelimotorids" "text",
    "last_synced_at" timestamp with time zone DEFAULT "now"(),
    "titulo" "text",
    "marca" "text",
    "modelo" "text",
    "submarca_version" "text",
    "ano" integer,
    "kilometraje" integer,
    "combustible" "text",
    "transmision" "text",
    "motor" "text",
    "cilindros" "text",
    "color_exterior" "text",
    "color_interior" "text",
    "numero_duenos" "text",
    "descripcion" "text",
    "factura" "text",
    "precio" numeric(12,2),
    "moneda" "text",
    "enganche_minimo" numeric(12,2),
    "enganche_recomendado" numeric(12,2),
    "pagomensual" numeric(12,2),
    "mensualidad_minima" numeric(12,2),
    "mensualidad_recomendada" numeric(12,2),
    "plazomax" integer,
    "monto_separacion" numeric(12,2),
    "enganche_con_bono" numeric(12,2),
    "vendido" boolean,
    "separado" boolean,
    "consigna" boolean,
    "rezago" boolean,
    "oferta" boolean,
    "utilitario" boolean,
    "blindado" boolean,
    "alta_gama" boolean,
    "ordenstatus" "text",
    "fecha_ingreso" timestamp with time zone,
    "fecha_vendido" timestamp with time zone,
    "fecha_separado" timestamp with time zone,
    "fecha_procesado" timestamp with time zone,
    "mes_vendido" integer,
    "ultima_actualizacion" timestamp with time zone,
    "ultima_modificacion_por" "text",
    "edad_en_inventario" integer,
    "feature_image" "text",
    "additional_image_links" "text",
    "fotos_exterior" "jsonb",
    "fotos_interior" "jsonb",
    "reel_url" "text",
    "video_id" "text",
    "liga_boton_con_whatsapp" "text",
    "permalink" "text",
    "titulometa" "text",
    "description" "text",
    "airtable_id" "text",
    "slug" "text",
    "precio_facebook" numeric(12,2),
    "formulafinanciamiento" "text",
    "formula_financiamiento_facebook" "text",
    "formula_financiamiento_landing" "text",
    "ubicacion" "text",
    "sucursal_compra" "text",
    "garantia" "text",
    "promociones" "jsonb",
    "ofertas" "jsonb",
    "clasificacionid" "text",
    "internal_label" "text",
    "custom_label_1" "text",
    "custom_label_4" "text",
    "rfdm" "jsonb",
    "recordId" "text",
    "record_id" "text" NOT NULL,
    "view_count" integer,
    "car_studio_gallery" "jsonb",
    "car_studio_feature_image" "text",
    "use_car_studio_images" boolean,
    "thumbnail" "text",
    "thumbnail_webp" "text",
    "gallery_thumbnails" "jsonb" DEFAULT '[]'::"jsonb",
    "feature_image_webp" "text",
    "cached_at" timestamp with time zone,
    "autokilometraje" numeric,
    "fotos_exterior_url" "jsonb",
    "fotos_interior_url" "jsonb",
    "feature_image_url" "text"
);


ALTER TABLE "public"."autos_normalizados_cache" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."autos_comprados_view" WITH ("security_invoker"='on') AS
 SELECT "autos_normalizados_cache"."id",
    "autos_normalizados_cache"."vin",
    "autos_normalizados_cache"."ordencompra",
    "autos_normalizados_cache"."auto",
    "autos_normalizados_cache"."intelimotorids",
    "autos_normalizados_cache"."last_synced_at",
    "autos_normalizados_cache"."titulo",
    "autos_normalizados_cache"."marca",
    "autos_normalizados_cache"."modelo",
    "autos_normalizados_cache"."submarca_version",
    "autos_normalizados_cache"."ano",
    "autos_normalizados_cache"."kilometraje",
    "autos_normalizados_cache"."combustible",
    "autos_normalizados_cache"."transmision",
    "autos_normalizados_cache"."motor",
    "autos_normalizados_cache"."cilindros",
    "autos_normalizados_cache"."color_exterior",
    "autos_normalizados_cache"."color_interior",
    "autos_normalizados_cache"."numero_duenos",
    "autos_normalizados_cache"."descripcion",
    "autos_normalizados_cache"."factura",
    "autos_normalizados_cache"."precio",
    "autos_normalizados_cache"."moneda",
    "autos_normalizados_cache"."enganche_minimo",
    "autos_normalizados_cache"."enganche_recomendado",
    "autos_normalizados_cache"."pagomensual",
    "autos_normalizados_cache"."mensualidad_minima",
    "autos_normalizados_cache"."mensualidad_recomendada",
    "autos_normalizados_cache"."plazomax",
    "autos_normalizados_cache"."monto_separacion",
    "autos_normalizados_cache"."enganche_con_bono",
    "autos_normalizados_cache"."vendido",
    "autos_normalizados_cache"."separado",
    "autos_normalizados_cache"."consigna",
    "autos_normalizados_cache"."rezago",
    "autos_normalizados_cache"."oferta",
    "autos_normalizados_cache"."utilitario",
    "autos_normalizados_cache"."blindado",
    "autos_normalizados_cache"."alta_gama",
    "autos_normalizados_cache"."ordenstatus",
    "autos_normalizados_cache"."fecha_ingreso",
    "autos_normalizados_cache"."fecha_vendido",
    "autos_normalizados_cache"."fecha_separado",
    "autos_normalizados_cache"."fecha_procesado",
    "autos_normalizados_cache"."mes_vendido",
    "autos_normalizados_cache"."ultima_actualizacion",
    "autos_normalizados_cache"."ultima_modificacion_por",
    "autos_normalizados_cache"."edad_en_inventario",
    "autos_normalizados_cache"."feature_image",
    "autos_normalizados_cache"."additional_image_links",
    "autos_normalizados_cache"."fotos_exterior",
    "autos_normalizados_cache"."fotos_interior",
    "autos_normalizados_cache"."reel_url",
    "autos_normalizados_cache"."video_id",
    "autos_normalizados_cache"."liga_boton_con_whatsapp",
    "autos_normalizados_cache"."permalink",
    "autos_normalizados_cache"."titulometa",
    "autos_normalizados_cache"."description",
    "autos_normalizados_cache"."airtable_id",
    "autos_normalizados_cache"."slug",
    "autos_normalizados_cache"."precio_facebook",
    "autos_normalizados_cache"."formulafinanciamiento",
    "autos_normalizados_cache"."formula_financiamiento_facebook",
    "autos_normalizados_cache"."formula_financiamiento_landing",
    "autos_normalizados_cache"."ubicacion",
    "autos_normalizados_cache"."sucursal_compra",
    "autos_normalizados_cache"."garantia",
    "autos_normalizados_cache"."promociones",
    "autos_normalizados_cache"."ofertas",
    "autos_normalizados_cache"."clasificacionid",
    "autos_normalizados_cache"."internal_label",
    "autos_normalizados_cache"."custom_label_1",
    "autos_normalizados_cache"."custom_label_4",
    "autos_normalizados_cache"."rfdm",
    "autos_normalizados_cache"."recordId",
    "autos_normalizados_cache"."record_id",
    "autos_normalizados_cache"."view_count",
    "autos_normalizados_cache"."car_studio_gallery",
    "autos_normalizados_cache"."car_studio_feature_image",
    "autos_normalizados_cache"."use_car_studio_images"
   FROM "public"."autos_normalizados_cache"
  WHERE ("autos_normalizados_cache"."ordenstatus" = 'Comprado'::"text");


ALTER TABLE "public"."autos_comprados_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."autos_inventario" (
    "id" "text" NOT NULL,
    "vin" "text",
    "ordencompra" "text",
    "ordenfolio" "text",
    "intelimotorids" "text",
    "last_synced_at" timestamp with time zone DEFAULT "now"(),
    "titulo" "text",
    "marca" "text",
    "modelo" "text",
    "version" "text",
    "ano" numeric,
    "kilometraje" numeric,
    "combustible" "text",
    "transmision" "text",
    "motor" "text",
    "cilindros" "text",
    "color_exterior" "text",
    "color_interior" "text",
    "numero_duenos" numeric,
    "descripcion" "text",
    "factura" "text",
    "precio" numeric(12,2),
    "moneda" "text",
    "enganche_minimo" numeric(12,2),
    "enganche_recomendado" numeric(12,2),
    "pago_mensual" numeric(12,2),
    "mensualidad_min_oficial" numeric(12,2),
    "mensualidad_recomendada_oficial" numeric(12,2),
    "plazomax" numeric,
    "monto_separacion" numeric(12,2),
    "vendido" boolean,
    "separado" boolean,
    "consigna" boolean,
    "rezago" boolean,
    "en_oferta" boolean,
    "utilitario" boolean,
    "blindado" boolean,
    "alta_gama" boolean,
    "ordenstatus" "text",
    "fecha_ingreso" timestamp with time zone,
    "fecha_vendido" timestamp with time zone,
    "fecha_separado" timestamp with time zone,
    "fecha_procesado" timestamp with time zone,
    "mes_vendido" integer,
    "ultima_actualizacion" timestamp with time zone,
    "ultima_modificacion_por" "text",
    "edad_en_inventario" integer,
    "foto_oficial" "text",
    "foto_catalogo" "text",
    "fotos_exterior" "text",
    "fotos_interior" "text",
    "imagenes_adicionales_exterior" "text",
    "video_reel_url" "text",
    "video_id" "text",
    "liga_whatsapp" "text",
    "permalink" "text",
    "titulometa" "text",
    "metadescripcion" "text",
    "copy_facebook" "text",
    "slug" "text",
    "precio_facebook" "text",
    "formula_financiamiento" "text",
    "formula_financiamiento_facebook" "text",
    "formula_financiamiento_landing" "text",
    "sucursal" "text",
    "sucursal_compra" "text",
    "garantia" "text",
    "promociones" "jsonb",
    "ofertas" "jsonb",
    "clasificacionid" "text",
    "internal_label" "text",
    "custom_label_1" "text",
    "custom_label_4" "text",
    "rfdm" "text",
    "cached_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."autos_inventario" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."autos_publicados" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "titulo" "text",
    "descripcion" "text",
    "ordencompra" "text",
    "kilometraje" integer,
    "motor" "text",
    "numero_duenos" integer,
    "ubicacion" "text",
    "enganche_recomendado" numeric,
    "precio" numeric,
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."autos_publicados" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_profiles" (
    "user_id" "uuid" NOT NULL,
    "respuestas" "jsonb",
    "banco_recomendado" "text",
    "banco_segunda_opcion" "text",
    "is_complete" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bank_profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."bank_profiles" IS 'User answers to bank profiling questionnaire';



CREATE TABLE IF NOT EXISTS "public"."bank_scoring_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clerk_user_id" "text" NOT NULL,
    "profile_id" "uuid",
    "banco_recomendado" "text" DEFAULT ''::"text",
    "banco_segunda_opcion" "text" DEFAULT ''::"text",
    "puntos_perfilamiento" integer DEFAULT 0,
    "scored_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bank_scoring_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."beta_poll_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "dispositivo" "text",
    "facilidad_inventario" integer,
    "punto_fuerte" "text",
    "punto_debil" "text",
    "info_autos" "text",
    "info_extra" "text",
    "facilidad_login" integer,
    "problemas_financiamiento" "text",
    "claridad_dashboard" "text",
    "confianza" "text",
    "mejora_confianza" "text",
    "probabilidad_uso" integer,
    "momentos_frustracion" "text",
    "sorpresas_positivas" "text",
    "mejora_prioritaria" "text",
    "funciones_no_usadas" "text",
    "abandono" "text",
    "comentario_final" "text",
    "funcionalidad_futura" "text",
    "mejor_experiencia" "text"
);


ALTER TABLE "public"."beta_poll_responses" OWNER TO "postgres";


COMMENT ON TABLE "public"."beta_poll_responses" IS 'Stores user feedback from the v0.1 beta poll.';



CREATE TABLE IF NOT EXISTS "public"."cache" (
    "ordencompra" "text",
    "precio" numeric,
    "additional_image_link" "text",
    "ordenstatus" "text",
    "description" "text",
    "garantia" "text",
    "enganche_minimo" numeric,
    "plazomax" integer,
    "pagomensual" numeric,
    "video_url" "text",
    "id" "text",
    "title" "text",
    "autoano" integer,
    "titulometa" "text",
    "clasificacionid" "text",
    "rezago" boolean,
    "consigna" "text",
    "internal_label" "text",
    "custom_label_1" "text",
    "autotransmision" "text",
    "descripcion" "text",
    "marca" "text",
    "modelo" "text",
    "promociones" "text",
    "autokilometraje" "text",
    "autocombustible" "text",
    "formulafinanciamiento" "text",
    "separado" boolean,
    "kilometraje_compra" numeric,
    "kilometraje_sucursal" numeric,
    "reel_url" "text",
    "airtable_id" "text",
    "ubicacion" "text",
    "sucursal" "text",
    "vendido" boolean,
    "combustible" "text",
    "rfdm" "text",
    "vin" "text",
    "autogarantia" "text",
    "fotosexterior" "text",
    "fotosinterior" "text",
    "foto_url" "text",
    "enganche_con_bono" numeric,
    "ingreso_inventario" "text",
    "oferta" "text",
    "factura" "text",
    "numero_duenos" integer,
    "con_oferta" boolean,
    "last_synced_at" timestamp with time zone,
    "enganche_recomendado" numeric,
    "mensualidad_recomendada" numeric,
    "mensualidad_minima" numeric,
    "automotor" "text",
    "autocilindros" integer,
    "feature_image" "text",
    "slug" "text",
    "auto" "text",
    "liga_boton_con_whatsapp" "text",
    "record_id" "text",
    "fotos_exterior" "text",
    "fotos_interior" "text",
    "fotos_exterior_url" "text",
    "fotos_interior_url" "text",
    "feature_image_url" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "data" "jsonb",
    "car_studio_image" "text",
    "use_car_studio_images" boolean,
    "car_studio_feature_image" "text",
    "car_studio_gallery" "jsonb",
    "visitas" numeric,
    "view_count" numeric,
    "seo_keywords" "jsonb",
    "tenando_id" "uuid"
);


ALTER TABLE "public"."cache" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."comprado_autos_v" WITH ("security_invoker"='on') AS
 SELECT "a"."record_id" AS "id",
    "a"."ordencompra",
    "a"."titulo",
    "a"."marca",
    "a"."modelo",
    "a"."ano",
    "a"."precio",
    "a"."kilometraje",
    "a"."slug",
    NULLIF("a"."feature_image", ''::"text") AS "feature_image_path",
        CASE
            WHEN (NULLIF("a"."feature_image", ''::"text") IS NOT NULL) THEN ('https://pemgwyymodlwabaexxrb.supabase.co/storage/v1/object/public/fotos_airtable/'::"text" || NULLIF("a"."feature_image", ''::"text"))
            ELSE NULL::"text"
        END AS "feature_image_url",
    (COALESCE("a"."fotos_exterior", '[]'::"jsonb") || COALESCE("a"."fotos_interior", '[]'::"jsonb")) AS "raw_gallery_paths",
    ( SELECT "jsonb_agg"(('https://pemgwyymodlwabaexxrb.supabase.co/storage/v1/object/public/fotos_airtable/'::"text" || "t"."elem")) AS "jsonb_agg"
           FROM "jsonb_array_elements_text"((COALESCE("a"."fotos_exterior", '[]'::"jsonb") || COALESCE("a"."fotos_interior", '[]'::"jsonb"))) "t"("elem")) AS "gallery_image_urls"
   FROM "public"."autos_normalizados_cache" "a"
  WHERE ("a"."ordenstatus" = 'Comprado'::"text");


ALTER TABLE "public"."comprado_autos_v" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."facebook_catalogue" (
    "id" bigint NOT NULL,
    "orden_compra" "text",
    "auto" "text",
    "foto" "text",
    "precio" numeric,
    "ubicacion" "text",
    "orden_folio" "text",
    "marca" "text",
    "auto_submarca_version" "text",
    "clasificacion_id" "text",
    "transmision" "text",
    "descripcion" "text",
    "availability" "text",
    "foto_catalogo" "text",
    "titulo_meta" "text",
    "publicacion_web" "text",
    "currency" "text",
    "vin" "text",
    "status" "text",
    "condition" "text",
    "auto_ano" "text",
    "fotos_exterior_archivos" "jsonb",
    "fotos_interior_archivos" "jsonb",
    "fotos_exterior" "jsonb",
    "price" numeric,
    "imagenes_adicionales_exterior" "jsonb",
    "cantidad" integer,
    "foto_comprimida_catalogo" "text",
    "internal_label" "text",
    "fotos_comprimidas_exterior" "jsonb",
    "formula_financiamiento" "text",
    "fotos_interior" "jsonb",
    "copy_de_facebook" "text",
    "video_reel" "text",
    "cta" "text",
    "custom_label_1" "text",
    "transmision_alt" "text",
    "foto_facebook" "text",
    "categoria_google" "text",
    "lujo" boolean,
    "publicado_organico" boolean,
    "video_reel_mp4" "text",
    "kilometraje_sucursal" numeric,
    "alta_gama" boolean,
    "enganche_facebook" numeric,
    "mensualidad_facebook" numeric,
    "precio_facebook" numeric,
    "foto_url" "text",
    "additional_image_link" "text",
    "es_rezago" boolean,
    "rezago" "text",
    "custom_label_4" "text",
    "edad_en_inventario" integer,
    "enganche_ajustado" numeric,
    "marca_alt" "text",
    "modelo" "text",
    "auto_ano_alt" "text",
    "liga_para_catalogos" "text",
    "reel" "text",
    "reel_url" "text",
    "video_reel_file" "text",
    "raw_row" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."facebook_catalogue" OWNER TO "postgres";


ALTER TABLE "public"."facebook_catalogue" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."facebook_catalogue_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."inventario_cache" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."inventario_cache_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."job_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vacancy_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "candidate_name" "text" NOT NULL,
    "candidate_email" "text" NOT NULL,
    "candidate_phone" "text",
    "cv_file_path" "text" NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."job_applications" OWNER TO "postgres";


COMMENT ON TABLE "public"."job_applications" IS 'Applications submitted for job vacancies';



CREATE TABLE IF NOT EXISTS "public"."lead_reminders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "agent_id" "uuid",
    "reminder_text" "text" NOT NULL,
    "reminder_date" timestamp with time zone NOT NULL,
    "is_completed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."lead_reminders" OWNER TO "postgres";


COMMENT ON TABLE "public"."lead_reminders" IS 'Stores follow-up reminders for leads.';



CREATE TABLE IF NOT EXISTS "public"."lead_tag_associations" (
    "lead_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."lead_tag_associations" OWNER TO "postgres";


COMMENT ON TABLE "public"."lead_tag_associations" IS 'Associates leads with tags';



CREATE TABLE IF NOT EXISTS "public"."lead_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tag_name" "text" NOT NULL,
    "color" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."lead_tags" OWNER TO "postgres";


COMMENT ON TABLE "public"."lead_tags" IS 'Stores definitions for tags that can be applied to leads.';



CREATE TABLE IF NOT EXISTS "public"."listing_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "storage_key" "text" NOT NULL,
    "role" "text",
    "size" "text",
    "position" integer,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."listing_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "application_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "mensaje" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "role" "public"."user_role" DEFAULT 'user'::"public"."user_role",
    "first_name" "text",
    "last_name" "text",
    "mother_last_name" "text",
    "email" "text",
    "phone" "text",
    "birth_date" "date",
    "homoclave" "text",
    "fiscal_situation" "text",
    "civil_status" "text",
    "gender" "text",
    "how_did_you_know" "text",
    "address" "text",
    "colony" "text",
    "city" "text",
    "state" "text",
    "zip_code" "text",
    "rfc" "text",
    "contactado" boolean DEFAULT false,
    "asesor_asignado_id" "uuid",
    "source" "text",
    "tags" "text"[],
    "asesor_autorizado_acceso" boolean DEFAULT false,
    "last_assigned_at" timestamp with time zone DEFAULT "now"(),
    "has_completed_onboarding" boolean DEFAULT false,
    "metadata" "jsonb",
    "ordencompra" "text",
    "picture_url" "text",
    "sucursal" "text",
    "website" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'User profiles with complete personal and contact information. Extended to support advisor assignment and profile pictures.';



COMMENT ON COLUMN "public"."profiles"."contactado" IS 'CRM flag: has this lead been contacted?';



COMMENT ON COLUMN "public"."profiles"."asesor_asignado_id" IS 'CRM field: assigned sales advisor.';



COMMENT ON COLUMN "public"."profiles"."source" IS 'Acquisition source, e.g., from `rfdm` URL parameter.';



COMMENT ON COLUMN "public"."profiles"."tags" IS 'CRM tags associated with the lead/profile.';



COMMENT ON COLUMN "public"."profiles"."metadata" IS 'Stores metadata about the lead source, such as UTM parameters, rfdm, etc.';



COMMENT ON COLUMN "public"."profiles"."ordencompra" IS 'WP order ID if the user came from a specific car page.';



CREATE TABLE IF NOT EXISTS "public"."search_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "search_query" "text" NOT NULL,
    "filters" "jsonb" DEFAULT '{}'::"jsonb",
    "result_count" integer DEFAULT 0,
    "cached_results" "jsonb" DEFAULT '[]'::"jsonb",
    "search_count" integer DEFAULT 1,
    "last_searched_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."search_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."uploaded_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "application_id" "uuid" NOT NULL,
    "document_type" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_size" integer NOT NULL,
    "content_type" "text" NOT NULL,
    "status" "text" DEFAULT 'reviewing'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."uploaded_documents" OWNER TO "postgres";


COMMENT ON TABLE "public"."uploaded_documents" IS 'Documents uploaded for financing applications';



CREATE TABLE IF NOT EXISTS "public"."user_favorites" (
    "user_id" "uuid" NOT NULL,
    "vehicle_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_favorites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_search_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clerk_user_id" "text" NOT NULL,
    "search_query" "text" NOT NULL,
    "filters" "jsonb" DEFAULT '{}'::"jsonb",
    "results_found" integer DEFAULT 0,
    "searched_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_search_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_vehicles_for_sale" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "valuation_data" "jsonb",
    "owner_count" integer,
    "key_info" "text",
    "invoice_status" "text",
    "financing_entity_type" "text",
    "financing_entity_name" "text",
    "vehicle_state" "text",
    "plate_registration_state" "text",
    "accident_history" "text",
    "reason_for_selling" "text",
    "additional_details" "text",
    "exterior_photos" "text"[],
    "interior_photos" "text"[],
    "inspection_notes" "text",
    "final_offer" numeric,
    "listing_url" "text",
    "inspection_branch" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_vehicles_for_sale" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_vehicles_for_sale" IS 'User submissions for selling their car';



CREATE TABLE IF NOT EXISTS "public"."vacancies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "location" "text" NOT NULL,
    "job_type" "text" NOT NULL,
    "salary_range" "text",
    "description" "text" NOT NULL,
    "requirements" "text",
    "benefits" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "schedule" "text",
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."vacancies" OWNER TO "postgres";


COMMENT ON TABLE "public"."vacancies" IS 'Job vacancy listings';



CREATE TABLE IF NOT EXISTS "public"."vehicle_cache" (
    "ordencompra" "text" NOT NULL,
    "titulo" "text" DEFAULT ''::"text" NOT NULL,
    "separado" boolean DEFAULT false,
    "vendido" boolean DEFAULT false,
    "autoano" integer DEFAULT 2020,
    "automarca" "text" DEFAULT ''::"text",
    "autocombustible" "text" DEFAULT 'Gasolina'::"text",
    "automotor" "text" DEFAULT ''::"text",
    "autosubmarcaversion" "text" DEFAULT ''::"text",
    "autoprecio" numeric DEFAULT 0,
    "autotransmision" "text" DEFAULT 'Manual'::"text",
    "autogarantia" "text" DEFAULT ''::"text",
    "autokilometraje" integer DEFAULT 0,
    "enganche" numeric DEFAULT 0,
    "mensualidad" numeric DEFAULT 0,
    "pagomensual" numeric DEFAULT 0,
    "plazomax" integer DEFAULT 48,
    "plazo" "text" DEFAULT ''::"text",
    "fotooficial" "text" DEFAULT ''::"text",
    "ordenstatus" "text" DEFAULT ''::"text",
    "descripcion" "text" DEFAULT ''::"text",
    "metadescripcion" "text" DEFAULT ''::"text",
    "ligawp" "text" DEFAULT ''::"text",
    "liga_financiamiento_portal" "text" DEFAULT ''::"text",
    "autocilindros" "text" DEFAULT ''::"text",
    "color_exterior" "text" DEFAULT ''::"text",
    "color_interior" "text" DEFAULT ''::"text",
    "precio_reduccion" "text" DEFAULT ''::"text",
    "nosiniestros" "text" DEFAULT ''::"text",
    "detalles_esteticos" "text" DEFAULT ''::"text",
    "galeria_exterior" integer[] DEFAULT '{}'::integer[],
    "galeria_interior" integer[] DEFAULT '{}'::integer[],
    "fotos_exterior" "text"[] DEFAULT '{}'::"text"[],
    "fotos_interior" "text"[] DEFAULT '{}'::"text"[],
    "fotosinterior" "text" DEFAULT ''::"text",
    "fichatecnica" "jsonb" DEFAULT '[]'::"jsonb",
    "marcas" "text"[] DEFAULT '{}'::"text"[],
    "models" "text"[] DEFAULT '{}'::"text"[],
    "state" "text"[] DEFAULT '{}'::"text"[],
    "sucursal" "text"[] DEFAULT '{}'::"text"[],
    "cached_at" timestamp with time zone DEFAULT "now"(),
    "wordpress_updated_at" timestamp with time zone DEFAULT "now"(),
    "view_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "ano" numeric
);


ALTER TABLE "public"."vehicle_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicle_inspections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vehicle_id" bigint NOT NULL,
    "status" "text" NOT NULL,
    "past_owners" integer NOT NULL,
    "sinisters" integer NOT NULL,
    "police_report" "text",
    "inspection_points" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "vehicle_inspections_status_check" CHECK (("status" = ANY (ARRAY['approved'::"text", 'pending'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."vehicle_inspections" OWNER TO "postgres";


COMMENT ON TABLE "public"."vehicle_inspections" IS 'Mechanical and aesthetic inspection reports';



CREATE TABLE IF NOT EXISTS "public"."vehicle_price_watches" (
    "user_id" "uuid" NOT NULL,
    "vehicle_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."vehicle_price_watches" OWNER TO "postgres";


COMMENT ON TABLE "public"."vehicle_price_watches" IS 'Stores user subscriptions for vehicle price drop notifications.';



CREATE TABLE IF NOT EXISTS "public"."vehicle_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ordencompra" "text" NOT NULL,
    "clerk_user_id" "text",
    "ip_address" "inet",
    "user_agent" "text",
    "viewed_at" timestamp with time zone DEFAULT "now"(),
    "session_id" "text"
);


ALTER TABLE "public"."vehicle_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "marca" "text" NOT NULL,
    "modelo" "text" NOT NULL,
    "ano" integer NOT NULL,
    "precio" numeric(10,2) NOT NULL,
    "kilometraje" integer NOT NULL,
    "descripcion" "text",
    "imagenes" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "disponible" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."vehicles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicles_cache" (
    "id" bigint NOT NULL,
    "titulo" "text",
    "slug" "text",
    "precio" numeric,
    "autoano" integer,
    "kilometraje" integer,
    "marca" "text",
    "modelo" "text",
    "transmision" "text",
    "combustible" "text",
    "feature_image" "text",
    "ordencompra" "text",
    "separado" boolean DEFAULT false,
    "vendido" boolean DEFAULT false,
    "sucursal" "text"[],
    "promociones" "text"[],
    "galeriaexterior" "text"[],
    "galeriainterior" "text"[],
    "clasificacionid" "text"[],
    "post_content" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "brand" "text",
    "classification" "text",
    "cylinders" "text",
    "model" "text",
    "fuel" "text",
    "description" "text",
    "enganchemin" numeric,
    "enganche_recomendado" numeric,
    "mensualidad_recomendada" numeric,
    "liga_boton_whatsapp" "text",
    "galeria_exterior" "jsonb",
    "galeria_interior" "jsonb",
    "thumbnail" "text",
    "thumbnail_webp" "text",
    "reel_id" "text",
    "autocilindros" "text",
    "title" "text",
    "price" numeric,
    "year" integer,
    "kms" integer,
    "transmission" "text",
    "engine" "text",
    "warranty" "text",
    "mindownpayment" numeric,
    "recommendeddownpayment" numeric,
    "maxterm" integer,
    "monthlypayment" numeric,
    "recommendedmonthlypayment" numeric,
    "location" "text"[],
    "status" "text",
    "issold" boolean DEFAULT false,
    "isreserved" boolean DEFAULT false,
    "viewcount" integer DEFAULT 0,
    "whatsapplink" "text",
    "orderid" "text",
    "promotions" "jsonb",
    "exteriorimages" "jsonb",
    "interiorimages" "jsonb",
    "featureimage" "text",
    "videourl" "text",
    "reelid" "text",
    "exteriorImages" "jsonb",
    "interiorImages" "jsonb",
    "featureImage" "text",
    "isReserved" boolean,
    "isSold" boolean,
    "reelId" "text",
    "videoUrl" "text",
    "orderId" "text",
    "viewCount" integer,
    "whatsappLink" "text",
    "recommendedMonthlyPayment" numeric,
    "monthlyPayment" numeric,
    "minDownPayment" numeric,
    "maxTerm" integer,
    "recommendedDownPayment" numeric,
    "ano" numeric,
    "autocombustible" "text",
    "automotor" "text",
    "ubicacion" "text",
    "galeriaExterior" "jsonb",
    "galeriaInterior" "jsonb",
    "autogarantia" "text",
    "autokilometraje" numeric,
    "descripcion" "text",
    "metadesc" "text",
    "ligawp" "text",
    "autoprecio" numeric,
    "autotransmision" "text",
    "cilindros" numeric,
    "color_exterior" "text",
    "color_interior" "text",
    "liga_financiamiento_portal" "text",
    "consigna" boolean,
    "rezago" boolean,
    "detalles_esteticos" "text",
    "enganche" numeric,
    "engancheMinimo" numeric,
    "enganche_ajustado" numeric,
    "enganche_minimo" numeric,
    "mensualidad_minima" numeric,
    "plazomax" numeric,
    "feature_image_webp" "text",
    "thumnbnail_webp" "text",
    "fichatecnica" "text",
    "fotooficial" "text",
    "fotos_interior" "jsonb",
    "fotos_exterior" "jsonb",
    "garantia" "text",
    "label" "text",
    "last_synced_at" timestamp with time zone,
    "liga_financiamiento_landing" "text",
    "liga_boton_con_whatsapp" "text",
    "liga_financiamiento" "text",
    "marcas" "text",
    "mensualidad" numeric,
    "metadescripcion" "text",
    "models" "text",
    "motor" "text",
    "nosiniestros" "text",
    "ordenid" "text",
    "ordenstatus" "text",
    "pagomensual" numeric,
    "record_id" "text",
    "post_excerpt" "text",
    "titulometa" "text",
    "permalink" "text",
    "precio_reduccion" "text",
    "plazo" "text",
    "video_url" "text",
    "video_reel" "text",
    "view_count" integer,
    "visitas" integer,
    "state" "text"[],
    "automarca" "text",
    "autosubmarcaversion" "text",
    "sucursald" "text",
    "car_studio_feature_image" "text",
    "car_studio_gallery" "jsonb",
    "post_title" "text",
    "use_car_studio_images" boolean
);


ALTER TABLE "public"."vehicles_cache" OWNER TO "postgres";


COMMENT ON TABLE "public"."vehicles_cache" IS 'Public read-only cache for vehicle data';



CREATE TABLE IF NOT EXISTS "public"."videos_portal" (
    "video_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "video" "text",
    "tipo_de_video" "text",
    "paso" numeric,
    "cargado" boolean,
    "archivo" "json"
);


ALTER TABLE "public"."videos_portal" OWNER TO "postgres";


ALTER TABLE "public"."videos_portal" ALTER COLUMN "video_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."videos_portal_video_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."agent_assignment_state"
    ADD CONSTRAINT "agent_assignment_state_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_config"
    ADD CONSTRAINT "app_config_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."autos_inventario"
    ADD CONSTRAINT "autos_inventario_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."autos_inventario"
    ADD CONSTRAINT "autos_inventario_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."autos_normalizados_cache"
    ADD CONSTRAINT "autos_normalizados_cache_ordencompra_key" UNIQUE ("ordencompra");



ALTER TABLE ONLY "public"."autos_normalizados_cache"
    ADD CONSTRAINT "autos_normalizados_cache_pkey" PRIMARY KEY ("record_id");



ALTER TABLE ONLY "public"."autos_normalizados_cache"
    ADD CONSTRAINT "autos_normalizados_cache_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."autos_publicados"
    ADD CONSTRAINT "autos_publicados_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_profiles"
    ADD CONSTRAINT "bank_profiles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."bank_scoring_history"
    ADD CONSTRAINT "bank_scoring_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."beta_poll_responses"
    ADD CONSTRAINT "beta_poll_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cache"
    ADD CONSTRAINT "cache_entity_id_key" UNIQUE ("record_id");



ALTER TABLE ONLY "public"."facebook_catalogue"
    ADD CONSTRAINT "facebook_catalogue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financing_applications"
    ADD CONSTRAINT "financing_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventario_cache"
    ADD CONSTRAINT "inventario_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventario_cache"
    ADD CONSTRAINT "inventario_cache_record_id_key" UNIQUE ("record_id");



ALTER TABLE ONLY "public"."inventario_cache"
    ADD CONSTRAINT "inventario_cache_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."job_applications"
    ADD CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_reminders"
    ADD CONSTRAINT "lead_reminders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_tag_associations"
    ADD CONSTRAINT "lead_tag_associations_pkey" PRIMARY KEY ("lead_id", "tag_id");



ALTER TABLE ONLY "public"."lead_tags"
    ADD CONSTRAINT "lead_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_tags"
    ADD CONSTRAINT "lead_tags_tag_name_key" UNIQUE ("tag_name");



ALTER TABLE ONLY "public"."listing_images"
    ADD CONSTRAINT "listing_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_phone_key" UNIQUE ("phone");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."search_cache"
    ADD CONSTRAINT "search_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."search_cache"
    ADD CONSTRAINT "search_cache_search_query_filters_key" UNIQUE ("search_query", "filters");



ALTER TABLE ONLY "public"."uploaded_documents"
    ADD CONSTRAINT "uploaded_documents_file_path_key" UNIQUE ("file_path");



ALTER TABLE ONLY "public"."uploaded_documents"
    ADD CONSTRAINT "uploaded_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_favorites"
    ADD CONSTRAINT "user_favorites_pkey" PRIMARY KEY ("user_id", "vehicle_id");



ALTER TABLE ONLY "public"."user_search_history"
    ADD CONSTRAINT "user_search_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_vehicles_for_sale"
    ADD CONSTRAINT "user_vehicles_for_sale_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vacancies"
    ADD CONSTRAINT "vacancies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicle_cache"
    ADD CONSTRAINT "vehicle_cache_pkey" PRIMARY KEY ("ordencompra");



ALTER TABLE ONLY "public"."vehicle_inspections"
    ADD CONSTRAINT "vehicle_inspections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicle_inspections"
    ADD CONSTRAINT "vehicle_inspections_vehicle_id_key" UNIQUE ("vehicle_id");



ALTER TABLE ONLY "public"."vehicle_price_watches"
    ADD CONSTRAINT "vehicle_price_watches_pkey" PRIMARY KEY ("user_id", "vehicle_id");



ALTER TABLE ONLY "public"."vehicle_views"
    ADD CONSTRAINT "vehicle_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicles_cache"
    ADD CONSTRAINT "vehicles_cache_ordencompra_key" UNIQUE ("ordencompra");



ALTER TABLE ONLY "public"."vehicles_cache"
    ADD CONSTRAINT "vehicles_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicles_cache"
    ADD CONSTRAINT "vehicles_cache_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."videos_portal"
    ADD CONSTRAINT "videos_portal_pkey" PRIMARY KEY ("video_id");



CREATE INDEX "idx_autos_inventario_clasificacionid" ON "public"."autos_inventario" USING "btree" ("clasificacionid");



CREATE INDEX "idx_autos_inventario_kilometraje" ON "public"."autos_inventario" USING "btree" ("kilometraje");



CREATE INDEX "idx_autos_inventario_marca_modelo_ano" ON "public"."autos_inventario" USING "btree" ("marca", "modelo", "ano");



CREATE INDEX "idx_autos_inventario_ordencompra" ON "public"."autos_inventario" USING "btree" ("ordencompra");



CREATE INDEX "idx_autos_inventario_ordenstatus" ON "public"."autos_inventario" USING "btree" ("ordenstatus");



CREATE INDEX "idx_autos_inventario_precio" ON "public"."autos_inventario" USING "btree" ("precio");



CREATE INDEX "idx_autos_inventario_slug" ON "public"."autos_inventario" USING "btree" ("slug");



CREATE INDEX "idx_autos_inventario_sucursal" ON "public"."autos_inventario" USING "btree" ("sucursal");



CREATE INDEX "idx_autos_normalizados_availability" ON "public"."autos_normalizados_cache" USING "btree" ("vendido", "separado");



CREATE INDEX "idx_autos_normalizados_cache_ano" ON "public"."autos_normalizados_cache" USING "btree" ("ano");



CREATE INDEX "idx_autos_normalizados_cache_auto" ON "public"."autos_normalizados_cache" USING "btree" ("auto");



CREATE INDEX "idx_autos_normalizados_cache_clasificacionid" ON "public"."autos_normalizados_cache" USING "btree" ("clasificacionid");



CREATE INDEX "idx_autos_normalizados_cache_kilometraje" ON "public"."autos_normalizados_cache" USING "btree" ("kilometraje");



CREATE INDEX "idx_autos_normalizados_cache_last_synced_at" ON "public"."autos_normalizados_cache" USING "btree" ("last_synced_at");



CREATE INDEX "idx_autos_normalizados_cache_marca" ON "public"."autos_normalizados_cache" USING "btree" ("marca");



CREATE INDEX "idx_autos_normalizados_cache_marca_modelo_ano" ON "public"."autos_normalizados_cache" USING "btree" ("marca", "modelo", "ano");



CREATE INDEX "idx_autos_normalizados_cache_modelo" ON "public"."autos_normalizados_cache" USING "btree" ("modelo");



CREATE INDEX "idx_autos_normalizados_cache_ordencompra" ON "public"."autos_normalizados_cache" USING "btree" ("ordencompra");



CREATE INDEX "idx_autos_normalizados_cache_ordenstatus" ON "public"."autos_normalizados_cache" USING "btree" ("ordenstatus");



CREATE INDEX "idx_autos_normalizados_cache_separado" ON "public"."autos_normalizados_cache" USING "btree" ("separado");



CREATE INDEX "idx_autos_normalizados_cache_slug" ON "public"."autos_normalizados_cache" USING "btree" ("slug");



CREATE INDEX "idx_autos_normalizados_cache_ubicacion" ON "public"."autos_normalizados_cache" USING "btree" ("ubicacion");



CREATE INDEX "idx_autos_normalizados_cache_vendido" ON "public"."autos_normalizados_cache" USING "btree" ("vendido");



CREATE INDEX "idx_autos_normalizados_cached_at" ON "public"."autos_normalizados_cache" USING "btree" ("cached_at" DESC);



CREATE INDEX "idx_autos_normalizados_marca" ON "public"."autos_normalizados_cache" USING "btree" ("marca");



CREATE INDEX "idx_autos_normalizados_ordenstatus" ON "public"."autos_normalizados_cache" USING "btree" ("ordenstatus");



CREATE INDEX "idx_autos_normalizados_record_id" ON "public"."autos_normalizados_cache" USING "btree" ("record_id");



CREATE INDEX "idx_autos_normalizados_titulo_search" ON "public"."autos_normalizados_cache" USING "gin" ("to_tsvector"('"spanish"'::"regconfig", "titulo"));



CREATE INDEX "idx_autos_publicados_created_at" ON "public"."autos_publicados" USING "btree" ("created_at");



CREATE INDEX "idx_bank_scoring_history_clerk_user_id" ON "public"."bank_scoring_history" USING "btree" ("clerk_user_id");



CREATE INDEX "idx_bank_scoring_history_scored_at" ON "public"."bank_scoring_history" USING "btree" ("scored_at" DESC);



CREATE INDEX "idx_facebook_catalogue_marca" ON "public"."facebook_catalogue" USING "btree" ("marca");



CREATE INDEX "idx_facebook_catalogue_modelo" ON "public"."facebook_catalogue" USING "btree" ("modelo");



CREATE INDEX "idx_facebook_catalogue_vin" ON "public"."facebook_catalogue" USING "btree" ("vin");



CREATE INDEX "idx_financing_applications_created_at_desc" ON "public"."financing_applications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_financing_applications_status" ON "public"."financing_applications" USING "btree" ("status");



CREATE INDEX "idx_financing_applications_user" ON "public"."financing_applications" USING "btree" ("user_id");



CREATE INDEX "idx_financing_applications_user_active_status" ON "public"."financing_applications" USING "btree" ("user_id", "status") WHERE ("status" = ANY (ARRAY['submitted'::"text", 'reviewing'::"text", 'pending_docs'::"text"]));



COMMENT ON INDEX "public"."idx_financing_applications_user_active_status" IS 'Partial index for active application checks';



CREATE INDEX "idx_financing_applications_user_created" ON "public"."financing_applications" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_financing_applications_user_id" ON "public"."financing_applications" USING "btree" ("user_id");



COMMENT ON INDEX "public"."idx_financing_applications_user_id" IS 'Fast lookup of applications by user';



CREATE INDEX "idx_financing_applications_user_status" ON "public"."financing_applications" USING "btree" ("user_id", "status");



COMMENT ON INDEX "public"."idx_financing_applications_user_status" IS 'Optimizes getUserApplications and hasActiveApplication queries';



CREATE INDEX "idx_inventario_cache_marca_modelo" ON "public"."inventario_cache" USING "btree" ("marca", "modelo");



CREATE INDEX "idx_inventario_cache_original_id" ON "public"."inventario_cache" USING "btree" ("ordenfolio");



CREATE INDEX "idx_inventario_cache_precio" ON "public"."inventario_cache" USING "btree" ("precio");



CREATE INDEX "idx_inventario_cache_slug" ON "public"."inventario_cache" USING "btree" ("slug");



CREATE INDEX "idx_job_applications_user_id" ON "public"."job_applications" USING "btree" ("user_id");



CREATE INDEX "idx_job_applications_vacancy_id" ON "public"."job_applications" USING "btree" ("vacancy_id");



CREATE INDEX "idx_lead_reminders_agent_id" ON "public"."lead_reminders" USING "btree" ("agent_id");



CREATE INDEX "idx_lead_reminders_agent_pending" ON "public"."lead_reminders" USING "btree" ("agent_id", "is_completed") WHERE ("is_completed" = false);



COMMENT ON INDEX "public"."idx_lead_reminders_agent_pending" IS 'Quick lookup of pending reminders by agent';



CREATE INDEX "idx_lead_reminders_is_completed" ON "public"."lead_reminders" USING "btree" ("is_completed");



CREATE INDEX "idx_lead_reminders_lead_id" ON "public"."lead_reminders" USING "btree" ("lead_id");



CREATE INDEX "idx_lead_reminders_reminder_date" ON "public"."lead_reminders" USING "btree" ("reminder_date");



CREATE INDEX "idx_lead_tag_associations_lead_id" ON "public"."lead_tag_associations" USING "btree" ("lead_id");



CREATE INDEX "idx_lead_tag_associations_tag_id" ON "public"."lead_tag_associations" USING "btree" ("tag_id");



CREATE INDEX "idx_listing_images_listing_id_position" ON "public"."listing_images" USING "btree" ("listing_id", "position");



CREATE INDEX "idx_listing_images_listing_id_role_position" ON "public"."listing_images" USING "btree" ("listing_id", "role", "position");



CREATE INDEX "idx_messages_sender" ON "public"."messages" USING "btree" ("sender_id");



CREATE INDEX "idx_profiles_asesor_last_assigned" ON "public"."profiles" USING "btree" ("asesor_autorizado_acceso", "last_assigned_at");



CREATE INDEX "idx_profiles_contactado" ON "public"."profiles" USING "btree" ("contactado");



CREATE INDEX "idx_profiles_created_at" ON "public"."profiles" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_profiles_id" ON "public"."profiles" USING "btree" ("id");



CREATE INDEX "idx_profiles_last_assigned" ON "public"."profiles" USING "btree" ("last_assigned_at") WHERE ("role" = 'sales'::"public"."user_role");



CREATE INDEX "idx_profiles_rfc" ON "public"."profiles" USING "btree" ("rfc") WHERE ("rfc" IS NOT NULL);



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");



COMMENT ON INDEX "public"."idx_profiles_role" IS 'Fast filtering by user role (admin/sales/user)';



CREATE INDEX "idx_profiles_source" ON "public"."profiles" USING "btree" ("source") WHERE ("source" IS NOT NULL);



CREATE INDEX "idx_search_cache_count" ON "public"."search_cache" USING "btree" ("search_count" DESC);



CREATE INDEX "idx_search_cache_last_searched" ON "public"."search_cache" USING "btree" ("last_searched_at" DESC);



CREATE INDEX "idx_search_cache_query" ON "public"."search_cache" USING "btree" ("search_query");



CREATE INDEX "idx_uploaded_documents_application_id" ON "public"."uploaded_documents" USING "btree" ("application_id");



CREATE INDEX "idx_uploaded_documents_created_at_desc" ON "public"."uploaded_documents" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_uploaded_documents_document_type" ON "public"."uploaded_documents" USING "btree" ("document_type");



CREATE INDEX "idx_uploaded_documents_status" ON "public"."uploaded_documents" USING "btree" ("status");



CREATE INDEX "idx_uploaded_documents_user" ON "public"."uploaded_documents" USING "btree" ("user_id");



CREATE INDEX "idx_uploaded_documents_user_app" ON "public"."uploaded_documents" USING "btree" ("user_id", "application_id");



COMMENT ON INDEX "public"."idx_uploaded_documents_user_app" IS 'Optimizes listDocuments query (N+1 issue prevention)';



CREATE INDEX "idx_uploaded_documents_user_id" ON "public"."uploaded_documents" USING "btree" ("user_id");



CREATE INDEX "idx_uploaded_documents_user_id_application_id" ON "public"."uploaded_documents" USING "btree" ("user_id", "application_id");



CREATE INDEX "idx_user_favorites_user" ON "public"."user_favorites" USING "btree" ("user_id");



CREATE INDEX "idx_user_favorites_user_id" ON "public"."user_favorites" USING "btree" ("user_id");



CREATE INDEX "idx_user_favorites_user_vehicle" ON "public"."user_favorites" USING "btree" ("user_id", "vehicle_id");



COMMENT ON INDEX "public"."idx_user_favorites_user_vehicle" IS 'Optimizes favorite toggle and checks';



CREATE INDEX "idx_user_favorites_vehicle_id" ON "public"."user_favorites" USING "btree" ("vehicle_id");



COMMENT ON INDEX "public"."idx_user_favorites_vehicle_id" IS 'Fast lookup of favorite count by vehicle';



CREATE INDEX "idx_user_search_history_clerk_user_id" ON "public"."user_search_history" USING "btree" ("clerk_user_id");



CREATE INDEX "idx_user_search_history_searched_at" ON "public"."user_search_history" USING "btree" ("searched_at" DESC);



CREATE INDEX "idx_user_vehicles_for_sale_created_at_desc" ON "public"."user_vehicles_for_sale" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_user_vehicles_for_sale_status" ON "public"."user_vehicles_for_sale" USING "btree" ("status");



CREATE INDEX "idx_user_vehicles_for_sale_user_id" ON "public"."user_vehicles_for_sale" USING "btree" ("user_id");



CREATE INDEX "idx_user_vehicles_for_sale_user_status" ON "public"."user_vehicles_for_sale" USING "btree" ("user_id", "status");



COMMENT ON INDEX "public"."idx_user_vehicles_for_sale_user_status" IS 'Optimizes getSellListings query';



CREATE INDEX "idx_vacancies_status" ON "public"."vacancies" USING "btree" ("status");



CREATE INDEX "idx_vehicle_cache_autoano" ON "public"."vehicle_cache" USING "btree" ("autoano");



CREATE INDEX "idx_vehicle_cache_automarca" ON "public"."vehicle_cache" USING "btree" ("automarca");



CREATE INDEX "idx_vehicle_cache_autoprecio" ON "public"."vehicle_cache" USING "btree" ("autoprecio");



CREATE INDEX "idx_vehicle_cache_cached_at" ON "public"."vehicle_cache" USING "btree" ("cached_at" DESC);



CREATE INDEX "idx_vehicle_cache_ordencompra" ON "public"."vehicle_cache" USING "btree" ("ordencompra");



CREATE INDEX "idx_vehicle_cache_ordenstatus" ON "public"."vehicle_cache" USING "btree" ("ordenstatus");



CREATE INDEX "idx_vehicle_cache_search" ON "public"."vehicle_cache" USING "gin" ("to_tsvector"('"spanish"'::"regconfig", (((((("titulo" || ' '::"text") || "automarca") || ' '::"text") || "autosubmarcaversion") || ' '::"text") || COALESCE("descripcion", ''::"text"))));



CREATE INDEX "idx_vehicle_cache_separado" ON "public"."vehicle_cache" USING "btree" ("separado");



CREATE INDEX "idx_vehicle_cache_vendido" ON "public"."vehicle_cache" USING "btree" ("vendido");



CREATE INDEX "idx_vehicle_cache_view_count" ON "public"."vehicle_cache" USING "btree" ("view_count" DESC);



CREATE INDEX "idx_vehicle_inspections_created_at_desc" ON "public"."vehicle_inspections" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_vehicle_inspections_status" ON "public"."vehicle_inspections" USING "btree" ("status");



CREATE UNIQUE INDEX "idx_vehicle_inspections_vehicle_id" ON "public"."vehicle_inspections" USING "btree" ("vehicle_id");



COMMENT ON INDEX "public"."idx_vehicle_inspections_vehicle_id" IS 'Fast lookup of inspection by vehicle';



CREATE INDEX "idx_vehicle_price_watches_user" ON "public"."vehicle_price_watches" USING "btree" ("user_id");



CREATE INDEX "idx_vehicle_views_clerk_user_id" ON "public"."vehicle_views" USING "btree" ("clerk_user_id");



CREATE INDEX "idx_vehicle_views_ordencompra" ON "public"."vehicle_views" USING "btree" ("ordencompra");



CREATE INDEX "idx_vehicle_views_viewed_at" ON "public"."vehicle_views" USING "btree" ("viewed_at" DESC);



CREATE INDEX "idx_vehicles_cache_ordencompra" ON "public"."vehicles_cache" USING "btree" ("ordencompra");



CREATE INDEX "idx_vehicles_cache_slug" ON "public"."vehicles_cache" USING "btree" ("slug");



CREATE OR REPLACE TRIGGER "bi_set_user_id_applications" BEFORE INSERT ON "public"."applications" FOR EACH ROW EXECUTE FUNCTION "public"."set_user_id_from_auth"();



CREATE OR REPLACE TRIGGER "bi_set_user_id_bank_profiles" BEFORE INSERT ON "public"."bank_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_user_id_from_auth"();



CREATE OR REPLACE TRIGGER "bi_set_user_id_financing_applications" BEFORE INSERT ON "public"."financing_applications" FOR EACH ROW EXECUTE FUNCTION "public"."set_user_id_from_auth"();



CREATE OR REPLACE TRIGGER "bi_set_user_id_uploaded_documents" BEFORE INSERT ON "public"."uploaded_documents" FOR EACH ROW EXECUTE FUNCTION "public"."set_user_id_from_auth"();



CREATE OR REPLACE TRIGGER "bi_set_user_id_user_vehicles_for_sale" BEFORE INSERT ON "public"."user_vehicles_for_sale" FOR EACH ROW EXECUTE FUNCTION "public"."set_user_id_from_auth"();



CREATE OR REPLACE TRIGGER "on_profiles_updated" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_trigger" BEFORE UPDATE ON "public"."inventario_cache" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id");



ALTER TABLE ONLY "public"."bank_profiles"
    ADD CONSTRAINT "bank_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."beta_poll_responses"
    ADD CONSTRAINT "beta_poll_responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."financing_applications"
    ADD CONSTRAINT "financing_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_applications"
    ADD CONSTRAINT "job_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."job_applications"
    ADD CONSTRAINT "job_applications_vacancy_id_fkey" FOREIGN KEY ("vacancy_id") REFERENCES "public"."vacancies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_reminders"
    ADD CONSTRAINT "lead_reminders_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lead_reminders"
    ADD CONSTRAINT "lead_reminders_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_tag_associations"
    ADD CONSTRAINT "lead_tag_associations_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_tag_associations"
    ADD CONSTRAINT "lead_tag_associations_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."lead_tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listing_images"
    ADD CONSTRAINT "listing_images_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."autos_publicados"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."uploaded_documents"
    ADD CONSTRAINT "uploaded_documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."financing_applications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."uploaded_documents"
    ADD CONSTRAINT "uploaded_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_favorites"
    ADD CONSTRAINT "user_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_vehicles_for_sale"
    ADD CONSTRAINT "user_vehicles_for_sale_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_price_watches"
    ADD CONSTRAINT "vehicle_price_watches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_views"
    ADD CONSTRAINT "vehicle_views_ordencompra_fkey" FOREIGN KEY ("ordencompra") REFERENCES "public"."vehicle_cache"("ordencompra") ON DELETE CASCADE;



CREATE POLICY "Admins and sales can manage all profiles" ON "public"."profiles" USING (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'sales'::"text"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['admin'::"text", 'sales'::"text"])));



CREATE POLICY "Enable insert for admins" ON "public"."app_config" FOR INSERT WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Enable read access for all users" ON "public"."app_config" FOR SELECT USING (true);



CREATE POLICY "Enable update for admins" ON "public"."app_config" FOR UPDATE USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can manage their own profile" ON "public"."profiles" AS RESTRICTIVE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."agent_assignment_state" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."applications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "applications_del" ON "public"."applications" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id")));



CREATE POLICY "applications_ins" ON "public"."applications" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id")));



CREATE POLICY "applications_select" ON "public"."applications" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id")));



CREATE POLICY "applications_upd" ON "public"."applications" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id"))) WITH CHECK (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id")));



CREATE POLICY "asigna_asesor" ON "public"."agent_assignment_state" FOR UPDATE TO "supabase_functions_admin", "svc_sync", "service_role", "postgres" USING (true) WITH CHECK (true);



ALTER TABLE "public"."autos_inventario" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."autos_normalizados_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."autos_publicados" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bank_profiles_select" ON "public"."bank_profiles" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id")));



CREATE POLICY "bank_profiles_update" ON "public"."bank_profiles" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id"))) WITH CHECK (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id")));



CREATE POLICY "bank_profiles_upsert" ON "public"."bank_profiles" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id")));



ALTER TABLE "public"."bank_scoring_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bank_scoring_history_select" ON "public"."bank_scoring_history" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."beta_poll_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."facebook_catalogue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."financing_applications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "financing_apps_del" ON "public"."financing_applications" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id")));



CREATE POLICY "financing_apps_ins" ON "public"."financing_applications" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id")));



CREATE POLICY "financing_apps_select" ON "public"."financing_applications" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id")));



CREATE POLICY "financing_apps_upd" ON "public"."financing_applications" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id"))) WITH CHECK (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id")));



ALTER TABLE "public"."inventario_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lead_reminders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lead_tag_associations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lead_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."listing_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "messages_del" ON "public"."messages" FOR DELETE TO "authenticated" USING (("sender_id" = ( SELECT "public"."current_user_id"() AS "current_user_id")));



CREATE POLICY "messages_ins" ON "public"."messages" FOR INSERT TO "authenticated" WITH CHECK (("sender_id" = ( SELECT "public"."current_user_id"() AS "current_user_id")));



CREATE POLICY "messages_select" ON "public"."messages" FOR SELECT TO "authenticated" USING (("sender_id" = ( SELECT "public"."current_user_id"() AS "current_user_id")));



CREATE POLICY "messages_upd" ON "public"."messages" FOR UPDATE TO "authenticated" USING (("sender_id" = ( SELECT "public"."current_user_id"() AS "current_user_id"))) WITH CHECK (("sender_id" = ( SELECT "public"."current_user_id"() AS "current_user_id")));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ro_select" ON "public"."autos_normalizados_cache" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "ro_select" ON "public"."inventario_cache" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "ro_select" ON "public"."search_cache" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "ro_select" ON "public"."vehicle_cache" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "ro_select" ON "public"."vehicles_cache" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."search_cache" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "uploaded_docs_delete" ON "public"."uploaded_documents" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id")));



CREATE POLICY "uploaded_docs_insert" ON "public"."uploaded_documents" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id")));



CREATE POLICY "uploaded_docs_select" ON "public"."uploaded_documents" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id")));



CREATE POLICY "uploaded_docs_update" ON "public"."uploaded_documents" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id"))) WITH CHECK (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id")));



ALTER TABLE "public"."uploaded_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_favorites" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_favorites_del" ON "public"."user_favorites" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id")));



CREATE POLICY "user_favorites_ins" ON "public"."user_favorites" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id")));



CREATE POLICY "user_favorites_select" ON "public"."user_favorites" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id")));



CREATE POLICY "user_favorites_upd" ON "public"."user_favorites" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id"))) WITH CHECK (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id")));



ALTER TABLE "public"."user_search_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_search_history_select" ON "public"."user_search_history" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."user_vehicles_for_sale" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_vfs_del" ON "public"."user_vehicles_for_sale" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id")));



CREATE POLICY "user_vfs_ins" ON "public"."user_vehicles_for_sale" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id")));



CREATE POLICY "user_vfs_select" ON "public"."user_vehicles_for_sale" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id")));



CREATE POLICY "user_vfs_upd" ON "public"."user_vehicles_for_sale" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id"))) WITH CHECK (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id")));



ALTER TABLE "public"."vacancies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicle_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicle_inspections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicle_price_watches" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "vehicle_price_watches_del" ON "public"."vehicle_price_watches" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id")));



CREATE POLICY "vehicle_price_watches_ins" ON "public"."vehicle_price_watches" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id")));



CREATE POLICY "vehicle_price_watches_select" ON "public"."vehicle_price_watches" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id")));



CREATE POLICY "vehicle_price_watches_upd" ON "public"."vehicle_price_watches" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id"))) WITH CHECK (("user_id" = ( SELECT "public"."current_user_id"() AS "current_user_id")));



ALTER TABLE "public"."vehicle_views" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "vehicle_views_insert" ON "public"."vehicle_views" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "vehicle_views_select" ON "public"."vehicle_views" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."vehicles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicles_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."videos_portal" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";








GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "svc_sync";




























































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































GRANT ALL ON FUNCTION "private"."autos"() TO "anon";



GRANT ALL ON FUNCTION "public"."assign_advisor"("user_id_to_assign" "uuid") TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."assign_advisor"("user_id_to_assign" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."assign_advisor"("user_id_to_assign" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_advisor"("user_id_to_assign" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cache_vehicle_data"("vehicle_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."cache_vehicle_data"("vehicle_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cache_vehicle_data"("vehicle_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_user_onboarding"("p_user_id" "uuid") TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."complete_user_onboarding"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_user_onboarding"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_user_onboarding"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."copy_all_thumbnails_to_inventario"() TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."copy_all_thumbnails_to_inventario"() TO "anon";
GRANT ALL ON FUNCTION "public"."copy_all_thumbnails_to_inventario"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."copy_all_thumbnails_to_inventario"() TO "service_role";



GRANT ALL ON FUNCTION "public"."copy_inventario_to_cache"() TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."copy_inventario_to_cache"() TO "anon";
GRANT ALL ON FUNCTION "public"."copy_inventario_to_cache"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."copy_inventario_to_cache"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_id"() TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."current_user_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_id"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."delete_empty_ordencompra_comprado"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."delete_empty_ordencompra_comprado"() TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."delete_empty_ordencompra_comprado"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_empty_ordencompra_comprado"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_empty_ordencompra_comprado"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."expand_cache_from_data"("p_only_missing" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."expand_cache_from_data"("p_only_missing" boolean) TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."expand_cache_from_data"("p_only_missing" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."expand_cache_from_data"("p_only_missing" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."expand_cache_from_data"("p_only_missing" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_auto_with_images"("ident" "text", "by" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_auto_with_images"("ident" "text", "by" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_auto_with_images"("ident" "text", "by" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_crm_dashboard_stats"() TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."get_crm_dashboard_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_crm_dashboard_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_crm_dashboard_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_distinct_ordenstatus"() TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."get_distinct_ordenstatus"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_distinct_ordenstatus"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_distinct_ordenstatus"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_filter_options"() TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."get_filter_options"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_filter_options"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_filter_options"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_inventario_cache_schema"() TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."get_inventario_cache_schema"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_inventario_cache_schema"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_inventario_cache_schema"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_leads_for_dashboard"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_leads_for_dashboard"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_leads_for_dashboard"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_leads_with_details"() TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."get_leads_with_details"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_leads_with_details"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_leads_with_details"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_my_role"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "service_role";
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "anon";



GRANT ALL ON FUNCTION "public"."get_next_sales_agent"() TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."get_next_sales_agent"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_next_sales_agent"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_next_sales_agent"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_popular_vehicles"("limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_popular_vehicles"("limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_popular_vehicles"("limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_secure_client_profile"("client_id" "uuid") TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."get_secure_client_profile"("client_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_secure_client_profile"("client_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_secure_client_profile"("client_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_thumbnails_for_list"("p_record_ids" "text"[], "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_thumbnails_for_list"("p_record_ids" "text"[], "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_thumbnails_for_list"("p_record_ids" "text"[], "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON TABLE "public"."financing_applications" TO "anon";
GRANT ALL ON TABLE "public"."financing_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."financing_applications" TO "service_role";
GRANT SELECT,UPDATE ON TABLE "public"."financing_applications" TO "svc_sync";
GRANT ALL ON TABLE "public"."financing_applications" TO "supabase_admin";



GRANT ALL ON FUNCTION "public"."get_user_applications"("p_user_id" "uuid") TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."get_user_applications"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_applications"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_applications"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_vacancies_with_application_count"() TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."get_vacancies_with_application_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_vacancies_with_application_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_vacancies_with_application_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_application_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_application_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_application_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_vehicle_views"("vehicle_ordencompra" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_vehicle_views"("vehicle_ordencompra" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_vehicle_views"("vehicle_ordencompra" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_admin_or_sales"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin_or_sales"() TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."is_admin_or_sales"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_or_sales"() TO "service_role";
GRANT ALL ON FUNCTION "public"."is_admin_or_sales"() TO "anon";



GRANT ALL ON FUNCTION "public"."refresh_vehicles_cache"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_vehicles_cache"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_vehicles_cache"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."run_copy_inventario_to_cache"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."run_copy_inventario_to_cache"() TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."run_copy_inventario_to_cache"() TO "anon";
GRANT ALL ON FUNCTION "public"."run_copy_inventario_to_cache"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."run_copy_inventario_to_cache"() TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."inventario_cache" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."inventario_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."inventario_cache" TO "service_role";
GRANT SELECT ON TABLE "public"."inventario_cache" TO PUBLIC;
GRANT ALL ON TABLE "public"."inventario_cache" TO "supabase_admin";



GRANT ALL ON FUNCTION "public"."search_vehicles"("search_term" "text") TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."search_vehicles"("search_term" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_vehicles"("search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_vehicles"("search_term" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_user_id_from_auth"() TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."set_user_id_from_auth"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_user_id_from_auth"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_user_id_from_auth"() TO "service_role";



GRANT ALL ON FUNCTION "public"."submit_application"("application_data" "jsonb") TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."submit_application"("application_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."submit_application"("application_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_application"("application_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_autos_normalizados_cache"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_autos_normalizados_cache"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_autos_normalizados_cache"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."sync_inventario_to_cache"("p_tenant_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."sync_inventario_to_cache"("p_tenant_id" "uuid") TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."sync_inventario_to_cache"("p_tenant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."sync_inventario_to_cache"("p_tenant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_inventario_to_cache"("p_tenant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."try_cast_text"("val" "text", "typ" "regtype") TO "supabase_admin";
GRANT ALL ON FUNCTION "public"."try_cast_text"("val" "text", "typ" "regtype") TO "anon";
GRANT ALL ON FUNCTION "public"."try_cast_text"("val" "text", "typ" "regtype") TO "authenticated";
GRANT ALL ON FUNCTION "public"."try_cast_text"("val" "text", "typ" "regtype") TO "service_role";









































































































GRANT ALL ON TABLE "public"."Admin de Videos" TO "anon";
GRANT ALL ON TABLE "public"."Admin de Videos" TO "authenticated";
GRANT ALL ON TABLE "public"."Admin de Videos" TO "service_role";
GRANT ALL ON TABLE "public"."Admin de Videos" TO "supabase_admin";



GRANT ALL ON TABLE "public"."Inventario" TO "anon";
GRANT ALL ON TABLE "public"."Inventario" TO "authenticated";
GRANT ALL ON TABLE "public"."Inventario" TO "service_role";
GRANT ALL ON TABLE "public"."Inventario" TO "supabase_admin";



GRANT ALL ON TABLE "public"."Registros" TO "anon";
GRANT ALL ON TABLE "public"."Registros" TO "authenticated";
GRANT ALL ON TABLE "public"."Registros" TO "service_role";
GRANT ALL ON TABLE "public"."Registros" TO "supabase_admin";



GRANT ALL ON TABLE "public"."agent_assignment_state" TO "supabase_admin";
GRANT ALL ON TABLE "public"."agent_assignment_state" TO "anon";
GRANT ALL ON TABLE "public"."agent_assignment_state" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_assignment_state" TO "service_role";
GRANT SELECT,UPDATE ON TABLE "public"."agent_assignment_state" TO "svc_sync";



GRANT ALL ON TABLE "public"."app_config" TO "supabase_admin";
GRANT ALL ON TABLE "public"."app_config" TO "anon";
GRANT ALL ON TABLE "public"."app_config" TO "authenticated";
GRANT ALL ON TABLE "public"."app_config" TO "service_role";
GRANT SELECT,UPDATE ON TABLE "public"."app_config" TO "svc_sync";



GRANT ALL ON TABLE "public"."applications" TO "anon";
GRANT ALL ON TABLE "public"."applications" TO "authenticated";
GRANT ALL ON TABLE "public"."applications" TO "service_role";
GRANT ALL ON TABLE "public"."applications" TO "supabase_admin";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."autos_normalizados_cache" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."autos_normalizados_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."autos_normalizados_cache" TO "service_role";
GRANT SELECT,UPDATE ON TABLE "public"."autos_normalizados_cache" TO "svc_sync";
GRANT ALL ON TABLE "public"."autos_normalizados_cache" TO "supabase_admin";



GRANT SELECT("ordencompra") ON TABLE "public"."autos_normalizados_cache" TO "svc_sync";



GRANT UPDATE("last_synced_at") ON TABLE "public"."autos_normalizados_cache" TO "svc_sync";



GRANT UPDATE("feature_image") ON TABLE "public"."autos_normalizados_cache" TO "svc_sync";



GRANT UPDATE("fotos_exterior") ON TABLE "public"."autos_normalizados_cache" TO "svc_sync";



GRANT UPDATE("fotos_interior") ON TABLE "public"."autos_normalizados_cache" TO "svc_sync";



GRANT UPDATE("airtable_id") ON TABLE "public"."autos_normalizados_cache" TO "svc_sync";



GRANT ALL ON TABLE "public"."autos_comprados_view" TO "anon";
GRANT ALL ON TABLE "public"."autos_comprados_view" TO "authenticated";
GRANT ALL ON TABLE "public"."autos_comprados_view" TO "service_role";
GRANT SELECT,UPDATE ON TABLE "public"."autos_comprados_view" TO "svc_sync";
GRANT ALL ON TABLE "public"."autos_comprados_view" TO "supabase_admin";



GRANT ALL ON TABLE "public"."autos_inventario" TO "anon";
GRANT ALL ON TABLE "public"."autos_inventario" TO "authenticated";
GRANT ALL ON TABLE "public"."autos_inventario" TO "service_role";
GRANT ALL ON TABLE "public"."autos_inventario" TO "supabase_admin";



GRANT ALL ON TABLE "public"."autos_publicados" TO "anon";
GRANT ALL ON TABLE "public"."autos_publicados" TO "authenticated";
GRANT ALL ON TABLE "public"."autos_publicados" TO "service_role";
GRANT SELECT,UPDATE ON TABLE "public"."autos_publicados" TO "svc_sync";
GRANT ALL ON TABLE "public"."autos_publicados" TO "supabase_admin";



GRANT ALL ON TABLE "public"."bank_profiles" TO "anon";
GRANT ALL ON TABLE "public"."bank_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_profiles" TO "service_role";
GRANT SELECT,UPDATE ON TABLE "public"."bank_profiles" TO "svc_sync";
GRANT ALL ON TABLE "public"."bank_profiles" TO "supabase_admin";



GRANT ALL ON TABLE "public"."bank_scoring_history" TO "anon";
GRANT ALL ON TABLE "public"."bank_scoring_history" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_scoring_history" TO "service_role";
GRANT ALL ON TABLE "public"."bank_scoring_history" TO "supabase_admin";



GRANT ALL ON TABLE "public"."beta_poll_responses" TO "anon";
GRANT ALL ON TABLE "public"."beta_poll_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."beta_poll_responses" TO "service_role";
GRANT SELECT,UPDATE ON TABLE "public"."beta_poll_responses" TO "svc_sync";
GRANT ALL ON TABLE "public"."beta_poll_responses" TO "supabase_admin";



GRANT ALL ON TABLE "public"."cache" TO "supabase_admin";
GRANT ALL ON TABLE "public"."cache" TO "anon";
GRANT ALL ON TABLE "public"."cache" TO "authenticated";
GRANT ALL ON TABLE "public"."cache" TO "service_role";
GRANT SELECT,UPDATE ON TABLE "public"."cache" TO "svc_sync";



GRANT ALL ON TABLE "public"."comprado_autos_v" TO "anon";
GRANT ALL ON TABLE "public"."comprado_autos_v" TO "authenticated";
GRANT ALL ON TABLE "public"."comprado_autos_v" TO "service_role";
GRANT SELECT,UPDATE ON TABLE "public"."comprado_autos_v" TO "svc_sync";
GRANT ALL ON TABLE "public"."comprado_autos_v" TO "supabase_admin";



GRANT ALL ON TABLE "public"."facebook_catalogue" TO "anon";
GRANT ALL ON TABLE "public"."facebook_catalogue" TO "authenticated";
GRANT ALL ON TABLE "public"."facebook_catalogue" TO "service_role";
GRANT ALL ON TABLE "public"."facebook_catalogue" TO "supabase_admin";



GRANT ALL ON SEQUENCE "public"."facebook_catalogue_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."facebook_catalogue_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."facebook_catalogue_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."facebook_catalogue_id_seq" TO "svc_sync";



GRANT ALL ON SEQUENCE "public"."inventario_cache_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."inventario_cache_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."inventario_cache_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."inventario_cache_id_seq" TO "svc_sync";



GRANT ALL ON TABLE "public"."job_applications" TO "anon";
GRANT ALL ON TABLE "public"."job_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."job_applications" TO "service_role";
GRANT SELECT,UPDATE ON TABLE "public"."job_applications" TO "svc_sync";
GRANT ALL ON TABLE "public"."job_applications" TO "supabase_admin";



GRANT ALL ON TABLE "public"."lead_reminders" TO "anon";
GRANT ALL ON TABLE "public"."lead_reminders" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_reminders" TO "service_role";
GRANT SELECT,UPDATE ON TABLE "public"."lead_reminders" TO "svc_sync";
GRANT ALL ON TABLE "public"."lead_reminders" TO "supabase_admin";



GRANT ALL ON TABLE "public"."lead_tag_associations" TO "anon";
GRANT ALL ON TABLE "public"."lead_tag_associations" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_tag_associations" TO "service_role";
GRANT SELECT,UPDATE ON TABLE "public"."lead_tag_associations" TO "svc_sync";
GRANT ALL ON TABLE "public"."lead_tag_associations" TO "supabase_admin";



GRANT ALL ON TABLE "public"."lead_tags" TO "anon";
GRANT ALL ON TABLE "public"."lead_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_tags" TO "service_role";
GRANT SELECT,UPDATE ON TABLE "public"."lead_tags" TO "svc_sync";
GRANT ALL ON TABLE "public"."lead_tags" TO "supabase_admin";



GRANT ALL ON TABLE "public"."listing_images" TO "anon";
GRANT ALL ON TABLE "public"."listing_images" TO "authenticated";
GRANT ALL ON TABLE "public"."listing_images" TO "service_role";
GRANT SELECT,UPDATE ON TABLE "public"."listing_images" TO "svc_sync";
GRANT ALL ON TABLE "public"."listing_images" TO "supabase_admin";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";
GRANT ALL ON TABLE "public"."messages" TO "supabase_admin";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";
GRANT SELECT,UPDATE ON TABLE "public"."profiles" TO "svc_sync";
GRANT ALL ON TABLE "public"."profiles" TO "supabase_admin";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."search_cache" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."search_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."search_cache" TO "service_role";
GRANT ALL ON TABLE "public"."search_cache" TO "supabase_admin";



GRANT ALL ON TABLE "public"."uploaded_documents" TO "anon";
GRANT ALL ON TABLE "public"."uploaded_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."uploaded_documents" TO "service_role";
GRANT SELECT,UPDATE ON TABLE "public"."uploaded_documents" TO "svc_sync";
GRANT ALL ON TABLE "public"."uploaded_documents" TO "supabase_admin";



GRANT ALL ON TABLE "public"."user_favorites" TO "anon";
GRANT ALL ON TABLE "public"."user_favorites" TO "authenticated";
GRANT ALL ON TABLE "public"."user_favorites" TO "service_role";
GRANT SELECT,UPDATE ON TABLE "public"."user_favorites" TO "svc_sync";
GRANT ALL ON TABLE "public"."user_favorites" TO "supabase_admin";



GRANT ALL ON TABLE "public"."user_search_history" TO "anon";
GRANT ALL ON TABLE "public"."user_search_history" TO "authenticated";
GRANT ALL ON TABLE "public"."user_search_history" TO "service_role";
GRANT ALL ON TABLE "public"."user_search_history" TO "supabase_admin";



GRANT ALL ON TABLE "public"."user_vehicles_for_sale" TO "anon";
GRANT ALL ON TABLE "public"."user_vehicles_for_sale" TO "authenticated";
GRANT ALL ON TABLE "public"."user_vehicles_for_sale" TO "service_role";
GRANT SELECT,UPDATE ON TABLE "public"."user_vehicles_for_sale" TO "svc_sync";
GRANT ALL ON TABLE "public"."user_vehicles_for_sale" TO "supabase_admin";



GRANT ALL ON TABLE "public"."vacancies" TO "anon";
GRANT ALL ON TABLE "public"."vacancies" TO "authenticated";
GRANT ALL ON TABLE "public"."vacancies" TO "service_role";
GRANT SELECT,UPDATE ON TABLE "public"."vacancies" TO "svc_sync";
GRANT ALL ON TABLE "public"."vacancies" TO "supabase_admin";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."vehicle_cache" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."vehicle_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_cache" TO "service_role";
GRANT ALL ON TABLE "public"."vehicle_cache" TO "supabase_admin";



GRANT ALL ON TABLE "public"."vehicle_inspections" TO "anon";
GRANT ALL ON TABLE "public"."vehicle_inspections" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_inspections" TO "service_role";
GRANT SELECT,UPDATE ON TABLE "public"."vehicle_inspections" TO "svc_sync";
GRANT ALL ON TABLE "public"."vehicle_inspections" TO "supabase_admin";



GRANT ALL ON TABLE "public"."vehicle_price_watches" TO "anon";
GRANT ALL ON TABLE "public"."vehicle_price_watches" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_price_watches" TO "service_role";
GRANT SELECT,UPDATE ON TABLE "public"."vehicle_price_watches" TO "svc_sync";
GRANT ALL ON TABLE "public"."vehicle_price_watches" TO "supabase_admin";



GRANT ALL ON TABLE "public"."vehicle_views" TO "anon";
GRANT ALL ON TABLE "public"."vehicle_views" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_views" TO "service_role";
GRANT ALL ON TABLE "public"."vehicle_views" TO "supabase_admin";



GRANT ALL ON TABLE "public"."vehicles" TO "anon";
GRANT ALL ON TABLE "public"."vehicles" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicles" TO "service_role";
GRANT ALL ON TABLE "public"."vehicles" TO "supabase_admin";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."vehicles_cache" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."vehicles_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicles_cache" TO "service_role";
GRANT SELECT,UPDATE ON TABLE "public"."vehicles_cache" TO "svc_sync";
GRANT ALL ON TABLE "public"."vehicles_cache" TO "supabase_admin";



GRANT ALL ON TABLE "public"."videos_portal" TO "anon";
GRANT ALL ON TABLE "public"."videos_portal" TO "authenticated";
GRANT ALL ON TABLE "public"."videos_portal" TO "service_role";
GRANT ALL ON TABLE "public"."videos_portal" TO "supabase_admin";



GRANT ALL ON SEQUENCE "public"."videos_portal_video_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."videos_portal_video_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."videos_portal_video_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."videos_portal_video_id_seq" TO "svc_sync";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "supabase_admin";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "supabase_admin";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "supabase_admin";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,UPDATE ON TABLES  TO "svc_sync";






























RESET ALL;
