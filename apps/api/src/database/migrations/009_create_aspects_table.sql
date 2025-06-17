-- UP
CREATE TABLE aspects (
    aspect_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chart_id UUID NOT NULL REFERENCES natal_charts(chart_id) ON DELETE CASCADE,
    body1 VARCHAR(50) NOT NULL CHECK (body1 IN (
        'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 
        'Uranus', 'Neptune', 'Pluto', 'Ascendant', 'Midheaven', 
        'North Node', 'South Node', 'Lilith'
    )),
    body2 VARCHAR(50) NOT NULL CHECK (body2 IN (
        'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 
        'Uranus', 'Neptune', 'Pluto', 'Ascendant', 'Midheaven', 
        'North Node', 'South Node', 'Lilith'
    )),
    aspect_type VARCHAR(20) NOT NULL CHECK (aspect_type IN (
        'conjunction', 'opposition', 'square', 'trine', 'sextile',
        'quincunx', 'semisextile', 'semisquare', 'sesquiquadrate'
    )),
    orb DECIMAL(6, 3) NOT NULL CHECK (orb >= 0 AND orb <= 15),
    exact_angle DECIMAL(8, 5) NOT NULL CHECK (exact_angle >= 0 AND exact_angle < 360),
    applying BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT check_different_bodies CHECK (body1 != body2)
);

-- Create indexes for performance
CREATE INDEX idx_aspects_chart_id ON aspects(chart_id);
CREATE INDEX idx_aspects_body1 ON aspects(body1);
CREATE INDEX idx_aspects_body2 ON aspects(body2);
CREATE INDEX idx_aspects_aspect_type ON aspects(aspect_type);
CREATE INDEX idx_aspects_orb ON aspects(orb);
CREATE INDEX idx_aspects_applying ON aspects(applying);
CREATE INDEX idx_aspects_created_at ON aspects(created_at);

-- Create composite indexes for common queries
CREATE INDEX idx_aspects_chart_type ON aspects(chart_id, aspect_type);
CREATE INDEX idx_aspects_chart_bodies ON aspects(chart_id, body1, body2);
CREATE INDEX idx_aspects_bodies_type ON aspects(body1, body2, aspect_type);
CREATE INDEX idx_aspects_chart_applying ON aspects(chart_id, applying);

-- Create partial indexes for tight orbs (more significant aspects)
CREATE INDEX idx_aspects_tight_orbs ON aspects(chart_id, aspect_type, orb) 
WHERE orb <= 3.0;

-- Create unique constraint to prevent duplicate aspects (considering both directions)
CREATE UNIQUE INDEX idx_aspects_unique_chart_bodies_type ON aspects(
    chart_id, 
    LEAST(body1, body2), 
    GREATEST(body1, body2), 
    aspect_type
);

-- Add comments for documentation
COMMENT ON TABLE aspects IS 'Stores astrological aspects between celestial bodies in natal charts';
COMMENT ON COLUMN aspects.orb IS 'Orb of aspect in degrees (0-15)';
COMMENT ON COLUMN aspects.exact_angle IS 'Exact angular separation in degrees (0-360)';
COMMENT ON COLUMN aspects.applying IS 'Whether aspect is applying (true) or separating (false)';
COMMENT ON CONSTRAINT check_different_bodies ON aspects IS 'Ensures aspects are between different celestial bodies';

-- DOWN
DROP INDEX IF EXISTS idx_aspects_unique_chart_bodies_type;
DROP INDEX IF EXISTS idx_aspects_tight_orbs;
DROP INDEX IF EXISTS idx_aspects_chart_applying;
DROP INDEX IF EXISTS idx_aspects_bodies_type;
DROP INDEX IF EXISTS idx_aspects_chart_bodies;
DROP INDEX IF EXISTS idx_aspects_chart_type;
DROP INDEX IF EXISTS idx_aspects_created_at;
DROP INDEX IF EXISTS idx_aspects_applying;
DROP INDEX IF EXISTS idx_aspects_orb;
DROP INDEX IF EXISTS idx_aspects_aspect_type;
DROP INDEX IF EXISTS idx_aspects_body2;
DROP INDEX IF EXISTS idx_aspects_body1;
DROP INDEX IF EXISTS idx_aspects_chart_id;
DROP TABLE IF EXISTS aspects;