-- UP
CREATE TABLE natal_charts (
    chart_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    birth_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    birth_latitude DECIMAL(10, 7) NOT NULL CHECK (birth_latitude >= -90 AND birth_latitude <= 90),
    birth_longitude DECIMAL(10, 7) NOT NULL CHECK (birth_longitude >= -180 AND birth_longitude <= 180),
    birth_location TEXT NOT NULL,
    house_system VARCHAR(20) NOT NULL DEFAULT 'Placidus' CHECK (house_system IN ('Placidus', 'Koch', 'Equal', 'Whole Sign', 'Campanus', 'Regiomontanus', 'Porphyrius')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_natal_charts_user_id ON natal_charts(user_id);
CREATE INDEX idx_natal_charts_birth_datetime ON natal_charts(birth_datetime);
CREATE INDEX idx_natal_charts_created_at ON natal_charts(created_at);
CREATE INDEX idx_natal_charts_house_system ON natal_charts(house_system);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_natal_charts_updated_at 
    BEFORE UPDATE ON natal_charts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE natal_charts IS 'Stores natal chart birth data for astrological calculations using Swiss Ephemeris';
COMMENT ON COLUMN natal_charts.birth_latitude IS 'Birth latitude in decimal degrees (-90 to 90)';
COMMENT ON COLUMN natal_charts.birth_longitude IS 'Birth longitude in decimal degrees (-180 to 180)';
COMMENT ON COLUMN natal_charts.house_system IS 'Astrological house system used for calculations';

-- DOWN
DROP TRIGGER IF EXISTS update_natal_charts_updated_at ON natal_charts;
DROP INDEX IF EXISTS idx_natal_charts_house_system;
DROP INDEX IF EXISTS idx_natal_charts_created_at;
DROP INDEX IF EXISTS idx_natal_charts_birth_datetime;
DROP INDEX IF EXISTS idx_natal_charts_user_id;
DROP TABLE IF EXISTS natal_charts;