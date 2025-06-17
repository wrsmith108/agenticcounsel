import express, { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { DatabaseService } from '../services/database';
import { SwissEphemerisService } from '../services/swissEphemerisService';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { 
  NatalChartData, 
  SwissBirthData, 
  HouseSystem, 
  APIResponse,
  PlanetaryPosition,
  HouseCusp,
  AspectData
} from '../types';
import winston from 'winston';

const router = express.Router();

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/astrology.log' })
  ]
});

// Validation middleware
const createNatalChartValidation = [
  body('birth_date')
    .isISO8601()
    .withMessage('Birth date must be in ISO 8601 format (YYYY-MM-DD)')
    .toDate(),
  body('birth_time')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Birth time must be in HH:MM format'),
  body('birth_location')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Birth location is required and must be 1-100 characters'),
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90 degrees'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180 degrees'),
  body('timezone')
    .optional()
    .isString()
    .withMessage('Timezone must be a valid string'),
  body('house_system')
    .optional()
    .isIn(['Placidus', 'Koch', 'Equal', 'Whole Sign', 'Campanus'])
    .withMessage('House system must be one of: Placidus, Koch, Equal, Whole Sign, Campanus')
];

const updateNatalChartValidation = [
  param('chartId').isUUID().withMessage('Chart ID must be a valid UUID'),
  body('birth_date')
    .optional()
    .isISO8601()
    .withMessage('Birth date must be in ISO 8601 format (YYYY-MM-DD)')
    .toDate(),
  body('birth_time')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Birth time must be in HH:MM format'),
  body('birth_location')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Birth location must be 1-100 characters'),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90 degrees'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180 degrees'),
  body('house_system')
    .optional()
    .isIn(['Placidus', 'Koch', 'Equal', 'Whole Sign', 'Campanus'])
    .withMessage('House system must be one of: Placidus, Koch, Equal, Whole Sign, Campanus')
];

const chartIdValidation = [
  param('chartId').isUUID().withMessage('Chart ID must be a valid UUID')
];

const userIdValidation = [
  param('userId').isUUID().withMessage('User ID must be a valid UUID')
];

// Helper function to validate chart ownership
const validateChartOwnership = async (chartId: string, userId: string): Promise<boolean> => {
  const db = DatabaseService.getInstance();
  const result = await db.query(
    'SELECT user_id FROM natal_charts WHERE chart_id = $1',
    [chartId]
  );
  
  if (result.rows.length === 0) {
    throw new AppError('Natal chart not found', 404, 'CHART_NOT_FOUND');
  }
  
  return result.rows[0].user_id === userId;
};

// Helper function to format API response
const formatResponse = <T>(data: T, message?: string): APIResponse<T> => {
  return {
    success: true,
    data,
    ...(message && { message }),
    timestamp: new Date()
  };
};

// POST /api/astrology/natal-chart - Generate and store a complete natal chart
router.post('/natal-chart', createNatalChartValidation, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: errors.array()
      },
      timestamp: new Date()
    });
  }

  if (!req.user) {
    throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
  }

  const {
    birth_date,
    birth_time,
    birth_location,
    latitude,
    longitude,
    timezone,
    house_system = 'Placidus'
  } = req.body;

  logger.info('Creating natal chart', {
    userId: req.user.user_id,
    birth_location,
    house_system
  });

  // Prepare birth data
  const birthData: SwissBirthData = {
    birth_date: birth_date.toISOString().split('T')[0], // Convert to YYYY-MM-DD
    birth_time,
    birth_location,
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    timezone
  };

  // Calculate natal chart using Swiss Ephemeris service
  const swissEphemerisService = SwissEphemerisService.getInstance();
  const natalChart = await swissEphemerisService.calculateNatalChart(
    birthData,
    req.user.user_id,
    house_system as HouseSystem
  );

  logger.info('Natal chart created successfully', {
    chartId: natalChart.chart_id,
    userId: req.user.user_id
  });

  res.status(201).json(formatResponse(natalChart, 'Natal chart created successfully'));
}));

