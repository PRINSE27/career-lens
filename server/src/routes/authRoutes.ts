import { Router } from "express";
import { login, signup } from "../controllers/authController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/login", login);
router.post("/signup", signup);

router.get("/protected", authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: "You have access to this protected route",
    userId: req.userId,
  });
});

export default router;