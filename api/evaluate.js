import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SCORING_CRITERIA = {
  1: {
    name: "Le Nouveau Curieux",
    criteria: `Critères :
- Temps de réponse : Réponse rapide et engageante → max 3 pts
- Ton : Chaleureux et personnalisé → max 3 pts
- Engagement : Pose une question de retour → max 2 pts
- Product tease : Mentionne/tease le contenu disponible → max 2 pts
Total : /10`
  },
  2: {
    name: "Le Hot Lead",
    criteria: `Critères :
- Prix clair : Prix clair en première réponse → max 3 pts
- Upsell : Propose des options/packs → max 2 pts
- Guide paiement : Guide vers le paiement → max 3 pts
- Urgence : Crée de l'urgence → max 2 pts
Total : /10`
  },
  3: {
    name: "La Négociation",
    criteria: `Critères :
- Tient le prix : Ne cède pas immédiatement → max 2 pts
- Justification : Justifie la valeur → max 3 pts
- Alternative : Propose une alternative → max 3 pts
- Vibe positive : Maintient la conversation positive → max 2 pts
Total : /10`
  },
  4: {
    name: "Le Ghosteur",
    criteria: `Critères :
- Initiative : Relance rapidement → max 3 pts
- Ton naturel : Ton naturel et amical → max 2 pts
- Teaser : Inclut un teaser ou rappel → max 3 pts
- Action concrète : Propose une action concrète → max 2 pts
Total : /10`
  },
  5: {
    name: "Le Mécontent",
    criteria: `Critères :
- Calme et empathie : Reste calme et empathique → max 3 pts
- Excuses : S'excuse sincèrement → max 2 pts
- Solution : Propose une solution concrète → max 3 pts
- Escalade : Mentionne l'escalade au gérant si nécessaire → max 2 pts
Total : /10`
  },
  6: {
    name: "Le Bavard",
    criteria: `Critères :
- Rapidité redirect : Redirige en < 2 messages → max 3 pts
- Transition naturelle : Transition naturelle (pas brusque) → max 3 pts
- Offre concrète : Propose quelque chose de concret → max 2 pts
- Pas piégé : Ne tombe pas dans le piège du bavardage → max 2 pts
Total : /10`
  },
  7: {
    name: "Le Multi-Modèle",
    criteria: `Critères :
- Connaissance modèle : Connaît les spécialités du modèle actuel → max 3 pts
- Pas de dénigrement : Valorise sans dénigrer → max 2 pts
- Cross-sell : Propose un cross-sell ou duo → max 3 pts
- Professionnalisme : Reste professionnel → max 2 pts
Total : /10`
  },
  8: {
    name: "L'Urgence",
    criteria: `Critères :
- Vitesse réponse : Réponse très rapide → max 4 pts
- Process paiement : Process de paiement clair immédiatement → max 3 pts
- Excitation : Crée l'excitation → max 1 pt
- Confirmation livraison : Confirme la livraison rapide → max 2 pts
Total : /10`
  },
  9: {
    name: "Le Récurrent",
    criteria: `Critères :
- Accueil personnalisé : Accueil personnalisé → max 3 pts
- Nouveautés pertinentes : Propose des nouveautés pertinentes → max 3 pts
- Geste fidélité : Geste fidélité → max 2 pts
- Fluidité : Fluidité de la conversation → max 2 pts
Total : /10`
  },
  10: {
    name: "Le Scammer",
    criteria: `Critères :
- Refuse gratuit : Refuse le contenu gratuit → max 3 pts
- Refuse externe : Refuse le canal externe → max 3 pts
- Alternative payante : Propose une alternative payante → max 2 pts
- Flag comportement : Flag/signale le comportement suspect → max 2 pts
Total : /10`
  }
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { candidate_id, scenario_id, conversation } = req.body;

    if (!candidate_id || !scenario_id || !conversation) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const scenarioCriteria = SCORING_CRITERIA[scenario_id];
    if (!scenarioCriteria) {
      return res.status(400).json({ error: 'Invalid scenario_id' });
    }

    // Format conversation transcript
    const transcript = conversation.map(msg => {
      const role = msg.role === 'spender' ? 'Spender' : 'Chatter (candidat)';
      return `${role}: ${msg.text}`;
    }).join('\n');

    const systemPrompt = `Tu es un évaluateur de test de chatting pour l'agence DADASH.

Voici la conversation entre le chatter (candidat) et le spender (IA) pour le SCÉNARIO ${scenario_id} — ${scenarioCriteria.name} :

${transcript}

${scenarioCriteria.criteria}

Évalue le candidat et retourne un JSON STRICT (pas de texte autour) :
{
  "score": <entier 0-10>,
  "breakdown": {
    "<critère1>": <points>,
    "<critère2>": <points>
  },
  "feedback": "<1 phrase de feedback constructif en français>"
}`;

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{ role: 'user', content: systemPrompt }]
    });

    let resultText = response.content[0].text.trim();
    // Extract JSON from potential markdown code blocks
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Failed to parse evaluation' });
    }

    const evaluation = JSON.parse(jsonMatch[0]);

    return res.status(200).json(evaluation);
  } catch (error) {
    console.error('Evaluate API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
