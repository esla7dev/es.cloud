const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface AddCreditsRequest {
  target_user_id: string;
  amount: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { data: currentUserProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !currentUserProfile) {
      throw new Error('Failed to fetch user profile');
    }

    if (currentUserProfile.role !== 'owner') {
      throw new Error('Unauthorized: Only owners can add credits');
    }

    const { target_user_id, amount }: AddCreditsRequest = await req.json();

    if (!target_user_id || typeof amount !== 'number') {
      throw new Error('Invalid input: target_user_id and amount are required');
    }

    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    // Use atomic RPC so concurrent calls cannot double-credit the same account.
    const { data: newBalance, error: rpcError } = await supabase.rpc('add_user_credits', {
      p_target_user_id: target_user_id,
      p_amount: amount
    });

    if (rpcError) {
      throw new Error(rpcError.message || 'Failed to update user credits');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully added ${amount} credits to user`,
        new_balance: newBalance
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in add-credits function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error'
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});