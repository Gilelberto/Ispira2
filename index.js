const http = require('http');
const fs = require('fs');
const ejs = require('ejs');

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
    if(request.url == "/test"){
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