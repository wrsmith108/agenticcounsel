-- UP
CREATE TABLE house_cusps (
    cusp_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chart_id UUID NOT NULL REFERENCES natal_charts(chart_id) ON DELETE CASCADE,
    house_number INTEGER NOT NULL CHECK (house_number >= 1 AND house_number <= 12),
    cusp_longitude DECIMAL(12, 8) NOT NULL CHECK (cusp_longitude >= 0 AND cusp_longitude < 360),
    zodiac_sign VARCHAR(20) NOT NULL CHECK (zodiac_sign IN (
        'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
        'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    )),
    degree_in_sign DECIMAL(8, 5) NOT NULL CHECK (degree_in_sign >= 0 AND degree_in_sign < 30),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_house_cusps_chart_id ON house_cusps(chart_id);
CREATE INDEX idx_house_cusps_house_number ON house_cusps(house_number);
CREATE INDEX idx_house_cusps_zodiac_sign ON house_cusps(zodiac_sign);
CREATE INDEX idx_house_cusps_created_at ON house_cusps(created_at);

-- Create composite indexes for common queries
CREATE INDEX idx_house_cusps_chart_house ON house_cusps(chart_id, house_number);
CREATE INDEX idx_house_cusps_sign_house ON house_cusps(zodiac_sign, house_number);

-- Create unique constraint to prevent duplicate house cusps per chart
CREATE UNIQUE INDEX idx_house_cusps_unique_chart_house ON house_cusps(chart_id, house_number);

-- Add comments for documentation
COMMENT ON TABLE house_cusps IS 'Stores astrological house cusp positions for natal charts';
COMMENT ON COLUMN house_cusps.cusp_longitude IS 'House cusp longitude in degrees (0-360)';
COMMENT ON COLUMN house_cusps.degree_in_sign IS 'Degrees within the zodiac sign (0-30)';
COMMENT ON COLUMN house_cusps.house_number IS 'Astrological house number (1-12)';

-- DOWN
DROP INDEX IF EXISTS idx_house_cusps_unique_chart_house;
DROP INDEX IF EXISTS idx_house_cusps_sign_house;
DROP INDEX IF EXISTS idx_house_cusps_chart_house;
DROP INDEX IF EXISTS idx_house_cusps_created_at;
DROP INDEX IF EXISTS idx_house_cusps_zodiac_sign;
DROP INDEX IF EXISTS idx_house_cusps_house_number;
DROP INDEX IF EXISTS idx_house_cusps_chart_id;
DROP TABLE IF EXISTS house_cusps;