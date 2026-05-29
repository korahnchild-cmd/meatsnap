exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { imageBase64, mimeType, species, cut, weight } = JSON.parse(event.body);
    if (!imageBase64) throw new Error('No image');

    // 부위별 기준표
    const standards = {
      // ── 돼지고기 ──
      '삼겹살': {
        desc: '얇게 썰어 겹쳐서 나오는 부위. 지방층(흰색)과 살코기(빨간색)가 층층이 보임',
        guides: {
          200: '접시 면적의 약 30%. 두께 0.3~0.5cm, 2~3겹, 손바닥 절반 크기',
          300: '접시 면적의 약 45%. 두께 0.3~0.5cm, 3~4겹, 손바닥 크기',
          400: '접시 면적의 약 60%. 두께 0.3~0.5cm, 4~5겹, 손바닥보다 약간 큰 크기',
          500: '접시 면적의 약 75%. 두께 0.3~0.5cm, 5~6겹, 접시 대부분을 덮음',
          600: '접시 면적의 약 90% 이상. 두께 0.3~0.5cm, 6~7겹, 접시 거의 가득',
        }
      },
      '목살': {
        desc: '두껍게 썰려 나오는 부위. 지방 마블링이 있고 조각이 두툼함',
        guides: {
          200: '접시 면적의 약 25%. 두께 1~1.5cm, 3~4조각',
          300: '접시 면적의 약 35%. 두께 1~1.5cm, 4~5조각',
          400: '접시 면적의 약 50%. 두께 1~1.5cm, 5~6조각',
          500: '접시 면적의 약 65%. 두께 1~1.5cm, 6~8조각',
          600: '접시 면적의 약 75%. 두께 1~1.5cm, 8~10조각',
        }
      },
      '항정살': {
        desc: '작고 불규칙한 모양의 조각들. 지방이 많고 쫄깃한 식감',
        guides: {
          200: '접시 면적의 약 20%. 두께 1~2cm, 4~5조각',
          300: '접시 면적의 약 30%. 두께 1~2cm, 6~8조각',
          400: '접시 면적의 약 40%. 두께 1~2cm, 8~10조각',
          500: '접시 면적의 약 55%. 두께 1~2cm, 10~13조각',
          600: '접시 면적의 약 65%. 두께 1~2cm, 13~16조각',
        }
      },
      '돼지갈비': {
        desc: '뼈가 붙어있는 부위. 뼈 무게 포함으로 실제 살코기는 표시 무게의 60~70%',
        guides: {
          200: '뼈 포함 2~3대. 실살코기는 약 120~140g 수준',
          300: '뼈 포함 3~4대. 실살코기는 약 180~210g 수준',
          400: '뼈 포함 4~5대. 실살코기는 약 240~280g 수준',
          500: '뼈 포함 5~6대. 실살코기는 약 300~350g 수준',
          600: '뼈 포함 6~8대. 실살코기는 약 360~420g 수준',
        }
      },
      '막창': {
        desc: '구불구불한 내장 형태. 조리 후 수축되어 크기가 작아짐',
        guides: {
          200: '접시 면적의 약 25%. 손가락 굵기 조각 8~10개',
          300: '접시 면적의 약 40%. 손가락 굵기 조각 12~15개',
          400: '접시 면적의 약 55%. 손가락 굵기 조각 16~20개',
          500: '접시 면적의 약 65%. 손가락 굵기 조각 20~25개',
          600: '접시 면적의 약 80%. 손가락 굵기 조각 25~30개',
        }
      },
      // ── 소고기 ──
      '등심': {
        desc: '두꺼운 덩어리 형태. 마블링(지방 무늬)이 있고 붉은 살코기',
        guides: {
          200: '접시 면적의 약 20%. 두께 1.5~2cm, 2~3조각',
          300: '접시 면적의 약 28%. 두께 1.5~2cm, 3~4조각',
          400: '접시 면적의 약 38%. 두께 1.5~2cm, 4~5조각',
          500: '접시 면적의 약 48%. 두께 1.5~2cm, 5~6조각',
          600: '접시 면적의 약 58%. 두께 1.5~2cm, 6~8조각',
        }
      },
      '갈비살': {
        desc: '뼈 없이 얇게 썰린 형태 또는 뼈 포함. 붉은색 살코기에 지방층',
        guides: {
          200: '접시 면적의 약 30%. 두께 0.5~1cm, 3~4조각',
          300: '접시 면적의 약 42%. 두께 0.5~1cm, 4~5조각',
          400: '접시 면적의 약 55%. 두께 0.5~1cm, 5~7조각',
          500: '접시 면적의 약 68%. 두께 0.5~1cm, 7~9조각',
          600: '접시 면적의 약 80%. 두께 0.5~1cm, 9~11조각',
        }
      },
      '안창살': {
        desc: '길쭉한 모양의 조각들. 근육 결이 선명하고 붉은색',
        guides: {
          200: '접시 면적의 약 22%. 두께 1~1.5cm, 4~5조각',
          300: '접시 면적의 약 33%. 두께 1~1.5cm, 6~7조각',
          400: '접시 면적의 약 44%. 두께 1~1.5cm, 8~9조각',
          500: '접시 면적의 약 55%. 두께 1~1.5cm, 10~12조각',
          600: '접시 면적의 약 66%. 두께 1~1.5cm, 12~14조각',
        }
      },
      '부채살': {
        desc: '부채 모양의 넓적한 조각. 결이 고르고 붉은색',
        guides: {
          200: '접시 면적의 약 28%. 두께 0.8~1cm, 3~4조각',
          300: '접시 면적의 약 40%. 두께 0.8~1cm, 4~5조각',
          400: '접시 면적의 약 52%. 두께 0.8~1cm, 5~7조각',
          500: '접시 면적의 약 65%. 두께 0.8~1cm, 7~9조각',
          600: '접시 면적의 약 78%. 두께 0.8~1cm, 9~11조각',
        }
      },
      '차돌박이': {
        desc: '종이처럼 얇게 썰린 흰색 지방층과 붉은 살코기. 겹겹이 쌓여 나옴',
        guides: {
          200: '접시 면적의 약 35%. 두께 0.2~0.3cm, 10~12장',
          300: '접시 면적의 약 50%. 두께 0.2~0.3cm, 15~18장',
          400: '접시 면적의 약 65%. 두께 0.2~0.3cm, 20~24장',
          500: '접시 면적의 약 78%. 두께 0.2~0.3cm, 25~30장',
          600: '접시 면적의 약 90%. 두께 0.2~0.3cm, 30~36장',
        }
      },
      '불고기': {
        desc: '양념된 얇은 고기가 넓게 퍼져 있음. 양파 등 채소가 섞여 있을 수 있음',
        guides: {
          200: '접시 면적의 약 40%. 얇게 다진 고기가 고르게 분포',
          300: '접시 면적의 약 55%. 얇게 다진 고기가 고르게 분포',
          400: '접시 면적의 약 70%. 얇게 다진 고기가 고르게 분포',
          500: '접시 면적의 약 82%. 얇게 다진 고기가 고르게 분포',
          600: '접시 면적의 약 95%. 접시 거의 가득',
        }
      },
    };

    const cutStandard = standards[cut];
    const weightNum = parseInt(weight);

    // 가장 가까운 무게 기준 찾기
    const availableWeights = [200, 300, 400, 500, 600];
    const closestWeight = availableWeights.reduce((prev, curr) =>
      Math.abs(curr - weightNum) < Math.abs(prev - weightNum) ? curr : prev
    );
    const guide = cutStandard ? cutStandard.guides[closestWeight] : null;

    const prompt = `당신은 한국 고깃집 고기 무게 판정 전문 AI입니다.
아래 기준을 엄격하게 적용해서 판정하세요.

【주문 정보】
- 축종: ${species}
- 부위: ${cut}
- 주문 무게: ${weight}g

【${cut} 부위 특성】
${cutStandard ? cutStandard.desc : '일반 고기 부위'}

【${weight}g 정량 기준】
한국 고깃집 표준 접시(지름 25~28cm) 기준:
${guide || `접시 면적의 약 40~50% 차지`}

【판정 기준 (엄격 적용)】
- 🔴 적음: 위 기준보다 면적이나 조각 수가 15% 이상 적은 경우
- 🟡 보통: 위 기준과 ±15% 이내로 비슷한 경우
- 🟢 많음: 위 기준보다 면적이나 조각 수가 15% 이상 많은 경우

【중요 판정 지침】
1. 접시 대비 고기가 차지하는 면적 비율을 가장 중요하게 봐야 합니다
2. 고기 두께와 조각 수도 함께 고려하세요
3. 애매하면 🔴 적음 쪽으로 판정하세요 (소비자 보호 원칙)
4. "보통"은 정말 기준에 딱 맞을 때만 사용하세요

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 절대 금지:
{
  "verdict": "red" 또는 "yellow" 또는 "green",
  "confidence": 숫자(판정 확신도에 따라 58~84 사이. 매우 확실하면 78~84, 보통이면 68~76, 애매하면 58~66),
  "comment": "접시 대비 비율과 조각 수를 근거로 한 2문장 이내 한국어 판정 코멘트"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
              { text: prompt }
            ]
          }],
          generationConfig: { maxOutputTokens: 400, temperature: 0.2 }
        })
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      throw new Error('API 호출 실패: ' + JSON.stringify(errData));
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('파싱 실패');
    const parsed = JSON.parse(jsonMatch[0]);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, result: parsed })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
