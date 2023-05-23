const oracledb = require('oracledb');
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;


class DBManager{

    async consult(cons){
        let con;
        try{
            con = await oracledb.getConnection({
                user :"ISPIRA",
                password : "ispira",
                connectString : "localhost:1521/xepdb1"
            });
    
            const data = await con.execute(
                cons,
            );

            return data.rows;
            //console.log(data.rows);
        }
        catch(err){
            console.error(err);
        }
    }
    
    async insert(cons, bindParams) { //TAMBIEN BORRA Y ALTERA
        let con;
        try {
            con = await oracledb.getConnection({
                user: "ISPIRA",
                password: "ispira",
                connectString: "localhost:1521/xepdb1"
            });

            const result = await con.execute(
                cons,
                bindParams,
                { autoCommit: true } // Configura el autoCommit en true para realizar la inserción
            );

            console.log("Inserción exitosa");
            return result;
        } catch (err) {
            console.error(err);
        }
    }

    async update(cons) { //TAMBIÉN BORRA Y ALTERA
        let con;
        try {
          con = await oracledb.getConnection({
            user: "ISPIRA",
            password: "ispira",
            connectString: "localhost:1521/xepdb1"
          });
          console.log("UPDATE FUNCTION");
          console.log(cons);
          const result = await con.execute(
            cons,
            { autoCommit: true } // Configura el autoCommit en true para realizar la actualización
          );
          console.log("Actualización exitosa");
        } catch (err) {
          console.error(err);
        }
      }
}

    

module.exports = DBManager;



