-- Ajout des colonnes de géolocalisation
ALTER TABLE evenements_meteo
  ADD COLUMN IF NOT EXISTS latitude  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Index optionnel pour les futures requêtes géospatiales
CREATE INDEX IF NOT EXISTS idx_evenements_meteo_coords
  ON evenements_meteo (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
