const mongoose = require("mongoose");

const connection = async () => {
    try {
        await mongoose.connect("mongodb+srv://root:root@red-social.75bhtdn.mongodb.net/?retryWrites=true&w=majority");
        console.log("Conectado correctamente a bd: red_social")
    } catch (error) {
        console.log(error);
        throw new Error("No se ha podido conectar a la base de datos.")
    }
}

module.exports = {
    connection
}