// GET /api/astrology/natal-chart/:userId - Retrieve user's natal chart data
router.get('/natal-chart/:userId', userIdValidation, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid user ID',
        details: errors.array()
      },
      timestamp: new Date()
    });
  }

  if (!req.user) {
    throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
  }

  const { userId } = req.params;

  // Users can only access their own charts
  if (req.user.user_id !== userId) {
    throw new AppError('Access denied. You can only access your own natal charts', 403, 'ACCESS_DENIED');
  }

  const db = DatabaseService.getInstance();

  // Get natal chart data
  const chartResult = await db.query(`
    SELECT 
      chart_id,
      user_id,
      birth_datetime,
      birth_latitude,
      birth_longitude,
      birth_location,
      house_system,
      created_at,
      updated_at
    FROM natal_charts 
    WHERE user_id = $1 
    ORDER BY created_at DESC
  `, [userId]);

  if (chartResult.rows.length === 0) {
    // Return 200 with empty data instead of 404 for better UX
    logger.info('No natal charts found for user', { userId });
    return res.json(formatResponse(null, 'No natal charts found for this user'));
  }

  // Get the most recent chart (or you could return all charts)
  const chart = chartResult.rows[0];
  const chartId = chart.chart_id;

  // Get planetary positions
  const planetaryResult = await db.query(`
    SELECT 
      celestial_body,
      longitude,
      latitude,
      house_number,
      zodiac_sign,
      degree_in_sign,
      retrograde
    FROM planetary_positions 
    WHERE chart_id = $1
    ORDER BY 
      CASE celestial_body
        WHEN 'Sun' THEN 1
        WHEN 'Moon' THEN 2
        WHEN 'Mercury' THEN 3
        WHEN 'Venus' THEN 4
        WHEN 'Mars' THEN 5
        WHEN 'Jupiter' THEN 6
        WHEN 'Saturn' THEN 7
        WHEN 'Uranus' THEN 8
        WHEN 'Neptune' THEN 9
        WHEN 'Pluto' THEN 10
        WHEN 'Ascendant' THEN 11
        WHEN 'Midheaven' THEN 12
        ELSE 13
      END
  `, [chartId]);

  // Get house cusps
  const houseCuspsResult = await db.query(`
    SELECT 
      house_number,
      cusp_longitude,
      zodiac_sign,
      degree_in_sign
    FROM house_cusps 
    WHERE chart_id = $1
    ORDER BY house_number
  `, [chartId]);

  // Get aspects
  const aspectsResult = await db.query(`
    SELECT 
      body1,
      body2,
      aspect_type,
      orb,
      exact_angle,
      applying
    FROM aspects 
    WHERE chart_id = $1
    ORDER BY orb ASC
  `, [chartId]);

  // Format the response
  const natalChartData: NatalChartData = {
    chart_id: chartId,
    user_id: userId,
    birth_data: {
      birth_date: chart.birth_datetime.toISOString().split('T')[0],
      birth_time: chart.birth_datetime.toTimeString().substring(0, 5),
      birth_location: chart.birth_location,
      latitude: parseFloat(chart.birth_latitude),
      longitude: parseFloat(chart.birth_longitude)
    },
    planetary_positions: planetaryResult.rows.map((row: any) => ({
      celestial_body: row.celestial_body,
      longitude: parseFloat(row.longitude),
      latitude: parseFloat(row.latitude),
      house_number: row.house_number,
      zodiac_sign: row.zodiac_sign,
      degree_in_sign: parseFloat(row.degree_in_sign),
      retrograde: row.retrograde
    })),
    house_cusps: houseCuspsResult.rows.map((row: any) => ({
      house_number: row.house_number,
      cusp_longitude: parseFloat(row.cusp_longitude),
      zodiac_sign: row.zodiac_sign,
      degree_in_sign: parseFloat(row.degree_in_sign)
    })),
    aspects: aspectsResult.rows.map((row: any) => ({
      body1: row.body1,
      body2: row.body2,
      aspect_type: row.aspect_type,
      orb: parseFloat(row.orb),
      exact_angle: parseFloat(row.exact_angle),
      applying: row.applying
    })),
    house_system: chart.house_system,
    created_at: chart.created_at
  };

  logger.info('Natal chart retrieved', {
    chartId,
    userId,
    planetaryPositions: natalChartData.planetary_positions.length,
    aspects: natalChartData.aspects.length
  });

  res.json(formatResponse(natalChartData, 'Natal chart retrieved successfully'));
}));

