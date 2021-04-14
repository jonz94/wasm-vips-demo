var Vips = (function () {
  var _scriptDir =
    typeof document !== 'undefined' && document.currentScript
      ? document.currentScript.src
      : undefined;
  if (typeof __filename !== 'undefined') _scriptDir = _scriptDir || __filename;
  return function (Vips) {
    Vips = Vips || {};

    var Module = typeof Vips !== 'undefined' ? Vips : {};
    var readyPromiseResolve, readyPromiseReject;
    Module['ready'] = new Promise(function (resolve, reject) {
      readyPromiseResolve = resolve;
      readyPromiseReject = reject;
    });
    var moduleOverrides = {};
    var key;
    for (key in Module) {
      if (Module.hasOwnProperty(key)) {
        moduleOverrides[key] = Module[key];
      }
    }
    var arguments_ = [];
    var thisProgram = './this.program';
    var quit_ = function (status, toThrow) {
      throw toThrow;
    };
    var ENVIRONMENT_IS_WEB = false;
    var ENVIRONMENT_IS_WORKER = false;
    var ENVIRONMENT_IS_NODE = false;
    var ENVIRONMENT_IS_SHELL = false;
    ENVIRONMENT_IS_WEB = typeof window === 'object';
    ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
    ENVIRONMENT_IS_NODE =
      typeof process === 'object' &&
      typeof process.versions === 'object' &&
      typeof process.versions.node === 'string';
    ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
    var ENVIRONMENT_IS_PTHREAD = Module['ENVIRONMENT_IS_PTHREAD'] || false;
    if (ENVIRONMENT_IS_PTHREAD) {
      buffer = Module['buffer'];
      DYNAMIC_BASE = Module['DYNAMIC_BASE'];
      DYNAMICTOP_PTR = Module['DYNAMICTOP_PTR'];
    }
    var scriptDirectory = '';
    function locateFile(path) {
      if (Module['locateFile']) {
        return Module['locateFile'](path, scriptDirectory);
      }
      return scriptDirectory + path;
    }
    var read_, readAsync, readBinary, setWindowTitle;
    var nodeFS;
    var nodePath;
    if (ENVIRONMENT_IS_NODE) {
      if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = require('path').dirname(scriptDirectory) + '/';
      } else {
        scriptDirectory = __dirname + '/';
      }
      read_ = function shell_read(filename, binary) {
        if (!nodeFS) nodeFS = require('fs');
        if (!nodePath) nodePath = require('path');
        filename = nodePath['normalize'](filename);
        return nodeFS['readFileSync'](filename, binary ? null : 'utf8');
      };
      readBinary = function readBinary(filename) {
        var ret = read_(filename, true);
        if (!ret.buffer) {
          ret = new Uint8Array(ret);
        }
        assert(ret.buffer);
        return ret;
      };
      if (process['argv'].length > 1) {
        thisProgram = process['argv'][1].replace(/\\/g, '/');
      }
      arguments_ = process['argv'].slice(2);
      process['on']('uncaughtException', function (ex) {
        if (!(ex instanceof ExitStatus)) {
          throw ex;
        }
      });
      process['on']('unhandledRejection', abort);
      quit_ = function (status) {
        process['exit'](status);
      };
      Module['inspect'] = function () {
        return '[Emscripten Module object]';
      };
      var nodeWorkerThreads;
      try {
        nodeWorkerThreads = require('worker_threads');
      } catch (e) {
        console.error(
          'The "worker_threads" module is not supported in this node.js build - perhaps a newer version is needed?',
        );
        throw e;
      }
      global.Worker = nodeWorkerThreads.Worker;
    } else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
      if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = self.location.href;
      } else if (document.currentScript) {
        scriptDirectory = document.currentScript.src;
      }
      if (_scriptDir) {
        scriptDirectory = _scriptDir;
      }
      if (scriptDirectory.indexOf('blob:') !== 0) {
        scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf('/') + 1);
      } else {
        scriptDirectory = '';
      }
      if (ENVIRONMENT_IS_NODE) {
        read_ = function shell_read(filename, binary) {
          if (!nodeFS) nodeFS = require('fs');
          if (!nodePath) nodePath = require('path');
          filename = nodePath['normalize'](filename);
          return nodeFS['readFileSync'](filename, binary ? null : 'utf8');
        };
        readBinary = function readBinary(filename) {
          var ret = read_(filename, true);
          if (!ret.buffer) {
            ret = new Uint8Array(ret);
          }
          assert(ret.buffer);
          return ret;
        };
      } else {
        read_ = function shell_read(url) {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', url, false);
          xhr.send(null);
          return xhr.responseText;
        };
        if (ENVIRONMENT_IS_WORKER) {
          readBinary = function readBinary(url) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            xhr.responseType = 'arraybuffer';
            xhr.send(null);
            return new Uint8Array(xhr.response);
          };
        }
        readAsync = function readAsync(url, onload, onerror) {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', url, true);
          xhr.responseType = 'arraybuffer';
          xhr.onload = function xhr_onload() {
            if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
              onload(xhr.response);
              return;
            }
            onerror();
          };
          xhr.onerror = onerror;
          xhr.send(null);
        };
      }
      setWindowTitle = function (title) {
        document.title = title;
      };
    } else {
    }
    if (ENVIRONMENT_IS_NODE) {
      if (typeof performance === 'undefined') {
        global.performance = require('perf_hooks').performance;
      }
    }
    var out = Module['print'] || console.log.bind(console);
    var err = Module['printErr'] || console.warn.bind(console);
    for (key in moduleOverrides) {
      if (moduleOverrides.hasOwnProperty(key)) {
        Module[key] = moduleOverrides[key];
      }
    }
    moduleOverrides = null;
    if (Module['arguments']) arguments_ = Module['arguments'];
    if (Module['thisProgram']) thisProgram = Module['thisProgram'];
    if (Module['quit']) quit_ = Module['quit'];
    var STACK_ALIGN = 16;
    function alignMemory(size, factor) {
      if (!factor) factor = STACK_ALIGN;
      return Math.ceil(size / factor) * factor;
    }
    function convertJsFunctionToWasm(func, sig) {
      if (typeof WebAssembly.Function === 'function') {
        var typeNames = { i: 'i32', j: 'i64', f: 'f32', d: 'f64' };
        var type = { parameters: [], results: sig[0] == 'v' ? [] : [typeNames[sig[0]]] };
        for (var i = 1; i < sig.length; ++i) {
          type.parameters.push(typeNames[sig[i]]);
        }
        return new WebAssembly.Function(type, func);
      }
      var typeSection = [1, 0, 1, 96];
      var sigRet = sig.slice(0, 1);
      var sigParam = sig.slice(1);
      var typeCodes = { i: 127, j: 126, f: 125, d: 124 };
      typeSection.push(sigParam.length);
      for (var i = 0; i < sigParam.length; ++i) {
        typeSection.push(typeCodes[sigParam[i]]);
      }
      if (sigRet == 'v') {
        typeSection.push(0);
      } else {
        typeSection = typeSection.concat([1, typeCodes[sigRet]]);
      }
      typeSection[1] = typeSection.length - 2;
      var bytes = new Uint8Array(
        [0, 97, 115, 109, 1, 0, 0, 0].concat(typeSection, [
          2,
          7,
          1,
          1,
          101,
          1,
          102,
          0,
          0,
          7,
          5,
          1,
          1,
          102,
          0,
          0,
        ]),
      );
      var module = new WebAssembly.Module(bytes);
      var instance = new WebAssembly.Instance(module, { e: { f: func } });
      var wrappedFunc = instance.exports['f'];
      return wrappedFunc;
    }
    var freeTableIndexes = [];
    var functionsInTableMap;
    function addFunctionWasm(func, sig) {
      var table = wasmTable;
      if (!functionsInTableMap) {
        functionsInTableMap = new WeakMap();
        for (var i = 0; i < table.length; i++) {
          var item = table.get(i);
          if (item) {
            functionsInTableMap.set(item, i);
          }
        }
      }
      if (functionsInTableMap.has(func)) {
        return functionsInTableMap.get(func);
      }
      var ret;
      if (freeTableIndexes.length) {
        ret = freeTableIndexes.pop();
      } else {
        ret = table.length;
        try {
          table.grow(1);
        } catch (err) {
          if (!(err instanceof RangeError)) {
            throw err;
          }
          throw 'Unable to grow wasm table. Set ALLOW_TABLE_GROWTH.';
        }
      }
      try {
        table.set(ret, func);
      } catch (err) {
        if (!(err instanceof TypeError)) {
          throw err;
        }
        var wrapped = convertJsFunctionToWasm(func, sig);
        table.set(ret, wrapped);
      }
      functionsInTableMap.set(func, ret);
      return ret;
    }
    function addFunction(func, sig) {
      return addFunctionWasm(func, sig);
    }
    var tempRet0 = 0;
    var setTempRet0 = function (value) {
      tempRet0 = value;
    };
    var getTempRet0 = function () {
      return tempRet0;
    };
    var Atomics_load = Atomics.load;
    var Atomics_store = Atomics.store;
    var Atomics_compareExchange = Atomics.compareExchange;
    var wasmBinary;
    if (Module['wasmBinary']) wasmBinary = Module['wasmBinary'];
    var noExitRuntime;
    if (Module['noExitRuntime']) noExitRuntime = Module['noExitRuntime'];
    if (typeof WebAssembly !== 'object') {
      abort('no native wasm support detected');
    }
    var wasmMemory;
    var wasmTable = new WebAssembly.Table({ initial: 4253, element: 'anyfunc' });
    var wasmModule;
    var threadInfoStruct = 0;
    var selfThreadId = 0;
    var ABORT = false;
    var EXITSTATUS = 0;
    function assert(condition, text) {
      if (!condition) {
        abort('Assertion failed: ' + text);
      }
    }
    function UTF8ArrayToString(heap, idx, maxBytesToRead) {
      var endIdx = idx + maxBytesToRead;
      var str = '';
      while (!(idx >= endIdx)) {
        var u0 = heap[idx++];
        if (!u0) return str;
        if (!(u0 & 128)) {
          str += String.fromCharCode(u0);
          continue;
        }
        var u1 = heap[idx++] & 63;
        if ((u0 & 224) == 192) {
          str += String.fromCharCode(((u0 & 31) << 6) | u1);
          continue;
        }
        var u2 = heap[idx++] & 63;
        if ((u0 & 240) == 224) {
          u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
        } else {
          u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heap[idx++] & 63);
        }
        if (u0 < 65536) {
          str += String.fromCharCode(u0);
        } else {
          var ch = u0 - 65536;
          str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
        }
      }
      return str;
    }
    function UTF8ToString(ptr, maxBytesToRead) {
      return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
    }
    function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
      if (!(maxBytesToWrite > 0)) return 0;
      var startIdx = outIdx;
      var endIdx = outIdx + maxBytesToWrite - 1;
      for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343) {
          var u1 = str.charCodeAt(++i);
          u = (65536 + ((u & 1023) << 10)) | (u1 & 1023);
        }
        if (u <= 127) {
          if (outIdx >= endIdx) break;
          heap[outIdx++] = u;
        } else if (u <= 2047) {
          if (outIdx + 1 >= endIdx) break;
          heap[outIdx++] = 192 | (u >> 6);
          heap[outIdx++] = 128 | (u & 63);
        } else if (u <= 65535) {
          if (outIdx + 2 >= endIdx) break;
          heap[outIdx++] = 224 | (u >> 12);
          heap[outIdx++] = 128 | ((u >> 6) & 63);
          heap[outIdx++] = 128 | (u & 63);
        } else {
          if (outIdx + 3 >= endIdx) break;
          heap[outIdx++] = 240 | (u >> 18);
          heap[outIdx++] = 128 | ((u >> 12) & 63);
          heap[outIdx++] = 128 | ((u >> 6) & 63);
          heap[outIdx++] = 128 | (u & 63);
        }
      }
      heap[outIdx] = 0;
      return outIdx - startIdx;
    }
    function stringToUTF8(str, outPtr, maxBytesToWrite) {
      return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
    }
    function lengthBytesUTF8(str) {
      var len = 0;
      for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343)
          u = (65536 + ((u & 1023) << 10)) | (str.charCodeAt(++i) & 1023);
        if (u <= 127) ++len;
        else if (u <= 2047) len += 2;
        else if (u <= 65535) len += 3;
        else len += 4;
      }
      return len;
    }
    function UTF16ToString(ptr, maxBytesToRead) {
      var i = 0;
      var str = '';
      while (1) {
        var codeUnit = HEAP16[(ptr + i * 2) >> 1];
        if (codeUnit == 0 || i == maxBytesToRead / 2) return str;
        ++i;
        str += String.fromCharCode(codeUnit);
      }
    }
    function stringToUTF16(str, outPtr, maxBytesToWrite) {
      if (maxBytesToWrite === undefined) {
        maxBytesToWrite = 2147483647;
      }
      if (maxBytesToWrite < 2) return 0;
      maxBytesToWrite -= 2;
      var startPtr = outPtr;
      var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
      for (var i = 0; i < numCharsToWrite; ++i) {
        var codeUnit = str.charCodeAt(i);
        HEAP16[outPtr >> 1] = codeUnit;
        outPtr += 2;
      }
      HEAP16[outPtr >> 1] = 0;
      return outPtr - startPtr;
    }
    function lengthBytesUTF16(str) {
      return str.length * 2;
    }
    function UTF32ToString(ptr, maxBytesToRead) {
      var i = 0;
      var str = '';
      while (!(i >= maxBytesToRead / 4)) {
        var utf32 = HEAP32[(ptr + i * 4) >> 2];
        if (utf32 == 0) break;
        ++i;
        if (utf32 >= 65536) {
          var ch = utf32 - 65536;
          str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
        } else {
          str += String.fromCharCode(utf32);
        }
      }
      return str;
    }
    function stringToUTF32(str, outPtr, maxBytesToWrite) {
      if (maxBytesToWrite === undefined) {
        maxBytesToWrite = 2147483647;
      }
      if (maxBytesToWrite < 4) return 0;
      var startPtr = outPtr;
      var endPtr = startPtr + maxBytesToWrite - 4;
      for (var i = 0; i < str.length; ++i) {
        var codeUnit = str.charCodeAt(i);
        if (codeUnit >= 55296 && codeUnit <= 57343) {
          var trailSurrogate = str.charCodeAt(++i);
          codeUnit = (65536 + ((codeUnit & 1023) << 10)) | (trailSurrogate & 1023);
        }
        HEAP32[outPtr >> 2] = codeUnit;
        outPtr += 4;
        if (outPtr + 4 > endPtr) break;
      }
      HEAP32[outPtr >> 2] = 0;
      return outPtr - startPtr;
    }
    function lengthBytesUTF32(str) {
      var len = 0;
      for (var i = 0; i < str.length; ++i) {
        var codeUnit = str.charCodeAt(i);
        if (codeUnit >= 55296 && codeUnit <= 57343) ++i;
        len += 4;
      }
      return len;
    }
    function allocateUTF8(str) {
      var size = lengthBytesUTF8(str) + 1;
      var ret = _malloc(size);
      if (ret) stringToUTF8Array(str, HEAP8, ret, size);
      return ret;
    }
    function writeArrayToMemory(array, buffer) {
      HEAP8.set(array, buffer);
    }
    function writeAsciiToMemory(str, buffer, dontAddNull) {
      for (var i = 0; i < str.length; ++i) {
        HEAP8[buffer++ >> 0] = str.charCodeAt(i);
      }
      if (!dontAddNull) HEAP8[buffer >> 0] = 0;
    }
    var WASM_PAGE_SIZE = 65536;
    var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
    function updateGlobalBufferAndViews(buf) {
      buffer = buf;
      Module['HEAP8'] = HEAP8 = new Int8Array(buf);
      Module['HEAP16'] = HEAP16 = new Int16Array(buf);
      Module['HEAP32'] = HEAP32 = new Int32Array(buf);
      Module['HEAPU8'] = HEAPU8 = new Uint8Array(buf);
      Module['HEAPU16'] = HEAPU16 = new Uint16Array(buf);
      Module['HEAPU32'] = HEAPU32 = new Uint32Array(buf);
      Module['HEAPF32'] = HEAPF32 = new Float32Array(buf);
      Module['HEAPF64'] = HEAPF64 = new Float64Array(buf);
    }
    var STACK_BASE = 9071744,
      STACKTOP = STACK_BASE,
      STACK_MAX = 3828864,
      DYNAMIC_BASE = 9071744,
      DYNAMICTOP_PTR = 3828848;
    if (ENVIRONMENT_IS_PTHREAD) {
    }
    var INITIAL_INITIAL_MEMORY = Module['INITIAL_MEMORY'] || 1073741824;
    if (ENVIRONMENT_IS_PTHREAD) {
      wasmMemory = Module['wasmMemory'];
      buffer = Module['buffer'];
    } else {
      if (Module['wasmMemory']) {
        wasmMemory = Module['wasmMemory'];
      } else {
        wasmMemory = new WebAssembly.Memory({
          initial: INITIAL_INITIAL_MEMORY / WASM_PAGE_SIZE,
          maximum: INITIAL_INITIAL_MEMORY / WASM_PAGE_SIZE,
          shared: true,
        });
        if (!(wasmMemory.buffer instanceof SharedArrayBuffer)) {
          err(
            'requested a shared WebAssembly.Memory but the returned buffer is not a SharedArrayBuffer, indicating that while the browser has SharedArrayBuffer it does not have WebAssembly threads support - you may need to set a flag',
          );
          if (ENVIRONMENT_IS_NODE) {
            console.log(
              '(on node you may need: --experimental-wasm-threads --experimental-wasm-bulk-memory and also use a recent version)',
            );
          }
          throw Error('bad memory');
        }
      }
    }
    if (wasmMemory) {
      buffer = wasmMemory.buffer;
    }
    INITIAL_INITIAL_MEMORY = buffer.byteLength;
    updateGlobalBufferAndViews(buffer);
    if (!ENVIRONMENT_IS_PTHREAD) {
      HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;
    }
    var __ATPRERUN__ = [];
    var __ATINIT__ = [];
    var __ATMAIN__ = [];
    var __ATEXIT__ = [];
    var __ATPOSTRUN__ = [];
    var runtimeInitialized = false;
    var runtimeExited = false;
    if (ENVIRONMENT_IS_PTHREAD) runtimeInitialized = true;
    function preRun() {
      if (ENVIRONMENT_IS_PTHREAD) return;
      if (Module['preRun']) {
        if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
        while (Module['preRun'].length) {
          addOnPreRun(Module['preRun'].shift());
        }
      }
      callRuntimeCallbacks(__ATPRERUN__);
    }
    function initRuntime() {
      runtimeInitialized = true;
      if (!Module['noFSInit'] && !FS.init.initialized) FS.init();
      TTY.init();
      PIPEFS.root = FS.mount(PIPEFS, {}, null);
      callRuntimeCallbacks(__ATINIT__);
    }
    function preMain() {
      if (ENVIRONMENT_IS_PTHREAD) return;
      FS.ignorePermissions = false;
      callRuntimeCallbacks(__ATMAIN__);
    }
    function exitRuntime() {
      if (ENVIRONMENT_IS_PTHREAD) return;
      runtimeExited = true;
    }
    function postRun() {
      if (ENVIRONMENT_IS_PTHREAD) return;
      if (Module['postRun']) {
        if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
        while (Module['postRun'].length) {
          addOnPostRun(Module['postRun'].shift());
        }
      }
      callRuntimeCallbacks(__ATPOSTRUN__);
    }
    function addOnPreRun(cb) {
      __ATPRERUN__.unshift(cb);
    }
    function addOnPostRun(cb) {
      __ATPOSTRUN__.unshift(cb);
    }
    var Math_abs = Math.abs;
    var Math_ceil = Math.ceil;
    var Math_floor = Math.floor;
    var Math_min = Math.min;
    var runDependencies = 0;
    var runDependencyWatcher = null;
    var dependenciesFulfilled = null;
    function getUniqueRunDependency(id) {
      return id;
    }
    function addRunDependency(id) {
      assert(!ENVIRONMENT_IS_PTHREAD, 'addRunDependency cannot be used in a pthread worker');
      runDependencies++;
      if (Module['monitorRunDependencies']) {
        Module['monitorRunDependencies'](runDependencies);
      }
    }
    function removeRunDependency(id) {
      runDependencies--;
      if (Module['monitorRunDependencies']) {
        Module['monitorRunDependencies'](runDependencies);
      }
      if (runDependencies == 0) {
        if (runDependencyWatcher !== null) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
        }
        if (dependenciesFulfilled) {
          var callback = dependenciesFulfilled;
          dependenciesFulfilled = null;
          callback();
        }
      }
    }
    Module['preloadedImages'] = {};
    Module['preloadedAudios'] = {};
    function abort(what) {
      if (Module['onAbort']) {
        Module['onAbort'](what);
      }
      if (ENVIRONMENT_IS_PTHREAD) console.error('Pthread aborting at ' + new Error().stack);
      what += '';
      err(what);
      ABORT = true;
      EXITSTATUS = 1;
      what = 'abort(' + what + '). Build with -s ASSERTIONS=1 for more info.';
      var e = new WebAssembly.RuntimeError(what);
      readyPromiseReject(e);
      throw e;
    }
    function hasPrefix(str, prefix) {
      return String.prototype.startsWith ? str.startsWith(prefix) : str.indexOf(prefix) === 0;
    }
    var dataURIPrefix = 'data:application/octet-stream;base64,';
    function isDataURI(filename) {
      return hasPrefix(filename, dataURIPrefix);
    }
    var wasmBinaryFile = 'vips.wasm';
    if (!isDataURI(wasmBinaryFile)) {
      wasmBinaryFile = locateFile(wasmBinaryFile);
    }
    function getBinary() {
      try {
        if (wasmBinary) {
          return new Uint8Array(wasmBinary);
        }
        if (readBinary) {
          return readBinary(wasmBinaryFile);
        } else {
          throw 'both async and sync fetching of the wasm failed';
        }
      } catch (err) {
        abort(err);
      }
    }
    function getBinaryPromise() {
      if (
        !wasmBinary &&
        (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) &&
        typeof fetch === 'function'
      ) {
        return fetch(wasmBinaryFile, { credentials: 'same-origin' })
          .then(function (response) {
            if (!response['ok']) {
              throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
            }
            return response['arrayBuffer']();
          })
          .catch(function () {
            return getBinary();
          });
      }
      return Promise.resolve().then(getBinary);
    }
    function createWasm() {
      var info = { a: asmLibraryArg };
      function receiveInstance(instance, module) {
        var exports = instance.exports;
        Module['asm'] = exports;
        wasmModule = module;
        if (!ENVIRONMENT_IS_PTHREAD) {
          var numWorkersToLoad = PThread.unusedWorkers.length;
          PThread.unusedWorkers.forEach(function (w) {
            PThread.loadWasmModuleToWorker(w, function () {
              if (!--numWorkersToLoad) removeRunDependency('wasm-instantiate');
            });
          });
        }
      }
      if (!ENVIRONMENT_IS_PTHREAD) {
        addRunDependency('wasm-instantiate');
      }
      function receiveInstantiatedSource(output) {
        receiveInstance(output['instance'], output['module']);
      }
      function instantiateArrayBuffer(receiver) {
        return getBinaryPromise()
          .then(function (binary) {
            return WebAssembly.instantiate(binary, info);
          })
          .then(receiver, function (reason) {
            err('failed to asynchronously prepare wasm: ' + reason);
            abort(reason);
          });
      }
      function instantiateAsync() {
        if (
          !wasmBinary &&
          typeof WebAssembly.instantiateStreaming === 'function' &&
          !isDataURI(wasmBinaryFile) &&
          typeof fetch === 'function'
        ) {
          fetch(wasmBinaryFile, { credentials: 'same-origin' }).then(function (response) {
            var result = WebAssembly.instantiateStreaming(response, info);
            return result.then(receiveInstantiatedSource, function (reason) {
              err('wasm streaming compile failed: ' + reason);
              err('falling back to ArrayBuffer instantiation');
              return instantiateArrayBuffer(receiveInstantiatedSource);
            });
          });
        } else {
          return instantiateArrayBuffer(receiveInstantiatedSource);
        }
      }
      if (Module['instantiateWasm']) {
        try {
          var exports = Module['instantiateWasm'](info, receiveInstance);
          return exports;
        } catch (e) {
          err('Module.instantiateWasm callback failed with error: ' + e);
          return false;
        }
      }
      instantiateAsync();
      return {};
    }
    var tempDouble;
    var tempI64;
    var ASM_CONSTS = {
      933264: function () {
        throw 'Canceled!';
      },
      933512: function ($0, $1) {
        setTimeout(function () {
          _do_emscripten_dispatch_to_thread($0, $1);
        }, 0);
      },
    };
    function ffi_call(cif, fn, rvalue, avalue) {
      var cif_abi = HEAPU32[cif >> 2];
      var cif_nargs = HEAPU32[(cif + 4) >> 2];
      var cif_arg_types = HEAPU32[(cif + 8) >> 2];
      var cif_rtype = HEAPU32[(cif + 12) >> 2];
      var args = [];
      var rtype = HEAPU16[(cif_rtype + 6) >> 1];
      var sig;
      if (rtype === 0) {
        sig = 'v';
      } else if (
        rtype === 1 ||
        rtype === 5 ||
        rtype === 6 ||
        rtype === 7 ||
        rtype === 8 ||
        rtype === 9 ||
        rtype === 10 ||
        rtype === 14
      ) {
        sig = 'i';
      } else if (rtype === 2) {
        sig = 'f';
      } else if (rtype === 3 || rtype === 4) {
        sig = 'd';
      } else if (rtype === 11 || rtype === 12) {
        sig = 'j';
      } else if (rtype === 13) {
        throw new Error('struct ret marshalling nyi');
      } else if (rtype === 15) {
        throw new Error('complex ret marshalling nyi');
      } else {
        throw new Error('Unexpected rtype ' + rtype);
      }
      for (var i = 0; i < cif_nargs; i++) {
        var ptr = HEAPU32[(avalue >> 2) + i];
        var arg_type = HEAPU32[(cif_arg_types >> 2) + i];
        var typ = HEAPU16[(arg_type + 6) >> 1];
        if (typ === 1 || typ === 10) {
          args.push(HEAP32[ptr >> 2]);
          sig += 'i';
        } else if (typ === 2) {
          args.push(HEAPF32[ptr >> 2]);
          sig += 'f';
        } else if (typ === 3 || typ === 4) {
          args.push(HEAPF64[ptr >> 3]);
          sig += 'd';
        } else if (typ === 5) {
          args.push(HEAPU8[ptr]);
          sig += 'i';
        } else if (typ === 6) {
          args.push(HEAP8[ptr]);
          sig += 'i';
        } else if (typ === 7) {
          args.push(HEAPU16[ptr >> 1]);
          sig += 'i';
        } else if (typ === 8) {
          args.push(HEAP16[ptr >> 1]);
          sig += 'i';
        } else if (typ === 9 || typ === 14) {
          args.push(HEAPU32[ptr >> 2]);
          sig += 'i';
        } else if (typ === 11 || typ === 12) {
          args.push(HEAPU32[ptr >> 2]);
          args.push(HEAPU32[(ptr + 4) >> 2]);
          sig += 'j';
        } else if (typ === 13) {
          throw new Error('struct marshalling nyi');
        } else if (typ === 15) {
          throw new Error('complex marshalling nyi');
        } else {
          throw new Error('Unexpected type ' + typ);
        }
      }
      var result = dynCall(sig, fn, args);
      if (rtype === 0) {
      } else if (rtype === 1 || rtype === 9 || rtype === 10 || rtype === 14) {
        HEAP32[rvalue >> 2] = result;
      } else if (rtype === 2) {
        HEAPF32[rvalue >> 2] = result;
      } else if (rtype === 3 || rtype === 4) {
        HEAPF64[rvalue >> 3] = result;
      } else if (rtype === 5 || rtype === 6) {
        HEAP8[rvalue] = result;
      } else if (rtype === 7 || rtype === 8) {
        HEAP16[rvalue >> 1] = result;
      } else if (rtype === 11 || rtype === 12) {
        HEAP32[rvalue >> 2] = result;
        HEAP32[(rvalue + 4) >> 2] = Module.getTempRet0();
      } else if (rtype === 13) {
        throw new Error('struct ret marshalling nyi');
      } else if (rtype === 15) {
        throw new Error('complex ret marshalling nyi');
      } else {
        throw new Error('Unexpected rtype ' + rtype);
      }
    }
    function initPthreadsJS() {
      PThread.initRuntime();
    }
    function throw_type_error_js(str) {
      throw new TypeError(UTF8ToString(str));
    }
    function throw_vips_error_js(str) {
      var e = Module.Utils.errorBuffer();
      Module.Utils.clearError();
      throw new Error(UTF8ToString(str) + '\n' + e);
    }
    if (!ENVIRONMENT_IS_PTHREAD)
      __ATINIT__.push({
        func: function () {
          ___wasm_call_ctors();
        },
      });
    function callRuntimeCallbacks(callbacks) {
      while (callbacks.length > 0) {
        var callback = callbacks.shift();
        if (typeof callback == 'function') {
          callback(Module);
          continue;
        }
        var func = callback.func;
        if (typeof func === 'number') {
          if (callback.arg === undefined) {
            wasmTable.get(func)();
          } else {
            wasmTable.get(func)(callback.arg);
          }
        } else {
          func(callback.arg === undefined ? null : callback.arg);
        }
      }
    }
    function demangle(func) {
      return func;
    }
    function demangleAll(text) {
      var regex = /\b_Z[\w\d_]+/g;
      return text.replace(regex, function (x) {
        var y = demangle(x);
        return x === y ? x : y + ' [' + x + ']';
      });
    }
    function dynCallLegacy(sig, ptr, args) {
      if (args && args.length) {
        return Module['dynCall_' + sig].apply(null, [ptr].concat(args));
      }
      return Module['dynCall_' + sig].call(null, ptr);
    }
    function dynCall(sig, ptr, args) {
      if (sig.indexOf('j') != -1) {
        return dynCallLegacy(sig, ptr, args);
      }
      return wasmTable.get(ptr).apply(null, args);
    }
    Module['dynCall'] = dynCall;
    var __pthread_ptr = 0;
    var __pthread_is_main_runtime_thread = 0;
    var __pthread_is_main_browser_thread = 0;
    function registerPthreadPtr(pthreadPtr, isMainBrowserThread, isMainRuntimeThread) {
      pthreadPtr = pthreadPtr | 0;
      isMainBrowserThread = isMainBrowserThread | 0;
      isMainRuntimeThread = isMainRuntimeThread | 0;
      __pthread_ptr = pthreadPtr;
      __pthread_is_main_browser_thread = isMainBrowserThread;
      __pthread_is_main_runtime_thread = isMainRuntimeThread;
    }
    Module['registerPthreadPtr'] = registerPthreadPtr;
    var ERRNO_CODES = {
      EPERM: 63,
      ENOENT: 44,
      ESRCH: 71,
      EINTR: 27,
      EIO: 29,
      ENXIO: 60,
      E2BIG: 1,
      ENOEXEC: 45,
      EBADF: 8,
      ECHILD: 12,
      EAGAIN: 6,
      EWOULDBLOCK: 6,
      ENOMEM: 48,
      EACCES: 2,
      EFAULT: 21,
      ENOTBLK: 105,
      EBUSY: 10,
      EEXIST: 20,
      EXDEV: 75,
      ENODEV: 43,
      ENOTDIR: 54,
      EISDIR: 31,
      EINVAL: 28,
      ENFILE: 41,
      EMFILE: 33,
      ENOTTY: 59,
      ETXTBSY: 74,
      EFBIG: 22,
      ENOSPC: 51,
      ESPIPE: 70,
      EROFS: 69,
      EMLINK: 34,
      EPIPE: 64,
      EDOM: 18,
      ERANGE: 68,
      ENOMSG: 49,
      EIDRM: 24,
      ECHRNG: 106,
      EL2NSYNC: 156,
      EL3HLT: 107,
      EL3RST: 108,
      ELNRNG: 109,
      EUNATCH: 110,
      ENOCSI: 111,
      EL2HLT: 112,
      EDEADLK: 16,
      ENOLCK: 46,
      EBADE: 113,
      EBADR: 114,
      EXFULL: 115,
      ENOANO: 104,
      EBADRQC: 103,
      EBADSLT: 102,
      EDEADLOCK: 16,
      EBFONT: 101,
      ENOSTR: 100,
      ENODATA: 116,
      ETIME: 117,
      ENOSR: 118,
      ENONET: 119,
      ENOPKG: 120,
      EREMOTE: 121,
      ENOLINK: 47,
      EADV: 122,
      ESRMNT: 123,
      ECOMM: 124,
      EPROTO: 65,
      EMULTIHOP: 36,
      EDOTDOT: 125,
      EBADMSG: 9,
      ENOTUNIQ: 126,
      EBADFD: 127,
      EREMCHG: 128,
      ELIBACC: 129,
      ELIBBAD: 130,
      ELIBSCN: 131,
      ELIBMAX: 132,
      ELIBEXEC: 133,
      ENOSYS: 52,
      ENOTEMPTY: 55,
      ENAMETOOLONG: 37,
      ELOOP: 32,
      EOPNOTSUPP: 138,
      EPFNOSUPPORT: 139,
      ECONNRESET: 15,
      ENOBUFS: 42,
      EAFNOSUPPORT: 5,
      EPROTOTYPE: 67,
      ENOTSOCK: 57,
      ENOPROTOOPT: 50,
      ESHUTDOWN: 140,
      ECONNREFUSED: 14,
      EADDRINUSE: 3,
      ECONNABORTED: 13,
      ENETUNREACH: 40,
      ENETDOWN: 38,
      ETIMEDOUT: 73,
      EHOSTDOWN: 142,
      EHOSTUNREACH: 23,
      EINPROGRESS: 26,
      EALREADY: 7,
      EDESTADDRREQ: 17,
      EMSGSIZE: 35,
      EPROTONOSUPPORT: 66,
      ESOCKTNOSUPPORT: 137,
      EADDRNOTAVAIL: 4,
      ENETRESET: 39,
      EISCONN: 30,
      ENOTCONN: 53,
      ETOOMANYREFS: 141,
      EUSERS: 136,
      EDQUOT: 19,
      ESTALE: 72,
      ENOTSUP: 138,
      ENOMEDIUM: 148,
      EILSEQ: 25,
      EOVERFLOW: 61,
      ECANCELED: 11,
      ENOTRECOVERABLE: 56,
      EOWNERDEAD: 62,
      ESTRPIPE: 135,
    };
    var __main_thread_futex_wait_address = 0;
    function _emscripten_futex_wake(addr, count) {
      if (addr <= 0 || addr > HEAP8.length || addr & (3 != 0) || count < 0) return -28;
      if (count == 0) return 0;
      if (count >= 2147483647) count = Infinity;
      var mainThreadWaitAddress = Atomics.load(HEAP32, __main_thread_futex_wait_address >> 2);
      var mainThreadWoken = 0;
      if (mainThreadWaitAddress == addr) {
        var loadedAddr = Atomics.compareExchange(
          HEAP32,
          __main_thread_futex_wait_address >> 2,
          mainThreadWaitAddress,
          0,
        );
        if (loadedAddr == mainThreadWaitAddress) {
          --count;
          mainThreadWoken = 1;
          if (count <= 0) return 1;
        }
      }
      var ret = Atomics.notify(HEAP32, addr >> 2, count);
      if (ret >= 0) return ret + mainThreadWoken;
      throw 'Atomics.notify returned an unexpected value ' + ret;
    }
    Module['_emscripten_futex_wake'] = _emscripten_futex_wake;
    function killThread(pthread_ptr) {
      if (ENVIRONMENT_IS_PTHREAD)
        throw 'Internal Error! killThread() can only ever be called from main application thread!';
      if (!pthread_ptr) throw 'Internal Error! Null pthread_ptr in killThread!';
      HEAP32[(pthread_ptr + 12) >> 2] = 0;
      var pthread = PThread.pthreads[pthread_ptr];
      pthread.worker.terminate();
      PThread.freeThreadData(pthread);
      PThread.runningWorkers.splice(PThread.runningWorkers.indexOf(pthread.worker), 1);
      pthread.worker.pthread = undefined;
    }
    function cancelThread(pthread_ptr) {
      if (ENVIRONMENT_IS_PTHREAD)
        throw 'Internal Error! cancelThread() can only ever be called from main application thread!';
      if (!pthread_ptr) throw 'Internal Error! Null pthread_ptr in cancelThread!';
      var pthread = PThread.pthreads[pthread_ptr];
      pthread.worker.postMessage({ cmd: 'cancel' });
    }
    function cleanupThread(pthread_ptr) {
      if (ENVIRONMENT_IS_PTHREAD)
        throw 'Internal Error! cleanupThread() can only ever be called from main application thread!';
      if (!pthread_ptr) throw 'Internal Error! Null pthread_ptr in cleanupThread!';
      HEAP32[(pthread_ptr + 12) >> 2] = 0;
      var pthread = PThread.pthreads[pthread_ptr];
      if (pthread) {
        var worker = pthread.worker;
        PThread.returnWorkerToPool(worker);
      }
    }
    var PThread = {
      MAIN_THREAD_ID: 1,
      mainThreadInfo: { schedPolicy: 0, schedPrio: 0 },
      unusedWorkers: [],
      runningWorkers: [],
      initMainThreadBlock: function () {
        var pthreadPoolSize = _emscripten_num_logical_cores() + 3;
        for (var i = 0; i < pthreadPoolSize; ++i) {
          PThread.allocateUnusedWorker();
        }
      },
      initRuntime: function () {
        PThread.mainThreadBlock = _malloc(232);
        for (var i = 0; i < 232 / 4; ++i) HEAPU32[PThread.mainThreadBlock / 4 + i] = 0;
        HEAP32[(PThread.mainThreadBlock + 12) >> 2] = PThread.mainThreadBlock;
        var headPtr = PThread.mainThreadBlock + 156;
        HEAP32[headPtr >> 2] = headPtr;
        var tlsMemory = _malloc(512);
        for (var i = 0; i < 128; ++i) HEAPU32[tlsMemory / 4 + i] = 0;
        Atomics.store(HEAPU32, (PThread.mainThreadBlock + 104) >> 2, tlsMemory);
        Atomics.store(HEAPU32, (PThread.mainThreadBlock + 40) >> 2, PThread.mainThreadBlock);
        Atomics.store(HEAPU32, (PThread.mainThreadBlock + 44) >> 2, 42);
        __main_thread_futex_wait_address = _malloc(4);
        registerPthreadPtr(PThread.mainThreadBlock, !ENVIRONMENT_IS_WORKER, 1);
        _emscripten_register_main_browser_thread_id(PThread.mainThreadBlock);
      },
      initWorker: function () {},
      pthreads: {},
      threadExitHandlers: [],
      setThreadStatus: function () {},
      runExitHandlers: function () {
        while (PThread.threadExitHandlers.length > 0) {
          PThread.threadExitHandlers.pop()();
        }
        if (ENVIRONMENT_IS_PTHREAD && threadInfoStruct) ___pthread_tsd_run_dtors();
      },
      onThreadExit: function (tb, exitCode) {
        Atomics.store(HEAPU32, (tb + 60) >> 2, 1);
        Atomics.store(HEAPU32, (tb + 64) >> 2, 0);
        PThread.runExitHandlers();
        Atomics.store(HEAPU32, (tb + 4) >> 2, exitCode);
        Atomics.store(HEAPU32, (tb + 0) >> 2, 1);
        _emscripten_futex_wake(tb + 0, 2147483647);
        registerPthreadPtr(0, 0, 0);
        threadInfoStruct = 0;
      },
      threadExit: function (exitCode) {
        var tb = _pthread_self();
        if (tb) {
          PThread.onThreadExit(tb, exitCode);
          if (ENVIRONMENT_IS_PTHREAD) {
            postMessage({ cmd: 'exit' });
          }
        }
      },
      threadCancel: function () {
        PThread.onThreadExit(threadInfoStruct, -1);
        selfThreadId = 0;
        postMessage({ cmd: 'cancelDone' });
      },
      terminateAllThreads: function () {
        for (var t in PThread.pthreads) {
          var pthread = PThread.pthreads[t];
          if (pthread && pthread.worker) {
            PThread.returnWorkerToPool(pthread.worker);
          }
        }
        PThread.pthreads = {};
        for (var i = 0; i < PThread.unusedWorkers.length; ++i) {
          var worker = PThread.unusedWorkers[i];
          worker.terminate();
        }
        PThread.unusedWorkers = [];
        for (var i = 0; i < PThread.runningWorkers.length; ++i) {
          var worker = PThread.runningWorkers[i];
          var pthread = worker.pthread;
          PThread.freeThreadData(pthread);
          worker.terminate();
        }
        PThread.runningWorkers = [];
      },
      freeThreadData: function (pthread) {
        if (!pthread) return;
        if (pthread.threadInfoStruct) {
          var tlsMemory = HEAP32[(pthread.threadInfoStruct + 104) >> 2];
          HEAP32[(pthread.threadInfoStruct + 104) >> 2] = 0;
          _free(tlsMemory);
          _free(pthread.threadInfoStruct);
        }
        pthread.threadInfoStruct = 0;
        if (pthread.allocatedOwnStack && pthread.stackBase) _free(pthread.stackBase);
        pthread.stackBase = 0;
        if (pthread.worker) pthread.worker.pthread = null;
      },
      returnWorkerToPool: function (worker) {
        delete PThread.pthreads[worker.pthread.thread];
        PThread.unusedWorkers.push(worker);
        PThread.runningWorkers.splice(PThread.runningWorkers.indexOf(worker), 1);
        PThread.freeThreadData(worker.pthread);
        worker.pthread = undefined;
      },
      receiveObjectTransfer: function (data) {},
      loadWasmModuleToWorker: function (worker, onFinishedLoading) {
        worker.onmessage = function (e) {
          var d = e['data'];
          var cmd = d['cmd'];
          if (worker.pthread)
            PThread.currentProxiedOperationCallerThread = worker.pthread.threadInfoStruct;
          if (d['targetThread'] && d['targetThread'] != _pthread_self()) {
            var thread = PThread.pthreads[d.targetThread];
            if (thread) {
              thread.worker.postMessage(e.data, d['transferList']);
            } else {
              console.error(
                'Internal error! Worker sent a message "' +
                  cmd +
                  '" to target pthread ' +
                  d['targetThread'] +
                  ', but that thread no longer exists!',
              );
            }
            PThread.currentProxiedOperationCallerThread = undefined;
            return;
          }
          if (cmd === 'processQueuedMainThreadWork') {
            _emscripten_main_thread_process_queued_calls();
          } else if (cmd === 'spawnThread') {
            spawnThread(e.data);
          } else if (cmd === 'cleanupThread') {
            cleanupThread(d['thread']);
          } else if (cmd === 'killThread') {
            killThread(d['thread']);
          } else if (cmd === 'cancelThread') {
            cancelThread(d['thread']);
          } else if (cmd === 'loaded') {
            worker.loaded = true;
            if (onFinishedLoading) onFinishedLoading(worker);
            if (worker.runPthread) {
              worker.runPthread();
              delete worker.runPthread;
            }
          } else if (cmd === 'print') {
            out('Thread ' + d['threadId'] + ': ' + d['text']);
          } else if (cmd === 'printErr') {
            err('Thread ' + d['threadId'] + ': ' + d['text']);
          } else if (cmd === 'alert') {
            alert('Thread ' + d['threadId'] + ': ' + d['text']);
          } else if (cmd === 'exit') {
            var detached =
              worker.pthread && Atomics.load(HEAPU32, (worker.pthread.thread + 68) >> 2);
            if (detached) {
              PThread.returnWorkerToPool(worker);
            }
          } else if (cmd === 'cancelDone') {
            PThread.returnWorkerToPool(worker);
          } else if (cmd === 'objectTransfer') {
            PThread.receiveObjectTransfer(e.data);
          } else if (e.data.target === 'setimmediate') {
            worker.postMessage(e.data);
          } else {
            err('worker sent an unknown command ' + cmd);
          }
          PThread.currentProxiedOperationCallerThread = undefined;
        };
        worker.onerror = function (e) {
          err('pthread sent an error! ' + e.filename + ':' + e.lineno + ': ' + e.message);
        };
        if (ENVIRONMENT_IS_NODE) {
          worker.on('message', function (data) {
            worker.onmessage({ data: data });
          });
          worker.on('error', function (data) {
            worker.onerror(data);
          });
          worker.on('exit', function (data) {});
        }
        worker.postMessage({
          cmd: 'load',
          urlOrBlob: Module['mainScriptUrlOrBlob'] || _scriptDir,
          wasmMemory: wasmMemory,
          wasmModule: wasmModule,
          DYNAMIC_BASE: DYNAMIC_BASE,
          DYNAMICTOP_PTR: DYNAMICTOP_PTR,
        });
      },
      allocateUnusedWorker: function () {
        var pthreadMainJs = locateFile('vips.worker.js');
        PThread.unusedWorkers.push(new Worker(pthreadMainJs));
      },
      getNewWorker: function () {
        if (PThread.unusedWorkers.length == 0) {
          PThread.allocateUnusedWorker();
          PThread.loadWasmModuleToWorker(PThread.unusedWorkers[0]);
        }
        if (PThread.unusedWorkers.length > 0) return PThread.unusedWorkers.pop();
        else return null;
      },
      busySpinWait: function (msecs) {
        var t = performance.now() + msecs;
        while (performance.now() < t) {}
      },
    };
    function establishStackSpace(stackTop, stackMax) {
      STACK_BASE = STACKTOP = stackTop;
      STACK_MAX = stackMax;
      stackRestore(stackTop);
    }
    Module['establishStackSpace'] = establishStackSpace;
    function getNoExitRuntime() {
      return noExitRuntime;
    }
    Module['getNoExitRuntime'] = getNoExitRuntime;
    function jsStackTrace() {
      var error = new Error();
      if (!error.stack) {
        try {
          throw new Error();
        } catch (e) {
          error = e;
        }
        if (!error.stack) {
          return '(no stack trace available)';
        }
      }
      return error.stack.toString();
    }
    function stackTrace() {
      var js = jsStackTrace();
      if (Module['extraStackTrace']) js += '\n' + Module['extraStackTrace']();
      return demangleAll(js);
    }
    function _tzset() {
      if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(1, 1);
      if (_tzset.called) return;
      _tzset.called = true;
      HEAP32[__get_timezone() >> 2] = new Date().getTimezoneOffset() * 60;
      var currentYear = new Date().getFullYear();
      var winter = new Date(currentYear, 0, 1);
      var summer = new Date(currentYear, 6, 1);
      HEAP32[__get_daylight() >> 2] = Number(
        winter.getTimezoneOffset() != summer.getTimezoneOffset(),
      );
      function extractZone(date) {
        var match = date.toTimeString().match(/\(([A-Za-z ]+)\)$/);
        return match ? match[1] : 'GMT';
      }
      var winterName = extractZone(winter);
      var summerName = extractZone(summer);
      var winterNamePtr = allocateUTF8(winterName);
      var summerNamePtr = allocateUTF8(summerName);
      if (summer.getTimezoneOffset() < winter.getTimezoneOffset()) {
        HEAP32[__get_tzname() >> 2] = winterNamePtr;
        HEAP32[(__get_tzname() + 4) >> 2] = summerNamePtr;
      } else {
        HEAP32[__get_tzname() >> 2] = summerNamePtr;
        HEAP32[(__get_tzname() + 4) >> 2] = winterNamePtr;
      }
    }
    function _asctime_r(tmPtr, buf) {
      var date = {
        tm_sec: HEAP32[tmPtr >> 2],
        tm_min: HEAP32[(tmPtr + 4) >> 2],
        tm_hour: HEAP32[(tmPtr + 8) >> 2],
        tm_mday: HEAP32[(tmPtr + 12) >> 2],
        tm_mon: HEAP32[(tmPtr + 16) >> 2],
        tm_year: HEAP32[(tmPtr + 20) >> 2],
        tm_wday: HEAP32[(tmPtr + 24) >> 2],
      };
      var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      var months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      var s =
        days[date.tm_wday] +
        ' ' +
        months[date.tm_mon] +
        (date.tm_mday < 10 ? '  ' : ' ') +
        date.tm_mday +
        (date.tm_hour < 10 ? ' 0' : ' ') +
        date.tm_hour +
        (date.tm_min < 10 ? ':0' : ':') +
        date.tm_min +
        (date.tm_sec < 10 ? ':0' : ':') +
        date.tm_sec +
        ' ' +
        (1900 + date.tm_year) +
        '\n';
      stringToUTF8(s, buf, 26);
      return buf;
    }
    function ___asctime_r(a0, a1) {
      return _asctime_r(a0, a1);
    }
    function ___assert_fail(condition, filename, line, func) {
      abort(
        'Assertion failed: ' +
          UTF8ToString(condition) +
          ', at: ' +
          [
            filename ? UTF8ToString(filename) : 'unknown filename',
            line,
            func ? UTF8ToString(func) : 'unknown function',
          ],
      );
    }
    var _emscripten_get_now;
    if (ENVIRONMENT_IS_NODE) {
      _emscripten_get_now = function () {
        var t = process['hrtime']();
        return t[0] * 1e3 + t[1] / 1e6;
      };
    } else if (ENVIRONMENT_IS_PTHREAD) {
      _emscripten_get_now = function () {
        return performance.now() - Module['__performance_now_clock_drift'];
      };
    } else
      _emscripten_get_now = function () {
        return performance.now();
      };
    var _emscripten_get_now_is_monotonic = true;
    function setErrNo(value) {
      HEAP32[___errno_location() >> 2] = value;
      return value;
    }
    function _clock_gettime(clk_id, tp) {
      var now;
      if (clk_id === 0) {
        now = Date.now();
      } else if ((clk_id === 1 || clk_id === 4) && _emscripten_get_now_is_monotonic) {
        now = _emscripten_get_now();
      } else {
        setErrNo(28);
        return -1;
      }
      HEAP32[tp >> 2] = (now / 1e3) | 0;
      HEAP32[(tp + 4) >> 2] = ((now % 1e3) * 1e3 * 1e3) | 0;
      return 0;
    }
    function ___clock_gettime(a0, a1) {
      return _clock_gettime(a0, a1);
    }
    function _gmtime_r(time, tmPtr) {
      var date = new Date(HEAP32[time >> 2] * 1e3);
      HEAP32[tmPtr >> 2] = date.getUTCSeconds();
      HEAP32[(tmPtr + 4) >> 2] = date.getUTCMinutes();
      HEAP32[(tmPtr + 8) >> 2] = date.getUTCHours();
      HEAP32[(tmPtr + 12) >> 2] = date.getUTCDate();
      HEAP32[(tmPtr + 16) >> 2] = date.getUTCMonth();
      HEAP32[(tmPtr + 20) >> 2] = date.getUTCFullYear() - 1900;
      HEAP32[(tmPtr + 24) >> 2] = date.getUTCDay();
      HEAP32[(tmPtr + 36) >> 2] = 0;
      HEAP32[(tmPtr + 32) >> 2] = 0;
      var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
      var yday = ((date.getTime() - start) / (1e3 * 60 * 60 * 24)) | 0;
      HEAP32[(tmPtr + 28) >> 2] = yday;
      if (!_gmtime_r.GMTString) _gmtime_r.GMTString = allocateUTF8('GMT');
      HEAP32[(tmPtr + 40) >> 2] = _gmtime_r.GMTString;
      return tmPtr;
    }
    function ___gmtime_r(a0, a1) {
      return _gmtime_r(a0, a1);
    }
    function _localtime_r(time, tmPtr) {
      _tzset();
      var date = new Date(HEAP32[time >> 2] * 1e3);
      HEAP32[tmPtr >> 2] = date.getSeconds();
      HEAP32[(tmPtr + 4) >> 2] = date.getMinutes();
      HEAP32[(tmPtr + 8) >> 2] = date.getHours();
      HEAP32[(tmPtr + 12) >> 2] = date.getDate();
      HEAP32[(tmPtr + 16) >> 2] = date.getMonth();
      HEAP32[(tmPtr + 20) >> 2] = date.getFullYear() - 1900;
      HEAP32[(tmPtr + 24) >> 2] = date.getDay();
      var start = new Date(date.getFullYear(), 0, 1);
      var yday = ((date.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24)) | 0;
      HEAP32[(tmPtr + 28) >> 2] = yday;
      HEAP32[(tmPtr + 36) >> 2] = -(date.getTimezoneOffset() * 60);
      var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
      var winterOffset = start.getTimezoneOffset();
      var dst =
        (summerOffset != winterOffset &&
          date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
      HEAP32[(tmPtr + 32) >> 2] = dst;
      var zonePtr = HEAP32[(__get_tzname() + (dst ? 4 : 0)) >> 2];
      HEAP32[(tmPtr + 40) >> 2] = zonePtr;
      return tmPtr;
    }
    function ___localtime_r(a0, a1) {
      return _localtime_r(a0, a1);
    }
    function ___map_file(pathname, size) {
      setErrNo(63);
      return -1;
    }
    var PATH = {
      splitPath: function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },
      normalizeArray: function (parts, allowAboveRoot) {
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        if (allowAboveRoot) {
          for (; up; up--) {
            parts.unshift('..');
          }
        }
        return parts;
      },
      normalize: function (path) {
        var isAbsolute = path.charAt(0) === '/',
          trailingSlash = path.substr(-1) === '/';
        path = PATH.normalizeArray(
          path.split('/').filter(function (p) {
            return !!p;
          }),
          !isAbsolute,
        ).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },
      dirname: function (path) {
        var result = PATH.splitPath(path),
          root = result[0],
          dir = result[1];
        if (!root && !dir) {
          return '.';
        }
        if (dir) {
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },
      basename: function (path) {
        if (path === '/') return '/';
        path = PATH.normalize(path);
        path = path.replace(/\/$/, '');
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash + 1);
      },
      extname: function (path) {
        return PATH.splitPath(path)[3];
      },
      join: function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },
      join2: function (l, r) {
        return PATH.normalize(l + '/' + r);
      },
    };
    var PATH_FS = {
      resolve: function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = i >= 0 ? arguments[i] : FS.cwd();
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            return '';
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        resolvedPath = PATH.normalizeArray(
          resolvedPath.split('/').filter(function (p) {
            return !!p;
          }),
          !resolvedAbsolute,
        ).join('/');
        return (resolvedAbsolute ? '/' : '') + resolvedPath || '.';
      },
      relative: function (from, to) {
        from = PATH_FS.resolve(from).substr(1);
        to = PATH_FS.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      },
    };
    var TTY = {
      ttys: [],
      init: function () {},
      shutdown: function () {},
      register: function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },
      stream_ops: {
        open: function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(43);
          }
          stream.tty = tty;
          stream.seekable = false;
        },
        close: function (stream) {
          stream.tty.ops.flush(stream.tty);
        },
        flush: function (stream) {
          stream.tty.ops.flush(stream.tty);
        },
        read: function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(60);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(29);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(6);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset + i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },
        write: function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(60);
          }
          try {
            for (var i = 0; i < length; i++) {
              stream.tty.ops.put_char(stream.tty, buffer[offset + i]);
            }
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        },
      },
      default_tty_ops: {
        get_char: function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              var BUFSIZE = 256;
              var buf = Buffer.alloc ? Buffer.alloc(BUFSIZE) : new Buffer(BUFSIZE);
              var bytesRead = 0;
              try {
                bytesRead = nodeFS.readSync(process.stdin.fd, buf, 0, BUFSIZE, null);
              } catch (e) {
                if (e.toString().indexOf('EOF') != -1) bytesRead = 0;
                else throw e;
              }
              if (bytesRead > 0) {
                result = buf.slice(0, bytesRead).toString('utf-8');
              } else {
                result = null;
              }
            } else if (typeof window != 'undefined' && typeof window.prompt == 'function') {
              result = window.prompt('Input: ');
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },
        put_char: function (tty, val) {
          if (val === null || val === 10) {
            out(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val);
          }
        },
        flush: function (tty) {
          if (tty.output && tty.output.length > 0) {
            out(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        },
      },
      default_tty1_ops: {
        put_char: function (tty, val) {
          if (val === null || val === 10) {
            err(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val);
          }
        },
        flush: function (tty) {
          if (tty.output && tty.output.length > 0) {
            err(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        },
      },
    };
    var MEMFS = {
      ops_table: null,
      mount: function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 511, 0);
      },
      createNode: function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          throw new FS.ErrnoError(63);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink,
              },
              stream: { llseek: MEMFS.stream_ops.llseek },
            },
            file: {
              node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap,
                msync: MEMFS.stream_ops.msync,
              },
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink,
              },
              stream: {},
            },
            chrdev: {
              node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr },
              stream: FS.chrdev_stream_ops,
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.usedBytes = 0;
          node.contents = null;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },
      getFileDataAsRegularArray: function (node) {
        if (node.contents && node.contents.subarray) {
          var arr = [];
          for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
          return arr;
        }
        return node.contents;
      },
      getFileDataAsTypedArray: function (node) {
        if (!node.contents) return new Uint8Array(0);
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes);
        return new Uint8Array(node.contents);
      },
      expandFileStorage: function (node, newCapacity) {
        var prevCapacity = node.contents ? node.contents.length : 0;
        if (prevCapacity >= newCapacity) return;
        var CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(
          newCapacity,
          (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125)) >>> 0,
        );
        if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
        var oldContents = node.contents;
        node.contents = new Uint8Array(newCapacity);
        if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
        return;
      },
      resizeFileStorage: function (node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
          node.contents = null;
          node.usedBytes = 0;
          return;
        }
        if (!node.contents || node.contents.subarray) {
          var oldContents = node.contents;
          node.contents = new Uint8Array(newSize);
          if (oldContents) {
            node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)));
          }
          node.usedBytes = newSize;
          return;
        }
        if (!node.contents) node.contents = [];
        if (node.contents.length > newSize) node.contents.length = newSize;
        else while (node.contents.length < newSize) node.contents.push(0);
        node.usedBytes = newSize;
      },
      node_ops: {
        getattr: function (node) {
          var attr = {};
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.usedBytes;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },
        setattr: function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.resizeFileStorage(node, attr.size);
          }
        },
        lookup: function (parent, name) {
          throw FS.genericErrors[44];
        },
        mknod: function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },
        rename: function (old_node, new_dir, new_name) {
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {}
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(55);
              }
            }
          }
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },
        unlink: function (parent, name) {
          delete parent.contents[name];
        },
        rmdir: function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(55);
          }
          delete parent.contents[name];
        },
        readdir: function (node) {
          var entries = ['.', '..'];
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },
        symlink: function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
          node.link = oldpath;
          return node;
        },
        readlink: function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(28);
          }
          return node.link;
        },
      },
      stream_ops: {
        read: function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= stream.node.usedBytes) return 0;
          var size = Math.min(stream.node.usedBytes - position, length);
          if (size > 8 && contents.subarray) {
            buffer.set(contents.subarray(position, position + size), offset);
          } else {
            for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
          }
          return size;
        },
        write: function (stream, buffer, offset, length, position, canOwn) {
          if (!length) return 0;
          var node = stream.node;
          node.timestamp = Date.now();
          if (buffer.subarray && (!node.contents || node.contents.subarray)) {
            if (canOwn) {
              node.contents = buffer.subarray(offset, offset + length);
              node.usedBytes = length;
              return length;
            } else if (node.usedBytes === 0 && position === 0) {
              node.contents = buffer.slice(offset, offset + length);
              node.usedBytes = length;
              return length;
            } else if (position + length <= node.usedBytes) {
              node.contents.set(buffer.subarray(offset, offset + length), position);
              return length;
            }
          }
          MEMFS.expandFileStorage(node, position + length);
          if (node.contents.subarray && buffer.subarray) {
            node.contents.set(buffer.subarray(offset, offset + length), position);
          } else {
            for (var i = 0; i < length; i++) {
              node.contents[position + i] = buffer[offset + i];
            }
          }
          node.usedBytes = Math.max(node.usedBytes, position + length);
          return length;
        },
        llseek: function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {
            position += stream.position;
          } else if (whence === 2) {
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.usedBytes;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(28);
          }
          return position;
        },
        allocate: function (stream, offset, length) {
          MEMFS.expandFileStorage(stream.node, offset + length);
          stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
        },
        mmap: function (stream, address, length, position, prot, flags) {
          assert(address === 0);
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(43);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          if (!(flags & 2) && contents.buffer === buffer) {
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = FS.mmapAlloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(48);
            }
            HEAP8.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        },
        msync: function (stream, buffer, offset, length, mmapFlags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(43);
          }
          if (mmapFlags & 2) {
            return 0;
          }
          var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
          return 0;
        },
      },
    };
    var NODEFS = {
      isWindows: false,
      staticInit: function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
        var flags = process['binding']('constants');
        if (flags['fs']) {
          flags = flags['fs'];
        }
        NODEFS.flagsForNodeMap = {
          1024: flags['O_APPEND'],
          64: flags['O_CREAT'],
          128: flags['O_EXCL'],
          0: flags['O_RDONLY'],
          2: flags['O_RDWR'],
          4096: flags['O_SYNC'],
          512: flags['O_TRUNC'],
          1: flags['O_WRONLY'],
        };
      },
      bufferFrom: function (arrayBuffer) {
        return Buffer['alloc'] ? Buffer.from(arrayBuffer) : new Buffer(arrayBuffer);
      },
      convertNodeCode: function (e) {
        var code = e.code;
        return ERRNO_CODES[code];
      },
      mount: function (mount) {
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },
      createNode: function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(28);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },
      getMode: function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            stat.mode = stat.mode | ((stat.mode & 292) >> 2);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
        }
        return stat.mode;
      },
      realPath: function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },
      flagsForNode: function (flags) {
        flags &= ~2097152;
        flags &= ~2048;
        flags &= ~32768;
        flags &= ~524288;
        var newFlags = 0;
        for (var k in NODEFS.flagsForNodeMap) {
          if (flags & k) {
            newFlags |= NODEFS.flagsForNodeMap[k];
            flags ^= k;
          }
        }
        if (!flags) {
          return newFlags;
        } else {
          throw new FS.ErrnoError(28);
        }
      },
      node_ops: {
        getattr: function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
          }
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = ((stat.size + stat.blksize - 1) / stat.blksize) | 0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks,
          };
        },
        setattr: function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
          }
        },
        lookup: function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },
        mknod: function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
          }
          return node;
        },
        rename: function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
          }
          oldNode.name = newName;
        },
        unlink: function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
          }
        },
        rmdir: function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
          }
        },
        readdir: function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
          }
        },
        symlink: function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
          }
        },
        readlink: function (node) {
          var path = NODEFS.realPath(node);
          try {
            path = fs.readlinkSync(path);
            path = NODEJS_PATH.relative(NODEJS_PATH.resolve(node.mount.opts.root), path);
            return path;
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
          }
        },
      },
      stream_ops: {
        open: function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsForNode(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
          }
        },
        close: function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
          }
        },
        read: function (stream, buffer, offset, length, position) {
          if (length === 0) return 0;
          try {
            return fs.readSync(
              stream.nfd,
              NODEFS.bufferFrom(buffer.buffer),
              offset,
              length,
              position,
            );
          } catch (e) {
            throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
          }
        },
        write: function (stream, buffer, offset, length, position) {
          try {
            return fs.writeSync(
              stream.nfd,
              NODEFS.bufferFrom(buffer.buffer),
              offset,
              length,
              position,
            );
          } catch (e) {
            throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
          }
        },
        llseek: function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {
            position += stream.position;
          } else if (whence === 2) {
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
              }
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(28);
          }
          return position;
        },
        mmap: function (stream, address, length, position, prot, flags) {
          assert(address === 0);
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(43);
          }
          var ptr = FS.mmapAlloc(length);
          NODEFS.stream_ops.read(stream, HEAP8, ptr, length, position);
          return { ptr: ptr, allocated: true };
        },
        msync: function (stream, buffer, offset, length, mmapFlags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(43);
          }
          if (mmapFlags & 2) {
            return 0;
          }
          var bytesWritten = NODEFS.stream_ops.write(stream, buffer, 0, length, offset, false);
          return 0;
        },
      },
    };
    var NODERAWFS = {
      lookupPath: function (path) {
        return { path: path, node: { mode: NODEFS.getMode(path) } };
      },
      createStandardStreams: function () {
        FS.streams[0] = {
          fd: 0,
          nfd: 0,
          position: 0,
          path: '',
          flags: 0,
          tty: true,
          seekable: false,
        };
        for (var i = 1; i < 3; i++) {
          FS.streams[i] = {
            fd: i,
            nfd: i,
            position: 0,
            path: '',
            flags: 577,
            tty: true,
            seekable: false,
          };
        }
      },
      cwd: function () {
        return process.cwd();
      },
      chdir: function () {
        process.chdir.apply(void 0, arguments);
      },
      mknod: function (path, mode) {
        if (FS.isDir(path)) {
          fs.mkdirSync(path, mode);
        } else {
          fs.writeFileSync(path, '', { mode: mode });
        }
      },
      mkdir: function () {
        fs.mkdirSync.apply(void 0, arguments);
      },
      symlink: function () {
        fs.symlinkSync.apply(void 0, arguments);
      },
      rename: function () {
        fs.renameSync.apply(void 0, arguments);
      },
      rmdir: function () {
        fs.rmdirSync.apply(void 0, arguments);
      },
      readdir: function () {
        fs.readdirSync.apply(void 0, arguments);
      },
      unlink: function () {
        fs.unlinkSync.apply(void 0, arguments);
      },
      readlink: function () {
        return fs.readlinkSync.apply(void 0, arguments);
      },
      stat: function () {
        return fs.statSync.apply(void 0, arguments);
      },
      lstat: function () {
        return fs.lstatSync.apply(void 0, arguments);
      },
      chmod: function () {
        fs.chmodSync.apply(void 0, arguments);
      },
      fchmod: function () {
        fs.fchmodSync.apply(void 0, arguments);
      },
      chown: function () {
        fs.chownSync.apply(void 0, arguments);
      },
      fchown: function () {
        fs.fchownSync.apply(void 0, arguments);
      },
      truncate: function () {
        fs.truncateSync.apply(void 0, arguments);
      },
      ftruncate: function () {
        fs.ftruncateSync.apply(void 0, arguments);
      },
      utime: function () {
        fs.utimesSync.apply(void 0, arguments);
      },
      open: function (path, flags, mode, suggestFD) {
        if (typeof flags === 'string') {
          flags = VFS.modeStringToFlags(flags);
        }
        var nfd = fs.openSync(path, NODEFS.flagsForNode(flags), mode);
        var fd = suggestFD != null ? suggestFD : FS.nextfd(nfd);
        var stream = { fd: fd, nfd: nfd, position: 0, path: path, flags: flags, seekable: true };
        FS.streams[fd] = stream;
        return stream;
      },
      close: function (stream) {
        if (!stream.stream_ops) {
          fs.closeSync(stream.nfd);
        }
        FS.closeStream(stream.fd);
      },
      llseek: function (stream, offset, whence) {
        if (stream.stream_ops) {
          return VFS.llseek(stream, offset, whence);
        }
        var position = offset;
        if (whence === 1) {
          position += stream.position;
        } else if (whence === 2) {
          position += fs.fstatSync(stream.nfd).size;
        } else if (whence !== 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if (position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        stream.position = position;
        return position;
      },
      read: function (stream, buffer, offset, length, position) {
        if (stream.stream_ops) {
          return VFS.read(stream, buffer, offset, length, position);
        }
        var seeking = typeof position !== 'undefined';
        if (!seeking && stream.seekable) position = stream.position;
        var bytesRead = fs.readSync(
          stream.nfd,
          NODEFS.bufferFrom(buffer.buffer),
          offset,
          length,
          position,
        );
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },
      write: function (stream, buffer, offset, length, position) {
        if (stream.stream_ops) {
          return VFS.write(stream, buffer, offset, length, position);
        }
        if (stream.flags & +'1024') {
          FS.llseek(stream, 0, +'2');
        }
        var seeking = typeof position !== 'undefined';
        if (!seeking && stream.seekable) position = stream.position;
        var bytesWritten = fs.writeSync(
          stream.nfd,
          NODEFS.bufferFrom(buffer.buffer),
          offset,
          length,
          position,
        );
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },
      allocate: function () {
        throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
      },
      mmap: function (stream, address, length, position, prot, flags) {
        if (stream.stream_ops) {
          return VFS.mmap(stream, address, length, position, prot, flags);
        }
        assert(address === 0);
        var ptr = VFS.mmapAlloc(length);
        FS.read(stream, HEAP8, ptr, length, position);
        return { ptr: ptr, allocated: true };
      },
      msync: function (stream, buffer, offset, length, mmapFlags) {
        if (stream.stream_ops) {
          return VFS.msync(stream, buffer, offset, length, mmapFlags);
        }
        if (mmapFlags & 2) {
          return 0;
        }
        FS.write(stream, buffer, 0, length, offset);
        return 0;
      },
      munmap: function () {
        return 0;
      },
      ioctl: function () {
        throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
      },
    };
    var FS = {
      root: null,
      mounts: [],
      devices: {},
      streams: [],
      nextInode: 1,
      nameTable: null,
      currentPath: '/',
      initialized: false,
      ignorePermissions: true,
      trackingDelegate: {},
      tracking: { openFlags: { READ: 1, WRITE: 2 } },
      ErrnoError: null,
      genericErrors: {},
      filesystems: null,
      syncFSRequests: 0,
      handleFSError: function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return setErrNo(e.errno);
      },
      lookupPath: function (path, opts) {
        path = PATH_FS.resolve(FS.cwd(), path);
        opts = opts || {};
        if (!path) return { path: '', node: null };
        var defaults = { follow_mount: true, recurse_count: 0 };
        for (var key in defaults) {
          if (opts[key] === undefined) {
            opts[key] = defaults[key];
          }
        }
        if (opts.recurse_count > 8) {
          throw new FS.ErrnoError(32);
        }
        var parts = PATH.normalizeArray(
          path.split('/').filter(function (p) {
            return !!p;
          }),
          false,
        );
        var current = FS.root;
        var current_path = '/';
        for (var i = 0; i < parts.length; i++) {
          var islast = i === parts.length - 1;
          if (islast && opts.parent) {
            break;
          }
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
          if (FS.isMountpoint(current)) {
            if (!islast || (islast && opts.follow_mount)) {
              current = current.mounted.root;
            }
          }
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
              if (count++ > 40) {
                throw new FS.ErrnoError(32);
              }
            }
          }
        }
        return { path: current_path, node: current };
      },
      getPath: function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length - 1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },
      hashName: function (parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },
      hashAddNode: function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },
      hashRemoveNode: function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },
      lookupNode: function (parent, name) {
        var errCode = FS.mayLookup(parent);
        if (errCode) {
          throw new FS.ErrnoError(errCode, parent);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        return FS.lookup(parent, name);
      },
      createNode: function (parent, name, mode, rdev) {
        var node = new FS.FSNode(parent, name, mode, rdev);
        FS.hashAddNode(node);
        return node;
      },
      destroyNode: function (node) {
        FS.hashRemoveNode(node);
      },
      isRoot: function (node) {
        return node === node.parent;
      },
      isMountpoint: function (node) {
        return !!node.mounted;
      },
      isFile: function (mode) {
        return (mode & 61440) === 32768;
      },
      isDir: function (mode) {
        return (mode & 61440) === 16384;
      },
      isLink: function (mode) {
        return (mode & 61440) === 40960;
      },
      isChrdev: function (mode) {
        return (mode & 61440) === 8192;
      },
      isBlkdev: function (mode) {
        return (mode & 61440) === 24576;
      },
      isFIFO: function (mode) {
        return (mode & 61440) === 4096;
      },
      isSocket: function (mode) {
        return (mode & 49152) === 49152;
      },
      flagModes: {
        r: 0,
        rs: 1052672,
        'r+': 2,
        w: 577,
        wx: 705,
        xw: 705,
        'w+': 578,
        'wx+': 706,
        'xw+': 706,
        a: 1089,
        ax: 1217,
        xa: 1217,
        'a+': 1090,
        'ax+': 1218,
        'xa+': 1218,
      },
      modeStringToFlags: function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },
      flagsToPermissionString: function (flag) {
        var perms = ['r', 'w', 'rw'][flag & 3];
        if (flag & 512) {
          perms += 'w';
        }
        return perms;
      },
      nodePermissions: function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return 2;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return 2;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return 2;
        }
        return 0;
      },
      mayLookup: function (dir) {
        var errCode = FS.nodePermissions(dir, 'x');
        if (errCode) return errCode;
        if (!dir.node_ops.lookup) return 2;
        return 0;
      },
      mayCreate: function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return 20;
        } catch (e) {}
        return FS.nodePermissions(dir, 'wx');
      },
      mayDelete: function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var errCode = FS.nodePermissions(dir, 'wx');
        if (errCode) {
          return errCode;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return 54;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return 10;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return 31;
          }
        }
        return 0;
      },
      mayOpen: function (node, flags) {
        if (!node) {
          return 44;
        }
        if (FS.isLink(node.mode)) {
          return 32;
        } else if (FS.isDir(node.mode)) {
          if (FS.flagsToPermissionString(flags) !== 'r' || flags & 512) {
            return 31;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },
      MAX_OPEN_FDS: 4096,
      nextfd: function (fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(33);
      },
      getStream: function (fd) {
        return FS.streams[fd];
      },
      createStream: function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function () {};
          FS.FSStream.prototype = {
            object: {
              get: function () {
                return this.node;
              },
              set: function (val) {
                this.node = val;
              },
            },
            isRead: {
              get: function () {
                return (this.flags & 2097155) !== 1;
              },
            },
            isWrite: {
              get: function () {
                return (this.flags & 2097155) !== 0;
              },
            },
            isAppend: {
              get: function () {
                return this.flags & 1024;
              },
            },
          };
        }
        var newStream = new FS.FSStream();
        for (var p in stream) {
          newStream[p] = stream[p];
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },
      closeStream: function (fd) {
        FS.streams[fd] = null;
      },
      chrdev_stream_ops: {
        open: function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          stream.stream_ops = device.stream_ops;
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },
        llseek: function () {
          throw new FS.ErrnoError(70);
        },
      },
      major: function (dev) {
        return dev >> 8;
      },
      minor: function (dev) {
        return dev & 255;
      },
      makedev: function (ma, mi) {
        return (ma << 8) | mi;
      },
      registerDevice: function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },
      getDevice: function (dev) {
        return FS.devices[dev];
      },
      getMounts: function (mount) {
        var mounts = [];
        var check = [mount];
        while (check.length) {
          var m = check.pop();
          mounts.push(m);
          check.push.apply(check, m.mounts);
        }
        return mounts;
      },
      syncfs: function (populate, callback) {
        if (typeof populate === 'function') {
          callback = populate;
          populate = false;
        }
        FS.syncFSRequests++;
        if (FS.syncFSRequests > 1) {
          err(
            'warning: ' +
              FS.syncFSRequests +
              ' FS.syncfs operations in flight at once, probably just doing extra work',
          );
        }
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
        function doCallback(errCode) {
          FS.syncFSRequests--;
          return callback(errCode);
        }
        function done(errCode) {
          if (errCode) {
            if (!done.errored) {
              done.errored = true;
              return doCallback(errCode);
            }
            return;
          }
          if (++completed >= mounts.length) {
            doCallback(null);
          }
        }
        mounts.forEach(function (mount) {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },
      mount: function (type, opts, mountpoint) {
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
        if (root && FS.root) {
          throw new FS.ErrnoError(10);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
          mountpoint = lookup.path;
          node = lookup.node;
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10);
          }
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(54);
          }
        }
        var mount = { type: type, opts: opts, mountpoint: mountpoint, mounts: [] };
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          node.mounted = mount;
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
        return mountRoot;
      },
      unmount: function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(28);
        }
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
        Object.keys(FS.nameTable).forEach(function (hash) {
          var current = FS.nameTable[hash];
          while (current) {
            var next = current.name_next;
            if (mounts.indexOf(current.mount) !== -1) {
              FS.destroyNode(current);
            }
            current = next;
          }
        });
        node.mounted = null;
        var idx = node.mount.mounts.indexOf(mount);
        node.mount.mounts.splice(idx, 1);
      },
      lookup: function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },
      mknod: function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === '.' || name === '..') {
          throw new FS.ErrnoError(28);
        }
        var errCode = FS.mayCreate(parent, name);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },
      create: function (path, mode) {
        mode = mode !== undefined ? mode : 438;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },
      mkdir: function (path, mode) {
        mode = mode !== undefined ? mode : 511;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },
      mkdirTree: function (path, mode) {
        var dirs = path.split('/');
        var d = '';
        for (var i = 0; i < dirs.length; ++i) {
          if (!dirs[i]) continue;
          d += '/' + dirs[i];
          try {
            FS.mkdir(d, mode);
          } catch (e) {
            if (e.errno != 20) throw e;
          }
        }
      },
      mkdev: function (path, mode, dev) {
        if (typeof dev === 'undefined') {
          dev = mode;
          mode = 438;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },
      symlink: function (oldpath, newpath) {
        if (!PATH_FS.resolve(oldpath)) {
          throw new FS.ErrnoError(44);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(44);
        }
        var newname = PATH.basename(newpath);
        var errCode = FS.mayCreate(parent, newname);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },
      rename: function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        var lookup, old_dir, new_dir;
        lookup = FS.lookupPath(old_path, { parent: true });
        old_dir = lookup.node;
        lookup = FS.lookupPath(new_path, { parent: true });
        new_dir = lookup.node;
        if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(75);
        }
        var old_node = FS.lookupNode(old_dir, old_name);
        var relative = PATH_FS.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(28);
        }
        relative = PATH_FS.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(55);
        }
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {}
        if (old_node === new_node) {
          return;
        }
        var isdir = FS.isDir(old_node.mode);
        var errCode = FS.mayDelete(old_dir, old_name, isdir);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        errCode = new_node
          ? FS.mayDelete(new_dir, new_name, isdir)
          : FS.mayCreate(new_dir, new_name);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(10);
        }
        if (new_dir !== old_dir) {
          errCode = FS.nodePermissions(old_dir, 'w');
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
        }
        try {
          if (FS.trackingDelegate['willMovePath']) {
            FS.trackingDelegate['willMovePath'](old_path, new_path);
          }
        } catch (e) {
          err(
            "FS.trackingDelegate['willMovePath']('" +
              old_path +
              "', '" +
              new_path +
              "') threw an exception: " +
              e.message,
          );
        }
        FS.hashRemoveNode(old_node);
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          FS.hashAddNode(old_node);
        }
        try {
          if (FS.trackingDelegate['onMovePath'])
            FS.trackingDelegate['onMovePath'](old_path, new_path);
        } catch (e) {
          err(
            "FS.trackingDelegate['onMovePath']('" +
              old_path +
              "', '" +
              new_path +
              "') threw an exception: " +
              e.message,
          );
        }
      },
      rmdir: function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, true);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch (e) {
          err(
            "FS.trackingDelegate['willDeletePath']('" +
              path +
              "') threw an exception: " +
              e.message,
          );
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch (e) {
          err(
            "FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message,
          );
        }
      },
      readdir: function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(54);
        }
        return node.node_ops.readdir(node);
      },
      unlink: function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, false);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch (e) {
          err(
            "FS.trackingDelegate['willDeletePath']('" +
              path +
              "') threw an exception: " +
              e.message,
          );
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch (e) {
          err(
            "FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message,
          );
        }
      },
      readlink: function (path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
          throw new FS.ErrnoError(44);
        }
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(28);
        }
        return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
      },
      stat: function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node) {
          throw new FS.ErrnoError(44);
        }
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(63);
        }
        return node.node_ops.getattr(node);
      },
      lstat: function (path) {
        return FS.stat(path, true);
      },
      chmod: function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(63);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now(),
        });
      },
      lchmod: function (path, mode) {
        FS.chmod(path, mode, true);
      },
      fchmod: function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(8);
        }
        FS.chmod(stream.node, mode);
      },
      chown: function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(63);
        }
        node.node_ops.setattr(node, { timestamp: Date.now() });
      },
      lchown: function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },
      fchown: function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(8);
        }
        FS.chown(stream.node, uid, gid);
      },
      truncate: function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(28);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(28);
        }
        var errCode = FS.nodePermissions(node, 'w');
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        node.node_ops.setattr(node, { size: len, timestamp: Date.now() });
      },
      ftruncate: function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(28);
        }
        FS.truncate(stream.node, len);
      },
      utime: function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, { timestamp: Math.max(atime, mtime) });
      },
      open: function (path, flags, mode, fd_start, fd_end) {
        if (path === '') {
          throw new FS.ErrnoError(44);
        }
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 438 : mode;
        if (flags & 64) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, { follow: !(flags & 131072) });
            node = lookup.node;
          } catch (e) {}
        }
        var created = false;
        if (flags & 64) {
          if (node) {
            if (flags & 128) {
              throw new FS.ErrnoError(20);
            }
          } else {
            node = FS.mknod(path, mode, 0);
            created = true;
          }
        }
        if (!node) {
          throw new FS.ErrnoError(44);
        }
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        if (flags & 65536 && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(54);
        }
        if (!created) {
          var errCode = FS.mayOpen(node, flags);
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
        }
        if (flags & 512) {
          FS.truncate(node, 0);
        }
        flags &= ~(128 | 512 | 131072);
        var stream = FS.createStream(
          {
            node: node,
            path: FS.getPath(node),
            flags: flags,
            seekable: true,
            position: 0,
            stream_ops: node.stream_ops,
            ungotten: [],
            error: false,
          },
          fd_start,
          fd_end,
        );
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            err('FS.trackingDelegate error on read file: ' + path);
          }
        }
        try {
          if (FS.trackingDelegate['onOpenFile']) {
            var trackingFlags = 0;
            if ((flags & 2097155) !== 1) {
              trackingFlags |= FS.tracking.openFlags.READ;
            }
            if ((flags & 2097155) !== 0) {
              trackingFlags |= FS.tracking.openFlags.WRITE;
            }
            FS.trackingDelegate['onOpenFile'](path, trackingFlags);
          }
        } catch (e) {
          err(
            "FS.trackingDelegate['onOpenFile']('" +
              path +
              "', flags) threw an exception: " +
              e.message,
          );
        }
        return stream;
      },
      close: function (stream) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (stream.getdents) stream.getdents = null;
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
        stream.fd = null;
      },
      isClosed: function (stream) {
        return stream.fd === null;
      },
      llseek: function (stream, offset, whence) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(70);
        }
        if (whence != 0 && whence != 1 && whence != 2) {
          throw new FS.ErrnoError(28);
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position;
      },
      read: function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(28);
        }
        var seeking = typeof position !== 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },
      write: function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(28);
        }
        if (stream.seekable && stream.flags & 1024) {
          FS.llseek(stream, 0, 2);
        }
        var seeking = typeof position !== 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesWritten = stream.stream_ops.write(
          stream,
          buffer,
          offset,
          length,
          position,
          canOwn,
        );
        if (!seeking) stream.position += bytesWritten;
        try {
          if (stream.path && FS.trackingDelegate['onWriteToFile'])
            FS.trackingDelegate['onWriteToFile'](stream.path);
        } catch (e) {
          err(
            "FS.trackingDelegate['onWriteToFile']('" +
              stream.path +
              "') threw an exception: " +
              e.message,
          );
        }
        return bytesWritten;
      },
      allocate: function (stream, offset, length) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(28);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(8);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(43);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(138);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },
      mmap: function (stream, address, length, position, prot, flags) {
        if ((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2) {
          throw new FS.ErrnoError(2);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(2);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(43);
        }
        return stream.stream_ops.mmap(stream, address, length, position, prot, flags);
      },
      msync: function (stream, buffer, offset, length, mmapFlags) {
        if (!stream || !stream.stream_ops.msync) {
          return 0;
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
      },
      munmap: function (stream) {
        return 0;
      },
      ioctl: function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(59);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },
      readFile: function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = UTF8ArrayToString(buf, 0);
        } else if (opts.encoding === 'binary') {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },
      writeFile: function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (typeof data === 'string') {
          var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
          var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
          FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn);
        } else if (ArrayBuffer.isView(data)) {
          FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
        } else {
          throw new Error('Unsupported data type');
        }
        FS.close(stream);
      },
      cwd: function () {
        return FS.currentPath;
      },
      chdir: function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (lookup.node === null) {
          throw new FS.ErrnoError(44);
        }
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(54);
        }
        var errCode = FS.nodePermissions(lookup.node, 'x');
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        FS.currentPath = lookup.path;
      },
      createDefaultDirectories: function () {
        FS.mkdir('/tmp');
        FS.mkdir('/home');
        FS.mkdir('/home/web_user');
      },
      createDefaultDevices: function () {
        FS.mkdir('/dev');
        FS.registerDevice(FS.makedev(1, 3), {
          read: function () {
            return 0;
          },
          write: function (stream, buffer, offset, length, pos) {
            return length;
          },
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        var random_device;
        if (typeof crypto === 'object' && typeof crypto['getRandomValues'] === 'function') {
          var randomBuffer = new Uint8Array(1);
          random_device = function () {
            crypto.getRandomValues(randomBuffer);
            return randomBuffer[0];
          };
        } else if (ENVIRONMENT_IS_NODE) {
          try {
            var crypto_module = require('crypto');
            random_device = function () {
              return crypto_module['randomBytes'](1)[0];
            };
          } catch (e) {}
        } else {
        }
        if (!random_device) {
          random_device = function () {
            abort('random_device');
          };
        }
        FS.createDevice('/dev', 'random', random_device);
        FS.createDevice('/dev', 'urandom', random_device);
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },
      createSpecialDirectories: function () {
        FS.mkdir('/proc');
        FS.mkdir('/proc/self');
        FS.mkdir('/proc/self/fd');
        FS.mount(
          {
            mount: function () {
              var node = FS.createNode('/proc/self', 'fd', 16384 | 511, 73);
              node.node_ops = {
                lookup: function (parent, name) {
                  var fd = +name;
                  var stream = FS.getStream(fd);
                  if (!stream) throw new FS.ErrnoError(8);
                  var ret = {
                    parent: null,
                    mount: { mountpoint: 'fake' },
                    node_ops: {
                      readlink: function () {
                        return stream.path;
                      },
                    },
                  };
                  ret.parent = ret;
                  return ret;
                },
              };
              return node;
            },
          },
          {},
          '/proc/self/fd',
        );
      },
      createStandardStreams: function () {
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
        var stdin = FS.open('/dev/stdin', 'r');
        var stdout = FS.open('/dev/stdout', 'w');
        var stderr = FS.open('/dev/stderr', 'w');
      },
      ensureErrnoError: function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno, node) {
          this.node = node;
          this.setErrno = function (errno) {
            this.errno = errno;
          };
          this.setErrno(errno);
          this.message = 'FS error';
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        [44].forEach(function (code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },
      staticInit: function () {
        FS.ensureErrnoError();
        FS.nameTable = new Array(4096);
        FS.mount(MEMFS, {}, '/');
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
        FS.filesystems = { MEMFS: MEMFS, NODEFS: NODEFS };
      },
      init: function (input, output, error) {
        FS.init.initialized = true;
        FS.ensureErrnoError();
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
        FS.createStandardStreams();
      },
      quit: function () {
        FS.init.initialized = false;
        var fflush = Module['_fflush'];
        if (fflush) fflush(0);
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },
      getMode: function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },
      joinPath: function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },
      absolutePath: function (relative, base) {
        return PATH_FS.resolve(base, relative);
      },
      standardizePath: function (path) {
        return PATH.normalize(path);
      },
      findObject: function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          setErrNo(ret.error);
          return null;
        }
      },
      analyzePath: function (path, dontResolveLastLink) {
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {}
        var ret = {
          isRoot: false,
          exists: false,
          error: 0,
          name: null,
          path: null,
          object: null,
          parentExists: false,
          parentPath: null,
          parentObject: null,
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        }
        return ret;
      },
      createFolder: function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },
      createPath: function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {}
          parent = current;
        }
        return current;
      },
      createFile: function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },
      createDataFile: function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name
          ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name)
          : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },
      createDevice: function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        FS.registerDevice(dev, {
          open: function (stream) {
            stream.seekable = false;
          },
          close: function (stream) {
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function (stream, buffer, offset, length, pos) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(6);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset + i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function (stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset + i]);
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          },
        });
        return FS.mkdev(path, mode, dev);
      },
      createLink: function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },
      forceLoadFile: function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error(
            'Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.',
          );
        } else if (read_) {
          try {
            obj.contents = intArrayFromString(read_(obj.url), true);
            obj.usedBytes = obj.contents.length;
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) setErrNo(29);
        return success;
      },
      createLazyFile: function (parent, name, url, canRead, canWrite) {
        function LazyUint8Array() {
          this.lengthKnown = false;
          this.chunks = [];
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
          if (idx > this.length - 1 || idx < 0) {
            return undefined;
          }
          var chunkOffset = idx % this.chunkSize;
          var chunkNum = (idx / this.chunkSize) | 0;
          return this.getter(chunkNum)[chunkOffset];
        };
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
          this.getter = getter;
        };
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
          var xhr = new XMLHttpRequest();
          xhr.open('HEAD', url, false);
          xhr.send(null);
          if (!((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304))
            throw new Error("Couldn't load " + url + '. Status: ' + xhr.status);
          var datalength = Number(xhr.getResponseHeader('Content-length'));
          var header;
          var hasByteServing =
            (header = xhr.getResponseHeader('Accept-Ranges')) && header === 'bytes';
          var usesGzip = (header = xhr.getResponseHeader('Content-Encoding')) && header === 'gzip';
          var chunkSize = 1024 * 1024;
          if (!hasByteServing) chunkSize = datalength;
          var doXHR = function (from, to) {
            if (from > to)
              throw new Error('invalid range (' + from + ', ' + to + ') or no bytes requested!');
            if (to > datalength - 1)
              throw new Error('only ' + datalength + ' bytes available! programmer error!');
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            if (datalength !== chunkSize) xhr.setRequestHeader('Range', 'bytes=' + from + '-' + to);
            if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
            if (xhr.overrideMimeType) {
              xhr.overrideMimeType('text/plain; charset=x-user-defined');
            }
            xhr.send(null);
            if (!((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304))
              throw new Error("Couldn't load " + url + '. Status: ' + xhr.status);
            if (xhr.response !== undefined) {
              return new Uint8Array(xhr.response || []);
            } else {
              return intArrayFromString(xhr.responseText || '', true);
            }
          };
          var lazyArray = this;
          lazyArray.setDataGetter(function (chunkNum) {
            var start = chunkNum * chunkSize;
            var end = (chunkNum + 1) * chunkSize - 1;
            end = Math.min(end, datalength - 1);
            if (typeof lazyArray.chunks[chunkNum] === 'undefined') {
              lazyArray.chunks[chunkNum] = doXHR(start, end);
            }
            if (typeof lazyArray.chunks[chunkNum] === 'undefined') throw new Error('doXHR failed!');
            return lazyArray.chunks[chunkNum];
          });
          if (usesGzip || !datalength) {
            chunkSize = datalength = 1;
            datalength = this.getter(0).length;
            chunkSize = datalength;
            out('LazyFiles on gzip forces download of the whole file when length is accessed');
          }
          this._length = datalength;
          this._chunkSize = chunkSize;
          this.lengthKnown = true;
        };
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER)
            throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          var lazyArray = new LazyUint8Array();
          Object.defineProperties(lazyArray, {
            length: {
              get: function () {
                if (!this.lengthKnown) {
                  this.cacheLength();
                }
                return this._length;
              },
            },
            chunkSize: {
              get: function () {
                if (!this.lengthKnown) {
                  this.cacheLength();
                }
                return this._chunkSize;
              },
            },
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        Object.defineProperties(node, {
          usedBytes: {
            get: function () {
              return this.contents.length;
            },
          },
        });
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function (key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(29);
            }
            return fn.apply(null, arguments);
          };
        });
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(29);
          }
          var contents = stream.node.contents;
          if (position >= contents.length) return 0;
          var size = Math.min(contents.length - position, length);
          if (contents.slice) {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },
      createPreloadedFile: function (
        parent,
        name,
        url,
        canRead,
        canWrite,
        onload,
        onerror,
        dontCreateFile,
        canOwn,
        preFinish,
      ) {
        Browser.init();
        var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
        var dep = getUniqueRunDependency('cp ' + fullname);
        function processData(byteArray) {
          function finish(byteArray) {
            if (preFinish) preFinish();
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency(dep);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function (plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function () {
                if (onerror) onerror();
                removeRunDependency(dep);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency(dep);
        if (typeof url == 'string') {
          Browser.asyncLoad(
            url,
            function (byteArray) {
              processData(byteArray);
            },
            onerror,
          );
        } else {
          processData(url);
        }
      },
      indexedDB: function () {
        return (
          window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
        );
      },
      DB_NAME: function () {
        return 'EM_FS_' + window.location.pathname;
      },
      DB_VERSION: 20,
      DB_STORE_NAME: 'FILE_DATA',
      saveFilesToDB: function (paths, onload, onerror) {
        onload = onload || function () {};
        onerror = onerror || function () {};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          out('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0,
            fail = 0,
            total = paths.length;
          function finish() {
            if (fail == 0) onload();
            else onerror();
          }
          paths.forEach(function (path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() {
              ok++;
              if (ok + fail == total) finish();
            };
            putRequest.onerror = function putRequest_onerror() {
              fail++;
              if (ok + fail == total) finish();
            };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },
      loadFilesFromDB: function (paths, onload, onerror) {
        onload = onload || function () {};
        onerror = onerror || function () {};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror;
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch (e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0,
            fail = 0,
            total = paths.length;
          function finish() {
            if (fail == 0) onload();
            else onerror();
          }
          paths.forEach(function (path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(
                PATH.dirname(path),
                PATH.basename(path),
                getRequest.result,
                true,
                true,
                true,
              );
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() {
              fail++;
              if (ok + fail == total) finish();
            };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },
      mmapAlloc: function (size) {
        var alignedSize = alignMemory(size, 16384);
        var ptr = _malloc(alignedSize);
        while (size < alignedSize) HEAP8[ptr + size++] = 0;
        return ptr;
      },
    };
    var SYSCALLS = {
      mappings: {},
      DEFAULT_POLLMASK: 5,
      umask: 511,
      calculateAt: function (dirfd, path) {
        if (path[0] !== '/') {
          var dir;
          if (dirfd === -100) {
            dir = FS.cwd();
          } else {
            var dirstream = FS.getStream(dirfd);
            if (!dirstream) throw new FS.ErrnoError(8);
            dir = dirstream.path;
          }
          path = PATH.join2(dir, path);
        }
        return path;
      },
      doStat: function (func, path, buf) {
        try {
          var stat = func(path);
        } catch (e) {
          if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
            return -54;
          }
          throw e;
        }
        HEAP32[buf >> 2] = stat.dev;
        HEAP32[(buf + 4) >> 2] = 0;
        HEAP32[(buf + 8) >> 2] = stat.ino;
        HEAP32[(buf + 12) >> 2] = stat.mode;
        HEAP32[(buf + 16) >> 2] = stat.nlink;
        HEAP32[(buf + 20) >> 2] = stat.uid;
        HEAP32[(buf + 24) >> 2] = stat.gid;
        HEAP32[(buf + 28) >> 2] = stat.rdev;
        HEAP32[(buf + 32) >> 2] = 0;
        (tempI64 = [
          stat.size >>> 0,
          ((tempDouble = stat.size),
          +Math_abs(tempDouble) >= 1
            ? tempDouble > 0
              ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0
              : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0
            : 0),
        ]),
          (HEAP32[(buf + 40) >> 2] = tempI64[0]),
          (HEAP32[(buf + 44) >> 2] = tempI64[1]);
        HEAP32[(buf + 48) >> 2] = 4096;
        HEAP32[(buf + 52) >> 2] = stat.blocks;
        HEAP32[(buf + 56) >> 2] = (stat.atime.getTime() / 1e3) | 0;
        HEAP32[(buf + 60) >> 2] = 0;
        HEAP32[(buf + 64) >> 2] = (stat.mtime.getTime() / 1e3) | 0;
        HEAP32[(buf + 68) >> 2] = 0;
        HEAP32[(buf + 72) >> 2] = (stat.ctime.getTime() / 1e3) | 0;
        HEAP32[(buf + 76) >> 2] = 0;
        (tempI64 = [
          stat.ino >>> 0,
          ((tempDouble = stat.ino),
          +Math_abs(tempDouble) >= 1
            ? tempDouble > 0
              ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0
              : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0
            : 0),
        ]),
          (HEAP32[(buf + 80) >> 2] = tempI64[0]),
          (HEAP32[(buf + 84) >> 2] = tempI64[1]);
        return 0;
      },
      doMsync: function (addr, stream, len, flags, offset) {
        var buffer = HEAPU8.slice(addr, addr + len);
        FS.msync(stream, buffer, offset, len, flags);
      },
      doMkdir: function (path, mode) {
        path = PATH.normalize(path);
        if (path[path.length - 1] === '/') path = path.substr(0, path.length - 1);
        FS.mkdir(path, mode, 0);
        return 0;
      },
      doMknod: function (path, mode, dev) {
        switch (mode & 61440) {
          case 32768:
          case 8192:
          case 24576:
          case 4096:
          case 49152:
            break;
          default:
            return -28;
        }
        FS.mknod(path, mode, dev);
        return 0;
      },
      doReadlink: function (path, buf, bufsize) {
        if (bufsize <= 0) return -28;
        var ret = FS.readlink(path);
        var len = Math.min(bufsize, lengthBytesUTF8(ret));
        var endChar = HEAP8[buf + len];
        stringToUTF8(ret, buf, bufsize + 1);
        HEAP8[buf + len] = endChar;
        return len;
      },
      doAccess: function (path, amode) {
        if (amode & ~7) {
          return -28;
        }
        var node;
        var lookup = FS.lookupPath(path, { follow: true });
        node = lookup.node;
        if (!node) {
          return -44;
        }
        var perms = '';
        if (amode & 4) perms += 'r';
        if (amode & 2) perms += 'w';
        if (amode & 1) perms += 'x';
        if (perms && FS.nodePermissions(node, perms)) {
          return -2;
        }
        return 0;
      },
      doDup: function (path, flags, suggestFD) {
        var suggest = FS.getStream(suggestFD);
        if (suggest) FS.close(suggest);
        return FS.open(path, flags, 0, suggestFD, suggestFD).fd;
      },
      doReadv: function (stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
          var ptr = HEAP32[(iov + i * 8) >> 2];
          var len = HEAP32[(iov + (i * 8 + 4)) >> 2];
          var curr = FS.read(stream, HEAP8, ptr, len, offset);
          if (curr < 0) return -1;
          ret += curr;
          if (curr < len) break;
        }
        return ret;
      },
      doWritev: function (stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
          var ptr = HEAP32[(iov + i * 8) >> 2];
          var len = HEAP32[(iov + (i * 8 + 4)) >> 2];
          var curr = FS.write(stream, HEAP8, ptr, len, offset);
          if (curr < 0) return -1;
          ret += curr;
        }
        return ret;
      },
      varargs: undefined,
      get: function () {
        SYSCALLS.varargs += 4;
        var ret = HEAP32[(SYSCALLS.varargs - 4) >> 2];
        return ret;
      },
      getStr: function (ptr) {
        var ret = UTF8ToString(ptr);
        return ret;
      },
      getStreamFromFD: function (fd) {
        var stream = FS.getStream(fd);
        if (!stream) throw new FS.ErrnoError(8);
        return stream;
      },
      get64: function (low, high) {
        return low;
      },
    };
    function ___sys_access(path, amode) {
      if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(2, 1, path, amode);
      try {
        path = SYSCALLS.getStr(path);
        return SYSCALLS.doAccess(path, amode);
      } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
    }
    function ___sys_chdir(path) {
      if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(3, 1, path);
      try {
        path = SYSCALLS.getStr(path);
        FS.chdir(path);
        return 0;
      } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
    }
    function ___sys_dup(fd) {
      if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(4, 1, fd);
      try {
        var old = SYSCALLS.getStreamFromFD(fd);
        return FS.open(old.path, old.flags, 0).fd;
      } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
    }
    function ___sys_dup2(oldfd, suggestFD) {
      if (ENVIRONMENT_IS_PTHREAD)
        return _emscripten_proxy_to_main_thread_js(5, 1, oldfd, suggestFD);
      try {
        var old = SYSCALLS.getStreamFromFD(oldfd);
        if (old.fd === suggestFD) return suggestFD;
        return SYSCALLS.doDup(old.path, old.flags, suggestFD);
      } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
    }
    function ___sys_fcntl64(fd, cmd, varargs) {
      if (ENVIRONMENT_IS_PTHREAD)
        return _emscripten_proxy_to_main_thread_js(6, 1, fd, cmd, varargs);
      SYSCALLS.varargs = varargs;
      try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        switch (cmd) {
          case 0: {
            var arg = SYSCALLS.get();
            if (arg < 0) {
              return -28;
            }
            var newStream;
            newStream = FS.open(stream.path, stream.flags, 0, arg);
            return newStream.fd;
          }
          case 1:
          case 2:
            return 0;
          case 3:
            return stream.flags;
          case 4: {
            var arg = SYSCALLS.get();
            stream.flags |= arg;
            return 0;
          }
          case 12: {
            var arg = SYSCALLS.get();
            var offset = 0;
            HEAP16[(arg + offset) >> 1] = 2;
            return 0;
          }
          case 13:
          case 14:
            return 0;
          case 16:
          case 8:
            return -28;
          case 9:
            setErrNo(28);
            return -1;
          default: {
            return -28;
          }
        }
      } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
    }
    function ___sys_fstat64(fd, buf) {
      if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(7, 1, fd, buf);
      try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        return SYSCALLS.doStat(FS.stat, stream.path, buf);
      } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
    }
    function ___sys_ftruncate64(fd, zero, low, high) {
      if (ENVIRONMENT_IS_PTHREAD)
        return _emscripten_proxy_to_main_thread_js(8, 1, fd, zero, low, high);
      try {
        var length = SYSCALLS.get64(low, high);
        FS.ftruncate(fd, length);
        return 0;
      } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
    }
    function ___sys_getcwd(buf, size) {
      if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(9, 1, buf, size);
      try {
        if (size === 0) return -28;
        var cwd = FS.cwd();
        var cwdLengthInBytes = lengthBytesUTF8(cwd);
        if (size < cwdLengthInBytes + 1) return -68;
        stringToUTF8(cwd, buf, size);
        return buf;
      } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
    }
    function ___sys_getdents64(fd, dirp, count) {
      if (ENVIRONMENT_IS_PTHREAD)
        return _emscripten_proxy_to_main_thread_js(10, 1, fd, dirp, count);
      try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        if (!stream.getdents) {
          stream.getdents = FS.readdir(stream.path);
        }
        var struct_size = 280;
        var pos = 0;
        var off = FS.llseek(stream, 0, 1);
        var idx = Math.floor(off / struct_size);
        while (idx < stream.getdents.length && pos + struct_size <= count) {
          var id;
          var type;
          var name = stream.getdents[idx];
          if (name[0] === '.') {
            id = 1;
            type = 4;
          } else {
            var child = FS.lookupNode(stream.node, name);
            id = child.id;
            type = FS.isChrdev(child.mode)
              ? 2
              : FS.isDir(child.mode)
              ? 4
              : FS.isLink(child.mode)
              ? 10
              : 8;
          }
          (tempI64 = [
            id >>> 0,
            ((tempDouble = id),
            +Math_abs(tempDouble) >= 1
              ? tempDouble > 0
                ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0
                : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0
              : 0),
          ]),
            (HEAP32[(dirp + pos) >> 2] = tempI64[0]),
            (HEAP32[(dirp + pos + 4) >> 2] = tempI64[1]);
          (tempI64 = [
            ((idx + 1) * struct_size) >>> 0,
            ((tempDouble = (idx + 1) * struct_size),
            +Math_abs(tempDouble) >= 1
              ? tempDouble > 0
                ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0
                : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0
              : 0),
          ]),
            (HEAP32[(dirp + pos + 8) >> 2] = tempI64[0]),
            (HEAP32[(dirp + pos + 12) >> 2] = tempI64[1]);
          HEAP16[(dirp + pos + 16) >> 1] = 280;
          HEAP8[(dirp + pos + 18) >> 0] = type;
          stringToUTF8(name, dirp + pos + 19, 256);
          pos += struct_size;
          idx += 1;
        }
        FS.llseek(stream, idx * struct_size, 0);
        return pos;
      } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
    }
    function ___sys_getpid() {
      return 42;
    }
    function ___sys_getppid() {
      return 1;
    }
    function ___sys_getegid32() {
      return 0;
    }
    function ___sys_getuid32() {
      return ___sys_getegid32();
    }
    function ___sys_ioctl(fd, op, varargs) {
      if (ENVIRONMENT_IS_PTHREAD)
        return _emscripten_proxy_to_main_thread_js(11, 1, fd, op, varargs);
      SYSCALLS.varargs = varargs;
      try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        switch (op) {
          case 21509:
          case 21505: {
            if (!stream.tty) return -59;
            return 0;
          }
          case 21510:
          case 21511:
          case 21512:
          case 21506:
          case 21507:
          case 21508: {
            if (!stream.tty) return -59;
            return 0;
          }
          case 21519: {
            if (!stream.tty) return -59;
            var argp = SYSCALLS.get();
            HEAP32[argp >> 2] = 0;
            return 0;
          }
          case 21520: {
            if (!stream.tty) return -59;
            return -28;
          }
          case 21531: {
            var argp = SYSCALLS.get();
            return FS.ioctl(stream, op, argp);
          }
          case 21523: {
            if (!stream.tty) return -59;
            return 0;
          }
          case 21524: {
            if (!stream.tty) return -59;
            return 0;
          }
          default:
            abort('bad ioctl syscall ' + op);
        }
      } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
    }
    function ___sys_lstat64(path, buf) {
      if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(12, 1, path, buf);
      try {
        path = SYSCALLS.getStr(path);
        return SYSCALLS.doStat(FS.lstat, path, buf);
      } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
    }
    function syscallMmap2(addr, len, prot, flags, fd, off) {
      off <<= 12;
      var ptr;
      var allocated = false;
      if ((flags & 16) !== 0 && addr % 16384 !== 0) {
        return -28;
      }
      if ((flags & 32) !== 0) {
        ptr = _memalign(16384, len);
        if (!ptr) return -48;
        _memset(ptr, 0, len);
        allocated = true;
      } else {
        var info = FS.getStream(fd);
        if (!info) return -8;
        var res = FS.mmap(info, addr, len, off, prot, flags);
        ptr = res.ptr;
        allocated = res.allocated;
      }
      SYSCALLS.mappings[ptr] = {
        malloc: ptr,
        len: len,
        allocated: allocated,
        fd: fd,
        prot: prot,
        flags: flags,
        offset: off,
      };
      return ptr;
    }
    function ___sys_mmap2(addr, len, prot, flags, fd, off) {
      if (ENVIRONMENT_IS_PTHREAD)
        return _emscripten_proxy_to_main_thread_js(13, 1, addr, len, prot, flags, fd, off);
      try {
        return syscallMmap2(addr, len, prot, flags, fd, off);
      } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
    }
    function syscallMunmap(addr, len) {
      if ((addr | 0) === -1 || len === 0) {
        return -28;
      }
      var info = SYSCALLS.mappings[addr];
      if (!info) return 0;
      if (len === info.len) {
        var stream = FS.getStream(info.fd);
        if (info.prot & 2) {
          SYSCALLS.doMsync(addr, stream, len, info.flags, info.offset);
        }
        FS.munmap(stream);
        SYSCALLS.mappings[addr] = null;
        if (info.allocated) {
          _free(info.malloc);
        }
      }
      return 0;
    }
    function ___sys_munmap(addr, len) {
      if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(14, 1, addr, len);
      try {
        return syscallMunmap(addr, len);
      } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
    }
    function ___sys_open(path, flags, varargs) {
      if (ENVIRONMENT_IS_PTHREAD)
        return _emscripten_proxy_to_main_thread_js(15, 1, path, flags, varargs);
      SYSCALLS.varargs = varargs;
      try {
        var pathname = SYSCALLS.getStr(path);
        var mode = SYSCALLS.get();
        var stream = FS.open(pathname, flags, mode);
        return stream.fd;
      } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
    }
    var PIPEFS = {
      BUCKET_BUFFER_SIZE: 8192,
      mount: function (mount) {
        return FS.createNode(null, '/', 16384 | 511, 0);
      },
      createPipe: function () {
        var pipe = { buckets: [] };
        pipe.buckets.push({
          buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE),
          offset: 0,
          roffset: 0,
        });
        var rName = PIPEFS.nextname();
        var wName = PIPEFS.nextname();
        var rNode = FS.createNode(PIPEFS.root, rName, 4096, 0);
        var wNode = FS.createNode(PIPEFS.root, wName, 4096, 0);
        rNode.pipe = pipe;
        wNode.pipe = pipe;
        var readableStream = FS.createStream({
          path: rName,
          node: rNode,
          flags: FS.modeStringToFlags('r'),
          seekable: false,
          stream_ops: PIPEFS.stream_ops,
        });
        rNode.stream = readableStream;
        var writableStream = FS.createStream({
          path: wName,
          node: wNode,
          flags: FS.modeStringToFlags('w'),
          seekable: false,
          stream_ops: PIPEFS.stream_ops,
        });
        wNode.stream = writableStream;
        return { readable_fd: readableStream.fd, writable_fd: writableStream.fd };
      },
      stream_ops: {
        poll: function (stream) {
          var pipe = stream.node.pipe;
          if ((stream.flags & 2097155) === 1) {
            return 256 | 4;
          } else {
            if (pipe.buckets.length > 0) {
              for (var i = 0; i < pipe.buckets.length; i++) {
                var bucket = pipe.buckets[i];
                if (bucket.offset - bucket.roffset > 0) {
                  return 64 | 1;
                }
              }
            }
          }
          return 0;
        },
        ioctl: function (stream, request, varargs) {
          return ERRNO_CODES.EINVAL;
        },
        fsync: function (stream) {
          return ERRNO_CODES.EINVAL;
        },
        read: function (stream, buffer, offset, length, position) {
          var pipe = stream.node.pipe;
          var currentLength = 0;
          for (var i = 0; i < pipe.buckets.length; i++) {
            var bucket = pipe.buckets[i];
            currentLength += bucket.offset - bucket.roffset;
          }
          assert(
            buffer instanceof ArrayBuffer ||
              buffer instanceof SharedArrayBuffer ||
              ArrayBuffer.isView(buffer),
          );
          var data = buffer.subarray(offset, offset + length);
          if (length <= 0) {
            return 0;
          }
          if (currentLength == 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
          }
          var toRead = Math.min(currentLength, length);
          var totalRead = toRead;
          var toRemove = 0;
          for (var i = 0; i < pipe.buckets.length; i++) {
            var currBucket = pipe.buckets[i];
            var bucketSize = currBucket.offset - currBucket.roffset;
            if (toRead <= bucketSize) {
              var tmpSlice = currBucket.buffer.subarray(currBucket.roffset, currBucket.offset);
              if (toRead < bucketSize) {
                tmpSlice = tmpSlice.subarray(0, toRead);
                currBucket.roffset += toRead;
              } else {
                toRemove++;
              }
              data.set(tmpSlice);
              break;
            } else {
              var tmpSlice = currBucket.buffer.subarray(currBucket.roffset, currBucket.offset);
              data.set(tmpSlice);
              data = data.subarray(tmpSlice.byteLength);
              toRead -= tmpSlice.byteLength;
              toRemove++;
            }
          }
          if (toRemove && toRemove == pipe.buckets.length) {
            toRemove--;
            pipe.buckets[toRemove].offset = 0;
            pipe.buckets[toRemove].roffset = 0;
          }
          pipe.buckets.splice(0, toRemove);
          return totalRead;
        },
        write: function (stream, buffer, offset, length, position) {
          var pipe = stream.node.pipe;
          assert(
            buffer instanceof ArrayBuffer ||
              buffer instanceof SharedArrayBuffer ||
              ArrayBuffer.isView(buffer),
          );
          var data = buffer.subarray(offset, offset + length);
          var dataLen = data.byteLength;
          if (dataLen <= 0) {
            return 0;
          }
          var currBucket = null;
          if (pipe.buckets.length == 0) {
            currBucket = {
              buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE),
              offset: 0,
              roffset: 0,
            };
            pipe.buckets.push(currBucket);
          } else {
            currBucket = pipe.buckets[pipe.buckets.length - 1];
          }
          assert(currBucket.offset <= PIPEFS.BUCKET_BUFFER_SIZE);
          var freeBytesInCurrBuffer = PIPEFS.BUCKET_BUFFER_SIZE - currBucket.offset;
          if (freeBytesInCurrBuffer >= dataLen) {
            currBucket.buffer.set(data, currBucket.offset);
            currBucket.offset += dataLen;
            return dataLen;
          } else if (freeBytesInCurrBuffer > 0) {
            currBucket.buffer.set(data.subarray(0, freeBytesInCurrBuffer), currBucket.offset);
            currBucket.offset += freeBytesInCurrBuffer;
            data = data.subarray(freeBytesInCurrBuffer, data.byteLength);
          }
          var numBuckets = (data.byteLength / PIPEFS.BUCKET_BUFFER_SIZE) | 0;
          var remElements = data.byteLength % PIPEFS.BUCKET_BUFFER_SIZE;
          for (var i = 0; i < numBuckets; i++) {
            var newBucket = {
              buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE),
              offset: PIPEFS.BUCKET_BUFFER_SIZE,
              roffset: 0,
            };
            pipe.buckets.push(newBucket);
            newBucket.buffer.set(data.subarray(0, PIPEFS.BUCKET_BUFFER_SIZE));
            data = data.subarray(PIPEFS.BUCKET_BUFFER_SIZE, data.byteLength);
          }
          if (remElements > 0) {
            var newBucket = {
              buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE),
              offset: data.byteLength,
              roffset: 0,
            };
            pipe.buckets.push(newBucket);
            newBucket.buffer.set(data);
          }
          return dataLen;
        },
        close: function (stream) {
          var pipe = stream.node.pipe;
          pipe.buckets = null;
        },
      },
      nextname: function () {
        if (!PIPEFS.nextname.current) {
          PIPEFS.nextname.current = 0;
        }
        return 'pipe[' + PIPEFS.nextname.current++ + ']';
      },
    };
    function ___sys_pipe(fdPtr) {
      if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(16, 1, fdPtr);
      try {
        if (fdPtr == 0) {
          throw new FS.ErrnoError(21);
        }
        var res = PIPEFS.createPipe();
        HEAP32[fdPtr >> 2] = res.readable_fd;
        HEAP32[(fdPtr + 4) >> 2] = res.writable_fd;
        return 0;
      } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
    }
    function ___sys_pipe2(fds, flags) {
      return -52;
    }
    function ___sys_poll(fds, nfds, timeout) {
      if (ENVIRONMENT_IS_PTHREAD)
        return _emscripten_proxy_to_main_thread_js(17, 1, fds, nfds, timeout);
      try {
        var nonzero = 0;
        for (var i = 0; i < nfds; i++) {
          var pollfd = fds + 8 * i;
          var fd = HEAP32[pollfd >> 2];
          var events = HEAP16[(pollfd + 4) >> 1];
          var mask = 32;
          var stream = FS.getStream(fd);
          if (stream) {
            mask = SYSCALLS.DEFAULT_POLLMASK;
            if (stream.stream_ops.poll) {
              mask = stream.stream_ops.poll(stream);
            }
          }
          mask &= events | 8 | 16;
          if (mask) nonzero++;
          HEAP16[(pollfd + 6) >> 1] = mask;
        }
        return nonzero;
      } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
    }
    function ___sys_read(fd, buf, count) {
      if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(18, 1, fd, buf, count);
      try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        return FS.read(stream, HEAP8, buf, count);
      } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
    }
    function ___sys_readlink(path, buf, bufsize) {
      if (ENVIRONMENT_IS_PTHREAD)
        return _emscripten_proxy_to_main_thread_js(19, 1, path, buf, bufsize);
      try {
        path = SYSCALLS.getStr(path);
        return SYSCALLS.doReadlink(path, buf, bufsize);
      } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
    }
    function ___sys_rmdir(path) {
      if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(20, 1, path);
      try {
        path = SYSCALLS.getStr(path);
        FS.rmdir(path);
        return 0;
      } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
    }
    function ___sys_stat64(path, buf) {
      if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(21, 1, path, buf);
      try {
        path = SYSCALLS.getStr(path);
        return SYSCALLS.doStat(FS.stat, path, buf);
      } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
    }
    function ___sys_unlink(path) {
      if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(22, 1, path);
      try {
        path = SYSCALLS.getStr(path);
        FS.unlink(path);
        return 0;
      } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
    }
    function ___sys_wait4(pid, wstart, options, rusage) {
      try {
        abort('cannot wait on child processes');
      } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
    }
    var structRegistrations = {};
    function runDestructors(destructors) {
      while (destructors.length) {
        var ptr = destructors.pop();
        var del = destructors.pop();
        del(ptr);
      }
    }
    function simpleReadValueFromPointer(pointer) {
      return this['fromWireType'](HEAPU32[pointer >> 2]);
    }
    var awaitingDependencies = {};
    var registeredTypes = {};
    var typeDependencies = {};
    var char_0 = 48;
    var char_9 = 57;
    function makeLegalFunctionName(name) {
      if (undefined === name) {
        return '_unknown';
      }
      name = name.replace(/[^a-zA-Z0-9_]/g, '$');
      var f = name.charCodeAt(0);
      if (f >= char_0 && f <= char_9) {
        return '_' + name;
      } else {
        return name;
      }
    }
    function createNamedFunction(name, body) {
      name = makeLegalFunctionName(name);
      return new Function(
        'body',
        'return function ' +
          name +
          '() {\n' +
          '    "use strict";' +
          '    return body.apply(this, arguments);\n' +
          '};\n',
      )(body);
    }
    function extendError(baseErrorType, errorName) {
      var errorClass = createNamedFunction(errorName, function (message) {
        this.name = errorName;
        this.message = message;
        var stack = new Error(message).stack;
        if (stack !== undefined) {
          this.stack = this.toString() + '\n' + stack.replace(/^Error(:[^\n]*)?\n/, '');
        }
      });
      errorClass.prototype = Object.create(baseErrorType.prototype);
      errorClass.prototype.constructor = errorClass;
      errorClass.prototype.toString = function () {
        if (this.message === undefined) {
          return this.name;
        } else {
          return this.name + ': ' + this.message;
        }
      };
      return errorClass;
    }
    var InternalError = undefined;
    function throwInternalError(message) {
      throw new InternalError(message);
    }
    function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
      myTypes.forEach(function (type) {
        typeDependencies[type] = dependentTypes;
      });
      function onComplete(typeConverters) {
        var myTypeConverters = getTypeConverters(typeConverters);
        if (myTypeConverters.length !== myTypes.length) {
          throwInternalError('Mismatched type converter count');
        }
        for (var i = 0; i < myTypes.length; ++i) {
          registerType(myTypes[i], myTypeConverters[i]);
        }
      }
      var typeConverters = new Array(dependentTypes.length);
      var unregisteredTypes = [];
      var registered = 0;
      dependentTypes.forEach(function (dt, i) {
        if (registeredTypes.hasOwnProperty(dt)) {
          typeConverters[i] = registeredTypes[dt];
        } else {
          unregisteredTypes.push(dt);
          if (!awaitingDependencies.hasOwnProperty(dt)) {
            awaitingDependencies[dt] = [];
          }
          awaitingDependencies[dt].push(function () {
            typeConverters[i] = registeredTypes[dt];
            ++registered;
            if (registered === unregisteredTypes.length) {
              onComplete(typeConverters);
            }
          });
        }
      });
      if (0 === unregisteredTypes.length) {
        onComplete(typeConverters);
      }
    }
    function __embind_finalize_value_object(structType) {
      var reg = structRegistrations[structType];
      delete structRegistrations[structType];
      var rawConstructor = reg.rawConstructor;
      var rawDestructor = reg.rawDestructor;
      var fieldRecords = reg.fields;
      var fieldTypes = fieldRecords
        .map(function (field) {
          return field.getterReturnType;
        })
        .concat(
          fieldRecords.map(function (field) {
            return field.setterArgumentType;
          }),
        );
      whenDependentTypesAreResolved([structType], fieldTypes, function (fieldTypes) {
        var fields = {};
        fieldRecords.forEach(function (field, i) {
          var fieldName = field.fieldName;
          var getterReturnType = fieldTypes[i];
          var getter = field.getter;
          var getterContext = field.getterContext;
          var setterArgumentType = fieldTypes[i + fieldRecords.length];
          var setter = field.setter;
          var setterContext = field.setterContext;
          fields[fieldName] = {
            read: function (ptr) {
              return getterReturnType['fromWireType'](getter(getterContext, ptr));
            },
            write: function (ptr, o) {
              var destructors = [];
              setter(setterContext, ptr, setterArgumentType['toWireType'](destructors, o));
              runDestructors(destructors);
            },
          };
        });
        return [
          {
            name: reg.name,
            fromWireType: function (ptr) {
              var rv = {};
              for (var i in fields) {
                rv[i] = fields[i].read(ptr);
              }
              rawDestructor(ptr);
              return rv;
            },
            toWireType: function (destructors, o) {
              for (var fieldName in fields) {
                if (!(fieldName in o)) {
                  throw new TypeError('Missing field:  "' + fieldName + '"');
                }
              }
              var ptr = rawConstructor();
              for (fieldName in fields) {
                fields[fieldName].write(ptr, o[fieldName]);
              }
              if (destructors !== null) {
                destructors.push(rawDestructor, ptr);
              }
              return ptr;
            },
            argPackAdvance: 8,
            readValueFromPointer: simpleReadValueFromPointer,
            destructorFunction: rawDestructor,
          },
        ];
      });
    }
    function embind_init_charCodes() {
      var codes = new Array(256);
      for (var i = 0; i < 256; ++i) {
        codes[i] = String.fromCharCode(i);
      }
      embind_charCodes = codes;
    }
    var embind_charCodes = undefined;
    function readLatin1String(ptr) {
      var ret = '';
      var c = ptr;
      while (HEAPU8[c]) {
        ret += embind_charCodes[HEAPU8[c++]];
      }
      return ret;
    }
    var BindingError = undefined;
    function throwBindingError(message) {
      throw new BindingError(message);
    }
    function registerType(rawType, registeredInstance, options) {
      options = options || {};
      if (!('argPackAdvance' in registeredInstance)) {
        throw new TypeError('registerType registeredInstance requires argPackAdvance');
      }
      var name = registeredInstance.name;
      if (!rawType) {
        throwBindingError('type "' + name + '" must have a positive integer typeid pointer');
      }
      if (registeredTypes.hasOwnProperty(rawType)) {
        if (options.ignoreDuplicateRegistrations) {
          return;
        } else {
          throwBindingError("Cannot register type '" + name + "' twice");
        }
      }
      registeredTypes[rawType] = registeredInstance;
      delete typeDependencies[rawType];
      if (awaitingDependencies.hasOwnProperty(rawType)) {
        var callbacks = awaitingDependencies[rawType];
        delete awaitingDependencies[rawType];
        callbacks.forEach(function (cb) {
          cb();
        });
      }
    }
    function getShiftFromSize(size) {
      switch (size) {
        case 1:
          return 0;
        case 2:
          return 1;
        case 4:
          return 2;
        case 8:
          return 3;
        default:
          throw new TypeError('Unknown type size: ' + size);
      }
    }
    function getFloatHeap(name, shift) {
      switch (shift) {
        case 2:
          return function () {
            return HEAPF32;
          };
        case 3:
          return function () {
            return HEAPF64;
          };
        default:
          throw new TypeError('Unknown float type: ' + name);
      }
    }
    function getIntegerHeap(name, shift, signed) {
      switch (shift) {
        case 0:
          return signed
            ? function heapS8() {
                return HEAP8;
              }
            : function headU8() {
                return HEAPU8;
              };
        case 1:
          return signed
            ? function heapS16() {
                return HEAP16;
              }
            : function heapU16() {
                return HEAPU16;
              };
        case 2:
          return signed
            ? function heapS32() {
                return HEAP32;
              }
            : function headU32() {
                return HEAPU32;
              };
        default:
          throw new TypeError('Unknown integer type: ' + name);
      }
    }
    function __embind_register_arithmetic_vector(rawType, name, size, isfloat, signed) {
      name = readLatin1String(name);
      var shift = getShiftFromSize(size);
      var getHeap = isfloat ? getFloatHeap(name, shift) : getIntegerHeap(name, shift, signed);
      registerType(rawType, {
        name: name,
        fromWireType: function (value) {
          var length = HEAPU32[value >> 2];
          var HEAP = getHeap();
          var a = new Array(length);
          var firstElement = value + size;
          for (var i = 0; i < length; ++i) {
            a[i] = HEAP[(firstElement >> shift) + i];
          }
          _free(value);
          return a;
        },
        toWireType: function (destructors, value) {
          if (typeof value == 'number') {
            value = [value];
          }
          if (!Array.isArray(value)) {
            throwBindingError('Cannot pass non-array to C++ vector type ' + name);
          }
          value = Array.prototype.concat.apply([], value);
          var length = value.length;
          var HEAP = getHeap();
          var ptr = _malloc(size + length * size);
          HEAPU32[ptr >> 2] = length;
          var firstElement = ptr + size;
          for (var i = 0; i < length; ++i) {
            HEAP[(firstElement >> shift) + i] = value[i];
          }
          if (destructors !== null) {
            destructors.push(_free, ptr);
          }
          return ptr;
        },
        argPackAdvance: 8,
        readValueFromPointer: simpleReadValueFromPointer,
        destructorFunction: function (ptr) {
          _free(ptr);
        },
      });
    }
    function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
      var shift = getShiftFromSize(size);
      name = readLatin1String(name);
      registerType(rawType, {
        name: name,
        fromWireType: function (wt) {
          return !!wt;
        },
        toWireType: function (destructors, o) {
          return o ? trueValue : falseValue;
        },
        argPackAdvance: 8,
        readValueFromPointer: function (pointer) {
          var heap;
          if (size === 1) {
            heap = HEAP8;
          } else if (size === 2) {
            heap = HEAP16;
          } else if (size === 4) {
            heap = HEAP32;
          } else {
            throw new TypeError('Unknown boolean type size: ' + name);
          }
          return this['fromWireType'](heap[pointer >> shift]);
        },
        destructorFunction: null,
      });
    }
    function ClassHandle_isAliasOf(other) {
      if (!(this instanceof ClassHandle)) {
        return false;
      }
      if (!(other instanceof ClassHandle)) {
        return false;
      }
      var leftClass = this.$$.ptrType.registeredClass;
      var left = this.$$.ptr;
      var rightClass = other.$$.ptrType.registeredClass;
      var right = other.$$.ptr;
      while (leftClass.baseClass) {
        left = leftClass.upcast(left);
        leftClass = leftClass.baseClass;
      }
      while (rightClass.baseClass) {
        right = rightClass.upcast(right);
        rightClass = rightClass.baseClass;
      }
      return leftClass === rightClass && left === right;
    }
    function shallowCopyInternalPointer(o) {
      return {
        count: o.count,
        deleteScheduled: o.deleteScheduled,
        preservePointerOnDelete: o.preservePointerOnDelete,
        ptr: o.ptr,
        ptrType: o.ptrType,
        smartPtr: o.smartPtr,
        smartPtrType: o.smartPtrType,
      };
    }
    function throwInstanceAlreadyDeleted(obj) {
      function getInstanceTypeName(handle) {
        return handle.$$.ptrType.registeredClass.name;
      }
      throwBindingError(getInstanceTypeName(obj) + ' instance already deleted');
    }
    var finalizationGroup = false;
    function detachFinalizer(handle) {}
    function runDestructor($$) {
      if ($$.smartPtr) {
        $$.smartPtrType.rawDestructor($$.smartPtr);
      } else {
        $$.ptrType.registeredClass.rawDestructor($$.ptr);
      }
    }
    function releaseClassHandle($$) {
      $$.count.value -= 1;
      var toDelete = 0 === $$.count.value;
      if (toDelete) {
        runDestructor($$);
      }
    }
    function attachFinalizer(handle) {
      if (Module['EMBIND_AUTOMATIC_DELETELATER']) {
        attachFinalizer = function (handle) {
          return handle['deleteLater']();
        };
        return attachFinalizer(handle);
      } else if ('undefined' === typeof FinalizationGroup) {
        attachFinalizer = function (handle) {
          return handle;
        };
        return handle;
      }
      finalizationGroup = new FinalizationGroup(function (iter) {
        for (var result = iter.next(); !result.done; result = iter.next()) {
          var $$ = result.value;
          if (!$$.ptr) {
            console.warn('object already deleted: ' + $$.ptr);
          } else {
            releaseClassHandle($$);
          }
        }
      });
      attachFinalizer = function (handle) {
        finalizationGroup.register(handle, handle.$$, handle.$$);
        return handle;
      };
      detachFinalizer = function (handle) {
        finalizationGroup.unregister(handle.$$);
      };
      return attachFinalizer(handle);
    }
    function ClassHandle_clone() {
      if (!this.$$.ptr) {
        throwInstanceAlreadyDeleted(this);
      }
      if (this.$$.preservePointerOnDelete) {
        this.$$.count.value += 1;
        return this;
      } else {
        var clone = attachFinalizer(
          Object.create(Object.getPrototypeOf(this), {
            $$: { value: shallowCopyInternalPointer(this.$$) },
          }),
        );
        clone.$$.count.value += 1;
        clone.$$.deleteScheduled = false;
        return clone;
      }
    }
    function ClassHandle_delete() {
      if (!this.$$.ptr) {
        throwInstanceAlreadyDeleted(this);
      }
      if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
        throwBindingError('Object already scheduled for deletion');
      }
      detachFinalizer(this);
      releaseClassHandle(this.$$);
      if (!this.$$.preservePointerOnDelete) {
        this.$$.smartPtr = undefined;
        this.$$.ptr = undefined;
      }
    }
    function ClassHandle_isDeleted() {
      return !this.$$.ptr;
    }
    var delayFunction = undefined;
    var deletionQueue = [];
    function flushPendingDeletes() {
      while (deletionQueue.length) {
        var obj = deletionQueue.pop();
        obj.$$.deleteScheduled = false;
        obj['delete']();
      }
    }
    function ClassHandle_deleteLater() {
      if (!this.$$.ptr) {
        throwInstanceAlreadyDeleted(this);
      }
      if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
        throwBindingError('Object already scheduled for deletion');
      }
      deletionQueue.push(this);
      if (deletionQueue.length === 1 && delayFunction) {
        delayFunction(flushPendingDeletes);
      }
      this.$$.deleteScheduled = true;
      return this;
    }
    function init_ClassHandle() {
      ClassHandle.prototype['isAliasOf'] = ClassHandle_isAliasOf;
      ClassHandle.prototype['clone'] = ClassHandle_clone;
      ClassHandle.prototype['delete'] = ClassHandle_delete;
      ClassHandle.prototype['isDeleted'] = ClassHandle_isDeleted;
      ClassHandle.prototype['deleteLater'] = ClassHandle_deleteLater;
    }
    function ClassHandle() {}
    var registeredPointers = {};
    function ensureOverloadTable(proto, methodName, humanName) {
      if (undefined === proto[methodName].overloadTable) {
        var prevFunc = proto[methodName];
        proto[methodName] = function () {
          if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
            throwBindingError(
              "Function '" +
                humanName +
                "' called with an invalid number of arguments (" +
                arguments.length +
                ') - expects one of (' +
                proto[methodName].overloadTable +
                ')!',
            );
          }
          return proto[methodName].overloadTable[arguments.length].apply(this, arguments);
        };
        proto[methodName].overloadTable = [];
        proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
      }
    }
    function exposePublicSymbol(name, value, numArguments) {
      if (Module.hasOwnProperty(name)) {
        if (
          undefined === numArguments ||
          (undefined !== Module[name].overloadTable &&
            undefined !== Module[name].overloadTable[numArguments])
        ) {
          throwBindingError("Cannot register public name '" + name + "' twice");
        }
        ensureOverloadTable(Module, name, name);
        if (Module.hasOwnProperty(numArguments)) {
          throwBindingError(
            'Cannot register multiple overloads of a function with the same number of arguments (' +
              numArguments +
              ')!',
          );
        }
        Module[name].overloadTable[numArguments] = value;
      } else {
        Module[name] = value;
        if (undefined !== numArguments) {
          Module[name].numArguments = numArguments;
        }
      }
    }
    function RegisteredClass(
      name,
      constructor,
      instancePrototype,
      rawDestructor,
      baseClass,
      getActualType,
      upcast,
      downcast,
    ) {
      this.name = name;
      this.constructor = constructor;
      this.instancePrototype = instancePrototype;
      this.rawDestructor = rawDestructor;
      this.baseClass = baseClass;
      this.getActualType = getActualType;
      this.upcast = upcast;
      this.downcast = downcast;
      this.pureVirtualFunctions = [];
    }
    function upcastPointer(ptr, ptrClass, desiredClass) {
      while (ptrClass !== desiredClass) {
        if (!ptrClass.upcast) {
          throwBindingError(
            'Expected null or instance of ' +
              desiredClass.name +
              ', got an instance of ' +
              ptrClass.name,
          );
        }
        ptr = ptrClass.upcast(ptr);
        ptrClass = ptrClass.baseClass;
      }
      return ptr;
    }
    function constNoSmartPtrRawPointerToWireType(destructors, handle) {
      if (handle === null) {
        if (this.isReference) {
          throwBindingError('null is not a valid ' + this.name);
        }
        return 0;
      }
      if (!handle.$$) {
        throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
      }
      if (!handle.$$.ptr) {
        throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
      }
      var handleClass = handle.$$.ptrType.registeredClass;
      var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
      return ptr;
    }
    function genericPointerToWireType(destructors, handle) {
      var ptr;
      if (handle === null) {
        if (this.isReference) {
          throwBindingError('null is not a valid ' + this.name);
        }
        if (this.isSmartPointer) {
          ptr = this.rawConstructor();
          if (destructors !== null) {
            destructors.push(this.rawDestructor, ptr);
          }
          return ptr;
        } else {
          return 0;
        }
      }
      if (!handle.$$) {
        throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
      }
      if (!handle.$$.ptr) {
        throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
      }
      if (!this.isConst && handle.$$.ptrType.isConst) {
        throwBindingError(
          'Cannot convert argument of type ' +
            (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) +
            ' to parameter type ' +
            this.name,
        );
      }
      var handleClass = handle.$$.ptrType.registeredClass;
      ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
      if (this.isSmartPointer) {
        if (undefined === handle.$$.smartPtr) {
          throwBindingError('Passing raw pointer to smart pointer is illegal');
        }
        switch (this.sharingPolicy) {
          case 0:
            if (handle.$$.smartPtrType === this) {
              ptr = handle.$$.smartPtr;
            } else {
              throwBindingError(
                'Cannot convert argument of type ' +
                  (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) +
                  ' to parameter type ' +
                  this.name,
              );
            }
            break;
          case 1:
            ptr = handle.$$.smartPtr;
            break;
          case 2:
            if (handle.$$.smartPtrType === this) {
              ptr = handle.$$.smartPtr;
            } else {
              var clonedHandle = handle['clone']();
              ptr = this.rawShare(
                ptr,
                __emval_register(function () {
                  clonedHandle['delete']();
                }),
              );
              if (destructors !== null) {
                destructors.push(this.rawDestructor, ptr);
              }
            }
            break;
          default:
            throwBindingError('Unsupporting sharing policy');
        }
      }
      return ptr;
    }
    function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
      if (handle === null) {
        if (this.isReference) {
          throwBindingError('null is not a valid ' + this.name);
        }
        return 0;
      }
      if (!handle.$$) {
        throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
      }
      if (!handle.$$.ptr) {
        throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
      }
      if (handle.$$.ptrType.isConst) {
        throwBindingError(
          'Cannot convert argument of type ' +
            handle.$$.ptrType.name +
            ' to parameter type ' +
            this.name,
        );
      }
      var handleClass = handle.$$.ptrType.registeredClass;
      var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
      return ptr;
    }
    function RegisteredPointer_getPointee(ptr) {
      if (this.rawGetPointee) {
        ptr = this.rawGetPointee(ptr);
      }
      return ptr;
    }
    function RegisteredPointer_destructor(ptr) {
      if (this.rawDestructor) {
        this.rawDestructor(ptr);
      }
    }
    function RegisteredPointer_deleteObject(handle) {
      if (handle !== null) {
        handle['delete']();
      }
    }
    function downcastPointer(ptr, ptrClass, desiredClass) {
      if (ptrClass === desiredClass) {
        return ptr;
      }
      if (undefined === desiredClass.baseClass) {
        return null;
      }
      var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
      if (rv === null) {
        return null;
      }
      return desiredClass.downcast(rv);
    }
    function getInheritedInstanceCount() {
      return Object.keys(registeredInstances).length;
    }
    function getLiveInheritedInstances() {
      var rv = [];
      for (var k in registeredInstances) {
        if (registeredInstances.hasOwnProperty(k)) {
          rv.push(registeredInstances[k]);
        }
      }
      return rv;
    }
    function setDelayFunction(fn) {
      delayFunction = fn;
      if (deletionQueue.length && delayFunction) {
        delayFunction(flushPendingDeletes);
      }
    }
    function init_embind() {
      Module['getInheritedInstanceCount'] = getInheritedInstanceCount;
      Module['getLiveInheritedInstances'] = getLiveInheritedInstances;
      Module['flushPendingDeletes'] = flushPendingDeletes;
      Module['setDelayFunction'] = setDelayFunction;
    }
    var registeredInstances = {};
    function getBasestPointer(class_, ptr) {
      if (ptr === undefined) {
        throwBindingError('ptr should not be undefined');
      }
      while (class_.baseClass) {
        ptr = class_.upcast(ptr);
        class_ = class_.baseClass;
      }
      return ptr;
    }
    function getInheritedInstance(class_, ptr) {
      ptr = getBasestPointer(class_, ptr);
      return registeredInstances[ptr];
    }
    function makeClassHandle(prototype, record) {
      if (!record.ptrType || !record.ptr) {
        throwInternalError('makeClassHandle requires ptr and ptrType');
      }
      var hasSmartPtrType = !!record.smartPtrType;
      var hasSmartPtr = !!record.smartPtr;
      if (hasSmartPtrType !== hasSmartPtr) {
        throwInternalError('Both smartPtrType and smartPtr must be specified');
      }
      record.count = { value: 1 };
      return attachFinalizer(Object.create(prototype, { $$: { value: record } }));
    }
    function RegisteredPointer_fromWireType(ptr) {
      var rawPointer = this.getPointee(ptr);
      if (!rawPointer) {
        this.destructor(ptr);
        return null;
      }
      var registeredInstance = getInheritedInstance(this.registeredClass, rawPointer);
      if (undefined !== registeredInstance) {
        if (0 === registeredInstance.$$.count.value) {
          registeredInstance.$$.ptr = rawPointer;
          registeredInstance.$$.smartPtr = ptr;
          return registeredInstance['clone']();
        } else {
          var rv = registeredInstance['clone']();
          this.destructor(ptr);
          return rv;
        }
      }
      function makeDefaultHandle() {
        if (this.isSmartPointer) {
          return makeClassHandle(this.registeredClass.instancePrototype, {
            ptrType: this.pointeeType,
            ptr: rawPointer,
            smartPtrType: this,
            smartPtr: ptr,
          });
        } else {
          return makeClassHandle(this.registeredClass.instancePrototype, {
            ptrType: this,
            ptr: ptr,
          });
        }
      }
      var actualType = this.registeredClass.getActualType(rawPointer);
      var registeredPointerRecord = registeredPointers[actualType];
      if (!registeredPointerRecord) {
        return makeDefaultHandle.call(this);
      }
      var toType;
      if (this.isConst) {
        toType = registeredPointerRecord.constPointerType;
      } else {
        toType = registeredPointerRecord.pointerType;
      }
      var dp = downcastPointer(rawPointer, this.registeredClass, toType.registeredClass);
      if (dp === null) {
        return makeDefaultHandle.call(this);
      }
      if (this.isSmartPointer) {
        return makeClassHandle(toType.registeredClass.instancePrototype, {
          ptrType: toType,
          ptr: dp,
          smartPtrType: this,
          smartPtr: ptr,
        });
      } else {
        return makeClassHandle(toType.registeredClass.instancePrototype, {
          ptrType: toType,
          ptr: dp,
        });
      }
    }
    function init_RegisteredPointer() {
      RegisteredPointer.prototype.getPointee = RegisteredPointer_getPointee;
      RegisteredPointer.prototype.destructor = RegisteredPointer_destructor;
      RegisteredPointer.prototype['argPackAdvance'] = 8;
      RegisteredPointer.prototype['readValueFromPointer'] = simpleReadValueFromPointer;
      RegisteredPointer.prototype['deleteObject'] = RegisteredPointer_deleteObject;
      RegisteredPointer.prototype['fromWireType'] = RegisteredPointer_fromWireType;
    }
    function RegisteredPointer(
      name,
      registeredClass,
      isReference,
      isConst,
      isSmartPointer,
      pointeeType,
      sharingPolicy,
      rawGetPointee,
      rawConstructor,
      rawShare,
      rawDestructor,
    ) {
      this.name = name;
      this.registeredClass = registeredClass;
      this.isReference = isReference;
      this.isConst = isConst;
      this.isSmartPointer = isSmartPointer;
      this.pointeeType = pointeeType;
      this.sharingPolicy = sharingPolicy;
      this.rawGetPointee = rawGetPointee;
      this.rawConstructor = rawConstructor;
      this.rawShare = rawShare;
      this.rawDestructor = rawDestructor;
      if (!isSmartPointer && registeredClass.baseClass === undefined) {
        if (isConst) {
          this['toWireType'] = constNoSmartPtrRawPointerToWireType;
          this.destructorFunction = null;
        } else {
          this['toWireType'] = nonConstNoSmartPtrRawPointerToWireType;
          this.destructorFunction = null;
        }
      } else {
        this['toWireType'] = genericPointerToWireType;
      }
    }
    function replacePublicSymbol(name, value, numArguments) {
      if (!Module.hasOwnProperty(name)) {
        throwInternalError('Replacing nonexistant public symbol');
      }
      if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
        Module[name].overloadTable[numArguments] = value;
      } else {
        Module[name] = value;
        Module[name].argCount = numArguments;
      }
    }
    function getDynCaller(sig, ptr) {
      assert(sig.indexOf('j') >= 0, 'getDynCaller should only be called with i64 sigs');
      var argCache = [];
      return function () {
        argCache.length = arguments.length;
        for (var i = 0; i < arguments.length; i++) {
          argCache[i] = arguments[i];
        }
        return dynCall(sig, ptr, argCache);
      };
    }
    function embind__requireFunction(signature, rawFunction) {
      signature = readLatin1String(signature);
      function makeDynCaller() {
        if (signature.indexOf('j') == -1) {
          return wasmTable.get(rawFunction);
        }
        return getDynCaller(signature, rawFunction);
      }
      var fp = makeDynCaller();
      if (typeof fp !== 'function') {
        throwBindingError(
          'unknown function pointer with signature ' + signature + ': ' + rawFunction,
        );
      }
      return fp;
    }
    var UnboundTypeError = undefined;
    function getTypeName(type) {
      var ptr = ___getTypeName(type);
      var rv = readLatin1String(ptr);
      _free(ptr);
      return rv;
    }
    function throwUnboundTypeError(message, types) {
      var unboundTypes = [];
      var seen = {};
      function visit(type) {
        if (seen[type]) {
          return;
        }
        if (registeredTypes[type]) {
          return;
        }
        if (typeDependencies[type]) {
          typeDependencies[type].forEach(visit);
          return;
        }
        unboundTypes.push(type);
        seen[type] = true;
      }
      types.forEach(visit);
      throw new UnboundTypeError(message + ': ' + unboundTypes.map(getTypeName).join([', ']));
    }
    function __embind_register_class(
      rawType,
      rawPointerType,
      rawConstPointerType,
      baseClassRawType,
      getActualTypeSignature,
      getActualType,
      upcastSignature,
      upcast,
      downcastSignature,
      downcast,
      name,
      destructorSignature,
      rawDestructor,
    ) {
      name = readLatin1String(name);
      getActualType = embind__requireFunction(getActualTypeSignature, getActualType);
      if (upcast) {
        upcast = embind__requireFunction(upcastSignature, upcast);
      }
      if (downcast) {
        downcast = embind__requireFunction(downcastSignature, downcast);
      }
      rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
      var legalFunctionName = makeLegalFunctionName(name);
      exposePublicSymbol(legalFunctionName, function () {
        throwUnboundTypeError('Cannot construct ' + name + ' due to unbound types', [
          baseClassRawType,
        ]);
      });
      whenDependentTypesAreResolved(
        [rawType, rawPointerType, rawConstPointerType],
        baseClassRawType ? [baseClassRawType] : [],
        function (base) {
          base = base[0];
          var baseClass;
          var basePrototype;
          if (baseClassRawType) {
            baseClass = base.registeredClass;
            basePrototype = baseClass.instancePrototype;
          } else {
            basePrototype = ClassHandle.prototype;
          }
          var constructor = createNamedFunction(legalFunctionName, function () {
            if (Object.getPrototypeOf(this) !== instancePrototype) {
              throw new BindingError("Use 'new' to construct " + name);
            }
            if (undefined === registeredClass.constructor_body) {
              throw new BindingError(name + ' has no accessible constructor');
            }
            var body = registeredClass.constructor_body[arguments.length];
            if (undefined === body) {
              throw new BindingError(
                'Tried to invoke ctor of ' +
                  name +
                  ' with invalid number of parameters (' +
                  arguments.length +
                  ') - expected (' +
                  Object.keys(registeredClass.constructor_body).toString() +
                  ') parameters instead!',
              );
            }
            return body.apply(this, arguments);
          });
          var instancePrototype = Object.create(basePrototype, {
            constructor: { value: constructor },
          });
          constructor.prototype = instancePrototype;
          var registeredClass = new RegisteredClass(
            name,
            constructor,
            instancePrototype,
            rawDestructor,
            baseClass,
            getActualType,
            upcast,
            downcast,
          );
          var referenceConverter = new RegisteredPointer(name, registeredClass, true, false, false);
          var pointerConverter = new RegisteredPointer(
            name + '*',
            registeredClass,
            false,
            false,
            false,
          );
          var constPointerConverter = new RegisteredPointer(
            name + ' const*',
            registeredClass,
            false,
            true,
            false,
          );
          registeredPointers[rawType] = {
            pointerType: pointerConverter,
            constPointerType: constPointerConverter,
          };
          replacePublicSymbol(legalFunctionName, constructor);
          return [referenceConverter, pointerConverter, constPointerConverter];
        },
      );
    }
    function new_(constructor, argumentList) {
      if (!(constructor instanceof Function)) {
        throw new TypeError(
          'new_ called with constructor type ' + typeof constructor + ' which is not a function',
        );
      }
      var dummy = createNamedFunction(constructor.name || 'unknownFunctionName', function () {});
      dummy.prototype = constructor.prototype;
      var obj = new dummy();
      var r = constructor.apply(obj, argumentList);
      return r instanceof Object ? r : obj;
    }
    function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
      var argCount = argTypes.length;
      if (argCount < 2) {
        throwBindingError(
          "argTypes array size mismatch! Must at least get return value and 'this' types!",
        );
      }
      var isClassMethodFunc = argTypes[1] !== null && classType !== null;
      var needsDestructorStack = false;
      for (var i = 1; i < argTypes.length; ++i) {
        if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) {
          needsDestructorStack = true;
          break;
        }
      }
      var returns = argTypes[0].name !== 'void';
      var argsList = '';
      var argsListWired = '';
      for (var i = 0; i < argCount - 2; ++i) {
        argsList += (i !== 0 ? ', ' : '') + 'arg' + i;
        argsListWired += (i !== 0 ? ', ' : '') + 'arg' + i + 'Wired';
      }
      var invokerFnBody =
        'return function ' +
        makeLegalFunctionName(humanName) +
        '(' +
        argsList +
        ') {\n' +
        'if (arguments.length !== ' +
        (argCount - 2) +
        ') {\n' +
        "throwBindingError('function " +
        humanName +
        " called with ' + arguments.length + ' arguments, expected " +
        (argCount - 2) +
        " args!');\n" +
        '}\n';
      if (needsDestructorStack) {
        invokerFnBody += 'var destructors = [];\n';
      }
      var dtorStack = needsDestructorStack ? 'destructors' : 'null';
      var args1 = ['throwBindingError', 'invoker', 'fn', 'runDestructors', 'retType', 'classParam'];
      var args2 = [
        throwBindingError,
        cppInvokerFunc,
        cppTargetFunc,
        runDestructors,
        argTypes[0],
        argTypes[1],
      ];
      if (isClassMethodFunc) {
        invokerFnBody += 'var thisWired = classParam.toWireType(' + dtorStack + ', this);\n';
      }
      for (var i = 0; i < argCount - 2; ++i) {
        invokerFnBody +=
          'var arg' +
          i +
          'Wired = argType' +
          i +
          '.toWireType(' +
          dtorStack +
          ', arg' +
          i +
          '); // ' +
          argTypes[i + 2].name +
          '\n';
        args1.push('argType' + i);
        args2.push(argTypes[i + 2]);
      }
      if (isClassMethodFunc) {
        argsListWired = 'thisWired' + (argsListWired.length > 0 ? ', ' : '') + argsListWired;
      }
      invokerFnBody +=
        (returns ? 'var rv = ' : '') +
        'invoker(fn' +
        (argsListWired.length > 0 ? ', ' : '') +
        argsListWired +
        ');\n';
      if (needsDestructorStack) {
        invokerFnBody += 'runDestructors(destructors);\n';
      } else {
        for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
          var paramName = i === 1 ? 'thisWired' : 'arg' + (i - 2) + 'Wired';
          if (argTypes[i].destructorFunction !== null) {
            invokerFnBody += paramName + '_dtor(' + paramName + '); // ' + argTypes[i].name + '\n';
            args1.push(paramName + '_dtor');
            args2.push(argTypes[i].destructorFunction);
          }
        }
      }
      if (returns) {
        invokerFnBody += 'var ret = retType.fromWireType(rv);\n' + 'return ret;\n';
      } else {
      }
      invokerFnBody += '}\n';
      args1.push(invokerFnBody);
      var invokerFunction = new_(Function, args1).apply(null, args2);
      return invokerFunction;
    }
    function heap32VectorToArray(count, firstElement) {
      var array = [];
      for (var i = 0; i < count; i++) {
        array.push(HEAP32[(firstElement >> 2) + i]);
      }
      return array;
    }
    function __embind_register_class_class_function(
      rawClassType,
      methodName,
      argCount,
      rawArgTypesAddr,
      invokerSignature,
      rawInvoker,
      fn,
    ) {
      var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
      methodName = readLatin1String(methodName);
      rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
      whenDependentTypesAreResolved([], [rawClassType], function (classType) {
        classType = classType[0];
        var humanName = classType.name + '.' + methodName;
        function unboundTypesHandler() {
          throwUnboundTypeError('Cannot call ' + humanName + ' due to unbound types', rawArgTypes);
        }
        var proto = classType.registeredClass.constructor;
        if (undefined === proto[methodName]) {
          unboundTypesHandler.argCount = argCount - 1;
          proto[methodName] = unboundTypesHandler;
        } else {
          ensureOverloadTable(proto, methodName, humanName);
          proto[methodName].overloadTable[argCount - 1] = unboundTypesHandler;
        }
        whenDependentTypesAreResolved([], rawArgTypes, function (argTypes) {
          var invokerArgsArray = [argTypes[0], null].concat(argTypes.slice(1));
          var func = craftInvokerFunction(humanName, invokerArgsArray, null, rawInvoker, fn);
          if (undefined === proto[methodName].overloadTable) {
            func.argCount = argCount - 1;
            proto[methodName] = func;
          } else {
            proto[methodName].overloadTable[argCount - 1] = func;
          }
          return [];
        });
        return [];
      });
    }
    function __embind_register_class_constructor(
      rawClassType,
      argCount,
      rawArgTypesAddr,
      invokerSignature,
      invoker,
      rawConstructor,
    ) {
      assert(argCount > 0);
      var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
      invoker = embind__requireFunction(invokerSignature, invoker);
      var args = [rawConstructor];
      var destructors = [];
      whenDependentTypesAreResolved([], [rawClassType], function (classType) {
        classType = classType[0];
        var humanName = 'constructor ' + classType.name;
        if (undefined === classType.registeredClass.constructor_body) {
          classType.registeredClass.constructor_body = [];
        }
        if (undefined !== classType.registeredClass.constructor_body[argCount - 1]) {
          throw new BindingError(
            'Cannot register multiple constructors with identical number of parameters (' +
              (argCount - 1) +
              ") for class '" +
              classType.name +
              "'! Overload resolution is currently only performed using the parameter count, not actual type info!",
          );
        }
        classType.registeredClass.constructor_body[argCount - 1] = function unboundTypeHandler() {
          throwUnboundTypeError(
            'Cannot construct ' + classType.name + ' due to unbound types',
            rawArgTypes,
          );
        };
        whenDependentTypesAreResolved([], rawArgTypes, function (argTypes) {
          classType.registeredClass.constructor_body[argCount - 1] = function constructor_body() {
            if (arguments.length !== argCount - 1) {
              throwBindingError(
                humanName +
                  ' called with ' +
                  arguments.length +
                  ' arguments, expected ' +
                  (argCount - 1),
              );
            }
            destructors.length = 0;
            args.length = argCount;
            for (var i = 1; i < argCount; ++i) {
              args[i] = argTypes[i]['toWireType'](destructors, arguments[i - 1]);
            }
            var ptr = invoker.apply(null, args);
            runDestructors(destructors);
            return argTypes[0]['fromWireType'](ptr);
          };
          return [];
        });
        return [];
      });
    }
    function __embind_register_class_function(
      rawClassType,
      methodName,
      argCount,
      rawArgTypesAddr,
      invokerSignature,
      rawInvoker,
      context,
      isPureVirtual,
    ) {
      var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
      methodName = readLatin1String(methodName);
      rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
      whenDependentTypesAreResolved([], [rawClassType], function (classType) {
        classType = classType[0];
        var humanName = classType.name + '.' + methodName;
        if (isPureVirtual) {
          classType.registeredClass.pureVirtualFunctions.push(methodName);
        }
        function unboundTypesHandler() {
          throwUnboundTypeError('Cannot call ' + humanName + ' due to unbound types', rawArgTypes);
        }
        var proto = classType.registeredClass.instancePrototype;
        var method = proto[methodName];
        if (
          undefined === method ||
          (undefined === method.overloadTable &&
            method.className !== classType.name &&
            method.argCount === argCount - 2)
        ) {
          unboundTypesHandler.argCount = argCount - 2;
          unboundTypesHandler.className = classType.name;
          proto[methodName] = unboundTypesHandler;
        } else {
          ensureOverloadTable(proto, methodName, humanName);
          proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler;
        }
        whenDependentTypesAreResolved([], rawArgTypes, function (argTypes) {
          var memberFunction = craftInvokerFunction(
            humanName,
            argTypes,
            classType,
            rawInvoker,
            context,
          );
          if (undefined === proto[methodName].overloadTable) {
            memberFunction.argCount = argCount - 2;
            proto[methodName] = memberFunction;
          } else {
            proto[methodName].overloadTable[argCount - 2] = memberFunction;
          }
          return [];
        });
        return [];
      });
    }
    function validateThis(this_, classType, humanName) {
      if (!(this_ instanceof Object)) {
        throwBindingError(humanName + ' with invalid "this": ' + this_);
      }
      if (!(this_ instanceof classType.registeredClass.constructor)) {
        throwBindingError(
          humanName + ' incompatible with "this" of type ' + this_.constructor.name,
        );
      }
      if (!this_.$$.ptr) {
        throwBindingError(
          'cannot call emscripten binding method ' + humanName + ' on deleted object',
        );
      }
      return upcastPointer(
        this_.$$.ptr,
        this_.$$.ptrType.registeredClass,
        classType.registeredClass,
      );
    }
    function __embind_register_class_property(
      classType,
      fieldName,
      getterReturnType,
      getterSignature,
      getter,
      getterContext,
      setterArgumentType,
      setterSignature,
      setter,
      setterContext,
    ) {
      fieldName = readLatin1String(fieldName);
      getter = embind__requireFunction(getterSignature, getter);
      whenDependentTypesAreResolved([], [classType], function (classType) {
        classType = classType[0];
        var humanName = classType.name + '.' + fieldName;
        var desc = {
          get: function () {
            throwUnboundTypeError('Cannot access ' + humanName + ' due to unbound types', [
              getterReturnType,
              setterArgumentType,
            ]);
          },
          enumerable: true,
          configurable: true,
        };
        if (setter) {
          desc.set = function () {
            throwUnboundTypeError('Cannot access ' + humanName + ' due to unbound types', [
              getterReturnType,
              setterArgumentType,
            ]);
          };
        } else {
          desc.set = function (v) {
            throwBindingError(humanName + ' is a read-only property');
          };
        }
        Object.defineProperty(classType.registeredClass.instancePrototype, fieldName, desc);
        whenDependentTypesAreResolved(
          [],
          setter ? [getterReturnType, setterArgumentType] : [getterReturnType],
          function (types) {
            var getterReturnType = types[0];
            var desc = {
              get: function () {
                var ptr = validateThis(this, classType, humanName + ' getter');
                return getterReturnType['fromWireType'](getter(getterContext, ptr));
              },
              enumerable: true,
            };
            if (setter) {
              setter = embind__requireFunction(setterSignature, setter);
              var setterArgumentType = types[1];
              desc.set = function (v) {
                var ptr = validateThis(this, classType, humanName + ' setter');
                var destructors = [];
                setter(setterContext, ptr, setterArgumentType['toWireType'](destructors, v));
                runDestructors(destructors);
              };
            }
            Object.defineProperty(classType.registeredClass.instancePrototype, fieldName, desc);
            return [];
          },
        );
        return [];
      });
    }
    var emval_free_list = [];
    var emval_handle_array = [
      {},
      { value: undefined },
      { value: null },
      { value: true },
      { value: false },
    ];
    function __emval_decref(handle) {
      if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
        emval_handle_array[handle] = undefined;
        emval_free_list.push(handle);
      }
    }
    function count_emval_handles() {
      var count = 0;
      for (var i = 5; i < emval_handle_array.length; ++i) {
        if (emval_handle_array[i] !== undefined) {
          ++count;
        }
      }
      return count;
    }
    function get_first_emval() {
      for (var i = 5; i < emval_handle_array.length; ++i) {
        if (emval_handle_array[i] !== undefined) {
          return emval_handle_array[i];
        }
      }
      return null;
    }
    function init_emval() {
      Module['count_emval_handles'] = count_emval_handles;
      Module['get_first_emval'] = get_first_emval;
    }
    function __emval_register(value) {
      switch (value) {
        case undefined: {
          return 1;
        }
        case null: {
          return 2;
        }
        case true: {
          return 3;
        }
        case false: {
          return 4;
        }
        default: {
          var handle = emval_free_list.length ? emval_free_list.pop() : emval_handle_array.length;
          emval_handle_array[handle] = { refcount: 1, value: value };
          return handle;
        }
      }
    }
    function __embind_register_emval(rawType, name) {
      name = readLatin1String(name);
      registerType(rawType, {
        name: name,
        fromWireType: function (handle) {
          var rv = emval_handle_array[handle].value;
          __emval_decref(handle);
          return rv;
        },
        toWireType: function (destructors, value) {
          return __emval_register(value);
        },
        argPackAdvance: 8,
        readValueFromPointer: simpleReadValueFromPointer,
        destructorFunction: null,
      });
    }
    function enumReadValueFromPointer(name, shift, signed) {
      switch (shift) {
        case 0:
          return function (pointer) {
            var heap = signed ? HEAP8 : HEAPU8;
            return this['fromWireType'](heap[pointer]);
          };
        case 1:
          return function (pointer) {
            var heap = signed ? HEAP16 : HEAPU16;
            return this['fromWireType'](heap[pointer >> 1]);
          };
        case 2:
          return function (pointer) {
            var heap = signed ? HEAP32 : HEAPU32;
            return this['fromWireType'](heap[pointer >> 2]);
          };
        default:
          throw new TypeError('Unknown integer type: ' + name);
      }
    }
    function __embind_register_enum(rawType, name, size, isSigned) {
      var shift = getShiftFromSize(size);
      name = readLatin1String(name);
      function ctor() {}
      ctor.values = {};
      registerType(rawType, {
        name: name,
        constructor: ctor,
        fromWireType: function (c) {
          return this.constructor.values[c];
        },
        toWireType: function (destructors, c) {
          return c.value;
        },
        argPackAdvance: 8,
        readValueFromPointer: enumReadValueFromPointer(name, shift, isSigned),
        destructorFunction: null,
      });
      exposePublicSymbol(name, ctor);
    }
    function requireRegisteredType(rawType, humanName) {
      var impl = registeredTypes[rawType];
      if (undefined === impl) {
        throwBindingError(humanName + ' has unknown type ' + getTypeName(rawType));
      }
      return impl;
    }
    function __embind_register_enum_value(rawEnumType, name, enumValue) {
      var enumType = requireRegisteredType(rawEnumType, 'enum');
      name = readLatin1String(name);
      var Enum = enumType.constructor;
      var Value = Object.create(enumType.constructor.prototype, {
        value: { value: enumValue },
        constructor: { value: createNamedFunction(enumType.name + '_' + name, function () {}) },
      });
      Enum.values[enumValue] = Value;
      Enum[name] = Value;
    }
    function _embind_repr(v) {
      if (v === null) {
        return 'null';
      }
      var t = typeof v;
      if (t === 'object' || t === 'array' || t === 'function') {
        return v.toString();
      } else {
        return '' + v;
      }
    }
    function floatReadValueFromPointer(name, shift) {
      switch (shift) {
        case 2:
          return function (pointer) {
            return this['fromWireType'](HEAPF32[pointer >> 2]);
          };
        case 3:
          return function (pointer) {
            return this['fromWireType'](HEAPF64[pointer >> 3]);
          };
        default:
          throw new TypeError('Unknown float type: ' + name);
      }
    }
    function __embind_register_float(rawType, name, size) {
      var shift = getShiftFromSize(size);
      name = readLatin1String(name);
      registerType(rawType, {
        name: name,
        fromWireType: function (value) {
          return value;
        },
        toWireType: function (destructors, value) {
          if (typeof value !== 'number' && typeof value !== 'boolean') {
            throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
          }
          return value;
        },
        argPackAdvance: 8,
        readValueFromPointer: floatReadValueFromPointer(name, shift),
        destructorFunction: null,
      });
    }
    function integerReadValueFromPointer(name, shift, signed) {
      switch (shift) {
        case 0:
          return signed
            ? function readS8FromPointer(pointer) {
                return HEAP8[pointer];
              }
            : function readU8FromPointer(pointer) {
                return HEAPU8[pointer];
              };
        case 1:
          return signed
            ? function readS16FromPointer(pointer) {
                return HEAP16[pointer >> 1];
              }
            : function readU16FromPointer(pointer) {
                return HEAPU16[pointer >> 1];
              };
        case 2:
          return signed
            ? function readS32FromPointer(pointer) {
                return HEAP32[pointer >> 2];
              }
            : function readU32FromPointer(pointer) {
                return HEAPU32[pointer >> 2];
              };
        default:
          throw new TypeError('Unknown integer type: ' + name);
      }
    }
    function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
      name = readLatin1String(name);
      if (maxRange === -1) {
        maxRange = 4294967295;
      }
      var shift = getShiftFromSize(size);
      var fromWireType = function (value) {
        return value;
      };
      if (minRange === 0) {
        var bitshift = 32 - 8 * size;
        fromWireType = function (value) {
          return (value << bitshift) >>> bitshift;
        };
      }
      var isUnsignedType = name.indexOf('unsigned') != -1;
      registerType(primitiveType, {
        name: name,
        fromWireType: fromWireType,
        toWireType: function (destructors, value) {
          if (typeof value !== 'number' && typeof value !== 'boolean') {
            throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
          }
          if (value < minRange || value > maxRange) {
            throw new TypeError(
              'Passing a number "' +
                _embind_repr(value) +
                '" from JS side to C/C++ side to an argument of type "' +
                name +
                '", which is outside the valid range [' +
                minRange +
                ', ' +
                maxRange +
                ']!',
            );
          }
          return isUnsignedType ? value >>> 0 : value | 0;
        },
        argPackAdvance: 8,
        readValueFromPointer: integerReadValueFromPointer(name, shift, minRange !== 0),
        destructorFunction: null,
      });
    }
    function __embind_register_memory_view(rawType, dataTypeIndex, name) {
      var typeMapping = [
        Int8Array,
        Uint8Array,
        Int16Array,
        Uint16Array,
        Int32Array,
        Uint32Array,
        Float32Array,
        Float64Array,
      ];
      var TA = typeMapping[dataTypeIndex];
      function decodeMemoryView(handle) {
        handle = handle >> 2;
        var heap = HEAPU32;
        var size = heap[handle];
        var data = heap[handle + 1];
        return new TA(buffer, data, size);
      }
      name = readLatin1String(name);
      registerType(
        rawType,
        {
          name: name,
          fromWireType: decodeMemoryView,
          argPackAdvance: 8,
          readValueFromPointer: decodeMemoryView,
        },
        { ignoreDuplicateRegistrations: true },
      );
    }
    function __embind_register_std_string(rawType, name) {
      name = readLatin1String(name);
      var stdStringIsUTF8 = name === 'std::string';
      registerType(rawType, {
        name: name,
        fromWireType: function (value) {
          var length = HEAPU32[value >> 2];
          var str;
          if (stdStringIsUTF8) {
            var decodeStartPtr = value + 4;
            for (var i = 0; i <= length; ++i) {
              var currentBytePtr = value + 4 + i;
              if (i == length || HEAPU8[currentBytePtr] == 0) {
                var maxRead = currentBytePtr - decodeStartPtr;
                var stringSegment = UTF8ToString(decodeStartPtr, maxRead);
                if (str === undefined) {
                  str = stringSegment;
                } else {
                  str += String.fromCharCode(0);
                  str += stringSegment;
                }
                decodeStartPtr = currentBytePtr + 1;
              }
            }
          } else {
            var a = new Array(length);
            for (var i = 0; i < length; ++i) {
              a[i] = String.fromCharCode(HEAPU8[value + 4 + i]);
            }
            str = a.join('');
          }
          _free(value);
          return str;
        },
        toWireType: function (destructors, value) {
          if (value instanceof ArrayBuffer) {
            value = new Uint8Array(value);
          }
          var getLength;
          var valueIsOfTypeString = typeof value === 'string';
          if (
            !(
              valueIsOfTypeString ||
              value instanceof Uint8Array ||
              value instanceof Uint8ClampedArray ||
              value instanceof Int8Array
            )
          ) {
            throwBindingError('Cannot pass non-string to std::string');
          }
          if (stdStringIsUTF8 && valueIsOfTypeString) {
            getLength = function () {
              return lengthBytesUTF8(value);
            };
          } else {
            getLength = function () {
              return value.length;
            };
          }
          var length = getLength();
          var ptr = _malloc(4 + length + 1);
          HEAPU32[ptr >> 2] = length;
          if (stdStringIsUTF8 && valueIsOfTypeString) {
            stringToUTF8(value, ptr + 4, length + 1);
          } else {
            if (valueIsOfTypeString) {
              for (var i = 0; i < length; ++i) {
                var charCode = value.charCodeAt(i);
                if (charCode > 255) {
                  _free(ptr);
                  throwBindingError('String has UTF-16 code units that do not fit in 8 bits');
                }
                HEAPU8[ptr + 4 + i] = charCode;
              }
            } else {
              for (var i = 0; i < length; ++i) {
                HEAPU8[ptr + 4 + i] = value[i];
              }
            }
          }
          if (destructors !== null) {
            destructors.push(_free, ptr);
          }
          return ptr;
        },
        argPackAdvance: 8,
        readValueFromPointer: simpleReadValueFromPointer,
        destructorFunction: function (ptr) {
          _free(ptr);
        },
      });
    }
    function __embind_register_std_wstring(rawType, charSize, name) {
      name = readLatin1String(name);
      var decodeString, encodeString, getHeap, lengthBytesUTF, shift;
      if (charSize === 2) {
        decodeString = UTF16ToString;
        encodeString = stringToUTF16;
        lengthBytesUTF = lengthBytesUTF16;
        getHeap = function () {
          return HEAPU16;
        };
        shift = 1;
      } else if (charSize === 4) {
        decodeString = UTF32ToString;
        encodeString = stringToUTF32;
        lengthBytesUTF = lengthBytesUTF32;
        getHeap = function () {
          return HEAPU32;
        };
        shift = 2;
      }
      registerType(rawType, {
        name: name,
        fromWireType: function (value) {
          var length = HEAPU32[value >> 2];
          var HEAP = getHeap();
          var str;
          var decodeStartPtr = value + 4;
          for (var i = 0; i <= length; ++i) {
            var currentBytePtr = value + 4 + i * charSize;
            if (i == length || HEAP[currentBytePtr >> shift] == 0) {
              var maxReadBytes = currentBytePtr - decodeStartPtr;
              var stringSegment = decodeString(decodeStartPtr, maxReadBytes);
              if (str === undefined) {
                str = stringSegment;
              } else {
                str += String.fromCharCode(0);
                str += stringSegment;
              }
              decodeStartPtr = currentBytePtr + charSize;
            }
          }
          _free(value);
          return str;
        },
        toWireType: function (destructors, value) {
          if (!(typeof value === 'string')) {
            throwBindingError('Cannot pass non-string to C++ string type ' + name);
          }
          var length = lengthBytesUTF(value);
          var ptr = _malloc(4 + length + charSize);
          HEAPU32[ptr >> 2] = length >> shift;
          encodeString(value, ptr + 4, length + charSize);
          if (destructors !== null) {
            destructors.push(_free, ptr);
          }
          return ptr;
        },
        argPackAdvance: 8,
        readValueFromPointer: simpleReadValueFromPointer,
        destructorFunction: function (ptr) {
          _free(ptr);
        },
      });
    }
    function __embind_register_value_object(
      rawType,
      name,
      constructorSignature,
      rawConstructor,
      destructorSignature,
      rawDestructor,
    ) {
      structRegistrations[rawType] = {
        name: readLatin1String(name),
        rawConstructor: embind__requireFunction(constructorSignature, rawConstructor),
        rawDestructor: embind__requireFunction(destructorSignature, rawDestructor),
        fields: [],
      };
    }
    function __embind_register_value_object_field(
      structType,
      fieldName,
      getterReturnType,
      getterSignature,
      getter,
      getterContext,
      setterArgumentType,
      setterSignature,
      setter,
      setterContext,
    ) {
      structRegistrations[structType].fields.push({
        fieldName: readLatin1String(fieldName),
        getterReturnType: getterReturnType,
        getter: embind__requireFunction(getterSignature, getter),
        getterContext: getterContext,
        setterArgumentType: setterArgumentType,
        setter: embind__requireFunction(setterSignature, setter),
        setterContext: setterContext,
      });
    }
    function __embind_register_void(rawType, name) {
      name = readLatin1String(name);
      registerType(rawType, {
        isVoid: true,
        name: name,
        argPackAdvance: 0,
        fromWireType: function () {
          return undefined;
        },
        toWireType: function (destructors, o) {
          return undefined;
        },
      });
    }
    function __emscripten_notify_thread_queue(targetThreadId, mainThreadId) {
      if (targetThreadId == mainThreadId) {
        postMessage({ cmd: 'processQueuedMainThreadWork' });
      } else if (ENVIRONMENT_IS_PTHREAD) {
        postMessage({ targetThread: targetThreadId, cmd: 'processThreadQueue' });
      } else {
        var pthread = PThread.pthreads[targetThreadId];
        var worker = pthread && pthread.worker;
        if (!worker) {
          return;
        }
        worker.postMessage({ cmd: 'processThreadQueue' });
      }
      return 1;
    }
    function requireHandle(handle) {
      if (!handle) {
        throwBindingError('Cannot use deleted val. handle = ' + handle);
      }
      return emval_handle_array[handle].value;
    }
    function __emval_as(handle, returnType, destructorsRef) {
      handle = requireHandle(handle);
      returnType = requireRegisteredType(returnType, 'emval::as');
      var destructors = [];
      var rd = __emval_register(destructors);
      HEAP32[destructorsRef >> 2] = rd;
      return returnType['toWireType'](destructors, handle);
    }
    function __emval_lookupTypes(argCount, argTypes) {
      var a = new Array(argCount);
      for (var i = 0; i < argCount; ++i) {
        a[i] = requireRegisteredType(HEAP32[(argTypes >> 2) + i], 'parameter ' + i);
      }
      return a;
    }
    function __emval_call(handle, argCount, argTypes, argv) {
      handle = requireHandle(handle);
      var types = __emval_lookupTypes(argCount, argTypes);
      var args = new Array(argCount);
      for (var i = 0; i < argCount; ++i) {
        var type = types[i];
        args[i] = type['readValueFromPointer'](argv);
        argv += type['argPackAdvance'];
      }
      var rv = handle.apply(undefined, args);
      return __emval_register(rv);
    }
    function __emval_allocateDestructors(destructorsRef) {
      var destructors = [];
      HEAP32[destructorsRef >> 2] = __emval_register(destructors);
      return destructors;
    }
    var emval_symbols = {};
    function getStringOrSymbol(address) {
      var symbol = emval_symbols[address];
      if (symbol === undefined) {
        return readLatin1String(address);
      } else {
        return symbol;
      }
    }
    var emval_methodCallers = [];
    function __emval_call_method(caller, handle, methodName, destructorsRef, args) {
      caller = emval_methodCallers[caller];
      handle = requireHandle(handle);
      methodName = getStringOrSymbol(methodName);
      return caller(handle, methodName, __emval_allocateDestructors(destructorsRef), args);
    }
    function emval_get_global() {
      if (typeof globalThis === 'object') {
        return globalThis;
      }
      return (function () {
        return Function;
      })()('return this')();
    }
    function __emval_get_global(name) {
      if (name === 0) {
        return __emval_register(emval_get_global());
      } else {
        name = getStringOrSymbol(name);
        return __emval_register(emval_get_global()[name]);
      }
    }
    function __emval_addMethodCaller(caller) {
      var id = emval_methodCallers.length;
      emval_methodCallers.push(caller);
      return id;
    }
    function __emval_get_method_caller(argCount, argTypes) {
      var types = __emval_lookupTypes(argCount, argTypes);
      var retType = types[0];
      var signatureName =
        retType.name +
        '_$' +
        types
          .slice(1)
          .map(function (t) {
            return t.name;
          })
          .join('_') +
        '$';
      var params = ['retType'];
      var args = [retType];
      var argsList = '';
      for (var i = 0; i < argCount - 1; ++i) {
        argsList += (i !== 0 ? ', ' : '') + 'arg' + i;
        params.push('argType' + i);
        args.push(types[1 + i]);
      }
      var functionName = makeLegalFunctionName('methodCaller_' + signatureName);
      var functionBody =
        'return function ' + functionName + '(handle, name, destructors, args) {\n';
      var offset = 0;
      for (var i = 0; i < argCount - 1; ++i) {
        functionBody +=
          '    var arg' +
          i +
          ' = argType' +
          i +
          '.readValueFromPointer(args' +
          (offset ? '+' + offset : '') +
          ');\n';
        offset += types[i + 1]['argPackAdvance'];
      }
      functionBody += '    var rv = handle[name](' + argsList + ');\n';
      for (var i = 0; i < argCount - 1; ++i) {
        if (types[i + 1]['deleteObject']) {
          functionBody += '    argType' + i + '.deleteObject(arg' + i + ');\n';
        }
      }
      if (!retType.isVoid) {
        functionBody += '    return retType.toWireType(destructors, rv);\n';
      }
      functionBody += '};\n';
      params.push(functionBody);
      var invokerFunction = new_(Function, params).apply(null, args);
      return __emval_addMethodCaller(invokerFunction);
    }
    function __emval_get_module_property(name) {
      name = getStringOrSymbol(name);
      return __emval_register(Module[name]);
    }
    function __emval_get_property(handle, key) {
      handle = requireHandle(handle);
      key = requireHandle(key);
      return __emval_register(handle[key]);
    }
    function __emval_incref(handle) {
      if (handle > 4) {
        emval_handle_array[handle].refcount += 1;
      }
    }
    function __emval_instanceof(object, constructor) {
      object = requireHandle(object);
      constructor = requireHandle(constructor);
      return object instanceof constructor;
    }
    function __emval_is_number(handle) {
      handle = requireHandle(handle);
      return typeof handle === 'number';
    }
    function __emval_is_string(handle) {
      handle = requireHandle(handle);
      return typeof handle === 'string';
    }
    function __emval_new_cstring(v) {
      return __emval_register(getStringOrSymbol(v));
    }
    function __emval_run_destructors(handle) {
      var destructors = emval_handle_array[handle].value;
      runDestructors(destructors);
      __emval_decref(handle);
    }
    function __emval_set_property(handle, key, value) {
      handle = requireHandle(handle);
      key = requireHandle(key);
      value = requireHandle(value);
      handle[key] = value;
    }
    function __emval_take_value(type, argv) {
      type = requireRegisteredType(type, '_emval_take_value');
      var v = type['readValueFromPointer'](argv);
      return __emval_register(v);
    }
    function __emval_typeof(handle) {
      handle = requireHandle(handle);
      return __emval_register(typeof handle);
    }
    function _exit(status) {
      exit(status);
    }
    Module['_exit'] = _exit;
    function __exit(a0) {
      return _exit(a0);
    }
    function _abort() {
      abort();
    }
    Module['_abort'] = _abort;
    function _dlclose(handle) {
      abort(
        "To use dlopen, you need to use Emscripten's linking support, see https://github.com/emscripten-core/emscripten/wiki/Linking",
      );
    }
    function _dlerror() {
      abort(
        "To use dlopen, you need to use Emscripten's linking support, see https://github.com/emscripten-core/emscripten/wiki/Linking",
      );
    }
    function _dlopen(filename, flag) {
      abort(
        "To use dlopen, you need to use Emscripten's linking support, see https://github.com/emscripten-core/emscripten/wiki/Linking",
      );
    }
    function _dlsym(handle, symbol) {
      abort(
        "To use dlopen, you need to use Emscripten's linking support, see https://github.com/emscripten-core/emscripten/wiki/Linking",
      );
    }
    function _emscripten_asm_const_int(code, sigPtr, argbuf) {
      var args = readAsmConstArgs(sigPtr, argbuf);
      return ASM_CONSTS[code].apply(null, args);
    }
    function _emscripten_conditional_set_current_thread_status(expectedStatus, newStatus) {
      expectedStatus = expectedStatus | 0;
      newStatus = newStatus | 0;
    }
    function _emscripten_futex_wait(addr, val, timeout) {
      if (addr <= 0 || addr > HEAP8.length || addr & (3 != 0)) return -28;
      if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_WORKER) {
        var ret = Atomics.wait(HEAP32, addr >> 2, val, timeout);
        if (ret === 'timed-out') return -73;
        if (ret === 'not-equal') return -6;
        if (ret === 'ok') return 0;
        throw 'Atomics.wait returned an unexpected value ' + ret;
      } else {
        var loadedVal = Atomics.load(HEAP32, addr >> 2);
        if (val != loadedVal) return -6;
        var tNow = performance.now();
        var tEnd = tNow + timeout;
        Atomics.store(HEAP32, __main_thread_futex_wait_address >> 2, addr);
        var ourWaitAddress = addr;
        while (addr == ourWaitAddress) {
          tNow = performance.now();
          if (tNow > tEnd) {
            return -73;
          }
          _emscripten_main_thread_process_queued_calls();
          addr = Atomics.load(HEAP32, __main_thread_futex_wait_address >> 2);
        }
        return 0;
      }
    }
    function _emscripten_is_main_browser_thread() {
      return __pthread_is_main_browser_thread | 0;
    }
    function _emscripten_is_main_runtime_thread() {
      return __pthread_is_main_runtime_thread | 0;
    }
    function _longjmp(env, value) {
      _setThrew(env, value || 1);
      throw 'longjmp';
    }
    function _emscripten_longjmp(env, value) {
      _longjmp(env, value);
    }
    function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.copyWithin(dest, src, src + num);
    }
    function _emscripten_num_logical_cores() {
      if (ENVIRONMENT_IS_NODE) return require('os').cpus().length;
      return navigator['hardwareConcurrency'];
    }
    function _emscripten_proxy_to_main_thread_js(index, sync) {
      var numCallArgs = arguments.length - 2;
      var stack = stackSave();
      var args = stackAlloc(numCallArgs * 8);
      var b = args >> 3;
      for (var i = 0; i < numCallArgs; i++) {
        HEAPF64[b + i] = arguments[2 + i];
      }
      var ret = _emscripten_run_in_main_runtime_thread_js(index, numCallArgs, args, sync);
      stackRestore(stack);
      return ret;
    }
    var _emscripten_receive_on_main_thread_js_callArgs = [];
    var readAsmConstArgsArray = [];
    function readAsmConstArgs(sigPtr, buf) {
      readAsmConstArgsArray.length = 0;
      var ch;
      buf >>= 2;
      while ((ch = HEAPU8[sigPtr++])) {
        var double = ch < 105;
        if (double && buf & 1) buf++;
        readAsmConstArgsArray.push(double ? HEAPF64[buf++ >> 1] : HEAP32[buf]);
        ++buf;
      }
      return readAsmConstArgsArray;
    }
    function _emscripten_receive_on_main_thread_js(index, numCallArgs, args) {
      _emscripten_receive_on_main_thread_js_callArgs.length = numCallArgs;
      var b = args >> 3;
      for (var i = 0; i < numCallArgs; i++) {
        _emscripten_receive_on_main_thread_js_callArgs[i] = HEAPF64[b + i];
      }
      var isEmAsmConst = index < 0;
      var func = !isEmAsmConst ? proxiedFunctionTable[index] : ASM_CONSTS[-index - 1];
      return func.apply(null, _emscripten_receive_on_main_thread_js_callArgs);
    }
    function abortOnCannotGrowMemory(requestedSize) {
      abort('OOM');
    }
    function _emscripten_resize_heap(requestedSize) {
      requestedSize = requestedSize >>> 0;
      abortOnCannotGrowMemory(requestedSize);
    }
    var JSEvents = {
      inEventHandler: 0,
      removeAllEventListeners: function () {
        for (var i = JSEvents.eventHandlers.length - 1; i >= 0; --i) {
          JSEvents._removeHandler(i);
        }
        JSEvents.eventHandlers = [];
        JSEvents.deferredCalls = [];
      },
      registerRemoveEventListeners: function () {
        if (!JSEvents.removeEventListenersRegistered) {
          __ATEXIT__.push(JSEvents.removeAllEventListeners);
          JSEvents.removeEventListenersRegistered = true;
        }
      },
      deferredCalls: [],
      deferCall: function (targetFunction, precedence, argsList) {
        function arraysHaveEqualContent(arrA, arrB) {
          if (arrA.length != arrB.length) return false;
          for (var i in arrA) {
            if (arrA[i] != arrB[i]) return false;
          }
          return true;
        }
        for (var i in JSEvents.deferredCalls) {
          var call = JSEvents.deferredCalls[i];
          if (
            call.targetFunction == targetFunction &&
            arraysHaveEqualContent(call.argsList, argsList)
          ) {
            return;
          }
        }
        JSEvents.deferredCalls.push({
          targetFunction: targetFunction,
          precedence: precedence,
          argsList: argsList,
        });
        JSEvents.deferredCalls.sort(function (x, y) {
          return x.precedence < y.precedence;
        });
      },
      removeDeferredCalls: function (targetFunction) {
        for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
          if (JSEvents.deferredCalls[i].targetFunction == targetFunction) {
            JSEvents.deferredCalls.splice(i, 1);
            --i;
          }
        }
      },
      canPerformEventHandlerRequests: function () {
        return JSEvents.inEventHandler && JSEvents.currentEventHandler.allowsDeferredCalls;
      },
      runDeferredCalls: function () {
        if (!JSEvents.canPerformEventHandlerRequests()) {
          return;
        }
        for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
          var call = JSEvents.deferredCalls[i];
          JSEvents.deferredCalls.splice(i, 1);
          --i;
          call.targetFunction.apply(null, call.argsList);
        }
      },
      eventHandlers: [],
      removeAllHandlersOnTarget: function (target, eventTypeString) {
        for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
          if (
            JSEvents.eventHandlers[i].target == target &&
            (!eventTypeString || eventTypeString == JSEvents.eventHandlers[i].eventTypeString)
          ) {
            JSEvents._removeHandler(i--);
          }
        }
      },
      _removeHandler: function (i) {
        var h = JSEvents.eventHandlers[i];
        h.target.removeEventListener(h.eventTypeString, h.eventListenerFunc, h.useCapture);
        JSEvents.eventHandlers.splice(i, 1);
      },
      registerOrRemoveHandler: function (eventHandler) {
        var jsEventHandler = function jsEventHandler(event) {
          ++JSEvents.inEventHandler;
          JSEvents.currentEventHandler = eventHandler;
          JSEvents.runDeferredCalls();
          eventHandler.handlerFunc(event);
          JSEvents.runDeferredCalls();
          --JSEvents.inEventHandler;
        };
        if (eventHandler.callbackfunc) {
          eventHandler.eventListenerFunc = jsEventHandler;
          eventHandler.target.addEventListener(
            eventHandler.eventTypeString,
            jsEventHandler,
            eventHandler.useCapture,
          );
          JSEvents.eventHandlers.push(eventHandler);
          JSEvents.registerRemoveEventListeners();
        } else {
          for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
            if (
              JSEvents.eventHandlers[i].target == eventHandler.target &&
              JSEvents.eventHandlers[i].eventTypeString == eventHandler.eventTypeString
            ) {
              JSEvents._removeHandler(i--);
            }
          }
        }
      },
      queueEventHandlerOnThread_iiii: function (
        targetThread,
        eventHandlerFunc,
        eventTypeId,
        eventData,
        userData,
      ) {
        var stackTop = stackSave();
        var varargs = stackAlloc(12);
        HEAP32[varargs >> 2] = eventTypeId;
        HEAP32[(varargs + 4) >> 2] = eventData;
        HEAP32[(varargs + 8) >> 2] = userData;
        __emscripten_call_on_thread(
          0,
          targetThread,
          637534208,
          eventHandlerFunc,
          eventData,
          varargs,
        );
        stackRestore(stackTop);
      },
      getTargetThreadForEventCallback: function (targetThread) {
        switch (targetThread) {
          case 1:
            return 0;
          case 2:
            return PThread.currentProxiedOperationCallerThread;
          default:
            return targetThread;
        }
      },
      getNodeNameForTarget: function (target) {
        if (!target) return '';
        if (target == window) return '#window';
        if (target == screen) return '#screen';
        return target && target.nodeName ? target.nodeName : '';
      },
      fullscreenEnabled: function () {
        return document.fullscreenEnabled || document.webkitFullscreenEnabled;
      },
    };
    function stringToNewUTF8(jsString) {
      var length = lengthBytesUTF8(jsString) + 1;
      var cString = _malloc(length);
      stringToUTF8(jsString, cString, length);
      return cString;
    }
    function _emscripten_set_offscreencanvas_size_on_target_thread_js(
      targetThread,
      targetCanvas,
      width,
      height,
    ) {
      var stackTop = stackSave();
      var varargs = stackAlloc(12);
      var targetCanvasPtr = 0;
      if (targetCanvas) {
        targetCanvasPtr = stringToNewUTF8(targetCanvas);
      }
      HEAP32[varargs >> 2] = targetCanvasPtr;
      HEAP32[(varargs + 4) >> 2] = width;
      HEAP32[(varargs + 8) >> 2] = height;
      __emscripten_call_on_thread(0, targetThread, 657457152, 0, targetCanvasPtr, varargs);
      stackRestore(stackTop);
    }
    function _emscripten_set_offscreencanvas_size_on_target_thread(
      targetThread,
      targetCanvas,
      width,
      height,
    ) {
      targetCanvas = targetCanvas ? UTF8ToString(targetCanvas) : '';
      _emscripten_set_offscreencanvas_size_on_target_thread_js(
        targetThread,
        targetCanvas,
        width,
        height,
      );
    }
    function maybeCStringToJsString(cString) {
      return cString > 2 ? UTF8ToString(cString) : cString;
    }
    var specialHTMLTargets = [
      0,
      typeof document !== 'undefined' ? document : 0,
      typeof window !== 'undefined' ? window : 0,
    ];
    function findEventTarget(target) {
      target = maybeCStringToJsString(target);
      var domElement =
        specialHTMLTargets[target] ||
        (typeof document !== 'undefined' ? document.querySelector(target) : undefined);
      return domElement;
    }
    function findCanvasEventTarget(target) {
      return findEventTarget(target);
    }
    function _emscripten_set_canvas_element_size_calling_thread(target, width, height) {
      var canvas = findCanvasEventTarget(target);
      if (!canvas) return -4;
      if (canvas.canvasSharedPtr) {
        HEAP32[canvas.canvasSharedPtr >> 2] = width;
        HEAP32[(canvas.canvasSharedPtr + 4) >> 2] = height;
      }
      if (canvas.offscreenCanvas || !canvas.controlTransferredOffscreen) {
        if (canvas.offscreenCanvas) canvas = canvas.offscreenCanvas;
        var autoResizeViewport = false;
        if (canvas.GLctxObject && canvas.GLctxObject.GLctx) {
          var prevViewport = canvas.GLctxObject.GLctx.getParameter(2978);
          autoResizeViewport =
            prevViewport[0] === 0 &&
            prevViewport[1] === 0 &&
            prevViewport[2] === canvas.width &&
            prevViewport[3] === canvas.height;
        }
        canvas.width = width;
        canvas.height = height;
        if (autoResizeViewport) {
          canvas.GLctxObject.GLctx.viewport(0, 0, width, height);
        }
      } else if (canvas.canvasSharedPtr) {
        var targetThread = HEAP32[(canvas.canvasSharedPtr + 8) >> 2];
        _emscripten_set_offscreencanvas_size_on_target_thread(targetThread, target, width, height);
        return 1;
      } else {
        return -4;
      }
      return 0;
    }
    function _emscripten_set_canvas_element_size_main_thread(target, width, height) {
      if (ENVIRONMENT_IS_PTHREAD)
        return _emscripten_proxy_to_main_thread_js(23, 1, target, width, height);
      return _emscripten_set_canvas_element_size_calling_thread(target, width, height);
    }
    function _emscripten_set_canvas_element_size(target, width, height) {
      var canvas = findCanvasEventTarget(target);
      if (canvas) {
        return _emscripten_set_canvas_element_size_calling_thread(target, width, height);
      } else {
        return _emscripten_set_canvas_element_size_main_thread(target, width, height);
      }
    }
    function _emscripten_set_current_thread_status(newStatus) {
      newStatus = newStatus | 0;
    }
    function _emscripten_stack_get_end() {
      return STACK_MAX;
    }
    function __webgl_enable_ANGLE_instanced_arrays(ctx) {
      var ext = ctx.getExtension('ANGLE_instanced_arrays');
      if (ext) {
        ctx['vertexAttribDivisor'] = function (index, divisor) {
          ext['vertexAttribDivisorANGLE'](index, divisor);
        };
        ctx['drawArraysInstanced'] = function (mode, first, count, primcount) {
          ext['drawArraysInstancedANGLE'](mode, first, count, primcount);
        };
        ctx['drawElementsInstanced'] = function (mode, count, type, indices, primcount) {
          ext['drawElementsInstancedANGLE'](mode, count, type, indices, primcount);
        };
        return 1;
      }
    }
    function __webgl_enable_OES_vertex_array_object(ctx) {
      var ext = ctx.getExtension('OES_vertex_array_object');
      if (ext) {
        ctx['createVertexArray'] = function () {
          return ext['createVertexArrayOES']();
        };
        ctx['deleteVertexArray'] = function (vao) {
          ext['deleteVertexArrayOES'](vao);
        };
        ctx['bindVertexArray'] = function (vao) {
          ext['bindVertexArrayOES'](vao);
        };
        ctx['isVertexArray'] = function (vao) {
          return ext['isVertexArrayOES'](vao);
        };
        return 1;
      }
    }
    function __webgl_enable_WEBGL_draw_buffers(ctx) {
      var ext = ctx.getExtension('WEBGL_draw_buffers');
      if (ext) {
        ctx['drawBuffers'] = function (n, bufs) {
          ext['drawBuffersWEBGL'](n, bufs);
        };
        return 1;
      }
    }
    function __webgl_enable_WEBGL_multi_draw(ctx) {
      return !!(ctx.multiDrawWebgl = ctx.getExtension('WEBGL_multi_draw'));
    }
    var GL = {
      counter: 1,
      buffers: [],
      programs: [],
      framebuffers: [],
      renderbuffers: [],
      textures: [],
      uniforms: [],
      shaders: [],
      vaos: [],
      contexts: {},
      offscreenCanvases: {},
      timerQueriesEXT: [],
      programInfos: {},
      stringCache: {},
      unpackAlignment: 4,
      recordError: function recordError(errorCode) {
        if (!GL.lastError) {
          GL.lastError = errorCode;
        }
      },
      getNewId: function (table) {
        var ret = GL.counter++;
        for (var i = table.length; i < ret; i++) {
          table[i] = null;
        }
        return ret;
      },
      getSource: function (shader, count, string, length) {
        var source = '';
        for (var i = 0; i < count; ++i) {
          var len = length ? HEAP32[(length + i * 4) >> 2] : -1;
          source += UTF8ToString(HEAP32[(string + i * 4) >> 2], len < 0 ? undefined : len);
        }
        return source;
      },
      createContext: function (canvas, webGLContextAttributes) {
        var ctx = canvas.getContext('webgl', webGLContextAttributes);
        if (!ctx) return 0;
        var handle = GL.registerContext(ctx, webGLContextAttributes);
        return handle;
      },
      registerContext: function (ctx, webGLContextAttributes) {
        var handle = _malloc(8);
        HEAP32[(handle + 4) >> 2] = _pthread_self();
        var context = {
          handle: handle,
          attributes: webGLContextAttributes,
          version: webGLContextAttributes.majorVersion,
          GLctx: ctx,
        };
        if (ctx.canvas) ctx.canvas.GLctxObject = context;
        GL.contexts[handle] = context;
        if (
          typeof webGLContextAttributes.enableExtensionsByDefault === 'undefined' ||
          webGLContextAttributes.enableExtensionsByDefault
        ) {
          GL.initExtensions(context);
        }
        return handle;
      },
      makeContextCurrent: function (contextHandle) {
        GL.currentContext = GL.contexts[contextHandle];
        Module.ctx = GLctx = GL.currentContext && GL.currentContext.GLctx;
        return !(contextHandle && !GLctx);
      },
      getContext: function (contextHandle) {
        return GL.contexts[contextHandle];
      },
      deleteContext: function (contextHandle) {
        if (GL.currentContext === GL.contexts[contextHandle]) GL.currentContext = null;
        if (typeof JSEvents === 'object')
          JSEvents.removeAllHandlersOnTarget(GL.contexts[contextHandle].GLctx.canvas);
        if (GL.contexts[contextHandle] && GL.contexts[contextHandle].GLctx.canvas)
          GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined;
        _free(GL.contexts[contextHandle].handle);
        GL.contexts[contextHandle] = null;
      },
      initExtensions: function (context) {
        if (!context) context = GL.currentContext;
        if (context.initExtensionsDone) return;
        context.initExtensionsDone = true;
        var GLctx = context.GLctx;
        __webgl_enable_ANGLE_instanced_arrays(GLctx);
        __webgl_enable_OES_vertex_array_object(GLctx);
        __webgl_enable_WEBGL_draw_buffers(GLctx);
        GLctx.disjointTimerQueryExt = GLctx.getExtension('EXT_disjoint_timer_query');
        __webgl_enable_WEBGL_multi_draw(GLctx);
        var automaticallyEnabledExtensions = [
          'OES_texture_float',
          'OES_texture_half_float',
          'OES_standard_derivatives',
          'OES_vertex_array_object',
          'WEBGL_compressed_texture_s3tc',
          'WEBGL_depth_texture',
          'OES_element_index_uint',
          'EXT_texture_filter_anisotropic',
          'EXT_frag_depth',
          'WEBGL_draw_buffers',
          'ANGLE_instanced_arrays',
          'OES_texture_float_linear',
          'OES_texture_half_float_linear',
          'EXT_blend_minmax',
          'EXT_shader_texture_lod',
          'EXT_texture_norm16',
          'WEBGL_compressed_texture_pvrtc',
          'EXT_color_buffer_half_float',
          'WEBGL_color_buffer_float',
          'EXT_sRGB',
          'WEBGL_compressed_texture_etc1',
          'EXT_disjoint_timer_query',
          'WEBGL_compressed_texture_etc',
          'WEBGL_compressed_texture_astc',
          'EXT_color_buffer_float',
          'WEBGL_compressed_texture_s3tc_srgb',
          'EXT_disjoint_timer_query_webgl2',
          'WEBKIT_WEBGL_compressed_texture_pvrtc',
        ];
        var exts = GLctx.getSupportedExtensions() || [];
        exts.forEach(function (ext) {
          if (automaticallyEnabledExtensions.indexOf(ext) != -1) {
            GLctx.getExtension(ext);
          }
        });
      },
      populateUniformTable: function (program) {
        var p = GL.programs[program];
        var ptable = (GL.programInfos[program] = {
          uniforms: {},
          maxUniformLength: 0,
          maxAttributeLength: -1,
          maxUniformBlockNameLength: -1,
        });
        var utable = ptable.uniforms;
        var numUniforms = GLctx.getProgramParameter(p, 35718);
        for (var i = 0; i < numUniforms; ++i) {
          var u = GLctx.getActiveUniform(p, i);
          var name = u.name;
          ptable.maxUniformLength = Math.max(ptable.maxUniformLength, name.length + 1);
          if (name.slice(-1) == ']') {
            name = name.slice(0, name.lastIndexOf('['));
          }
          var loc = GLctx.getUniformLocation(p, name);
          if (loc) {
            var id = GL.getNewId(GL.uniforms);
            utable[name] = [u.size, id];
            GL.uniforms[id] = loc;
            for (var j = 1; j < u.size; ++j) {
              var n = name + '[' + j + ']';
              loc = GLctx.getUniformLocation(p, n);
              id = GL.getNewId(GL.uniforms);
              GL.uniforms[id] = loc;
            }
          }
        }
      },
    };
    var __emscripten_webgl_power_preferences = ['default', 'low-power', 'high-performance'];
    function _emscripten_webgl_do_create_context(target, attributes) {
      var contextAttributes = {};
      var a = attributes >> 2;
      contextAttributes['alpha'] = !!HEAP32[a + (0 >> 2)];
      contextAttributes['depth'] = !!HEAP32[a + (4 >> 2)];
      contextAttributes['stencil'] = !!HEAP32[a + (8 >> 2)];
      contextAttributes['antialias'] = !!HEAP32[a + (12 >> 2)];
      contextAttributes['premultipliedAlpha'] = !!HEAP32[a + (16 >> 2)];
      contextAttributes['preserveDrawingBuffer'] = !!HEAP32[a + (20 >> 2)];
      var powerPreference = HEAP32[a + (24 >> 2)];
      contextAttributes['powerPreference'] = __emscripten_webgl_power_preferences[powerPreference];
      contextAttributes['failIfMajorPerformanceCaveat'] = !!HEAP32[a + (28 >> 2)];
      contextAttributes.majorVersion = HEAP32[a + (32 >> 2)];
      contextAttributes.minorVersion = HEAP32[a + (36 >> 2)];
      contextAttributes.enableExtensionsByDefault = HEAP32[a + (40 >> 2)];
      contextAttributes.explicitSwapControl = HEAP32[a + (44 >> 2)];
      contextAttributes.proxyContextToMainThread = HEAP32[a + (48 >> 2)];
      contextAttributes.renderViaOffscreenBackBuffer = HEAP32[a + (52 >> 2)];
      var canvas = findCanvasEventTarget(target);
      if (!canvas) {
        return 0;
      }
      if (contextAttributes.explicitSwapControl) {
        return 0;
      }
      var contextHandle = GL.createContext(canvas, contextAttributes);
      return contextHandle;
    }
    function _emscripten_webgl_create_context(a0, a1) {
      return _emscripten_webgl_do_create_context(a0, a1);
    }
    var ENV = {};
    function getExecutableName() {
      return thisProgram || './this.program';
    }
    function getEnvStrings() {
      if (!getEnvStrings.strings) {
        var lang =
          (
            (typeof navigator === 'object' && navigator.languages && navigator.languages[0]) ||
            'C'
          ).replace('-', '_') + '.UTF-8';
        var env = {
          USER: 'web_user',
          LOGNAME: 'web_user',
          PATH: '/',
          PWD: '/',
          HOME: '/home/web_user',
          LANG: lang,
          _: getExecutableName(),
        };
        for (var x in ENV) {
          env[x] = ENV[x];
        }
        var strings = [];
        for (var x in env) {
          strings.push(x + '=' + env[x]);
        }
        getEnvStrings.strings = strings;
      }
      return getEnvStrings.strings;
    }
    function _environ_get(__environ, environ_buf) {
      var bufSize = 0;
      getEnvStrings().forEach(function (string, i) {
        var ptr = environ_buf + bufSize;
        HEAP32[(__environ + i * 4) >> 2] = ptr;
        writeAsciiToMemory(string, ptr);
        bufSize += string.length + 1;
      });
      return 0;
    }
    function _environ_sizes_get(penviron_count, penviron_buf_size) {
      var strings = getEnvStrings();
      HEAP32[penviron_count >> 2] = strings.length;
      var bufSize = 0;
      strings.forEach(function (string) {
        bufSize += string.length + 1;
      });
      HEAP32[penviron_buf_size >> 2] = bufSize;
      return 0;
    }
    function _execve(path, argv, envp) {
      setErrNo(45);
      return -1;
    }
    function _fd_close(fd) {
      if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(24, 1, fd);
      try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        FS.close(stream);
        return 0;
      } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno;
      }
    }
    function _fd_fdstat_get(fd, pbuf) {
      if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(25, 1, fd, pbuf);
      try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var type = stream.tty ? 2 : FS.isDir(stream.mode) ? 3 : FS.isLink(stream.mode) ? 7 : 4;
        HEAP8[pbuf >> 0] = type;
        return 0;
      } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno;
      }
    }
    function _fd_read(fd, iov, iovcnt, pnum) {
      if (ENVIRONMENT_IS_PTHREAD)
        return _emscripten_proxy_to_main_thread_js(26, 1, fd, iov, iovcnt, pnum);
      try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var num = SYSCALLS.doReadv(stream, iov, iovcnt);
        HEAP32[pnum >> 2] = num;
        return 0;
      } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno;
      }
    }
    function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
      if (ENVIRONMENT_IS_PTHREAD)
        return _emscripten_proxy_to_main_thread_js(
          27,
          1,
          fd,
          offset_low,
          offset_high,
          whence,
          newOffset,
        );
      try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var HIGH_OFFSET = 4294967296;
        var offset = offset_high * HIGH_OFFSET + (offset_low >>> 0);
        var DOUBLE_LIMIT = 9007199254740992;
        if (offset <= -DOUBLE_LIMIT || offset >= DOUBLE_LIMIT) {
          return -61;
        }
        FS.llseek(stream, offset, whence);
        (tempI64 = [
          stream.position >>> 0,
          ((tempDouble = stream.position),
          +Math_abs(tempDouble) >= 1
            ? tempDouble > 0
              ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0
              : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0
            : 0),
        ]),
          (HEAP32[newOffset >> 2] = tempI64[0]),
          (HEAP32[(newOffset + 4) >> 2] = tempI64[1]);
        if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
        return 0;
      } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno;
      }
    }
    function _fd_write(fd, iov, iovcnt, pnum) {
      if (ENVIRONMENT_IS_PTHREAD)
        return _emscripten_proxy_to_main_thread_js(28, 1, fd, iov, iovcnt, pnum);
      try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var num = SYSCALLS.doWritev(stream, iov, iovcnt);
        HEAP32[pnum >> 2] = num;
        return 0;
      } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno;
      }
    }
    function _fork() {
      setErrNo(6);
      return -1;
    }
    function _getTempRet0() {
      return getTempRet0() | 0;
    }
    function _gettimeofday(ptr) {
      var now = Date.now();
      HEAP32[ptr >> 2] = (now / 1e3) | 0;
      HEAP32[(ptr + 4) >> 2] = ((now % 1e3) * 1e3) | 0;
      return 0;
    }
    function spawnThread(threadParams) {
      if (ENVIRONMENT_IS_PTHREAD)
        throw 'Internal Error! spawnThread() can only ever be called from main application thread!';
      var worker = PThread.getNewWorker();
      if (worker.pthread !== undefined) throw 'Internal error!';
      if (!threadParams.pthread_ptr) throw 'Internal error, no pthread ptr!';
      PThread.runningWorkers.push(worker);
      var tlsMemory = _malloc(128 * 4);
      for (var i = 0; i < 128; ++i) {
        HEAP32[(tlsMemory + i * 4) >> 2] = 0;
      }
      var stackHigh = threadParams.stackBase + threadParams.stackSize;
      var pthread = (PThread.pthreads[threadParams.pthread_ptr] = {
        worker: worker,
        stackBase: threadParams.stackBase,
        stackSize: threadParams.stackSize,
        allocatedOwnStack: threadParams.allocatedOwnStack,
        thread: threadParams.pthread_ptr,
        threadInfoStruct: threadParams.pthread_ptr,
      });
      var tis = pthread.threadInfoStruct >> 2;
      Atomics.store(HEAPU32, tis + (0 >> 2), 0);
      Atomics.store(HEAPU32, tis + (4 >> 2), 0);
      Atomics.store(HEAPU32, tis + (8 >> 2), 0);
      Atomics.store(HEAPU32, tis + (68 >> 2), threadParams.detached);
      Atomics.store(HEAPU32, tis + (104 >> 2), tlsMemory);
      Atomics.store(HEAPU32, tis + (48 >> 2), 0);
      Atomics.store(HEAPU32, tis + (40 >> 2), pthread.threadInfoStruct);
      Atomics.store(HEAPU32, tis + (44 >> 2), 42);
      Atomics.store(HEAPU32, tis + (108 >> 2), threadParams.stackSize);
      Atomics.store(HEAPU32, tis + (84 >> 2), threadParams.stackSize);
      Atomics.store(HEAPU32, tis + (80 >> 2), stackHigh);
      Atomics.store(HEAPU32, tis + ((108 + 8) >> 2), stackHigh);
      Atomics.store(HEAPU32, tis + ((108 + 12) >> 2), threadParams.detached);
      Atomics.store(HEAPU32, tis + ((108 + 20) >> 2), threadParams.schedPolicy);
      Atomics.store(HEAPU32, tis + ((108 + 24) >> 2), threadParams.schedPrio);
      var global_libc = _emscripten_get_global_libc();
      var global_locale = global_libc + 40;
      Atomics.store(HEAPU32, tis + (176 >> 2), global_locale);
      worker.pthread = pthread;
      var msg = {
        cmd: 'run',
        start_routine: threadParams.startRoutine,
        arg: threadParams.arg,
        threadInfoStruct: threadParams.pthread_ptr,
        selfThreadId: threadParams.pthread_ptr,
        parentThreadId: threadParams.parent_pthread_ptr,
        stackBase: threadParams.stackBase,
        stackSize: threadParams.stackSize,
      };
      worker.runPthread = function () {
        msg.time = performance.now();
        worker.postMessage(msg, threadParams.transferList);
      };
      if (worker.loaded) {
        worker.runPthread();
        delete worker.runPthread;
      }
    }
    function _pthread_getschedparam(thread, policy, schedparam) {
      if (!policy && !schedparam) return ERRNO_CODES.EINVAL;
      if (!thread) {
        err('pthread_getschedparam called with a null thread pointer!');
        return ERRNO_CODES.ESRCH;
      }
      var self = HEAP32[(thread + 12) >> 2];
      if (self !== thread) {
        err(
          'pthread_getschedparam attempted on thread ' +
            thread +
            ', which does not point to a valid thread, or does not exist anymore!',
        );
        return ERRNO_CODES.ESRCH;
      }
      var schedPolicy = Atomics.load(HEAPU32, (thread + 108 + 20) >> 2);
      var schedPrio = Atomics.load(HEAPU32, (thread + 108 + 24) >> 2);
      if (policy) HEAP32[policy >> 2] = schedPolicy;
      if (schedparam) HEAP32[schedparam >> 2] = schedPrio;
      return 0;
    }
    function _pthread_self() {
      return __pthread_ptr | 0;
    }
    Module['_pthread_self'] = _pthread_self;
    function _pthread_create(pthread_ptr, attr, start_routine, arg) {
      if (typeof SharedArrayBuffer === 'undefined') {
        err('Current environment does not support SharedArrayBuffer, pthreads are not available!');
        return 6;
      }
      if (!pthread_ptr) {
        err('pthread_create called with a null thread pointer!');
        return 28;
      }
      var transferList = [];
      var error = 0;
      if (ENVIRONMENT_IS_PTHREAD && (transferList.length === 0 || error)) {
        return _emscripten_sync_run_in_main_thread_4(
          687865856,
          pthread_ptr,
          attr,
          start_routine,
          arg,
        );
      }
      if (error) return error;
      var stackSize = 0;
      var stackBase = 0;
      var detached = 0;
      var schedPolicy = 0;
      var schedPrio = 0;
      if (attr) {
        stackSize = HEAP32[attr >> 2];
        stackSize += 81920;
        stackBase = HEAP32[(attr + 8) >> 2];
        detached = HEAP32[(attr + 12) >> 2] !== 0;
        var inheritSched = HEAP32[(attr + 16) >> 2] === 0;
        if (inheritSched) {
          var prevSchedPolicy = HEAP32[(attr + 20) >> 2];
          var prevSchedPrio = HEAP32[(attr + 24) >> 2];
          var parentThreadPtr = PThread.currentProxiedOperationCallerThread
            ? PThread.currentProxiedOperationCallerThread
            : _pthread_self();
          _pthread_getschedparam(parentThreadPtr, attr + 20, attr + 24);
          schedPolicy = HEAP32[(attr + 20) >> 2];
          schedPrio = HEAP32[(attr + 24) >> 2];
          HEAP32[(attr + 20) >> 2] = prevSchedPolicy;
          HEAP32[(attr + 24) >> 2] = prevSchedPrio;
        } else {
          schedPolicy = HEAP32[(attr + 20) >> 2];
          schedPrio = HEAP32[(attr + 24) >> 2];
        }
      } else {
        stackSize = 2097152;
      }
      var allocatedOwnStack = stackBase == 0;
      if (allocatedOwnStack) {
        stackBase = _memalign(16, stackSize);
      } else {
        stackBase -= stackSize;
        assert(stackBase > 0);
      }
      var threadInfoStruct = _malloc(232);
      for (var i = 0; i < 232 >> 2; ++i) HEAPU32[(threadInfoStruct >> 2) + i] = 0;
      HEAP32[pthread_ptr >> 2] = threadInfoStruct;
      HEAP32[(threadInfoStruct + 12) >> 2] = threadInfoStruct;
      var headPtr = threadInfoStruct + 156;
      HEAP32[headPtr >> 2] = headPtr;
      var threadParams = {
        stackBase: stackBase,
        stackSize: stackSize,
        allocatedOwnStack: allocatedOwnStack,
        schedPolicy: schedPolicy,
        schedPrio: schedPrio,
        detached: detached,
        startRoutine: start_routine,
        pthread_ptr: threadInfoStruct,
        parent_pthread_ptr: _pthread_self(),
        arg: arg,
        transferList: transferList,
      };
      if (ENVIRONMENT_IS_PTHREAD) {
        threadParams.cmd = 'spawnThread';
        postMessage(threadParams, transferList);
      } else {
        spawnThread(threadParams);
      }
      return 0;
    }
    function _pthread_detach(thread) {
      if (!thread) {
        err('pthread_detach attempted on a null thread pointer!');
        return ERRNO_CODES.ESRCH;
      }
      var self = HEAP32[(thread + 12) >> 2];
      if (self !== thread) {
        err(
          'pthread_detach attempted on thread ' +
            thread +
            ', which does not point to a valid thread, or does not exist anymore!',
        );
        return ERRNO_CODES.ESRCH;
      }
      var threadStatus = Atomics.load(HEAPU32, (thread + 0) >> 2);
      var wasDetached = Atomics.compareExchange(HEAPU32, (thread + 68) >> 2, 0, 2);
      return wasDetached ? ERRNO_CODES.EINVAL : 0;
    }
    function _pthread_sigmask(how, set, oldset) {
      err('pthread_sigmask() is not supported: this is a no-op.');
      return 0;
    }
    function _raise(sig) {
      setErrNo(ERRNO_CODES.ENOSYS);
      return -1;
    }
    function _setTempRet0($i) {
      setTempRet0($i | 0);
    }
    function _sigfillset(set) {
      HEAP32[set >> 2] = -1 >>> 0;
      return 0;
    }
    var __sigalrm_handler = 0;
    function _signal(sig, func) {
      if (sig == 14) {
        __sigalrm_handler = func;
      } else {
      }
      return 0;
    }
    function __isLeapYear(year) {
      return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    }
    function __arraySum(array, index) {
      var sum = 0;
      for (var i = 0; i <= index; sum += array[i++]) {}
      return sum;
    }
    var __MONTH_DAYS_LEAP = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var __MONTH_DAYS_REGULAR = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    function __addDays(date, days) {
      var newDate = new Date(date.getTime());
      while (days > 0) {
        var leap = __isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
        if (days > daysInCurrentMonth - newDate.getDate()) {
          days -= daysInCurrentMonth - newDate.getDate() + 1;
          newDate.setDate(1);
          if (currentMonth < 11) {
            newDate.setMonth(currentMonth + 1);
          } else {
            newDate.setMonth(0);
            newDate.setFullYear(newDate.getFullYear() + 1);
          }
        } else {
          newDate.setDate(newDate.getDate() + days);
          return newDate;
        }
      }
      return newDate;
    }
    function _strftime(s, maxsize, format, tm) {
      var tm_zone = HEAP32[(tm + 40) >> 2];
      var date = {
        tm_sec: HEAP32[tm >> 2],
        tm_min: HEAP32[(tm + 4) >> 2],
        tm_hour: HEAP32[(tm + 8) >> 2],
        tm_mday: HEAP32[(tm + 12) >> 2],
        tm_mon: HEAP32[(tm + 16) >> 2],
        tm_year: HEAP32[(tm + 20) >> 2],
        tm_wday: HEAP32[(tm + 24) >> 2],
        tm_yday: HEAP32[(tm + 28) >> 2],
        tm_isdst: HEAP32[(tm + 32) >> 2],
        tm_gmtoff: HEAP32[(tm + 36) >> 2],
        tm_zone: tm_zone ? UTF8ToString(tm_zone) : '',
      };
      var pattern = UTF8ToString(format);
      var EXPANSION_RULES_1 = {
        '%c': '%a %b %d %H:%M:%S %Y',
        '%D': '%m/%d/%y',
        '%F': '%Y-%m-%d',
        '%h': '%b',
        '%r': '%I:%M:%S %p',
        '%R': '%H:%M',
        '%T': '%H:%M:%S',
        '%x': '%m/%d/%y',
        '%X': '%H:%M:%S',
        '%Ec': '%c',
        '%EC': '%C',
        '%Ex': '%m/%d/%y',
        '%EX': '%H:%M:%S',
        '%Ey': '%y',
        '%EY': '%Y',
        '%Od': '%d',
        '%Oe': '%e',
        '%OH': '%H',
        '%OI': '%I',
        '%Om': '%m',
        '%OM': '%M',
        '%OS': '%S',
        '%Ou': '%u',
        '%OU': '%U',
        '%OV': '%V',
        '%Ow': '%w',
        '%OW': '%W',
        '%Oy': '%y',
      };
      for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_1[rule]);
      }
      var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var MONTHS = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      function leadingSomething(value, digits, character) {
        var str = typeof value === 'number' ? value.toString() : value || '';
        while (str.length < digits) {
          str = character[0] + str;
        }
        return str;
      }
      function leadingNulls(value, digits) {
        return leadingSomething(value, digits, '0');
      }
      function compareByDay(date1, date2) {
        function sgn(value) {
          return value < 0 ? -1 : value > 0 ? 1 : 0;
        }
        var compare;
        if ((compare = sgn(date1.getFullYear() - date2.getFullYear())) === 0) {
          if ((compare = sgn(date1.getMonth() - date2.getMonth())) === 0) {
            compare = sgn(date1.getDate() - date2.getDate());
          }
        }
        return compare;
      }
      function getFirstWeekStartDate(janFourth) {
        switch (janFourth.getDay()) {
          case 0:
            return new Date(janFourth.getFullYear() - 1, 11, 29);
          case 1:
            return janFourth;
          case 2:
            return new Date(janFourth.getFullYear(), 0, 3);
          case 3:
            return new Date(janFourth.getFullYear(), 0, 2);
          case 4:
            return new Date(janFourth.getFullYear(), 0, 1);
          case 5:
            return new Date(janFourth.getFullYear() - 1, 11, 31);
          case 6:
            return new Date(janFourth.getFullYear() - 1, 11, 30);
        }
      }
      function getWeekBasedYear(date) {
        var thisDate = __addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
        var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
        var janFourthNextYear = new Date(thisDate.getFullYear() + 1, 0, 4);
        var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
        var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
        if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
          if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
            return thisDate.getFullYear() + 1;
          } else {
            return thisDate.getFullYear();
          }
        } else {
          return thisDate.getFullYear() - 1;
        }
      }
      var EXPANSION_RULES_2 = {
        '%a': function (date) {
          return WEEKDAYS[date.tm_wday].substring(0, 3);
        },
        '%A': function (date) {
          return WEEKDAYS[date.tm_wday];
        },
        '%b': function (date) {
          return MONTHS[date.tm_mon].substring(0, 3);
        },
        '%B': function (date) {
          return MONTHS[date.tm_mon];
        },
        '%C': function (date) {
          var year = date.tm_year + 1900;
          return leadingNulls((year / 100) | 0, 2);
        },
        '%d': function (date) {
          return leadingNulls(date.tm_mday, 2);
        },
        '%e': function (date) {
          return leadingSomething(date.tm_mday, 2, ' ');
        },
        '%g': function (date) {
          return getWeekBasedYear(date).toString().substring(2);
        },
        '%G': function (date) {
          return getWeekBasedYear(date);
        },
        '%H': function (date) {
          return leadingNulls(date.tm_hour, 2);
        },
        '%I': function (date) {
          var twelveHour = date.tm_hour;
          if (twelveHour == 0) twelveHour = 12;
          else if (twelveHour > 12) twelveHour -= 12;
          return leadingNulls(twelveHour, 2);
        },
        '%j': function (date) {
          return leadingNulls(
            date.tm_mday +
              __arraySum(
                __isLeapYear(date.tm_year + 1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR,
                date.tm_mon - 1,
              ),
            3,
          );
        },
        '%m': function (date) {
          return leadingNulls(date.tm_mon + 1, 2);
        },
        '%M': function (date) {
          return leadingNulls(date.tm_min, 2);
        },
        '%n': function () {
          return '\n';
        },
        '%p': function (date) {
          if (date.tm_hour >= 0 && date.tm_hour < 12) {
            return 'AM';
          } else {
            return 'PM';
          }
        },
        '%S': function (date) {
          return leadingNulls(date.tm_sec, 2);
        },
        '%t': function () {
          return '\t';
        },
        '%u': function (date) {
          return date.tm_wday || 7;
        },
        '%U': function (date) {
          var janFirst = new Date(date.tm_year + 1900, 0, 1);
          var firstSunday =
            janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7 - janFirst.getDay());
          var endDate = new Date(date.tm_year + 1900, date.tm_mon, date.tm_mday);
          if (compareByDay(firstSunday, endDate) < 0) {
            var februaryFirstUntilEndMonth =
              __arraySum(
                __isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR,
                endDate.getMonth() - 1,
              ) - 31;
            var firstSundayUntilEndJanuary = 31 - firstSunday.getDate();
            var days = firstSundayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
            return leadingNulls(Math.ceil(days / 7), 2);
          }
          return compareByDay(firstSunday, janFirst) === 0 ? '01' : '00';
        },
        '%V': function (date) {
          var janFourthThisYear = new Date(date.tm_year + 1900, 0, 4);
          var janFourthNextYear = new Date(date.tm_year + 1901, 0, 4);
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
          var endDate = __addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
          if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
            return '53';
          }
          if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
            return '01';
          }
          var daysDifference;
          if (firstWeekStartThisYear.getFullYear() < date.tm_year + 1900) {
            daysDifference = date.tm_yday + 32 - firstWeekStartThisYear.getDate();
          } else {
            daysDifference = date.tm_yday + 1 - firstWeekStartThisYear.getDate();
          }
          return leadingNulls(Math.ceil(daysDifference / 7), 2);
        },
        '%w': function (date) {
          return date.tm_wday;
        },
        '%W': function (date) {
          var janFirst = new Date(date.tm_year, 0, 1);
          var firstMonday =
            janFirst.getDay() === 1
              ? janFirst
              : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7 - janFirst.getDay() + 1);
          var endDate = new Date(date.tm_year + 1900, date.tm_mon, date.tm_mday);
          if (compareByDay(firstMonday, endDate) < 0) {
            var februaryFirstUntilEndMonth =
              __arraySum(
                __isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR,
                endDate.getMonth() - 1,
              ) - 31;
            var firstMondayUntilEndJanuary = 31 - firstMonday.getDate();
            var days = firstMondayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
            return leadingNulls(Math.ceil(days / 7), 2);
          }
          return compareByDay(firstMonday, janFirst) === 0 ? '01' : '00';
        },
        '%y': function (date) {
          return (date.tm_year + 1900).toString().substring(2);
        },
        '%Y': function (date) {
          return date.tm_year + 1900;
        },
        '%z': function (date) {
          var off = date.tm_gmtoff;
          var ahead = off >= 0;
          off = Math.abs(off) / 60;
          off = (off / 60) * 100 + (off % 60);
          return (ahead ? '+' : '-') + String('0000' + off).slice(-4);
        },
        '%Z': function (date) {
          return date.tm_zone;
        },
        '%%': function () {
          return '%';
        },
      };
      for (var rule in EXPANSION_RULES_2) {
        if (pattern.indexOf(rule) >= 0) {
          pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_2[rule](date));
        }
      }
      var bytes = intArrayFromString(pattern, false);
      if (bytes.length > maxsize) {
        return 0;
      }
      writeArrayToMemory(bytes, s);
      return bytes.length - 1;
    }
    function _sysconf(name) {
      if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(29, 1, name);
      switch (name) {
        case 30:
          return 16384;
        case 85:
          var maxHeapSize = HEAPU8.length;
          return maxHeapSize / 16384;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
        case 79:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0:
          return 2097152;
        case 3:
          return 65536;
        case 28:
          return 32768;
        case 44:
          return 32767;
        case 75:
          return 16384;
        case 39:
          return 1e3;
        case 89:
          return 700;
        case 71:
          return 256;
        case 40:
          return 255;
        case 2:
          return 100;
        case 180:
          return 64;
        case 25:
          return 20;
        case 5:
          return 16;
        case 6:
          return 6;
        case 73:
          return 4;
        case 84: {
          if (typeof navigator === 'object') return navigator['hardwareConcurrency'] || 1;
          return 1;
        }
      }
      setErrNo(28);
      return -1;
    }
    function _time(ptr) {
      var ret = (Date.now() / 1e3) | 0;
      if (ptr) {
        HEAP32[ptr >> 2] = ret;
      }
      return ret;
    }
    if (!ENVIRONMENT_IS_PTHREAD) PThread.initMainThreadBlock();
    else PThread.initWorker();
    var FSNode = function (parent, name, mode, rdev) {
      if (!parent) {
        parent = this;
      }
      this.parent = parent;
      this.mount = parent.mount;
      this.mounted = null;
      this.id = FS.nextInode++;
      this.name = name;
      this.mode = mode;
      this.node_ops = {};
      this.stream_ops = {};
      this.rdev = rdev;
    };
    var readMode = 292 | 73;
    var writeMode = 146;
    Object.defineProperties(FSNode.prototype, {
      read: {
        get: function () {
          return (this.mode & readMode) === readMode;
        },
        set: function (val) {
          val ? (this.mode |= readMode) : (this.mode &= ~readMode);
        },
      },
      write: {
        get: function () {
          return (this.mode & writeMode) === writeMode;
        },
        set: function (val) {
          val ? (this.mode |= writeMode) : (this.mode &= ~writeMode);
        },
      },
      isFolder: {
        get: function () {
          return FS.isDir(this.mode);
        },
      },
      isDevice: {
        get: function () {
          return FS.isChrdev(this.mode);
        },
      },
    });
    FS.FSNode = FSNode;
    FS.staticInit();
    if (ENVIRONMENT_IS_NODE) {
      var fs = require('fs');
      var NODEJS_PATH = require('path');
      NODEFS.staticInit();
    }
    if (ENVIRONMENT_IS_NODE) {
      var _wrapNodeError = function (func) {
        return function () {
          try {
            return func.apply(this, arguments);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        };
      };
      var VFS = Object.assign({}, FS);
      for (var _key in NODERAWFS) FS[_key] = _wrapNodeError(NODERAWFS[_key]);
    } else {
      throw new Error('NODERAWFS is currently only supported on Node.js environment.');
    }
    InternalError = Module['InternalError'] = extendError(Error, 'InternalError');
    embind_init_charCodes();
    BindingError = Module['BindingError'] = extendError(Error, 'BindingError');
    init_ClassHandle();
    init_RegisteredPointer();
    init_embind();
    UnboundTypeError = Module['UnboundTypeError'] = extendError(Error, 'UnboundTypeError');
    init_emval();
    var GLctx;
    var proxiedFunctionTable = [
      null,
      _tzset,
      ___sys_access,
      ___sys_chdir,
      ___sys_dup,
      ___sys_dup2,
      ___sys_fcntl64,
      ___sys_fstat64,
      ___sys_ftruncate64,
      ___sys_getcwd,
      ___sys_getdents64,
      ___sys_ioctl,
      ___sys_lstat64,
      ___sys_mmap2,
      ___sys_munmap,
      ___sys_open,
      ___sys_pipe,
      ___sys_poll,
      ___sys_read,
      ___sys_readlink,
      ___sys_rmdir,
      ___sys_stat64,
      ___sys_unlink,
      _emscripten_set_canvas_element_size_main_thread,
      _fd_close,
      _fd_fdstat_get,
      _fd_read,
      _fd_seek,
      _fd_write,
      _sysconf,
    ];
    function intArrayFromString(stringy, dontAddNull, length) {
      var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
      var u8array = new Array(len);
      var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
      if (dontAddNull) u8array.length = numBytesWritten;
      return u8array;
    }
    var asmLibraryArg = {
      rb: ___asctime_r,
      d: ___assert_fail,
      lb: ___clock_gettime,
      qb: ___gmtime_r,
      pb: ___localtime_r,
      xa: ___map_file,
      za: ___sys_access,
      Aa: ___sys_dup,
      Ea: ___sys_dup2,
      z: ___sys_fcntl64,
      Ga: ___sys_fstat64,
      xb: ___sys_ftruncate64,
      Fa: ___sys_getcwd,
      wb: ___sys_getdents64,
      Q: ___sys_getpid,
      Ba: ___sys_getppid,
      yb: ___sys_getuid32,
      tb: ___sys_ioctl,
      Ha: ___sys_lstat64,
      vb: ___sys_mmap2,
      ub: ___sys_munmap,
      ga: ___sys_open,
      zb: ___sys_pipe,
      Da: ___sys_pipe2,
      Ja: ___sys_poll,
      ya: ___sys_read,
      Ab: ___sys_readlink,
      Ca: ___sys_rmdir,
      fa: ___sys_stat64,
      da: ___sys_unlink,
      Ia: ___sys_wait4,
      sa: __embind_finalize_value_object,
      ua: __embind_register_arithmetic_vector,
      Ma: __embind_register_bool,
      B: __embind_register_class,
      h: __embind_register_class_class_function,
      D: __embind_register_class_constructor,
      c: __embind_register_class_function,
      w: __embind_register_class_property,
      La: __embind_register_emval,
      l: __embind_register_enum,
      f: __embind_register_enum_value,
      ha: __embind_register_float,
      E: __embind_register_integer,
      A: __embind_register_memory_view,
      ia: __embind_register_std_string,
      _: __embind_register_std_wstring,
      ta: __embind_register_value_object,
      N: __embind_register_value_object_field,
      Na: __embind_register_void,
      jb: __emscripten_notify_thread_queue,
      o: __emval_as,
      ba: __emval_call,
      $a: __emval_call_method,
      a: __emval_decref,
      C: __emval_get_global,
      ab: __emval_get_method_caller,
      ca: __emval_get_module_property,
      j: __emval_get_property,
      b: __emval_incref,
      F: __emval_instanceof,
      V: __emval_is_number,
      va: __emval_is_string,
      k: __emval_new_cstring,
      n: __emval_run_destructors,
      O: __emval_set_property,
      m: __emval_take_value,
      Y: __emval_typeof,
      L: __exit,
      q: _abort,
      T: _clock_gettime,
      ka: _dlclose,
      K: _dlerror,
      la: _dlopen,
      Oa: _dlsym,
      W: _emscripten_asm_const_int,
      X: _emscripten_conditional_set_current_thread_status,
      J: _emscripten_futex_wait,
      x: _emscripten_futex_wake,
      H: _emscripten_get_now,
      P: _emscripten_is_main_browser_thread,
      kb: _emscripten_is_main_runtime_thread,
      i: _emscripten_longjmp,
      fb: _emscripten_memcpy_big,
      na: _emscripten_num_logical_cores,
      gb: _emscripten_receive_on_main_thread_js,
      mb: _emscripten_resize_heap,
      hb: _emscripten_set_canvas_element_size,
      wa: _emscripten_set_current_thread_status,
      eb: _emscripten_stack_get_end,
      ib: _emscripten_webgl_create_context,
      nb: _environ_get,
      ob: _environ_sizes_get,
      Ra: _execve,
      qa: _exit,
      R: _fd_close,
      ea: _fd_fdstat_get,
      sb: _fd_read,
      bb: _fd_seek,
      Z: _fd_write,
      ja: ffi_call,
      Ta: _fork,
      e: _getTempRet0,
      pa: _gettimeofday,
      db: initPthreadsJS,
      M: invoke_i,
      s: invoke_ii,
      u: invoke_iii,
      t: invoke_iiii,
      G: invoke_iiiii,
      _a: invoke_iiiiii,
      aa: invoke_iiiiiii,
      Za: invoke_iiiiiiii,
      Ya: invoke_iiiiiiiiiiii,
      cb: invoke_ji,
      p: invoke_vi,
      I: invoke_vii,
      v: invoke_viii,
      y: invoke_viiii,
      ra: invoke_viiiiii,
      Xa: invoke_viiiiiiiii,
      Sa: _localtime_r,
      memory: wasmMemory || Module['wasmMemory'],
      ma: _pthread_create,
      Qa: _pthread_detach,
      r: _pthread_self,
      oa: _pthread_sigmask,
      $: _raise,
      g: _setTempRet0,
      Wa: _sigfillset,
      S: _signal,
      Va: _strftime,
      Ua: _sysconf,
      table: wasmTable,
      Pa: throw_type_error_js,
      Ka: throw_vips_error_js,
      U: _time,
    };
    var asm = createWasm();
    var ___wasm_call_ctors = (Module['___wasm_call_ctors'] = function () {
      return (___wasm_call_ctors = Module['___wasm_call_ctors'] = Module['asm']['Bb']).apply(
        null,
        arguments,
      );
    });
    var __ZdlPv = (Module['__ZdlPv'] = function () {
      return (__ZdlPv = Module['__ZdlPv'] = Module['asm']['Cb']).apply(null, arguments);
    });
    var __Znwm = (Module['__Znwm'] = function () {
      return (__Znwm = Module['__Znwm'] = Module['asm']['Db']).apply(null, arguments);
    });
    var ___em_js__throw_type_error_js = (Module['___em_js__throw_type_error_js'] = function () {
      return (___em_js__throw_type_error_js = Module['___em_js__throw_type_error_js'] =
        Module['asm']['Eb']).apply(null, arguments);
    });
    var ___em_js__throw_vips_error_js = (Module['___em_js__throw_vips_error_js'] = function () {
      return (___em_js__throw_vips_error_js = Module['___em_js__throw_vips_error_js'] =
        Module['asm']['Fb']).apply(null, arguments);
    });
    var _malloc = (Module['_malloc'] = function () {
      return (_malloc = Module['_malloc'] = Module['asm']['Gb']).apply(null, arguments);
    });
    var ___cxa_guard_acquire = (Module['___cxa_guard_acquire'] = function () {
      return (___cxa_guard_acquire = Module['___cxa_guard_acquire'] = Module['asm']['Hb']).apply(
        null,
        arguments,
      );
    });
    var ___cxa_guard_release = (Module['___cxa_guard_release'] = function () {
      return (___cxa_guard_release = Module['___cxa_guard_release'] = Module['asm']['Ib']).apply(
        null,
        arguments,
      );
    });
    var _main = (Module['_main'] = function () {
      return (_main = Module['_main'] = Module['asm']['Jb']).apply(null, arguments);
    });
    var _free = (Module['_free'] = function () {
      return (_free = Module['_free'] = Module['asm']['Kb']).apply(null, arguments);
    });
    var ___errno_location = (Module['___errno_location'] = function () {
      return (___errno_location = Module['___errno_location'] = Module['asm']['Lb']).apply(
        null,
        arguments,
      );
    });
    var ___em_js__ffi_call = (Module['___em_js__ffi_call'] = function () {
      return (___em_js__ffi_call = Module['___em_js__ffi_call'] = Module['asm']['Mb']).apply(
        null,
        arguments,
      );
    });
    var ___getTypeName = (Module['___getTypeName'] = function () {
      return (___getTypeName = Module['___getTypeName'] = Module['asm']['Nb']).apply(
        null,
        arguments,
      );
    });
    var ___embind_register_native_and_builtin_types = (Module[
      '___embind_register_native_and_builtin_types'
    ] = function () {
      return (___embind_register_native_and_builtin_types = Module[
        '___embind_register_native_and_builtin_types'
      ] = Module['asm']['Ob']).apply(null, arguments);
    });
    var ___em_js__initPthreadsJS = (Module['___em_js__initPthreadsJS'] = function () {
      return (___em_js__initPthreadsJS = Module['___em_js__initPthreadsJS'] =
        Module['asm']['Pb']).apply(null, arguments);
    });
    var _memset = (Module['_memset'] = function () {
      return (_memset = Module['_memset'] = Module['asm']['Qb']).apply(null, arguments);
    });
    var _emscripten_get_global_libc = (Module['_emscripten_get_global_libc'] = function () {
      return (_emscripten_get_global_libc = Module['_emscripten_get_global_libc'] =
        Module['asm']['Rb']).apply(null, arguments);
    });
    var __get_tzname = (Module['__get_tzname'] = function () {
      return (__get_tzname = Module['__get_tzname'] = Module['asm']['Sb']).apply(null, arguments);
    });
    var __get_daylight = (Module['__get_daylight'] = function () {
      return (__get_daylight = Module['__get_daylight'] = Module['asm']['Tb']).apply(
        null,
        arguments,
      );
    });
    var __get_timezone = (Module['__get_timezone'] = function () {
      return (__get_timezone = Module['__get_timezone'] = Module['asm']['Ub']).apply(
        null,
        arguments,
      );
    });
    var _setThrew = (Module['_setThrew'] = function () {
      return (_setThrew = Module['_setThrew'] = Module['asm']['Vb']).apply(null, arguments);
    });
    var stackSave = (Module['stackSave'] = function () {
      return (stackSave = Module['stackSave'] = Module['asm']['Wb']).apply(null, arguments);
    });
    var stackRestore = (Module['stackRestore'] = function () {
      return (stackRestore = Module['stackRestore'] = Module['asm']['Xb']).apply(null, arguments);
    });
    var stackAlloc = (Module['stackAlloc'] = function () {
      return (stackAlloc = Module['stackAlloc'] = Module['asm']['Yb']).apply(null, arguments);
    });
    var _emscripten_stack_init = (Module['_emscripten_stack_init'] = function () {
      return (_emscripten_stack_init = Module['_emscripten_stack_init'] =
        Module['asm']['Zb']).apply(null, arguments);
    });
    var _emscripten_stack_get_current = (Module['_emscripten_stack_get_current'] = function () {
      return (_emscripten_stack_get_current = Module['_emscripten_stack_get_current'] =
        Module['asm']['_b']).apply(null, arguments);
    });
    var _emscripten_stack_get_free = (Module['_emscripten_stack_get_free'] = function () {
      return (_emscripten_stack_get_free = Module['_emscripten_stack_get_free'] =
        Module['asm']['$b']).apply(null, arguments);
    });
    var __Znam = (Module['__Znam'] = function () {
      return (__Znam = Module['__Znam'] = Module['asm']['ac']).apply(null, arguments);
    });
    var __ZdaPv = (Module['__ZdaPv'] = function () {
      return (__ZdaPv = Module['__ZdaPv'] = Module['asm']['bc']).apply(null, arguments);
    });
    var ___cxa_guard_abort = (Module['___cxa_guard_abort'] = function () {
      return (___cxa_guard_abort = Module['___cxa_guard_abort'] = Module['asm']['cc']).apply(
        null,
        arguments,
      );
    });
    var _memalign = (Module['_memalign'] = function () {
      return (_memalign = Module['_memalign'] = Module['asm']['dc']).apply(null, arguments);
    });
    var ___pthread_tsd_run_dtors = (Module['___pthread_tsd_run_dtors'] = function () {
      return (___pthread_tsd_run_dtors = Module['___pthread_tsd_run_dtors'] =
        Module['asm']['ec']).apply(null, arguments);
    });
    var _emscripten_main_thread_process_queued_calls = (Module[
      '_emscripten_main_thread_process_queued_calls'
    ] = function () {
      return (_emscripten_main_thread_process_queued_calls = Module[
        '_emscripten_main_thread_process_queued_calls'
      ] = Module['asm']['fc']).apply(null, arguments);
    });
    var _emscripten_current_thread_process_queued_calls = (Module[
      '_emscripten_current_thread_process_queued_calls'
    ] = function () {
      return (_emscripten_current_thread_process_queued_calls = Module[
        '_emscripten_current_thread_process_queued_calls'
      ] = Module['asm']['gc']).apply(null, arguments);
    });
    var _emscripten_register_main_browser_thread_id = (Module[
      '_emscripten_register_main_browser_thread_id'
    ] = function () {
      return (_emscripten_register_main_browser_thread_id = Module[
        '_emscripten_register_main_browser_thread_id'
      ] = Module['asm']['hc']).apply(null, arguments);
    });
    var _emscripten_main_browser_thread_id = (Module[
      '_emscripten_main_browser_thread_id'
    ] = function () {
      return (_emscripten_main_browser_thread_id = Module['_emscripten_main_browser_thread_id'] =
        Module['asm']['ic']).apply(null, arguments);
    });
    var _do_emscripten_dispatch_to_thread = (Module[
      '_do_emscripten_dispatch_to_thread'
    ] = function () {
      return (_do_emscripten_dispatch_to_thread = Module['_do_emscripten_dispatch_to_thread'] =
        Module['asm']['jc']).apply(null, arguments);
    });
    var _emscripten_async_run_in_main_thread = (Module[
      '_emscripten_async_run_in_main_thread'
    ] = function () {
      return (_emscripten_async_run_in_main_thread = Module[
        '_emscripten_async_run_in_main_thread'
      ] = Module['asm']['kc']).apply(null, arguments);
    });
    var _emscripten_sync_run_in_main_thread = (Module[
      '_emscripten_sync_run_in_main_thread'
    ] = function () {
      return (_emscripten_sync_run_in_main_thread = Module['_emscripten_sync_run_in_main_thread'] =
        Module['asm']['lc']).apply(null, arguments);
    });
    var _emscripten_sync_run_in_main_thread_0 = (Module[
      '_emscripten_sync_run_in_main_thread_0'
    ] = function () {
      return (_emscripten_sync_run_in_main_thread_0 = Module[
        '_emscripten_sync_run_in_main_thread_0'
      ] = Module['asm']['mc']).apply(null, arguments);
    });
    var _emscripten_sync_run_in_main_thread_1 = (Module[
      '_emscripten_sync_run_in_main_thread_1'
    ] = function () {
      return (_emscripten_sync_run_in_main_thread_1 = Module[
        '_emscripten_sync_run_in_main_thread_1'
      ] = Module['asm']['nc']).apply(null, arguments);
    });
    var _emscripten_sync_run_in_main_thread_2 = (Module[
      '_emscripten_sync_run_in_main_thread_2'
    ] = function () {
      return (_emscripten_sync_run_in_main_thread_2 = Module[
        '_emscripten_sync_run_in_main_thread_2'
      ] = Module['asm']['oc']).apply(null, arguments);
    });
    var _emscripten_sync_run_in_main_thread_xprintf_varargs = (Module[
      '_emscripten_sync_run_in_main_thread_xprintf_varargs'
    ] = function () {
      return (_emscripten_sync_run_in_main_thread_xprintf_varargs = Module[
        '_emscripten_sync_run_in_main_thread_xprintf_varargs'
      ] = Module['asm']['pc']).apply(null, arguments);
    });
    var _emscripten_sync_run_in_main_thread_3 = (Module[
      '_emscripten_sync_run_in_main_thread_3'
    ] = function () {
      return (_emscripten_sync_run_in_main_thread_3 = Module[
        '_emscripten_sync_run_in_main_thread_3'
      ] = Module['asm']['qc']).apply(null, arguments);
    });
    var _emscripten_sync_run_in_main_thread_4 = (Module[
      '_emscripten_sync_run_in_main_thread_4'
    ] = function () {
      return (_emscripten_sync_run_in_main_thread_4 = Module[
        '_emscripten_sync_run_in_main_thread_4'
      ] = Module['asm']['rc']).apply(null, arguments);
    });
    var _emscripten_sync_run_in_main_thread_5 = (Module[
      '_emscripten_sync_run_in_main_thread_5'
    ] = function () {
      return (_emscripten_sync_run_in_main_thread_5 = Module[
        '_emscripten_sync_run_in_main_thread_5'
      ] = Module['asm']['sc']).apply(null, arguments);
    });
    var _emscripten_sync_run_in_main_thread_6 = (Module[
      '_emscripten_sync_run_in_main_thread_6'
    ] = function () {
      return (_emscripten_sync_run_in_main_thread_6 = Module[
        '_emscripten_sync_run_in_main_thread_6'
      ] = Module['asm']['tc']).apply(null, arguments);
    });
    var _emscripten_sync_run_in_main_thread_7 = (Module[
      '_emscripten_sync_run_in_main_thread_7'
    ] = function () {
      return (_emscripten_sync_run_in_main_thread_7 = Module[
        '_emscripten_sync_run_in_main_thread_7'
      ] = Module['asm']['uc']).apply(null, arguments);
    });
    var _emscripten_run_in_main_runtime_thread_js = (Module[
      '_emscripten_run_in_main_runtime_thread_js'
    ] = function () {
      return (_emscripten_run_in_main_runtime_thread_js = Module[
        '_emscripten_run_in_main_runtime_thread_js'
      ] = Module['asm']['vc']).apply(null, arguments);
    });
    var __emscripten_call_on_thread = (Module['__emscripten_call_on_thread'] = function () {
      return (__emscripten_call_on_thread = Module['__emscripten_call_on_thread'] =
        Module['asm']['wc']).apply(null, arguments);
    });
    var _emscripten_tls_init = (Module['_emscripten_tls_init'] = function () {
      return (_emscripten_tls_init = Module['_emscripten_tls_init'] = Module['asm']['xc']).apply(
        null,
        arguments,
      );
    });
    var dynCall_ji = (Module['dynCall_ji'] = function () {
      return (dynCall_ji = Module['dynCall_ji'] = Module['asm']['yc']).apply(null, arguments);
    });
    var dynCall_jiiji = (Module['dynCall_jiiji'] = function () {
      return (dynCall_jiiji = Module['dynCall_jiiji'] = Module['asm']['zc']).apply(null, arguments);
    });
    var dynCall_jijii = (Module['dynCall_jijii'] = function () {
      return (dynCall_jijii = Module['dynCall_jijii'] = Module['asm']['Ac']).apply(null, arguments);
    });
    var dynCall_jiji = (Module['dynCall_jiji'] = function () {
      return (dynCall_jiji = Module['dynCall_jiji'] = Module['asm']['Bc']).apply(null, arguments);
    });
    var dynCall_viij = (Module['dynCall_viij'] = function () {
      return (dynCall_viij = Module['dynCall_viij'] = Module['asm']['Cc']).apply(null, arguments);
    });
    var dynCall_iijii = (Module['dynCall_iijii'] = function () {
      return (dynCall_iijii = Module['dynCall_iijii'] = Module['asm']['Dc']).apply(null, arguments);
    });
    var dynCall_iijiii = (Module['dynCall_iijiii'] = function () {
      return (dynCall_iijiii = Module['dynCall_iijiii'] = Module['asm']['Ec']).apply(
        null,
        arguments,
      );
    });
    var dynCall_jiii = (Module['dynCall_jiii'] = function () {
      return (dynCall_jiii = Module['dynCall_jiii'] = Module['asm']['Fc']).apply(null, arguments);
    });
    var dynCall_jiij = (Module['dynCall_jiij'] = function () {
      return (dynCall_jiij = Module['dynCall_jiij'] = Module['asm']['Gc']).apply(null, arguments);
    });
    var dynCall_jiiii = (Module['dynCall_jiiii'] = function () {
      return (dynCall_jiiii = Module['dynCall_jiiii'] = Module['asm']['Hc']).apply(null, arguments);
    });
    var dynCall_iiij = (Module['dynCall_iiij'] = function () {
      return (dynCall_iiij = Module['dynCall_iiij'] = Module['asm']['Ic']).apply(null, arguments);
    });
    Module['___cxa_unexpected_handler'] = 1920624;
    Module['___cxa_terminate_handler'] = 1920620;
    Module['___cxa_new_handler'] = 3827192;
    function invoke_iiiiii(index, a1, a2, a3, a4, a5) {
      var sp = stackSave();
      try {
        return wasmTable.get(index)(a1, a2, a3, a4, a5);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== 'longjmp') throw e;
        _setThrew(1, 0);
      }
    }
    function invoke_ii(index, a1) {
      var sp = stackSave();
      try {
        return wasmTable.get(index)(a1);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== 'longjmp') throw e;
        _setThrew(1, 0);
      }
    }
    function invoke_iiii(index, a1, a2, a3) {
      var sp = stackSave();
      try {
        return wasmTable.get(index)(a1, a2, a3);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== 'longjmp') throw e;
        _setThrew(1, 0);
      }
    }
    function invoke_viii(index, a1, a2, a3) {
      var sp = stackSave();
      try {
        wasmTable.get(index)(a1, a2, a3);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== 'longjmp') throw e;
        _setThrew(1, 0);
      }
    }
    function invoke_iii(index, a1, a2) {
      var sp = stackSave();
      try {
        return wasmTable.get(index)(a1, a2);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== 'longjmp') throw e;
        _setThrew(1, 0);
      }
    }
    function invoke_vi(index, a1) {
      var sp = stackSave();
      try {
        wasmTable.get(index)(a1);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== 'longjmp') throw e;
        _setThrew(1, 0);
      }
    }
    function invoke_i(index) {
      var sp = stackSave();
      try {
        return wasmTable.get(index)();
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== 'longjmp') throw e;
        _setThrew(1, 0);
      }
    }
    function invoke_iiiiiii(index, a1, a2, a3, a4, a5, a6) {
      var sp = stackSave();
      try {
        return wasmTable.get(index)(a1, a2, a3, a4, a5, a6);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== 'longjmp') throw e;
        _setThrew(1, 0);
      }
    }
    function invoke_iiiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
      var sp = stackSave();
      try {
        return wasmTable.get(index)(a1, a2, a3, a4, a5, a6, a7);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== 'longjmp') throw e;
        _setThrew(1, 0);
      }
    }
    function invoke_iiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
      var sp = stackSave();
      try {
        return wasmTable.get(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== 'longjmp') throw e;
        _setThrew(1, 0);
      }
    }
    function invoke_viiii(index, a1, a2, a3, a4) {
      var sp = stackSave();
      try {
        wasmTable.get(index)(a1, a2, a3, a4);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== 'longjmp') throw e;
        _setThrew(1, 0);
      }
    }
    function invoke_vii(index, a1, a2) {
      var sp = stackSave();
      try {
        wasmTable.get(index)(a1, a2);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== 'longjmp') throw e;
        _setThrew(1, 0);
      }
    }
    function invoke_iiiii(index, a1, a2, a3, a4) {
      var sp = stackSave();
      try {
        return wasmTable.get(index)(a1, a2, a3, a4);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== 'longjmp') throw e;
        _setThrew(1, 0);
      }
    }
    function invoke_viiiiii(index, a1, a2, a3, a4, a5, a6) {
      var sp = stackSave();
      try {
        wasmTable.get(index)(a1, a2, a3, a4, a5, a6);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== 'longjmp') throw e;
        _setThrew(1, 0);
      }
    }
    function invoke_viiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
      var sp = stackSave();
      try {
        wasmTable.get(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== 'longjmp') throw e;
        _setThrew(1, 0);
      }
    }
    function invoke_ji(index, a1) {
      var sp = stackSave();
      try {
        return dynCall_ji(index, a1);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== 'longjmp') throw e;
        _setThrew(1, 0);
      }
    }
    Module['addFunction'] = addFunction;
    Module['ENV'] = ENV;
    Module['FS'] = FS;
    Module['deletionQueue'] = deletionQueue;
    Module['PThread'] = PThread;
    Module['PThread'] = PThread;
    Module['_pthread_self'] = _pthread_self;
    Module['wasmMemory'] = wasmMemory;
    Module['ExitStatus'] = ExitStatus;
    var calledRun;
    function ExitStatus(status) {
      this.name = 'ExitStatus';
      this.message = 'Program terminated with exit(' + status + ')';
      this.status = status;
    }
    var calledMain = false;
    dependenciesFulfilled = function runCaller() {
      if (!calledRun) run();
      if (!calledRun) dependenciesFulfilled = runCaller;
    };
    function callMain(args) {
      var entryFunction = Module['_main'];
      var argc = 0;
      var argv = 0;
      try {
        var ret = entryFunction(argc, argv);
        exit(ret, true);
      } catch (e) {
        if (e instanceof ExitStatus) {
          return;
        } else if (e == 'unwind') {
          noExitRuntime = true;
          return;
        } else {
          var toLog = e;
          if (e && typeof e === 'object' && e.stack) {
            toLog = [e, e.stack];
          }
          err('exception thrown: ' + toLog);
          quit_(1, e);
        }
      } finally {
        calledMain = true;
      }
    }
    function run(args) {
      args = args || arguments_;
      if (runDependencies > 0) {
        return;
      }
      preRun();
      if (runDependencies > 0) return;
      function doRun() {
        if (calledRun) return;
        calledRun = true;
        Module['calledRun'] = true;
        if (ABORT) return;
        initRuntime();
        preMain();
        readyPromiseResolve(Module);
        if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();
        if (shouldRunNow) callMain(args);
        postRun();
      }
      if (Module['setStatus']) {
        Module['setStatus']('Running...');
        setTimeout(function () {
          setTimeout(function () {
            Module['setStatus']('');
          }, 1);
          doRun();
        }, 1);
      } else {
        doRun();
      }
    }
    Module['run'] = run;
    function exit(status, implicit) {
      if (implicit && noExitRuntime && status === 0) {
        return;
      }
      if (noExitRuntime) {
      } else {
        PThread.terminateAllThreads();
        ABORT = true;
        EXITSTATUS = status;
        exitRuntime();
        if (Module['onExit']) Module['onExit'](status);
      }
      quit_(status, new ExitStatus(status));
    }
    if (Module['preInit']) {
      if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
      while (Module['preInit'].length > 0) {
        Module['preInit'].pop()();
      }
    }
    var shouldRunNow = true;
    if (Module['noInitialRun']) shouldRunNow = false;
    if (!ENVIRONMENT_IS_PTHREAD) noExitRuntime = true;
    if (!ENVIRONMENT_IS_PTHREAD) {
      run();
    } else {
      Module['___embind_register_native_and_builtin_types']();
      readyPromiseResolve(Module);
    }

    return Vips.ready;
  };
})();
if (typeof exports === 'object' && typeof module === 'object') module.exports = Vips;
else if (typeof define === 'function' && define['amd'])
  define([], function () {
    return Vips;
  });
else if (typeof exports === 'object') exports['Vips'] = Vips;
