import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkDuplicates() {
  const { data, error } = await supabase
    .from('customers')
    .select('email, tenant_id')
    .then(res => {
        if (res.error) throw res.error;
        const counts: Record<string, number> = {};
        const duplicates: Array<{ email: string | null; tenant_id: string | null }> = [];
        res.data?.forEach(c => {
            const key = `${c.tenant_id}:${c.email}`;
            counts[key] = (counts[key] || 0) + 1;
            if (counts[key] === 2) {
                duplicates.push(c);
            }
        });
        return { data: duplicates, error: null };
    });

  if (error) {
    console.error('Error checking duplicates:', error);
    process.exit(1);
  }

  if (data && data.length > 0) {
    console.log('DUPLICATES_FOUND:', JSON.stringify(data));
  } else {
    console.log('NO_DUPLICATES_FOUND');
  }
}

checkDuplicates();
