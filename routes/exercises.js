const router = require('express').Router();
const pool = require('../database');

router.get('/', async (req, res) => {
  const exercises = await pool.query('SELECT * FROM exercises');

  if (exercises.rows.length > 0) {
    return res.json({
      status: 'Success',
      exercises: exercises.rows,
    });
  }

  return res.status(500).json({
    status: 'Error',
    message: 'Error getting exercises',
  });
});

router.get('/:exerciseId', async (req, res) => {
  const exerciseId = req.params.exerciseId;

  const exercise = await pool.query('SELECT * FROM exercises WHERE id = $1', [
    exerciseId,
  ]);

  if (exercise.rows.length > 0) {
    return res.json({
      status: 'Success',
      exercise: exercise.rows[0],
    });
  }
  return res.status(500).json({
    status: 'Error',
    message: 'Error getting exercises',
  });
});

router.post('/', async (req, res) => {
  const { exerciseName, description, muscleGroups } = req.body;

  const exerciseQuery = await pool.query(
    'INSERT INTO exercises (name, description) VALUES ($1, $2) RETURNING *',
    [exerciseName, description]
  );

  const exercise = exerciseQuery.rows[0];
  muscleGroups.forEach(async (element) => {
    await pool.query(
      'INSERT INTO muscle_group_submissions (exercise_id, muscle_group_id) VALUES ($1, $2)', [
        exercise.id, element.id
      ]
    );
  });

  return res.json({
    status: 'Success',
    data: exercise.rows,
  });
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM exercises WHERE id = $1', [id])
    return res.status(204).json({
      message: 'Exercise deleted successfully'
    })
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      message: 'Unable to delete exercise'
    })
  }
})

module.exports = router;
