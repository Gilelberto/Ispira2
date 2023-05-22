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
}

    

module.exports = DBManager;



