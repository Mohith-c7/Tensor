const router = require("express").Router();
const auth = require("../middleware/auth");
const c = require("../controllers/examsController");

router.get("/", auth, c.getExams);
router.post("/", auth, c.createExam);
router.get("/marks", auth, c.getMarks);
router.post("/marks", auth, c.enterMarks);

module.exports = router;
