const router = require("express").Router();
const auth = require("../middleware/auth");
const c = require("../controllers/attendanceController");

router.get("/", auth, c.getAll);
router.post("/", auth, c.mark);

module.exports = router;
