const router = require('express').Router();
const pool = require('../database');

router.get('/', async (req, res) => {
  const workouts = await pool.query('SELECT * FROM workouts');

  return res.json({
    status: 'Success',
    workouts: workouts.rows,
  });
});

router.post('/', async (req, res) => {
  let { userId, endTime, startTime, submittedExercises } = req.body;
  startTime = new Date(startTime);
  endTime = new Date(endTime);
  const workoutInsertResult = await pool.query(
    'INSERT INTO workouts (user_id, start_time, end_time) VALUES ($1, $2, $3) RETURNING *',
    [userId, startTime, endTime]
  );

  const workoutId = workoutInsertResult.rows[0].id;

  submittedExercises.forEach((exercise) => {
    const totalVolume = exercise.sets * exercise.reps * exercise.weight;
    pool.query(
      'INSERT INTO exercise_submissions (exercise_id, workout_id, sets, repetitions, weight, total_volume) VALUES($1, $2, $3, $4, $5, $6)',
      [
        exercise.id,
        workoutId,
        exercise.sets,
        exercise.reps,
        exercise.weight,
        totalVolume,
      ]
    );
  });

  return res.status(204).json({
    message: 'Workout was successfully created',
  });
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  const muscleGroupResult = await pool.query(
    `
    SELECT muscle_groups.name, start_time, end_time, SUM(total_volume) as total_muscle_group_volume FROM workouts
    JOIN exercise_submissions ON exercise_submissions.workout_id = workouts.id
    JOIN exercises ON exercise_submissions.exercise_id = exercises.id
    JOIN muscle_group_submissions ON muscle_group_submissions.exercise_id = exercises.id
    JOIN muscle_groups ON muscle_group_submissions.muscle_group_id = muscle_groups.id
    WHERE workouts.id = $1
    GROUP BY workouts.id, exercises.id, muscle_group_submissions.id, muscle_groups.id, muscle_groups.name
  `,
    [id]
  );

  const exercisesResult = await pool.query(
    `
    SELECT exercise_submissions.id as submission_id, exercises.id as exercise_id, exercises.name as exercise, sets, repetitions as reps, weight FROM workouts
    JOIN exercise_submissions ON exercise_submissions.workout_id = workouts.id
    JOIN exercises ON exercise_submissions.exercise_id = exercises.id
    WHERE workouts.id = $1
  `,
    [id]
  );

  return res.status(200).json({
    muscleGroupInfo: muscleGroupResult.rows,
    exercisesInfo: exercisesResult.rows,
  });
});

router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;

  const result = await pool.query(
    'SELECT * FROM workouts WHERE user_id = $1 ORDER BY start_time DESC',
    [userId]
  );

  if (result.rows) {
    return res.status(200).json({
      workouts: result.rows,
    });
  }

  return res.status(404).json({
    message: 'Unable to find workouts for user',
  });
});

router.delete('/exercise-submission/:submissionId', async (req, res) => {
  const { submissionId } = req.params;

  const result = await pool.query('DELETE FROM exercise_submissions WHERE id = $1', [submissionId])

  if(result) {
    return res.status(204).json({
      message: 'Exercise submission deleted successfully'
    })
  }

  res.json({messaage: 'test'})
})

router.delete('/:workoutId', async (req, res) => {
  const { workoutId } = req.params;

  const result = await pool.query('DELETE FROM workouts WHERE id = $1', [
    workoutId,
  ]);

  if (result) {
    return res.status(204).json({
      message: 'Workout deleted successfully',
    });
  }
});

router.put('/', async (req, res) => {
  let { workoutId, startTime, endTime, submittedExercises } = req.body;

  console.log(submittedExercises);

  startTime = new Date(startTime);
  endTime = new Date(endTime);
  let result;

  try {
    result = await pool.query(
      `UPDATE workouts SET start_time = $1, end_time = $2 WHERE id = $3`,
      [startTime, endTime, workoutId]
    );
  } catch {
    return res.status(500).json({
      message: 'Error updating workout',
    });
  }

  if (result) {
    submittedExercises.forEach(async (exerciseSubmission) => {
      const totalVolume =
        exerciseSubmission.sets *
        exerciseSubmission.reps *
        exerciseSubmission.weight;
      if (exerciseSubmission.submission_id) {
        await pool.query(
          'UPDATE exercise_submissions SET sets = $1, repetitions = $2, weight = $3, total_volume = $4 WHERE id = $5',
          [
            exerciseSubmission.sets,
            exerciseSubmission.reps,
            exerciseSubmission.weight,
            totalVolume,
            exerciseSubmission.submission_id,
          ]
        );
      } else {
        await pool.query(
          'INSERT INTO exercise_submissions (workout_id, exercise_id, sets, repetitions, weight, total_volume) VALUES ($1, $2, $3, $4, $5, $6)',
          [
            workoutId,
            exerciseSubmission.id,
            exerciseSubmission.sets,
            exerciseSubmission.reps,
            exerciseSubmission.weight,
            totalVolume
          ]
        );
      }
    });
    return res.status(204).json({
      message: 'Workout successfully updated'
    })
  }
});

module.exports = router;
