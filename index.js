// Instrucciones para correr:
// 1) Instalar npm y node
// 2) Correr npm installl
// 3) Correr npm start app_usr-token-de-acceso id-sitio id-vendedor
// Para psar mas busques, correr npm start app_usr-token-de-acceso id-sitio id-vendedor id-sitio2 id-vendedor2 etc...

const request = require("request")
const fs = require('fs')

const archivo_log = 'items.log'

// Ignoramos los primeros 2 parametros (node.exe y el path a este script)
const args = process.argv.slice(2)
// El primer parametro debe ser el access token
const access_token = args[0];//"APP_USR-3070549191103425-091406-5851bcc45d380f71e3d7b9b50ae98911-38130676"

function do_request(access_token, seller_id, site_id, offset) {
  const options = {
    url: `https://api.mercadolibre.com/sites/${site_id}/search`,
    qs: {
      seller_id,
      access_token
    }
  };
  request(options, function(err, response, body) {
    if (err) {
      console.log(`Error haciendo request: ${err}`)
      return
    }
    const parsed_body = JSON.parse(body)
    if (response.statusCode === 401) {
        console.log(`Error: ${parsed_body.message}`)
	return
    }
    console.log("Get response: " + response.statusCode);
    console.log("body: " + JSON.stringify(parsed_body, null, 4)); // spacing level = 2
    const {
      results,
      paging: { offset, total, limit }
    } = parsed_body
    results.forEach(result => {
      const { category_id, title, id, name } = result
      const category_options = {
        url: `https://api.mercadolibre.com/categories/${category_id}`
      }
      // Hacemos otro request para el nombre de categoria
      request(category_options, function(err, response, body) {
        if (err) {
          console.log(`Error haciendo request: ${err}`)
          return;
        }
        const { name: category_name } = JSON.parse(body)
        fs.appendFile(archivo_log, `${id} ${title} ${category_id} ${category_name} ${name}`)
      })
    })
    // Si no terminamos, pedimos la proxima pagina de resultados
    if (total !== limit && total !== 0) {
      do_request(access_token, seller_id, site_id, offset)
    }
  })
}

function into_chunks(arr, n) {
  return Array(Math.ceil(arr.length / n))
    .fill()
    .map((_, i) => arr.slice(i * n, i * n + n));
}
// Para cada par de parametros hacemos el request
into_chunks(args.slice(1), 2).forEach(pair => {
  if (pair.length !== 2) {
    return
  }
  const site_id = pair[0] //"MLA"
  const seller_id = pair[1] //81644610
  do_request(access_token, seller_id, site_id, 0)
})
