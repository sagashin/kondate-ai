import { GoogleGenAI, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { dishName, ingredients = [], fridgeItems = [], mood = '' } = body;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          advice: `「${dishName}」は${ingredients.slice(0, 3).join('・')}の旨みを活かした一品です。副菜にはさっぱりとした酢の物や旬の野菜スープを合わせると栄養バランスがさらに整います！`,
          substitutions: '冷蔵庫の余り野菜（きのこ類やキャベツ・もやし）をプラスするとカサ増し＆節約になります。',
          timeSaverTip: '調味料をあらかじめ器で混ぜ合わせておくと、炒めすぎを防いで15分以内で手早く仕上がります。',
        },
        { status: 200 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `料理名: ${dishName}
主な材料: ${ingredients.join(', ')}
冷蔵庫にある食材: ${fridgeItems.length > 0 ? fridgeItems.join(', ') : '特になし'}
今日の気分: ${mood || 'おまかせ'}

この料理をさらに美味しく・手早く作るための「プロのワンポイント＆副菜ペアリング」「冷蔵庫食材での代用・アレンジ案」「時短のコツ」を簡潔に日本語で提案してください。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            advice: {
              type: Type.STRING,
              description: '美味しさアップのコツと副菜ペアリング提案（80文字程度）',
            },
            substitutions: {
              type: Type.STRING,
              description: '冷蔵庫にある食材を活かしたアレンジや代用案（70文字程度）',
            },
            timeSaverTip: {
              type: Type.STRING,
              description: '調理時間を短縮する実践テクニック（70文字程度）',
            },
          },
          required: ['advice', 'substitutions', 'timeSaverTip'],
        },
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json(
      {
        advice: 'あらかじめ合わせ調味料を用意しておくと、火を通しすぎずプロの味に仕上がります。',
        substitutions: '冷蔵庫にあるきのこ類や旬の葉物野菜を加えると彩りと栄養価がアップします。',
        timeSaverTip: '根菜や火の通りにくい食材は電子レンジ（600W 2分）で下加熱すると大幅時短になります。',
      },
      { status: 200 }
    );
  }
}
