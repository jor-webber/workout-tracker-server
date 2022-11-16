const router = require('express').Router();
const pool = require('../database');

router.get('/', async (req, res) => {
  const result = await pool.query(
    `
    SELECT forum_posts.id, title, forum_posts.creation_time, COUNT(forum_comments.id) as comments FROM forum_posts
    LEFT JOIN forum_comments ON forum_comments.forum_post_id = forum_posts.id
    GROUP BY forum_posts.id
    ORDER BY forum_posts.creation_time DESC
    `
  );

  console.log(result.rows);

  return res.status(200).json({
    forumPosts: result.rows,
  });
});

router.post('/', async (req, res) => {
  const { title, content, userId } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO forum_posts (title, content, user_id) VALUES ($1, $2, $3)',
      [title, content, userId]
    );

    if (result) {
      return res.status(204).json({
        message: 'Forum post added successfully',
      });
    } else {
      return res.status(500).json({
        message: 'Unable to add forum post',
      });
    }
  } catch {
    return res.status(500).json({
      message: 'Unable to add forum post',
    });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    `SELECT forum_posts.user_id, users.username, title, forum_posts.content, forum_posts.creation_time, first_name, last_name 
    FROM forum_posts 
    JOIN users ON user_id = users.id
    WHERE forum_posts.id = $1
    `,
    [id]
  );


  router.get('/comments/:postId', async (req, res) => {
    const { postId } = req.params;

    try {
      const result = await pool.query(
        `
        SELECT forum_comments.user_id, users.username, users.profile_picture, content, forum_comments.creation_time
        FROM forum_comments
        JOIN users ON users.id = forum_comments.user_id
        WHERE forum_comments.forum_post_id = $1
        ORDER BY creation_time DESC 
        `,
        [postId]
      );

      console.log(result.rows)

      if(result.rows) {
        return res.status(200).json({
          comments: result.rows
        })
      }
    } catch {
      return res.status(500).json({
        message: 'Unable to get comments for forum post',
      });
    }
  });

  if (result.rows.length > 0) {
    return res.status(200).json({
      forumPost: result.rows[0],
    });
  }
});

router.post('/add-comment', async (req, res) => {
  const { content, userId, postId } = req.body;

  try {
    await pool.query(
      'INSERT INTO forum_comments (content, user_id, forum_post_id) VALUES ($1, $2, $3)',
      [content, userId, postId]
    );

    return res.status(204).json({
      message: 'Comment added to post '
    })
  } catch {
    return res.status(500).json({
      message: 'Unable to add forum post comment',
    });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM forum_posts WHERE id = $1', [id])

    return res.status(204).json({
      message: 'Forum post deleted successfully'
    })
  } catch {
    return res.status(500).json({
      message: 'Unable to delete forum post'
    })
  }
})

module.exports = router;
