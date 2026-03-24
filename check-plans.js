const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPlans() {
  const { data: plans } = await supabase.from('plans').select('*');
  console.log("PLANS:", plans);

  const { data: planModules } = await supabase.from('plan_modules').select('*');
  console.log("PLAN_MODULES:", planModules);
}

checkPlans();
