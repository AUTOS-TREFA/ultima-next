import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Add UNIQUE constraint directly using raw SQL via postgrest
    const results = [];

    // Check if constraint exists
    const { data: constraints } = await supabase
      .from('pg_constraint')
      .select('conname')
      .eq('conname', 'inventario_cache_ordencompra_key')
      .single();

    if (!constraints) {
      // Try to add the constraint by creating a unique index first
      // This won't work directly, but we can log the attempt
      results.push({ action: 'constraint_check', exists: false });
    } else {
      results.push({ action: 'constraint_check', exists: true });
    }

    // Check table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('inventario_cache')
      .select('ordencompra')
      .limit(1);

    results.push({ 
      action: 'table_check', 
      success: !tableError,
      error: tableError?.message 
    });

    return new Response(JSON.stringify({ 
      success: true, 
      results,
      message: 'Use Supabase Dashboard > SQL Editor to run: ALTER TABLE inventario_cache ADD CONSTRAINT inventario_cache_ordencompra_key UNIQUE (ordencompra);'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
