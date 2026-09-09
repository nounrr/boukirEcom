const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
// Development validation only. No server is started, and application code does not import this helper.
Module.registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('next/') && !path.extname(specifier) && fs.existsSync(path.join(root, 'node_modules', `${specifier}.js`))) return nextResolve(`${specifier}.js`, context);
  return nextResolve(specifier, context);
} });
const resolve = Module._resolveFilename;
Module._resolveFilename = function(name, parent, ...rest) { if (name.startsWith('@/')) name = path.join(root,'src',name.slice(2)); return resolve.call(this,name,parent,...rest); };
for (const ext of ['.ts','.tsx']) require.extensions[ext]=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2020}}).outputText,file);
module.exports = { root };
