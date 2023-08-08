const express = require("express");
const router = express.Router();
const FollowController = require("../controllers/follow");
const check = require("../middlewares/auth");

// Definir rutas

// RUTAS GET
router.get("/prueba-follow", FollowController.pruebaFollow);
router.get("/followers/:id?/:page?", check.auth, FollowController.followers);
router.get("/following/:id?/:page?", check.auth, FollowController.following);

// RUTAS POST
router.post("/save", check.auth, FollowController.save);
router.delete("/unfollow/:id", check.auth, FollowController.unfollow);

// Exportar router
module.exports = router;