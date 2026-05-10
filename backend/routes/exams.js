const router = require("express").Router();
const auth = require("../middleware/auth");
const c = require("../controllers/examsController");

router.get("/", auth, c.getExams);
router.post("/", auth, c.createExam);
router.get("/marks", auth, c.getMarks);
router.post("/:examId/marks", auth, c.enterMarks);
router.get("/student/:studentId", auth, c.getStudentResults);
router.get("/:examId/results", auth, c.getExamResults);

module.exports = router;
