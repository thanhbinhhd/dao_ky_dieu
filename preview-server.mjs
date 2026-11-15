import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(".");
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8" };

const port = Number(process.env.PORT || 4173);

http.createServer((request, response) => {
  const clean = request.url === "/" ? "index.html" : request.url.slice(1).split("?")[0];
  const file = path.join(root, clean);
  fs.readFile(file, (error, data) => {
    if (error) { response.writeHead(404); response.end("Not found"); return; }
    response.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
    response.end(data);
  });
}).listen(port, "127.0.0.1", () => console.log(`http://127.0.0.1:${port}`));
