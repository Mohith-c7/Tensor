const router = require("express").Router();
const auth = require("../middleware/auth");
const c = require("../controllers/feesController");

router.get("/", auth, c.getFees);
router.get("/payments", auth, c.getPayments);
router.post("/payments", auth, c.recordPayment);

module.exports = router;
