const router = require("express").Router();
const auth = require("../middleware/auth");
const c = require("../controllers/studentsController");

router.get("/", auth, c.getAll);
router.get("/:id", auth, c.getById);
router.post("/", auth, c.create);
router.put("/:id", auth, c.update);
router.delete("/:id", auth, c.remove);

module.exports = router;
