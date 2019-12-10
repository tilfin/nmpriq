
exports.sendJson = (res, statusCode, entity) => {
  let json, code = statusCode;
  try {
    json = JSON.stringify(entity);
  } catch(err) {
    code = 500;
    json = '{"message":"Broken content"}';
  }

  res.writeHead(code, { 'Content-Length': Buffer.byteLength(json, 'utf8'),
                        'Content-Type': 'application/json;charset=UTF-8' })
  res.end(json)
}
