import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('❌ Supabase environment variables are missing');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (req.headers.authorization !== `Bearer ${ADMIN_API_KEY}`) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('📨 Email:', email);

    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('❌ listUsers error:', listError.message);
      return res.status(500).json({ error: 'listUsers failed' });
    }

    const target = users?.users.find((u) => u.email === email);
    if (!target) {
      console.warn('⚠️ User not found:', email);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('🎯 Deleting user ID:', target.id);

    const { error: deleteError } = await supabase.auth.admin.deleteUser(target.id);
    if (deleteError) {
      console.error('❌ deleteUser error:', deleteError.message);
      return res.status(500).json({ error: 'Delete failed' });
    }

    return res.status(200).json({ success: true, deleted: email });
  } catch (err: any) {
    console.error('🔥 Unexpected error:', err.message || err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
