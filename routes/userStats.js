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

  if(result.rows) {
    return res.status(200).json({
      message: 'Success',
      exercises: result.rows
    })
  }

  return res.status(404).json({
    message: 'Nothing found'
  })
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
    workouts: result.rows
  })
})

module.exports = router;