// PUT /api/astrology/natal-chart/:chartId - Update existing natal chart
router.put('/natal-chart/:chartId', updateNatalChartValidation, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: errors.array()
      },
      timestamp: new Date()
    });
  }

  if (!req.user) {
    throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
  }

  const { chartId } = req.params;

  // Validate chart ownership
  const isOwner = await validateChartOwnership(chartId as string, req.user!.user_id);
  if (!isOwner) {
    throw new AppError('Access denied. You can only update your own natal charts', 403, 'ACCESS_DENIED');
  }

  const {
    birth_date,
    birth_time,
    birth_location,
    latitude,
    longitude,
    house_system
  } = req.body;

  // If any birth data is being updated, recalculate the entire chart
  if (birth_date || birth_time || latitude !== undefined || longitude !== undefined || house_system) {
    const db = DatabaseService.getInstance();
    
    // Get current chart data
    const currentChart = await db.query(
      'SELECT * FROM natal_charts WHERE chart_id = $1',
      [chartId]
    );

    if (currentChart.rows.length === 0) {
      throw new AppError('Natal chart not found', 404, 'CHART_NOT_FOUND');
    }

    const current = currentChart.rows[0];

    // Prepare updated birth data
    const updatedBirthData: SwissBirthData = {
      birth_date: birth_date ? birth_date.toISOString().split('T')[0] : current.birth_datetime.toISOString().split('T')[0],
      birth_time: birth_time || current.birth_datetime.toTimeString().substring(0, 5),
      birth_location: birth_location || current.birth_location,
      latitude: latitude !== undefined ? parseFloat(latitude) : parseFloat(current.birth_latitude),
      longitude: longitude !== undefined ? parseFloat(longitude) : parseFloat(current.birth_longitude)
    };

    const updatedHouseSystem = house_system || current.house_system;

    logger.info('Updating natal chart', {
      chartId,
      userId: req.user.user_id,
      changes: { birth_date, birth_time, birth_location, latitude, longitude, house_system }
    });

    // Delete existing calculated data
    await db.query('DELETE FROM aspects WHERE chart_id = $1', [chartId]);
    await db.query('DELETE FROM house_cusps WHERE chart_id = $1', [chartId]);
    await db.query('DELETE FROM planetary_positions WHERE chart_id = $1', [chartId]);

    // Update natal chart record
    const birthDateTime = new Date(`${updatedBirthData.birth_date}T${updatedBirthData.birth_time || '12:00'}:00`);
    
    await db.query(`
      UPDATE natal_charts 
      SET 
        birth_datetime = $1,
        birth_latitude = $2,
        birth_longitude = $3,
        birth_location = $4,
        house_system = $5,
        updated_at = NOW()
      WHERE chart_id = $6
    `, [
      birthDateTime,
      updatedBirthData.latitude,
      updatedBirthData.longitude,
      updatedBirthData.birth_location,
      updatedHouseSystem,
      chartId
    ]);

    // Recalculate chart data
    const swissEphemerisService = SwissEphemerisService.getInstance();
    const julianDay = swissEphemerisService.convertToJulianDay(updatedBirthData.birth_date, updatedBirthData.birth_time);
    
    // Calculate and store new data
    const planetaryPositions = await swissEphemerisService.calculatePlanetaryPositions(
      julianDay,
      updatedBirthData.latitude,
      updatedBirthData.longitude
    );
    
    const houseCusps = await swissEphemerisService.calculateHouseCusps(
      julianDay,
      updatedBirthData.latitude,
      updatedBirthData.longitude,
      updatedHouseSystem as HouseSystem
    );
    
    const aspects = swissEphemerisService.calculateAspects(planetaryPositions);

    // Store updated calculations
    await (swissEphemerisService as any).storePlanetaryPositions(chartId, planetaryPositions);
    await (swissEphemerisService as any).storeHouseCusps(chartId, houseCusps);
    await (swissEphemerisService as any).storeAspects(chartId, aspects);

    logger.info('Natal chart updated successfully', {
      chartId,
      userId: req.user.user_id
    });

    res.json(formatResponse({ chart_id: chartId }, 'Natal chart updated successfully'));
  } else {
    // No birth data changes, just return success
    res.json(formatResponse({ chart_id: chartId }, 'No changes to apply'));
  }
}));

