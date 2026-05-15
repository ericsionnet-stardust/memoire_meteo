import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const evenements = [
  {
    date_evenement: '1910-01-28',
    lieu: 'Paris',
    region: 'Île-de-France',
    type_phenomene: 'inondation',
    description:
      "La grande crue de la Seine atteint son niveau record de 8,62 m au pont d'Austerlitz le 28 janvier 1910. Paris est paralysé pendant plusieurs semaines, avec 20 000 immeubles inondés et 150 000 Parisiens sinistrés.",
    citation_exacte:
      "La cote de 8,62 mètres a été atteinte le 28 janvier 1910 au pont d'Austerlitz.",
    source_primaire:
      "Archives de la Préfecture de Police de Paris, rapport du 15 février 1910",
    source_secondaire:
      'Météo-France, "Les grandes inondations de la Seine", dossier pédagogique 2010',
    niveau_fiabilite: 3,
    periode: 'XXe siècle',
    statut: 'validé',
  },
  {
    date_evenement: '2003-08-13',
    lieu: 'Paris (Montsouris)',
    region: 'Île-de-France',
    type_phenomene: 'canicule',
    description:
      "La canicule d'août 2003 est la plus meurtrière jamais enregistrée en France. Le thermomètre atteint 40,4°C à Paris-Montsouris le 13 août 2003. On dénombre officiellement 14 800 décès supplémentaires en France sur la période du 1er au 20 août.",
    citation_exacte:
      'Température maximale enregistrée : 40,4°C le 13 août 2003 à Paris-Montsouris.',
    source_primaire:
      "Météo-France, Bulletin climatologique mensuel d'août 2003",
    source_secondaire:
      'INSERM, "Impact sanitaire de la vague de chaleur en France survenue en août 2003", rapport septembre 2003',
    niveau_fiabilite: 3,
    periode: 'XXIe siècle',
    statut: 'validé',
  },
  {
    date_evenement: '1991-04-20',
    date_approx: 'Fin avril 1991',
    lieu: 'Chartres',
    region: 'Centre-Val de Loire',
    type_phenomene: 'neige_hors_saison',
    description:
      "Une chute de neige exceptionnelle frappe la région Centre en avril 1991, avec jusqu'à 20 cm relevés autour de Chartres entre le 19 et le 21 avril. Les cultures de printemps et les arbres fruitiers en fleurs sont sévèrement endommagés.",
    citation_exacte:
      "Une couche de 20 centimètres a été mesurée à Chartres dans la nuit du 20 au 21 avril 1991.",
    source_primaire:
      "Météo-France, Annales climatologiques du département Eure-et-Loir, 1991",
    source_secondaire: "La République du Centre, édition du 22 avril 1991",
    niveau_fiabilite: 2,
    periode: 'XXe siècle',
    statut: 'validé',
  },
]

async function seed() {
  console.log('Insertion de 3 événements météo historiques...')

  const { data, error } = await supabase
    .from('evenements_meteo')
    .insert(evenements)
    .select('id, type_phenomene, lieu, date_evenement')

  if (error) {
    console.error('Erreur:', error.message)
    process.exit(1)
  }

  console.log('Événements insérés :')
  data?.forEach((e) =>
    console.log(`  ✓ ${e.type_phenomene} — ${e.lieu} (${e.date_evenement})`)
  )
}

seed()
