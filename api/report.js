export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const {
      restaurant_name,
      restaurant_address,
      species,
      cut,
      ordered_weight,
      verdict,
      confidence,
      ai_comment,
    } = req.body;

    if (!restaurant_name) {
      return res.status(400).json({ error: '식당 이름 필수' });
    }

    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/reports`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          restaurant_name,
          restaurant_address: restaurant_address || '',
          species,
          cut,
          ordered_weight,
          verdict,
          confidence,
          ai_comment,
        }),
      }
    );
    if (!response.ok) {
      const err = await response.text();
      throw new Error('Supabase 오류: ' + err);
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