// DELETE /api/astrology/natal-chart/:chartId - Delete natal chart
router.delete('/natal-chart/:chartId', chartIdValidation, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid chart ID',
        details: errors.array()
      },
      timestamp: new Date()
    });
  }

  if (!req.user) {
    throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
  }

  const { chartId } = req.params;

  // Validate chart ownership
  const isOwner = await validateChartOwnership(chartId as string, req.user!.user_id);
  if (!isOwner) {
    throw new AppError('Access denied. You can only delete your own natal charts', 403, 'ACCESS_DENIED');
  }

  const db = DatabaseService.getInstance();

  // Delete natal chart (cascade will handle related records)
  const result = await db.query(
    'DELETE FROM natal_charts WHERE chart_id = $1 AND user_id = $2',
    [chartId, req.user.user_id]
  );

  if (result.rowCount === 0) {
    throw new AppError('Natal chart not found', 404, 'CHART_NOT_FOUND');
  }

  logger.info('Natal chart deleted', {
    chartId,
    userId: req.user.user_id
  });

  res.json(formatResponse({ chart_id: chartId }, 'Natal chart deleted successfully'));
}));

// GET /api/astrology/planetary-positions/:chartId - Get planetary positions for a chart
router.get('/planetary-positions/:chartId', chartIdValidation, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid chart ID',
        details: errors.array()
      },
      timestamp: new Date()
    });
  }

  if (!req.user) {
    throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
  }

  const { chartId } = req.params;

  // Validate chart ownership
  const isOwner = await validateChartOwnership(chartId as string, req.user!.user_id);
  if (!isOwner) {
    throw new AppError('Access denied. You can only access your own natal charts', 403, 'ACCESS_DENIED');
  }

  const db = DatabaseService.getInstance();

  const result = await db.query(`
    SELECT 
      celestial_body,
      longitude,
      latitude,
      house_number,
      zodiac_sign,
      degree_in_sign,
      retrograde
    FROM planetary_positions 
    WHERE chart_id = $1
    ORDER BY 
      CASE celestial_body
        WHEN 'Sun' THEN 1
        WHEN 'Moon' THEN 2
        WHEN 'Mercury' THEN 3
        WHEN 'Venus' THEN 4
        WHEN 'Mars' THEN 5
        WHEN 'Jupiter' THEN 6
        WHEN 'Saturn' THEN 7
        WHEN 'Uranus' THEN 8
        WHEN 'Neptune' THEN 9
        WHEN 'Pluto' THEN 10
        WHEN 'Ascendant' THEN 11
        WHEN 'Midheaven' THEN 12
        ELSE 13
      END
  `, [chartId]);

  const planetaryPositions: PlanetaryPosition[] = result.rows.map((row: any) => ({
    celestial_body: row.celestial_body,
    longitude: parseFloat(row.longitude),
    latitude: parseFloat(row.latitude),
    house_number: row.house_number,
    zodiac_sign: row.zodiac_sign,
    degree_in_sign: parseFloat(row.degree_in_sign),
    retrograde: row.retrograde
  }));

  logger.info('Planetary positions retrieved', {
    chartId,
    userId: req.user.user_id,
    count: planetaryPositions.length
  });

  res.json(formatResponse(planetaryPositions, 'Planetary positions retrieved successfully'));
}));

