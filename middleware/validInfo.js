module.exports = (req, res, next) => {
  const { email, firstName, lastName, username, password } = req.body;

  function validEmail(userEmail) {
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(userEmail);
  }

  if (req.path === "/register") {
    if (![email, firstName, lastName, username, password].every(Boolean)) {
      return res.json({
        status: "error",
        message: "Please fill in all fields",
      });
    } else if (!validEmail(email)) {
      return res.json({
        status: "error",
        message: "Please enter a valid email",
      });
    }
  } else if (req.path === "/login") {
    if (![email, password].every(Boolean)) {
      return res.json({
        status: "error",
        message: "Please fill in all fields",
      });
    } else if (!validEmail(email)) {
      return res.json({
        status: "error",
        message: "Please enter a valid email",
      });
    }
  }

  next();
};