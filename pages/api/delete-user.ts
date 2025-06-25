import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_API_KEY = process.env.ADMIN_API_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) return res.status(500).json({ error: listError.message });

  const target = users.users.find((u) => u.email === email);
  if (!target) return res.status(404).json({ error: 'User not found' });

  const { error: deleteError } = await supabase.auth.admin.deleteUser(target.id);
  if (deleteError) return res.status(500).json({ error: deleteError.message });

  return res.status(200).json({ success: true, deleted: email });
}
