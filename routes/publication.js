const express = require("express");
const router = express.Router();
const multer = require("multer");
const PublicationController = require("../controllers/publication");
const check = require("../middlewares/auth");

// Configuración de subida
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads/publications/")
    },
    filename: (req, file, cb) => {
        cb(null, "pub-" + Date.now() + "-" + file.originalname);
    }
});
const uploads = multer({ storage });

// Definir rutas

// RUTAS GET
router.get("/detail/:id", check.auth, PublicationController.detail);
router.get("/feed/:page?", check.auth, PublicationController.feed);
router.get("/media/:file", PublicationController.media);
router.get("/prueba-publication", PublicationController.pruebaPublication);
router.get("/user/:id/:page?", check.auth, PublicationController.user);

// RUTAS POST
router.post("/save", check.auth, PublicationController.save);
router.post("/upload/:id", [check.auth, uploads.single("file0")], PublicationController.upload);

// RUTAS DELETE
router.delete("/remove/:id", check.auth, PublicationController.remove);

// Exportar router
module.exports = router;