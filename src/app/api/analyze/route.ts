import { NextRequest, NextResponse } from 'next/server';
import { Language, AnalysisResult, Finding } from '@/lib/types';
import diagnosesData from '@/data/diagnoses.json';

const GEMINI_MODEL = 'gemini-3.1-flash-lite-preview';

const languageNames: Record<Language, string> = {
  es: 'Spanish',
  en: 'English',
  fr: 'French',
  it: 'Italian',
  pt: 'Portuguese',
  de: 'German',
  nl: 'Dutch',
  pl: 'Polish',
  ro: 'Romanian',
  ar: 'Arabic',
  ru: 'Russian',
  zh: 'Chinese (Simplified)',
};

const diagnosisKeys = Object.keys(diagnosesData);

type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      image,
      reportText,
      language = 'es',
    }: { image?: string; reportText?: string; language: Language } = body;
    const cleanReportText = typeof reportText === 'string' ? reportText.trim() : '';

    if (!image && cleanReportText.length < 30) {
      return NextResponse.json({ error: 'No report content provided' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    const langName = languageNames[language] || 'Spanish';

    const prompt = `Analyze this colonoscopy report. Extract ALL endoscopic findings/diagnoses listed.

For each finding:
1. Extract the exact medical term as written in the report (always in the original language of the report)
2. Translate that medical term into ${langName} (medical_name_translated) - use natural, correct ${langName} terminology
3. Identify anatomical location: one of [terminal_ileum, cecum, ascending_colon, hepatic_flexure, transverse_colon, splenic_flexure, descending_colon, sigmoid_colon, rectum, anal_canal, multiple, unspecified]
4. Match to one of these known diagnosis types if applicable: [${diagnosisKeys.join(', ')}]
5. Generate a patient-friendly explanation IN ${langName} with correct grammar and pronunciation for that language:
   - what_is: what is this finding (simple, clear, no medical jargon, 2-4 sentences)
   - implications: what does it mean for the patient's health (reassuring but accurate, 2-4 sentences)
   - follow_up: recommended next steps (practical advice, 2-3 sentences)

Also provide:
- overall_summary: A brief overall summary of the colonoscopy results in ${langName} (2-3 sentences, reassuring tone)
- report_date: Extract the date of the colonoscopy if visible in the report, otherwise null

Return ONLY valid JSON:
{
  "findings": [
    {
      "medical_name": "exact term from report in original language",
      "medical_name_translated": "term translated to ${langName}",
      "location": "one of the valid segments",
      "overall_finding_type": "matching key from known diagnoses or empty string",
      "explanation": {
        "what_is": "patient-friendly explanation in ${langName}",
        "implications": "health implications in ${langName}",
        "follow_up": "next steps in ${langName}"
      }
    }
  ],
  "overall_summary": "summary in ${langName}",
  "report_date": "date string or null"
}

If this is not a colonoscopy report or cannot be read, return:
{"error": "Not a colonoscopy report"}

Language for all explanations: ${langName}`;

    const userParts: GeminiPart[] = [];

    if (image) {
      const imageMatch = image.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/);
      const pdfMatch = image.match(/^data:application\/pdf;base64,(.+)$/);

      if (imageMatch) {
        userParts.push({
          inlineData: {
            mimeType: `image/${imageMatch[1]}`,
            data: imageMatch[2],
          },
        });
      } else if (pdfMatch) {
        userParts.push({
          inlineData: {
            mimeType: 'application/pdf',
            data: pdfMatch[1],
          },
        });
      } else {
        return NextResponse.json({ error: 'Invalid file format' }, { status: 400 });
      }
    }

    if (cleanReportText) {
      userParts.push({
        text: `Report text pasted by the user:\n\n${cleanReportText}`,
      });
    }

    userParts.push({ text: prompt });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: "You are a medical information assistant for Dr. Gianfranco Nardulli Fernandez's colonoscopy platform (endoscopianardulli.es). Analyze colonoscopy reports and provide clear, patient-friendly explanations. Always be accurate but reassuring. Never exaggerate risks. Remind patients to consult their doctor for personalized advice.",
              },
            ],
          },
          contents: [
            {
              role: 'user',
              parts: userParts,
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    const gemini = (await response.json()) as GeminiResponse;

    if (!response.ok || gemini.error) {
      return NextResponse.json(
        { error: gemini.error?.message || 'Gemini service error' },
        { status: response.status || 500 }
      );
    }

    let jsonText = gemini.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('')
      .trim();

    if (!jsonText) {
      return NextResponse.json({ error: 'Unexpected response from Gemini' }, { status: 500 });
    }

    jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');

    let parsed: { error?: string; findings?: Finding[]; overall_summary?: string; report_date?: string | null };
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          return NextResponse.json({ error: 'Failed to parse Gemini response' }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: 'Failed to parse Gemini response' }, { status: 500 });
      }
    }

    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    if (!parsed.findings || !Array.isArray(parsed.findings)) {
      return NextResponse.json({ error: 'Invalid response structure' }, { status: 500 });
    }

    const findingsWithIds: Finding[] = parsed.findings.map((finding, index) => ({
      ...finding,
      id: `finding-${index + 1}`,
    }));

    const result: AnalysisResult = {
      findings: findingsWithIds,
      overall_summary: parsed.overall_summary || '',
      report_date: parsed.report_date ?? null,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
