const router = require("express").Router();
const auth = require("../middleware/auth");
const c = require("../controllers/timetableController");

router.get("/", auth, c.getAll);
router.post("/", auth, c.create);

module.exports = router;
