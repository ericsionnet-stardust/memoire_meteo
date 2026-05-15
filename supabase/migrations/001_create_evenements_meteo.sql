CREATE TABLE IF NOT EXISTS evenements_meteo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_evenement DATE,
  date_approx TEXT,
  lieu TEXT,
  region TEXT,
  type_phenomene TEXT,
  description TEXT,
  citation_exacte TEXT,
  source_primaire TEXT,
  source_secondaire TEXT,
  niveau_fiabilite SMALLINT CHECK (niveau_fiabilite BETWEEN 1 AND 3),
  lien_scan TEXT,
  periode TEXT,
  statut TEXT DEFAULT 'en_attente',
  created_at TIMESTAMPTZ DEFAULT now()
);
