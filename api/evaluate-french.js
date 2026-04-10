import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const QUESTIONS = [
  {
    id: 1,
    prompt: "Un client te dit : 'C'est trop cher pour ce que c'est.' Écris ta réponse en 2-3 phrases, comme si tu étais le modèle.",
    min_chars: 30
  },
  {
    id: 2,
    prompt: "Décris en 3 phrases pourquoi un client devrait acheter du contenu exclusif plutôt que du contenu gratuit trouvé en ligne.",
    min_chars: 50
  },
  {
    id: 3,
    prompt: "Un client fidèle revient après 1 mois d'absence. Écris-lui un message d'accueil personnalisé et chaleureux (2-3 phrases).",
    min_chars: 40
  }
];

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { candidate_id, responses } = req.body;

    if (!candidate_id || !responses || !Array.isArray(responses)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const evaluations = [];

    for (const resp of responses) {
      const question = QUESTIONS.find(q => q.id === resp.question_id);
      if (!question) continue;

      const systemPrompt = `Tu es un évaluateur de français pour le recrutement de chatters dans une agence de modèles en ligne (DADASH).

Le candidat devait répondre à cette consigne :
"${question.prompt}"

Voici sa réponse :
"${resp.text}"

Évalue cette réponse selon 4 critères, chacun noté de 0 à 5 :
- orthographe : Nombre de fautes d'orthographe (5=aucune faute, 0=beaucoup de fautes)
- grammaire : Qualité de la construction des phrases (5=parfait, 0=incompréhensible)
- pertinence : La réponse est-elle adaptée à la situation commerciale ? (5=parfaitement, 0=hors sujet)
- ton : Le ton est-il naturel, chaleureux et professionnel ? (5=excellent, 0=robotique/agressif)

Retourne un JSON STRICT (pas de texte autour) :
{
  "orthographe": <0-5>,
  "grammaire": <0-5>,
  "pertinence": <0-5>,
  "ton": <0-5>,
  "total": <0-20>,
  "feedback": "<1 phrase de feedback constructif en français>"
}`;

      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: systemPrompt }]
      });

      let resultText = response.content[0].text.trim();
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const evaluation = JSON.parse(jsonMatch[0]);
        evaluations.push({
          question_id: resp.question_id,
          ...evaluation
        });
      }
    }

    // Calculate total redaction score (average of 3 questions, out of 20, then /10)
    const totalRedaction = evaluations.reduce((sum, e) => sum + e.total, 0) / evaluations.length;
    const scoreRedaction = Math.round((totalRedaction / 20) * 10 * 10) / 10; // /10 with 1 decimal

    return res.status(200).json({
      evaluations,
      score_redaction: scoreRedaction
    });
  } catch (error) {
    console.error('Evaluate French API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
