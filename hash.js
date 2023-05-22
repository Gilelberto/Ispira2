const CryptoJS = require("crypto-js");

class H{
    getNumericHashFromDate(date) {
        // Convertir la fecha en una cadena formateada
        const formattedDate = date.toISOString();
      
        // Calcular el hash MD5 de la cadena
        const hash = CryptoJS.MD5(formattedDate).toString();
      
        // Obtener los primeros 9 dígitos del hash
        const numericHash = parseInt(hash.substr(0, 9), 16);
      
        return numericHash;
      }
}

module.exports = H;

