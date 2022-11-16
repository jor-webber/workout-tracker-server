const router = require('express').Router();
const pool = require('../database');

router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  const result = await pool.query(
    `SELECT MAX(weight), exercises.name 
     FROM exercise_submissions 
     JOIN exercises ON exercise_submissions.exercise_id = exercises.id 
     JOIN workouts ON exercise_submissions.workout_id = workouts.id 
     WHERE workouts.user_id = $1
     GROUP BY exercises.name
     `,
    [userId]
  );

  if (result.rows) {
    return res.status(200).json({
      message: 'Success',
      exercises: result.rows,
    });
  }

  return res.status(404).json({
    message: 'Nothing found',
  });
});

router.get('/daily-volume/:userId', async (req, res) => {
  const { userId } = req.params;

  const result = await pool.query(
    `SELECT workout_id, SUM(total_volume) as total_volume, start_time
     FROM workouts
     JOIN exercise_submissions ON exercise_submissions.workout_id = workouts.id
     WHERE workouts.user_id = $1
     GROUP BY workout_id, start_time
     ORDER BY start_time
     `,
    [userId]
  );

  return res.status(200).json({
    workouts: result.rows,
  });
});

router.get('/health-metric-types', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM health_metric_types')

    return res.status(200).json({
      healthMetricTypes: result.rows
    })
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Unable to retrieve health metric types',
    });
  }
});

router.get('/health-metrics/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, user_id, value, name, creation_time FROM health_metrics 
       JOIN health_metric_types ON health_metric_types.id = health_metrics.type
       WHERE user_id = $1`,
      [id]
    );

    return res.status(200).json({
      healthMetrics: result.rows,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Unable to retrieve health metrics',
    });
  }
});

router.post('/health-metrics', async (req, res) => {
  const { userId, typeId, value } = req.body;

  try {
    await pool.query(
      'INSERT INTO health_metrics (user_id, type, value) VALUES ($1, $2, $3)',
      [userId, typeId, value]
    );

    res.status(204).json({
      message: 'Health metric added successfully',
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Error adding heath metric',
    });
  }
});
module.exports = router;