// GET /api/astrology/house-cusps/:chartId - Get house cusps for a chart
router.get('/house-cusps/:chartId', chartIdValidation, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid chart ID',
        details: errors.array()
      },
      timestamp: new Date()
    });
  }

  if (!req.user) {
    throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
  }

  const { chartId } = req.params;

  // Validate chart ownership
  const isOwner = await validateChartOwnership(chartId as string, req.user!.user_id);
  if (!isOwner) {
    throw new AppError('Access denied. You can only access your own natal charts', 403, 'ACCESS_DENIED');
  }

  const db = DatabaseService.getInstance();

  const result = await db.query(`
    SELECT 
      house_number,
      cusp_longitude,
      zodiac_sign,
      degree_in_sign
    FROM house_cusps 
    WHERE chart_id = $1
    ORDER BY house_number
  `, [chartId]);

  const houseCusps: HouseCusp[] = result.rows.map((row: any) => ({
    house_number: row.house_number,
    cusp_longitude: parseFloat(row.cusp_longitude),
    zodiac_sign: row.zodiac_sign,
    degree_in_sign: parseFloat(row.degree_in_sign)
  }));

  logger.info('House cusps retrieved', {
    chartId,
    userId: req.user.user_id,
    count: houseCusps.length
  });

  res.json(formatResponse(houseCusps, 'House cusps retrieved successfully'));
}));

// GET /api/astrology/aspects/:chartId - Get aspects for a chart
router.get('/aspects/:chartId', chartIdValidation, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid chart ID',
        details: errors.array()
      },
      timestamp: new Date()
    });
  }

  if (!req.user) {
    throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
  }

  const { chartId } = req.params;

  // Validate chart ownership
  const isOwner = await validateChartOwnership(chartId as string, req.user!.user_id);
  if (!isOwner) {
    throw new AppError('Access denied. You can only access your own natal charts', 403, 'ACCESS_DENIED');
  }

  const db = DatabaseService.getInstance();

  // Optional query parameters for filtering
  const { aspect_type, max_orb, applying_only } = req.query;

  let query = `
    SELECT 
      body1,
      body2,
      aspect_type,
      orb,
      exact_angle,
      applying
    FROM aspects 
    WHERE chart_id = $1
  `;
  
  const queryParams: any[] = [chartId];
  let paramIndex = 2;

  if (aspect_type) {
    query += ` AND aspect_type = $${paramIndex}`;
    queryParams.push(aspect_type);
    paramIndex++;
  }

  if (max_orb) {
    query += ` AND orb <= $${paramIndex}`;
    queryParams.push(parseFloat(max_orb as string));
    paramIndex++;
  }

  if (applying_only === 'true') {
    query += ` AND applying = true`;
  }

  query += ` ORDER BY orb ASC`;

  const result = await db.query(query, queryParams);

  const aspects: AspectData[] = result.rows.map((row: any) => ({
    body1: row.body1,
    body2: row.body2,
    aspect_type: row.aspect_type,
    orb: parseFloat(row.orb),
    exact_angle: parseFloat(row.exact_angle),
    applying: row.applying
  }));

  logger.info('Aspects retrieved', {
    chartId,
    userId: req.user.user_id,
    count: aspects.length,
    filters: { aspect_type, max_orb, applying_only }
  });

  res.json(formatResponse(aspects, 'Aspects retrieved successfully'));
}));

export default router;