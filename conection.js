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
            console.log("*********************************");
            console.log(cons);
            console.error(err);
            console.log("*********************************");
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
          console.log("UPDATE FUNCTION: ",cons);
          const result = await con.execute(
            cons,
            { autoCommit: true } // Configura el autoCommit en true para realizar la actualización
          );
          console.log("Actualización exitosa");
          return result;
        } catch (err) {
          console.error(err);
        }
      }
    
      async executeMany(cons, bindParams) {
        let con;
        try {
          con = await oracledb.getConnection({
            user: "ISPIRA",
            password: "ispira",
            connectString: "localhost:1521/xepdb1"
          });

          const result = await con.executeMany(
            cons,
            bindParams,
            { autoCommit: true } // Configura el autoCommit en true para realizar la ejecución
          );
      
          console.log("Operación exitosa");
          return result;
        } catch (err) {
          console.log("*********************************");
          //console.log(cons);
          console.error(err);
          console.log("*********************************");
        }
      }

      async executeBatch(operations) { //recibe un arreglo de consultas nomás
        let con;
        try {
          con = await oracledb.getConnection({
            user: "ISPIRA",
            password: "ispira",
            connectString: "localhost:1521/xepdb1"
          });
      
          for (const operation of operations) {
            await con.execute(operation);
            await con.commit();
            console.log("=============INSERTA=============");
          }
      
          return operations;
        } catch (err) {
          console.log("*********************************");
          console.log(operations);
          console.error(err);
          console.log("*********************************");
        }
      }
}

    

module.exports = DBManager;



