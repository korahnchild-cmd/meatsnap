exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    const {
      restaurant_name,
      restaurant_address,
      species,
      cut,
      ordered_weight,
      verdict,
      confidence,
      ai_comment,
    } = body;

    if (!restaurant_name) {
      return { statusCode: 400, body: JSON.stringify({ error: '식당 이름 필수' }) };
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

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
