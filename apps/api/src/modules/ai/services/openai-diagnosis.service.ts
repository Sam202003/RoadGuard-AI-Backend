import type { Env } from '@roadguard/config';
import { ProviderType } from '../../providers/constants/provider.enums.js';
import {
  DiagnosisSeverity,
  EmergencyLevel,
} from '../constants/ai.enums.js';
import type { DiagnoseBody } from '../validators/ai.validator.js';
import {
  aiDiagnosisResultSchema,
  type AiDiagnosisResult,
} from '../validators/ai.validator.js';

const SYSTEM_PROMPT = `You are Road Guard's roadside breakdown assistant for India.
Analyze the customer's vehicle problem and respond ONLY with valid JSON matching this schema:
{
  "probableIssue": "string - concise diagnosis",
  "severity": "LOW|MEDIUM|HIGH|CRITICAL",
  "safeToDrive": boolean,
  "emergencyLevel": "NONE|LOW|MEDIUM|HIGH|CRITICAL",
  "recommendedProvider": "MECHANIC|TOWING|FUEL_DELIVERY|BATTERY_SUPPORT|EV_SUPPORT",
  "precautions": ["string array of 2-5 safety steps"],
  "temporaryAdvice": "string - immediate actions before help arrives"
}
Rules:
- If accident, fire, smoke, unconsciousness, or trapped: emergencyLevel CRITICAL, safeToDrive false.
- Flat tire on highway: safeToDrive false unless spare confirmed.
- Out of fuel: recommendedProvider FUEL_DELIVERY.
- Battery/jump start: BATTERY_SUPPORT.
- EV/hybrid low charge: EV_SUPPORT.
- Engine won't start / overheating / brakes: usually MECHANIC or TOWING.
- Be conservative on safety. No markdown. JSON only.`;

interface OpenAiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function buildMessages(body: DiagnoseBody): OpenAiMessage[] {
  const messages: OpenAiMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }];

  if (body.contextMessages?.length) {
    for (const msg of body.contextMessages) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  messages.push({ role: 'user', content: body.message });
  return messages;
}

function parseJsonFromContent(content: string): unknown {
  const trimmed = content.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON object in model response');
  }
  return JSON.parse(jsonMatch[0]) as unknown;
}

function validateDiagnosisResult(raw: unknown): AiDiagnosisResult {
  return aiDiagnosisResultSchema.parse(raw);
}

