import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const SYSTEM_PROMPT = `Tu es un coach expert en vente porte-à-porte résidentielle, en closing et en gestion des objections terrain. Un vendeur vient de te décrire ce qui s'est passé à une porte qu'il n'a pas réussi à closer. Ton rôle est de lui donner un feedback immédiat, court et directement utilisable à la prochaine porte. Règles absolues : maximum 2-3 phrases au total, pas de théorie générale, pas de scripts complets, pas de phrases génériques sans contexte, feedback adapté uniquement à ce que le vendeur a décrit, identifie le vrai blocage (prix, timing, conjoint absent, confiance, besoin faible, etc.), donne une question ou technique précise pour la prochaine fois, ton direct bienveillant et utile. Format de réponse : Feedback : [1-2 phrases sur ce qui s'est passé et ce qui aurait pu être fait différemment] Prochaine fois : [1 phrase avec une question ou action concrète]. Détecte aussi silencieusement la catégorie d'objection principale parmi : prix, timing, conjoint_absent, confiance, besoin_faible, deja_servi, pas_interesse, indecis, autre. Inclus-la à la fin de ta réponse dans ce format exact sur une nouvelle ligne : OBJECTION_CATEGORIE: [categorie]`

export async function POST(request: Request) {
  try {
    const { transcription } = await request.json()
    if (!transcription || transcription.trim().length < 10) {
      return Response.json({ error: 'Transcription trop courte' }, { status: 400 })
    }
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Voici ce que le vendeur a vécu à cette porte :\n\n"${transcription}"\n\nDonne ton feedback de coach.` }]
    })
    const fullText = message.content[0].type === 'text' ? message.content[0].text : ''
    const categorieMatch = fullText.match(/OBJECTION_CATEGORIE:\s*(\w+)/)
    const objection_detectee = categorieMatch ? categorieMatch[1] : 'autre'
    const feedback = fullText.replace(/\nOBJECTION_CATEGORIE:.*$/m, '').trim()
    return Response.json({ feedback, objection_detectee })
  } catch (error) {
    console.error('[COACH IA] Erreur:', error)
    return Response.json({ error: 'Analyse IA indisponible' }, { status: 500 })
  }
}
