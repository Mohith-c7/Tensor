const router = require("express").Router();
const auth = require("../middleware/auth");
const c = require("../controllers/attendanceController");

router.get("/", auth, c.getAll);
router.post("/", auth, c.mark);
router.get("/student/:studentId", auth, c.getStudentHistory);
router.get("/class", auth, c.getClassAttendance);
router.get("/stats/:studentId", auth, c.getStats);

module.exports = router;
