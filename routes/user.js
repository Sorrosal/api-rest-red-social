const express = require("express");
const router = express.Router();
const multer = require("multer");
const UserController = require("../controllers/user");
const check = require("../middlewares/auth");

// Configuración de subida
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads/avatars/")
    },
    filename: (req, file, cb) => {
        cb(null, "avatar-" + Date.now() + "-" + file.originalname);
    }
});
const uploads = multer({ storage });

// Definir rutas

// RUTAS GET
router.get("/avatar/:file", UserController.avatar);
router.get("/counters/:id", check.auth, UserController.counters);
router.get("/list/:page?", check.auth, UserController.list);
router.get("/profile/:id", check.auth, UserController.profile);
router.get("/prueba-usuario", check.auth, UserController.pruebaUser);

// RUTAS POST
router.post("/login", UserController.login);
router.post("/register", UserController.register);
router.post("/upload", [check.auth, uploads.single("file0")], UserController.upload);

// RUTAS PUT
router.put("/update", check.auth, UserController.update);

// Exportar router
module.exports = router;