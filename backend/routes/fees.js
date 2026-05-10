const router = require("express").Router();
const auth = require("../middleware/auth");
const c = require("../controllers/feesController");

router.get("/structures", auth, c.getStructures);
router.post("/structures", auth, c.createStructure);
router.get("/payments", auth, c.getPayments);
router.post("/payments", auth, c.recordPayment);
router.get("/student/:studentId", auth, c.getStudentStatus);
router.get("/pending", auth, c.getPendingFees);

module.exports = router;
