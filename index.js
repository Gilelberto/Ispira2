const http = require('http');
const fs = require('fs');
const ejs = require('ejs');
const dbDriver = require('./conection');
const { error } = require('console');
let db = new dbDriver();
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
        console.log("ENTRA");
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
                let password;
                if(jsonData.sucursal == '01'){
                    user = dbInfo[0].ADMIN_ID;
                    password = dbInfo[0].CONTRASEÑA;
                    conti = true;
                }
                else if(jsonData.sucursal == '02'){
                    user = dbInfo[1].ADMIN_ID;
                    password = dbInfo[1].CONTRASEÑA;
                    conti = true;
                }
                if(user == jsonData.admin_usr && password == jsonData.pswrd && conti == true){
                    
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
                if(userExists){
                    let ejsFile = './www/ejsFiles/welcome.ejs';
                    ejs.renderFile(ejsFile, { "username" : dbInfo[0].NOMBRE , "days": dbInfo[0].FECHA_CORTE }, (err, renderedHtml) => {
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
            /*AQUÍ HAY QUE USAR UNA CONSULTA PARA VERIFICAR QUE EL USUARIO EXISTE MIENTRAS HARDCODE*/
            db.consult(`select * from persona p join usuario u on (p.persona_id = u.usuario_id) join fechas f using(usuario_id) join rutina r using(rutina_id) join tipo_suscripcion t using(suscripcion_id)
            where usuario_id = ${jsonData.usr}`).then(dbInfo  => {
                //tendríamos los resultados de la consulta y los pasaríamos a un Json
                let userInfo = { "user_id":jsonData.user, "username": dbInfo[0].NOMBRE, "birthday": dbInfo[0].CUMPLEAÑOS, "direction":dbInfo[0].DIRECCION,"status":"active" };
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
            /*AQUÍ HAY QUE USAR UNA CONSULTA PARA VERIFICAR QUE EL USUARIO EXISTE MIENTRAS HARDCODE*/
            let password = "ispira";
            console.log(jsonData.pswrd);
            console.log(jsonData);
            //tendríamos los resultados de la consulta y los pasaríamos a un Json
            
            //datos jiji
            let userExists = true;
            /*Aquí procedemos a en caso de que sí existe, a cargar los datos */
            if(userExists && password == jsonData.pswrd){
                let ejsFile = './www/ejsFiles/allUsers.ejs';
                //console.log(ejsFile)
                ejs.renderFile(ejsFile, {}, (err, renderedHtml) => {
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
            /*AQUÍ HAY QUE USAR UNA CONSULTA PARA VERIFICAR QUE EL USUARIO EXISTE MIENTRAS HARDCODE*/
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

            console.log(jsonData);
            
            //OBTENEMOS LOS DATOS  verificamos que existe el usuario y que seamos admin, luego ya le metemos la fecha
            let password = "ispira";
            let userExist = true;
            
            if(userExist && jsonData.pswd == password){
                //hacemos insert a la base de datos
                console.log("SE INGRESA TODO BN");
                response.writeHead(302, { 'Location': './payments.html' });
                response.end();
            }
            else{
                response.writeHead(302, { 'Location': './payments.html' });
                response.end();
            }
        });
    }
    else if(request.url == "/sudo" && request.method == "POST"){
        //tenemos que sacar la contraseña de la base de batos
        let password = "ispira";
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
            
            if(jsonData.pswrd == password){
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
            
            console.log(jsonData);
            response.writeHead(302, { 'Location': './sudoOptions.html' });
            response.end();
        });
    }
    else if(request.url == "/test"){
        let ejsFile = './www/ejsFiles/test.ejs';
        console.log(ejsFile)
        let nombre = "Campanita"
        ejs.renderFile(ejsFile, { "username" : nombre }, (err, renderedHtml) => {
            if (err) {
              response.statusCode = 500;
              response.end('Error interno del servidor');
              return;
            }
            response.statusCode = 200;
            response.setHeader('Content-Type', 'text/html');
            response.end(renderedHtml);
          });
    }
    else if(request.url == '/save' && request.method == "POST"){
        //console.log("ENTRA");
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
            fs.appendFile('./WWW/customers/customers.info', JSON.stringify(jsonData) + '\n', (error) => {
                if (error) {
                  response.writeHead(500, { 'Content-Type': 'text/plain' });
                  response.write('Error al guardar el formulario');
                  response.end();
                } else {
                    response.writeHead(302, { 'Location': './formulario.html' });
                    response.end();
                }
              });
            //console.log(params);
            //response.write(params);
        });
    }
    else{chargePage(file,request,response);}

    
}).listen(8888);