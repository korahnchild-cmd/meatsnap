export default async function handler(req, res) {
  try {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/reports?select=restaurant_name,restaurant_address,verdict,species,cut&order=created_at.desc&limit=1000`,
      {
        headers: {
          'apikey': process.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        }
      }
    );
    if (!response.ok) throw new Error('Supabase 조회 실패');
    const rows = await response.json();
    const map = {};
    for (const row of rows) {
      const key = row.restaurant_name;
      if (!map[key]) {
        map[key] = {
          restaurant_name: row.restaurant_name,
          restaurant_address: row.restaurant_address || '',
          species: row.species || '',
          cut: row.cut || '',
          total: 0,
          red_count: 0,
          yellow_count: 0,
          green_count: 0,
        };
      }
      map[key].total++;
      if (row.verdict === 'red')    map[key].red_count++;
      if (row.verdict === 'yellow') map[key].yellow_count++;
      if (row.verdict === 'green')  map[key].green_count++;
      if (row.species) map[key].species = row.species;
      if (row.cut) map[key].cut = row.cut;
    }
    const rankings = Object.values(map).sort((a, b) => b.total - a.total);
    return res.status(200).json({ success: true, rankings });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
