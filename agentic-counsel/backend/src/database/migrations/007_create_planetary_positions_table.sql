-- UP
CREATE TABLE planetary_positions (
    position_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chart_id UUID NOT NULL REFERENCES natal_charts(chart_id) ON DELETE CASCADE,
    celestial_body VARCHAR(50) NOT NULL CHECK (celestial_body IN (
        'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 
        'Uranus', 'Neptune', 'Pluto', 'Ascendant', 'Midheaven', 
        'North Node', 'South Node', 'Lilith'
    )),
    longitude DECIMAL(12, 8) NOT NULL CHECK (longitude >= 0 AND longitude < 360),
    latitude DECIMAL(12, 8) CHECK (latitude >= -90 AND latitude <= 90),
    house_number INTEGER NOT NULL CHECK (house_number >= 1 AND house_number <= 12),
    zodiac_sign VARCHAR(20) NOT NULL CHECK (zodiac_sign IN (
        'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
        'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    )),
    degree_in_sign DECIMAL(8, 5) NOT NULL CHECK (degree_in_sign >= 0 AND degree_in_sign < 30),
    retrograde BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_planetary_positions_chart_id ON planetary_positions(chart_id);
CREATE INDEX idx_planetary_positions_celestial_body ON planetary_positions(celestial_body);
CREATE INDEX idx_planetary_positions_house_number ON planetary_positions(house_number);
CREATE INDEX idx_planetary_positions_zodiac_sign ON planetary_positions(zodiac_sign);
CREATE INDEX idx_planetary_positions_retrograde ON planetary_positions(retrograde);
CREATE INDEX idx_planetary_positions_created_at ON planetary_positions(created_at);

-- Create composite indexes for common queries
CREATE INDEX idx_planetary_chart_body ON planetary_positions(chart_id, celestial_body);
CREATE INDEX idx_planetary_chart_house ON planetary_positions(chart_id, house_number);
CREATE INDEX idx_planetary_sign_body ON planetary_positions(zodiac_sign, celestial_body);

-- Create unique constraint to prevent duplicate entries
CREATE UNIQUE INDEX idx_planetary_unique_chart_body ON planetary_positions(chart_id, celestial_body);

-- Add comments for documentation
COMMENT ON TABLE planetary_positions IS 'Stores calculated positions of celestial bodies in natal charts';
COMMENT ON COLUMN planetary_positions.longitude IS 'Celestial longitude in degrees (0-360)';
COMMENT ON COLUMN planetary_positions.latitude IS 'Celestial latitude in degrees (-90 to 90)';
COMMENT ON COLUMN planetary_positions.degree_in_sign IS 'Degrees within the zodiac sign (0-30)';
COMMENT ON COLUMN planetary_positions.retrograde IS 'Whether the celestial body appears to move backward';

-- DOWN
DROP INDEX IF EXISTS idx_planetary_unique_chart_body;
DROP INDEX IF EXISTS idx_planetary_sign_body;
DROP INDEX IF EXISTS idx_planetary_chart_house;
DROP INDEX IF EXISTS idx_planetary_chart_body;
DROP INDEX IF EXISTS idx_planetary_positions_created_at;
DROP INDEX IF EXISTS idx_planetary_positions_retrograde;
DROP INDEX IF EXISTS idx_planetary_positions_zodiac_sign;
DROP INDEX IF EXISTS idx_planetary_positions_house_number;
DROP INDEX IF EXISTS idx_planetary_positions_celestial_body;
DROP INDEX IF EXISTS idx_planetary_positions_chart_id;
DROP TABLE IF EXISTS planetary_positions;