// Importar modulos
const jwt = require("jwt-simple");
const moment = require("moment");

// Importar clave secreta
const libjwt = require("../services/jwt");
const secret = libjwt.secret;

// Funcion de autenticacion
exports.auth = (req, res, next) => {
    // Comprobar si me llega la cabecera de auth
    if (!req.headers.authorization) {
        return res.status(403).send({
            status: "error",
            messagge: "La petición no tiene la cabecera de autenticación"
        });
    }
    // Limpiar token
    let token = req.headers.authorization.replace(/['"]+/g, '');
    // Decodificar el token
    try {
        let payload = jwt.decode(token, secret);
        // Comprobar expiración del token
        if (payload.exp <= moment().unix()) {
            return res.status(404).send({
                status: "error",
                messagge: "Token expirado",
                error
            });
        }
        // Agregar datos de usuario a request
        req.user = payload;
    } catch (error) {
        return res.status(404).send({
            status: "error",
            messagge: "Token inválido",
            error
        });
    }
    // Pasar a ejecucion de accion
    next();
}

