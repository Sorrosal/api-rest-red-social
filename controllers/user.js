// Importar dependencias y modulos
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("../services/jwt");
const mongoosePagination = require("mongoose-pagination");

const pruebaUser = (req, res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/user.js",
        usuario: req.user
    });
}
// Registro de usuarios
const register = (req, res) => {
    // Recoger datos de la peticion
    let params = req.body;

    // Comprobar que me llegan bien (+validacion)
    if (!params.name || !params.email || !params.password || !params.nick) {
        return res.status(400).json({
            status: "error",
            message: "Faltan datos por enviar"
        });
    }

    // Control usuarios duplicados
    User.find({
        $or: [
            { email: params.email.toLowerCase() },
            { nick: params.nick.toLowerCase() }
        ]
    }).exec(async (error, users) => {
        if (error) return res.status(500).json({ status: "error", message: "Error en la consulta de usuarios" })

        if (users && users.length >= 1) {
            return res.status(200).send({
                status: "success",
                message: "El usuario ya existe"
            });
        }

        // Cifrar contraseña
        let pwd = await bcrypt.hash(params.password, 10);
        params.password = pwd;

        // Crear objeto usuario
        let user_to_save = new User(params);

        // Guardar usuario en la bbdd
        user_to_save.save((error, userStored) => {
            if (error || !userStored) return res.status(500).send({ status: "error", message: "Error al guardar el usuario" })

            if (userStored) {
                // Devolver resultado
                return res.status(200).json({
                    message: "Usuario registrado correctamente",
                    user: userStored
                });
            }
        });
    });
}

const login = (req, res) => {
    // Recoger parámetros body
    let params = req.body;

    if (!params.email || !params.password) {
        return res.status(400).send({
            status: "error",
            message: "Faltan datos por enviar"
        });
    }
    // Buscar en la bbdd si existe
    User.findOne({ email: params.email })
        //.select({ "password": 0 })
        .exec((error, user) => {
            if (error || !user) return res.status(404).send({
                status: "error",
                message: "No existe el usuario"
            });

            // Comprobar su contraseña
            let pwd = bcrypt.compareSync(params.password, user.password);

            if (!pwd) {
                return res.status(400).send({
                    status: "error",
                    message: "No te has identificado correctamente"
                });
            }

            // Conseguir Token
            const token = jwt.createToken(user);

            // Devolver Datos del usuario
            return res.status(200).send({
                status: "success",
                message: "Loggeado correctamente",
                user: {
                    id: user._id,
                    name: user.name,
                    nick: user.nick
                },
                token
            })
        });

}

const profile = (req, res) => {
    // Recibir el parámetro del id de usuario por la url
    const id = req.params.id;

    // Consulta para sacar los datos del usuario
    User.findById(id)
        .select({ password: 0, role: 0 })
        .exec((error, userProfile) => {
            if (error || !userProfile) {
                return res.status(404).send({
                    status: "error",
                    messagge: "El usuario no existe o hay un error"
                });
            }
            // Devolver el resultado
            // Posteriormente: devolver informacion de follows
            return res.status(200).send({
                status: "success",
                user: userProfile
            });
        });

}

const list = (req, res) => {
    // Controlar en que página estamos
    let page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    page = parseInt(page);

    // Consulta con mongoose paginate
    let itemsPerPage = 5;

    User.find().sort('_id').paginate(page, itemsPerPage, (error, users, total) => {
        if (error || !users) {
            return res.status(404).send({
                status: "error",
                message: "No hay usuarios disponibles",
                error
            });
        }
        // Devolver el resultado (posteriormente info follow)
        return res.status(200).send({
            status: "success",
            users,
            page,
            itemsPerPage,
            total,
            pages: Math.ceil(total / itemsPerPage)
        });
    });
}

const update = (req, res) => {
    // Recoger info del usuario a actualizar
    let userIdentity = req.user;
    let userToUpdate = req.body;

    // Eliminar campos sobrantes
    delete userToUpdate.iat;
    delete userToUpdate.exp;
    delete userToUpdate.role;
    delete userToUpdate.image;

    // Comprobar si el usuario ya existe
    User.find({
        $or: [
            { email: userToUpdate.email.toLowerCase() },
            { nick: userToUpdate.nick.toLowerCase() }
        ]
    }).exec(async (error, users) => {
        if (error) return res.status(500).json({ status: "error", message: "Error en la consulta de usuarios" })
        let userIsset = false;

        users.forEach(user => {
            if (user && user.id != userIdentity.id) userIsset = true;
        });

        if (userIsset) {
            return res.status(200).send({
                status: "success",
                message: "El usuario ya existe"
            });
        }

        // Si me llega la password cifrarla
        if (userToUpdate.password) {
            let pwd = await bcrypt.hash(userToUpdate.password, 10);
            userToUpdate.password = pwd;
        }

        // Buscar y actualizar
        User.findByIdAndUpdate(userIdentity.id, userToUpdate, { new: true }, (error, userUpdated) => {

            if (error || !userUpdated) return res.status(500).send({ status: "error", message: "Error al actualizar el usuario" })

            return res.status(200).send({
                status: "success",
                message: "Método de actualizar usuario",
                user: userUpdated
            });
        });
    });
}

// Exportar acciones
module.exports = {
    register,
    login,
    pruebaUser,
    profile,
    list,
    update
}