const router = require('express').Router();
const pool = require('../database');

router.get('/', async (req, res) => {
  const muscleGroups = await pool.query('SELECT * FROM muscle_groups');

  return res.json({
    status: 'Success',
    muscleGroups: muscleGroups.rows,
  });
});

router.get('/submissions', async (req, res) => {
  const muscleGroupSubmissions = await pool.query('SELECT * FROM muscle_group_submissions JOIN muscle_groups ON muscle_groups.id = muscle_group_submissions.muscle_group_id')

  if(muscleGroupSubmissions.rows.length > 0) {
    return res.status(200).json({
      status: 'Success',
      muscleGroupSubmissions: muscleGroupSubmissions.rows
    })
  }

  return res.status(500).json({
    status: 'Error retrieving submissions'
  });
});

router.get('/:id', async (req, res) => {
  const id = req.params.id;
  const muscleGroup = await pool.query('SELECT * FROM muscle_groups WHERE id = $1', [id])

  return res.json({
    status: 'Success',
    muscleGroup: muscleGroup.rows[0]
  })
});



router.get('/exercise/:exerciseId', async (req, res) => {
  const exerciseId = req.params.exerciseId;
  const muscleGroups = await pool.query('SELECT * FROM muscle_group_submissions WHERE exercise_id = $1', [exerciseId])

  if(muscleGroups.rows.length > 0) {
    return res.status(200).json({
      status: "Success",
      muscleGroupsForExercise: muscleGroups.rows
    })
  }

  return res.status(404).json({
    status: 'Not Found'
  })
})

module.exports = router;
