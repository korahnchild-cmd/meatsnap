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

    // ── 해시 생성 (식당명+주소 → 4자리 코드, 동일 식당은 항상 동일 코드) ──
    function hashCode(str) {
      let h = 0;
      for (let i = 0; i < str.length; i++) {
        h = Math.imul(31, h) + str.charCodeAt(i) | 0;
      }
      return Math.abs(h).toString(16).toUpperCase().padStart(4, '0').slice(0, 4);
    }

    // ── 지역 추출 (주소에서 시/구 단위만) ──
    function extractRegion(address) {
      if (!address) return '지역 미입력';
      const m = address.match(/([가-힣]+시|[가-힣]+도)\s*([가-힣]+구|[가-힣]+군|[가-힣]+시)?/);
      if (m) return [m[1], m[2]].filter(Boolean).join(' ');
      return address.slice(0, 6);
    }

    // ── 업종 레이블 ──
    function speciesLabel(species) {
      const map = { pig: '돼지고기', cow: '소고기' };
      return map[species] || '고기';
    }

    // ── 주의 레벨 계산 ──
    function warningLevel(red, total) {
      if (total < 3) return null; // 3건 미만 비공개
      const ratio = red / total;
      if (ratio >= 0.7) return { label: 'HIGH', emoji: '🚨' };
      if (ratio >= 0.4) return { label: 'MID',  emoji: '⚠️' };
      return { label: 'LOW', emoji: '✅' };
    }

    const map = {};
    for (const row of rows) {
      const key = row.restaurant_name + '||' + (row.restaurant_address || '');
      if (!map[key]) {
        map[key] = {
          _name: row.restaurant_name,
          _address: row.restaurant_address || '',
          hash_code: hashCode(key),
          region: extractRegion(row.restaurant_address || ''),
          species_label: speciesLabel(row.species),
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
      if (row.species) map[key].species_label = speciesLabel(row.species);
      if (row.cut)     map[key].cut = row.cut;
    }

    // 3건 미만 필터링 후 정렬
    const rankings = Object.values(map)
      .filter(r => r.total >= 3)
      .map(r => {
        const level = warningLevel(r.red_count, r.total);
        return {
          hash_code:     r.hash_code,
          region:        r.region,
          species_label: r.species_label,
          cut:           r.cut,
          total:         r.total,
          red_count:     r.red_count,
          yellow_count:  r.yellow_count,
          green_count:   r.green_count,
          warning_level: level ? level.label : 'LOW',
          warning_emoji: level ? level.emoji : '✅',
          // 자발적 인증 신청 식당만 실명 공개 (certified 필드 추후 추가)
          display_name:  r._certified ? r._name : null,
        };
      })
      .sort((a, b) => b.total - a.total);

    return res.status(200).json({ success: true, rankings });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
