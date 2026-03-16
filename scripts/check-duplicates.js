const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Basic env parser
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(
  env['NEXT_PUBLIC_SUPABASE_URL'],
  env['SUPABASE_SERVICE_ROLE_KEY']
);

async function checkDuplicates() {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('email, tenant_id');

    if (error) throw error;

    const counts = {};
    const duplicates = [];
    data.forEach(c => {
      const key = `${c.tenant_id}:${c.email}`;
      counts[key] = (counts[key] || 0) + 1;
      if (counts[key] === 2) {
        duplicates.push(c);
      }
    });

    if (duplicates.length > 0) {
      console.log('DUPLICATES_FOUND:', JSON.stringify(duplicates));
    } else {
      console.log('NO_DUPLICATES_FOUND');
    }
  } catch (error) {
    console.error('Error checking duplicates:', error);
    process.exit(1);
  }
}

checkDuplicates();