function fallbackDiagnosis(message: string): AiDiagnosisResult {
  const lower = message.toLowerCase();

  if (
    lower.includes('accident') ||
    lower.includes('crash') ||
    lower.includes('fire') ||
    lower.includes('smoke') ||
    lower.includes('unconscious')
  ) {
    return {
      probableIssue: 'Possible accident or critical safety event',
      severity: DiagnosisSeverity.CRITICAL,
      safeToDrive: false,
      emergencyLevel: EmergencyLevel.CRITICAL,
      recommendedProvider: ProviderType.TOWING,
      precautions: [
        'Move to a safe location if possible without risking injury',
        'Turn on hazard lights immediately',
        'Call emergency services if anyone is injured',
        'Do not attempt to drive the vehicle',
      ],
      temporaryAdvice:
        'Stay clear of traffic, call emergency services if needed, and request roadside assistance immediately.',
    };
  }

  if (lower.includes('fuel') || lower.includes('petrol') || lower.includes('diesel') || lower.includes('empty tank')) {
    return {
      probableIssue: 'Vehicle likely out of fuel',
      severity: DiagnosisSeverity.MEDIUM,
      safeToDrive: false,
      emergencyLevel: EmergencyLevel.LOW,
      recommendedProvider: ProviderType.FUEL_DELIVERY,
      precautions: [
        'Pull over safely away from traffic',
        'Turn on hazard lights',
        'Stay inside the vehicle if on a busy road',
      ],
      temporaryAdvice:
        'Request fuel delivery. Do not walk along the highway to fetch fuel unless it is safe to do so.',
    };
  }

  if (lower.includes('battery') || lower.includes('jump') || lower.includes('won\'t start') || lower.includes('wont start')) {
    return {
      probableIssue: 'Possible battery failure or starting system issue',
      severity: DiagnosisSeverity.MEDIUM,
      safeToDrive: false,
      emergencyLevel: EmergencyLevel.LOW,
      recommendedProvider: ProviderType.BATTERY_SUPPORT,
      precautions: [
        'Avoid repeated cranking — it can drain the battery further',
        'Ensure the vehicle is in park/neutral with handbrake engaged',
        'Do not attempt jump-start if cables or battery are damaged',
      ],
      temporaryAdvice:
        'Request battery assistance. A jump start or replacement may be needed before driving.',
    };
  }

  if (lower.includes('flat') || lower.includes('tyre') || lower.includes('tire') || lower.includes('puncture')) {
    return {
      probableIssue: 'Flat or damaged tire',
      severity: DiagnosisSeverity.MEDIUM,
      safeToDrive: false,
      emergencyLevel: EmergencyLevel.MEDIUM,
      recommendedProvider: ProviderType.MECHANIC,
      precautions: [
        'Do not drive on a flat tire — it can damage the rim',
        'Move to the shoulder if safely possible',
        'Use hazard lights and reflective triangle if available',
      ],
      temporaryAdvice:
        'If you have a spare and safe conditions, note that for the provider. Otherwise wait for tire repair assistance.',
    };
  }

  if (lower.includes('ev') || lower.includes('electric') || lower.includes('hybrid') || lower.includes('charging')) {
    return {
      probableIssue: 'EV or hybrid energy/charging issue',
      severity: DiagnosisSeverity.MEDIUM,
      safeToDrive: false,
      emergencyLevel: EmergencyLevel.MEDIUM,
      recommendedProvider: ProviderType.EV_SUPPORT,
      precautions: [
        'Avoid towing without EV-safe procedures',
        'Stay clear of high-voltage components if exposed',
        'Keep ventilation if any unusual smell is present',
      ],
      temporaryAdvice:
        'Request EV-specialist roadside help. Portable charging or flatbed towing may be required.',
    };
  }

  if (lower.includes('tow') || lower.includes('engine') || lower.includes('overheat') || lower.includes('smoke')) {
    return {
      probableIssue: 'Engine or mechanical failure requiring professional help',
      severity: DiagnosisSeverity.HIGH,
      safeToDrive: false,
      emergencyLevel: EmergencyLevel.HIGH,
      recommendedProvider: ProviderType.TOWING,
      precautions: [
        'Stop the engine if overheating or unusual noises persist',
        'Do not open a hot radiator cap',
        'Stay clear of the vehicle if smoke is present',
      ],
      temporaryAdvice:
        'Do not attempt to drive. Request towing to a nearby service center.',
    };
  }

  return {
    probableIssue: 'General roadside breakdown — professional assessment recommended',
    severity: DiagnosisSeverity.MEDIUM,
    safeToDrive: false,
    emergencyLevel: EmergencyLevel.LOW,
    recommendedProvider: ProviderType.MECHANIC,
    precautions: [
      'Pull over to a safe location',
      'Turn on hazard lights',
      'Describe symptoms clearly to the provider',
    ],
    temporaryAdvice:
      'Share your exact location and symptoms with Road Guard support. Avoid driving until assessed.',
  };
}

export async function generateDiagnosis(
  env: Env,
  body: DiagnoseBody,
): Promise<{ diagnosis: AiDiagnosisResult; model: string; source: 'openai' | 'fallback' }> {
  const apiKey = env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return {
      diagnosis: fallbackDiagnosis(body.message),
      model: 'roadguard-fallback-v1',
      source: 'fallback',
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: buildMessages(body),
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Empty OpenAI response');
    }

    const parsed = parseJsonFromContent(content);
    const diagnosis = validateDiagnosisResult(parsed);

    return {
      diagnosis,
      model: env.OPENAI_MODEL,
      source: 'openai',
    };
  } catch {
    return {
      diagnosis: fallbackDiagnosis(body.message),
      model: 'roadguard-fallback-v1',
      source: 'fallback',
    };
  }
}
