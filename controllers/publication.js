// Importar modelos
const Publication = require("../models/publication");

// Importar servicios
const followService = require("../services/followService");

// Importar dependencias
const path = require("path");
const fs = require("fs");

const pruebaPublication = (req, res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/publication.js"
    });
}

// Guardar publicación
const save = (req, res) => {
    // Recoger datos del body
    const params = req.body;

    // Si no me llegan dar respuesta negativa
    if (!params.text) return res.status(400).send({ status: "error", "message": "Debes enviar el texto de la publicación" });

    // Crear y rellenar el objeto del modelo
    let newPublication = new Publication(params);
    newPublication.user = req.user.id;

    // Guardar objeto en bbdd
    newPublication.save((error, publicationStored) => {
        if (error || !publicationStored) return res.status(400).send({ status: "error", "message": "No se ha guardado la publicación" });

        return res.status(200).send({
            status: "success",
            message: "Publicación guardada",
            publicationStored
        });
    });
}

// Sacar una publicacion
const detail = (req, res) => {
    // Sacar id de publicacion de la url
    const publicationId = req.params.id;

    // Find con la condicion del id
    Publication.findById(publicationId, (error, publicationStored) => {
        if (error || !publicationStored) return res.status(404).send({ status: "error", "message": "No se ha encontrado la publicación" });
        // Devolver respuesta
        return res.status(200).send({
            status: "success",
            message: "Mostrar publicación",
            publicationStored
        });
    });
}

// Eliminar publicaciones
const remove = (req, res) => {
    // Sacar el id de la publicación a eliminar
    const publicationId = req.params.id;

    // Find y luego un remove
    Publication.find({ "user": req.user.id, "_id": publicationId }).remove(error => {
        if (error) return res.status(500).send({ status: "error", "message": "No se ha eliminado la publicación" });
        // Devolver respuesta
        return res.status(200).send({
            status: "success",
            message: "Eliminar publicación",
            publication: publicationId
        });
    });
}

// Listar publicaciones de un usuario
const user = (req, res) => {
    // Sacar el id de usuario
    const userId = req.params.id;
    // Controlar la página
    let page = 1;
    if (req.params.page) page = req.params.page
    const itemsPerPage = 5;

    // Find, populate, ordenar, paginar
    Publication.find({ "user": userId })
        .sort("-created_at")
        .populate('user', '-password -__v -role -email')
        .paginate(page, itemsPerPage, (error, publications, total) => {
            if (error || !publications || publications.length <= 0) {
                return res.status(404).send({
                    status: "error",
                    message: "No hay publicaciones para mostrar"
                });
            }
            // Devolver respuesta
            return res.status(200).send({
                status: "success",
                message: "Publicaciones del perfil de un usuario",
                page,
                total,
                pages: Math.ceil(total / itemsPerPage),
                publications
            });
        });
}

// Listar todas las publicaciones
const feed = async (req, res) => {
    // Sacar página actual
    let page = 1;
    if (req.params.page) page = req.params.page;
    // Establecer numero de elementos por pagina
    let itemsPerPage = 5;
    // Sacar un array de identificadores de usuarios que yo sigo como usuario logueado
    try {
        const myFollows = await followService.followUserIds(req.user.id);
        // Find a publicaciones in, ordenar, popular, paginar
        const publications = Publication.find({ user: myFollows.following })
            .populate("user", "-password -role -__v -email")
            .sort("-created_at")
            .paginate(page, itemsPerPage, (error, publications, total) => {
                if (error || !publications) {
                    return res.status(500).send({
                        status: "error",
                        message: "No hay publicaciones para mostrar"
                    });
                }
                // Devolver respuesta
                return res.status(200).send({
                    status: "success",
                    message: "Feed de publicaciones",
                    following: myFollows.following,
                    total,
                    page,
                    itemsPerPage,
                    pages: Math.ceil(total / itemsPerPage),
                    publications
                });
            });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "No se han listado las publicaciones del feed"
        });
    }
}

// Subir ficheros
const upload = (req, res) => {
    // Recoger publication id
    const publicationId = req.params.id;
    // Recoger el fichero de imagen y comprobar que existe
    if (!req.file) {
        return res.status(404).send({
            status: "error",
            message: "Petición no incluye la imagen"
        });
    }

    // Conseguir el nombre del archivo
    let image = req.file.originalname;
    // Sacar extension del archivo
    const imageSplit = image.split("\.");
    const extension = imageSplit[1];
    // Comprobar extension
    // Si no es correcta, borrar archivo
    if (extension != "png" && extension != "jpg" && extension != "jpeg" && extension != "gif") {
        // Borrar archivo subido
        const filePath = req.file.path;
        const fileDeleted = fs.unlinkSync(filePath);

        // Devolver respuesta negativa
        return res.status(400).send({
            status: "error",
            message: "Extensión del fichero inválida"
        });
    }
    //Si es correcta guardar imagen en bbdd
    Publication.findOneAndUpdate({ "user": req.user.id, "_id": publicationId }, { file: req.file.filename }, { new: true }, (error, publicationUpdated) => {
        if (error || !publicationUpdated) {
            return res.status(500).send({
                status: "error",
                message: "Error en la subida de la publicacion"
            });
        }
        // Devolver respuesta
        return res.status(200).send({
            status: "success",
            publication: publicationUpdated,
            file: req.file
        });
    });
}

// Devolver archivos multimedia
const media = (req, res) => {
    // Sacar el parámetro de la url
    const file = req.params.file;
    // Montar el path real de la imagen
    const filePath = "./uploads/publications/" + file;
    // Comprobar que existe
    fs.stat(filePath, (error, exists) => {
        if (!exists) return res.status(404).send({ status: "error", message: "No existe la imagen" });
        // Devolver un file
        return res.sendFile(path.resolve(filePath));
    });
}
// Exportar acciones
module.exports = {
    feed,
    detail,
    media,
    pruebaPublication,
    remove,
    save,
    upload,
    user
}