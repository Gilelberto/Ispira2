const http = require('http');
const fs = require('fs');
const ejs = require('ejs');
const dbDriver = require('./conection');
const { error, Console } = require('console');
const hash = require('./hash');
const { type } = require('os');
var genID = new hash();
let db = new dbDriver();
var admin_pass;
var sucursal;

//http => (request,response)
function chargePage(file,request,response){
    fs.readFile(file,(error,data)=>{
        if(error){
            response.writeHead(404, {"Content-Type":"text/html"});
            response.write("Not Found");
            response.end(); 
        }else{
            const extension = request.url.split('.').pop();
            switch(extension){
                case 'txt':
                    response.writeHead(200, {"Content-Type":"text/plain"});
                    break;
                case 'html':
                    response.writeHead(200, {"Content-Type":"text/html"});
                    break;
                case 'css':
                    response.writeHead(200, {"Content-Type":"text/css"});
                    break;
                case 'jpeg':
                    response.writeHead(200, {"Content-Type":"image/jpeg"});
                    break;
                case 'jpg':
                    response.writeHead(200, {"Content-Type":"image/jpg"});
                    break;
                default:
                    response.writeHead(200, {"Content-Type":"text/html"});
            };
            response.write(data);
            response.end();
        };
    });
    
}
http.createServer((request,response)=>{
    const file = request.url == '/' ? './www/index.html' : `./WWW${request.url}`;
    
    //console.log(request.url);
    if(request.url == "/admin_login" && request.method == "POST"){ 
        let data = [];
        request.on('data', value => {
            data.push(value);
        }).on('end', ()=>{
            //console.log(data);
            let params = Buffer.concat(data).toString();
            //console.log(params);

            const jsonData = {};
            params.split('&').forEach(item => {
            const [key, value] = item.split('=');
            jsonData[key] = value;
            });
            /*AQUÍ HAY QUE USAR UNA CONSULTA PARA VERIFICAR QUE EL USUARIO SEA ADMIN MIENTRAS LO 
            VOY A HARDCODEAR PARA SIMULAR LA FUNCIÓN*/
            db.consult('select * from administrador').then(dbInfo =>{
                let conti = false;
                let user;
                var password;
                console.log(dbInfo[0].CLAVE);
                if(jsonData.sucursal == '01'){
                    user = dbInfo[0].ADMIN_ID;
                    password = dbInfo[0].CLAVE;
                    console.log("CONTRASEÑA: ",dbInfo[0].CLAVE);
                    conti = true;
                    sucursal = '1';
                }
                else if(jsonData.sucursal == '02'){
                    user = dbInfo[1].ADMIN_ID;
                    password = dbInfo[1].CLAVE;
                    conti = true;
                    sucursal = '2';
                }
                console.log("INICIO")
                console.log(dbInfo);
                console.log(jsonData);
                console.log(user,password,conti);
                console.log(jsonData.admin_usr,jsonData.pswrd,conti);
                if(user == jsonData.admin_usr && password == jsonData.pswrd && conti == true){
                    console.log("ENTRA");
                    admin_pass = password;
                    response.writeHead(302, { 'Location': './main_screen.html' });
                    response.end();
                }
                else{
                    response.writeHead(302, { 'Location': './index.html' });
                    response.end();
                }
            }).catch(err => {
                console.error(err);
                response.writeHead({"Content-Type":"text/plain"});
                response.write("Error en la consulta");
                response.end()
            });
            
        });
    }
    else if(request.url == "/user_visit" && request.method == "POST"){
        //consultar el usuario a la base de datos y desplegar la página de bienvenido
        let data = [];
        request.on('data', value => {
            data.push(value);
        }).on('end', ()=>{
            let params = Buffer.concat(data).toString();
            const jsonData = {};
            params.split('&').forEach(item => {
            const [key, value] = item.split('=');
            jsonData[key] = value;
            });
            db.consult(`select * from persona p join usuario u on (p.persona_id = u.usuario_id) join fechas f using(usuario_id) where usuario_id = ${jsonData.usr}`).then(dbInfo  => {
                let userExists = true;    //ESTO ESTÁ DEMÁS ES BASICAMENTE CÓDIGO BASURA QUE NO SE QUITA PARA NO PERDER TIEMPO PERO EL IF NO ES NECESARIO              
                //INSERTAMOS LA VISITA
                //id , usuario_id, fecha_visita_sucursal_id
                //VALUES (:1, :2, :3, :4)
                let cons = `INSERT INTO Visitas VALUES (:1, :2, :3, :4)`;
                let dt = new Date();
                let id = genID.getNumericHashFromDate(dt);
                let vals = [id,jsonData.usr,dt,sucursal];
                db.insert(cons,vals);

                if(userExists){
                    let ejsFile = './www/ejsFiles/welcome.ejs';
                    let dt = new Date();
                    let st;
                    if(dt < dbInfo[0].FECHA_CORTE){ //GRACIAS ANAHÍ TQM SIN TI NO SALÍA ÉSTE BUG
                        st = 'Activo';
                    }
                    else{
                        st = 'Vencido';
                    }
                    ejs.renderFile(ejsFile, { "username" : dbInfo[0].NOMBRE , "days": dbInfo[0].FECHA_CORTE, "status":st }, (err, renderedHtml) => {
                        if (err) {
                        response.statusCode = 500;
                        response.end('Error interno del servidor');
                        return;
                        }
                        response.statusCode = 200;
                        response.setHeader('Content-Type', 'text/html');
                        response.end(renderedHtml);
                        //estaría bueno en welcome.ejs poner un Script que después de un tiempo de q 5 segundos haga
                        //un request para volver a cargar main_screen.html
                    });

                }
                else{
                    response.writeHead(302, { 'Location': './main_screen.html' });
                    response.end();
                }
            }).catch(err => {
                console.error(err);
                response.writeHead(302, { 'Location': './main_screen.html' });
                response.end();
            });
        });
    }
    else if(request.url == "/get_user_info" && request.method == "POST"){
        let data = [];
        request.on('data', value => {
            data.push(value);
        }).on('end', ()=>{
            //console.log(data);
            let params = Buffer.concat(data).toString();
            //console.log(params);

            const jsonData = {};
            params.split('&').forEach(item => {
            const [key, value] = item.split('=');
            jsonData[key] = value;
            });
            /AQUÍ HAY QUE USAR UNA CONSULTA PARA VERIFICAR QUE EL USUARIO EXISTE MIENTRAS HARDCODE/
            db.consult(`select * from persona p join usuario u on (p.persona_id = u.usuario_id) join fechas f using(usuario_id) join rutina r using(rutina_id) join tipo_suscripcion t using(suscripcion_id)
            where usuario_id = ${jsonData.usr}`).then(dbInfo  => {
                //tendríamos los resultados de la consulta y los pasaríamos a un Json
                let userInfo = { "user_id":jsonData.user, "username": dbInfo[0].NOMBRE, "birthday": dbInfo[0].CUMPLE, "direction":dbInfo[0].DIRECCION,"status":"active" };
                let userExists = true;
                /*Aquí procedemos a en caso de que sí existe, a cargar los datos */                
                if(userExists){
                    let ejsFile = './www/ejsFiles/usr_info.ejs';
                    //console.log(ejsFile)
                    ejs.renderFile(ejsFile, userInfo, (err, renderedHtml) => {
                        if (err) {
                        response.statusCode = 500;
                        response.end('Error interno del servidor');
                        return;
                        }
                        response.statusCode = 200;
                        response.setHeader('Content-Type', 'text/html');
                        response.end(renderedHtml);
                        //estaría bueno en welcome.ejs poner un Script que después de un tiempo de q 5 segundos haga
                        //un request para volver a cargar main_screen.html
                    });
                }
                else{
                    response.writeHead(302, { 'Location': './user_consult.html' });
                    response.end();
                }
            }).catch(err => {
                console.error(err);
                response.writeHead(302, { 'Location': './user_consult.html' });
                response.end();
            });
        });
    }
    else if(request.url == "/get_all_users_info" && request.method == "POST"){
        let data = [];
        request.on('data', value => {
            data.push(value);
        }).on('end', ()=>{
            let params = Buffer.concat(data).toString();
            const jsonData = {};
            params.split('&').forEach(item => {
            const [key, value] = item.split('=');
            jsonData[key] = value;
            }); 
            
            if(admin_pass == jsonData.pswrd){
                let ejsFile = './www/ejsFiles/allUsers.ejs';
                let pageHeader = `Información completa de todos los usuarios`;
                db.consult(`select * from persona p join usuario u on (p.persona_id = u.usuario_id) join fechas f using(usuario_id) join rutina r using(rutina_id) join tipo_suscripcion t using(suscripcion_id)`).then(dbInfo =>{
                    //CARGAR LA INFO DE LA CONSULTA Y RENDERIZAR
                    let formatedInfo = [];
                    for(let i = 0; i < dbInfo.length ; i++){
                        let register = JSON.stringify(dbInfo[i]);
                        //console.log(dbInfo[i]);
                        formatedInfo.push("<p>"+register+"<p/>");
                    }
                    formatedInfo = formatedInfo.join("<hr/>");
                    ejs.renderFile(ejsFile, {"info":formatedInfo, "title":pageHeader}, (err, renderedHtml) => {
                        if (err) {
                        response.statusCode = 500;
                        response.end('Error interno del servidor');
                        return;
                        }
                        response.statusCode = 200;
                        response.setHeader('Content-Type', 'text/html');
                        response.end(renderedHtml);
                    });
                }).catch(err => {
                    console.error(err);
                    response.writeHead({"Content-Type":"text/plain"});
                    response.write("Error en la consulta");
                    response.end()
                });
            }
            else{
                response.writeHead(302, { 'Location': './users_login.html' });
                response.end();
            }
        });
    }
    else if(request.url == "/delete_user" && request.method == "POST"){
        let data = [];
        request.on('data', value => {
            data.push(value);
        }).on('end', ()=>{
            let params = Buffer.concat(data).toString();
            const jsonData = {};
            params.split('&').forEach(item => {
            const [key, value] = item.split('=');
            jsonData[key] = value;
            });
            /AQUÍ HAY QUE USAR UNA CONSULTA PARA VERIFICAR QUE EL USUARIO EXISTE MIENTRAS HARDCODE/
            let user = jsonData.usr;
            console.log(jsonData);
            //tendríamos los resultados de la consulta y los pasaríamos a un Json
            
            //datos jiji
            let userExists = true;
            /*Aquí procedemos a en caso de que sí existe, a borrar al mamaguevo */
            if(userExists && jsonData.confirmation == "confirmar"){
                //BORRAMOS ÉPICAMENTE
                console.log("Borraoh");
                response.writeHead(302, { 'Location': './sudoOptions.html' });
                response.end();
            }
            else{
                response.writeHead(302, { 'Location': './delUser.html' });
                console.log("NOSTABA");
                response.end();
            }
        });
    }
    else if(request.url == "/add_days" && request.method == "POST"){
        //HACEMOS UN INSERET MAMALÓN AL USUARIO ESPECÍFICADO
        let data = [];
        request.on('data', value => {
            data.push(value);
        }).on('end', ()=>{
            let params = Buffer.concat(data).toString();
            const jsonData = {};
            params.split('&').forEach(item => {
            const [key, value] = item.split('=');
            jsonData[key] = value;
            });     
            if(jsonData.pswd == admin_pass){
                db.consult(`select * from usuario u join fechas f using(usuario_id) join tipo_suscripcion using (suscripcion_id) where usuario_id = ${jsonData.usr_id}`).then(dbInfo  => {
                    
                    let dtOld = new Date();
                    let dt = new Date()

                    //ALTER FECHAS EN FECHAS
                    /*console.log("====================");
                    console.log(dbInfo);
                    console.log("====================");*/
                    let payment = dtOld;
                    dt.setMonth(dt.getMonth() + dbInfo[0].CANTIDAD); 
                    let paymentInsert = `update fechas set fecha_pago=:payment,fecha_corte=:newPayment
                    where usuario_id= ${jsonData.usr_id}`;
                    let paymentValues = {"payment":payment,"newPayment":dt};
                    db.insert(paymentInsert,paymentValues);
                    //ALTER EN USUARIO
                    let userCons = `update usuario set suscripcion_id = :newSus where usuario_id = ${jsonData.usr_id}`;
                    let userValue = {"newSus":jsonData.sus};
                    db.insert(userCons,userValue);

                    response.writeHead(302, { 'Location': './payments.html' });
                    response.end();

                    
                }).catch(err => {
                    console.error(err);
                    response.writeHead(302, { 'Location': './payments.html' });
                    response.end();
                });
            }
            else{
                response.writeHead(302, { 'Location': './payments.html' });
                response.end();
            }
        });
    }
    else if(request.url == "/sudo" && request.method == "POST"){
        //tenemos que sacar la contraseña de la base de batos
        //let password = "ispira";
        let data = [];
        request.on('data', value => {
            data.push(value);
        }).on('end', ()=>{
            let params = Buffer.concat(data).toString();
            const jsonData = {};
            params.split('&').forEach(item => {
            const [key, value] = item.split('=');
            jsonData[key] = value;
            });
            
            if(jsonData.pswrd == admin_pass){
                //cargar las opciones donde se mete gente
                response.writeHead(302, { 'Location': './sudoOptions.html' });
                response.end();
            }
            else{
                response.writeHead(302, { 'Location': './sudo.html' });
                response.end();
            }
        });

    }
    else if(request.url == "/new_user" && request.method == "POST"){
        let data = [];
        request.on('data', value => {
            data.push(value);
        }).on('end', ()=>{
            let params = Buffer.concat(data).toString();
            const jsonData = {};
            params.split('&').forEach(item => {
            const [key, value] = item.split('=');
            jsonData[key] = value;
            });
            
            let dt = new Date();
            let dtPayment = new Date();
            dtPayment.setMonth(dtPayment.getMonth() + 3);
            let id = genID.getNumericHashFromDate(dt);

            //formateamos para que deje meter la fecha jiji
            let year = dt.getFullYear();
            let month = String(dt.getMonth() + 1).padStart(2, "0"); // Agrega ceros a la izquierda si es necesario
            let day = String(dt.getDate()).padStart(2, "0"); // Agrega ceros a la izquierda si es necesario
            const formattedDatePayment = `${year}-${month}-${day}`;

            year = dtPayment.getFullYear();
            month = String(dtPayment.getMonth() + 1).padStart(2, "0"); // Agrega ceros a la izquierda si es necesario
            day = String(dtPayment.getDate()).padStart(2, "0"); // Agrega ceros a la izquierda si es necesario
            const formattedDateNext = `${year}-${month}-${day}`;

            console.log(jsonData);

            let operations = [
                `INSERT INTO Persona VALUES (${id}, '${jsonData.name}', TO_DATE('${jsonData.birthday}', 'YYYY-MM-DD'), '${jsonData.address}', 'Activo')`,
                `INSERT INTO USUARIO VALUES (${id}, ${jsonData.suscription}, ${jsonData.entrenador}, ${jsonData.routine})`,
                `INSERT INTO FECHAS VALUES (${id}, TO_DATE('${formattedDatePayment}', 'YYYY-MM-DD'), TO_DATE('${formattedDateNext}', 'YYYY-MM-DD'))`
              ];
            console.log(operations);
            db.executeBatch(operations).then(res=>{
                //console.log(bindParams);
                response.writeHead(302, { 'Location': './sudoOptions.html' });
                response.end();
            }).catch(err => {
                console.log(err);
                response.writeHead(302, { 'Location': './sudoOptions.html' });
                response.end();
            });
        });
    }
    else if(request.url == "/users_visit_login" && request.method == "POST"){
        let data = [];
        request.on('data', value => {
            data.push(value);
        }).on('end', ()=>{
            let params = Buffer.concat(data).toString();
            const jsonData = {};
            params.split('&').forEach(item => {
            const [key, value] = item.split('=');
            jsonData[key] = value;
            });
            
            //CODIGO AQUÍ
            let cons = `SELECT * FROM VISITAS WHERE USUARIO_ID = ${jsonData.usr}`;
            let ejsFile = './www/ejsFiles/allUsers.ejs';
            let pageHeader = `Historial de visitas del usuario ${jsonData.usr}`;
            db.consult(cons).then(dbInfo => {
                //CARGAR LA INFO DE LA CONSULTA Y RENDERIZAR
                let formatedInfo = [];
                for(let i = 0; i < dbInfo.length ; i++){
                    let register = JSON.stringify(dbInfo[i]);
                    //console.log(dbInfo[i]);
                    formatedInfo.push("<p>"+register+"<p/>");
                }
                formatedInfo = formatedInfo.join("<hr/>");
                ejs.renderFile(ejsFile, {"info":formatedInfo, "title": pageHeader}, (err, renderedHtml) => {
                    if (err) {
                    response.statusCode = 500;
                    response.end('Error interno del servidor');
                    return;
                    }
                    response.statusCode = 200;
                    response.setHeader('Content-Type', 'text/html');
                    response.end(renderedHtml);
                });
            }).catch(error =>{
                console.log(error);
                response.writeHead(302, { 'Location': './sudoOptions.html' });
                response.end();
            });


        });
    }
    else if(request.url == "/employee_consult_login" && request.method == "POST"){
        let data = [];
        request.on('data', value => {
            data.push(value);
        }).on('end', ()=>{
            let params = Buffer.concat(data).toString();
            const jsonData = {};
            params.split('&').forEach(item => {
            const [key, value] = item.split('=');
            jsonData[key] = value;
            });
            
            //CODIGO AQUÍ para uno sólo

            response.writeHead(302, { 'Location': './sudoOptions.html' });
            response.end();
        });
    }
    else if(request.url == "/get_all_employees_info" && request.method == "POST"){
        let data = [];
        request.on('data', value => {
            data.push(value);
        }).on('end', ()=>{
            let params = Buffer.concat(data).toString();
            const jsonData = {};
            params.split('&').forEach(item => {
            const [key, value] = item.split('=');
            jsonData[key] = value;
            });
            
            //CODIGO AQUÍ

            response.writeHead(302, { 'Location': './sudoOptions.html' });
            response.end();
        });
    }
    else if(request.url == "/new_employee" && request.method == "POST"){
        let data = [];
        request.on('data', value => {
            data.push(value);
        }).on('end', ()=>{
            let params = Buffer.concat(data).toString();
            const jsonData = {};
            params.split('&').forEach(item => {
            const [key, value] = item.split('=');
            jsonData[key] = value;
            });
            
            let dt = new Date();
            let dtPayment = new Date();
            dtPayment.setMonth(dtPayment.getMonth() + 3);
            let id = genID.getNumericHashFromDate(dt);

            //formateamos para que deje meter la fecha jiji
            let year = dt.getFullYear();
            let month = String(dt.getMonth() + 1).padStart(2, "0"); // Agrega ceros a la izquierda si es necesario
            let day = String(dt.getDate()).padStart(2, "0"); // Agrega ceros a la izquierda si es necesario
            const formattedDatePayment = `${year}-${month}-${day}`;

            year = dtPayment.getFullYear();
            month = String(dtPayment.getMonth() + 1).padStart(2, "0"); // Agrega ceros a la izquierda si es necesario
            day = String(dtPayment.getDate()).padStart(2, "0"); // Agrega ceros a la izquierda si es necesario
            const formattedDateNext = `${year}-${month}-${day}`;

            console.log(jsonData);

            let operations = [];           
            if([11,12,13,14,15].includes(parseInt(jsonData.e_type)) ){
                operations = [
                    `INSERT INTO Persona VALUES (${id}, '${jsonData.name}', TO_DATE('${jsonData.birthday}', 'YYYY-MM-DD'), '${jsonData.address}', 'Activo')`,
                    `INSERT INTO EMPLEADO VALUES (${id}, ${jsonData.branch}, ${jsonData.salary}, '${jsonData.schedule}', '${jsonData.rest}')`,
                    `INSERT INTO ENTRENADOR VALUES (${id}, ${jsonData.e_type})`
                  ];
            }
            else if(jsonData.e_type == 627){ //es recepcionista
                operations = [
                    `INSERT INTO Persona VALUES (${id}, '${jsonData.name}', TO_DATE('${jsonData.birthday}', 'YYYY-MM-DD'), '${jsonData.address}', 'Activo')`,
                    `INSERT INTO EMPLEADO VALUES (${id}, ${jsonData.branch}, ${jsonData.salary}, '${jsonData.schedule}', '${jsonData.rest}')`,
                    `INSERT INTO RECEPCIONISTA VALUES (${id})`
                  ];
            }
            console.log(operations);
            if(operations != []){
                db.executeBatch(operations).then(res=>{
                    //console.log(bindParams);
                    response.writeHead(302, { 'Location': './sudoOptions.html' });
                    response.end();
                }).catch(err => {
                    console.log(err);
                    response.writeHead(302, { 'Location': './sudoOptions.html' });
                    response.end();
                });
            }
            else{
                response.writeHead(302, { 'Location': './sudoOptions.html' });
                response.end();
            }
            
        });
    }
    
    else{chargePage(file,request,response);}

    
}).listen(8888);