export const id = 1169;
export const ids = [1169];
export const modules = {

/***/ 63281:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

(function () {
  (__webpack_require__(10390).config)(
    Object.assign(
      {},
      __webpack_require__(41095),
      __webpack_require__(76414)(process.argv)
    )
  )
})()


/***/ }),

/***/ 76414:
/***/ ((module) => {

const re = /^dotenv_config_(encoding|path|quiet|debug|override|DOTENV_KEY)=(.+)$/

module.exports = function optionMatcher (args) {
  const options = args.reduce(function (acc, cur) {
    const matches = cur.match(re)
    if (matches) {
      acc[matches[1]] = matches[2]
    }
    return acc
  }, {})

  if (!('quiet' in options)) {
    options.quiet = 'true'
  }

  return options
}


/***/ }),

/***/ 41095:
/***/ ((module) => {

// ../config.js accepts options via environment variables
const options = {}

if (process.env.DOTENV_CONFIG_ENCODING != null) {
  options.encoding = process.env.DOTENV_CONFIG_ENCODING
}

if (process.env.DOTENV_CONFIG_PATH != null) {
  options.path = process.env.DOTENV_CONFIG_PATH
}

if (process.env.DOTENV_CONFIG_QUIET != null) {
  options.quiet = process.env.DOTENV_CONFIG_QUIET
}

if (process.env.DOTENV_CONFIG_DEBUG != null) {
  options.debug = process.env.DOTENV_CONFIG_DEBUG
}

if (process.env.DOTENV_CONFIG_OVERRIDE != null) {
  options.override = process.env.DOTENV_CONFIG_OVERRIDE
}

if (process.env.DOTENV_CONFIG_DOTENV_KEY != null) {
  options.DOTENV_KEY = process.env.DOTENV_CONFIG_DOTENV_KEY
}

module.exports = options


/***/ }),

/***/ 10390:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const fs = __webpack_require__(79896)
const path = __webpack_require__(16928)
const os = __webpack_require__(70857)
const crypto = __webpack_require__(76982)

// Array of tips to display randomly
const TIPS = [
  '◈ encrypted .env [www.dotenvx.com]',
  '◈ secrets for agents [www.dotenvx.com]',
  '⌁ auth for agents [www.vestauth.com]',
  '⌘ custom filepath { path: \'/custom/path/.env\' }',
  '⌘ enable debugging { debug: true }',
  '⌘ override existing { override: true }',
  '⌘ suppress logs { quiet: true }',
  '⌘ multiple files { path: [\'.env.local\', \'.env\'] }'
]

// Get a random tip from the tips array
function _getRandomTip () {
  return TIPS[Math.floor(Math.random() * TIPS.length)]
}

function parseBoolean (value) {
  if (typeof value === 'string') {
    return !['false', '0', 'no', 'off', ''].includes(value.toLowerCase())
  }
  return Boolean(value)
}

function supportsAnsi () {
  return process.stdout.isTTY // && process.env.TERM !== 'dumb'
}

function dim (text) {
  return supportsAnsi() ? `\x1b[2m${text}\x1b[0m` : text
}

const LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg

// Parse src into an Object
function parse (src) {
  const obj = {}

  // Convert buffer to string
  let lines = src.toString()

  // Convert line breaks to same format
  lines = lines.replace(/\r\n?/mg, '\n')

  let match
  while ((match = LINE.exec(lines)) != null) {
    const key = match[1]

    // Default undefined or null to empty string
    let value = (match[2] || '')

    // Remove whitespace
    value = value.trim()

    // Check if double quoted
    const maybeQuote = value[0]

    // Remove surrounding quotes
    value = value.replace(/^(['"`])([\s\S]*)\1$/mg, '$2')

    // Expand newlines if double quoted
    if (maybeQuote === '"') {
      value = value.replace(/\\n/g, '\n')
      value = value.replace(/\\r/g, '\r')
    }

    // Add to object
    obj[key] = value
  }

  return obj
}

function _parseVault (options) {
  options = options || {}

  const vaultPath = _vaultPath(options)
  options.path = vaultPath // parse .env.vault
  const result = DotenvModule.configDotenv(options)
  if (!result.parsed) {
    const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`)
    err.code = 'MISSING_DATA'
    throw err
  }

  // handle scenario for comma separated keys - for use with key rotation
  // example: DOTENV_KEY="dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=prod,dotenv://:key_7890@dotenvx.com/vault/.env.vault?environment=prod"
  const keys = _dotenvKey(options).split(',')
  const length = keys.length

  let decrypted
  for (let i = 0; i < length; i++) {
    try {
      // Get full key
      const key = keys[i].trim()

      // Get instructions for decrypt
      const attrs = _instructions(result, key)

      // Decrypt
      decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key)

      break
    } catch (error) {
      // last key
      if (i + 1 >= length) {
        throw error
      }
      // try next key
    }
  }

  // Parse decrypted .env string
  return DotenvModule.parse(decrypted)
}

function _warn (message) {
  console.error(`⚠ ${message}`)
}

function _debug (message) {
  console.log(`┆ ${message}`)
}

function _log (message) {
  console.log(`◇ ${message}`)
}

function _dotenvKey (options) {
  // prioritize developer directly setting options.DOTENV_KEY
  if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
    return options.DOTENV_KEY
  }

  // secondary infra already contains a DOTENV_KEY environment variable
  if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
    return process.env.DOTENV_KEY
  }

  // fallback to empty string
  return ''
}

function _instructions (result, dotenvKey) {
  // Parse DOTENV_KEY. Format is a URI
  let uri
  try {
    uri = new URL(dotenvKey)
  } catch (error) {
    if (error.code === 'ERR_INVALID_URL') {
      const err = new Error('INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development')
      err.code = 'INVALID_DOTENV_KEY'
      throw err
    }

    throw error
  }

  // Get decrypt key
  const key = uri.password
  if (!key) {
    const err = new Error('INVALID_DOTENV_KEY: Missing key part')
    err.code = 'INVALID_DOTENV_KEY'
    throw err
  }

  // Get environment
  const environment = uri.searchParams.get('environment')
  if (!environment) {
    const err = new Error('INVALID_DOTENV_KEY: Missing environment part')
    err.code = 'INVALID_DOTENV_KEY'
    throw err
  }

  // Get ciphertext payload
  const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`
  const ciphertext = result.parsed[environmentKey] // DOTENV_VAULT_PRODUCTION
  if (!ciphertext) {
    const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`)
    err.code = 'NOT_FOUND_DOTENV_ENVIRONMENT'
    throw err
  }

  return { ciphertext, key }
}

function _vaultPath (options) {
  let possibleVaultPath = null

  if (options && options.path && options.path.length > 0) {
    if (Array.isArray(options.path)) {
      for (const filepath of options.path) {
        if (fs.existsSync(filepath)) {
          possibleVaultPath = filepath.endsWith('.vault') ? filepath : `${filepath}.vault`
        }
      }
    } else {
      possibleVaultPath = options.path.endsWith('.vault') ? options.path : `${options.path}.vault`
    }
  } else {
    possibleVaultPath = path.resolve(process.cwd(), '.env.vault')
  }

  if (fs.existsSync(possibleVaultPath)) {
    return possibleVaultPath
  }

  return null
}

function _resolveHome (envPath) {
  return envPath[0] === '~' ? path.join(os.homedir(), envPath.slice(1)) : envPath
}

function _configVault (options) {
  const debug = parseBoolean(process.env.DOTENV_CONFIG_DEBUG || (options && options.debug))
  const quiet = parseBoolean(process.env.DOTENV_CONFIG_QUIET || (options && options.quiet))

  if (debug || !quiet) {
    _log('loading env from encrypted .env.vault')
  }

  const parsed = DotenvModule._parseVault(options)

  let processEnv = process.env
  if (options && options.processEnv != null) {
    processEnv = options.processEnv
  }

  DotenvModule.populate(processEnv, parsed, options)

  return { parsed }
}

function configDotenv (options) {
  const dotenvPath = path.resolve(process.cwd(), '.env')
  let encoding = 'utf8'
  let processEnv = process.env
  if (options && options.processEnv != null) {
    processEnv = options.processEnv
  }
  let debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || (options && options.debug))
  let quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || (options && options.quiet))

  if (options && options.encoding) {
    encoding = options.encoding
  } else {
    if (debug) {
      _debug('no encoding is specified (UTF-8 is used by default)')
    }
  }

  let optionPaths = [dotenvPath] // default, look for .env
  if (options && options.path) {
    if (!Array.isArray(options.path)) {
      optionPaths = [_resolveHome(options.path)]
    } else {
      optionPaths = [] // reset default
      for (const filepath of options.path) {
        optionPaths.push(_resolveHome(filepath))
      }
    }
  }

  // Build the parsed data in a temporary object (because we need to return it).  Once we have the final
  // parsed data, we will combine it with process.env (or options.processEnv if provided).
  let lastError
  const parsedAll = {}
  for (const path of optionPaths) {
    try {
      // Specifying an encoding returns a string instead of a buffer
      const parsed = DotenvModule.parse(fs.readFileSync(path, { encoding }))

      DotenvModule.populate(parsedAll, parsed, options)
    } catch (e) {
      if (debug) {
        _debug(`failed to load ${path} ${e.message}`)
      }
      lastError = e
    }
  }

  const populated = DotenvModule.populate(processEnv, parsedAll, options)

  // handle user settings DOTENV_CONFIG_ options inside .env file(s)
  debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || debug)
  quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || quiet)

  if (debug || !quiet) {
    const keysCount = Object.keys(populated).length
    const shortPaths = []
    for (const filePath of optionPaths) {
      try {
        const relative = path.relative(process.cwd(), filePath)
        shortPaths.push(relative)
      } catch (e) {
        if (debug) {
          _debug(`failed to load ${filePath} ${e.message}`)
        }
        lastError = e
      }
    }

    _log(`injected env (${keysCount}) from ${shortPaths.join(',')} ${dim(`// tip: ${_getRandomTip()}`)}`)
  }

  if (lastError) {
    return { parsed: parsedAll, error: lastError }
  } else {
    return { parsed: parsedAll }
  }
}

// Populates process.env from .env file
function config (options) {
  // fallback to original dotenv if DOTENV_KEY is not set
  if (_dotenvKey(options).length === 0) {
    return DotenvModule.configDotenv(options)
  }

  const vaultPath = _vaultPath(options)

  // dotenvKey exists but .env.vault file does not exist
  if (!vaultPath) {
    _warn(`you set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}`)

    return DotenvModule.configDotenv(options)
  }

  return DotenvModule._configVault(options)
}

function decrypt (encrypted, keyStr) {
  const key = Buffer.from(keyStr.slice(-64), 'hex')
  let ciphertext = Buffer.from(encrypted, 'base64')

  const nonce = ciphertext.subarray(0, 12)
  const authTag = ciphertext.subarray(-16)
  ciphertext = ciphertext.subarray(12, -16)

  try {
    const aesgcm = crypto.createDecipheriv('aes-256-gcm', key, nonce)
    aesgcm.setAuthTag(authTag)
    return `${aesgcm.update(ciphertext)}${aesgcm.final()}`
  } catch (error) {
    const isRange = error instanceof RangeError
    const invalidKeyLength = error.message === 'Invalid key length'
    const decryptionFailed = error.message === 'Unsupported state or unable to authenticate data'

    if (isRange || invalidKeyLength) {
      const err = new Error('INVALID_DOTENV_KEY: It must be 64 characters long (or more)')
      err.code = 'INVALID_DOTENV_KEY'
      throw err
    } else if (decryptionFailed) {
      const err = new Error('DECRYPTION_FAILED: Please check your DOTENV_KEY')
      err.code = 'DECRYPTION_FAILED'
      throw err
    } else {
      throw error
    }
  }
}

// Populate process.env with parsed values
function populate (processEnv, parsed, options = {}) {
  const debug = Boolean(options && options.debug)
  const override = Boolean(options && options.override)
  const populated = {}

  if (typeof parsed !== 'object') {
    const err = new Error('OBJECT_REQUIRED: Please check the processEnv argument being passed to populate')
    err.code = 'OBJECT_REQUIRED'
    throw err
  }

  // Set process.env
  for (const key of Object.keys(parsed)) {
    if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
      if (override === true) {
        processEnv[key] = parsed[key]
        populated[key] = parsed[key]
      }

      if (debug) {
        if (override === true) {
          _debug(`"${key}" is already defined and WAS overwritten`)
        } else {
          _debug(`"${key}" is already defined and was NOT overwritten`)
        }
      }
    } else {
      processEnv[key] = parsed[key]
      populated[key] = parsed[key]
    }
  }

  return populated
}

const DotenvModule = {
  configDotenv,
  _configVault,
  _parseVault,
  config,
  decrypt,
  parse,
  populate
}

module.exports.configDotenv = DotenvModule.configDotenv
module.exports._configVault = DotenvModule._configVault
module.exports._parseVault = DotenvModule._parseVault
module.exports.config = DotenvModule.config
module.exports.decrypt = DotenvModule.decrypt
module.exports.parse = DotenvModule.parse
module.exports.populate = DotenvModule.populate

module.exports = DotenvModule


/***/ }),

/***/ 78604:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
// This is an empty module that is served up when outside of a workerd environment
// See the `exports` field in package.json
exports["default"] = {};
//# sourceMappingURL=empty.js.map

/***/ }),

/***/ 93714:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



//Parse method copied from https://github.com/brianc/node-postgres
//Copyright (c) 2010-2014 Brian Carlson (brian.m.carlson@gmail.com)
//MIT License

//parses a connection string
function parse(str, options = {}) {
  //unix socket
  if (str.charAt(0) === '/') {
    const config = str.split(' ')
    return { host: config[0], database: config[1] }
  }

  // Check for empty host in URL

  const config = Object.create(null)
  let result
  let dummyHost = false
  if (/ |%[^a-f0-9]|%[a-f0-9][^a-f0-9]/i.test(str)) {
    // Ensure spaces are encoded as %20
    str = encodeURI(str).replace(/%25(\d\d)/g, '%$1')
  }

  try {
    try {
      result = new URL(str, 'postgres://base')
    } catch (e) {
      // The URL is invalid so try again with a dummy host
      result = new URL(str.replace('@/', '@___DUMMY___/'), 'postgres://base')
      dummyHost = true
    }
  } catch (err) {
    // Remove the input from the error message to avoid leaking sensitive information
    err.input && (err.input = '*****REDACTED*****')
    throw err
  }

  // We'd like to use Object.fromEntries() here but Node.js 10 does not support it
  for (const entry of result.searchParams.entries()) {
    config[entry[0]] = entry[1]
  }

  config.user = config.user || decodeURIComponent(result.username)
  config.password = config.password || decodeURIComponent(result.password)

  if (result.protocol == 'socket:') {
    config.host = decodeURI(result.pathname)
    config.database = result.searchParams.get('db')
    config.client_encoding = result.searchParams.get('encoding')
    return config
  }
  const hostname = dummyHost ? '' : result.hostname
  if (!config.host) {
    // Only set the host if there is no equivalent query param.
    config.host = decodeURIComponent(hostname)
  } else if (hostname && /^%2f/i.test(hostname)) {
    // Only prepend the hostname to the pathname if it is not a URL encoded Unix socket host.
    result.pathname = hostname + result.pathname
  }
  if (!config.port) {
    // Only set the port if there is no equivalent query param.
    config.port = result.port
  }

  const pathname = result.pathname.slice(1) || null
  config.database = pathname ? decodeURI(pathname) : null

  if (config.ssl === 'true' || config.ssl === '1') {
    config.ssl = true
  }

  if (config.ssl === '0') {
    config.ssl = false
  }

  if (config.sslcert || config.sslkey || config.sslrootcert || config.sslmode) {
    config.ssl = {}
  }

  // sslnegotiation=direct implies SSL is in use (libpq requires sslmode>=require),
  // so enable SSL if the connection string did not otherwise configure it.
  if (config.sslnegotiation === 'direct' && config.ssl === undefined) {
    config.ssl = true
  }

  // Only try to load fs if we expect to read from the disk
  const fs = config.sslcert || config.sslkey || config.sslrootcert ? __webpack_require__(79896) : null

  if (config.sslcert) {
    config.ssl.cert = fs.readFileSync(config.sslcert).toString()
  }

  if (config.sslkey) {
    config.ssl.key = fs.readFileSync(config.sslkey).toString()
  }

  if (config.sslrootcert) {
    config.ssl.ca = fs.readFileSync(config.sslrootcert).toString()
  }

  if (options.useLibpqCompat && config.uselibpqcompat) {
    throw new Error('Both useLibpqCompat and uselibpqcompat are set. Please use only one of them.')
  }

  if (config.uselibpqcompat === 'true' || options.useLibpqCompat) {
    switch (config.sslmode) {
      case 'disable': {
        config.ssl = false
        break
      }
      case 'prefer': {
        config.ssl.rejectUnauthorized = false
        break
      }
      case 'require': {
        if (config.sslrootcert) {
          // If a root CA is specified, behavior of `sslmode=require` will be the same as that of `verify-ca`
          config.ssl.checkServerIdentity = function () {}
        } else {
          config.ssl.rejectUnauthorized = false
        }
        break
      }
      case 'verify-ca': {
        if (!config.ssl.ca) {
          throw new Error(
            'SECURITY WARNING: Using sslmode=verify-ca requires specifying a CA with sslrootcert. If a public CA is used, verify-ca allows connections to a server that somebody else may have registered with the CA, making you vulnerable to Man-in-the-Middle attacks. Either specify a custom CA certificate with sslrootcert parameter or use sslmode=verify-full for proper security.'
          )
        }
        config.ssl.checkServerIdentity = function () {}
        break
      }
      case 'verify-full': {
        break
      }
    }
  } else {
    switch (config.sslmode) {
      case 'disable': {
        config.ssl = false
        break
      }
      case 'prefer':
      case 'require':
      case 'verify-ca':
      case 'verify-full': {
        if (config.sslmode !== 'verify-full') {
          deprecatedSslModeWarning(config.sslmode)
        }
        break
      }
      case 'no-verify': {
        config.ssl.rejectUnauthorized = false
        break
      }
    }
  }

  return config
}

// convert pg-connection-string ssl config to a ClientConfig.ConnectionOptions
function toConnectionOptions(sslConfig) {
  const connectionOptions = Object.entries(sslConfig).reduce((c, [key, value]) => {
    // we explicitly check for undefined and null instead of `if (value)` because some
    // options accept falsy values. Example: `ssl.rejectUnauthorized = false`
    if (value !== undefined && value !== null) {
      c[key] = value
    }

    return c
  }, Object.create(null))

  return connectionOptions
}

// convert pg-connection-string config to a ClientConfig
function toClientConfig(config) {
  const poolConfig = Object.entries(config).reduce((c, [key, value]) => {
    if (key === 'ssl') {
      const sslConfig = value

      if (typeof sslConfig === 'boolean') {
        c[key] = sslConfig
      }

      if (typeof sslConfig === 'object') {
        c[key] = toConnectionOptions(sslConfig)
      }
    } else if (value !== undefined && value !== null) {
      if (key === 'port') {
        // when port is not specified, it is converted into an empty string
        // we want to avoid NaN or empty string as a values in ClientConfig
        if (value !== '') {
          const v = parseInt(value, 10)
          if (isNaN(v)) {
            throw new Error(`Invalid ${key}: ${value}`)
          }

          c[key] = v
        }
      } else {
        c[key] = value
      }
    }

    return c
  }, Object.create(null))

  return poolConfig
}

// parses a connection string into ClientConfig
function parseIntoClientConfig(str) {
  return toClientConfig(parse(str))
}

function deprecatedSslModeWarning(sslmode) {
  if (!deprecatedSslModeWarning.warned && typeof process !== 'undefined' && process.emitWarning) {
    deprecatedSslModeWarning.warned = true
    process.emitWarning(`SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.

To prepare for this change:
- If you want the current behavior, explicitly use 'sslmode=verify-full'
- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=${sslmode}'

See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.`)
  }
}

module.exports = parse

parse.parse = parse
parse.toClientConfig = toClientConfig
parse.parseIntoClientConfig = parseIntoClientConfig


/***/ }),

/***/ 69497:
/***/ ((module) => {



// selected so (BASE - 1) * 0x100000000 + 0xffffffff is a safe integer
var BASE = 1000000;

function readInt8(buffer) {
	var high = buffer.readInt32BE(0);
	var low = buffer.readUInt32BE(4);
	var sign = '';

	if (high < 0) {
		high = ~high + (low === 0);
		low = (~low + 1) >>> 0;
		sign = '-';
	}

	var result = '';
	var carry;
	var t;
	var digits;
	var pad;
	var l;
	var i;

	{
		carry = high % BASE;
		high = high / BASE >>> 0;

		t = 0x100000000 * carry + low;
		low = t / BASE >>> 0;
		digits = '' + (t - BASE * low);

		if (low === 0 && high === 0) {
			return sign + digits + result;
		}

		pad = '';
		l = 6 - digits.length;

		for (i = 0; i < l; i++) {
			pad += '0';
		}

		result = pad + digits + result;
	}

	{
		carry = high % BASE;
		high = high / BASE >>> 0;

		t = 0x100000000 * carry + low;
		low = t / BASE >>> 0;
		digits = '' + (t - BASE * low);

		if (low === 0 && high === 0) {
			return sign + digits + result;
		}

		pad = '';
		l = 6 - digits.length;

		for (i = 0; i < l; i++) {
			pad += '0';
		}

		result = pad + digits + result;
	}

	{
		carry = high % BASE;
		high = high / BASE >>> 0;

		t = 0x100000000 * carry + low;
		low = t / BASE >>> 0;
		digits = '' + (t - BASE * low);

		if (low === 0 && high === 0) {
			return sign + digits + result;
		}

		pad = '';
		l = 6 - digits.length;

		for (i = 0; i < l; i++) {
			pad += '0';
		}

		result = pad + digits + result;
	}

	{
		carry = high % BASE;
		t = 0x100000000 * carry + low;
		digits = '' + t % BASE;

		return sign + digits + result;
	}
}

module.exports = readInt8;


/***/ }),

/***/ 57490:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


const EventEmitter = (__webpack_require__(24434).EventEmitter)

const NOOP = function () {}

const removeWhere = (list, predicate) => {
  const i = list.findIndex(predicate)

  return i === -1 ? undefined : list.splice(i, 1)[0]
}

class IdleItem {
  constructor(client, idleListener, timeoutId) {
    this.client = client
    this.idleListener = idleListener
    this.timeoutId = timeoutId
  }
}

class PendingItem {
  constructor(callback) {
    this.callback = callback
  }
}

function throwOnDoubleRelease() {
  throw new Error('Release called on client which has already been released to the pool.')
}

function promisify(Promise, callback) {
  if (callback) {
    return { callback: callback, result: undefined }
  }
  let rej
  let res
  const cb = function (err, client) {
    err ? rej(err) : res(client)
  }
  const result = new Promise(function (resolve, reject) {
    res = resolve
    rej = reject
  }).catch((err) => {
    // replace the stack trace that leads to `TCP.onStreamRead` with one that leads back to the
    // application that created the query
    Error.captureStackTrace(err)
    throw err
  })
  return { callback: cb, result: result }
}

function makeIdleListener(pool, client) {
  return function idleListener(err) {
    err.client = client

    client.removeListener('error', idleListener)
    client.on('error', () => {
      pool.log('additional client error after disconnection due to error', err)
    })
    pool._remove(client)
    // TODO - document that once the pool emits an error
    // the client has already been closed & purged and is unusable
    pool.emit('error', err, client)
  }
}

class Pool extends EventEmitter {
  constructor(options, Client) {
    super()
    this.options = Object.assign({}, options)

    if (options != null && 'password' in options) {
      // "hiding" the password so it doesn't show up in stack traces
      // or if the client is console.logged
      Object.defineProperty(this.options, 'password', {
        configurable: true,
        enumerable: false,
        writable: true,
        value: options.password,
      })
    }
    if (options != null && options.ssl && options.ssl.key) {
      // "hiding" the ssl->key so it doesn't show up in stack traces
      // or if the client is console.logged
      Object.defineProperty(this.options.ssl, 'key', {
        enumerable: false,
      })
    }

    this.options.max = this.options.max || this.options.poolSize || 10
    this.options.min = this.options.min || 0
    this.options.maxUses = this.options.maxUses || Infinity
    this.options.allowExitOnIdle = this.options.allowExitOnIdle || false
    this.options.maxLifetimeSeconds = this.options.maxLifetimeSeconds || 0
    this.log = this.options.log || function () {}
    this.Client = this.options.Client || Client || (__webpack_require__(62372).Client)
    this.Promise = this.options.Promise || global.Promise

    if (typeof this.options.idleTimeoutMillis === 'undefined') {
      this.options.idleTimeoutMillis = 10000
    }

    this._clients = []
    this._idle = []
    this._expired = new WeakSet()
    this._pendingQueue = []
    this._endCallback = undefined
    this.ending = false
    this.ended = false
  }

  _promiseTry(f) {
    const Promise = this.Promise
    if (typeof Promise.try === 'function') {
      return Promise.try(f)
    }
    return new Promise((resolve) => resolve(f()))
  }

  _isFull() {
    return this._clients.length >= this.options.max
  }

  _isAboveMin() {
    return this._clients.length > this.options.min
  }

  _pulseQueue() {
    this.log('pulse queue')
    if (this.ended) {
      this.log('pulse queue ended')
      return
    }
    if (this.ending) {
      this.log('pulse queue on ending')
      if (this._idle.length) {
        this._idle.slice().map((item) => {
          this._remove(item.client)
        })
      }
      if (!this._clients.length) {
        this.ended = true
        this._endCallback()
      }
      return
    }

    // if we don't have any waiting, do nothing
    if (!this._pendingQueue.length) {
      this.log('no queued requests')
      return
    }
    // if we don't have any idle clients and we have no more room do nothing
    if (!this._idle.length && this._isFull()) {
      return
    }
    const pendingItem = this._pendingQueue.shift()
    if (this._idle.length) {
      const idleItem = this._idle.pop()
      clearTimeout(idleItem.timeoutId)
      const client = idleItem.client
      client.ref && client.ref()
      const idleListener = idleItem.idleListener

      return this._acquireClient(client, pendingItem, idleListener, false)
    }
    if (!this._isFull()) {
      return this.newClient(pendingItem)
    }
    throw new Error('unexpected condition')
  }

  _remove(client, callback) {
    const removed = removeWhere(this._idle, (item) => item.client === client)

    if (removed !== undefined) {
      clearTimeout(removed.timeoutId)
    }

    this._clients = this._clients.filter((c) => c !== client)
    const context = this
    client.end(() => {
      context.emit('remove', client)

      if (typeof callback === 'function') {
        callback()
      }
    })
  }

  connect(cb) {
    if (this.ending) {
      const err = new Error('Cannot use a pool after calling end on the pool')
      return cb ? cb(err) : this.Promise.reject(err)
    }

    const response = promisify(this.Promise, cb)
    const result = response.result

    // if we don't have to connect a new client, don't do so
    if (this._isFull() || this._idle.length) {
      // if we have idle clients schedule a pulse immediately
      if (this._idle.length) {
        process.nextTick(() => this._pulseQueue())
      }

      if (!this.options.connectionTimeoutMillis) {
        this._pendingQueue.push(new PendingItem(response.callback))
        return result
      }

      const queueCallback = (err, res, done) => {
        clearTimeout(tid)
        response.callback(err, res, done)
      }

      const pendingItem = new PendingItem(queueCallback)

      // set connection timeout on checking out an existing client
      const tid = setTimeout(() => {
        // remove the callback from pending waiters because
        // we're going to call it with a timeout error
        removeWhere(this._pendingQueue, (i) => i.callback === queueCallback)
        pendingItem.timedOut = true
        response.callback(new Error('timeout exceeded when trying to connect'))
      }, this.options.connectionTimeoutMillis)

      if (tid.unref) {
        tid.unref()
      }

      this._pendingQueue.push(pendingItem)
      return result
    }

    this.newClient(new PendingItem(response.callback))

    return result
  }

  newClient(pendingItem) {
    const client = new this.Client(this.options)
    this._clients.push(client)
    const idleListener = makeIdleListener(this, client)

    this.log('checking client timeout')

    // connection timeout logic
    let tid
    let timeoutHit = false
    if (this.options.connectionTimeoutMillis) {
      tid = setTimeout(() => {
        if (client.connection) {
          this.log('ending client due to timeout')
          timeoutHit = true
          client.connection.stream.destroy()
        } else if (!client.isConnected()) {
          this.log('ending client due to timeout')
          timeoutHit = true
          // force kill the node driver, and let libpq do its teardown
          client.end()
        }
      }, this.options.connectionTimeoutMillis)
    }

    this.log('connecting new client')
    client.connect((err) => {
      if (tid) {
        clearTimeout(tid)
      }
      client.on('error', idleListener)
      if (err) {
        this.log('client failed to connect', err)
        // remove the dead client from our list of clients
        this._clients = this._clients.filter((c) => c !== client)
        if (timeoutHit) {
          err = new Error('Connection terminated due to connection timeout', { cause: err })
        }

        // this client won’t be released, so move on immediately
        this._pulseQueue()

        if (!pendingItem.timedOut) {
          pendingItem.callback(err, undefined, NOOP)
        }
      } else {
        this.log('new client connected')

        if (this.options.onConnect) {
          this._promiseTry(() => this.options.onConnect(client)).then(
            () => {
              this._afterConnect(client, pendingItem, idleListener)
            },
            (hookErr) => {
              this._clients = this._clients.filter((c) => c !== client)
              client.end(() => {
                this._pulseQueue()
                if (!pendingItem.timedOut) {
                  pendingItem.callback(hookErr, undefined, NOOP)
                }
              })
            }
          )
          return
        }

        return this._afterConnect(client, pendingItem, idleListener)
      }
    })
  }

  _afterConnect(client, pendingItem, idleListener) {
    if (this.options.maxLifetimeSeconds !== 0) {
      const maxLifetimeTimeout = setTimeout(() => {
        this.log('ending client due to expired lifetime')
        this._expired.add(client)
        const idleIndex = this._idle.findIndex((idleItem) => idleItem.client === client)
        if (idleIndex !== -1) {
          this._acquireClient(
            client,
            new PendingItem((err, client, clientRelease) => clientRelease()),
            idleListener,
            false
          )
        }
      }, this.options.maxLifetimeSeconds * 1000)

      maxLifetimeTimeout.unref()
      client.once('end', () => clearTimeout(maxLifetimeTimeout))
    }

    return this._acquireClient(client, pendingItem, idleListener, true)
  }

  // acquire a client for a pending work item
  _acquireClient(client, pendingItem, idleListener, isNew) {
    if (isNew) {
      this.emit('connect', client)
    }

    this.emit('acquire', client)

    client.release = this._releaseOnce(client, idleListener)

    client.removeListener('error', idleListener)

    if (!pendingItem.timedOut) {
      if (isNew && this.options.verify) {
        this.options.verify(client, (err) => {
          if (err) {
            client.release(err)
            return pendingItem.callback(err, undefined, NOOP)
          }

          pendingItem.callback(undefined, client, client.release)
        })
      } else {
        pendingItem.callback(undefined, client, client.release)
      }
    } else {
      if (isNew && this.options.verify) {
        this.options.verify(client, client.release)
      } else {
        client.release()
      }
    }
  }

  // returns a function that wraps _release and throws if called more than once
  _releaseOnce(client, idleListener) {
    let released = false

    return (err) => {
      if (released) {
        throwOnDoubleRelease()
      }

      released = true
      this._release(client, idleListener, err)
    }
  }

  // release a client back to the poll, include an error
  // to remove it from the pool
  _release(client, idleListener, err) {
    client.on('error', idleListener)

    client._poolUseCount = (client._poolUseCount || 0) + 1

    this.emit('release', err, client)

    // TODO(bmc): expose a proper, public interface _queryable and _ending
    if (err || this.ending || !client._queryable || client._ending || client._poolUseCount >= this.options.maxUses) {
      if (client._poolUseCount >= this.options.maxUses) {
        this.log('remove expended client')
      }

      return this._remove(client, this._pulseQueue.bind(this))
    }

    const isExpired = this._expired.has(client)
    if (isExpired) {
      this.log('remove expired client')
      this._expired.delete(client)
      return this._remove(client, this._pulseQueue.bind(this))
    }

    // idle timeout
    let tid
    if (this.options.idleTimeoutMillis && this._isAboveMin()) {
      tid = setTimeout(() => {
        if (this._isAboveMin()) {
          this.log('remove idle client')
          this._remove(client, this._pulseQueue.bind(this))
        }
      }, this.options.idleTimeoutMillis)

      if (this.options.allowExitOnIdle) {
        // allow Node to exit if this is all that's left
        tid.unref()
      }
    }

    if (this.options.allowExitOnIdle) {
      client.unref()
    }

    this._idle.push(new IdleItem(client, idleListener, tid))
    this._pulseQueue()
  }

  query(text, values, cb) {
    // guard clause against passing a function as the first parameter
    if (typeof text === 'function') {
      const response = promisify(this.Promise, text)
      setImmediate(function () {
        return response.callback(new Error('Passing a function as the first parameter to pool.query is not supported'))
      })
      return response.result
    }

    // allow plain text query without values, but callback
    if (typeof values === 'function') {
      cb = values
      values = undefined
    }
    const response = promisify(this.Promise, cb)
    cb = response.callback

    this.connect((err, client) => {
      if (err) {
        return cb(err)
      }

      let clientReleased = false
      const onError = (err) => {
        if (clientReleased) {
          return
        }
        clientReleased = true
        client.release(err)
        cb(err)
      }

      client.once('error', onError)
      this.log('dispatching query')
      try {
        client.query(text, values, (err, res) => {
          this.log('query dispatched')
          client.removeListener('error', onError)
          if (clientReleased) {
            return
          }
          clientReleased = true
          client.release(err)
          if (err) {
            return cb(err)
          }
          return cb(undefined, res)
        })
      } catch (err) {
        client.release(err)
        return cb(err)
      }
    })
    return response.result
  }

  end(cb) {
    this.log('ending')
    if (this.ending) {
      const err = new Error('Called end on pool more than once')
      return cb ? cb(err) : this.Promise.reject(err)
    }
    this.ending = true
    const promised = promisify(this.Promise, cb)
    this._endCallback = promised.callback
    this._pulseQueue()
    return promised.result
  }

  get waitingCount() {
    return this._pendingQueue.length
  }

  get idleCount() {
    return this._idle.length
  }

  get expiredCount() {
    return this._clients.reduce((acc, client) => acc + (this._expired.has(client) ? 1 : 0), 0)
  }

  get totalCount() {
    return this._clients.length
  }
}
module.exports = Pool


/***/ }),

/***/ 80522:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BufferReader = void 0;
class BufferReader {
    constructor(offset = 0) {
        this.offset = offset;
        this.buffer = Buffer.allocUnsafe(0);
        // TODO(bmc): support non-utf8 encoding?
        this.encoding = 'utf-8';
    }
    setBuffer(offset, buffer) {
        this.offset = offset;
        this.buffer = buffer;
    }
    int16() {
        const result = this.buffer.readInt16BE(this.offset);
        this.offset += 2;
        return result;
    }
    byte() {
        const result = this.buffer[this.offset];
        this.offset++;
        return result;
    }
    int32() {
        const result = this.buffer.readInt32BE(this.offset);
        this.offset += 4;
        return result;
    }
    uint32() {
        const result = this.buffer.readUInt32BE(this.offset);
        this.offset += 4;
        return result;
    }
    string(length) {
        const result = this.buffer.toString(this.encoding, this.offset, this.offset + length);
        this.offset += length;
        return result;
    }
    cstring() {
        const start = this.offset;
        let end = start;
        // eslint-disable-next-line no-empty
        while (this.buffer[end++]) { }
        this.offset = end;
        return this.buffer.toString(this.encoding, start, end - 1);
    }
    bytes(length) {
        const result = this.buffer.slice(this.offset, this.offset + length);
        this.offset += length;
        return result;
    }
}
exports.BufferReader = BufferReader;
//# sourceMappingURL=buffer-reader.js.map

/***/ }),

/***/ 72314:
/***/ ((__unused_webpack_module, exports) => {


//binary data writer tuned for encoding binary specific to the postgres binary protocol
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Writer = void 0;
class Writer {
    constructor(size = 256) {
        this.size = size;
        this.offset = 5;
        this.headerPosition = 0;
        this.buffer = Buffer.allocUnsafe(size);
    }
    ensure(size) {
        const remaining = this.buffer.length - this.offset;
        if (remaining < size) {
            const oldBuffer = this.buffer;
            // exponential growth factor of around ~ 1.5
            // https://stackoverflow.com/questions/2269063/buffer-growth-strategy
            const newSize = oldBuffer.length + (oldBuffer.length >> 1) + size;
            this.buffer = Buffer.allocUnsafe(newSize);
            oldBuffer.copy(this.buffer);
        }
    }
    addInt32(num) {
        this.ensure(4);
        this.buffer[this.offset++] = (num >>> 24) & 0xff;
        this.buffer[this.offset++] = (num >>> 16) & 0xff;
        this.buffer[this.offset++] = (num >>> 8) & 0xff;
        this.buffer[this.offset++] = (num >>> 0) & 0xff;
        return this;
    }
    addInt16(num) {
        this.ensure(2);
        this.buffer[this.offset++] = (num >>> 8) & 0xff;
        this.buffer[this.offset++] = (num >>> 0) & 0xff;
        return this;
    }
    addCString(string) {
        if (!string) {
            this.ensure(1);
        }
        else {
            const len = Buffer.byteLength(string);
            this.ensure(len + 1); // +1 for null terminator
            this.buffer.write(string, this.offset, 'utf-8');
            this.offset += len;
        }
        this.buffer[this.offset++] = 0; // null terminator
        return this;
    }
    addString(string = '') {
        const len = Buffer.byteLength(string);
        this.ensure(len);
        this.buffer.write(string, this.offset);
        this.offset += len;
        return this;
    }
    // Write an Int32 byte-length prefix immediately followed by the string's UTF-8
    // bytes. Postgres' Bind wire format prefixes every parameter with its length,
    // and doing it in one method computes Buffer.byteLength ONCE — the previous
    // `addInt32(Buffer.byteLength(s)).addString(s)` pairing scanned the string
    // three times (byteLength for the prefix, byteLength again inside addString,
    // then the encode), which is costly for large text parameters.
    addInt32PrefixedString(string) {
        const len = Buffer.byteLength(string);
        this.ensure(4 + len);
        const buffer = this.buffer;
        let offset = this.offset;
        buffer[offset++] = (len >>> 24) & 0xff;
        buffer[offset++] = (len >>> 16) & 0xff;
        buffer[offset++] = (len >>> 8) & 0xff;
        buffer[offset++] = (len >>> 0) & 0xff;
        buffer.write(string, offset, 'utf-8');
        this.offset = offset + len;
        return this;
    }
    add(otherBuffer) {
        this.ensure(otherBuffer.length);
        otherBuffer.copy(this.buffer, this.offset);
        this.offset += otherBuffer.length;
        return this;
    }
    join(code) {
        if (code) {
            this.buffer[this.headerPosition] = code;
            //length is everything in this packet minus the code
            const length = this.offset - (this.headerPosition + 1);
            this.buffer.writeInt32BE(length, this.headerPosition + 1);
        }
        return this.buffer.slice(code ? 0 : 5, this.offset);
    }
    flush(code) {
        const result = this.join(code);
        this.offset = 5;
        this.headerPosition = 0;
        this.buffer = Buffer.allocUnsafe(this.size);
        return result;
    }
    clear() {
        this.offset = 5;
        this.headerPosition = 0;
    }
}
exports.Writer = Writer;
//# sourceMappingURL=buffer-writer.js.map

/***/ }),

/***/ 72428:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DatabaseError = exports.serialize = void 0;
exports.parse = parse;
const messages_1 = __webpack_require__(94242);
Object.defineProperty(exports, "DatabaseError", ({ enumerable: true, get: function () { return messages_1.DatabaseError; } }));
const serializer_1 = __webpack_require__(93902);
Object.defineProperty(exports, "serialize", ({ enumerable: true, get: function () { return serializer_1.serialize; } }));
const parser_1 = __webpack_require__(49993);
function parse(stream, callback) {
    const parser = new parser_1.Parser();
    stream.on('data', (buffer) => parser.parse(buffer, callback));
    return new Promise((resolve) => stream.on('end', () => resolve()));
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 94242:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NoticeMessage = exports.DataRowMessage = exports.CommandCompleteMessage = exports.ReadyForQueryMessage = exports.NotificationResponseMessage = exports.BackendKeyDataMessage = exports.AuthenticationMD5Password = exports.ParameterStatusMessage = exports.ParameterDescriptionMessage = exports.RowDescriptionMessage = exports.Field = exports.CopyResponse = exports.CopyDataMessage = exports.DatabaseError = exports.copyDone = exports.emptyQuery = exports.replicationStart = exports.portalSuspended = exports.noData = exports.closeComplete = exports.bindComplete = exports.parseComplete = void 0;
exports.parseComplete = {
    name: 'parseComplete',
    length: 5,
};
exports.bindComplete = {
    name: 'bindComplete',
    length: 5,
};
exports.closeComplete = {
    name: 'closeComplete',
    length: 5,
};
exports.noData = {
    name: 'noData',
    length: 5,
};
exports.portalSuspended = {
    name: 'portalSuspended',
    length: 5,
};
exports.replicationStart = {
    name: 'replicationStart',
    length: 4,
};
exports.emptyQuery = {
    name: 'emptyQuery',
    length: 4,
};
exports.copyDone = {
    name: 'copyDone',
    length: 4,
};
class DatabaseError extends Error {
    constructor(message, length, name) {
        super(message);
        this.length = length;
        this.name = name;
    }
}
exports.DatabaseError = DatabaseError;
class CopyDataMessage {
    constructor(length, chunk) {
        this.length = length;
        this.chunk = chunk;
        this.name = 'copyData';
    }
}
exports.CopyDataMessage = CopyDataMessage;
class CopyResponse {
    constructor(length, name, binary, columnCount) {
        this.length = length;
        this.name = name;
        this.binary = binary;
        this.columnTypes = new Array(columnCount);
    }
}
exports.CopyResponse = CopyResponse;
class Field {
    constructor(name, tableID, columnID, dataTypeID, dataTypeSize, dataTypeModifier, format) {
        this.name = name;
        this.tableID = tableID;
        this.columnID = columnID;
        this.dataTypeID = dataTypeID;
        this.dataTypeSize = dataTypeSize;
        this.dataTypeModifier = dataTypeModifier;
        this.format = format;
    }
}
exports.Field = Field;
class RowDescriptionMessage {
    constructor(length, fieldCount) {
        this.length = length;
        this.fieldCount = fieldCount;
        this.name = 'rowDescription';
        this.fields = new Array(this.fieldCount);
    }
}
exports.RowDescriptionMessage = RowDescriptionMessage;
class ParameterDescriptionMessage {
    constructor(length, parameterCount) {
        this.length = length;
        this.parameterCount = parameterCount;
        this.name = 'parameterDescription';
        this.dataTypeIDs = new Array(this.parameterCount);
    }
}
exports.ParameterDescriptionMessage = ParameterDescriptionMessage;
class ParameterStatusMessage {
    constructor(length, parameterName, parameterValue) {
        this.length = length;
        this.parameterName = parameterName;
        this.parameterValue = parameterValue;
        this.name = 'parameterStatus';
    }
}
exports.ParameterStatusMessage = ParameterStatusMessage;
class AuthenticationMD5Password {
    constructor(length, salt) {
        this.length = length;
        this.salt = salt;
        this.name = 'authenticationMD5Password';
    }
}
exports.AuthenticationMD5Password = AuthenticationMD5Password;
class BackendKeyDataMessage {
    constructor(length, processID, secretKey) {
        this.length = length;
        this.processID = processID;
        this.secretKey = secretKey;
        this.name = 'backendKeyData';
    }
}
exports.BackendKeyDataMessage = BackendKeyDataMessage;
class NotificationResponseMessage {
    constructor(length, processId, channel, payload) {
        this.length = length;
        this.processId = processId;
        this.channel = channel;
        this.payload = payload;
        this.name = 'notification';
    }
}
exports.NotificationResponseMessage = NotificationResponseMessage;
class ReadyForQueryMessage {
    constructor(length, status) {
        this.length = length;
        this.status = status;
        this.name = 'readyForQuery';
    }
}
exports.ReadyForQueryMessage = ReadyForQueryMessage;
class CommandCompleteMessage {
    constructor(length, text) {
        this.length = length;
        this.text = text;
        this.name = 'commandComplete';
    }
}
exports.CommandCompleteMessage = CommandCompleteMessage;
class DataRowMessage {
    constructor(length, fields) {
        this.length = length;
        this.fields = fields;
        this.name = 'dataRow';
        this.fieldCount = fields.length;
    }
}
exports.DataRowMessage = DataRowMessage;
class NoticeMessage {
    constructor(length, message) {
        this.length = length;
        this.message = message;
        this.name = 'notice';
    }
}
exports.NoticeMessage = NoticeMessage;
//# sourceMappingURL=messages.js.map

/***/ }),

/***/ 49993:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Parser = void 0;
const messages_1 = __webpack_require__(94242);
const buffer_reader_1 = __webpack_require__(80522);
// every message is prefixed with a single byte
const CODE_LENGTH = 1;
// every message has an int32 length which includes itself but does
// NOT include the code in the length
const LEN_LENGTH = 4;
const HEADER_LENGTH = CODE_LENGTH + LEN_LENGTH;
// A placeholder for a `BackendMessage`’s length value that will be set after construction.
const LATEINIT_LENGTH = -1;
const emptyBuffer = Buffer.allocUnsafe(0);
class Parser {
    constructor(opts) {
        this.buffer = emptyBuffer;
        this.bufferLength = 0;
        this.bufferOffset = 0;
        this.reader = new buffer_reader_1.BufferReader();
        if ((opts === null || opts === void 0 ? void 0 : opts.mode) === 'binary') {
            throw new Error('Binary mode not supported yet');
        }
        this.mode = (opts === null || opts === void 0 ? void 0 : opts.mode) || 'text';
    }
    parse(buffer, callback) {
        this.mergeBuffer(buffer);
        const bufferFullLength = this.bufferOffset + this.bufferLength;
        let offset = this.bufferOffset;
        while (offset + HEADER_LENGTH <= bufferFullLength) {
            // code is 1 byte long - it identifies the message type
            const code = this.buffer[offset];
            // length is 1 Uint32BE - it is the length of the message EXCLUDING the code
            const length = this.buffer.readUInt32BE(offset + CODE_LENGTH);
            const fullMessageLength = CODE_LENGTH + length;
            if (fullMessageLength + offset <= bufferFullLength) {
                const message = this.handlePacket(offset + HEADER_LENGTH, code, length, this.buffer);
                callback(message);
                offset += fullMessageLength;
            }
            else {
                break;
            }
        }
        if (offset === bufferFullLength) {
            // No more use for the buffer
            this.buffer = emptyBuffer;
            this.bufferLength = 0;
            this.bufferOffset = 0;
        }
        else {
            // Adjust the cursors of remainingBuffer
            this.bufferLength = bufferFullLength - offset;
            this.bufferOffset = offset;
        }
    }
    mergeBuffer(buffer) {
        if (this.bufferLength > 0) {
            const newLength = this.bufferLength + buffer.byteLength;
            const newFullLength = newLength + this.bufferOffset;
            if (newFullLength > this.buffer.byteLength) {
                // We can't concat the new buffer with the remaining one
                let newBuffer;
                if (newLength <= this.buffer.byteLength && this.bufferOffset >= this.bufferLength) {
                    // We can move the relevant part to the beginning of the buffer instead of allocating a new buffer
                    newBuffer = this.buffer;
                }
                else {
                    // Allocate a new larger buffer
                    let newBufferLength = this.buffer.byteLength * 2;
                    while (newLength >= newBufferLength) {
                        newBufferLength *= 2;
                    }
                    newBuffer = Buffer.allocUnsafe(newBufferLength);
                }
                // Move the remaining buffer to the new one
                this.buffer.copy(newBuffer, 0, this.bufferOffset, this.bufferOffset + this.bufferLength);
                this.buffer = newBuffer;
                this.bufferOffset = 0;
            }
            // Concat the new buffer with the remaining one
            buffer.copy(this.buffer, this.bufferOffset + this.bufferLength);
            this.bufferLength = newLength;
        }
        else {
            this.buffer = buffer;
            this.bufferOffset = 0;
            this.bufferLength = buffer.byteLength;
        }
    }
    handlePacket(offset, code, length, bytes) {
        const { reader } = this;
        // NOTE: This undesirably retains the buffer in `this.reader` if the `parse*Message` calls below throw. However, those should only throw in the case of a protocol error, which normally results in the reader being discarded.
        reader.setBuffer(offset, bytes);
        let message;
        switch (code) {
            case 50 /* MessageCodes.BindComplete */:
                message = messages_1.bindComplete;
                break;
            case 49 /* MessageCodes.ParseComplete */:
                message = messages_1.parseComplete;
                break;
            case 51 /* MessageCodes.CloseComplete */:
                message = messages_1.closeComplete;
                break;
            case 110 /* MessageCodes.NoData */:
                message = messages_1.noData;
                break;
            case 115 /* MessageCodes.PortalSuspended */:
                message = messages_1.portalSuspended;
                break;
            case 99 /* MessageCodes.CopyDone */:
                message = messages_1.copyDone;
                break;
            case 87 /* MessageCodes.ReplicationStart */:
                message = messages_1.replicationStart;
                break;
            case 73 /* MessageCodes.EmptyQuery */:
                message = messages_1.emptyQuery;
                break;
            case 68 /* MessageCodes.DataRow */:
                message = parseDataRowMessage(reader);
                break;
            case 67 /* MessageCodes.CommandComplete */:
                message = parseCommandCompleteMessage(reader);
                break;
            case 90 /* MessageCodes.ReadyForQuery */:
                message = parseReadyForQueryMessage(reader);
                break;
            case 65 /* MessageCodes.NotificationResponse */:
                message = parseNotificationMessage(reader);
                break;
            case 82 /* MessageCodes.AuthenticationResponse */:
                message = parseAuthenticationResponse(reader, length);
                break;
            case 83 /* MessageCodes.ParameterStatus */:
                message = parseParameterStatusMessage(reader);
                break;
            case 75 /* MessageCodes.BackendKeyData */:
                message = parseBackendKeyData(reader);
                break;
            case 69 /* MessageCodes.ErrorMessage */:
                message = parseErrorMessage(reader, 'error');
                break;
            case 78 /* MessageCodes.NoticeMessage */:
                message = parseErrorMessage(reader, 'notice');
                break;
            case 84 /* MessageCodes.RowDescriptionMessage */:
                message = parseRowDescriptionMessage(reader);
                break;
            case 116 /* MessageCodes.ParameterDescriptionMessage */:
                message = parseParameterDescriptionMessage(reader);
                break;
            case 71 /* MessageCodes.CopyIn */:
                message = parseCopyInMessage(reader);
                break;
            case 72 /* MessageCodes.CopyOut */:
                message = parseCopyOutMessage(reader);
                break;
            case 100 /* MessageCodes.CopyData */:
                message = parseCopyData(reader, length);
                break;
            default:
                return new messages_1.DatabaseError('received invalid response: ' + code.toString(16), length, 'error');
        }
        reader.setBuffer(0, emptyBuffer);
        message.length = length;
        return message;
    }
}
exports.Parser = Parser;
const parseReadyForQueryMessage = (reader) => {
    const status = reader.string(1);
    return new messages_1.ReadyForQueryMessage(LATEINIT_LENGTH, status);
};
const parseCommandCompleteMessage = (reader) => {
    const text = reader.cstring();
    return new messages_1.CommandCompleteMessage(LATEINIT_LENGTH, text);
};
const parseCopyData = (reader, length) => {
    const chunk = reader.bytes(length - 4);
    return new messages_1.CopyDataMessage(LATEINIT_LENGTH, chunk);
};
const parseCopyInMessage = (reader) => parseCopyMessage(reader, 'copyInResponse');
const parseCopyOutMessage = (reader) => parseCopyMessage(reader, 'copyOutResponse');
const parseCopyMessage = (reader, messageName) => {
    const isBinary = reader.byte() !== 0;
    const columnCount = reader.int16();
    const message = new messages_1.CopyResponse(LATEINIT_LENGTH, messageName, isBinary, columnCount);
    for (let i = 0; i < columnCount; i++) {
        message.columnTypes[i] = reader.int16();
    }
    return message;
};
const parseNotificationMessage = (reader) => {
    const processId = reader.int32();
    const channel = reader.cstring();
    const payload = reader.cstring();
    return new messages_1.NotificationResponseMessage(LATEINIT_LENGTH, processId, channel, payload);
};
const parseRowDescriptionMessage = (reader) => {
    const fieldCount = reader.int16();
    const message = new messages_1.RowDescriptionMessage(LATEINIT_LENGTH, fieldCount);
    for (let i = 0; i < fieldCount; i++) {
        message.fields[i] = parseField(reader);
    }
    return message;
};
const parseField = (reader) => {
    const name = reader.cstring();
    const tableID = reader.uint32();
    const columnID = reader.int16();
    const dataTypeID = reader.uint32();
    const dataTypeSize = reader.int16();
    const dataTypeModifier = reader.int32();
    const mode = reader.int16() === 0 ? 'text' : 'binary';
    return new messages_1.Field(name, tableID, columnID, dataTypeID, dataTypeSize, dataTypeModifier, mode);
};
const parseParameterDescriptionMessage = (reader) => {
    const parameterCount = reader.int16();
    const message = new messages_1.ParameterDescriptionMessage(LATEINIT_LENGTH, parameterCount);
    for (let i = 0; i < parameterCount; i++) {
        // OIDs are unsigned, same as dataTypeID in parseField above
        message.dataTypeIDs[i] = reader.uint32();
    }
    return message;
};
const parseDataRowMessage = (reader) => {
    const fieldCount = reader.int16();
    const fields = new Array(fieldCount);
    for (let i = 0; i < fieldCount; i++) {
        const len = reader.int32();
        // a -1 for length means the value of the field is null
        fields[i] = len === -1 ? null : reader.string(len);
    }
    return new messages_1.DataRowMessage(LATEINIT_LENGTH, fields);
};
const parseParameterStatusMessage = (reader) => {
    const name = reader.cstring();
    const value = reader.cstring();
    return new messages_1.ParameterStatusMessage(LATEINIT_LENGTH, name, value);
};
const parseBackendKeyData = (reader) => {
    const processID = reader.int32();
    const secretKey = reader.int32();
    return new messages_1.BackendKeyDataMessage(LATEINIT_LENGTH, processID, secretKey);
};
const parseAuthenticationResponse = (reader, length) => {
    const code = reader.int32();
    // TODO(bmc): maybe better types here
    const message = {
        name: 'authenticationOk',
        length,
    };
    switch (code) {
        case 0: // AuthenticationOk
            break;
        case 3: // AuthenticationCleartextPassword
            if (message.length === 8) {
                message.name = 'authenticationCleartextPassword';
            }
            break;
        case 5: // AuthenticationMD5Password
            if (message.length === 12) {
                message.name = 'authenticationMD5Password';
                const salt = reader.bytes(4);
                return new messages_1.AuthenticationMD5Password(LATEINIT_LENGTH, salt);
            }
            break;
        case 10: // AuthenticationSASL
            {
                message.name = 'authenticationSASL';
                message.mechanisms = [];
                let mechanism;
                do {
                    mechanism = reader.cstring();
                    if (mechanism) {
                        message.mechanisms.push(mechanism);
                    }
                } while (mechanism);
            }
            break;
        case 11: // AuthenticationSASLContinue
            message.name = 'authenticationSASLContinue';
            message.data = reader.string(length - 8);
            break;
        case 12: // AuthenticationSASLFinal
            message.name = 'authenticationSASLFinal';
            message.data = reader.string(length - 8);
            break;
        default:
            throw new Error('Unknown authenticationOk message type ' + code);
    }
    return message;
};
const parseErrorMessage = (reader, name) => {
    const fields = {};
    let fieldType = reader.string(1);
    while (fieldType !== '\0') {
        fields[fieldType] = reader.cstring();
        fieldType = reader.string(1);
    }
    const messageValue = fields.M;
    const message = name === 'notice'
        ? new messages_1.NoticeMessage(LATEINIT_LENGTH, messageValue)
        : new messages_1.DatabaseError(messageValue, LATEINIT_LENGTH, name);
    message.severity = fields.S;
    message.code = fields.C;
    message.detail = fields.D;
    message.hint = fields.H;
    message.position = fields.P;
    message.internalPosition = fields.p;
    message.internalQuery = fields.q;
    message.where = fields.W;
    message.schema = fields.s;
    message.table = fields.t;
    message.column = fields.c;
    message.dataType = fields.d;
    message.constraint = fields.n;
    message.file = fields.F;
    message.line = fields.L;
    message.routine = fields.R;
    return message;
};
//# sourceMappingURL=parser.js.map

/***/ }),

/***/ 93902:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.serialize = void 0;
const buffer_writer_1 = __webpack_require__(72314);
const writer = new buffer_writer_1.Writer();
const startup = (opts) => {
    // protocol version
    writer.addInt16(3).addInt16(0);
    for (const key of Object.keys(opts)) {
        writer.addCString(key).addCString(opts[key]);
    }
    writer.addCString('client_encoding').addCString('UTF8');
    const bodyBuffer = writer.addCString('').flush();
    // this message is sent without a code
    const length = bodyBuffer.length + 4;
    return new buffer_writer_1.Writer().addInt32(length).add(bodyBuffer).flush();
};
const requestSsl = () => {
    const response = Buffer.allocUnsafe(8);
    response.writeInt32BE(8, 0);
    response.writeInt32BE(80877103, 4);
    return response;
};
const password = (password) => {
    return writer.addCString(password).flush(112 /* code.startup */);
};
const sendSASLInitialResponseMessage = function (mechanism, initialResponse) {
    // 0x70 = 'p'
    writer.addCString(mechanism).addInt32PrefixedString(initialResponse);
    return writer.flush(112 /* code.startup */);
};
const sendSCRAMClientFinalMessage = function (additionalData) {
    return writer.addString(additionalData).flush(112 /* code.startup */);
};
const query = (text) => {
    return writer.addCString(text).flush(81 /* code.query */);
};
const emptyArray = [];
const parse = (query) => {
    // expect something like this:
    // { name: 'queryName',
    //   text: 'select * from blah',
    //   types: ['int8', 'bool'] }
    // normalize missing query names to allow for null
    const name = query.name || '';
    if (name.length > 63) {
        console.error('Warning! Postgres only supports 63 characters for query names.');
        console.error('You supplied %s (%s)', name, name.length);
        console.error('This can cause conflicts and silent errors executing queries');
    }
    const types = query.types || emptyArray;
    const len = types.length;
    const buffer = writer
        .addCString(name) // name of query
        .addCString(query.text) // actual query text
        .addInt16(len);
    for (let i = 0; i < len; i++) {
        buffer.addInt32(types[i]);
    }
    return writer.flush(80 /* code.parse */);
};
const paramWriter = new buffer_writer_1.Writer();
const writeValues = function (values, valueMapper) {
    for (let i = 0; i < values.length; i++) {
        const mappedVal = valueMapper ? valueMapper(values[i], i) : values[i];
        if (mappedVal == null) {
            // add the param type (string) to the writer
            writer.addInt16(0 /* ParamType.STRING */);
            // write -1 to the param writer to indicate null
            paramWriter.addInt32(-1);
        }
        else if (mappedVal instanceof Buffer) {
            // add the param type (binary) to the writer
            writer.addInt16(1 /* ParamType.BINARY */);
            // add the buffer to the param writer
            paramWriter.addInt32(mappedVal.length);
            paramWriter.add(mappedVal);
        }
        else {
            // add the param type (string) to the writer
            writer.addInt16(0 /* ParamType.STRING */);
            // length prefix + UTF-8 bytes in one pass (Buffer.byteLength computed once)
            paramWriter.addInt32PrefixedString(mappedVal);
        }
    }
};
const bind = (config = {}) => {
    // normalize config
    const portal = config.portal || '';
    const statement = config.statement || '';
    const binary = config.binary || false;
    const values = config.values || emptyArray;
    const len = values.length;
    writer.addCString(portal).addCString(statement);
    writer.addInt16(len);
    try {
        writeValues(values, config.valueMapper);
    }
    catch (err) {
        writer.clear();
        paramWriter.clear();
        throw err;
    }
    writer.addInt16(len);
    writer.add(paramWriter.flush());
    // all results use the same format code
    writer.addInt16(1);
    // format code
    writer.addInt16(binary ? 1 /* ParamType.BINARY */ : 0 /* ParamType.STRING */);
    return writer.flush(66 /* code.bind */);
};
const emptyExecute = Buffer.from([69 /* code.execute */, 0x00, 0x00, 0x00, 0x09, 0x00, 0x00, 0x00, 0x00, 0x00]);
const execute = (config) => {
    // this is the happy path for most queries
    if (!config || (!config.portal && !config.rows)) {
        return emptyExecute;
    }
    const portal = config.portal || '';
    const rows = config.rows || 0;
    const portalLength = Buffer.byteLength(portal);
    const len = 4 + portalLength + 1 + 4;
    // one extra bit for code
    const buff = Buffer.allocUnsafe(1 + len);
    buff[0] = 69 /* code.execute */;
    buff.writeInt32BE(len, 1);
    buff.write(portal, 5, 'utf-8');
    buff[portalLength + 5] = 0; // null terminate portal cString
    buff.writeUInt32BE(rows, buff.length - 4);
    return buff;
};
const cancel = (processID, secretKey) => {
    const buffer = Buffer.allocUnsafe(16);
    buffer.writeInt32BE(16, 0);
    buffer.writeInt16BE(1234, 4);
    buffer.writeInt16BE(5678, 6);
    buffer.writeInt32BE(processID, 8);
    buffer.writeInt32BE(secretKey, 12);
    return buffer;
};
const cstringMessage = (code, string) => {
    const stringLen = Buffer.byteLength(string);
    const len = 4 + stringLen + 1;
    // one extra bit for code
    const buffer = Buffer.allocUnsafe(1 + len);
    buffer[0] = code;
    buffer.writeInt32BE(len, 1);
    buffer.write(string, 5, 'utf-8');
    buffer[len] = 0; // null terminate cString
    return buffer;
};
const emptyDescribePortal = writer.addCString('P').flush(68 /* code.describe */);
const emptyDescribeStatement = writer.addCString('S').flush(68 /* code.describe */);
const describe = (msg) => {
    return msg.name
        ? cstringMessage(68 /* code.describe */, `${msg.type}${msg.name || ''}`)
        : msg.type === 'P'
            ? emptyDescribePortal
            : emptyDescribeStatement;
};
const close = (msg) => {
    const text = `${msg.type}${msg.name || ''}`;
    return cstringMessage(67 /* code.close */, text);
};
const copyData = (chunk) => {
    return writer.add(chunk).flush(100 /* code.copyFromChunk */);
};
const copyFail = (message) => {
    return cstringMessage(102 /* code.copyFail */, message);
};
const codeOnlyBuffer = (code) => Buffer.from([code, 0x00, 0x00, 0x00, 0x04]);
const flushBuffer = codeOnlyBuffer(72 /* code.flush */);
const syncBuffer = codeOnlyBuffer(83 /* code.sync */);
const endBuffer = codeOnlyBuffer(88 /* code.end */);
const copyDoneBuffer = codeOnlyBuffer(99 /* code.copyDone */);
const serialize = {
    startup,
    password,
    requestSsl,
    sendSASLInitialResponseMessage,
    sendSCRAMClientFinalMessage,
    query,
    parse,
    bind,
    execute,
    describe,
    close,
    flush: () => flushBuffer,
    sync: () => syncBuffer,
    end: () => endBuffer,
    copyData,
    copyDone: () => copyDoneBuffer,
    copyFail,
    cancel,
};
exports.serialize = serialize;
//# sourceMappingURL=serializer.js.map

/***/ }),

/***/ 67759:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

var textParsers = __webpack_require__(85830);
var binaryParsers = __webpack_require__(1100);
var arrayParser = __webpack_require__(60865);
var builtinTypes = __webpack_require__(72871);

exports.getTypeParser = getTypeParser;
exports.setTypeParser = setTypeParser;
exports.arrayParser = arrayParser;
exports.builtins = builtinTypes;

var typeParsers = {
  text: {},
  binary: {}
};

//the empty parse function
function noParse (val) {
  return String(val);
};

//returns a function used to convert a specific type (specified by
//oid) into a result javascript type
//note: the oid can be obtained via the following sql query:
//SELECT oid FROM pg_type WHERE typname = 'TYPE_NAME_HERE';
function getTypeParser (oid, format) {
  format = format || 'text';
  if (!typeParsers[format]) {
    return noParse;
  }
  return typeParsers[format][oid] || noParse;
};

function setTypeParser (oid, format, parseFn) {
  if(typeof format == 'function') {
    parseFn = format;
    format = 'text';
  }
  typeParsers[format][oid] = parseFn;
};

textParsers.init(function(oid, converter) {
  typeParsers.text[oid] = converter;
});

binaryParsers.init(function(oid, converter) {
  typeParsers.binary[oid] = converter;
});


/***/ }),

/***/ 60865:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var array = __webpack_require__(25837);

module.exports = {
  create: function (source, transform) {
    return {
      parse: function() {
        return array.parse(source, transform);
      }
    };
  }
};


/***/ }),

/***/ 1100:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parseInt64 = __webpack_require__(69497);

var parseBits = function(data, bits, offset, invert, callback) {
  offset = offset || 0;
  invert = invert || false;
  callback = callback || function(lastValue, newValue, bits) { return (lastValue * Math.pow(2, bits)) + newValue; };
  var offsetBytes = offset >> 3;

  var inv = function(value) {
    if (invert) {
      return ~value & 0xff;
    }

    return value;
  };

  // read first (maybe partial) byte
  var mask = 0xff;
  var firstBits = 8 - (offset % 8);
  if (bits < firstBits) {
    mask = (0xff << (8 - bits)) & 0xff;
    firstBits = bits;
  }

  if (offset) {
    mask = mask >> (offset % 8);
  }

  var result = 0;
  if ((offset % 8) + bits >= 8) {
    result = callback(0, inv(data[offsetBytes]) & mask, firstBits);
  }

  // read bytes
  var bytes = (bits + offset) >> 3;
  for (var i = offsetBytes + 1; i < bytes; i++) {
    result = callback(result, inv(data[i]), 8);
  }

  // bits to read, that are not a complete byte
  var lastBits = (bits + offset) % 8;
  if (lastBits > 0) {
    result = callback(result, inv(data[bytes]) >> (8 - lastBits), lastBits);
  }

  return result;
};

var parseFloatFromBits = function(data, precisionBits, exponentBits) {
  var bias = Math.pow(2, exponentBits - 1) - 1;
  var sign = parseBits(data, 1);
  var exponent = parseBits(data, exponentBits, 1);

  if (exponent === 0) {
    return 0;
  }

  // parse mantissa
  var precisionBitsCounter = 1;
  var parsePrecisionBits = function(lastValue, newValue, bits) {
    if (lastValue === 0) {
      lastValue = 1;
    }

    for (var i = 1; i <= bits; i++) {
      precisionBitsCounter /= 2;
      if ((newValue & (0x1 << (bits - i))) > 0) {
        lastValue += precisionBitsCounter;
      }
    }

    return lastValue;
  };

  var mantissa = parseBits(data, precisionBits, exponentBits + 1, false, parsePrecisionBits);

  // special cases
  if (exponent == (Math.pow(2, exponentBits + 1) - 1)) {
    if (mantissa === 0) {
      return (sign === 0) ? Infinity : -Infinity;
    }

    return NaN;
  }

  // normale number
  return ((sign === 0) ? 1 : -1) * Math.pow(2, exponent - bias) * mantissa;
};

var parseInt16 = function(value) {
  if (parseBits(value, 1) == 1) {
    return -1 * (parseBits(value, 15, 1, true) + 1);
  }

  return parseBits(value, 15, 1);
};

var parseInt32 = function(value) {
  if (parseBits(value, 1) == 1) {
    return -1 * (parseBits(value, 31, 1, true) + 1);
  }

  return parseBits(value, 31, 1);
};

var parseFloat32 = function(value) {
  return parseFloatFromBits(value, 23, 8);
};

var parseFloat64 = function(value) {
  return parseFloatFromBits(value, 52, 11);
};

var parseNumeric = function(value) {
  var sign = parseBits(value, 16, 32);
  if (sign == 0xc000) {
    return NaN;
  }

  var weight = Math.pow(10000, parseBits(value, 16, 16));
  var result = 0;

  var digits = [];
  var ndigits = parseBits(value, 16);
  for (var i = 0; i < ndigits; i++) {
    result += parseBits(value, 16, 64 + (16 * i)) * weight;
    weight /= 10000;
  }

  var scale = Math.pow(10, parseBits(value, 16, 48));
  return ((sign === 0) ? 1 : -1) * Math.round(result * scale) / scale;
};

var parseDate = function(isUTC, value) {
  var sign = parseBits(value, 1);
  var rawValue = parseBits(value, 63, 1);

  // discard usecs and shift from 2000 to 1970
  var result = new Date((((sign === 0) ? 1 : -1) * rawValue / 1000) + 946684800000);

  if (!isUTC) {
    result.setTime(result.getTime() + result.getTimezoneOffset() * 60000);
  }

  // add microseconds to the date
  result.usec = rawValue % 1000;
  result.getMicroSeconds = function() {
    return this.usec;
  };
  result.setMicroSeconds = function(value) {
    this.usec = value;
  };
  result.getUTCMicroSeconds = function() {
    return this.usec;
  };

  return result;
};

var parseArray = function(value) {
  var dim = parseBits(value, 32);

  var flags = parseBits(value, 32, 32);
  var elementType = parseBits(value, 32, 64);

  var offset = 96;
  var dims = [];
  for (var i = 0; i < dim; i++) {
    // parse dimension
    dims[i] = parseBits(value, 32, offset);
    offset += 32;

    // ignore lower bounds
    offset += 32;
  }

  var parseElement = function(elementType) {
    // parse content length
    var length = parseBits(value, 32, offset);
    offset += 32;

    // parse null values
    if (length == 0xffffffff) {
      return null;
    }

    var result;
    if ((elementType == 0x17) || (elementType == 0x14)) {
      // int/bigint
      result = parseBits(value, length * 8, offset);
      offset += length * 8;
      return result;
    }
    else if (elementType == 0x19) {
      // string
      result = value.toString(this.encoding, offset >> 3, (offset += (length << 3)) >> 3);
      return result;
    }
    else {
      console.log("ERROR: ElementType not implemented: " + elementType);
    }
  };

  var parse = function(dimension, elementType) {
    var array = [];
    var i;

    if (dimension.length > 1) {
      var count = dimension.shift();
      for (i = 0; i < count; i++) {
        array[i] = parse(dimension, elementType);
      }
      dimension.unshift(count);
    }
    else {
      for (i = 0; i < dimension[0]; i++) {
        array[i] = parseElement(elementType);
      }
    }

    return array;
  };

  return parse(dims, elementType);
};

var parseText = function(value) {
  return value.toString('utf8');
};

var parseBool = function(value) {
  if(value === null) return null;
  return (parseBits(value, 8) > 0);
};

var init = function(register) {
  register(20, parseInt64);
  register(21, parseInt16);
  register(23, parseInt32);
  register(26, parseInt32);
  register(1700, parseNumeric);
  register(700, parseFloat32);
  register(701, parseFloat64);
  register(16, parseBool);
  register(1114, parseDate.bind(null, false));
  register(1184, parseDate.bind(null, true));
  register(1000, parseArray);
  register(1007, parseArray);
  register(1016, parseArray);
  register(1008, parseArray);
  register(1009, parseArray);
  register(25, parseText);
};

module.exports = {
  init: init
};


/***/ }),

/***/ 72871:
/***/ ((module) => {

/**
 * Following query was used to generate this file:

 SELECT json_object_agg(UPPER(PT.typname), PT.oid::int4 ORDER BY pt.oid)
 FROM pg_type PT
 WHERE typnamespace = (SELECT pgn.oid FROM pg_namespace pgn WHERE nspname = 'pg_catalog') -- Take only builting Postgres types with stable OID (extension types are not guaranted to be stable)
 AND typtype = 'b' -- Only basic types
 AND typelem = 0 -- Ignore aliases
 AND typisdefined -- Ignore undefined types
 */

module.exports = {
    BOOL: 16,
    BYTEA: 17,
    CHAR: 18,
    INT8: 20,
    INT2: 21,
    INT4: 23,
    REGPROC: 24,
    TEXT: 25,
    OID: 26,
    TID: 27,
    XID: 28,
    CID: 29,
    JSON: 114,
    XML: 142,
    PG_NODE_TREE: 194,
    SMGR: 210,
    PATH: 602,
    POLYGON: 604,
    CIDR: 650,
    FLOAT4: 700,
    FLOAT8: 701,
    ABSTIME: 702,
    RELTIME: 703,
    TINTERVAL: 704,
    CIRCLE: 718,
    MACADDR8: 774,
    MONEY: 790,
    MACADDR: 829,
    INET: 869,
    ACLITEM: 1033,
    BPCHAR: 1042,
    VARCHAR: 1043,
    DATE: 1082,
    TIME: 1083,
    TIMESTAMP: 1114,
    TIMESTAMPTZ: 1184,
    INTERVAL: 1186,
    TIMETZ: 1266,
    BIT: 1560,
    VARBIT: 1562,
    NUMERIC: 1700,
    REFCURSOR: 1790,
    REGPROCEDURE: 2202,
    REGOPER: 2203,
    REGOPERATOR: 2204,
    REGCLASS: 2205,
    REGTYPE: 2206,
    UUID: 2950,
    TXID_SNAPSHOT: 2970,
    PG_LSN: 3220,
    PG_NDISTINCT: 3361,
    PG_DEPENDENCIES: 3402,
    TSVECTOR: 3614,
    TSQUERY: 3615,
    GTSVECTOR: 3642,
    REGCONFIG: 3734,
    REGDICTIONARY: 3769,
    JSONB: 3802,
    REGNAMESPACE: 4089,
    REGROLE: 4096
};


/***/ }),

/***/ 85830:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var array = __webpack_require__(25837)
var arrayParser = __webpack_require__(60865);
var parseDate = __webpack_require__(83565);
var parseInterval = __webpack_require__(42366);
var parseByteA = __webpack_require__(30587);

function allowNull (fn) {
  return function nullAllowed (value) {
    if (value === null) return value
    return fn(value)
  }
}

function parseBool (value) {
  if (value === null) return value
  return value === 'TRUE' ||
    value === 't' ||
    value === 'true' ||
    value === 'y' ||
    value === 'yes' ||
    value === 'on' ||
    value === '1';
}

function parseBoolArray (value) {
  if (!value) return null
  return array.parse(value, parseBool)
}

function parseBaseTenInt (string) {
  return parseInt(string, 10)
}

function parseIntegerArray (value) {
  if (!value) return null
  return array.parse(value, allowNull(parseBaseTenInt))
}

function parseBigIntegerArray (value) {
  if (!value) return null
  return array.parse(value, allowNull(function (entry) {
    return parseBigInteger(entry).trim()
  }))
}

var parsePointArray = function(value) {
  if(!value) { return null; }
  var p = arrayParser.create(value, function(entry) {
    if(entry !== null) {
      entry = parsePoint(entry);
    }
    return entry;
  });

  return p.parse();
};

var parseFloatArray = function(value) {
  if(!value) { return null; }
  var p = arrayParser.create(value, function(entry) {
    if(entry !== null) {
      entry = parseFloat(entry);
    }
    return entry;
  });

  return p.parse();
};

var parseStringArray = function(value) {
  if(!value) { return null; }

  var p = arrayParser.create(value);
  return p.parse();
};

var parseDateArray = function(value) {
  if (!value) { return null; }

  var p = arrayParser.create(value, function(entry) {
    if (entry !== null) {
      entry = parseDate(entry);
    }
    return entry;
  });

  return p.parse();
};

var parseIntervalArray = function(value) {
  if (!value) { return null; }

  var p = arrayParser.create(value, function(entry) {
    if (entry !== null) {
      entry = parseInterval(entry);
    }
    return entry;
  });

  return p.parse();
};

var parseByteAArray = function(value) {
  if (!value) { return null; }

  return array.parse(value, allowNull(parseByteA));
};

var parseInteger = function(value) {
  return parseInt(value, 10);
};

var parseBigInteger = function(value) {
  var valStr = String(value);
  if (/^\d+$/.test(valStr)) { return valStr; }
  return value;
};

var parseJsonArray = function(value) {
  if (!value) { return null; }

  return array.parse(value, allowNull(JSON.parse));
};

var parsePoint = function(value) {
  if (value[0] !== '(') { return null; }

  value = value.substring( 1, value.length - 1 ).split(',');

  return {
    x: parseFloat(value[0])
  , y: parseFloat(value[1])
  };
};

var parseCircle = function(value) {
  if (value[0] !== '<' && value[1] !== '(') { return null; }

  var point = '(';
  var radius = '';
  var pointParsed = false;
  for (var i = 2; i < value.length - 1; i++){
    if (!pointParsed) {
      point += value[i];
    }

    if (value[i] === ')') {
      pointParsed = true;
      continue;
    } else if (!pointParsed) {
      continue;
    }

    if (value[i] === ','){
      continue;
    }

    radius += value[i];
  }
  var result = parsePoint(point);
  result.radius = parseFloat(radius);

  return result;
};

var init = function(register) {
  register(20, parseBigInteger); // int8
  register(21, parseInteger); // int2
  register(23, parseInteger); // int4
  register(26, parseInteger); // oid
  register(700, parseFloat); // float4/real
  register(701, parseFloat); // float8/double
  register(16, parseBool);
  register(1082, parseDate); // date
  register(1114, parseDate); // timestamp without timezone
  register(1184, parseDate); // timestamp
  register(600, parsePoint); // point
  register(651, parseStringArray); // cidr[]
  register(718, parseCircle); // circle
  register(1000, parseBoolArray);
  register(1001, parseByteAArray);
  register(1005, parseIntegerArray); // _int2
  register(1007, parseIntegerArray); // _int4
  register(1028, parseIntegerArray); // oid[]
  register(1016, parseBigIntegerArray); // _int8
  register(1017, parsePointArray); // point[]
  register(1021, parseFloatArray); // _float4
  register(1022, parseFloatArray); // _float8
  register(1231, parseFloatArray); // _numeric
  register(1014, parseStringArray); //char
  register(1015, parseStringArray); //varchar
  register(1008, parseStringArray);
  register(1009, parseStringArray);
  register(1040, parseStringArray); // macaddr[]
  register(1041, parseStringArray); // inet[]
  register(1115, parseDateArray); // timestamp without time zone[]
  register(1182, parseDateArray); // _date
  register(1185, parseDateArray); // timestamp with time zone[]
  register(1186, parseInterval);
  register(1187, parseIntervalArray);
  register(17, parseByteA);
  register(114, JSON.parse.bind(JSON)); // json
  register(3802, JSON.parse.bind(JSON)); // jsonb
  register(199, parseJsonArray); // json[]
  register(3807, parseJsonArray); // jsonb[]
  register(3907, parseStringArray); // numrange[]
  register(2951, parseStringArray); // uuid[]
  register(791, parseStringArray); // money[]
  register(1183, parseStringArray); // time[]
  register(1270, parseStringArray); // timetz[]
};

module.exports = {
  init: init
};


/***/ }),

/***/ 89853:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const EventEmitter = (__webpack_require__(24434).EventEmitter)
const utils = __webpack_require__(52269)
const nodeUtils = __webpack_require__(39023)
const sasl = __webpack_require__(34669)
const TypeOverrides = __webpack_require__(16662)

const ConnectionParameters = __webpack_require__(67731)
const Query = __webpack_require__(69564)
const defaults = __webpack_require__(71528)
const Connection = __webpack_require__(60726)
const crypto = __webpack_require__(7365)

const activeQueryDeprecationNotice = nodeUtils.deprecate(
  () => {},
  'Client.activeQuery is deprecated and will be removed in pg@9.0'
)

const queryQueueDeprecationNotice = nodeUtils.deprecate(
  () => {},
  'Client.queryQueue is deprecated and will be removed in pg@9.0.'
)

const pgPassDeprecationNotice = nodeUtils.deprecate(
  () => {},
  'pgpass support is deprecated and will be removed in pg@9.0. ' +
    'You can provide an async function as the password property to the Client/Pool constructor that returns a password instead. Within this function you can call the pgpass module in your own code.'
)

const byoPromiseDeprecationNotice = nodeUtils.deprecate(
  () => {},
  'Passing a custom Promise implementation to the Client/Pool constructor is deprecated and will be removed in pg@9.0.'
)

const queryQueueLengthDeprecationNotice = nodeUtils.deprecate(
  () => {},
  'Calling client.query() when the client is already executing a query is deprecated and will be removed in pg@9.0. Use async/await or an external async flow control mechanism instead.'
)

function coerceNumberOrDefault(value, defaultValue) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : defaultValue
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    return Number.isFinite(n) ? n : defaultValue
  }
  return defaultValue
}

class Client extends EventEmitter {
  constructor(config) {
    super()

    this.connectionParameters = new ConnectionParameters(config)
    this.user = this.connectionParameters.user
    this.database = this.connectionParameters.database
    this.port = this.connectionParameters.port
    this.host = this.connectionParameters.host

    // "hiding" the password so it doesn't show up in stack traces
    // or if the client is console.logged
    Object.defineProperty(this, 'password', {
      configurable: true,
      enumerable: false,
      writable: true,
      value: this.connectionParameters.password,
    })

    this.replication = this.connectionParameters.replication

    const c = config || {}

    if (c.Promise) {
      byoPromiseDeprecationNotice()
    }
    this._Promise = c.Promise || global.Promise
    this._types = new TypeOverrides(c.types)
    this._ending = false
    this._ended = false
    this._connecting = false
    this._connected = false
    this._connectionError = false
    this._queryable = true
    this._activeQuery = null
    this._txStatus = null

    this.enableChannelBinding = Boolean(c.enableChannelBinding) // set true to use SCRAM-SHA-256-PLUS when offered
    this.scramMaxIterations = coerceNumberOrDefault(c.scramMaxIterations, sasl.DEFAULT_MAX_SCRAM_ITERATIONS)
    this.connection =
      c.connection ||
      new Connection({
        stream: c.stream,
        ssl: this.connectionParameters.ssl,
        sslNegotiation: this.connectionParameters.sslnegotiation,
        keepAlive: c.keepAlive || false,
        keepAliveInitialDelayMillis: c.keepAliveInitialDelayMillis || 0,
        encoding: this.connectionParameters.client_encoding || 'utf8',
      })
    this._queryQueue = []
    this._sentQueryQueue = []
    this.pipeline = Boolean(c.pipeline)
    this.binary = c.binary || defaults.binary
    this.processID = null
    this.secretKey = null
    this.ssl = this.connectionParameters.ssl || false
    this.sslNegotiation = this.connectionParameters.sslnegotiation || 'postgres'
    // As with Password, make SSL->Key (the private key) non-enumerable.
    // It won't show up in stack traces
    // or if the client is console.logged
    if (this.ssl && this.ssl.key) {
      Object.defineProperty(this.ssl, 'key', {
        enumerable: false,
      })
    }

    this._connectionTimeoutMillis = c.connectionTimeoutMillis || 0
  }

  get activeQuery() {
    activeQueryDeprecationNotice()
    return this._activeQuery
  }

  set activeQuery(val) {
    activeQueryDeprecationNotice()
    this._activeQuery = val
  }

  _getActiveQuery() {
    return this._activeQuery
  }

  _errorAllQueries(err) {
    const enqueueError = (query) => {
      process.nextTick(() => {
        query.handleError(err, this.connection)
      })
    }

    const activeQuery = this._getActiveQuery()
    if (activeQuery) {
      enqueueError(activeQuery)
      this._activeQuery = null
    }

    this._sentQueryQueue.forEach(enqueueError)
    this._sentQueryQueue.length = 0

    this._queryQueue.forEach(enqueueError)
    this._queryQueue.length = 0
  }

  _connect(callback) {
    const self = this
    const con = this.connection
    this._connectionCallback = callback

    if (this._connecting || this._connected) {
      const err = new Error('Client has already been connected. You cannot reuse a client.')
      process.nextTick(() => {
        callback(err)
      })
      return
    }
    this._connecting = true

    if (this._connectionTimeoutMillis > 0) {
      this.connectionTimeoutHandle = setTimeout(() => {
        con._ending = true
        con.stream.destroy(new Error('timeout expired'))
      }, this._connectionTimeoutMillis)

      if (this.connectionTimeoutHandle.unref) {
        this.connectionTimeoutHandle.unref()
      }
    }

    if (this.host && this.host.indexOf('/') === 0) {
      con.connect(this.host + '/.s.PGSQL.' + this.port)
    } else {
      con.connect(this.port, this.host)
    }

    // once connection is established send startup message
    con.on('connect', function () {
      if (self.ssl) {
        // With direct SSL negotiation the connection upgrades to TLS without an
        // SSLRequest packet, so the startup message is sent after 'sslconnect'.
        if (self.sslNegotiation !== 'direct') {
          con.requestSsl()
        }
      } else {
        con.startup(self.getStartupConf())
      }
    })

    con.on('sslconnect', function () {
      con.startup(self.getStartupConf())
    })

    this._attachListeners(con)

    con.once('end', () => {
      const error = this._ending ? new Error('Connection terminated') : new Error('Connection terminated unexpectedly')

      clearTimeout(this.connectionTimeoutHandle)
      this._errorAllQueries(error)
      this._ended = true

      if (!this._ending) {
        // if the connection is ended without us calling .end()
        // on this client then we have an unexpected disconnection
        // treat this as an error unless we've already emitted an error
        // during connection.
        if (this._connecting && !this._connectionError) {
          if (this._connectionCallback) {
            this._connectionCallback(error)
          } else {
            this._handleErrorEvent(error)
          }
        } else if (!this._connectionError) {
          this._handleErrorEvent(error)
        }
      }

      process.nextTick(() => {
        this.emit('end')
      })
    })
  }

  connect(callback) {
    if (callback) {
      this._connect(callback)
      return
    }

    return new this._Promise((resolve, reject) => {
      this._connect((error) => {
        if (error) {
          reject(error)
        } else {
          resolve(this)
        }
      })
    })
  }

  _attachListeners(con) {
    // password request handling
    con.on('authenticationCleartextPassword', this._handleAuthCleartextPassword.bind(this))
    // password request handling
    con.on('authenticationMD5Password', this._handleAuthMD5Password.bind(this))
    // password request handling (SASL)
    con.on('authenticationSASL', this._handleAuthSASL.bind(this))
    con.on('authenticationSASLContinue', this._handleAuthSASLContinue.bind(this))
    con.on('authenticationSASLFinal', this._handleAuthSASLFinal.bind(this))
    con.on('backendKeyData', this._handleBackendKeyData.bind(this))
    con.on('error', this._handleErrorEvent.bind(this))
    con.on('errorMessage', this._handleErrorMessage.bind(this))
    con.on('readyForQuery', this._handleReadyForQuery.bind(this))
    con.on('notice', this._handleNotice.bind(this))
    con.on('rowDescription', this._handleRowDescription.bind(this))
    con.on('dataRow', this._handleDataRow.bind(this))
    con.on('portalSuspended', this._handlePortalSuspended.bind(this))
    con.on('emptyQuery', this._handleEmptyQuery.bind(this))
    con.on('commandComplete', this._handleCommandComplete.bind(this))
    con.on('parseComplete', this._handleParseComplete.bind(this))
    con.on('copyInResponse', this._handleCopyInResponse.bind(this))
    con.on('copyData', this._handleCopyData.bind(this))
    con.on('notification', this._handleNotification.bind(this))
  }

  _getPassword(cb) {
    const con = this.connection
    if (typeof this.password === 'function') {
      this._Promise
        .resolve()
        .then(() => this.password(this.connectionParameters))
        .then((pass) => {
          if (pass !== undefined) {
            if (typeof pass !== 'string') {
              con.emit('error', new TypeError('Password must be a string'))
              return
            }
            this.connectionParameters.password = this.password = pass
          } else {
            this.connectionParameters.password = this.password = null
          }
          cb()
        })
        .catch((err) => {
          con.emit('error', err)
        })
    } else if (this.password !== null) {
      cb()
    } else {
      try {
        const pgPass = __webpack_require__(61559)
        pgPass(this.connectionParameters, (pass) => {
          if (undefined !== pass) {
            pgPassDeprecationNotice()
            this.connectionParameters.password = this.password = pass
          }
          cb()
        })
      } catch (e) {
        this.emit('error', e)
      }
    }
  }

  _handleAuthCleartextPassword(msg) {
    this._getPassword(() => {
      this.connection.password(this.password)
    })
  }

  _handleAuthMD5Password(msg) {
    this._getPassword(async () => {
      try {
        const hashedPassword = await crypto.postgresMd5PasswordHash(this.user, this.password, msg.salt)
        this.connection.password(hashedPassword)
      } catch (e) {
        this.emit('error', e)
      }
    })
  }

  _handleAuthSASL(msg) {
    this._getPassword(() => {
      try {
        this.saslSession = sasl.startSession(
          msg.mechanisms,
          this.enableChannelBinding && this.connection.stream,
          this.scramMaxIterations
        )
        this.connection.sendSASLInitialResponseMessage(this.saslSession.mechanism, this.saslSession.response)
      } catch (err) {
        this.connection.emit('error', err)
      }
    })
  }

  async _handleAuthSASLContinue(msg) {
    try {
      await sasl.continueSession(
        this.saslSession,
        this.password,
        msg.data,
        this.enableChannelBinding && this.connection.stream
      )
      this.connection.sendSCRAMClientFinalMessage(this.saslSession.response)
    } catch (err) {
      this.connection.emit('error', err)
    }
  }

  _handleAuthSASLFinal(msg) {
    try {
      sasl.finalizeSession(this.saslSession, msg.data)
      this.saslSession = null
    } catch (err) {
      this.connection.emit('error', err)
    }
  }

  _handleBackendKeyData(msg) {
    this.processID = msg.processID
    this.secretKey = msg.secretKey
  }

  _handleReadyForQuery(msg) {
    if (this._connecting) {
      this._connecting = false
      this._connected = true
      clearTimeout(this.connectionTimeoutHandle)

      // process possible callback argument to Client#connect
      if (this._connectionCallback) {
        this._connectionCallback(null, this)
        // remove callback for proper error handling
        // after the connect event
        this._connectionCallback = null
      }
      this.emit('connect')
    }
    const activeQuery = this._getActiveQuery()
    this._activeQuery = null
    this._txStatus = msg?.status ?? null
    this.readyForQuery = true
    if (activeQuery) {
      activeQuery.handleReadyForQuery(this.connection)
    }
    this._pulseQueryQueue()
  }

  // if we receive an error event or error message
  // during the connection process we handle it here
  _handleErrorWhileConnecting(err) {
    if (this._connectionError) {
      // TODO(bmc): this is swallowing errors - we shouldn't do this
      return
    }
    this._connectionError = true
    clearTimeout(this.connectionTimeoutHandle)
    if (this._connectionCallback) {
      return this._connectionCallback(err)
    }
    this.emit('error', err)
  }

  // if we're connected and we receive an error event from the connection
  // this means the socket is dead - do a hard abort of all queries and emit
  // the socket error on the client as well
  _handleErrorEvent(err) {
    if (this._connecting) {
      return this._handleErrorWhileConnecting(err)
    }
    this._queryable = false
    this._errorAllQueries(err)
    this.emit('error', err)
  }

  // handle error messages from the postgres backend
  _handleErrorMessage(msg) {
    if (this._connecting) {
      return this._handleErrorWhileConnecting(msg)
    }
    const activeQuery = this._getActiveQuery()

    if (!activeQuery) {
      this._handleErrorEvent(msg)
      return
    }

    this._activeQuery = null
    if (activeQuery.name) {
      delete this.connection.submittedNamedStatements[activeQuery.name]
    }
    activeQuery.handleError(msg, this.connection)
  }

  _handleRowDescription(msg) {
    const activeQuery = this._getActiveQuery()
    if (activeQuery == null) {
      const error = new Error('Received unexpected rowDescription message from backend.')
      this._handleErrorEvent(error)
      return
    }
    // delegate rowDescription to active query
    activeQuery.handleRowDescription(msg)
  }

  _handleDataRow(msg) {
    const activeQuery = this._getActiveQuery()
    if (activeQuery == null) {
      const error = new Error('Received unexpected dataRow message from backend.')
      this._handleErrorEvent(error)
      return
    }
    // delegate dataRow to active query
    activeQuery.handleDataRow(msg)
  }

  _handlePortalSuspended(msg) {
    const activeQuery = this._getActiveQuery()
    if (activeQuery == null) {
      const error = new Error('Received unexpected portalSuspended message from backend.')
      this._handleErrorEvent(error)
      return
    }
    // delegate portalSuspended to active query
    activeQuery.handlePortalSuspended(this.connection)
  }

  _handleEmptyQuery(msg) {
    const activeQuery = this._getActiveQuery()
    if (activeQuery == null) {
      const error = new Error('Received unexpected emptyQuery message from backend.')
      this._handleErrorEvent(error)
      return
    }
    // delegate emptyQuery to active query
    activeQuery.handleEmptyQuery(this.connection)
  }

  _handleCommandComplete(msg) {
    const activeQuery = this._getActiveQuery()
    if (activeQuery == null) {
      const error = new Error('Received unexpected commandComplete message from backend.')
      this._handleErrorEvent(error)
      return
    }
    // delegate commandComplete to active query
    activeQuery.handleCommandComplete(msg, this.connection)
  }

  _handleParseComplete() {
    const activeQuery = this._getActiveQuery()
    if (activeQuery == null) {
      const error = new Error('Received unexpected parseComplete message from backend.')
      this._handleErrorEvent(error)
      return
    }
    // if a prepared statement has a name and properly parses
    // we track that its already been executed so we don't parse
    // it again on the same client
    if (activeQuery.name) {
      this.connection.parsedStatements[activeQuery.name] = activeQuery.text
      delete this.connection.submittedNamedStatements[activeQuery.name]
    }
  }

  _handleCopyInResponse(msg) {
    const activeQuery = this._getActiveQuery()
    if (activeQuery == null) {
      const error = new Error('Received unexpected copyInResponse message from backend.')
      this._handleErrorEvent(error)
      return
    }
    activeQuery.handleCopyInResponse(this.connection)
  }

  _handleCopyData(msg) {
    const activeQuery = this._getActiveQuery()
    if (activeQuery == null) {
      const error = new Error('Received unexpected copyData message from backend.')
      this._handleErrorEvent(error)
      return
    }
    activeQuery.handleCopyData(msg, this.connection)
  }

  _handleNotification(msg) {
    this.emit('notification', msg)
  }

  _handleNotice(msg) {
    this.emit('notice', msg)
  }

  getStartupConf() {
    const params = this.connectionParameters

    const data = {
      user: params.user,
      database: params.database,
    }

    const appName = params.application_name || params.fallback_application_name
    if (appName) {
      data.application_name = appName
    }
    if (params.replication) {
      data.replication = '' + params.replication
    }
    if (params.statement_timeout) {
      data.statement_timeout = String(parseInt(params.statement_timeout, 10))
    }
    if (params.lock_timeout) {
      data.lock_timeout = String(parseInt(params.lock_timeout, 10))
    }
    if (params.idle_in_transaction_session_timeout) {
      data.idle_in_transaction_session_timeout = String(parseInt(params.idle_in_transaction_session_timeout, 10))
    }
    if (params.options) {
      data.options = params.options
    }

    return data
  }

  cancel(client, query) {
    if (client.activeQuery === query) {
      const con = this.connection

      if (this.host && this.host.indexOf('/') === 0) {
        con.connect(this.host + '/.s.PGSQL.' + this.port)
      } else {
        con.connect(this.port, this.host)
      }

      // once connection is established send cancel message
      con.on('connect', function () {
        con.cancel(client.processID, client.secretKey)
      })
    } else if (client._queryQueue.indexOf(query) !== -1) {
      client._queryQueue.splice(client._queryQueue.indexOf(query), 1)
    } else if (client._sentQueryQueue.indexOf(query) !== -1) {
      // Query already sent on wire — can't remove it without corrupting the
      // pipeline. No-op the callback so the result is silently discarded.
      query.callback = () => {}
    }
  }

  setTypeParser(oid, format, parseFn) {
    return this._types.setTypeParser(oid, format, parseFn)
  }

  getTypeParser(oid, format) {
    return this._types.getTypeParser(oid, format)
  }

  // escapeIdentifier and escapeLiteral moved to utility functions & exported
  // on PG
  // re-exported here for backwards compatibility
  escapeIdentifier(str) {
    return utils.escapeIdentifier(str)
  }

  escapeLiteral(str) {
    return utils.escapeLiteral(str)
  }

  _pulseQueryQueue() {
    if (this.pipeline) {
      this._pulsePipelinedQueryQueue()
      return
    }
    if (this.readyForQuery === true) {
      this._activeQuery = this._queryQueue.shift()
      const activeQuery = this._getActiveQuery()
      if (activeQuery) {
        this.readyForQuery = false
        this.hasExecuted = true

        const queryError = activeQuery.submit(this.connection)
        if (queryError) {
          process.nextTick(() => {
            activeQuery.handleError(queryError, this.connection)
            this.readyForQuery = true
            this._pulseQueryQueue()
          })
        }
      } else if (this.hasExecuted) {
        this._activeQuery = null
        this.emit('drain')
      }
    }
  }

  _pulsePipelinedQueryQueue() {
    if (!this._connected || !this._queryable) {
      return
    }
    while (this._queryQueue.length > 0) {
      const query = this._queryQueue.shift()
      this.hasExecuted = true
      const queryError = query.submit(this.connection)
      if (queryError) {
        process.nextTick(() => {
          query.handleError(queryError, this.connection)
        })
        continue
      }
      this._sentQueryQueue.push(query)
    }
    if (this.readyForQuery && !this._activeQuery && this._sentQueryQueue.length > 0) {
      this._activeQuery = this._sentQueryQueue.shift()
      this.readyForQuery = false
    }
    if (!this._activeQuery && this._sentQueryQueue.length === 0 && this._queryQueue.length === 0 && this.hasExecuted) {
      this.emit('drain')
    }
  }

  query(config, values, callback) {
    // can take in strings, config object or query object
    let query
    let result

    if (config == null) {
      throw new TypeError('Client was passed a null or undefined query')
    }

    if (typeof config.submit === 'function') {
      result = query = config
      if (!query.callback) {
        if (typeof values === 'function') {
          query.callback = values
        } else if (callback) {
          query.callback = callback
        }
      }
    } else {
      query = new Query(config, values, callback)
      if (!query.callback) {
        result = new this._Promise((resolve, reject) => {
          query.callback = (err, res) => (err ? reject(err) : resolve(res))
        }).catch((err) => {
          // replace the stack trace that leads to `TCP.onStreamRead` with one that leads back to the
          // application that created the query
          Error.captureStackTrace(err)
          throw err
        })
      } else if (typeof query.callback !== 'function') {
        throw new TypeError('callback is not a function')
      }
    }

    const readTimeout = config.query_timeout || this.connectionParameters.query_timeout
    if (readTimeout) {
      const queryCallback = query.callback || (() => {})

      const readTimeoutTimer = setTimeout(() => {
        const error = new Error('Query read timeout')

        process.nextTick(() => {
          query.handleError(error, this.connection)
        })

        queryCallback(error)

        // we already returned an error,
        // just do nothing if query completes
        query.callback = () => {}

        // Remove from queue (only safe if not yet sent)
        const index = this._queryQueue.indexOf(query)
        if (index > -1) {
          this._queryQueue.splice(index, 1)
        } else if (this.pipeline) {
          // Query already sent — the pipeline is blocked until it completes.
          // Destroy the connection to unblock all remaining pipelined queries.
          this.connection.stream.destroy()
          return
        }

        this._pulseQueryQueue()
      }, readTimeout)

      query.callback = (err, res) => {
        clearTimeout(readTimeoutTimer)
        queryCallback(err, res)
      }
    }

    if (this.binary && !query.binary) {
      query.binary = true
    }

    if (query._result && !query._result._types) {
      query._result._types = this._types
    }

    if (!this._queryable) {
      process.nextTick(() => {
        query.handleError(new Error('Client has encountered a connection error and is not queryable'), this.connection)
      })
      return result
    }

    if (this._ending) {
      process.nextTick(() => {
        query.handleError(new Error('Client was closed and is not queryable'), this.connection)
      })
      return result
    }

    if (this._queryQueue.length > 0 && !this.pipeline) {
      queryQueueLengthDeprecationNotice()
    }
    this._queryQueue.push(query)
    this._pulseQueryQueue()
    return result
  }

  ref() {
    this.connection.ref()
  }

  unref() {
    this.connection.unref()
  }

  getTransactionStatus() {
    return this._txStatus
  }

  end(cb) {
    this._ending = true

    // if we have never connected, then end is a noop, callback immediately
    if (!this.connection._connecting || this._ended) {
      if (cb) {
        cb()
        return
      } else {
        return this._Promise.resolve()
      }
    }

    if (!this._queryable) {
      // socket is dead — force close
      this.connection.stream.destroy()
    } else if (
      this.pipeline &&
      (this._getActiveQuery() || this._sentQueryQueue.length > 0 || this._queryQueue.length > 0)
    ) {
      // pipelined queries are already on the wire (or queued to send) and will
      // complete normally; wait for drain then do a graceful goodbye
      this.once('drain', () => this.connection.end())
    } else if (this._getActiveQuery()) {
      // non-pipeline: a hung query could block end forever — force disconnect
      this.connection.stream.destroy()
    } else {
      this.connection.end()
    }

    if (cb) {
      this.connection.once('end', cb)
    } else {
      return new this._Promise((resolve) => {
        this.connection.once('end', resolve)
      })
    }
  }
  get queryQueue() {
    queryQueueDeprecationNotice()
    return this._queryQueue
  }
}

// expose a Query constructor
Client.Query = Query

module.exports = Client


/***/ }),

/***/ 67731:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



const dns = __webpack_require__(72250)

const defaults = __webpack_require__(71528)

const parse = (__webpack_require__(93714).parse) // parses a connection string

const val = function (key, config, envVar) {
  if (config[key]) {
    return config[key]
  }

  if (envVar === undefined) {
    envVar = process.env['PG' + key.toUpperCase()]
  } else if (envVar === false) {
    // do nothing ... use false
  } else {
    envVar = process.env[envVar]
  }

  return envVar || defaults[key]
}

const readSSLConfigFromEnvironment = function () {
  switch (process.env.PGSSLMODE) {
    case 'disable':
      return false
    case 'prefer':
    case 'require':
    case 'verify-ca':
    case 'verify-full':
      return true
    case 'no-verify':
      return { rejectUnauthorized: false }
  }
  return defaults.ssl
}

// Convert arg to a string, surround in single quotes, and escape single quotes and backslashes
const quoteParamValue = function (value) {
  return "'" + ('' + value).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'"
}

const add = function (params, config, paramName) {
  const value = config[paramName]
  if (value !== undefined && value !== null) {
    params.push(paramName + '=' + quoteParamValue(value))
  }
}

class ConnectionParameters {
  constructor(config) {
    // if a string is passed, it is a raw connection string so we parse it into a config
    config = typeof config === 'string' ? parse(config) : config || {}

    // if the config has a connectionString defined, parse IT into the config we use
    // this will override other default values with what is stored in connectionString
    if (config.connectionString) {
      config = Object.assign({}, config, parse(config.connectionString))
    }

    this.user = val('user', config)
    this.database = val('database', config)

    if (this.database === undefined) {
      this.database = this.user
    }

    this.port = parseInt(val('port', config), 10)
    this.host = val('host', config)

    // "hiding" the password so it doesn't show up in stack traces
    // or if the client is console.logged
    Object.defineProperty(this, 'password', {
      configurable: true,
      enumerable: false,
      writable: true,
      value: val('password', config),
    })

    this.binary = val('binary', config)
    this.options = val('options', config)

    this.ssl = typeof config.ssl === 'undefined' ? readSSLConfigFromEnvironment() : config.ssl

    if (typeof this.ssl === 'string') {
      if (this.ssl === 'true') {
        this.ssl = true
      }
    }
    // support passing in ssl=no-verify via connection string
    if (this.ssl === 'no-verify') {
      this.ssl = { rejectUnauthorized: false }
    }
    if (this.ssl && this.ssl.key) {
      Object.defineProperty(this.ssl, 'key', {
        enumerable: false,
      })
    }

    // How to negotiate SSL: 'postgres' (default, the traditional SSLRequest
    // handshake) or 'direct' (start the TLS handshake immediately on connect).
    this.sslnegotiation = val('sslnegotiation', config, 'PGSSLNEGOTIATION')
    if (this.sslnegotiation !== undefined && this.sslnegotiation !== 'postgres' && this.sslnegotiation !== 'direct') {
      throw new Error(
        `Invalid sslnegotiation value: "${this.sslnegotiation}". Valid values are "postgres" and "direct".`
      )
    }
    if (this.sslnegotiation === 'direct' && !this.ssl) {
      throw new Error('sslnegotiation=direct requires SSL to be enabled')
    }

    this.client_encoding = val('client_encoding', config)
    this.replication = val('replication', config)
    // a domain socket begins with '/'
    this.isDomainSocket = !(this.host || '').indexOf('/')

    this.application_name = val('application_name', config, 'PGAPPNAME')
    this.fallback_application_name = val('fallback_application_name', config, false)
    this.statement_timeout = val('statement_timeout', config, false)
    this.lock_timeout = val('lock_timeout', config, false)
    this.idle_in_transaction_session_timeout = val('idle_in_transaction_session_timeout', config, false)
    this.query_timeout = val('query_timeout', config, false)

    if (config.connectionTimeoutMillis === undefined) {
      this.connect_timeout = process.env.PGCONNECT_TIMEOUT || 0
    } else {
      this.connect_timeout = Math.floor(config.connectionTimeoutMillis / 1000)
    }

    if (config.keepAlive === false) {
      this.keepalives = 0
    } else if (config.keepAlive === true) {
      this.keepalives = 1
    }

    if (typeof config.keepAliveInitialDelayMillis === 'number') {
      this.keepalives_idle = Math.floor(config.keepAliveInitialDelayMillis / 1000)
    }
  }

  getLibpqConnectionString(cb) {
    const params = []
    add(params, this, 'user')
    add(params, this, 'password')
    add(params, this, 'port')
    add(params, this, 'application_name')
    add(params, this, 'fallback_application_name')
    add(params, this, 'connect_timeout')
    add(params, this, 'options')

    const ssl = typeof this.ssl === 'object' ? this.ssl : this.ssl ? { sslmode: this.ssl } : {}
    add(params, ssl, 'sslmode')
    add(params, ssl, 'sslca')
    add(params, ssl, 'sslkey')
    add(params, ssl, 'sslcert')
    add(params, ssl, 'sslrootcert')
    add(params, this, 'sslnegotiation')

    if (this.database) {
      params.push('dbname=' + quoteParamValue(this.database))
    }
    if (this.replication) {
      params.push('replication=' + quoteParamValue(this.replication))
    }
    if (this.host) {
      params.push('host=' + quoteParamValue(this.host))
    }
    if (this.isDomainSocket) {
      return cb(null, params.join(' '))
    }
    if (this.client_encoding) {
      params.push('client_encoding=' + quoteParamValue(this.client_encoding))
    }
    dns.lookup(this.host, function (err, address) {
      if (err) return cb(err, null)
      params.push('hostaddr=' + quoteParamValue(address))
      return cb(null, params.join(' '))
    })
  }
}

module.exports = ConnectionParameters


/***/ }),

/***/ 60726:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



const EventEmitter = (__webpack_require__(24434).EventEmitter)

const { parse, serialize } = __webpack_require__(72428)
const stream = __webpack_require__(62842)
const { getStream } = stream

const flushBuffer = serialize.flush()
const syncBuffer = serialize.sync()
const endBuffer = serialize.end()

// TODO(bmc) support binary mode at some point
class Connection extends EventEmitter {
  constructor(config) {
    super()
    config = config || {}

    this.stream = config.stream || getStream(config.ssl)
    if (typeof this.stream === 'function') {
      this.stream = this.stream(config)
    }

    this._keepAlive = config.keepAlive
    this._keepAliveInitialDelayMillis = config.keepAliveInitialDelayMillis
    this.parsedStatements = {}
    this.submittedNamedStatements = {}
    this.ssl = config.ssl || false
    this.sslNegotiation = config.sslNegotiation || 'postgres'
    this._ending = false
    this._emitMessage = false
    const self = this
    this.on('newListener', function (eventName) {
      if (eventName === 'message') {
        self._emitMessage = true
      }
    })
  }

  connect(port, host) {
    const self = this

    this._connecting = true
    this.stream.setNoDelay(true)
    this.stream.connect(port, host)

    this.stream.once('connect', function () {
      if (self._keepAlive) {
        self.stream.setKeepAlive(true, self._keepAliveInitialDelayMillis)
      }
      self.emit('connect')
    })

    const reportStreamError = function (error) {
      // errors about disconnections should be ignored during disconnect
      if (self._ending && (error.code === 'ECONNRESET' || error.code === 'EPIPE')) {
        return
      }
      self.emit('error', error)
    }
    this.stream.on('error', reportStreamError)

    this.stream.on('close', function () {
      self.emit('end')
    })

    if (!this.ssl) {
      return this.attachListeners(this.stream)
    }

    // With direct SSL negotiation the TLS handshake starts immediately on the
    // raw socket, skipping the SSLRequest packet and the server's 'S'/'N' reply.
    if (this.sslNegotiation === 'direct') {
      return this.stream.once('connect', function () {
        self.upgradeToSSL(host, reportStreamError)
      })
    }

    this.stream.once('data', function (buffer) {
      const responseCode = buffer.toString('utf8')
      switch (responseCode) {
        case 'S': // Server supports SSL connections, continue with a secure connection
          break
        case 'N': // Server does not support SSL connections
          self.stream.end()
          return self.emit('error', new Error('The server does not support SSL connections'))
        default:
          // Any other response byte, including 'E' (ErrorResponse) indicating a server error
          self.stream.end()
          return self.emit('error', new Error('There was an error establishing an SSL connection'))
      }
      self.upgradeToSSL(host, reportStreamError)
    })
  }

  upgradeToSSL(host, reportStreamError) {
    const self = this
    const options = {
      socket: self.stream,
    }

    if (self.ssl !== true) {
      Object.assign(options, self.ssl)

      if ('key' in self.ssl) {
        options.key = self.ssl.key
      }
    }

    // Direct SSL negotiation requires ALPN so the server can confirm it is
    // speaking the PostgreSQL protocol over the TLS connection.
    if (self.sslNegotiation === 'direct') {
      options.ALPNProtocols = ['postgresql']
    }

    const net = __webpack_require__(69278)
    if (net.isIP && net.isIP(host) === 0) {
      options.servername = host
    }
    try {
      self.stream = stream.getSecureStream(options)
    } catch (err) {
      return self.emit('error', err)
    }
    self.attachListeners(self.stream)
    self.stream.on('error', reportStreamError)

    self.emit('sslconnect')
  }

  attachListeners(stream) {
    parse(stream, (msg) => {
      const eventName = msg.name === 'error' ? 'errorMessage' : msg.name
      if (this._emitMessage) {
        this.emit('message', msg)
      }
      this.emit(eventName, msg)
    })
  }

  requestSsl() {
    this.stream.write(serialize.requestSsl())
  }

  startup(config) {
    this.stream.write(serialize.startup(config))
  }

  cancel(processID, secretKey) {
    this._send(serialize.cancel(processID, secretKey))
  }

  password(password) {
    this._send(serialize.password(password))
  }

  sendSASLInitialResponseMessage(mechanism, initialResponse) {
    this._send(serialize.sendSASLInitialResponseMessage(mechanism, initialResponse))
  }

  sendSCRAMClientFinalMessage(additionalData) {
    this._send(serialize.sendSCRAMClientFinalMessage(additionalData))
  }

  _send(buffer) {
    if (!this.stream.writable) {
      return false
    }
    return this.stream.write(buffer)
  }

  query(text) {
    this._send(serialize.query(text))
  }

  // send parse message
  parse(query) {
    this._send(serialize.parse(query))
  }

  // send bind message
  bind(config) {
    this._send(serialize.bind(config))
  }

  // send execute message
  execute(config) {
    this._send(serialize.execute(config))
  }

  flush() {
    if (this.stream.writable) {
      this.stream.write(flushBuffer)
    }
  }

  sync() {
    this._ending = true
    this._send(syncBuffer)
  }

  ref() {
    this.stream.ref()
  }

  unref() {
    this.stream.unref()
  }

  end() {
    // 0x58 = 'X'
    this._ending = true
    if (!this._connecting || !this.stream.writable) {
      this.stream.end()
      return
    }
    return this.stream.write(endBuffer, () => {
      this.stream.end()
    })
  }

  close(msg) {
    this._send(serialize.close(msg))
  }

  describe(msg) {
    this._send(serialize.describe(msg))
  }

  sendCopyFromChunk(chunk) {
    this._send(serialize.copyData(chunk))
  }

  endCopyFrom() {
    this._send(serialize.copyDone())
  }

  sendCopyFail(msg) {
    this._send(serialize.copyFail(msg))
  }
}

module.exports = Connection


/***/ }),

/***/ 25550:
/***/ ((module) => {

function x509Error(msg, cert) {
  return new Error('SASL channel binding: ' + msg + ' when parsing public certificate ' + cert.toString('base64'))
}

function readASN1Length(data, index) {
  let length = data[index++]
  if (length < 0x80) return { length, index }

  const lengthBytes = length & 0x7f
  if (lengthBytes > 4) throw x509Error('bad length', data)

  length = 0
  for (let i = 0; i < lengthBytes; i++) {
    length = (length << 8) | data[index++]
  }

  return { length, index }
}

function readASN1OID(data, index) {
  if (data[index++] !== 0x6) throw x509Error('non-OID data', data) // 6 = OID

  const { length: OIDLength, index: indexAfterOIDLength } = readASN1Length(data, index)
  index = indexAfterOIDLength
  const lastIndex = index + OIDLength

  const byte1 = data[index++]
  let oid = ((byte1 / 40) >> 0) + '.' + (byte1 % 40)

  while (index < lastIndex) {
    // loop over numbers in OID
    let value = 0
    while (index < lastIndex) {
      // loop over bytes in number
      const nextByte = data[index++]
      value = (value << 7) | (nextByte & 0x7f)
      if (nextByte < 0x80) break
    }
    oid += '.' + value
  }

  return { oid, index }
}

function expectASN1Seq(data, index) {
  if (data[index++] !== 0x30) throw x509Error('non-sequence data', data) // 30 = Sequence
  return readASN1Length(data, index)
}

function signatureAlgorithmHashFromCertificate(data, index) {
  // read this thread: https://www.postgresql.org/message-id/17760-b6c61e752ec07060%40postgresql.org
  if (index === undefined) index = 0
  index = expectASN1Seq(data, index).index
  const { length: certInfoLength, index: indexAfterCertInfoLength } = expectASN1Seq(data, index)
  index = indexAfterCertInfoLength + certInfoLength // skip over certificate info
  index = expectASN1Seq(data, index).index // skip over signature length field
  const { oid, index: indexAfterOID } = readASN1OID(data, index)
  switch (oid) {
    // RSA
    case '1.2.840.113549.1.1.4':
      return 'MD5'
    case '1.2.840.113549.1.1.5':
      return 'SHA-1'
    case '1.2.840.113549.1.1.11':
      return 'SHA-256'
    case '1.2.840.113549.1.1.12':
      return 'SHA-384'
    case '1.2.840.113549.1.1.13':
      return 'SHA-512'
    case '1.2.840.113549.1.1.14':
      return 'SHA-224'
    case '1.2.840.113549.1.1.15':
      return 'SHA512-224'
    case '1.2.840.113549.1.1.16':
      return 'SHA512-256'
    // ECDSA
    case '1.2.840.10045.4.1':
      return 'SHA-1'
    case '1.2.840.10045.4.3.1':
      return 'SHA-224'
    case '1.2.840.10045.4.3.2':
      return 'SHA-256'
    case '1.2.840.10045.4.3.3':
      return 'SHA-384'
    case '1.2.840.10045.4.3.4':
      return 'SHA-512'
    // RSASSA-PSS: hash is indicated separately
    case '1.2.840.113549.1.1.10': {
      index = indexAfterOID
      index = expectASN1Seq(data, index).index
      if (data[index++] !== 0xa0) throw x509Error('non-tag data', data) // a0 = constructed tag 0
      index = readASN1Length(data, index).index // skip over tag length field
      index = expectASN1Seq(data, index).index // skip over sequence length field
      const { oid: hashOID } = readASN1OID(data, index)
      switch (hashOID) {
        // standalone hash OIDs
        case '1.2.840.113549.2.5':
          return 'MD5'
        case '1.3.14.3.2.26':
          return 'SHA-1'
        case '2.16.840.1.101.3.4.2.1':
          return 'SHA-256'
        case '2.16.840.1.101.3.4.2.2':
          return 'SHA-384'
        case '2.16.840.1.101.3.4.2.3':
          return 'SHA-512'
      }
      throw x509Error('unknown hash OID ' + hashOID, data)
    }
    // Ed25519 -- see https: return//github.com/openssl/openssl/issues/15477
    case '1.3.101.110':
    case '1.3.101.112': // ph
      return 'SHA-512'
    // Ed448 -- still not in pg 17.2 (if supported, digest would be SHAKE256 x 64 bytes)
    case '1.3.101.111':
    case '1.3.101.113': // ph
      throw x509Error('Ed448 certificate channel binding is not currently supported by Postgres')
  }
  throw x509Error('unknown OID ' + oid, data)
}

module.exports = { signatureAlgorithmHashFromCertificate }


/***/ }),

/***/ 34669:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


const crypto = __webpack_require__(7365)
const { signatureAlgorithmHashFromCertificate } = __webpack_require__(25550)

// SASLprep (RFC 4013) — minimal in-tree implementation.
//
// Per RFC 5802 §2.2, the SCRAM-SHA-256 client must normalize the password via
// SASLprep before feeding it into PBKDF2. PostgreSQL's server applies the same
// SASLprep when computing the stored verifier, and libpq does the same client
// side, so passwords whose NFKC form differs from the raw form
// would otherwise authenticate against psql/libpq but fail against pg with `28P01`.
//
// We deliberately implement only the three steps that change the byte content:
//   1. RFC 3454 Table C.1.2 (non-ASCII space) → U+0020 SPACE.
//   2. RFC 3454 Table B.1 (commonly mapped to nothing) → empty.
//   3. NFKC normalization.
// We skip the prohibition (RFC 4013 §2.3) and bidi (RFC 3454 §6) checks.
// libpq is forgiving on those paths and Postgres's own SASLprep matches that
// leniency for legacy roles, so omitting the rejection logic keeps existing
// roles working without adding complexity.
function saslprep(password) {
  // RFC 3454 Table C.1.2 — non-ASCII space characters, mapped to U+0020.
  const nonAsciiSpace = /[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000]/g
  // RFC 3454 Table B.1 — "commonly mapped to nothing". The set intentionally
  // contains zero-width joiners and variation selectors — the very characters
  // ESLint's no-misleading-character-class warns about — because they combine
  // with their neighbors and the RFC strips them for that reason.
  // eslint-disable-next-line no-misleading-character-class
  const mappedToNothing = /[\u00AD\u034F\u1806\u180B\u180C\u180D\u200C\u200D\u2060\uFE00-\uFE0F\uFEFF]/g
  return password.replace(nonAsciiSpace, ' ').replace(mappedToNothing, '').normalize('NFKC')
}

const DEFAULT_MAX_SCRAM_ITERATIONS = 100000

function startSession(mechanisms, stream, scramMaxIterations = DEFAULT_MAX_SCRAM_ITERATIONS) {
  const candidates = ['SCRAM-SHA-256']
  if (stream) candidates.unshift('SCRAM-SHA-256-PLUS') // higher-priority, so placed first

  const mechanism = candidates.find((candidate) => mechanisms.includes(candidate))

  if (!mechanism) {
    throw new Error('SASL: Only mechanism(s) ' + candidates.join(' and ') + ' are supported')
  }

  if (mechanism === 'SCRAM-SHA-256-PLUS' && typeof stream.getPeerCertificate !== 'function') {
    // this should never happen if we are really talking to a Postgres server
    throw new Error('SASL: Mechanism SCRAM-SHA-256-PLUS requires a certificate')
  }

  const clientNonce = crypto.randomBytes(18).toString('base64')
  const gs2Header = mechanism === 'SCRAM-SHA-256-PLUS' ? 'p=tls-server-end-point' : stream ? 'y' : 'n'

  return {
    mechanism,
    clientNonce,
    response: gs2Header + ',,n=*,r=' + clientNonce,
    message: 'SASLInitialResponse',
    scramMaxIterations,
  }
}

async function continueSession(session, password, serverData, stream) {
  if (session.message !== 'SASLInitialResponse') {
    throw new Error('SASL: Last message was not SASLInitialResponse')
  }
  if (typeof password !== 'string') {
    throw new Error('SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string')
  }
  if (password === '') {
    throw new Error('SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a non-empty string')
  }
  if (typeof serverData !== 'string') {
    throw new Error('SASL: SCRAM-SERVER-FIRST-MESSAGE: serverData must be a string')
  }

  const sv = parseServerFirstMessage(serverData)

  if (!sv.nonce.startsWith(session.clientNonce)) {
    throw new Error('SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce does not start with client nonce')
  } else if (sv.nonce.length === session.clientNonce.length) {
    throw new Error('SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce is too short')
  }

  const scramMaxIterations =
    typeof session.scramMaxIterations === 'number' ? session.scramMaxIterations : DEFAULT_MAX_SCRAM_ITERATIONS
  // a value of 0 disables the iteration count check
  if (scramMaxIterations !== 0 && sv.iteration > scramMaxIterations) {
    throw new Error(
      'SASL: SCRAM-SERVER-FIRST-MESSAGE: iteration count ' +
        sv.iteration +
        ' exceeds scramMaxIterations of ' +
        scramMaxIterations
    )
  }

  const clientFirstMessageBare = 'n=*,r=' + session.clientNonce
  const serverFirstMessage = 'r=' + sv.nonce + ',s=' + sv.salt + ',i=' + sv.iteration

  // without channel binding:
  let channelBinding = stream ? 'eSws' : 'biws' // 'y,,' or 'n,,', base64-encoded

  // override if channel binding is in use:
  if (session.mechanism === 'SCRAM-SHA-256-PLUS') {
    const peerCert = stream.getPeerCertificate().raw
    let hashName = signatureAlgorithmHashFromCertificate(peerCert)
    if (hashName === 'MD5' || hashName === 'SHA-1') hashName = 'SHA-256'
    const certHash = await crypto.hashByName(hashName, peerCert)
    const bindingData = Buffer.concat([Buffer.from('p=tls-server-end-point,,'), Buffer.from(certHash)])
    channelBinding = bindingData.toString('base64')
  }

  const clientFinalMessageWithoutProof = 'c=' + channelBinding + ',r=' + sv.nonce
  const authMessage = clientFirstMessageBare + ',' + serverFirstMessage + ',' + clientFinalMessageWithoutProof

  const saltBytes = Buffer.from(sv.salt, 'base64')
  const saltedPassword = await crypto.deriveKey(saslprep(password), saltBytes, sv.iteration)
  const clientKey = await crypto.hmacSha256(saltedPassword, 'Client Key')
  const storedKey = await crypto.sha256(clientKey)
  const clientSignature = await crypto.hmacSha256(storedKey, authMessage)
  const clientProof = xorBuffers(Buffer.from(clientKey), Buffer.from(clientSignature)).toString('base64')
  const serverKey = await crypto.hmacSha256(saltedPassword, 'Server Key')
  const serverSignatureBytes = await crypto.hmacSha256(serverKey, authMessage)

  session.message = 'SASLResponse'
  session.serverSignature = Buffer.from(serverSignatureBytes).toString('base64')
  session.response = clientFinalMessageWithoutProof + ',p=' + clientProof
}

function finalizeSession(session, serverData) {
  if (session.message !== 'SASLResponse') {
    throw new Error('SASL: Last message was not SASLResponse')
  }
  if (typeof serverData !== 'string') {
    throw new Error('SASL: SCRAM-SERVER-FINAL-MESSAGE: serverData must be a string')
  }

  const { serverSignature } = parseServerFinalMessage(serverData)

  if (serverSignature !== session.serverSignature) {
    throw new Error('SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature does not match')
  }
}

/**
 * printable       = %x21-2B / %x2D-7E
 *                   ;; Printable ASCII except ",".
 *                   ;; Note that any "printable" is also
 *                   ;; a valid "value".
 */
function isPrintableChars(text) {
  if (typeof text !== 'string') {
    throw new TypeError('SASL: text must be a string')
  }
  return text
    .split('')
    .map((_, i) => text.charCodeAt(i))
    .every((c) => (c >= 0x21 && c <= 0x2b) || (c >= 0x2d && c <= 0x7e))
}

/**
 * base64-char     = ALPHA / DIGIT / "/" / "+"
 *
 * base64-4        = 4base64-char
 *
 * base64-3        = 3base64-char "="
 *
 * base64-2        = 2base64-char "=="
 *
 * base64          = *base64-4 [base64-3 / base64-2]
 */
function isBase64(text) {
  return /^(?:[a-zA-Z0-9+/]{4})*(?:[a-zA-Z0-9+/]{2}==|[a-zA-Z0-9+/]{3}=)?$/.test(text)
}

function parseAttributePairs(text) {
  if (typeof text !== 'string') {
    throw new TypeError('SASL: attribute pairs text must be a string')
  }

  return new Map(
    text.split(',').map((attrValue) => {
      if (!/^.=/.test(attrValue)) {
        throw new Error('SASL: Invalid attribute pair entry')
      }
      const name = attrValue[0]
      const value = attrValue.substring(2)
      return [name, value]
    })
  )
}

function parseServerFirstMessage(data) {
  const attrPairs = parseAttributePairs(data)

  const nonce = attrPairs.get('r')
  if (!nonce) {
    throw new Error('SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce missing')
  } else if (!isPrintableChars(nonce)) {
    throw new Error('SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce must only contain printable characters')
  }
  const salt = attrPairs.get('s')
  if (!salt) {
    throw new Error('SASL: SCRAM-SERVER-FIRST-MESSAGE: salt missing')
  } else if (!isBase64(salt)) {
    throw new Error('SASL: SCRAM-SERVER-FIRST-MESSAGE: salt must be base64')
  }
  const iterationText = attrPairs.get('i')
  if (!iterationText) {
    throw new Error('SASL: SCRAM-SERVER-FIRST-MESSAGE: iteration missing')
  } else if (!/^[1-9][0-9]*$/.test(iterationText)) {
    throw new Error('SASL: SCRAM-SERVER-FIRST-MESSAGE: invalid iteration count')
  }
  const iteration = parseInt(iterationText, 10)

  return {
    nonce,
    salt,
    iteration,
  }
}

function parseServerFinalMessage(serverData) {
  const attrPairs = parseAttributePairs(serverData)
  const error = attrPairs.get('e')
  const serverSignature = attrPairs.get('v')

  if (error) {
    throw new Error(`SASL: SCRAM-SERVER-FINAL-MESSAGE: server returned error: "${error}"`)
  }

  if (!serverSignature) {
    throw new Error('SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature is missing')
  } else if (!isBase64(serverSignature)) {
    throw new Error('SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature must be base64')
  }
  return {
    serverSignature,
  }
}

function xorBuffers(a, b) {
  if (!Buffer.isBuffer(a)) {
    throw new TypeError('first argument must be a Buffer')
  }
  if (!Buffer.isBuffer(b)) {
    throw new TypeError('second argument must be a Buffer')
  }
  if (a.length !== b.length) {
    throw new Error('Buffer lengths must match')
  }
  if (a.length === 0) {
    throw new Error('Buffers cannot be empty')
  }
  return Buffer.from(a.map((_, i) => a[i] ^ b[i]))
}

module.exports = {
  startSession,
  continueSession,
  finalizeSession,
  DEFAULT_MAX_SCRAM_ITERATIONS,
}


/***/ }),

/***/ 7365:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const nodeCrypto = __webpack_require__(76982)

module.exports = {
  postgresMd5PasswordHash,
  randomBytes,
  deriveKey,
  sha256,
  hashByName,
  hmacSha256,
  md5,
}

/**
 * The Web Crypto API - grabbed from the Node.js library or the global
 * @type Crypto
 */
// eslint-disable-next-line no-undef
const webCrypto = nodeCrypto.webcrypto || globalThis.crypto
/**
 * The SubtleCrypto API for low level crypto operations.
 * @type SubtleCrypto
 */
const subtleCrypto = webCrypto.subtle
const textEncoder = new TextEncoder()

/**
 *
 * @param {*} length
 * @returns
 */
function randomBytes(length) {
  return webCrypto.getRandomValues(Buffer.alloc(length))
}

async function md5(string) {
  try {
    return nodeCrypto.createHash('md5').update(string, 'utf-8').digest('hex')
  } catch (e) {
    // `createHash()` failed so we are probably not in Node.js, use the WebCrypto API instead.
    // Note that the MD5 algorithm on WebCrypto is not available in Node.js.
    // This is why we cannot just use WebCrypto in all environments.
    const data = typeof string === 'string' ? textEncoder.encode(string) : string
    const hash = await subtleCrypto.digest('MD5', data)
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }
}

// See AuthenticationMD5Password at https://www.postgresql.org/docs/current/static/protocol-flow.html
async function postgresMd5PasswordHash(user, password, salt) {
  const inner = await md5(password + user)
  const outer = await md5(Buffer.concat([Buffer.from(inner), salt]))
  return 'md5' + outer
}

/**
 * Create a SHA-256 digest of the given data
 * @param {Buffer} data
 */
async function sha256(text) {
  return await subtleCrypto.digest('SHA-256', text)
}

async function hashByName(hashName, text) {
  return await subtleCrypto.digest(hashName, text)
}

/**
 * Sign the message with the given key
 * @param {ArrayBuffer} keyBuffer
 * @param {string} msg
 */
async function hmacSha256(keyBuffer, msg) {
  const key = await subtleCrypto.importKey('raw', keyBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return await subtleCrypto.sign('HMAC', key, textEncoder.encode(msg))
}

/**
 * Derive a key from the password and salt
 * @param {string} password
 * @param {Uint8Array} salt
 * @param {number} iterations
 */
async function deriveKey(password, salt, iterations) {
  const key = await subtleCrypto.importKey('raw', textEncoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const params = { name: 'PBKDF2', hash: 'SHA-256', salt: salt, iterations: iterations }
  return await subtleCrypto.deriveBits(params, key, 32 * 8, ['deriveBits'])
}


/***/ }),

/***/ 71528:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



let user
try {
  user = process.platform === 'win32' ? process.env.USERNAME : process.env.USER
} catch {
  // ignore, e.g., Deno without --allow-env
}

module.exports = {
  // database host. defaults to localhost
  host: 'localhost',

  // database user's name
  user,

  // name of database to connect
  database: undefined,

  // database user's password
  password: null,

  // a Postgres connection string to be used instead of setting individual connection items
  // NOTE:  Setting this value will cause it to override any other value (such as database or user) defined
  // in the defaults object.
  connectionString: undefined,

  // database port
  port: 5432,

  // number of rows to return at a time from a prepared statement's
  // portal. 0 will return all rows at once
  rows: 0,

  // binary result mode
  binary: false,

  // Connection pool options - see https://github.com/brianc/node-pg-pool

  // number of connections to use in connection pool
  // 0 will disable connection pooling
  max: 10,

  // max milliseconds a client can go unused before it is removed
  // from the pool and destroyed
  idleTimeoutMillis: 30000,

  client_encoding: '',

  ssl: false,

  // SSL negotiation style: 'postgres' (traditional SSLRequest) or 'direct'
  sslnegotiation: undefined,

  application_name: undefined,

  fallback_application_name: undefined,

  options: undefined,

  parseInputDatesAsUTC: false,

  // max milliseconds any query using this connection will execute for before timing out in error.
  // false=unlimited
  statement_timeout: false,

  // Abort any statement that waits longer than the specified duration in milliseconds while attempting to acquire a lock.
  // false=unlimited
  lock_timeout: false,

  // Terminate any session with an open transaction that has been idle for longer than the specified duration in milliseconds
  // false=unlimited
  idle_in_transaction_session_timeout: false,

  // max milliseconds to wait for query to complete (client side)
  query_timeout: false,

  connect_timeout: 0,

  keepalives: 1,

  keepalives_idle: 0,
}

const pgTypes = __webpack_require__(67759)
// save default parsers
const parseBigInteger = pgTypes.getTypeParser(20, 'text')
const parseBigIntegerArray = pgTypes.getTypeParser(1016, 'text')

// parse int8 so you can get your count values as actual numbers
module.exports.__defineSetter__('parseInt8', function (val) {
  pgTypes.setTypeParser(20, 'text', val ? pgTypes.getTypeParser(23, 'text') : parseBigInteger)
  pgTypes.setTypeParser(1016, 'text', val ? pgTypes.getTypeParser(1007, 'text') : parseBigIntegerArray)
})


/***/ }),

/***/ 62372:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



const Client = __webpack_require__(89853)
const defaults = __webpack_require__(71528)
const Connection = __webpack_require__(60726)
const Result = __webpack_require__(53055)
const utils = __webpack_require__(52269)
const Pool = __webpack_require__(57490)
const TypeOverrides = __webpack_require__(16662)
const { DatabaseError } = __webpack_require__(72428)
const { escapeIdentifier, escapeLiteral } = __webpack_require__(52269)

const poolFactory = (Client) => {
  return class BoundPool extends Pool {
    constructor(options) {
      super(options, Client)
    }
  }
}

const PG = function (clientConstructor) {
  this.defaults = defaults
  this.Client = clientConstructor
  this.Query = this.Client.Query
  this.Pool = poolFactory(this.Client)
  this._pools = []
  this.Connection = Connection
  this.types = __webpack_require__(67759)
  this.DatabaseError = DatabaseError
  this.TypeOverrides = TypeOverrides
  this.escapeIdentifier = escapeIdentifier
  this.escapeLiteral = escapeLiteral
  this.Result = Result
  this.utils = utils
}

let clientConstructor = Client

let forceNative = false
try {
  forceNative = !!process.env.NODE_PG_FORCE_NATIVE
} catch {
  // ignore, e.g., Deno without --allow-env
}

if (forceNative) {
  clientConstructor = __webpack_require__(75594)
}

module.exports = new PG(clientConstructor)

// lazy require native module...the native module may not have installed
Object.defineProperty(module.exports, "native", ({
  configurable: true,
  enumerable: false,
  get() {
    let native = null
    try {
      native = new PG(__webpack_require__(75594))
    } catch (err) {
      if (err.code !== 'MODULE_NOT_FOUND') {
        throw err
      }
    }

    // overwrite module.exports.native so that getter is never called again
    Object.defineProperty(module.exports, "native", ({
      value: native,
    }))

    return native
  },
}))


/***/ }),

/***/ 75859:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const nodeUtils = __webpack_require__(39023)
// eslint-disable-next-line
var Native
// eslint-disable-next-line no-useless-catch
try {
  // Wrap this `require()` in a try-catch to avoid upstream bundlers from complaining that this might not be available since it is an optional import
  Native = __webpack_require__(23110)
} catch (e) {
  throw e
}
const TypeOverrides = __webpack_require__(16662)
const EventEmitter = (__webpack_require__(24434).EventEmitter)
const util = __webpack_require__(39023)
const ConnectionParameters = __webpack_require__(67731)

const NativeQuery = __webpack_require__(71626)

const queryQueueLengthDeprecationNotice = nodeUtils.deprecate(
  () => {},
  'Calling client.query() when the client is already executing a query is deprecated and will be removed in pg@9.0. Use async/await or an external async flow control mechanism instead.'
)

const Client = (module.exports = function (config) {
  EventEmitter.call(this)
  config = config || {}

  this._Promise = config.Promise || global.Promise
  this._types = new TypeOverrides(config.types)

  this.native = new Native({
    types: this._types,
  })

  this._queryQueue = []
  this._ending = false
  this._connecting = false
  this._connected = false
  this._queryable = true
  this.pipeline = Boolean(config.pipeline)
  this._pipelineInFlight = false

  // keep these on the object for legacy reasons
  // for the time being. TODO: deprecate all this jazz
  const cp = (this.connectionParameters = new ConnectionParameters(config))
  if (config.nativeConnectionString) cp.nativeConnectionString = config.nativeConnectionString
  this.user = cp.user

  // "hiding" the password so it doesn't show up in stack traces
  // or if the client is console.logged
  Object.defineProperty(this, 'password', {
    configurable: true,
    enumerable: false,
    writable: true,
    value: cp.password,
  })
  this.database = cp.database
  this.host = cp.host
  this.port = cp.port

  // a hash to hold named queries
  this.namedQueries = {}
})

Client.Query = NativeQuery

util.inherits(Client, EventEmitter)

Client.prototype._errorAllQueries = function (err) {
  const enqueueError = (query) => {
    process.nextTick(() => {
      query.native = this.native
      query.handleError(err)
    })
  }

  if (this._hasActiveQuery()) {
    enqueueError(this._activeQuery)
    this._activeQuery = null
  }

  this._queryQueue.forEach(enqueueError)
  this._queryQueue.length = 0
}

// connect to the backend
// pass an optional callback to be called once connected
// or with an error if there was a connection error
Client.prototype._connect = function (cb) {
  const self = this

  if (this._connecting) {
    process.nextTick(() => cb(new Error('Client has already been connected. You cannot reuse a client.')))
    return
  }

  this._connecting = true

  this.connectionParameters.getLibpqConnectionString(function (err, conString) {
    if (self.connectionParameters.nativeConnectionString) conString = self.connectionParameters.nativeConnectionString
    if (err) return cb(err)
    self.native.connect(conString, function (err) {
      if (err) {
        self.native.end()
        return cb(err)
      }

      // set internal states to connected
      self._connected = true

      // handle connection errors from the native layer
      self.native.on('error', function (err) {
        self._queryable = false
        self._errorAllQueries(err)
        self.emit('error', err)
      })

      self.native.on('notification', function (msg) {
        self.emit('notification', {
          channel: msg.relname,
          payload: msg.extra,
        })
      })

      // signal we are connected now
      self.emit('connect')
      self._pulseQueryQueue(true)

      cb(null, this)
    })
  })
}

Client.prototype.connect = function (callback) {
  if (callback) {
    this._connect(callback)
    return
  }

  return new this._Promise((resolve, reject) => {
    this._connect((error) => {
      if (error) {
        reject(error)
      } else {
        resolve(this)
      }
    })
  })
}

// send a query to the server
// this method is highly overloaded to take
// 1) string query, optional array of parameters, optional function callback
// 2) object query with {
//    string query
//    optional array values,
//    optional function callback instead of as a separate parameter
//    optional string name to name & cache the query plan
//    optional string rowMode = 'array' for an array of results
//  }
Client.prototype.query = function (config, values, callback) {
  let query
  let result
  let readTimeout
  let readTimeoutTimer
  let queryCallback

  if (config === null || config === undefined) {
    throw new TypeError('Client was passed a null or undefined query')
  } else if (typeof config.submit === 'function') {
    readTimeout = config.query_timeout || this.connectionParameters.query_timeout
    result = query = config
    // accept query(new Query(...), (err, res) => { }) style
    if (typeof values === 'function') {
      config.callback = values
    }
  } else {
    readTimeout = config.query_timeout || this.connectionParameters.query_timeout
    query = new NativeQuery(config, values, callback)
    if (!query.callback) {
      let resolveOut, rejectOut
      result = new this._Promise((resolve, reject) => {
        resolveOut = resolve
        rejectOut = reject
      }).catch((err) => {
        Error.captureStackTrace(err)
        throw err
      })
      query.callback = (err, res) => (err ? rejectOut(err) : resolveOut(res))
    }
  }

  if (readTimeout) {
    queryCallback = query.callback || (() => {})

    readTimeoutTimer = setTimeout(() => {
      const error = new Error('Query read timeout')

      process.nextTick(() => {
        query.handleError(error, this.connection)
      })

      queryCallback(error)

      // we already returned an error,
      // just do nothing if query completes
      query.callback = () => {}

      // Remove from queue
      const index = this._queryQueue.indexOf(query)
      if (index > -1) {
        this._queryQueue.splice(index, 1)
      }

      this._pulseQueryQueue()
    }, readTimeout)

    query.callback = (err, res) => {
      clearTimeout(readTimeoutTimer)
      queryCallback(err, res)
    }
  }

  if (!this._queryable) {
    query.native = this.native
    process.nextTick(() => {
      query.handleError(new Error('Client has encountered a connection error and is not queryable'))
    })
    return result
  }

  if (this._ending) {
    query.native = this.native
    process.nextTick(() => {
      query.handleError(new Error('Client was closed and is not queryable'))
    })
    return result
  }

  if (this._queryQueue.length > 0 && !this.pipeline) {
    queryQueueLengthDeprecationNotice()
  }

  this._queryQueue.push(query)
  this._pulseQueryQueue()
  return result
}

// disconnect from the backend server
Client.prototype.end = function (cb) {
  const self = this

  this._ending = true

  if (this._connecting && !this._connected) {
    this.once('connect', () => {
      this.end(() => {})
    })
  }
  let result
  if (!cb) {
    result = new this._Promise(function (resolve, reject) {
      cb = (err) => (err ? reject(err) : resolve())
    })
  }

  const doEnd = function () {
    self.native.end(function () {
      self._connected = false

      self._errorAllQueries(new Error('Connection terminated'))

      process.nextTick(() => {
        self.emit('end')
        if (cb) cb()
      })
    })
  }

  // If pipeline has in-flight or queued queries, wait for them to drain before closing
  if (this.pipeline && (this._pipelineInFlight || this._queryQueue.length > 0)) {
    this.once('drain', doEnd)
  } else {
    doEnd()
  }
  return result
}

Client.prototype._hasActiveQuery = function () {
  return this._activeQuery && this._activeQuery.state !== 'error' && this._activeQuery.state !== 'end'
}

Client.prototype._pulseQueryQueue = function (initialConnection) {
  if (!this._connected) {
    return
  }
  if (this.pipeline && !initialConnection) {
    return this._pulsePipelinedQueryQueue()
  }
  if (this._hasActiveQuery()) {
    return
  }
  const query = this._queryQueue.shift()
  if (!query) {
    if (!initialConnection) {
      this.emit('drain')
    }
    return
  }
  this._activeQuery = query
  query.submit(this)
  const self = this
  query.once('_done', function () {
    self._pulseQueryQueue()
  })
}

Client.prototype._pulsePipelinedQueryQueue = function () {
  if (!this._connected || this._pipelineInFlight) {
    return
  }
  if (this._queryQueue.length === 0) {
    if (this.hasExecuted) {
      this.emit('drain')
    }
    return
  }

  this._pipelineInFlight = true
  const self = this
  const queries = []
  const nativeQueries = []
  const utils = __webpack_require__(52269)

  while (this._queryQueue.length > 0) {
    const query = this._queryQueue.shift()
    this.hasExecuted = true
    nativeQueries.push(query)

    const values = query.values ? query.values.map(utils.prepareValue) : null
    const pipelineEntry = { text: query.text, name: query.name }
    if (values) {
      pipelineEntry.values = values
    }
    if (query.name && this.namedQueries[query.name]) {
      pipelineEntry._alreadyPrepared = true
    }
    queries.push(pipelineEntry)
  }

  this.native.pipeline(queries, function (err, results) {
    self._pipelineInFlight = false

    if (err) {
      // Total pipeline failure — error all queries
      for (let i = 0; i < nativeQueries.length; i++) {
        const q = nativeQueries[i]
        q.native = self.native
        q.handleError(err)
      }
      self._pulsePipelinedQueryQueue()
      return
    }

    // Deliver results to each query
    for (let i = 0; i < nativeQueries.length; i++) {
      const q = nativeQueries[i]
      const r = results[i]
      q.native = self.native

      if (r.err) {
        q.handleError(r.err)
      } else {
        // Track named queries on success
        if (q.name) {
          self.namedQueries[q.name] = q.text
        }
        q.state = 'end'
        q.emit('end', r.result)
        if (q.callback) {
          q.callback(null, r.result)
        }
      }

      setImmediate(function () {
        q.emit('_done')
      })
    }

    // Process any queries that arrived while we were reading
    self._pulsePipelinedQueryQueue()
  })
}

// attempt to cancel an in-progress query
Client.prototype.cancel = function (query) {
  if (this._activeQuery === query) {
    this.native.cancel(function () {})
  } else if (this._queryQueue.indexOf(query) !== -1) {
    this._queryQueue.splice(this._queryQueue.indexOf(query), 1)
  }
}

Client.prototype.ref = function () {}
Client.prototype.unref = function () {}

Client.prototype.setTypeParser = function (oid, format, parseFn) {
  return this._types.setTypeParser(oid, format, parseFn)
}

Client.prototype.getTypeParser = function (oid, format) {
  return this._types.getTypeParser(oid, format)
}

Client.prototype.isConnected = function () {
  return this._connected
}

Client.prototype.getTransactionStatus = function () {
  return this.native.getTransactionStatus()
}


/***/ }),

/***/ 75594:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


module.exports = __webpack_require__(75859)


/***/ }),

/***/ 71626:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



const EventEmitter = (__webpack_require__(24434).EventEmitter)
const util = __webpack_require__(39023)
const utils = __webpack_require__(52269)

const NativeQuery = (module.exports = function (config, values, callback) {
  EventEmitter.call(this)
  config = utils.normalizeQueryConfig(config, values, callback)
  this.text = config.text
  this.values = config.values
  this.name = config.name
  this.queryMode = config.queryMode
  this.callback = config.callback
  this.state = 'new'
  this._arrayMode = config.rowMode === 'array'

  // if the 'row' event is listened for
  // then emit them as they come in
  // without setting singleRowMode to true
  // this has almost no meaning because libpq
  // reads all rows into memory before returning any
  this._emitRowEvents = false
  this.on(
    'newListener',
    function (event) {
      if (event === 'row') this._emitRowEvents = true
    }.bind(this)
  )
})

util.inherits(NativeQuery, EventEmitter)

const errorFieldMap = {
  sqlState: 'code',
  statementPosition: 'position',
  messagePrimary: 'message',
  context: 'where',
  schemaName: 'schema',
  tableName: 'table',
  columnName: 'column',
  dataTypeName: 'dataType',
  constraintName: 'constraint',
  sourceFile: 'file',
  sourceLine: 'line',
  sourceFunction: 'routine',
}

NativeQuery.prototype.handleError = function (err) {
  // copy pq error fields into the error object
  const fields = this.native && this.native.pq.resultErrorFields()
  if (fields) {
    for (const key in fields) {
      const normalizedFieldName = errorFieldMap[key] || key
      err[normalizedFieldName] = fields[key]
    }
  }
  if (this.callback) {
    this.callback(err)
  } else {
    this.emit('error', err)
  }
  this.state = 'error'
}

NativeQuery.prototype.then = function (onSuccess, onFailure) {
  return this._getPromise().then(onSuccess, onFailure)
}

NativeQuery.prototype.catch = function (callback) {
  return this._getPromise().catch(callback)
}

NativeQuery.prototype._getPromise = function () {
  if (this._promise) return this._promise
  this._promise = new Promise(
    function (resolve, reject) {
      this._once('end', resolve)
      this._once('error', reject)
    }.bind(this)
  )
  return this._promise
}

NativeQuery.prototype.submit = function (client) {
  this.state = 'running'
  const self = this
  this.native = client.native
  client.native.arrayMode = this._arrayMode

  let after = function (err, rows, results) {
    client.native.arrayMode = false
    setImmediate(function () {
      self.emit('_done')
    })

    // handle possible query error
    if (err) {
      return self.handleError(err)
    }

    // emit row events for each row in the result
    if (self._emitRowEvents) {
      if (results.length > 1) {
        rows.forEach((rowOfRows, i) => {
          rowOfRows.forEach((row) => {
            self.emit('row', row, results[i])
          })
        })
      } else {
        rows.forEach(function (row) {
          self.emit('row', row, results)
        })
      }
    }

    // handle successful result
    self.state = 'end'
    self.emit('end', results)
    if (self.callback) {
      self.callback(null, results)
    }
  }

  if (process.domain) {
    after = process.domain.bind(after)
  }

  // named query
  if (this.name) {
    if (this.name.length > 63) {
      console.error('Warning! Postgres only supports 63 characters for query names.')
      console.error('You supplied %s (%s)', this.name, this.name.length)
      console.error('This can cause conflicts and silent errors executing queries')
    }
    const values = (this.values || []).map(utils.prepareValue)

    // check if the client has already executed this named query
    // if so...just execute it again - skip the planning phase
    if (client.namedQueries[this.name]) {
      if (this.text && client.namedQueries[this.name] !== this.text) {
        const err = new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`)
        return after(err)
      }
      return client.native.execute(this.name, values, after)
    }
    // plan the named query the first time, then execute it
    return client.native.prepare(this.name, this.text, values.length, function (err) {
      if (err) return after(err)
      client.namedQueries[self.name] = self.text
      return self.native.execute(self.name, values, after)
    })
  } else if (this.values) {
    if (!Array.isArray(this.values)) {
      const err = new Error('Query values must be an array')
      return after(err)
    }
    const vals = this.values.map(utils.prepareValue)
    client.native.query(this.text, vals, after)
  } else if (this.queryMode === 'extended') {
    client.native.query(this.text, [], after)
  } else {
    client.native.query(this.text, after)
  }
}


/***/ }),

/***/ 69564:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



const { EventEmitter } = __webpack_require__(24434)

const Result = __webpack_require__(53055)
const utils = __webpack_require__(52269)

class Query extends EventEmitter {
  constructor(config, values, callback) {
    super()

    config = utils.normalizeQueryConfig(config, values, callback)

    this.text = config.text
    this.values = config.values
    this.rows = config.rows
    this.types = config.types
    this.name = config.name
    this.queryMode = config.queryMode
    this.binary = config.binary
    // use unique portal name each time
    this.portal = config.portal || ''
    this.callback = config.callback
    this._rowMode = config.rowMode
    if (process.domain && config.callback) {
      this.callback = process.domain.bind(config.callback)
    }
    this._result = new Result(this._rowMode, this.types)

    // potential for multiple results
    this._results = this._result
    this._canceledDueToError = false
  }

  requiresPreparation() {
    if (this.queryMode === 'extended') {
      return true
    }

    // named queries must always be prepared
    if (this.name) {
      return true
    }
    // always prepare if there are max number of rows expected per
    // portal execution
    if (this.rows) {
      return true
    }
    // don't prepare empty text queries
    if (!this.text) {
      return false
    }
    // prepare if there are values
    if (!this.values) {
      return false
    }
    return this.values.length > 0
  }

  _checkForMultirow() {
    // if we already have a result with a command property
    // then we've already executed one query in a multi-statement simple query
    // turn our results into an array of results
    if (this._result.command) {
      if (!Array.isArray(this._results)) {
        this._results = [this._result]
      }
      this._result = new Result(this._rowMode, this._result._types)
      this._results.push(this._result)
    }
  }

  // associates row metadata from the supplied
  // message with this query object
  // metadata used when parsing row results
  handleRowDescription(msg) {
    this._checkForMultirow()
    this._result.addFields(msg.fields)
    this._accumulateRows = this.callback || !this.listeners('row').length
  }

  handleDataRow(msg) {
    let row

    if (this._canceledDueToError) {
      return
    }

    try {
      row = this._result.parseRow(msg.fields)
    } catch (err) {
      this._canceledDueToError = err
      return
    }

    this.emit('row', row, this._result)
    if (this._accumulateRows) {
      this._result.addRow(row)
    }
  }

  handleCommandComplete(msg, connection) {
    this._checkForMultirow()
    this._result.addCommandComplete(msg)
    // need to sync after each command complete of a prepared statement
    // if we were using a row count which results in multiple calls to _getRows
    if (this.rows) {
      connection.sync()
    }
  }

  // if a named prepared statement is created with empty query text
  // the backend will send an emptyQuery message but *not* a command complete message
  // since we pipeline sync immediately after execute we don't need to do anything here
  // unless we have rows specified, in which case we did not pipeline the initial sync call
  handleEmptyQuery(connection) {
    if (this.rows) {
      connection.sync()
    }
  }

  handleError(err, connection) {
    // need to sync after error during a prepared statement
    if (this._canceledDueToError) {
      err = this._canceledDueToError
      this._canceledDueToError = false
    }
    // if callback supplied do not emit error event as uncaught error
    // events will bubble up to node process
    if (this.callback) {
      return this.callback(err)
    }
    this.emit('error', err)
  }

  handleReadyForQuery(con) {
    if (this._canceledDueToError) {
      return this.handleError(this._canceledDueToError, con)
    }
    if (this.callback) {
      try {
        this.callback(null, this._results)
      } catch (err) {
        process.nextTick(() => {
          throw err
        })
      }
    }
    this.emit('end', this._results)
  }

  submit(connection) {
    if (typeof this.text !== 'string' && typeof this.name !== 'string') {
      return new Error('A query must have either text or a name. Supplying neither is unsupported.')
    }
    const previous = connection.parsedStatements[this.name] || connection.submittedNamedStatements[this.name]
    if (this.text && previous && this.text !== previous) {
      return new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`)
    }
    if (this.values && !Array.isArray(this.values)) {
      return new Error('Query values must be an array')
    }
    if (this.requiresPreparation()) {
      // If we're using the extended query protocol we fire off several separate commands
      // to the backend. On some versions of node & some operating system versions
      // the network stack writes each message separately instead of buffering them together
      // causing the client & network to send more slowly. Corking & uncorking the stream
      // allows node to buffer up the messages internally before sending them all off at once.
      // note: we're checking for existence of cork/uncork because some versions of streams
      // might not have this (cloudflare?)
      connection.stream.cork && connection.stream.cork()
      try {
        this.prepare(connection)
      } finally {
        // while unlikely for this.prepare to throw, if it does & we don't uncork this stream
        // this client becomes unresponsive, so put in finally block "just in case"
        connection.stream.uncork && connection.stream.uncork()
      }
    } else {
      connection.query(this.text)
    }
    return null
  }

  hasBeenParsed(connection) {
    return this.name && (connection.parsedStatements[this.name] || connection.submittedNamedStatements[this.name])
  }

  handlePortalSuspended(connection) {
    this._getRows(connection, this.rows)
  }

  _getRows(connection, rows) {
    connection.execute({
      portal: this.portal,
      rows: rows,
    })
    // if we're not reading pages of rows send the sync command
    // to indicate the pipeline is finished
    if (!rows) {
      connection.sync()
    } else {
      // otherwise flush the call out to read more rows
      connection.flush()
    }
  }

  // http://developer.postgresql.org/pgdocs/postgres/protocol-flow.html#PROTOCOL-FLOW-EXT-QUERY
  prepare(connection) {
    // TODO refactor this poor encapsulation
    if (!this.hasBeenParsed(connection)) {
      connection.parse({
        text: this.text,
        name: this.name,
        types: this.types,
      })
      if (this.name) {
        connection.submittedNamedStatements[this.name] = this.text
      }
    }

    // because we're mapping user supplied values to
    // postgres wire protocol compatible values it could
    // throw an exception, so try/catch this section
    try {
      connection.bind({
        portal: this.portal,
        statement: this.name,
        values: this.values,
        binary: this.binary,
        valueMapper: utils.prepareValue,
      })
    } catch (err) {
      // we should close parse to avoid leaking connections
      connection.close({ type: 'S', name: this.name })
      connection.sync()

      this.handleError(err, connection)
      return
    }

    connection.describe({
      type: 'P',
      name: this.portal || '',
    })

    this._getRows(connection, this.rows)
  }

  handleCopyInResponse(connection) {
    connection.sendCopyFail('No source stream defined')
  }

  handleCopyData(msg, connection) {
    // noop
  }
}

module.exports = Query


/***/ }),

/***/ 53055:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



const types = __webpack_require__(67759)

const matchRegexp = /^([A-Za-z]+)(?: (\d+))?(?: (\d+))?/

// result object returned from query
// in the 'end' event and also
// passed as second argument to provided callback
class Result {
  constructor(rowMode, types) {
    this.command = null
    this.rowCount = null
    this.oid = null
    this.rows = []
    this.fields = []
    this._parsers = undefined
    this._types = types
    this.RowCtor = null
    this.rowAsArray = rowMode === 'array'
    if (this.rowAsArray) {
      this.parseRow = this._parseRowAsArray
    }
    this._prebuiltEmptyResultObject = null
  }

  // adds a command complete message
  addCommandComplete(msg) {
    let match
    if (msg.text) {
      // pure javascript
      match = matchRegexp.exec(msg.text)
    } else {
      // native bindings
      match = matchRegexp.exec(msg.command)
    }
    if (match) {
      this.command = match[1]
      if (match[3]) {
        // COMMAND OID ROWS
        this.oid = parseInt(match[2], 10)
        this.rowCount = parseInt(match[3], 10)
      } else if (match[2]) {
        // COMMAND ROWS
        this.rowCount = parseInt(match[2], 10)
      }
    }
  }

  _parseRowAsArray(rowData) {
    const row = new Array(rowData.length)
    for (let i = 0, len = rowData.length; i < len; i++) {
      const rawValue = rowData[i]
      if (rawValue !== null) {
        row[i] = this._parsers[i](rawValue)
      } else {
        row[i] = null
      }
    }
    return row
  }

  parseRow(rowData) {
    const row = { ...this._prebuiltEmptyResultObject }
    for (let i = 0, len = rowData.length; i < len; i++) {
      const rawValue = rowData[i]
      const field = this.fields[i].name
      if (rawValue !== null) {
        const v = this.fields[i].format === 'binary' ? Buffer.from(rawValue) : rawValue
        row[field] = this._parsers[i](v)
      } else {
        row[field] = null
      }
    }
    return row
  }

  addRow(row) {
    this.rows.push(row)
  }

  addFields(fieldDescriptions) {
    // clears field definitions
    // multiple query statements in 1 action can result in multiple sets
    // of rowDescriptions...eg: 'select NOW(); select 1::int;'
    // you need to reset the fields
    this.fields = fieldDescriptions
    if (this.fields.length) {
      this._parsers = new Array(fieldDescriptions.length)
    }

    const row = Object.create(null)

    for (let i = 0; i < fieldDescriptions.length; i++) {
      const desc = fieldDescriptions[i]
      row[desc.name] = null

      if (this._types) {
        this._parsers[i] = this._types.getTypeParser(desc.dataTypeID, desc.format || 'text')
      } else {
        this._parsers[i] = types.getTypeParser(desc.dataTypeID, desc.format || 'text')
      }
    }

    this._prebuiltEmptyResultObject = { ...row }
  }
}

module.exports = Result


/***/ }),

/***/ 62842:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const { getStream, getSecureStream } = getStreamFuncs()

module.exports = {
  /**
   * Get a socket stream compatible with the current runtime environment.
   * @returns {Duplex}
   */
  getStream,
  /**
   * Get a TLS secured socket, compatible with the current environment,
   * using the socket and other settings given in `options`.
   * @returns {Duplex}
   */
  getSecureStream,
}

/**
 * The stream functions that work in Node.js
 */
function getNodejsStreamFuncs() {
  function getStream(ssl) {
    const net = __webpack_require__(69278)
    return new net.Socket()
  }

  function getSecureStream(options) {
    const tls = __webpack_require__(64756)
    return tls.connect(options)
  }
  return {
    getStream,
    getSecureStream,
  }
}

/**
 * The stream functions that work in Cloudflare Workers
 */
function getCloudflareStreamFuncs() {
  function getStream(ssl) {
    const { CloudflareSocket } = __webpack_require__(78604)
    return new CloudflareSocket(ssl)
  }

  function getSecureStream(options) {
    options.socket.startTls(options)
    return options.socket
  }
  return {
    getStream,
    getSecureStream,
  }
}

/**
 * Are we running in a Cloudflare Worker?
 *
 * @returns true if the code is currently running inside a Cloudflare Worker.
 */
function isCloudflareRuntime() {
  // Since 2022-03-21 the `global_navigator` compatibility flag is on for Cloudflare Workers
  // which means that `navigator.userAgent` will be defined.
  // eslint-disable-next-line no-undef
  if (typeof navigator === 'object' && navigator !== null && typeof navigator.userAgent === 'string') {
    // eslint-disable-next-line no-undef
    return navigator.userAgent === 'Cloudflare-Workers'
  }
  // In case `navigator` or `navigator.userAgent` is not defined then try a more sneaky approach
  if (typeof Response === 'function') {
    const resp = new Response(null, { cf: { thing: true } })
    if (typeof resp.cf === 'object' && resp.cf !== null && resp.cf.thing) {
      return true
    }
  }
  return false
}

function getStreamFuncs() {
  if (isCloudflareRuntime()) {
    return getCloudflareStreamFuncs()
  }
  return getNodejsStreamFuncs()
}


/***/ }),

/***/ 16662:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



const types = __webpack_require__(67759)

function TypeOverrides(userTypes) {
  this._types = userTypes || types
  this.text = {}
  this.binary = {}
}

TypeOverrides.prototype.getOverrides = function (format) {
  switch (format) {
    case 'text':
      return this.text
    case 'binary':
      return this.binary
    default:
      return {}
  }
}

TypeOverrides.prototype.setTypeParser = function (oid, format, parseFn) {
  if (typeof format === 'function') {
    parseFn = format
    format = 'text'
  }
  this.getOverrides(format)[oid] = parseFn
}

TypeOverrides.prototype.getTypeParser = function (oid, format) {
  format = format || 'text'
  return this.getOverrides(format)[oid] || this._types.getTypeParser(oid, format)
}

module.exports = TypeOverrides


/***/ }),

/***/ 52269:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



const defaults = __webpack_require__(71528)

const { isDate } = __webpack_require__(98253)

function escapeElement(elementRepresentation) {
  const escaped = elementRepresentation.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

  return '"' + escaped + '"'
}

// convert a JS array to a postgres array literal
// uses comma separator so won't work for types like box that use
// a different array separator.
function arrayString(val) {
  let result = '{'
  for (let i = 0; i < val.length; i++) {
    if (i > 0) {
      result += ','
    }
    let item = val[i]
    if (item == null) {
      result += 'NULL'
    } else if (Array.isArray(item)) {
      result += arrayString(item)
    } else if (ArrayBuffer.isView(item)) {
      if (!(item instanceof Buffer)) {
        item = Buffer.from(item.buffer, item.byteOffset, item.byteLength)
      }
      result += '\\\\x' + item.toString('hex')
    } else {
      result += escapeElement(prepareValue(item))
    }
  }
  result += '}'
  return result
}

// converts values from javascript types
// to their 'raw' counterparts for use as a postgres parameter
// note: you can override this function to provide your own conversion mechanism
// for complex types, etc...
const prepareValue = function (val, seen) {
  // null and undefined are both null for postgres
  if (val == null) {
    return null
  }
  if (typeof val === 'object') {
    if (val instanceof Buffer) {
      return val
    }
    if (ArrayBuffer.isView(val)) {
      return Buffer.from(val.buffer, val.byteOffset, val.byteLength)
    }
    if (isDate(val)) {
      if (defaults.parseInputDatesAsUTC) {
        return dateToStringUTC(val)
      } else {
        return dateToString(val)
      }
    }
    if (Array.isArray(val)) {
      return arrayString(val)
    }

    return prepareObject(val, seen)
  }
  return val.toString()
}

function prepareObject(val, seen) {
  if (val && typeof val.toPostgres === 'function') {
    seen = seen || []
    if (seen.indexOf(val) !== -1) {
      throw new Error('circular reference detected while preparing "' + val + '" for query')
    }
    seen.push(val)

    return prepareValue(val.toPostgres(prepareValue), seen)
  }
  return JSON.stringify(val)
}

function dateToString(date) {
  let offset = -date.getTimezoneOffset()

  let year = date.getFullYear()
  const isBCYear = year < 1
  if (isBCYear) year = Math.abs(year) + 1 // negative years are 1 off their BC representation

  let ret =
    String(year).padStart(4, '0') +
    '-' +
    String(date.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getDate()).padStart(2, '0') +
    'T' +
    String(date.getHours()).padStart(2, '0') +
    ':' +
    String(date.getMinutes()).padStart(2, '0') +
    ':' +
    String(date.getSeconds()).padStart(2, '0') +
    '.' +
    String(date.getMilliseconds()).padStart(3, '0')

  if (offset < 0) {
    ret += '-'
    offset *= -1
  } else {
    ret += '+'
  }

  ret += String(Math.floor(offset / 60)).padStart(2, '0') + ':' + String(offset % 60).padStart(2, '0')
  if (isBCYear) ret += ' BC'
  return ret
}

function dateToStringUTC(date) {
  let year = date.getUTCFullYear()
  const isBCYear = year < 1
  if (isBCYear) year = Math.abs(year) + 1 // negative years are 1 off their BC representation

  let ret =
    String(year).padStart(4, '0') +
    '-' +
    String(date.getUTCMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getUTCDate()).padStart(2, '0') +
    'T' +
    String(date.getUTCHours()).padStart(2, '0') +
    ':' +
    String(date.getUTCMinutes()).padStart(2, '0') +
    ':' +
    String(date.getUTCSeconds()).padStart(2, '0') +
    '.' +
    String(date.getUTCMilliseconds()).padStart(3, '0')

  ret += '+00:00'
  if (isBCYear) ret += ' BC'
  return ret
}

function normalizeQueryConfig(config, values, callback) {
  // can take in strings or config objects
  config = typeof config === 'string' ? { text: config } : config
  if (values) {
    if (typeof values === 'function') {
      config.callback = values
    } else {
      config.values = values
    }
  }
  if (callback) {
    config.callback = callback
  }
  return config
}

// Ported from PostgreSQL 9.2.4 source code in src/interfaces/libpq/fe-exec.c
const escapeIdentifier = function (str) {
  return '"' + str.replace(/"/g, '""') + '"'
}

const escapeLiteral = function (str) {
  let hasBackslash = false
  let escaped = "'"

  if (str == null) {
    return "''"
  }

  if (typeof str !== 'string') {
    return "''"
  }

  for (let i = 0; i < str.length; i++) {
    const c = str[i]
    if (c === "'") {
      escaped += c + c
    } else if (c === '\\') {
      escaped += c + c
      hasBackslash = true
    } else {
      escaped += c
    }
  }

  escaped += "'"

  if (hasBackslash === true) {
    escaped = ' E' + escaped
  }

  return escaped
}

module.exports = {
  prepareValue: function prepareValueWrapper(value) {
    // this ensures that extra arguments do not get passed into prepareValue
    // by accident, eg: from calling values.map(utils.prepareValue)
    return prepareValue(value)
  },
  normalizeQueryConfig,
  escapeIdentifier,
  escapeLiteral,
}


/***/ }),

/***/ 17491:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



var path = __webpack_require__(16928)
  , Stream = (__webpack_require__(2203).Stream)
  , split = __webpack_require__(61673)
  , util = __webpack_require__(39023)
  , defaultPort = 5432
  , isWin = (process.platform === 'win32')
  , warnStream = process.stderr
;


var S_IRWXG = 56     //    00070(8)
  , S_IRWXO = 7      //    00007(8)
  , S_IFMT  = 61440  // 00170000(8)
  , S_IFREG = 32768  //  0100000(8)
;
function isRegFile(mode) {
    return ((mode & S_IFMT) == S_IFREG);
}

var fieldNames = [ 'host', 'port', 'database', 'user', 'password' ];
var nrOfFields = fieldNames.length;
var passKey = fieldNames[ nrOfFields -1 ];


function warn() {
    var isWritable = (
        warnStream instanceof Stream &&
          true === warnStream.writable
    );

    if (isWritable) {
        var args = Array.prototype.slice.call(arguments).concat("\n");
        warnStream.write( util.format.apply(util, args) );
    }
}


Object.defineProperty(module.exports, "isWin", ({
    get : function() {
        return isWin;
    } ,
    set : function(val) {
        isWin = val;
    }
}));


module.exports.warnTo = function(stream) {
    var old = warnStream;
    warnStream = stream;
    return old;
};

module.exports.getFileName = function(rawEnv){
    var env = rawEnv || process.env;
    var file = env.PGPASSFILE || (
        isWin ?
          path.join( env.APPDATA || './' , 'postgresql', 'pgpass.conf' ) :
          path.join( env.HOME || './', '.pgpass' )
    );
    return file;
};

module.exports.usePgPass = function(stats, fname) {
    if (Object.prototype.hasOwnProperty.call(process.env, 'PGPASSWORD')) {
        return false;
    }

    if (isWin) {
        return true;
    }

    fname = fname || '<unkn>';

    if (! isRegFile(stats.mode)) {
        warn('WARNING: password file "%s" is not a plain file', fname);
        return false;
    }

    if (stats.mode & (S_IRWXG | S_IRWXO)) {
        /* If password file is insecure, alert the user and ignore it. */
        warn('WARNING: password file "%s" has group or world access; permissions should be u=rw (0600) or less', fname);
        return false;
    }

    return true;
};


var matcher = module.exports.match = function(connInfo, entry) {
    return fieldNames.slice(0, -1).reduce(function(prev, field, idx){
        if (idx == 1) {
            // the port
            if ( Number( connInfo[field] || defaultPort ) === Number( entry[field] ) ) {
                return prev && true;
            }
        }
        return prev && (
            entry[field] === '*' ||
              entry[field] === connInfo[field]
        );
    }, true);
};


module.exports.getPassword = function(connInfo, stream, cb) {
    var pass;
    var lineStream = stream.pipe(split());

    function onLine(line) {
        var entry = parseLine(line);
        if (entry && isValidEntry(entry) && matcher(connInfo, entry)) {
            pass = entry[passKey];
            lineStream.end(); // -> calls onEnd(), but pass is set now
        }
    }

    var onEnd = function() {
        stream.destroy();
        cb(pass);
    };

    var onErr = function(err) {
        stream.destroy();
        warn('WARNING: error on reading file: %s', err);
        cb(undefined);
    };

    stream.on('error', onErr);
    lineStream
        .on('data', onLine)
        .on('end', onEnd)
        .on('error', onErr)
    ;

};


var parseLine = module.exports.parseLine = function(line) {
    if (line.length < 11 || line.match(/^\s+#/)) {
        return null;
    }

    var curChar = '';
    var prevChar = '';
    var fieldIdx = 0;
    var startIdx = 0;
    var endIdx = 0;
    var obj = {};
    var isLastField = false;
    var addToObj = function(idx, i0, i1) {
        var field = line.substring(i0, i1);

        if (! Object.hasOwnProperty.call(process.env, 'PGPASS_NO_DEESCAPE')) {
            field = field.replace(/\\([:\\])/g, '$1');
        }

        obj[ fieldNames[idx] ] = field;
    };

    for (var i = 0 ; i < line.length-1 ; i += 1) {
        curChar = line.charAt(i+1);
        prevChar = line.charAt(i);

        isLastField = (fieldIdx == nrOfFields-1);

        if (isLastField) {
            addToObj(fieldIdx, startIdx);
            break;
        }

        if (i >= 0 && curChar == ':' && prevChar !== '\\') {
            addToObj(fieldIdx, startIdx, i+1);

            startIdx = i+2;
            fieldIdx += 1;
        }
    }

    obj = ( Object.keys(obj).length === nrOfFields ) ? obj : null;

    return obj;
};


var isValidEntry = module.exports.isValidEntry = function(entry){
    var rules = {
        // host
        0 : function(x){
            return x.length > 0;
        } ,
        // port
        1 : function(x){
            if (x === '*') {
                return true;
            }
            x = Number(x);
            return (
                isFinite(x) &&
                  x > 0 &&
                  x < 9007199254740992 &&
                  Math.floor(x) === x
            );
        } ,
        // database
        2 : function(x){
            return x.length > 0;
        } ,
        // username
        3 : function(x){
            return x.length > 0;
        } ,
        // password
        4 : function(x){
            return x.length > 0;
        }
    };

    for (var idx = 0 ; idx < fieldNames.length ; idx += 1) {
        var rule = rules[idx];
        var value = entry[ fieldNames[idx] ] || '';

        var res = rule(value);
        if (!res) {
            return false;
        }
    }

    return true;
};



/***/ }),

/***/ 61559:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



var path = __webpack_require__(16928)
  , fs = __webpack_require__(79896)
  , helper = __webpack_require__(17491)
;


module.exports = function(connInfo, cb) {
    var file = helper.getFileName();
    
    fs.stat(file, function(err, stat){
        if (err || !helper.usePgPass(stat, file)) {
            return cb(undefined);
        }

        var st = fs.createReadStream(file);

        helper.getPassword(connInfo, st, cb);
    });
};

module.exports.warnTo = helper.warnTo;


/***/ }),

/***/ 25837:
/***/ ((__unused_webpack_module, exports) => {



exports.parse = function (source, transform) {
  return new ArrayParser(source, transform).parse()
}

class ArrayParser {
  constructor (source, transform) {
    this.source = source
    this.transform = transform || identity
    this.position = 0
    this.entries = []
    this.recorded = []
    this.dimension = 0
  }

  isEof () {
    return this.position >= this.source.length
  }

  nextCharacter () {
    var character = this.source[this.position++]
    if (character === '\\') {
      return {
        value: this.source[this.position++],
        escaped: true
      }
    }
    return {
      value: character,
      escaped: false
    }
  }

  record (character) {
    this.recorded.push(character)
  }

  newEntry (includeEmpty) {
    var entry
    if (this.recorded.length > 0 || includeEmpty) {
      entry = this.recorded.join('')
      if (entry === 'NULL' && !includeEmpty) {
        entry = null
      }
      if (entry !== null) entry = this.transform(entry)
      this.entries.push(entry)
      this.recorded = []
    }
  }

  consumeDimensions () {
    if (this.source[0] === '[') {
      while (!this.isEof()) {
        var char = this.nextCharacter()
        if (char.value === '=') break
      }
    }
  }

  parse (nested) {
    var character, parser, quote
    this.consumeDimensions()
    while (!this.isEof()) {
      character = this.nextCharacter()
      if (character.value === '{' && !quote) {
        this.dimension++
        if (this.dimension > 1) {
          parser = new ArrayParser(this.source.substr(this.position - 1), this.transform)
          this.entries.push(parser.parse(true))
          this.position += parser.position - 2
        }
      } else if (character.value === '}' && !quote) {
        this.dimension--
        if (!this.dimension) {
          this.newEntry()
          if (nested) return this.entries
        }
      } else if (character.value === '"' && !character.escaped) {
        if (quote) this.newEntry(true)
        quote = !quote
      } else if (character.value === ',' && !quote) {
        this.newEntry()
      } else {
        this.record(character.value)
      }
    }
    if (this.dimension !== 0) {
      throw new Error('array dimension not balanced')
    }
    return this.entries
  }
}

function identity (value) {
  return value
}


/***/ }),

/***/ 30587:
/***/ ((module) => {



var bufferFrom = Buffer.from || Buffer

module.exports = function parseBytea (input) {
  if (/^\\x/.test(input)) {
    // new 'hex' style response (pg >9.0)
    return bufferFrom(input.substr(2), 'hex')
  }
  var output = ''
  var i = 0
  while (i < input.length) {
    if (input[i] !== '\\') {
      output += input[i]
      ++i
    } else {
      if (/[0-7]{3}/.test(input.substr(i + 1, 3))) {
        output += String.fromCharCode(parseInt(input.substr(i + 1, 3), 8))
        i += 4
      } else {
        var backslashes = 1
        while (i + backslashes < input.length && input[i + backslashes] === '\\') {
          backslashes++
        }
        for (var k = 0; k < Math.floor(backslashes / 2); ++k) {
          output += '\\'
        }
        i += Math.floor(backslashes / 2) * 2
      }
    }
  }
  return bufferFrom(output, 'binary')
}


/***/ }),

/***/ 83565:
/***/ ((module) => {



var DATE_TIME = /(\d{1,})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(\.\d{1,})?.*?( BC)?$/
var DATE = /^(\d{1,})-(\d{2})-(\d{2})( BC)?$/
var TIME_ZONE = /([Z+-])(\d{2})?:?(\d{2})?:?(\d{2})?/
var INFINITY = /^-?infinity$/

module.exports = function parseDate (isoDate) {
  if (INFINITY.test(isoDate)) {
    // Capitalize to Infinity before passing to Number
    return Number(isoDate.replace('i', 'I'))
  }
  var matches = DATE_TIME.exec(isoDate)

  if (!matches) {
    // Force YYYY-MM-DD dates to be parsed as local time
    return getDate(isoDate) || null
  }

  var isBC = !!matches[8]
  var year = parseInt(matches[1], 10)
  if (isBC) {
    year = bcYearToNegativeYear(year)
  }

  var month = parseInt(matches[2], 10) - 1
  var day = matches[3]
  var hour = parseInt(matches[4], 10)
  var minute = parseInt(matches[5], 10)
  var second = parseInt(matches[6], 10)

  var ms = matches[7]
  ms = ms ? 1000 * parseFloat(ms) : 0

  var date
  var offset = timeZoneOffset(isoDate)
  if (offset != null) {
    date = new Date(Date.UTC(year, month, day, hour, minute, second, ms))

    // Account for years from 0 to 99 being interpreted as 1900-1999
    // by Date.UTC / the multi-argument form of the Date constructor
    if (is0To99(year)) {
      date.setUTCFullYear(year)
    }

    if (offset !== 0) {
      date.setTime(date.getTime() - offset)
    }
  } else {
    date = new Date(year, month, day, hour, minute, second, ms)

    if (is0To99(year)) {
      date.setFullYear(year)
    }
  }

  return date
}

function getDate (isoDate) {
  var matches = DATE.exec(isoDate)
  if (!matches) {
    return
  }

  var year = parseInt(matches[1], 10)
  var isBC = !!matches[4]
  if (isBC) {
    year = bcYearToNegativeYear(year)
  }

  var month = parseInt(matches[2], 10) - 1
  var day = matches[3]
  // YYYY-MM-DD will be parsed as local time
  var date = new Date(year, month, day)

  if (is0To99(year)) {
    date.setFullYear(year)
  }

  return date
}

// match timezones:
// Z (UTC)
// -05
// +06:30
function timeZoneOffset (isoDate) {
  if (isoDate.endsWith('+00')) {
    return 0
  }

  var zone = TIME_ZONE.exec(isoDate.split(' ')[1])
  if (!zone) return
  var type = zone[1]

  if (type === 'Z') {
    return 0
  }
  var sign = type === '-' ? -1 : 1
  var offset = parseInt(zone[2], 10) * 3600 +
    parseInt(zone[3] || 0, 10) * 60 +
    parseInt(zone[4] || 0, 10)

  return offset * sign * 1000
}

function bcYearToNegativeYear (year) {
  // Account for numerical difference between representations of BC years
  // See: https://github.com/bendrucker/postgres-date/issues/5
  return -(year - 1)
}

function is0To99 (num) {
  return num >= 0 && num < 100
}


/***/ }),

/***/ 42366:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



var extend = __webpack_require__(17125)

module.exports = PostgresInterval

function PostgresInterval (raw) {
  if (!(this instanceof PostgresInterval)) {
    return new PostgresInterval(raw)
  }
  extend(this, parse(raw))
}
var properties = ['seconds', 'minutes', 'hours', 'days', 'months', 'years']
PostgresInterval.prototype.toPostgres = function () {
  var filtered = properties.filter(this.hasOwnProperty, this)

  // In addition to `properties`, we need to account for fractions of seconds.
  if (this.milliseconds && filtered.indexOf('seconds') < 0) {
    filtered.push('seconds')
  }

  if (filtered.length === 0) return '0'
  return filtered
    .map(function (property) {
      var value = this[property] || 0

      // Account for fractional part of seconds,
      // remove trailing zeroes.
      if (property === 'seconds' && this.milliseconds) {
        value = (value + this.milliseconds / 1000).toFixed(6).replace(/\.?0+$/, '')
      }

      return value + ' ' + property
    }, this)
    .join(' ')
}

var propertiesISOEquivalent = {
  years: 'Y',
  months: 'M',
  days: 'D',
  hours: 'H',
  minutes: 'M',
  seconds: 'S'
}
var dateProperties = ['years', 'months', 'days']
var timeProperties = ['hours', 'minutes', 'seconds']
// according to ISO 8601
PostgresInterval.prototype.toISOString = PostgresInterval.prototype.toISO = function () {
  var datePart = dateProperties
    .map(buildProperty, this)
    .join('')

  var timePart = timeProperties
    .map(buildProperty, this)
    .join('')

  return 'P' + datePart + 'T' + timePart

  function buildProperty (property) {
    var value = this[property] || 0

    // Account for fractional part of seconds,
    // remove trailing zeroes.
    if (property === 'seconds' && this.milliseconds) {
      value = (value + this.milliseconds / 1000).toFixed(6).replace(/0+$/, '')
    }

    return value + propertiesISOEquivalent[property]
  }
}

var NUMBER = '([+-]?\\d+)'
var YEAR = NUMBER + '\\s+years?'
var MONTH = NUMBER + '\\s+mons?'
var DAY = NUMBER + '\\s+days?'
var TIME = '([+-])?([\\d]*):(\\d\\d):(\\d\\d)\\.?(\\d{1,6})?'
var INTERVAL = new RegExp([YEAR, MONTH, DAY, TIME].map(function (regexString) {
  return '(' + regexString + ')?'
})
  .join('\\s*'))

// Positions of values in regex match
var positions = {
  years: 2,
  months: 4,
  days: 6,
  hours: 9,
  minutes: 10,
  seconds: 11,
  milliseconds: 12
}
// We can use negative time
var negatives = ['hours', 'minutes', 'seconds', 'milliseconds']

function parseMilliseconds (fraction) {
  // add omitted zeroes
  var microseconds = fraction + '000000'.slice(fraction.length)
  return parseInt(microseconds, 10) / 1000
}

function parse (interval) {
  if (!interval) return {}
  var matches = INTERVAL.exec(interval)
  var isNegative = matches[8] === '-'
  return Object.keys(positions)
    .reduce(function (parsed, property) {
      var position = positions[property]
      var value = matches[position]
      // no empty string
      if (!value) return parsed
      // milliseconds are actually microseconds (up to 6 digits)
      // with omitted trailing zeroes.
      value = property === 'milliseconds'
        ? parseMilliseconds(value)
        : parseInt(value, 10)
      // no zeros
      if (!value) return parsed
      if (isNegative && ~negatives.indexOf(property)) {
        value *= -1
      }
      parsed[property] = value
      return parsed
    }, {})
}


/***/ }),

/***/ 61673:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/*
Copyright (c) 2014-2021, Matteo Collina <hello@matteocollina.com>

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR
IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/



const { Transform } = __webpack_require__(2203)
const { StringDecoder } = __webpack_require__(13193)
const kLast = Symbol('last')
const kDecoder = Symbol('decoder')

function transform (chunk, enc, cb) {
  let list
  if (this.overflow) { // Line buffer is full. Skip to start of next line.
    const buf = this[kDecoder].write(chunk)
    list = buf.split(this.matcher)

    if (list.length === 1) return cb() // Line ending not found. Discard entire chunk.

    // Line ending found. Discard trailing fragment of previous line and reset overflow state.
    list.shift()
    this.overflow = false
  } else {
    this[kLast] += this[kDecoder].write(chunk)
    list = this[kLast].split(this.matcher)
  }

  this[kLast] = list.pop()

  for (let i = 0; i < list.length; i++) {
    try {
      push(this, this.mapper(list[i]))
    } catch (error) {
      return cb(error)
    }
  }

  this.overflow = this[kLast].length > this.maxLength
  if (this.overflow && !this.skipOverflow) {
    cb(new Error('maximum buffer reached'))
    return
  }

  cb()
}

function flush (cb) {
  // forward any gibberish left in there
  this[kLast] += this[kDecoder].end()

  if (this[kLast]) {
    try {
      push(this, this.mapper(this[kLast]))
    } catch (error) {
      return cb(error)
    }
  }

  cb()
}

function push (self, val) {
  if (val !== undefined) {
    self.push(val)
  }
}

function noop (incoming) {
  return incoming
}

function split (matcher, mapper, options) {
  // Set defaults for any arguments not supplied.
  matcher = matcher || /\r?\n/
  mapper = mapper || noop
  options = options || {}

  // Test arguments explicitly.
  switch (arguments.length) {
    case 1:
      // If mapper is only argument.
      if (typeof matcher === 'function') {
        mapper = matcher
        matcher = /\r?\n/
      // If options is only argument.
      } else if (typeof matcher === 'object' && !(matcher instanceof RegExp) && !matcher[Symbol.split]) {
        options = matcher
        matcher = /\r?\n/
      }
      break

    case 2:
      // If mapper and options are arguments.
      if (typeof matcher === 'function') {
        options = mapper
        mapper = matcher
        matcher = /\r?\n/
      // If matcher and options are arguments.
      } else if (typeof mapper === 'object') {
        options = mapper
        mapper = noop
      }
  }

  options = Object.assign({}, options)
  options.autoDestroy = true
  options.transform = transform
  options.flush = flush
  options.readableObjectMode = true

  const stream = new Transform(options)

  stream[kLast] = ''
  stream[kDecoder] = new StringDecoder('utf8')
  stream.matcher = matcher
  stream.mapper = mapper
  stream.maxLength = options.maxLength
  stream.skipOverflow = options.skipOverflow || false
  stream.overflow = false
  stream._destroy = function (err, cb) {
    // Weird Node v12 bug that we need to work around
    this._writableState.errorEmitted = false
    cb(err)
  }

  return stream
}

module.exports = split


/***/ }),

/***/ 17125:
/***/ ((module) => {

module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend(target) {
    for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}


/***/ }),

/***/ 23110:
/***/ ((module) => {

module.exports = eval("require")("pg-native");


/***/ }),

/***/ 91369:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Hs: () => (/* binding */ mapColumnsInAliasedSQLToAlias),
/* harmony export */   Ht: () => (/* binding */ ColumnAliasProxyHandler),
/* harmony export */   h_: () => (/* binding */ TableAliasProxyHandler),
/* harmony export */   oG: () => (/* binding */ aliasedTable),
/* harmony export */   ug: () => (/* binding */ aliasedTableColumn),
/* harmony export */   yY: () => (/* binding */ mapColumnsInSQLToAlias)
/* harmony export */ });
/* unused harmony exports RelationTableAliasProxyHandler, aliasedRelation */
/* harmony import */ var _column_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(599);
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(48666);
/* harmony import */ var _sql_sql_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(67910);
/* harmony import */ var _table_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(17169);
/* harmony import */ var _view_common_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(9152);





class ColumnAliasProxyHandler {
  constructor(table) {
    this.table = table;
  }
  static [_entity_js__WEBPACK_IMPORTED_MODULE_0__/* .entityKind */ .i] = "ColumnAliasProxyHandler";
  get(columnObj, prop) {
    if (prop === "table") {
      return this.table;
    }
    return columnObj[prop];
  }
}
class TableAliasProxyHandler {
  constructor(alias, replaceOriginalName) {
    this.alias = alias;
    this.replaceOriginalName = replaceOriginalName;
  }
  static [_entity_js__WEBPACK_IMPORTED_MODULE_0__/* .entityKind */ .i] = "TableAliasProxyHandler";
  get(target, prop) {
    if (prop === _table_js__WEBPACK_IMPORTED_MODULE_1__/* .Table */ .XI.Symbol.IsAlias) {
      return true;
    }
    if (prop === _table_js__WEBPACK_IMPORTED_MODULE_1__/* .Table */ .XI.Symbol.Name) {
      return this.alias;
    }
    if (this.replaceOriginalName && prop === _table_js__WEBPACK_IMPORTED_MODULE_1__/* .Table */ .XI.Symbol.OriginalName) {
      return this.alias;
    }
    if (prop === _view_common_js__WEBPACK_IMPORTED_MODULE_2__/* .ViewBaseConfig */ .n) {
      return {
        ...target[_view_common_js__WEBPACK_IMPORTED_MODULE_2__/* .ViewBaseConfig */ .n],
        name: this.alias,
        isAlias: true
      };
    }
    if (prop === _table_js__WEBPACK_IMPORTED_MODULE_1__/* .Table */ .XI.Symbol.Columns) {
      const columns = target[_table_js__WEBPACK_IMPORTED_MODULE_1__/* .Table */ .XI.Symbol.Columns];
      if (!columns) {
        return columns;
      }
      const proxiedColumns = {};
      Object.keys(columns).map((key) => {
        proxiedColumns[key] = new Proxy(
          columns[key],
          new ColumnAliasProxyHandler(new Proxy(target, this))
        );
      });
      return proxiedColumns;
    }
    const value = target[prop];
    if ((0,_entity_js__WEBPACK_IMPORTED_MODULE_0__.is)(value, _column_js__WEBPACK_IMPORTED_MODULE_3__/* .Column */ .V)) {
      return new Proxy(value, new ColumnAliasProxyHandler(new Proxy(target, this)));
    }
    return value;
  }
}
class RelationTableAliasProxyHandler {
  constructor(alias) {
    this.alias = alias;
  }
  static [_entity_js__WEBPACK_IMPORTED_MODULE_0__/* .entityKind */ .i] = (/* unused pure expression or super */ null && ("RelationTableAliasProxyHandler"));
  get(target, prop) {
    if (prop === "sourceTable") {
      return aliasedTable(target.sourceTable, this.alias);
    }
    return target[prop];
  }
}
function aliasedTable(table, tableAlias) {
  return new Proxy(table, new TableAliasProxyHandler(tableAlias, false));
}
function aliasedRelation(relation, tableAlias) {
  return new Proxy(relation, new RelationTableAliasProxyHandler(tableAlias));
}
function aliasedTableColumn(column, tableAlias) {
  return new Proxy(
    column,
    new ColumnAliasProxyHandler(new Proxy(column.table, new TableAliasProxyHandler(tableAlias, false)))
  );
}
function mapColumnsInAliasedSQLToAlias(query, alias) {
  return new _sql_sql_js__WEBPACK_IMPORTED_MODULE_4__/* .SQL */ .Xs.Aliased(mapColumnsInSQLToAlias(query.sql, alias), query.fieldAlias);
}
function mapColumnsInSQLToAlias(query, alias) {
  return _sql_sql_js__WEBPACK_IMPORTED_MODULE_4__/* .sql */ .ll.join(query.queryChunks.map((c) => {
    if ((0,_entity_js__WEBPACK_IMPORTED_MODULE_0__.is)(c, _column_js__WEBPACK_IMPORTED_MODULE_3__/* .Column */ .V)) {
      return aliasedTableColumn(c, alias);
    }
    if ((0,_entity_js__WEBPACK_IMPORTED_MODULE_0__.is)(c, _sql_sql_js__WEBPACK_IMPORTED_MODULE_4__/* .SQL */ .Xs)) {
      return mapColumnsInSQLToAlias(c, alias);
    }
    if ((0,_entity_js__WEBPACK_IMPORTED_MODULE_0__.is)(c, _sql_sql_js__WEBPACK_IMPORTED_MODULE_4__/* .SQL */ .Xs.Aliased)) {
      return mapColumnsInAliasedSQLToAlias(c, alias);
    }
    return c;
  }));
}

//# sourceMappingURL=alias.js.map

/***/ }),

/***/ 33324:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Th: () => (/* binding */ NoopCache),
/* harmony export */   h1: () => (/* binding */ hashQuery)
/* harmony export */ });
/* unused harmony export Cache */
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(48666);

class Cache {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_0__/* .entityKind */ .i] = "Cache";
}
class NoopCache extends Cache {
  strategy() {
    return "all";
  }
  static [_entity_js__WEBPACK_IMPORTED_MODULE_0__/* .entityKind */ .i] = "NoopCache";
  async get(_key) {
    return void 0;
  }
  async put(_hashedQuery, _response, _tables, _config) {
  }
  async onMutate(_params) {
  }
}
async function hashQuery(sql, params) {
  const dataToHash = `${sql}-${JSON.stringify(params)}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(dataToHash);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = [...new Uint8Array(hashBuffer)];
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

//# sourceMappingURL=cache.js.map

/***/ }),

/***/ 50690:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Yn: () => (/* binding */ CasingCache)
/* harmony export */ });
/* unused harmony exports toCamelCase, toSnakeCase */
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(48666);
/* harmony import */ var _table_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(17169);


function toSnakeCase(input) {
  const words = input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.map((word) => word.toLowerCase()).join("_");
}
function toCamelCase(input) {
  const words = input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.reduce((acc, word, i) => {
    const formattedWord = i === 0 ? word.toLowerCase() : `${word[0].toUpperCase()}${word.slice(1)}`;
    return acc + formattedWord;
  }, "");
}
function noopCase(input) {
  return input;
}
class CasingCache {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_0__/* .entityKind */ .i] = "CasingCache";
  /** @internal */
  cache = {};
  cachedTables = {};
  convert;
  constructor(casing) {
    this.convert = casing === "snake_case" ? toSnakeCase : casing === "camelCase" ? toCamelCase : noopCase;
  }
  getColumnCasing(column) {
    if (!column.keyAsName) return column.name;
    const schema = column.table[_table_js__WEBPACK_IMPORTED_MODULE_1__/* .Table */ .XI.Symbol.Schema] ?? "public";
    const tableName = column.table[_table_js__WEBPACK_IMPORTED_MODULE_1__/* .Table */ .XI.Symbol.OriginalName];
    const key = `${schema}.${tableName}.${column.name}`;
    if (!this.cache[key]) {
      this.cacheTable(column.table);
    }
    return this.cache[key];
  }
  cacheTable(table) {
    const schema = table[_table_js__WEBPACK_IMPORTED_MODULE_1__/* .Table */ .XI.Symbol.Schema] ?? "public";
    const tableName = table[_table_js__WEBPACK_IMPORTED_MODULE_1__/* .Table */ .XI.Symbol.OriginalName];
    const tableKey = `${schema}.${tableName}`;
    if (!this.cachedTables[tableKey]) {
      for (const column of Object.values(table[_table_js__WEBPACK_IMPORTED_MODULE_1__/* .Table */ .XI.Symbol.Columns])) {
        const columnKey = `${tableKey}.${column.name}`;
        this.cache[columnKey] = this.convert(column.name);
      }
      this.cachedTables[tableKey] = true;
    }
  }
  clearCache() {
    this.cache = {};
    this.cachedTables = {};
  }
}

//# sourceMappingURL=casing.js.map

/***/ }),

/***/ 30057:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Q: () => (/* binding */ ColumnBuilder)
/* harmony export */ });
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(48666);

class ColumnBuilder {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_0__/* .entityKind */ .i] = "ColumnBuilder";
  config;
  constructor(name, dataType, columnType) {
    this.config = {
      name,
      keyAsName: name === "",
      notNull: false,
      default: void 0,
      hasDefault: false,
      primaryKey: false,
      isUnique: false,
      uniqueName: void 0,
      uniqueType: void 0,
      dataType,
      columnType,
      generated: void 0
    };
  }
  /**
   * Changes the data type of the column. Commonly used with `json` columns. Also, useful for branded types.
   *
   * @example
   * ```ts
   * const users = pgTable('users', {
   * 	id: integer('id').$type<UserId>().primaryKey(),
   * 	details: json('details').$type<UserDetails>().notNull(),
   * });
   * ```
   */
  $type() {
    return this;
  }
  /**
   * Adds a `not null` clause to the column definition.
   *
   * Affects the `select` model of the table - columns *without* `not null` will be nullable on select.
   */
  notNull() {
    this.config.notNull = true;
    return this;
  }
  /**
   * Adds a `default <value>` clause to the column definition.
   *
   * Affects the `insert` model of the table - columns *with* `default` are optional on insert.
   *
   * If you need to set a dynamic default value, use {@link $defaultFn} instead.
   */
  default(value) {
    this.config.default = value;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Adds a dynamic default value to the column.
   * The function will be called when the row is inserted, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $defaultFn(fn) {
    this.config.defaultFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $defaultFn}.
   */
  $default = this.$defaultFn;
  /**
   * Adds a dynamic update value to the column.
   * The function will be called when the row is updated, and the returned value will be used as the column value if none is provided.
   * If no `default` (or `$defaultFn`) value is provided, the function will be called when the row is inserted as well, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $onUpdateFn(fn) {
    this.config.onUpdateFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $onUpdateFn}.
   */
  $onUpdate = this.$onUpdateFn;
  /**
   * Adds a `primary key` clause to the column definition. This implicitly makes the column `not null`.
   *
   * In SQLite, `integer primary key` implicitly makes the column auto-incrementing.
   */
  primaryKey() {
    this.config.primaryKey = true;
    this.config.notNull = true;
    return this;
  }
  /** @internal Sets the name of the column to the key within the table definition if a name was not given. */
  setName(name) {
    if (this.config.name !== "") return;
    this.config.name = name;
  }
}

//# sourceMappingURL=column-builder.js.map

/***/ }),

/***/ 599:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   V: () => (/* binding */ Column)
/* harmony export */ });
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(48666);

class Column {
  constructor(table, config) {
    this.table = table;
    this.config = config;
    this.name = config.name;
    this.keyAsName = config.keyAsName;
    this.notNull = config.notNull;
    this.default = config.default;
    this.defaultFn = config.defaultFn;
    this.onUpdateFn = config.onUpdateFn;
    this.hasDefault = config.hasDefault;
    this.primary = config.primaryKey;
    this.isUnique = config.isUnique;
    this.uniqueName = config.uniqueName;
    this.uniqueType = config.uniqueType;
    this.dataType = config.dataType;
    this.columnType = config.columnType;
    this.generated = config.generated;
    this.generatedIdentity = config.generatedIdentity;
  }
  static [_entity_js__WEBPACK_IMPORTED_MODULE_0__/* .entityKind */ .i] = "Column";
  name;
  keyAsName;
  primary;
  notNull;
  default;
  defaultFn;
  onUpdateFn;
  hasDefault;
  isUnique;
  uniqueName;
  uniqueType;
  dataType;
  columnType;
  enumValues = void 0;
  generated = void 0;
  generatedIdentity = void 0;
  config;
  mapFromDriverValue(value) {
    return value;
  }
  mapToDriverValue(value) {
    return value;
  }
  // ** @internal */
  shouldDisableInsert() {
    return this.config.generated !== void 0 && this.config.generated.type !== "byDefault";
  }
}

//# sourceMappingURL=column.js.map

/***/ }),

/***/ 48666:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   i: () => (/* binding */ entityKind),
/* harmony export */   is: () => (/* binding */ is)
/* harmony export */ });
/* unused harmony export hasOwnEntityKind */
const entityKind = Symbol.for("drizzle:entityKind");
const hasOwnEntityKind = Symbol.for("drizzle:hasOwnEntityKind");
function is(value, type) {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (value instanceof type) {
    return true;
  }
  if (!Object.prototype.hasOwnProperty.call(type, entityKind)) {
    throw new Error(
      `Class "${type.name ?? "<unknown>"}" doesn't look like a Drizzle entity. If this is incorrect and the class is provided by Drizzle, please report this as a bug.`
    );
  }
  let cls = Object.getPrototypeOf(value).constructor;
  if (cls) {
    while (cls) {
      if (entityKind in cls && cls[entityKind] === type[entityKind]) {
        return true;
      }
      cls = Object.getPrototypeOf(cls);
    }
  }
  return false;
}

//# sourceMappingURL=entity.js.map

/***/ }),

/***/ 42230:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Rv: () => (/* binding */ DrizzleQueryError),
/* harmony export */   jY: () => (/* binding */ TransactionRollbackError),
/* harmony export */   n9: () => (/* binding */ DrizzleError)
/* harmony export */ });
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(48666);

class DrizzleError extends Error {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_0__/* .entityKind */ .i] = "DrizzleError";
  constructor({ message, cause }) {
    super(message);
    this.name = "DrizzleError";
    this.cause = cause;
  }
}
class DrizzleQueryError extends Error {
  constructor(query, params, cause) {
    super(`Failed query: ${query}
params: ${params}`);
    this.query = query;
    this.params = params;
    this.cause = cause;
    Error.captureStackTrace(this, DrizzleQueryError);
    if (cause) this.cause = cause;
  }
}
class TransactionRollbackError extends DrizzleError {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_0__/* .entityKind */ .i] = "TransactionRollbackError";
  constructor() {
    super({ message: "Rollback" });
  }
}

//# sourceMappingURL=errors.js.map

/***/ }),

/***/ 58337:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Pv: () => (/* binding */ NoopLogger),
/* harmony export */   w: () => (/* binding */ DefaultLogger)
/* harmony export */ });
/* unused harmony export ConsoleLogWriter */
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(48666);

class ConsoleLogWriter {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_0__/* .entityKind */ .i] = "ConsoleLogWriter";
  write(message) {
    console.log(message);
  }
}
class DefaultLogger {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_0__/* .entityKind */ .i] = "DefaultLogger";
  writer;
  constructor(config) {
    this.writer = config?.writer ?? new ConsoleLogWriter();
  }
  logQuery(query, params) {
    const stringifiedParams = params.map((p) => {
      try {
        return JSON.stringify(p);
      } catch {
        return String(p);
      }
    });
    const paramsStr = stringifiedParams.length ? ` -- params: [${stringifiedParams.join(", ")}]` : "";
    this.writer.write(`Query: ${query}${paramsStr}`);
  }
}
class NoopLogger {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_0__/* .entityKind */ .i] = "NoopLogger";
  logQuery() {
  }
}

//# sourceMappingURL=logger.js.map

/***/ }),

/***/ 46241:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  fd: () => (/* binding */ drizzle)
});

// UNUSED EXPORTS: NodePgDatabase, NodePgDriver

// EXTERNAL MODULE: ../../node_modules/.pnpm/pg@8.23.0/node_modules/pg/esm/index.mjs
var esm = __webpack_require__(99556);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/entity.js
var entity = __webpack_require__(48666);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/logger.js
var drizzle_orm_logger = __webpack_require__(58337);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/alias.js
var alias = __webpack_require__(91369);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/casing.js
var casing = __webpack_require__(50690);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/column.js
var column = __webpack_require__(599);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/errors.js
var errors = __webpack_require__(42230);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/common.js + 3 modules
var common = __webpack_require__(70704);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/jsonb.js
var jsonb = __webpack_require__(78785);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/json.js
var json = __webpack_require__(75127);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/numeric.js
var numeric = __webpack_require__(90994);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/time.js
var time = __webpack_require__(72988);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/timestamp.js
var timestamp = __webpack_require__(87841);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/date.js
var date = __webpack_require__(81077);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/uuid.js
var uuid = __webpack_require__(58546);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/table.js + 21 modules
var pg_core_table = __webpack_require__(78886);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/relations.js + 1 modules
var relations = __webpack_require__(54518);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sql/sql.js + 1 modules
var sql = __webpack_require__(67910);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sql/expressions/conditions.js
var conditions = __webpack_require__(7002);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/subquery.js
var subquery = __webpack_require__(2387);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/table.js
var drizzle_orm_table = __webpack_require__(17169);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/utils.js
var utils = __webpack_require__(82348);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/view-common.js
var view_common = __webpack_require__(9152);
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/view-base.js


class PgViewBase extends sql/* View */.Ss {
  static [entity/* entityKind */.i] = "PgViewBase";
}

//# sourceMappingURL=view-base.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/dialect.js















class PgDialect {
  static [entity/* entityKind */.i] = "PgDialect";
  /** @internal */
  casing;
  constructor(config) {
    this.casing = new casing/* CasingCache */.Yn(config?.casing);
  }
  async migrate(migrations, session, config) {
    const migrationsTable = typeof config === "string" ? "__drizzle_migrations" : config.migrationsTable ?? "__drizzle_migrations";
    const migrationsSchema = typeof config === "string" ? "drizzle" : config.migrationsSchema ?? "drizzle";
    const migrationTableCreate = (0,sql/* sql */.ll)`
			CREATE TABLE IF NOT EXISTS ${sql/* sql */.ll.identifier(migrationsSchema)}.${sql/* sql */.ll.identifier(migrationsTable)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at bigint
			)
		`;
    await session.execute((0,sql/* sql */.ll)`CREATE SCHEMA IF NOT EXISTS ${sql/* sql */.ll.identifier(migrationsSchema)}`);
    await session.execute(migrationTableCreate);
    const dbMigrations = await session.all(
      (0,sql/* sql */.ll)`select id, hash, created_at from ${sql/* sql */.ll.identifier(migrationsSchema)}.${sql/* sql */.ll.identifier(migrationsTable)} order by created_at desc limit 1`
    );
    const lastDbMigration = dbMigrations[0];
    await session.transaction(async (tx) => {
      for await (const migration of migrations) {
        if (!lastDbMigration || Number(lastDbMigration.created_at) < migration.folderMillis) {
          for (const stmt of migration.sql) {
            await tx.execute(sql/* sql */.ll.raw(stmt));
          }
          await tx.execute(
            (0,sql/* sql */.ll)`insert into ${sql/* sql */.ll.identifier(migrationsSchema)}.${sql/* sql */.ll.identifier(migrationsTable)} ("hash", "created_at") values(${migration.hash}, ${migration.folderMillis})`
          );
        }
      }
    });
  }
  escapeName(name) {
    return `"${name}"`;
  }
  escapeParam(num) {
    return `$${num + 1}`;
  }
  escapeString(str) {
    return `'${str.replace(/'/g, "''")}'`;
  }
  buildWithCTE(queries) {
    if (!queries?.length) return void 0;
    const withSqlChunks = [(0,sql/* sql */.ll)`with `];
    for (const [i, w] of queries.entries()) {
      withSqlChunks.push((0,sql/* sql */.ll)`${sql/* sql */.ll.identifier(w._.alias)} as (${w._.sql})`);
      if (i < queries.length - 1) {
        withSqlChunks.push((0,sql/* sql */.ll)`, `);
      }
    }
    withSqlChunks.push((0,sql/* sql */.ll)` `);
    return sql/* sql */.ll.join(withSqlChunks);
  }
  buildDeleteQuery({ table, where, returning, withList }) {
    const withSql = this.buildWithCTE(withList);
    const returningSql = returning ? (0,sql/* sql */.ll)` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const whereSql = where ? (0,sql/* sql */.ll)` where ${where}` : void 0;
    return (0,sql/* sql */.ll)`${withSql}delete from ${table}${whereSql}${returningSql}`;
  }
  buildUpdateSet(table, set) {
    const tableColumns = table[drizzle_orm_table/* Table */.XI.Symbol.Columns];
    const columnNames = Object.keys(tableColumns).filter(
      (colName) => set[colName] !== void 0 || tableColumns[colName]?.onUpdateFn !== void 0
    );
    const setSize = columnNames.length;
    return sql/* sql */.ll.join(columnNames.flatMap((colName, i) => {
      const col = tableColumns[colName];
      const value = set[colName] ?? sql/* sql */.ll.param(col.onUpdateFn(), col);
      const res = (0,sql/* sql */.ll)`${sql/* sql */.ll.identifier(this.casing.getColumnCasing(col))} = ${value}`;
      if (i < setSize - 1) {
        return [res, sql/* sql */.ll.raw(", ")];
      }
      return [res];
    }));
  }
  buildUpdateQuery({ table, set, where, returning, withList, from, joins }) {
    const withSql = this.buildWithCTE(withList);
    const tableName = table[pg_core_table/* PgTable */.mu.Symbol.Name];
    const tableSchema = table[pg_core_table/* PgTable */.mu.Symbol.Schema];
    const origTableName = table[pg_core_table/* PgTable */.mu.Symbol.OriginalName];
    const alias = tableName === origTableName ? void 0 : tableName;
    const tableSql = (0,sql/* sql */.ll)`${tableSchema ? (0,sql/* sql */.ll)`${sql/* sql */.ll.identifier(tableSchema)}.` : void 0}${sql/* sql */.ll.identifier(origTableName)}${alias && (0,sql/* sql */.ll)` ${sql/* sql */.ll.identifier(alias)}`}`;
    const setSql = this.buildUpdateSet(table, set);
    const fromSql = from && sql/* sql */.ll.join([sql/* sql */.ll.raw(" from "), this.buildFromTable(from)]);
    const joinsSql = this.buildJoins(joins);
    const returningSql = returning ? (0,sql/* sql */.ll)` returning ${this.buildSelection(returning, { isSingleTable: !from })}` : void 0;
    const whereSql = where ? (0,sql/* sql */.ll)` where ${where}` : void 0;
    return (0,sql/* sql */.ll)`${withSql}update ${tableSql} set ${setSql}${fromSql}${joinsSql}${whereSql}${returningSql}`;
  }
  /**
   * Builds selection SQL with provided fields/expressions
   *
   * Examples:
   *
   * `select <selection> from`
   *
   * `insert ... returning <selection>`
   *
   * If `isSingleTable` is true, then columns won't be prefixed with table name
   */
  buildSelection(fields, { isSingleTable = false } = {}) {
    const columnsLen = fields.length;
    const chunks = fields.flatMap(({ field }, i) => {
      const chunk = [];
      if ((0,entity.is)(field, sql/* SQL */.Xs.Aliased) && field.isSelectionField) {
        chunk.push(sql/* sql */.ll.identifier(field.fieldAlias));
      } else if ((0,entity.is)(field, sql/* SQL */.Xs.Aliased) || (0,entity.is)(field, sql/* SQL */.Xs)) {
        const query = (0,entity.is)(field, sql/* SQL */.Xs.Aliased) ? field.sql : field;
        if (isSingleTable) {
          chunk.push(
            new sql/* SQL */.Xs(
              query.queryChunks.map((c) => {
                if ((0,entity.is)(c, common/* PgColumn */.Kl)) {
                  return sql/* sql */.ll.identifier(this.casing.getColumnCasing(c));
                }
                return c;
              })
            )
          );
        } else {
          chunk.push(query);
        }
        if ((0,entity.is)(field, sql/* SQL */.Xs.Aliased)) {
          chunk.push((0,sql/* sql */.ll)` as ${sql/* sql */.ll.identifier(field.fieldAlias)}`);
        }
      } else if ((0,entity.is)(field, column/* Column */.V)) {
        if (isSingleTable) {
          chunk.push(sql/* sql */.ll.identifier(this.casing.getColumnCasing(field)));
        } else {
          chunk.push(field);
        }
      }
      if (i < columnsLen - 1) {
        chunk.push((0,sql/* sql */.ll)`, `);
      }
      return chunk;
    });
    return sql/* sql */.ll.join(chunks);
  }
  buildJoins(joins) {
    if (!joins || joins.length === 0) {
      return void 0;
    }
    const joinsArray = [];
    for (const [index, joinMeta] of joins.entries()) {
      if (index === 0) {
        joinsArray.push((0,sql/* sql */.ll)` `);
      }
      const table = joinMeta.table;
      const lateralSql = joinMeta.lateral ? (0,sql/* sql */.ll)` lateral` : void 0;
      const onSql = joinMeta.on ? (0,sql/* sql */.ll)` on ${joinMeta.on}` : void 0;
      if ((0,entity.is)(table, pg_core_table/* PgTable */.mu)) {
        const tableName = table[pg_core_table/* PgTable */.mu.Symbol.Name];
        const tableSchema = table[pg_core_table/* PgTable */.mu.Symbol.Schema];
        const origTableName = table[pg_core_table/* PgTable */.mu.Symbol.OriginalName];
        const alias = tableName === origTableName ? void 0 : joinMeta.alias;
        joinsArray.push(
          (0,sql/* sql */.ll)`${sql/* sql */.ll.raw(joinMeta.joinType)} join${lateralSql} ${tableSchema ? (0,sql/* sql */.ll)`${sql/* sql */.ll.identifier(tableSchema)}.` : void 0}${sql/* sql */.ll.identifier(origTableName)}${alias && (0,sql/* sql */.ll)` ${sql/* sql */.ll.identifier(alias)}`}${onSql}`
        );
      } else if ((0,entity.is)(table, sql/* View */.Ss)) {
        const viewName = table[view_common/* ViewBaseConfig */.n].name;
        const viewSchema = table[view_common/* ViewBaseConfig */.n].schema;
        const origViewName = table[view_common/* ViewBaseConfig */.n].originalName;
        const alias = viewName === origViewName ? void 0 : joinMeta.alias;
        joinsArray.push(
          (0,sql/* sql */.ll)`${sql/* sql */.ll.raw(joinMeta.joinType)} join${lateralSql} ${viewSchema ? (0,sql/* sql */.ll)`${sql/* sql */.ll.identifier(viewSchema)}.` : void 0}${sql/* sql */.ll.identifier(origViewName)}${alias && (0,sql/* sql */.ll)` ${sql/* sql */.ll.identifier(alias)}`}${onSql}`
        );
      } else {
        joinsArray.push(
          (0,sql/* sql */.ll)`${sql/* sql */.ll.raw(joinMeta.joinType)} join${lateralSql} ${table}${onSql}`
        );
      }
      if (index < joins.length - 1) {
        joinsArray.push((0,sql/* sql */.ll)` `);
      }
    }
    return sql/* sql */.ll.join(joinsArray);
  }
  buildFromTable(table) {
    if ((0,entity.is)(table, drizzle_orm_table/* Table */.XI) && table[drizzle_orm_table/* Table */.XI.Symbol.IsAlias]) {
      let fullName = (0,sql/* sql */.ll)`${sql/* sql */.ll.identifier(table[drizzle_orm_table/* Table */.XI.Symbol.OriginalName])}`;
      if (table[drizzle_orm_table/* Table */.XI.Symbol.Schema]) {
        fullName = (0,sql/* sql */.ll)`${sql/* sql */.ll.identifier(table[drizzle_orm_table/* Table */.XI.Symbol.Schema])}.${fullName}`;
      }
      return (0,sql/* sql */.ll)`${fullName} ${sql/* sql */.ll.identifier(table[drizzle_orm_table/* Table */.XI.Symbol.Name])}`;
    }
    return table;
  }
  buildSelectQuery({
    withList,
    fields,
    fieldsFlat,
    where,
    having,
    table,
    joins,
    orderBy,
    groupBy,
    limit,
    offset,
    lockingClause,
    distinct,
    setOperators
  }) {
    const fieldsList = fieldsFlat ?? (0,utils/* orderSelectedFields */.He)(fields);
    for (const f of fieldsList) {
      if ((0,entity.is)(f.field, column/* Column */.V) && (0,drizzle_orm_table/* getTableName */.Io)(f.field.table) !== ((0,entity.is)(table, subquery/* Subquery */.n) ? table._.alias : (0,entity.is)(table, PgViewBase) ? table[view_common/* ViewBaseConfig */.n].name : (0,entity.is)(table, sql/* SQL */.Xs) ? void 0 : (0,drizzle_orm_table/* getTableName */.Io)(table)) && !((table2) => joins?.some(
        ({ alias }) => alias === (table2[drizzle_orm_table/* Table */.XI.Symbol.IsAlias] ? (0,drizzle_orm_table/* getTableName */.Io)(table2) : table2[drizzle_orm_table/* Table */.XI.Symbol.BaseName])
      ))(f.field.table)) {
        const tableName = (0,drizzle_orm_table/* getTableName */.Io)(f.field.table);
        throw new Error(
          `Your "${f.path.join("->")}" field references a column "${tableName}"."${f.field.name}", but the table "${tableName}" is not part of the query! Did you forget to join it?`
        );
      }
    }
    const isSingleTable = !joins || joins.length === 0;
    const withSql = this.buildWithCTE(withList);
    let distinctSql;
    if (distinct) {
      distinctSql = distinct === true ? (0,sql/* sql */.ll)` distinct` : (0,sql/* sql */.ll)` distinct on (${sql/* sql */.ll.join(distinct.on, (0,sql/* sql */.ll)`, `)})`;
    }
    const selection = this.buildSelection(fieldsList, { isSingleTable });
    const tableSql = this.buildFromTable(table);
    const joinsSql = this.buildJoins(joins);
    const whereSql = where ? (0,sql/* sql */.ll)` where ${where}` : void 0;
    const havingSql = having ? (0,sql/* sql */.ll)` having ${having}` : void 0;
    let orderBySql;
    if (orderBy && orderBy.length > 0) {
      orderBySql = (0,sql/* sql */.ll)` order by ${sql/* sql */.ll.join(orderBy, (0,sql/* sql */.ll)`, `)}`;
    }
    let groupBySql;
    if (groupBy && groupBy.length > 0) {
      groupBySql = (0,sql/* sql */.ll)` group by ${sql/* sql */.ll.join(groupBy, (0,sql/* sql */.ll)`, `)}`;
    }
    const limitSql = typeof limit === "object" || typeof limit === "number" && limit >= 0 ? (0,sql/* sql */.ll)` limit ${limit}` : void 0;
    const offsetSql = offset ? (0,sql/* sql */.ll)` offset ${offset}` : void 0;
    const lockingClauseSql = sql/* sql */.ll.empty();
    if (lockingClause) {
      const clauseSql = (0,sql/* sql */.ll)` for ${sql/* sql */.ll.raw(lockingClause.strength)}`;
      if (lockingClause.config.of) {
        clauseSql.append(
          (0,sql/* sql */.ll)` of ${sql/* sql */.ll.join(
            Array.isArray(lockingClause.config.of) ? lockingClause.config.of : [lockingClause.config.of],
            (0,sql/* sql */.ll)`, `
          )}`
        );
      }
      if (lockingClause.config.noWait) {
        clauseSql.append((0,sql/* sql */.ll)` nowait`);
      } else if (lockingClause.config.skipLocked) {
        clauseSql.append((0,sql/* sql */.ll)` skip locked`);
      }
      lockingClauseSql.append(clauseSql);
    }
    const finalQuery = (0,sql/* sql */.ll)`${withSql}select${distinctSql} ${selection} from ${tableSql}${joinsSql}${whereSql}${groupBySql}${havingSql}${orderBySql}${limitSql}${offsetSql}${lockingClauseSql}`;
    if (setOperators.length > 0) {
      return this.buildSetOperations(finalQuery, setOperators);
    }
    return finalQuery;
  }
  buildSetOperations(leftSelect, setOperators) {
    const [setOperator, ...rest] = setOperators;
    if (!setOperator) {
      throw new Error("Cannot pass undefined values to any set operator");
    }
    if (rest.length === 0) {
      return this.buildSetOperationQuery({ leftSelect, setOperator });
    }
    return this.buildSetOperations(
      this.buildSetOperationQuery({ leftSelect, setOperator }),
      rest
    );
  }
  buildSetOperationQuery({
    leftSelect,
    setOperator: { type, isAll, rightSelect, limit, orderBy, offset }
  }) {
    const leftChunk = (0,sql/* sql */.ll)`(${leftSelect.getSQL()}) `;
    const rightChunk = (0,sql/* sql */.ll)`(${rightSelect.getSQL()})`;
    let orderBySql;
    if (orderBy && orderBy.length > 0) {
      const orderByValues = [];
      for (const singleOrderBy of orderBy) {
        if ((0,entity.is)(singleOrderBy, common/* PgColumn */.Kl)) {
          orderByValues.push(sql/* sql */.ll.identifier(singleOrderBy.name));
        } else if ((0,entity.is)(singleOrderBy, sql/* SQL */.Xs)) {
          for (let i = 0; i < singleOrderBy.queryChunks.length; i++) {
            const chunk = singleOrderBy.queryChunks[i];
            if ((0,entity.is)(chunk, common/* PgColumn */.Kl)) {
              singleOrderBy.queryChunks[i] = sql/* sql */.ll.identifier(chunk.name);
            }
          }
          orderByValues.push((0,sql/* sql */.ll)`${singleOrderBy}`);
        } else {
          orderByValues.push((0,sql/* sql */.ll)`${singleOrderBy}`);
        }
      }
      orderBySql = (0,sql/* sql */.ll)` order by ${sql/* sql */.ll.join(orderByValues, (0,sql/* sql */.ll)`, `)} `;
    }
    const limitSql = typeof limit === "object" || typeof limit === "number" && limit >= 0 ? (0,sql/* sql */.ll)` limit ${limit}` : void 0;
    const operatorChunk = sql/* sql */.ll.raw(`${type} ${isAll ? "all " : ""}`);
    const offsetSql = offset ? (0,sql/* sql */.ll)` offset ${offset}` : void 0;
    return (0,sql/* sql */.ll)`${leftChunk}${operatorChunk}${rightChunk}${orderBySql}${limitSql}${offsetSql}`;
  }
  buildInsertQuery({ table, values: valuesOrSelect, onConflict, returning, withList, select, overridingSystemValue_ }) {
    const valuesSqlList = [];
    const columns = table[drizzle_orm_table/* Table */.XI.Symbol.Columns];
    const colEntries = Object.entries(columns).filter(([_, col]) => !col.shouldDisableInsert());
    const insertOrder = colEntries.map(
      ([, column]) => sql/* sql */.ll.identifier(this.casing.getColumnCasing(column))
    );
    if (select) {
      const select2 = valuesOrSelect;
      if ((0,entity.is)(select2, sql/* SQL */.Xs)) {
        valuesSqlList.push(select2);
      } else {
        valuesSqlList.push(select2.getSQL());
      }
    } else {
      const values = valuesOrSelect;
      valuesSqlList.push(sql/* sql */.ll.raw("values "));
      for (const [valueIndex, value] of values.entries()) {
        const valueList = [];
        for (const [fieldName, col] of colEntries) {
          const colValue = value[fieldName];
          if (colValue === void 0 || (0,entity.is)(colValue, sql/* Param */.Iw) && colValue.value === void 0) {
            if (col.defaultFn !== void 0) {
              const defaultFnResult = col.defaultFn();
              const defaultValue = (0,entity.is)(defaultFnResult, sql/* SQL */.Xs) ? defaultFnResult : sql/* sql */.ll.param(defaultFnResult, col);
              valueList.push(defaultValue);
            } else if (!col.default && col.onUpdateFn !== void 0) {
              const onUpdateFnResult = col.onUpdateFn();
              const newValue = (0,entity.is)(onUpdateFnResult, sql/* SQL */.Xs) ? onUpdateFnResult : sql/* sql */.ll.param(onUpdateFnResult, col);
              valueList.push(newValue);
            } else {
              valueList.push((0,sql/* sql */.ll)`default`);
            }
          } else {
            valueList.push(colValue);
          }
        }
        valuesSqlList.push(valueList);
        if (valueIndex < values.length - 1) {
          valuesSqlList.push((0,sql/* sql */.ll)`, `);
        }
      }
    }
    const withSql = this.buildWithCTE(withList);
    const valuesSql = sql/* sql */.ll.join(valuesSqlList);
    const returningSql = returning ? (0,sql/* sql */.ll)` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const onConflictSql = onConflict ? (0,sql/* sql */.ll)` on conflict ${onConflict}` : void 0;
    const overridingSql = overridingSystemValue_ === true ? (0,sql/* sql */.ll)`overriding system value ` : void 0;
    return (0,sql/* sql */.ll)`${withSql}insert into ${table} ${insertOrder} ${overridingSql}${valuesSql}${onConflictSql}${returningSql}`;
  }
  buildRefreshMaterializedViewQuery({ view, concurrently, withNoData }) {
    const concurrentlySql = concurrently ? (0,sql/* sql */.ll)` concurrently` : void 0;
    const withNoDataSql = withNoData ? (0,sql/* sql */.ll)` with no data` : void 0;
    return (0,sql/* sql */.ll)`refresh materialized view${concurrentlySql} ${view}${withNoDataSql}`;
  }
  prepareTyping(encoder) {
    if ((0,entity.is)(encoder, jsonb/* PgJsonb */.kn) || (0,entity.is)(encoder, json/* PgJson */.iX)) {
      return "json";
    } else if ((0,entity.is)(encoder, numeric/* PgNumeric */.Z5)) {
      return "decimal";
    } else if ((0,entity.is)(encoder, time/* PgTime */.Xd)) {
      return "time";
    } else if ((0,entity.is)(encoder, timestamp/* PgTimestamp */.KM) || (0,entity.is)(encoder, timestamp/* PgTimestampString */.xQ)) {
      return "timestamp";
    } else if ((0,entity.is)(encoder, date/* PgDate */.qw) || (0,entity.is)(encoder, date/* PgDateString */.dw)) {
      return "date";
    } else if ((0,entity.is)(encoder, uuid/* PgUUID */.dL)) {
      return "uuid";
    } else {
      return "none";
    }
  }
  sqlToQuery(sql2, invokeSource) {
    return sql2.toQuery({
      casing: this.casing,
      escapeName: this.escapeName,
      escapeParam: this.escapeParam,
      escapeString: this.escapeString,
      prepareTyping: this.prepareTyping,
      invokeSource
    });
  }
  // buildRelationalQueryWithPK({
  // 	fullSchema,
  // 	schema,
  // 	tableNamesMap,
  // 	table,
  // 	tableConfig,
  // 	queryConfig: config,
  // 	tableAlias,
  // 	isRoot = false,
  // 	joinOn,
  // }: {
  // 	fullSchema: Record<string, unknown>;
  // 	schema: TablesRelationalConfig;
  // 	tableNamesMap: Record<string, string>;
  // 	table: PgTable;
  // 	tableConfig: TableRelationalConfig;
  // 	queryConfig: true | DBQueryConfig<'many', true>;
  // 	tableAlias: string;
  // 	isRoot?: boolean;
  // 	joinOn?: SQL;
  // }): BuildRelationalQueryResult<PgTable, PgColumn> {
  // 	// For { "<relation>": true }, return a table with selection of all columns
  // 	if (config === true) {
  // 		const selectionEntries = Object.entries(tableConfig.columns);
  // 		const selection: BuildRelationalQueryResult<PgTable, PgColumn>['selection'] = selectionEntries.map((
  // 			[key, value],
  // 		) => ({
  // 			dbKey: value.name,
  // 			tsKey: key,
  // 			field: value as PgColumn,
  // 			relationTableTsKey: undefined,
  // 			isJson: false,
  // 			selection: [],
  // 		}));
  // 		return {
  // 			tableTsKey: tableConfig.tsName,
  // 			sql: table,
  // 			selection,
  // 		};
  // 	}
  // 	// let selection: BuildRelationalQueryResult<PgTable, PgColumn>['selection'] = [];
  // 	// let selectionForBuild = selection;
  // 	const aliasedColumns = Object.fromEntries(
  // 		Object.entries(tableConfig.columns).map(([key, value]) => [key, aliasedTableColumn(value, tableAlias)]),
  // 	);
  // 	const aliasedRelations = Object.fromEntries(
  // 		Object.entries(tableConfig.relations).map(([key, value]) => [key, aliasedRelation(value, tableAlias)]),
  // 	);
  // 	const aliasedFields = Object.assign({}, aliasedColumns, aliasedRelations);
  // 	let where, hasUserDefinedWhere;
  // 	if (config.where) {
  // 		const whereSql = typeof config.where === 'function' ? config.where(aliasedFields, operators) : config.where;
  // 		where = whereSql && mapColumnsInSQLToAlias(whereSql, tableAlias);
  // 		hasUserDefinedWhere = !!where;
  // 	}
  // 	where = and(joinOn, where);
  // 	// const fieldsSelection: { tsKey: string; value: PgColumn | SQL.Aliased; isExtra?: boolean }[] = [];
  // 	let joins: Join[] = [];
  // 	let selectedColumns: string[] = [];
  // 	// Figure out which columns to select
  // 	if (config.columns) {
  // 		let isIncludeMode = false;
  // 		for (const [field, value] of Object.entries(config.columns)) {
  // 			if (value === undefined) {
  // 				continue;
  // 			}
  // 			if (field in tableConfig.columns) {
  // 				if (!isIncludeMode && value === true) {
  // 					isIncludeMode = true;
  // 				}
  // 				selectedColumns.push(field);
  // 			}
  // 		}
  // 		if (selectedColumns.length > 0) {
  // 			selectedColumns = isIncludeMode
  // 				? selectedColumns.filter((c) => config.columns?.[c] === true)
  // 				: Object.keys(tableConfig.columns).filter((key) => !selectedColumns.includes(key));
  // 		}
  // 	} else {
  // 		// Select all columns if selection is not specified
  // 		selectedColumns = Object.keys(tableConfig.columns);
  // 	}
  // 	// for (const field of selectedColumns) {
  // 	// 	const column = tableConfig.columns[field]! as PgColumn;
  // 	// 	fieldsSelection.push({ tsKey: field, value: column });
  // 	// }
  // 	let initiallySelectedRelations: {
  // 		tsKey: string;
  // 		queryConfig: true | DBQueryConfig<'many', false>;
  // 		relation: Relation;
  // 	}[] = [];
  // 	// let selectedRelations: BuildRelationalQueryResult<PgTable, PgColumn>['selection'] = [];
  // 	// Figure out which relations to select
  // 	if (config.with) {
  // 		initiallySelectedRelations = Object.entries(config.with)
  // 			.filter((entry): entry is [typeof entry[0], NonNullable<typeof entry[1]>] => !!entry[1])
  // 			.map(([tsKey, queryConfig]) => ({ tsKey, queryConfig, relation: tableConfig.relations[tsKey]! }));
  // 	}
  // 	const manyRelations = initiallySelectedRelations.filter((r) =>
  // 		is(r.relation, Many)
  // 		&& (schema[tableNamesMap[r.relation.referencedTable[Table.Symbol.Name]]!]?.primaryKey.length ?? 0) > 0
  // 	);
  // 	// If this is the last Many relation (or there are no Many relations), we are on the innermost subquery level
  // 	const isInnermostQuery = manyRelations.length < 2;
  // 	const selectedExtras: {
  // 		tsKey: string;
  // 		value: SQL.Aliased;
  // 	}[] = [];
  // 	// Figure out which extras to select
  // 	if (isInnermostQuery && config.extras) {
  // 		const extras = typeof config.extras === 'function'
  // 			? config.extras(aliasedFields, { sql })
  // 			: config.extras;
  // 		for (const [tsKey, value] of Object.entries(extras)) {
  // 			selectedExtras.push({
  // 				tsKey,
  // 				value: mapColumnsInAliasedSQLToAlias(value, tableAlias),
  // 			});
  // 		}
  // 	}
  // 	// Transform `fieldsSelection` into `selection`
  // 	// `fieldsSelection` shouldn't be used after this point
  // 	// for (const { tsKey, value, isExtra } of fieldsSelection) {
  // 	// 	selection.push({
  // 	// 		dbKey: is(value, SQL.Aliased) ? value.fieldAlias : tableConfig.columns[tsKey]!.name,
  // 	// 		tsKey,
  // 	// 		field: is(value, Column) ? aliasedTableColumn(value, tableAlias) : value,
  // 	// 		relationTableTsKey: undefined,
  // 	// 		isJson: false,
  // 	// 		isExtra,
  // 	// 		selection: [],
  // 	// 	});
  // 	// }
  // 	let orderByOrig = typeof config.orderBy === 'function'
  // 		? config.orderBy(aliasedFields, orderByOperators)
  // 		: config.orderBy ?? [];
  // 	if (!Array.isArray(orderByOrig)) {
  // 		orderByOrig = [orderByOrig];
  // 	}
  // 	const orderBy = orderByOrig.map((orderByValue) => {
  // 		if (is(orderByValue, Column)) {
  // 			return aliasedTableColumn(orderByValue, tableAlias) as PgColumn;
  // 		}
  // 		return mapColumnsInSQLToAlias(orderByValue, tableAlias);
  // 	});
  // 	const limit = isInnermostQuery ? config.limit : undefined;
  // 	const offset = isInnermostQuery ? config.offset : undefined;
  // 	// For non-root queries without additional config except columns, return a table with selection
  // 	if (
  // 		!isRoot
  // 		&& initiallySelectedRelations.length === 0
  // 		&& selectedExtras.length === 0
  // 		&& !where
  // 		&& orderBy.length === 0
  // 		&& limit === undefined
  // 		&& offset === undefined
  // 	) {
  // 		return {
  // 			tableTsKey: tableConfig.tsName,
  // 			sql: table,
  // 			selection: selectedColumns.map((key) => ({
  // 				dbKey: tableConfig.columns[key]!.name,
  // 				tsKey: key,
  // 				field: tableConfig.columns[key] as PgColumn,
  // 				relationTableTsKey: undefined,
  // 				isJson: false,
  // 				selection: [],
  // 			})),
  // 		};
  // 	}
  // 	const selectedRelationsWithoutPK:
  // 	// Process all relations without primary keys, because they need to be joined differently and will all be on the same query level
  // 	for (
  // 		const {
  // 			tsKey: selectedRelationTsKey,
  // 			queryConfig: selectedRelationConfigValue,
  // 			relation,
  // 		} of initiallySelectedRelations
  // 	) {
  // 		const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
  // 		const relationTableName = relation.referencedTable[Table.Symbol.Name];
  // 		const relationTableTsName = tableNamesMap[relationTableName]!;
  // 		const relationTable = schema[relationTableTsName]!;
  // 		if (relationTable.primaryKey.length > 0) {
  // 			continue;
  // 		}
  // 		const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
  // 		const joinOn = and(
  // 			...normalizedRelation.fields.map((field, i) =>
  // 				eq(
  // 					aliasedTableColumn(normalizedRelation.references[i]!, relationTableAlias),
  // 					aliasedTableColumn(field, tableAlias),
  // 				)
  // 			),
  // 		);
  // 		const builtRelation = this.buildRelationalQueryWithoutPK({
  // 			fullSchema,
  // 			schema,
  // 			tableNamesMap,
  // 			table: fullSchema[relationTableTsName] as PgTable,
  // 			tableConfig: schema[relationTableTsName]!,
  // 			queryConfig: selectedRelationConfigValue,
  // 			tableAlias: relationTableAlias,
  // 			joinOn,
  // 			nestedQueryRelation: relation,
  // 		});
  // 		const field = sql`${sql.identifier(relationTableAlias)}.${sql.identifier('data')}`.as(selectedRelationTsKey);
  // 		joins.push({
  // 			on: sql`true`,
  // 			table: new Subquery(builtRelation.sql as SQL, {}, relationTableAlias),
  // 			alias: relationTableAlias,
  // 			joinType: 'left',
  // 			lateral: true,
  // 		});
  // 		selectedRelations.push({
  // 			dbKey: selectedRelationTsKey,
  // 			tsKey: selectedRelationTsKey,
  // 			field,
  // 			relationTableTsKey: relationTableTsName,
  // 			isJson: true,
  // 			selection: builtRelation.selection,
  // 		});
  // 	}
  // 	const oneRelations = initiallySelectedRelations.filter((r): r is typeof r & { relation: One } =>
  // 		is(r.relation, One)
  // 	);
  // 	// Process all One relations with PKs, because they can all be joined on the same level
  // 	for (
  // 		const {
  // 			tsKey: selectedRelationTsKey,
  // 			queryConfig: selectedRelationConfigValue,
  // 			relation,
  // 		} of oneRelations
  // 	) {
  // 		const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
  // 		const relationTableName = relation.referencedTable[Table.Symbol.Name];
  // 		const relationTableTsName = tableNamesMap[relationTableName]!;
  // 		const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
  // 		const relationTable = schema[relationTableTsName]!;
  // 		if (relationTable.primaryKey.length === 0) {
  // 			continue;
  // 		}
  // 		const joinOn = and(
  // 			...normalizedRelation.fields.map((field, i) =>
  // 				eq(
  // 					aliasedTableColumn(normalizedRelation.references[i]!, relationTableAlias),
  // 					aliasedTableColumn(field, tableAlias),
  // 				)
  // 			),
  // 		);
  // 		const builtRelation = this.buildRelationalQueryWithPK({
  // 			fullSchema,
  // 			schema,
  // 			tableNamesMap,
  // 			table: fullSchema[relationTableTsName] as PgTable,
  // 			tableConfig: schema[relationTableTsName]!,
  // 			queryConfig: selectedRelationConfigValue,
  // 			tableAlias: relationTableAlias,
  // 			joinOn,
  // 		});
  // 		const field = sql`case when ${sql.identifier(relationTableAlias)} is null then null else json_build_array(${
  // 			sql.join(
  // 				builtRelation.selection.map(({ field }) =>
  // 					is(field, SQL.Aliased)
  // 						? sql`${sql.identifier(relationTableAlias)}.${sql.identifier(field.fieldAlias)}`
  // 						: is(field, Column)
  // 						? aliasedTableColumn(field, relationTableAlias)
  // 						: field
  // 				),
  // 				sql`, `,
  // 			)
  // 		}) end`.as(selectedRelationTsKey);
  // 		const isLateralJoin = is(builtRelation.sql, SQL);
  // 		joins.push({
  // 			on: isLateralJoin ? sql`true` : joinOn,
  // 			table: is(builtRelation.sql, SQL)
  // 				? new Subquery(builtRelation.sql, {}, relationTableAlias)
  // 				: aliasedTable(builtRelation.sql, relationTableAlias),
  // 			alias: relationTableAlias,
  // 			joinType: 'left',
  // 			lateral: is(builtRelation.sql, SQL),
  // 		});
  // 		selectedRelations.push({
  // 			dbKey: selectedRelationTsKey,
  // 			tsKey: selectedRelationTsKey,
  // 			field,
  // 			relationTableTsKey: relationTableTsName,
  // 			isJson: true,
  // 			selection: builtRelation.selection,
  // 		});
  // 	}
  // 	let distinct: PgSelectConfig['distinct'];
  // 	let tableFrom: PgTable | Subquery = table;
  // 	// Process first Many relation - each one requires a nested subquery
  // 	const manyRelation = manyRelations[0];
  // 	if (manyRelation) {
  // 		const {
  // 			tsKey: selectedRelationTsKey,
  // 			queryConfig: selectedRelationQueryConfig,
  // 			relation,
  // 		} = manyRelation;
  // 		distinct = {
  // 			on: tableConfig.primaryKey.map((c) => aliasedTableColumn(c as PgColumn, tableAlias)),
  // 		};
  // 		const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
  // 		const relationTableName = relation.referencedTable[Table.Symbol.Name];
  // 		const relationTableTsName = tableNamesMap[relationTableName]!;
  // 		const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
  // 		const joinOn = and(
  // 			...normalizedRelation.fields.map((field, i) =>
  // 				eq(
  // 					aliasedTableColumn(normalizedRelation.references[i]!, relationTableAlias),
  // 					aliasedTableColumn(field, tableAlias),
  // 				)
  // 			),
  // 		);
  // 		const builtRelationJoin = this.buildRelationalQueryWithPK({
  // 			fullSchema,
  // 			schema,
  // 			tableNamesMap,
  // 			table: fullSchema[relationTableTsName] as PgTable,
  // 			tableConfig: schema[relationTableTsName]!,
  // 			queryConfig: selectedRelationQueryConfig,
  // 			tableAlias: relationTableAlias,
  // 			joinOn,
  // 		});
  // 		const builtRelationSelectionField = sql`case when ${
  // 			sql.identifier(relationTableAlias)
  // 		} is null then '[]' else json_agg(json_build_array(${
  // 			sql.join(
  // 				builtRelationJoin.selection.map(({ field }) =>
  // 					is(field, SQL.Aliased)
  // 						? sql`${sql.identifier(relationTableAlias)}.${sql.identifier(field.fieldAlias)}`
  // 						: is(field, Column)
  // 						? aliasedTableColumn(field, relationTableAlias)
  // 						: field
  // 				),
  // 				sql`, `,
  // 			)
  // 		})) over (partition by ${sql.join(distinct.on, sql`, `)}) end`.as(selectedRelationTsKey);
  // 		const isLateralJoin = is(builtRelationJoin.sql, SQL);
  // 		joins.push({
  // 			on: isLateralJoin ? sql`true` : joinOn,
  // 			table: isLateralJoin
  // 				? new Subquery(builtRelationJoin.sql as SQL, {}, relationTableAlias)
  // 				: aliasedTable(builtRelationJoin.sql as PgTable, relationTableAlias),
  // 			alias: relationTableAlias,
  // 			joinType: 'left',
  // 			lateral: isLateralJoin,
  // 		});
  // 		// Build the "from" subquery with the remaining Many relations
  // 		const builtTableFrom = this.buildRelationalQueryWithPK({
  // 			fullSchema,
  // 			schema,
  // 			tableNamesMap,
  // 			table,
  // 			tableConfig,
  // 			queryConfig: {
  // 				...config,
  // 				where: undefined,
  // 				orderBy: undefined,
  // 				limit: undefined,
  // 				offset: undefined,
  // 				with: manyRelations.slice(1).reduce<NonNullable<typeof config['with']>>(
  // 					(result, { tsKey, queryConfig: configValue }) => {
  // 						result[tsKey] = configValue;
  // 						return result;
  // 					},
  // 					{},
  // 				),
  // 			},
  // 			tableAlias,
  // 		});
  // 		selectedRelations.push({
  // 			dbKey: selectedRelationTsKey,
  // 			tsKey: selectedRelationTsKey,
  // 			field: builtRelationSelectionField,
  // 			relationTableTsKey: relationTableTsName,
  // 			isJson: true,
  // 			selection: builtRelationJoin.selection,
  // 		});
  // 		// selection = builtTableFrom.selection.map((item) =>
  // 		// 	is(item.field, SQL.Aliased)
  // 		// 		? { ...item, field: sql`${sql.identifier(tableAlias)}.${sql.identifier(item.field.fieldAlias)}` }
  // 		// 		: item
  // 		// );
  // 		// selectionForBuild = [{
  // 		// 	dbKey: '*',
  // 		// 	tsKey: '*',
  // 		// 	field: sql`${sql.identifier(tableAlias)}.*`,
  // 		// 	selection: [],
  // 		// 	isJson: false,
  // 		// 	relationTableTsKey: undefined,
  // 		// }];
  // 		// const newSelectionItem: (typeof selection)[number] = {
  // 		// 	dbKey: selectedRelationTsKey,
  // 		// 	tsKey: selectedRelationTsKey,
  // 		// 	field,
  // 		// 	relationTableTsKey: relationTableTsName,
  // 		// 	isJson: true,
  // 		// 	selection: builtRelationJoin.selection,
  // 		// };
  // 		// selection.push(newSelectionItem);
  // 		// selectionForBuild.push(newSelectionItem);
  // 		tableFrom = is(builtTableFrom.sql, PgTable)
  // 			? builtTableFrom.sql
  // 			: new Subquery(builtTableFrom.sql, {}, tableAlias);
  // 	}
  // 	if (selectedColumns.length === 0 && selectedRelations.length === 0 && selectedExtras.length === 0) {
  // 		throw new DrizzleError(`No fields selected for table "${tableConfig.tsName}" ("${tableAlias}")`);
  // 	}
  // 	let selection: BuildRelationalQueryResult<PgTable, PgColumn>['selection'];
  // 	function prepareSelectedColumns() {
  // 		return selectedColumns.map((key) => ({
  // 			dbKey: tableConfig.columns[key]!.name,
  // 			tsKey: key,
  // 			field: tableConfig.columns[key] as PgColumn,
  // 			relationTableTsKey: undefined,
  // 			isJson: false,
  // 			selection: [],
  // 		}));
  // 	}
  // 	function prepareSelectedExtras() {
  // 		return selectedExtras.map((item) => ({
  // 			dbKey: item.value.fieldAlias,
  // 			tsKey: item.tsKey,
  // 			field: item.value,
  // 			relationTableTsKey: undefined,
  // 			isJson: false,
  // 			selection: [],
  // 		}));
  // 	}
  // 	if (isRoot) {
  // 		selection = [
  // 			...prepareSelectedColumns(),
  // 			...prepareSelectedExtras(),
  // 		];
  // 	}
  // 	if (hasUserDefinedWhere || orderBy.length > 0) {
  // 		tableFrom = new Subquery(
  // 			this.buildSelectQuery({
  // 				table: is(tableFrom, PgTable) ? aliasedTable(tableFrom, tableAlias) : tableFrom,
  // 				fields: {},
  // 				fieldsFlat: selectionForBuild.map(({ field }) => ({
  // 					path: [],
  // 					field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field,
  // 				})),
  // 				joins,
  // 				distinct,
  // 			}),
  // 			{},
  // 			tableAlias,
  // 		);
  // 		selectionForBuild = selection.map((item) =>
  // 			is(item.field, SQL.Aliased)
  // 				? { ...item, field: sql`${sql.identifier(tableAlias)}.${sql.identifier(item.field.fieldAlias)}` }
  // 				: item
  // 		);
  // 		joins = [];
  // 		distinct = undefined;
  // 	}
  // 	const result = this.buildSelectQuery({
  // 		table: is(tableFrom, PgTable) ? aliasedTable(tableFrom, tableAlias) : tableFrom,
  // 		fields: {},
  // 		fieldsFlat: selectionForBuild.map(({ field }) => ({
  // 			path: [],
  // 			field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field,
  // 		})),
  // 		where,
  // 		limit,
  // 		offset,
  // 		joins,
  // 		orderBy,
  // 		distinct,
  // 	});
  // 	return {
  // 		tableTsKey: tableConfig.tsName,
  // 		sql: result,
  // 		selection,
  // 	};
  // }
  buildRelationalQueryWithoutPK({
    fullSchema,
    schema,
    tableNamesMap,
    table,
    tableConfig,
    queryConfig: config,
    tableAlias,
    nestedQueryRelation,
    joinOn
  }) {
    let selection = [];
    let limit, offset, orderBy = [], where;
    const joins = [];
    if (config === true) {
      const selectionEntries = Object.entries(tableConfig.columns);
      selection = selectionEntries.map(([key, value]) => ({
        dbKey: value.name,
        tsKey: key,
        field: (0,alias/* aliasedTableColumn */.ug)(value, tableAlias),
        relationTableTsKey: void 0,
        isJson: false,
        selection: []
      }));
    } else {
      const aliasedColumns = Object.fromEntries(
        Object.entries(tableConfig.columns).map(([key, value]) => [key, (0,alias/* aliasedTableColumn */.ug)(value, tableAlias)])
      );
      if (config.where) {
        const whereSql = typeof config.where === "function" ? config.where(aliasedColumns, (0,relations/* getOperators */.mm)()) : config.where;
        where = whereSql && (0,alias/* mapColumnsInSQLToAlias */.yY)(whereSql, tableAlias);
      }
      const fieldsSelection = [];
      let selectedColumns = [];
      if (config.columns) {
        let isIncludeMode = false;
        for (const [field, value] of Object.entries(config.columns)) {
          if (value === void 0) {
            continue;
          }
          if (field in tableConfig.columns) {
            if (!isIncludeMode && value === true) {
              isIncludeMode = true;
            }
            selectedColumns.push(field);
          }
        }
        if (selectedColumns.length > 0) {
          selectedColumns = isIncludeMode ? selectedColumns.filter((c) => config.columns?.[c] === true) : Object.keys(tableConfig.columns).filter((key) => !selectedColumns.includes(key));
        }
      } else {
        selectedColumns = Object.keys(tableConfig.columns);
      }
      for (const field of selectedColumns) {
        const column = tableConfig.columns[field];
        fieldsSelection.push({ tsKey: field, value: column });
      }
      let selectedRelations = [];
      if (config.with) {
        selectedRelations = Object.entries(config.with).filter((entry) => !!entry[1]).map(([tsKey, queryConfig]) => ({ tsKey, queryConfig, relation: tableConfig.relations[tsKey] }));
      }
      let extras;
      if (config.extras) {
        extras = typeof config.extras === "function" ? config.extras(aliasedColumns, { sql: sql/* sql */.ll }) : config.extras;
        for (const [tsKey, value] of Object.entries(extras)) {
          fieldsSelection.push({
            tsKey,
            value: (0,alias/* mapColumnsInAliasedSQLToAlias */.Hs)(value, tableAlias)
          });
        }
      }
      for (const { tsKey, value } of fieldsSelection) {
        selection.push({
          dbKey: (0,entity.is)(value, sql/* SQL */.Xs.Aliased) ? value.fieldAlias : tableConfig.columns[tsKey].name,
          tsKey,
          field: (0,entity.is)(value, column/* Column */.V) ? (0,alias/* aliasedTableColumn */.ug)(value, tableAlias) : value,
          relationTableTsKey: void 0,
          isJson: false,
          selection: []
        });
      }
      let orderByOrig = typeof config.orderBy === "function" ? config.orderBy(aliasedColumns, (0,relations/* getOrderByOperators */.rl)()) : config.orderBy ?? [];
      if (!Array.isArray(orderByOrig)) {
        orderByOrig = [orderByOrig];
      }
      orderBy = orderByOrig.map((orderByValue) => {
        if ((0,entity.is)(orderByValue, column/* Column */.V)) {
          return (0,alias/* aliasedTableColumn */.ug)(orderByValue, tableAlias);
        }
        return (0,alias/* mapColumnsInSQLToAlias */.yY)(orderByValue, tableAlias);
      });
      limit = config.limit;
      offset = config.offset;
      for (const {
        tsKey: selectedRelationTsKey,
        queryConfig: selectedRelationConfigValue,
        relation
      } of selectedRelations) {
        const normalizedRelation = (0,relations/* normalizeRelation */.W0)(schema, tableNamesMap, relation);
        const relationTableName = (0,drizzle_orm_table/* getTableUniqueName */.Lf)(relation.referencedTable);
        const relationTableTsName = tableNamesMap[relationTableName];
        const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
        const joinOn2 = (0,conditions/* and */.Uo)(
          ...normalizedRelation.fields.map(
            (field2, i) => (0,conditions.eq)(
              (0,alias/* aliasedTableColumn */.ug)(normalizedRelation.references[i], relationTableAlias),
              (0,alias/* aliasedTableColumn */.ug)(field2, tableAlias)
            )
          )
        );
        const builtRelation = this.buildRelationalQueryWithoutPK({
          fullSchema,
          schema,
          tableNamesMap,
          table: fullSchema[relationTableTsName],
          tableConfig: schema[relationTableTsName],
          queryConfig: (0,entity.is)(relation, relations/* One */.pD) ? selectedRelationConfigValue === true ? { limit: 1 } : { ...selectedRelationConfigValue, limit: 1 } : selectedRelationConfigValue,
          tableAlias: relationTableAlias,
          joinOn: joinOn2,
          nestedQueryRelation: relation
        });
        const field = (0,sql/* sql */.ll)`${sql/* sql */.ll.identifier(relationTableAlias)}.${sql/* sql */.ll.identifier("data")}`.as(selectedRelationTsKey);
        joins.push({
          on: (0,sql/* sql */.ll)`true`,
          table: new subquery/* Subquery */.n(builtRelation.sql, {}, relationTableAlias),
          alias: relationTableAlias,
          joinType: "left",
          lateral: true
        });
        selection.push({
          dbKey: selectedRelationTsKey,
          tsKey: selectedRelationTsKey,
          field,
          relationTableTsKey: relationTableTsName,
          isJson: true,
          selection: builtRelation.selection
        });
      }
    }
    if (selection.length === 0) {
      throw new errors/* DrizzleError */.n9({ message: `No fields selected for table "${tableConfig.tsName}" ("${tableAlias}")` });
    }
    let result;
    where = (0,conditions/* and */.Uo)(joinOn, where);
    if (nestedQueryRelation) {
      let field = (0,sql/* sql */.ll)`json_build_array(${sql/* sql */.ll.join(
        selection.map(
          ({ field: field2, tsKey, isJson }) => isJson ? (0,sql/* sql */.ll)`${sql/* sql */.ll.identifier(`${tableAlias}_${tsKey}`)}.${sql/* sql */.ll.identifier("data")}` : (0,entity.is)(field2, sql/* SQL */.Xs.Aliased) ? field2.sql : field2
        ),
        (0,sql/* sql */.ll)`, `
      )})`;
      if ((0,entity.is)(nestedQueryRelation, relations/* Many */.iv)) {
        field = (0,sql/* sql */.ll)`coalesce(json_agg(${field}${orderBy.length > 0 ? (0,sql/* sql */.ll)` order by ${sql/* sql */.ll.join(orderBy, (0,sql/* sql */.ll)`, `)}` : void 0}), '[]'::json)`;
      }
      const nestedSelection = [{
        dbKey: "data",
        tsKey: "data",
        field: field.as("data"),
        isJson: true,
        relationTableTsKey: tableConfig.tsName,
        selection
      }];
      const needsSubquery = limit !== void 0 || offset !== void 0 || orderBy.length > 0;
      if (needsSubquery) {
        result = this.buildSelectQuery({
          table: (0,alias/* aliasedTable */.oG)(table, tableAlias),
          fields: {},
          fieldsFlat: [{
            path: [],
            field: sql/* sql */.ll.raw("*")
          }],
          where,
          limit,
          offset,
          orderBy,
          setOperators: []
        });
        where = void 0;
        limit = void 0;
        offset = void 0;
        orderBy = [];
      } else {
        result = (0,alias/* aliasedTable */.oG)(table, tableAlias);
      }
      result = this.buildSelectQuery({
        table: (0,entity.is)(result, pg_core_table/* PgTable */.mu) ? result : new subquery/* Subquery */.n(result, {}, tableAlias),
        fields: {},
        fieldsFlat: nestedSelection.map(({ field: field2 }) => ({
          path: [],
          field: (0,entity.is)(field2, column/* Column */.V) ? (0,alias/* aliasedTableColumn */.ug)(field2, tableAlias) : field2
        })),
        joins,
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    } else {
      result = this.buildSelectQuery({
        table: (0,alias/* aliasedTable */.oG)(table, tableAlias),
        fields: {},
        fieldsFlat: selection.map(({ field }) => ({
          path: [],
          field: (0,entity.is)(field, column/* Column */.V) ? (0,alias/* aliasedTableColumn */.ug)(field, tableAlias) : field
        })),
        joins,
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    }
    return {
      tableTsKey: tableConfig.tsName,
      sql: result,
      selection
    };
  }
}

//# sourceMappingURL=dialect.js.map
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/selection-proxy.js
var selection_proxy = __webpack_require__(37406);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/query-builders/query-builder.js
var query_builder = __webpack_require__(45399);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/query-promise.js
var query_promise = __webpack_require__(61753);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/tracing.js + 1 modules
var tracing = __webpack_require__(63186);
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/utils.js














function getTableConfig(table) {
  const columns = Object.values(table[Table.Symbol.Columns]);
  const indexes = [];
  const checks = [];
  const primaryKeys = [];
  const foreignKeys = Object.values(table[PgTable.Symbol.InlineForeignKeys]);
  const uniqueConstraints = [];
  const name = table[Table.Symbol.Name];
  const schema = table[Table.Symbol.Schema];
  const policies = [];
  const enableRLS = table[PgTable.Symbol.EnableRLS];
  const extraConfigBuilder = table[PgTable.Symbol.ExtraConfigBuilder];
  if (extraConfigBuilder !== void 0) {
    const extraConfig = extraConfigBuilder(table[Table.Symbol.ExtraConfigColumns]);
    const extraValues = Array.isArray(extraConfig) ? extraConfig.flat(1) : Object.values(extraConfig);
    for (const builder of extraValues) {
      if (is(builder, IndexBuilder)) {
        indexes.push(builder.build(table));
      } else if (is(builder, CheckBuilder)) {
        checks.push(builder.build(table));
      } else if (is(builder, UniqueConstraintBuilder)) {
        uniqueConstraints.push(builder.build(table));
      } else if (is(builder, PrimaryKeyBuilder)) {
        primaryKeys.push(builder.build(table));
      } else if (is(builder, ForeignKeyBuilder)) {
        foreignKeys.push(builder.build(table));
      } else if (is(builder, PgPolicy)) {
        policies.push(builder);
      }
    }
  }
  return {
    columns,
    indexes,
    foreignKeys,
    checks,
    primaryKeys,
    uniqueConstraints,
    name,
    schema,
    policies,
    enableRLS
  };
}
function extractUsedTable(table) {
  if ((0,entity.is)(table, pg_core_table/* PgTable */.mu)) {
    return [table[drizzle_orm_table/* Schema */.Sj] ? `${table[drizzle_orm_table/* Schema */.Sj]}.${table[drizzle_orm_table/* Table */.XI.Symbol.BaseName]}` : table[drizzle_orm_table/* Table */.XI.Symbol.BaseName]];
  }
  if ((0,entity.is)(table, subquery/* Subquery */.n)) {
    return table._.usedTables ?? [];
  }
  if ((0,entity.is)(table, sql/* SQL */.Xs)) {
    return table.usedTables ?? [];
  }
  return [];
}
function getViewConfig(view) {
  return {
    ...view[ViewBaseConfig],
    ...view[PgViewConfig]
  };
}
function getMaterializedViewConfig(view) {
  return {
    ...view[ViewBaseConfig],
    ...view[PgMaterializedViewConfig]
  };
}

//# sourceMappingURL=utils.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/query-builders/select.js













class PgSelectBuilder {
  static [entity/* entityKind */.i] = "PgSelectBuilder";
  fields;
  session;
  dialect;
  withList = [];
  distinct;
  constructor(config) {
    this.fields = config.fields;
    this.session = config.session;
    this.dialect = config.dialect;
    if (config.withList) {
      this.withList = config.withList;
    }
    this.distinct = config.distinct;
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  /**
   * Specify the table, subquery, or other target that you're
   * building a select query against.
   *
   * {@link https://www.postgresql.org/docs/current/sql-select.html#SQL-FROM | Postgres from documentation}
   */
  from(source) {
    const isPartialSelect = !!this.fields;
    const src = source;
    let fields;
    if (this.fields) {
      fields = this.fields;
    } else if ((0,entity.is)(src, subquery/* Subquery */.n)) {
      fields = Object.fromEntries(
        Object.keys(src._.selectedFields).map((key) => [key, src[key]])
      );
    } else if ((0,entity.is)(src, PgViewBase)) {
      fields = src[view_common/* ViewBaseConfig */.n].selectedFields;
    } else if ((0,entity.is)(src, sql/* SQL */.Xs)) {
      fields = {};
    } else {
      fields = (0,utils/* getTableColumns */.YD)(src);
    }
    return new PgSelectBase({
      table: src,
      fields,
      isPartialSelect,
      session: this.session,
      dialect: this.dialect,
      withList: this.withList,
      distinct: this.distinct
    }).setToken(this.authToken);
  }
}
class PgSelectQueryBuilderBase extends query_builder/* TypedQueryBuilder */.O {
  static [entity/* entityKind */.i] = "PgSelectQueryBuilder";
  _;
  config;
  joinsNotNullableMap;
  tableName;
  isPartialSelect;
  session;
  dialect;
  cacheConfig = void 0;
  usedTables = /* @__PURE__ */ new Set();
  constructor({ table, fields, isPartialSelect, session, dialect, withList, distinct }) {
    super();
    this.config = {
      withList,
      table,
      fields: { ...fields },
      distinct,
      setOperators: []
    };
    this.isPartialSelect = isPartialSelect;
    this.session = session;
    this.dialect = dialect;
    this._ = {
      selectedFields: fields,
      config: this.config
    };
    this.tableName = (0,utils/* getTableLikeName */.zN)(table);
    this.joinsNotNullableMap = typeof this.tableName === "string" ? { [this.tableName]: true } : {};
    for (const item of extractUsedTable(table)) this.usedTables.add(item);
  }
  /** @internal */
  getUsedTables() {
    return [...this.usedTables];
  }
  createJoin(joinType, lateral) {
    return (table, on) => {
      const baseTableName = this.tableName;
      const tableName = (0,utils/* getTableLikeName */.zN)(table);
      for (const item of extractUsedTable(table)) this.usedTables.add(item);
      if (typeof tableName === "string" && this.config.joins?.some((join) => join.alias === tableName)) {
        throw new Error(`Alias "${tableName}" is already used in this query`);
      }
      if (!this.isPartialSelect) {
        if (Object.keys(this.joinsNotNullableMap).length === 1 && typeof baseTableName === "string") {
          this.config.fields = {
            [baseTableName]: this.config.fields
          };
        }
        if (typeof tableName === "string" && !(0,entity.is)(table, sql/* SQL */.Xs)) {
          const selection = (0,entity.is)(table, subquery/* Subquery */.n) ? table._.selectedFields : (0,entity.is)(table, sql/* View */.Ss) ? table[view_common/* ViewBaseConfig */.n].selectedFields : table[drizzle_orm_table/* Table */.XI.Symbol.Columns];
          this.config.fields[tableName] = selection;
        }
      }
      if (typeof on === "function") {
        on = on(
          new Proxy(
            this.config.fields,
            new selection_proxy/* SelectionProxyHandler */.b({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          )
        );
      }
      if (!this.config.joins) {
        this.config.joins = [];
      }
      this.config.joins.push({ on, table, joinType, alias: tableName, lateral });
      if (typeof tableName === "string") {
        switch (joinType) {
          case "left": {
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
          case "right": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "cross":
          case "inner": {
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "full": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
        }
      }
      return this;
    };
  }
  /**
   * Executes a `left join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the table with the corresponding row from the joined table, if a match is found. If no matching row exists, it sets all columns of the joined table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#left-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet | null; }[] = await db.select()
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number | null; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  leftJoin = this.createJoin("left", false);
  /**
   * Executes a `left join lateral` operation by adding subquery to the current query.
   *
   * A `lateral` join allows the right-hand expression to refer to columns from the left-hand side.
   *
   * Calling this method associates each row of the table with the corresponding row from the joined table, if a match is found. If no matching row exists, it sets all columns of the joined table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#left-join-lateral}
   *
   * @param table the subquery to join.
   * @param on the `on` clause.
   */
  leftJoinLateral = this.createJoin("left", true);
  /**
   * Executes a `right join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the joined table with the corresponding row from the main table, if a match is found. If no matching row exists, it sets all columns of the main table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#right-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User | null; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number | null; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  rightJoin = this.createJoin("right", false);
  /**
   * Executes an `inner join` operation, creating a new table by combining rows from two tables that have matching values.
   *
   * Calling this method retrieves rows that have corresponding entries in both joined tables. Rows without matching entries in either table are excluded, resulting in a table that includes only matching pairs.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#inner-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  innerJoin = this.createJoin("inner", false);
  /**
   * Executes an `inner join lateral` operation, creating a new table by combining rows from two queries that have matching values.
   *
   * A `lateral` join allows the right-hand expression to refer to columns from the left-hand side.
   *
   * Calling this method retrieves rows that have corresponding entries in both joined tables. Rows without matching entries in either table are excluded, resulting in a table that includes only matching pairs.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#inner-join-lateral}
   *
   * @param table the subquery to join.
   * @param on the `on` clause.
   */
  innerJoinLateral = this.createJoin("inner", true);
  /**
   * Executes a `full join` operation by combining rows from two tables into a new table.
   *
   * Calling this method retrieves all rows from both main and joined tables, merging rows with matching values and filling in `null` for non-matching columns.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#full-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User | null; pets: Pet | null; }[] = await db.select()
   *   .from(users)
   *   .fullJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number | null; petId: number | null; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .fullJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  fullJoin = this.createJoin("full", false);
  /**
   * Executes a `cross join` operation by combining rows from two tables into a new table.
   *
   * Calling this method retrieves all rows from both main and joined tables, merging all rows from each table.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#cross-join}
   *
   * @param table the table to join.
   *
   * @example
   *
   * ```ts
   * // Select all users, each user with every pet
   * const usersWithPets: { user: User; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .crossJoin(pets)
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .crossJoin(pets)
   * ```
   */
  crossJoin = this.createJoin("cross", false);
  /**
   * Executes a `cross join lateral` operation by combining rows from two queries into a new table.
   *
   * A `lateral` join allows the right-hand expression to refer to columns from the left-hand side.
   *
   * Calling this method retrieves all rows from both main and joined queries, merging all rows from each query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#cross-join-lateral}
   *
   * @param table the query to join.
   */
  crossJoinLateral = this.createJoin("cross", true);
  createSetOperator(type, isAll) {
    return (rightSelection) => {
      const rightSelect = typeof rightSelection === "function" ? rightSelection(getPgSetOperators()) : rightSelection;
      if (!(0,utils/* haveSameKeys */.DV)(this.getSelectedFields(), rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
      this.config.setOperators.push({ type, isAll, rightSelect });
      return this;
    };
  }
  /**
   * Adds `union` set operator to the query.
   *
   * Calling this method will combine the result sets of the `select` statements and remove any duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union}
   *
   * @example
   *
   * ```ts
   * // Select all unique names from customers and users tables
   * await db.select({ name: users.name })
   *   .from(users)
   *   .union(
   *     db.select({ name: customers.name }).from(customers)
   *   );
   * // or
   * import { union } from 'drizzle-orm/pg-core'
   *
   * await union(
   *   db.select({ name: users.name }).from(users),
   *   db.select({ name: customers.name }).from(customers)
   * );
   * ```
   */
  union = this.createSetOperator("union", false);
  /**
   * Adds `union all` set operator to the query.
   *
   * Calling this method will combine the result-set of the `select` statements and keep all duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union-all}
   *
   * @example
   *
   * ```ts
   * // Select all transaction ids from both online and in-store sales
   * await db.select({ transaction: onlineSales.transactionId })
   *   .from(onlineSales)
   *   .unionAll(
   *     db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   *   );
   * // or
   * import { unionAll } from 'drizzle-orm/pg-core'
   *
   * await unionAll(
   *   db.select({ transaction: onlineSales.transactionId }).from(onlineSales),
   *   db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   * );
   * ```
   */
  unionAll = this.createSetOperator("union", true);
  /**
   * Adds `intersect` set operator to the query.
   *
   * Calling this method will retain only the rows that are present in both result sets and eliminate duplicates.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#intersect}
   *
   * @example
   *
   * ```ts
   * // Select course names that are offered in both departments A and B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .intersect(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { intersect } from 'drizzle-orm/pg-core'
   *
   * await intersect(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  intersect = this.createSetOperator("intersect", false);
  /**
   * Adds `intersect all` set operator to the query.
   *
   * Calling this method will retain only the rows that are present in both result sets including all duplicates.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#intersect-all}
   *
   * @example
   *
   * ```ts
   * // Select all products and quantities that are ordered by both regular and VIP customers
   * await db.select({
   *   productId: regularCustomerOrders.productId,
   *   quantityOrdered: regularCustomerOrders.quantityOrdered
   * })
   * .from(regularCustomerOrders)
   * .intersectAll(
   *   db.select({
   *     productId: vipCustomerOrders.productId,
   *     quantityOrdered: vipCustomerOrders.quantityOrdered
   *   })
   *   .from(vipCustomerOrders)
   * );
   * // or
   * import { intersectAll } from 'drizzle-orm/pg-core'
   *
   * await intersectAll(
   *   db.select({
   *     productId: regularCustomerOrders.productId,
   *     quantityOrdered: regularCustomerOrders.quantityOrdered
   *   })
   *   .from(regularCustomerOrders),
   *   db.select({
   *     productId: vipCustomerOrders.productId,
   *     quantityOrdered: vipCustomerOrders.quantityOrdered
   *   })
   *   .from(vipCustomerOrders)
   * );
   * ```
   */
  intersectAll = this.createSetOperator("intersect", true);
  /**
   * Adds `except` set operator to the query.
   *
   * Calling this method will retrieve all unique rows from the left query, except for the rows that are present in the result set of the right query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#except}
   *
   * @example
   *
   * ```ts
   * // Select all courses offered in department A but not in department B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .except(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { except } from 'drizzle-orm/pg-core'
   *
   * await except(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  except = this.createSetOperator("except", false);
  /**
   * Adds `except all` set operator to the query.
   *
   * Calling this method will retrieve all rows from the left query, except for the rows that are present in the result set of the right query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#except-all}
   *
   * @example
   *
   * ```ts
   * // Select all products that are ordered by regular customers but not by VIP customers
   * await db.select({
   *   productId: regularCustomerOrders.productId,
   *   quantityOrdered: regularCustomerOrders.quantityOrdered,
   * })
   * .from(regularCustomerOrders)
   * .exceptAll(
   *   db.select({
   *     productId: vipCustomerOrders.productId,
   *     quantityOrdered: vipCustomerOrders.quantityOrdered,
   *   })
   *   .from(vipCustomerOrders)
   * );
   * // or
   * import { exceptAll } from 'drizzle-orm/pg-core'
   *
   * await exceptAll(
   *   db.select({
   *     productId: regularCustomerOrders.productId,
   *     quantityOrdered: regularCustomerOrders.quantityOrdered
   *   })
   *   .from(regularCustomerOrders),
   *   db.select({
   *     productId: vipCustomerOrders.productId,
   *     quantityOrdered: vipCustomerOrders.quantityOrdered
   *   })
   *   .from(vipCustomerOrders)
   * );
   * ```
   */
  exceptAll = this.createSetOperator("except", true);
  /** @internal */
  addSetOperators(setOperators) {
    this.config.setOperators.push(...setOperators);
    return this;
  }
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#filtering}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be selected.
   *
   * ```ts
   * // Select all cars with green color
   * await db.select().from(cars).where(eq(cars.color, 'green'));
   * // or
   * await db.select().from(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Select all BMW cars with a green color
   * await db.select().from(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Select all cars with the green or blue color
   * await db.select().from(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    if (typeof where === "function") {
      where = where(
        new Proxy(
          this.config.fields,
          new selection_proxy/* SelectionProxyHandler */.b({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.where = where;
    return this;
  }
  /**
   * Adds a `having` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition. It is typically used with aggregate functions to filter the aggregated data based on a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#aggregations}
   *
   * @param having the `having` clause.
   *
   * @example
   *
   * ```ts
   * // Select all brands with more than one car
   * await db.select({
   * 	brand: cars.brand,
   * 	count: sql<number>`cast(count(${cars.id}) as int)`,
   * })
   *   .from(cars)
   *   .groupBy(cars.brand)
   *   .having(({ count }) => gt(count, 1));
   * ```
   */
  having(having) {
    if (typeof having === "function") {
      having = having(
        new Proxy(
          this.config.fields,
          new selection_proxy/* SelectionProxyHandler */.b({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.having = having;
    return this;
  }
  groupBy(...columns) {
    if (typeof columns[0] === "function") {
      const groupBy = columns[0](
        new Proxy(
          this.config.fields,
          new selection_proxy/* SelectionProxyHandler */.b({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      this.config.groupBy = Array.isArray(groupBy) ? groupBy : [groupBy];
    } else {
      this.config.groupBy = columns;
    }
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.fields,
          new selection_proxy/* SelectionProxyHandler */.b({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    } else {
      const orderByArray = columns;
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    }
    return this;
  }
  /**
   * Adds a `limit` clause to the query.
   *
   * Calling this method will set the maximum number of rows that will be returned by this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param limit the `limit` clause.
   *
   * @example
   *
   * ```ts
   * // Get the first 10 people from this query.
   * await db.select().from(people).limit(10);
   * ```
   */
  limit(limit) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).limit = limit;
    } else {
      this.config.limit = limit;
    }
    return this;
  }
  /**
   * Adds an `offset` clause to the query.
   *
   * Calling this method will skip a number of rows when returning results from this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param offset the `offset` clause.
   *
   * @example
   *
   * ```ts
   * // Get the 10th-20th people from this query.
   * await db.select().from(people).offset(10).limit(10);
   * ```
   */
  offset(offset) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).offset = offset;
    } else {
      this.config.offset = offset;
    }
    return this;
  }
  /**
   * Adds a `for` clause to the query.
   *
   * Calling this method will specify a lock strength for this query that controls how strictly it acquires exclusive access to the rows being queried.
   *
   * See docs: {@link https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE}
   *
   * @param strength the lock strength.
   * @param config the lock configuration.
   */
  for(strength, config = {}) {
    this.config.lockingClause = { strength, config };
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildSelectQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  as(alias) {
    const usedTables = [];
    usedTables.push(...extractUsedTable(this.config.table));
    if (this.config.joins) {
      for (const it of this.config.joins) usedTables.push(...extractUsedTable(it.table));
    }
    return new Proxy(
      new subquery/* Subquery */.n(this.getSQL(), this.config.fields, alias, false, [...new Set(usedTables)]),
      new selection_proxy/* SelectionProxyHandler */.b({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  /** @internal */
  getSelectedFields() {
    return new Proxy(
      this.config.fields,
      new selection_proxy/* SelectionProxyHandler */.b({ alias: this.tableName, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  $dynamic() {
    return this;
  }
  $withCache(config) {
    this.cacheConfig = config === void 0 ? { config: {}, enable: true, autoInvalidate: true } : config === false ? { enable: false } : { enable: true, autoInvalidate: true, ...config };
    return this;
  }
}
class PgSelectBase extends PgSelectQueryBuilderBase {
  static [entity/* entityKind */.i] = "PgSelect";
  /** @internal */
  _prepare(name) {
    const { session, config, dialect, joinsNotNullableMap, authToken, cacheConfig, usedTables } = this;
    if (!session) {
      throw new Error("Cannot execute a query on a query builder. Please use a database instance instead.");
    }
    const { fields } = config;
    return tracing/* tracer */.k.startActiveSpan("drizzle.prepareQuery", () => {
      const fieldsList = (0,utils/* orderSelectedFields */.He)(fields);
      const query = session.prepareQuery(dialect.sqlToQuery(this.getSQL()), fieldsList, name, true, void 0, {
        type: "select",
        tables: [...usedTables]
      }, cacheConfig);
      query.joinsNotNullableMap = joinsNotNullableMap;
      return query.setToken(authToken);
    });
  }
  /**
   * Create a prepared statement for this query. This allows
   * the database to remember this query for the given session
   * and call it by name, rather than specifying the full query.
   *
   * {@link https://www.postgresql.org/docs/current/sql-prepare.html | Postgres prepare documentation}
   */
  prepare(name) {
    return this._prepare(name);
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute = (placeholderValues) => {
    return tracing/* tracer */.k.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(placeholderValues, this.authToken);
    });
  };
}
(0,utils/* applyMixins */.XJ)(PgSelectBase, [query_promise/* QueryPromise */.k]);
function createSetOperator(type, isAll) {
  return (leftSelect, rightSelect, ...restSelects) => {
    const setOperators = [rightSelect, ...restSelects].map((select) => ({
      type,
      isAll,
      rightSelect: select
    }));
    for (const setOperator of setOperators) {
      if (!(0,utils/* haveSameKeys */.DV)(leftSelect.getSelectedFields(), setOperator.rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
    }
    return leftSelect.addSetOperators(setOperators);
  };
}
const getPgSetOperators = () => ({
  union,
  unionAll,
  intersect,
  intersectAll,
  except,
  exceptAll
});
const union = createSetOperator("union", false);
const unionAll = createSetOperator("union", true);
const intersect = createSetOperator("intersect", false);
const intersectAll = createSetOperator("intersect", true);
const except = createSetOperator("except", false);
const exceptAll = createSetOperator("except", true);

//# sourceMappingURL=select.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/query-builders/query-builder.js





class QueryBuilder {
  static [entity/* entityKind */.i] = "PgQueryBuilder";
  dialect;
  dialectConfig;
  constructor(dialect) {
    this.dialect = (0,entity.is)(dialect, PgDialect) ? dialect : void 0;
    this.dialectConfig = (0,entity.is)(dialect, PgDialect) ? void 0 : dialect;
  }
  $with = (alias, selection) => {
    const queryBuilder = this;
    const as = (qb) => {
      if (typeof qb === "function") {
        qb = qb(queryBuilder);
      }
      return new Proxy(
        new subquery/* WithSubquery */.J(
          qb.getSQL(),
          selection ?? ("getSelectedFields" in qb ? qb.getSelectedFields() ?? {} : {}),
          alias,
          true
        ),
        new selection_proxy/* SelectionProxyHandler */.b({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
      );
    };
    return { as };
  };
  with(...queries) {
    const self = this;
    function select(fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        withList: queries
      });
    }
    function selectDistinct(fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        distinct: true
      });
    }
    function selectDistinctOn(on, fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        distinct: { on }
      });
    }
    return { select, selectDistinct, selectDistinctOn };
  }
  select(fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: void 0,
      dialect: this.getDialect()
    });
  }
  selectDistinct(fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: void 0,
      dialect: this.getDialect(),
      distinct: true
    });
  }
  selectDistinctOn(on, fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: void 0,
      dialect: this.getDialect(),
      distinct: { on }
    });
  }
  // Lazy load dialect to avoid circular dependency
  getDialect() {
    if (!this.dialect) {
      this.dialect = new PgDialect(this.dialectConfig);
    }
    return this.dialect;
  }
}

//# sourceMappingURL=query-builder.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/query-builders/update.js










class PgUpdateBuilder {
  constructor(table, session, dialect, withList) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
  }
  static [entity/* entityKind */.i] = "PgUpdateBuilder";
  authToken;
  setToken(token) {
    this.authToken = token;
    return this;
  }
  set(values) {
    return new PgUpdateBase(
      this.table,
      (0,utils/* mapUpdateSet */.q)(this.table, values),
      this.session,
      this.dialect,
      this.withList
    ).setToken(this.authToken);
  }
}
class PgUpdateBase extends query_promise/* QueryPromise */.k {
  constructor(table, set, session, dialect, withList) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { set, table, withList, joins: [] };
    this.tableName = (0,utils/* getTableLikeName */.zN)(table);
    this.joinsNotNullableMap = typeof this.tableName === "string" ? { [this.tableName]: true } : {};
  }
  static [entity/* entityKind */.i] = "PgUpdate";
  config;
  tableName;
  joinsNotNullableMap;
  cacheConfig;
  from(source) {
    const src = source;
    const tableName = (0,utils/* getTableLikeName */.zN)(src);
    if (typeof tableName === "string") {
      this.joinsNotNullableMap[tableName] = true;
    }
    this.config.from = src;
    return this;
  }
  getTableLikeFields(table) {
    if ((0,entity.is)(table, pg_core_table/* PgTable */.mu)) {
      return table[drizzle_orm_table/* Table */.XI.Symbol.Columns];
    } else if ((0,entity.is)(table, subquery/* Subquery */.n)) {
      return table._.selectedFields;
    }
    return table[view_common/* ViewBaseConfig */.n].selectedFields;
  }
  createJoin(joinType) {
    return (table, on) => {
      const tableName = (0,utils/* getTableLikeName */.zN)(table);
      if (typeof tableName === "string" && this.config.joins.some((join) => join.alias === tableName)) {
        throw new Error(`Alias "${tableName}" is already used in this query`);
      }
      if (typeof on === "function") {
        const from = this.config.from && !(0,entity.is)(this.config.from, sql/* SQL */.Xs) ? this.getTableLikeFields(this.config.from) : void 0;
        on = on(
          new Proxy(
            this.config.table[drizzle_orm_table/* Table */.XI.Symbol.Columns],
            new selection_proxy/* SelectionProxyHandler */.b({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          ),
          from && new Proxy(
            from,
            new selection_proxy/* SelectionProxyHandler */.b({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          )
        );
      }
      this.config.joins.push({ on, table, joinType, alias: tableName });
      if (typeof tableName === "string") {
        switch (joinType) {
          case "left": {
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
          case "right": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "inner": {
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "full": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
        }
      }
      return this;
    };
  }
  leftJoin = this.createJoin("left");
  rightJoin = this.createJoin("right");
  innerJoin = this.createJoin("inner");
  fullJoin = this.createJoin("full");
  /**
   * Adds a 'where' clause to the query.
   *
   * Calling this method will update only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param where the 'where' clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be updated.
   *
   * ```ts
   * // Update all cars with green color
   * await db.update(cars).set({ color: 'red' })
   *   .where(eq(cars.color, 'green'));
   * // or
   * await db.update(cars).set({ color: 'red' })
   *   .where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Update all BMW cars with a green color
   * await db.update(cars).set({ color: 'red' })
   *   .where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Update all cars with the green or blue color
   * await db.update(cars).set({ color: 'red' })
   *   .where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  returning(fields) {
    if (!fields) {
      fields = Object.assign({}, this.config.table[drizzle_orm_table/* Table */.XI.Symbol.Columns]);
      if (this.config.from) {
        const tableName = (0,utils/* getTableLikeName */.zN)(this.config.from);
        if (typeof tableName === "string" && this.config.from && !(0,entity.is)(this.config.from, sql/* SQL */.Xs)) {
          const fromFields = this.getTableLikeFields(this.config.from);
          fields[tableName] = fromFields;
        }
        for (const join of this.config.joins) {
          const tableName2 = (0,utils/* getTableLikeName */.zN)(join.table);
          if (typeof tableName2 === "string" && !(0,entity.is)(join.table, sql/* SQL */.Xs)) {
            const fromFields = this.getTableLikeFields(join.table);
            fields[tableName2] = fromFields;
          }
        }
      }
    }
    this.config.returningFields = fields;
    this.config.returning = (0,utils/* orderSelectedFields */.He)(fields);
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildUpdateQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(name) {
    const query = this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), this.config.returning, name, true, void 0, {
      type: "insert",
      tables: extractUsedTable(this.config.table)
    }, this.cacheConfig);
    query.joinsNotNullableMap = this.joinsNotNullableMap;
    return query;
  }
  prepare(name) {
    return this._prepare(name);
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute = (placeholderValues) => {
    return this._prepare().execute(placeholderValues, this.authToken);
  };
  /** @internal */
  getSelectedFields() {
    return this.config.returningFields ? new Proxy(
      this.config.returningFields,
      new selection_proxy/* SelectionProxyHandler */.b({
        alias: (0,drizzle_orm_table/* getTableName */.Io)(this.config.table),
        sqlAliasedBehavior: "alias",
        sqlBehavior: "error"
      })
    ) : void 0;
  }
  $dynamic() {
    return this;
  }
}

//# sourceMappingURL=update.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/query-builders/insert.js









class PgInsertBuilder {
  constructor(table, session, dialect, withList, overridingSystemValue_) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
    this.overridingSystemValue_ = overridingSystemValue_;
  }
  static [entity/* entityKind */.i] = "PgInsertBuilder";
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  overridingSystemValue() {
    this.overridingSystemValue_ = true;
    return this;
  }
  values(values) {
    values = Array.isArray(values) ? values : [values];
    if (values.length === 0) {
      throw new Error("values() must be called with at least one value");
    }
    const mappedValues = values.map((entry) => {
      const result = {};
      const cols = this.table[drizzle_orm_table/* Table */.XI.Symbol.Columns];
      for (const colKey of Object.keys(entry)) {
        const colValue = entry[colKey];
        result[colKey] = (0,entity.is)(colValue, sql/* SQL */.Xs) ? colValue : new sql/* Param */.Iw(colValue, cols[colKey]);
      }
      return result;
    });
    return new PgInsertBase(
      this.table,
      mappedValues,
      this.session,
      this.dialect,
      this.withList,
      false,
      this.overridingSystemValue_
    ).setToken(this.authToken);
  }
  select(selectQuery) {
    const select = typeof selectQuery === "function" ? selectQuery(new QueryBuilder()) : selectQuery;
    if (!(0,entity.is)(select, sql/* SQL */.Xs) && !(0,utils/* haveSameKeys */.DV)(this.table[drizzle_orm_table/* Columns */.e], select._.selectedFields)) {
      throw new Error(
        "Insert select error: selected fields are not the same or are in a different order compared to the table definition"
      );
    }
    return new PgInsertBase(this.table, select, this.session, this.dialect, this.withList, true);
  }
}
class PgInsertBase extends query_promise/* QueryPromise */.k {
  constructor(table, values, session, dialect, withList, select, overridingSystemValue_) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { table, values, withList, select, overridingSystemValue_ };
  }
  static [entity/* entityKind */.i] = "PgInsert";
  config;
  cacheConfig;
  returning(fields = this.config.table[drizzle_orm_table/* Table */.XI.Symbol.Columns]) {
    this.config.returningFields = fields;
    this.config.returning = (0,utils/* orderSelectedFields */.He)(fields);
    return this;
  }
  /**
   * Adds an `on conflict do nothing` clause to the query.
   *
   * Calling this method simply avoids inserting a row as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#on-conflict-do-nothing}
   *
   * @param config The `target` and `where` clauses.
   *
   * @example
   * ```ts
   * // Insert one row and cancel the insert if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing();
   *
   * // Explicitly specify conflict target
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing({ target: cars.id });
   * ```
   */
  onConflictDoNothing(config = {}) {
    if (config.target === void 0) {
      this.config.onConflict = (0,sql/* sql */.ll)`do nothing`;
    } else {
      let targetColumn = "";
      targetColumn = Array.isArray(config.target) ? config.target.map((it) => this.dialect.escapeName(this.dialect.casing.getColumnCasing(it))).join(",") : this.dialect.escapeName(this.dialect.casing.getColumnCasing(config.target));
      const whereSql = config.where ? (0,sql/* sql */.ll)` where ${config.where}` : void 0;
      this.config.onConflict = (0,sql/* sql */.ll)`(${sql/* sql */.ll.raw(targetColumn)})${whereSql} do nothing`;
    }
    return this;
  }
  /**
   * Adds an `on conflict do update` clause to the query.
   *
   * Calling this method will update the existing row that conflicts with the row proposed for insertion as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#upserts-and-conflicts}
   *
   * @param config The `target`, `set` and `where` clauses.
   *
   * @example
   * ```ts
   * // Update the row if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'Porsche' }
   *   });
   *
   * // Upsert with 'where' clause
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'newBMW' },
   *     targetWhere: sql`${cars.createdAt} > '2023-01-01'::date`,
   *   });
   * ```
   */
  onConflictDoUpdate(config) {
    if (config.where && (config.targetWhere || config.setWhere)) {
      throw new Error(
        'You cannot use both "where" and "targetWhere"/"setWhere" at the same time - "where" is deprecated, use "targetWhere" or "setWhere" instead.'
      );
    }
    const whereSql = config.where ? (0,sql/* sql */.ll)` where ${config.where}` : void 0;
    const targetWhereSql = config.targetWhere ? (0,sql/* sql */.ll)` where ${config.targetWhere}` : void 0;
    const setWhereSql = config.setWhere ? (0,sql/* sql */.ll)` where ${config.setWhere}` : void 0;
    const setSql = this.dialect.buildUpdateSet(this.config.table, (0,utils/* mapUpdateSet */.q)(this.config.table, config.set));
    let targetColumn = "";
    targetColumn = Array.isArray(config.target) ? config.target.map((it) => this.dialect.escapeName(this.dialect.casing.getColumnCasing(it))).join(",") : this.dialect.escapeName(this.dialect.casing.getColumnCasing(config.target));
    this.config.onConflict = (0,sql/* sql */.ll)`(${sql/* sql */.ll.raw(targetColumn)})${targetWhereSql} do update set ${setSql}${whereSql}${setWhereSql}`;
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildInsertQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(name) {
    return tracing/* tracer */.k.startActiveSpan("drizzle.prepareQuery", () => {
      return this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), this.config.returning, name, true, void 0, {
        type: "insert",
        tables: extractUsedTable(this.config.table)
      }, this.cacheConfig);
    });
  }
  prepare(name) {
    return this._prepare(name);
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute = (placeholderValues) => {
    return tracing/* tracer */.k.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(placeholderValues, this.authToken);
    });
  };
  /** @internal */
  getSelectedFields() {
    return this.config.returningFields ? new Proxy(
      this.config.returningFields,
      new selection_proxy/* SelectionProxyHandler */.b({
        alias: (0,drizzle_orm_table/* getTableName */.Io)(this.config.table),
        sqlAliasedBehavior: "alias",
        sqlBehavior: "error"
      })
    ) : void 0;
  }
  $dynamic() {
    return this;
  }
}

//# sourceMappingURL=insert.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/query-builders/delete.js







class PgDeleteBase extends query_promise/* QueryPromise */.k {
  constructor(table, session, dialect, withList) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { table, withList };
  }
  static [entity/* entityKind */.i] = "PgDelete";
  config;
  cacheConfig;
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will delete only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be deleted.
   *
   * ```ts
   * // Delete all cars with green color
   * await db.delete(cars).where(eq(cars.color, 'green'));
   * // or
   * await db.delete(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Delete all BMW cars with a green color
   * await db.delete(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Delete all cars with the green or blue color
   * await db.delete(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  returning(fields = this.config.table[drizzle_orm_table/* Table */.XI.Symbol.Columns]) {
    this.config.returningFields = fields;
    this.config.returning = (0,utils/* orderSelectedFields */.He)(fields);
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildDeleteQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(name) {
    return tracing/* tracer */.k.startActiveSpan("drizzle.prepareQuery", () => {
      return this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), this.config.returning, name, true, void 0, {
        type: "delete",
        tables: extractUsedTable(this.config.table)
      }, this.cacheConfig);
    });
  }
  prepare(name) {
    return this._prepare(name);
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute = (placeholderValues) => {
    return tracing/* tracer */.k.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(placeholderValues, this.authToken);
    });
  };
  /** @internal */
  getSelectedFields() {
    return this.config.returningFields ? new Proxy(
      this.config.returningFields,
      new selection_proxy/* SelectionProxyHandler */.b({
        alias: (0,drizzle_orm_table/* getTableName */.Io)(this.config.table),
        sqlAliasedBehavior: "alias",
        sqlBehavior: "error"
      })
    ) : void 0;
  }
  $dynamic() {
    return this;
  }
}

//# sourceMappingURL=delete.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/query-builders/count.js


class PgCountBuilder extends sql/* SQL */.Xs {
  constructor(params) {
    super(PgCountBuilder.buildEmbeddedCount(params.source, params.filters).queryChunks);
    this.params = params;
    this.mapWith(Number);
    this.session = params.session;
    this.sql = PgCountBuilder.buildCount(
      params.source,
      params.filters
    );
  }
  sql;
  token;
  static [entity/* entityKind */.i] = "PgCountBuilder";
  [Symbol.toStringTag] = "PgCountBuilder";
  session;
  static buildEmbeddedCount(source, filters) {
    return (0,sql/* sql */.ll)`(select count(*) from ${source}${sql/* sql */.ll.raw(" where ").if(filters)}${filters})`;
  }
  static buildCount(source, filters) {
    return (0,sql/* sql */.ll)`select count(*) as count from ${source}${sql/* sql */.ll.raw(" where ").if(filters)}${filters};`;
  }
  /** @intrnal */
  setToken(token) {
    this.token = token;
    return this;
  }
  then(onfulfilled, onrejected) {
    return Promise.resolve(this.session.count(this.sql, this.token)).then(
      onfulfilled,
      onrejected
    );
  }
  catch(onRejected) {
    return this.then(void 0, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (reason) => {
        onFinally?.();
        throw reason;
      }
    );
  }
}

//# sourceMappingURL=count.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/query-builders/query.js




class RelationalQueryBuilder {
  constructor(fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session) {
    this.fullSchema = fullSchema;
    this.schema = schema;
    this.tableNamesMap = tableNamesMap;
    this.table = table;
    this.tableConfig = tableConfig;
    this.dialect = dialect;
    this.session = session;
  }
  static [entity/* entityKind */.i] = "PgRelationalQueryBuilder";
  findMany(config) {
    return new PgRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? config : {},
      "many"
    );
  }
  findFirst(config) {
    return new PgRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? { ...config, limit: 1 } : { limit: 1 },
      "first"
    );
  }
}
class PgRelationalQuery extends query_promise/* QueryPromise */.k {
  constructor(fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session, config, mode) {
    super();
    this.fullSchema = fullSchema;
    this.schema = schema;
    this.tableNamesMap = tableNamesMap;
    this.table = table;
    this.tableConfig = tableConfig;
    this.dialect = dialect;
    this.session = session;
    this.config = config;
    this.mode = mode;
  }
  static [entity/* entityKind */.i] = "PgRelationalQuery";
  /** @internal */
  _prepare(name) {
    return tracing/* tracer */.k.startActiveSpan("drizzle.prepareQuery", () => {
      const { query, builtQuery } = this._toSQL();
      return this.session.prepareQuery(
        builtQuery,
        void 0,
        name,
        true,
        (rawRows, mapColumnValue) => {
          const rows = rawRows.map(
            (row) => (0,relations/* mapRelationalRow */.I$)(this.schema, this.tableConfig, row, query.selection, mapColumnValue)
          );
          if (this.mode === "first") {
            return rows[0];
          }
          return rows;
        }
      );
    });
  }
  prepare(name) {
    return this._prepare(name);
  }
  _getQuery() {
    return this.dialect.buildRelationalQueryWithoutPK({
      fullSchema: this.fullSchema,
      schema: this.schema,
      tableNamesMap: this.tableNamesMap,
      table: this.table,
      tableConfig: this.tableConfig,
      queryConfig: this.config,
      tableAlias: this.tableConfig.tsName
    });
  }
  /** @internal */
  getSQL() {
    return this._getQuery().sql;
  }
  _toSQL() {
    const query = this._getQuery();
    const builtQuery = this.dialect.sqlToQuery(query.sql);
    return { query, builtQuery };
  }
  toSQL() {
    return this._toSQL().builtQuery;
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute() {
    return tracing/* tracer */.k.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(void 0, this.authToken);
    });
  }
}

//# sourceMappingURL=query.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/query-builders/raw.js


class PgRaw extends query_promise/* QueryPromise */.k {
  constructor(execute, sql, query, mapBatchResult) {
    super();
    this.execute = execute;
    this.sql = sql;
    this.query = query;
    this.mapBatchResult = mapBatchResult;
  }
  static [entity/* entityKind */.i] = "PgRaw";
  /** @internal */
  getSQL() {
    return this.sql;
  }
  getQuery() {
    return this.query;
  }
  mapResult(result, isFromBatch) {
    return isFromBatch ? this.mapBatchResult(result) : result;
  }
  _prepare() {
    return this;
  }
  /** @internal */
  isResponseInArrayMode() {
    return false;
  }
}

//# sourceMappingURL=raw.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/query-builders/refresh-materialized-view.js



class PgRefreshMaterializedView extends query_promise/* QueryPromise */.k {
  constructor(view, session, dialect) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { view };
  }
  static [entity/* entityKind */.i] = "PgRefreshMaterializedView";
  config;
  concurrently() {
    if (this.config.withNoData !== void 0) {
      throw new Error("Cannot use concurrently and withNoData together");
    }
    this.config.concurrently = true;
    return this;
  }
  withNoData() {
    if (this.config.concurrently !== void 0) {
      throw new Error("Cannot use concurrently and withNoData together");
    }
    this.config.withNoData = true;
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildRefreshMaterializedViewQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(name) {
    return tracing/* tracer */.k.startActiveSpan("drizzle.prepareQuery", () => {
      return this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), void 0, name, true);
    });
  }
  prepare(name) {
    return this._prepare(name);
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute = (placeholderValues) => {
    return tracing/* tracer */.k.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(placeholderValues, this.authToken);
    });
  };
}

//# sourceMappingURL=refresh-materialized-view.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/db.js









class PgDatabase {
  constructor(dialect, session, schema) {
    this.dialect = dialect;
    this.session = session;
    this._ = schema ? {
      schema: schema.schema,
      fullSchema: schema.fullSchema,
      tableNamesMap: schema.tableNamesMap,
      session
    } : {
      schema: void 0,
      fullSchema: {},
      tableNamesMap: {},
      session
    };
    this.query = {};
    if (this._.schema) {
      for (const [tableName, columns] of Object.entries(this._.schema)) {
        this.query[tableName] = new RelationalQueryBuilder(
          schema.fullSchema,
          this._.schema,
          this._.tableNamesMap,
          schema.fullSchema[tableName],
          columns,
          dialect,
          session
        );
      }
    }
    this.$cache = { invalidate: async (_params) => {
    } };
  }
  static [entity/* entityKind */.i] = "PgDatabase";
  query;
  /**
   * Creates a subquery that defines a temporary named result set as a CTE.
   *
   * It is useful for breaking down complex queries into simpler parts and for reusing the result set in subsequent parts of the query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
   *
   * @param alias The alias for the subquery.
   *
   * Failure to provide an alias will result in a DrizzleTypeError, preventing the subquery from being referenced in other queries.
   *
   * @example
   *
   * ```ts
   * // Create a subquery with alias 'sq' and use it in the select query
   * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
   *
   * const result = await db.with(sq).select().from(sq);
   * ```
   *
   * To select arbitrary SQL values as fields in a CTE and reference them in other CTEs or in the main query, you need to add aliases to them:
   *
   * ```ts
   * // Select an arbitrary SQL value as a field in a CTE and reference it in the main query
   * const sq = db.$with('sq').as(db.select({
   *   name: sql<string>`upper(${users.name})`.as('name'),
   * })
   * .from(users));
   *
   * const result = await db.with(sq).select({ name: sq.name }).from(sq);
   * ```
   */
  $with = (alias, selection) => {
    const self = this;
    const as = (qb) => {
      if (typeof qb === "function") {
        qb = qb(new QueryBuilder(self.dialect));
      }
      return new Proxy(
        new subquery/* WithSubquery */.J(
          qb.getSQL(),
          selection ?? ("getSelectedFields" in qb ? qb.getSelectedFields() ?? {} : {}),
          alias,
          true
        ),
        new selection_proxy/* SelectionProxyHandler */.b({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
      );
    };
    return { as };
  };
  $count(source, filters) {
    return new PgCountBuilder({ source, filters, session: this.session });
  }
  $cache;
  /**
   * Incorporates a previously defined CTE (using `$with`) into the main query.
   *
   * This method allows the main query to reference a temporary named result set.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
   *
   * @param queries The CTEs to incorporate into the main query.
   *
   * @example
   *
   * ```ts
   * // Define a subquery 'sq' as a CTE using $with
   * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
   *
   * // Incorporate the CTE 'sq' into the main query and select from it
   * const result = await db.with(sq).select().from(sq);
   * ```
   */
  with(...queries) {
    const self = this;
    function select(fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries
      });
    }
    function selectDistinct(fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries,
        distinct: true
      });
    }
    function selectDistinctOn(on, fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries,
        distinct: { on }
      });
    }
    function update(table) {
      return new PgUpdateBuilder(table, self.session, self.dialect, queries);
    }
    function insert(table) {
      return new PgInsertBuilder(table, self.session, self.dialect, queries);
    }
    function delete_(table) {
      return new PgDeleteBase(table, self.session, self.dialect, queries);
    }
    return { select, selectDistinct, selectDistinctOn, update, insert, delete: delete_ };
  }
  select(fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: this.session,
      dialect: this.dialect
    });
  }
  selectDistinct(fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: this.session,
      dialect: this.dialect,
      distinct: true
    });
  }
  selectDistinctOn(on, fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: this.session,
      dialect: this.dialect,
      distinct: { on }
    });
  }
  /**
   * Creates an update query.
   *
   * Calling this method without `.where()` clause will update all rows in a table. The `.where()` clause specifies which rows should be updated.
   *
   * Use `.set()` method to specify which values to update.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param table The table to update.
   *
   * @example
   *
   * ```ts
   * // Update all rows in the 'cars' table
   * await db.update(cars).set({ color: 'red' });
   *
   * // Update rows with filters and conditions
   * await db.update(cars).set({ color: 'red' }).where(eq(cars.brand, 'BMW'));
   *
   * // Update with returning clause
   * const updatedCar: Car[] = await db.update(cars)
   *   .set({ color: 'red' })
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  update(table) {
    return new PgUpdateBuilder(table, this.session, this.dialect);
  }
  /**
   * Creates an insert query.
   *
   * Calling this method will create new rows in a table. Use `.values()` method to specify which values to insert.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert}
   *
   * @param table The table to insert into.
   *
   * @example
   *
   * ```ts
   * // Insert one row
   * await db.insert(cars).values({ brand: 'BMW' });
   *
   * // Insert multiple rows
   * await db.insert(cars).values([{ brand: 'BMW' }, { brand: 'Porsche' }]);
   *
   * // Insert with returning clause
   * const insertedCar: Car[] = await db.insert(cars)
   *   .values({ brand: 'BMW' })
   *   .returning();
   * ```
   */
  insert(table) {
    return new PgInsertBuilder(table, this.session, this.dialect);
  }
  /**
   * Creates a delete query.
   *
   * Calling this method without `.where()` clause will delete all rows in a table. The `.where()` clause specifies which rows should be deleted.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param table The table to delete from.
   *
   * @example
   *
   * ```ts
   * // Delete all rows in the 'cars' table
   * await db.delete(cars);
   *
   * // Delete rows with filters and conditions
   * await db.delete(cars).where(eq(cars.color, 'green'));
   *
   * // Delete with returning clause
   * const deletedCar: Car[] = await db.delete(cars)
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  delete(table) {
    return new PgDeleteBase(table, this.session, this.dialect);
  }
  refreshMaterializedView(view) {
    return new PgRefreshMaterializedView(view, this.session, this.dialect);
  }
  authToken;
  execute(query) {
    const sequel = typeof query === "string" ? sql/* sql */.ll.raw(query) : query.getSQL();
    const builtQuery = this.dialect.sqlToQuery(sequel);
    const prepared = this.session.prepareQuery(
      builtQuery,
      void 0,
      void 0,
      false
    );
    return new PgRaw(
      () => prepared.execute(void 0, this.authToken),
      sequel,
      builtQuery,
      (result) => prepared.mapResult(result, true)
    );
  }
  transaction(transaction, config) {
    return this.session.transaction(transaction, config);
  }
}
const withReplicas = (primary, replicas, getReplica = () => replicas[Math.floor(Math.random() * replicas.length)]) => {
  const select = (...args) => getReplica(replicas).select(...args);
  const selectDistinct = (...args) => getReplica(replicas).selectDistinct(...args);
  const selectDistinctOn = (...args) => getReplica(replicas).selectDistinctOn(...args);
  const $count = (...args) => getReplica(replicas).$count(...args);
  const _with = (...args) => getReplica(replicas).with(...args);
  const $with = (arg) => getReplica(replicas).$with(arg);
  const update = (...args) => primary.update(...args);
  const insert = (...args) => primary.insert(...args);
  const $delete = (...args) => primary.delete(...args);
  const execute = (...args) => primary.execute(...args);
  const transaction = (...args) => primary.transaction(...args);
  const refreshMaterializedView = (...args) => primary.refreshMaterializedView(...args);
  return {
    ...primary,
    update,
    insert,
    delete: $delete,
    execute,
    transaction,
    refreshMaterializedView,
    $primary: primary,
    $replicas: replicas,
    select,
    selectDistinct,
    selectDistinctOn,
    $count,
    $with,
    with: _with,
    get query() {
      return getReplica(replicas).query;
    }
  };
};

//# sourceMappingURL=db.js.map
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/cache/core/cache.js
var cache = __webpack_require__(33324);
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/session.js






class PgPreparedQuery {
  constructor(query, cache, queryMetadata, cacheConfig) {
    this.query = query;
    this.cache = cache;
    this.queryMetadata = queryMetadata;
    this.cacheConfig = cacheConfig;
    if (cache && cache.strategy() === "all" && cacheConfig === void 0) {
      this.cacheConfig = { enable: true, autoInvalidate: true };
    }
    if (!this.cacheConfig?.enable) {
      this.cacheConfig = void 0;
    }
  }
  authToken;
  getQuery() {
    return this.query;
  }
  mapResult(response, _isFromBatch) {
    return response;
  }
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  static [entity/* entityKind */.i] = "PgPreparedQuery";
  /** @internal */
  joinsNotNullableMap;
  /** @internal */
  async queryWithCache(queryString, params, query) {
    if (this.cache === void 0 || (0,entity.is)(this.cache, cache/* NoopCache */.Th) || this.queryMetadata === void 0) {
      try {
        return await query();
      } catch (e) {
        throw new errors/* DrizzleQueryError */.Rv(queryString, params, e);
      }
    }
    if (this.cacheConfig && !this.cacheConfig.enable) {
      try {
        return await query();
      } catch (e) {
        throw new errors/* DrizzleQueryError */.Rv(queryString, params, e);
      }
    }
    if ((this.queryMetadata.type === "insert" || this.queryMetadata.type === "update" || this.queryMetadata.type === "delete") && this.queryMetadata.tables.length > 0) {
      try {
        const [res] = await Promise.all([
          query(),
          this.cache.onMutate({ tables: this.queryMetadata.tables })
        ]);
        return res;
      } catch (e) {
        throw new errors/* DrizzleQueryError */.Rv(queryString, params, e);
      }
    }
    if (!this.cacheConfig) {
      try {
        return await query();
      } catch (e) {
        throw new errors/* DrizzleQueryError */.Rv(queryString, params, e);
      }
    }
    if (this.queryMetadata.type === "select") {
      const fromCache = await this.cache.get(
        this.cacheConfig.tag ?? (await (0,cache/* hashQuery */.h1)(queryString, params)),
        this.queryMetadata.tables,
        this.cacheConfig.tag !== void 0,
        this.cacheConfig.autoInvalidate
      );
      if (fromCache === void 0) {
        let result;
        try {
          result = await query();
        } catch (e) {
          throw new errors/* DrizzleQueryError */.Rv(queryString, params, e);
        }
        await this.cache.put(
          this.cacheConfig.tag ?? (await (0,cache/* hashQuery */.h1)(queryString, params)),
          result,
          // make sure we send tables that were used in a query only if user wants to invalidate it on each write
          this.cacheConfig.autoInvalidate ? this.queryMetadata.tables : [],
          this.cacheConfig.tag !== void 0,
          this.cacheConfig.config
        );
        return result;
      }
      return fromCache;
    }
    try {
      return await query();
    } catch (e) {
      throw new errors/* DrizzleQueryError */.Rv(queryString, params, e);
    }
  }
}
class PgSession {
  constructor(dialect) {
    this.dialect = dialect;
  }
  static [entity/* entityKind */.i] = "PgSession";
  /** @internal */
  execute(query, token) {
    return tracing/* tracer */.k.startActiveSpan("drizzle.operation", () => {
      const prepared = tracing/* tracer */.k.startActiveSpan("drizzle.prepareQuery", () => {
        return this.prepareQuery(
          this.dialect.sqlToQuery(query),
          void 0,
          void 0,
          false
        );
      });
      return prepared.setToken(token).execute(void 0, token);
    });
  }
  all(query) {
    return this.prepareQuery(
      this.dialect.sqlToQuery(query),
      void 0,
      void 0,
      false
    ).all();
  }
  /** @internal */
  async count(sql2, token) {
    const res = await this.execute(sql2, token);
    return Number(
      res[0]["count"]
    );
  }
}
class PgTransaction extends PgDatabase {
  constructor(dialect, session, schema, nestedIndex = 0) {
    super(dialect, session, schema);
    this.schema = schema;
    this.nestedIndex = nestedIndex;
  }
  static [entity/* entityKind */.i] = "PgTransaction";
  rollback() {
    throw new errors/* TransactionRollbackError */.jY();
  }
  /** @internal */
  getTransactionConfigSQL(config) {
    const chunks = [];
    if (config.isolationLevel) {
      chunks.push(`isolation level ${config.isolationLevel}`);
    }
    if (config.accessMode) {
      chunks.push(config.accessMode);
    }
    if (typeof config.deferrable === "boolean") {
      chunks.push(config.deferrable ? "deferrable" : "not deferrable");
    }
    return sql/* sql */.ll.raw(chunks.join(" "));
  }
  setTransaction(config) {
    return this.session.execute((0,sql/* sql */.ll)`set transaction ${this.getTransactionConfigSQL(config)}`);
  }
}

//# sourceMappingURL=session.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/node-postgres/session.js









const { Pool, types } = esm/* default */.Ay;
class NodePgPreparedQuery extends PgPreparedQuery {
  constructor(client, queryString, params, logger, cache, queryMetadata, cacheConfig, fields, name, _isResponseInArrayMode, customResultMapper) {
    super({ sql: queryString, params }, cache, queryMetadata, cacheConfig);
    this.client = client;
    this.queryString = queryString;
    this.params = params;
    this.logger = logger;
    this.fields = fields;
    this._isResponseInArrayMode = _isResponseInArrayMode;
    this.customResultMapper = customResultMapper;
    this.rawQueryConfig = {
      name,
      text: queryString,
      types: {
        // @ts-ignore
        getTypeParser: (typeId, format) => {
          if (typeId === types.builtins.TIMESTAMPTZ) {
            return (val) => val;
          }
          if (typeId === types.builtins.TIMESTAMP) {
            return (val) => val;
          }
          if (typeId === types.builtins.DATE) {
            return (val) => val;
          }
          if (typeId === types.builtins.INTERVAL) {
            return (val) => val;
          }
          if (typeId === 1231) {
            return (val) => val;
          }
          if (typeId === 1115) {
            return (val) => val;
          }
          if (typeId === 1185) {
            return (val) => val;
          }
          if (typeId === 1187) {
            return (val) => val;
          }
          if (typeId === 1182) {
            return (val) => val;
          }
          return types.getTypeParser(typeId, format);
        }
      }
    };
    this.queryConfig = {
      name,
      text: queryString,
      rowMode: "array",
      types: {
        // @ts-ignore
        getTypeParser: (typeId, format) => {
          if (typeId === types.builtins.TIMESTAMPTZ) {
            return (val) => val;
          }
          if (typeId === types.builtins.TIMESTAMP) {
            return (val) => val;
          }
          if (typeId === types.builtins.DATE) {
            return (val) => val;
          }
          if (typeId === types.builtins.INTERVAL) {
            return (val) => val;
          }
          if (typeId === 1231) {
            return (val) => val;
          }
          if (typeId === 1115) {
            return (val) => val;
          }
          if (typeId === 1185) {
            return (val) => val;
          }
          if (typeId === 1187) {
            return (val) => val;
          }
          if (typeId === 1182) {
            return (val) => val;
          }
          return types.getTypeParser(typeId, format);
        }
      }
    };
  }
  static [entity/* entityKind */.i] = "NodePgPreparedQuery";
  rawQueryConfig;
  queryConfig;
  async execute(placeholderValues = {}) {
    return tracing/* tracer */.k.startActiveSpan("drizzle.execute", async () => {
      const params = (0,sql/* fillPlaceholders */.Ct)(this.params, placeholderValues);
      this.logger.logQuery(this.rawQueryConfig.text, params);
      const { fields, rawQueryConfig: rawQuery, client, queryConfig: query, joinsNotNullableMap, customResultMapper } = this;
      if (!fields && !customResultMapper) {
        return tracing/* tracer */.k.startActiveSpan("drizzle.driver.execute", async (span) => {
          span?.setAttributes({
            "drizzle.query.name": rawQuery.name,
            "drizzle.query.text": rawQuery.text,
            "drizzle.query.params": JSON.stringify(params)
          });
          return this.queryWithCache(rawQuery.text, params, async () => {
            return await client.query(rawQuery, params);
          });
        });
      }
      const result = await tracing/* tracer */.k.startActiveSpan("drizzle.driver.execute", (span) => {
        span?.setAttributes({
          "drizzle.query.name": query.name,
          "drizzle.query.text": query.text,
          "drizzle.query.params": JSON.stringify(params)
        });
        return this.queryWithCache(query.text, params, async () => {
          return await client.query(query, params);
        });
      });
      return tracing/* tracer */.k.startActiveSpan("drizzle.mapResponse", () => {
        return customResultMapper ? customResultMapper(result.rows) : result.rows.map((row) => (0,utils/* mapResultRow */.a6)(fields, row, joinsNotNullableMap));
      });
    });
  }
  all(placeholderValues = {}) {
    return tracing/* tracer */.k.startActiveSpan("drizzle.execute", () => {
      const params = (0,sql/* fillPlaceholders */.Ct)(this.params, placeholderValues);
      this.logger.logQuery(this.rawQueryConfig.text, params);
      return tracing/* tracer */.k.startActiveSpan("drizzle.driver.execute", (span) => {
        span?.setAttributes({
          "drizzle.query.name": this.rawQueryConfig.name,
          "drizzle.query.text": this.rawQueryConfig.text,
          "drizzle.query.params": JSON.stringify(params)
        });
        return this.queryWithCache(this.rawQueryConfig.text, params, async () => {
          return this.client.query(this.rawQueryConfig, params);
        }).then((result) => result.rows);
      });
    });
  }
  /** @internal */
  isResponseInArrayMode() {
    return this._isResponseInArrayMode;
  }
}
class NodePgSession extends PgSession {
  constructor(client, dialect, schema, options = {}) {
    super(dialect);
    this.client = client;
    this.schema = schema;
    this.options = options;
    this.logger = options.logger ?? new drizzle_orm_logger/* NoopLogger */.Pv();
    this.cache = options.cache ?? new cache/* NoopCache */.Th();
  }
  static [entity/* entityKind */.i] = "NodePgSession";
  logger;
  cache;
  prepareQuery(query, fields, name, isResponseInArrayMode, customResultMapper, queryMetadata, cacheConfig) {
    return new NodePgPreparedQuery(
      this.client,
      query.sql,
      query.params,
      this.logger,
      this.cache,
      queryMetadata,
      cacheConfig,
      fields,
      name,
      isResponseInArrayMode,
      customResultMapper
    );
  }
  async transaction(transaction, config) {
    const session = this.client instanceof Pool ? new NodePgSession(await this.client.connect(), this.dialect, this.schema, this.options) : this;
    const tx = new NodePgTransaction(this.dialect, session, this.schema);
    await tx.execute((0,sql/* sql */.ll)`begin${config ? (0,sql/* sql */.ll)` ${tx.getTransactionConfigSQL(config)}` : void 0}`);
    try {
      const result = await transaction(tx);
      await tx.execute((0,sql/* sql */.ll)`commit`);
      return result;
    } catch (error) {
      await tx.execute((0,sql/* sql */.ll)`rollback`);
      throw error;
    } finally {
      if (this.client instanceof Pool) {
        session.client.release();
      }
    }
  }
  async count(sql2) {
    const res = await this.execute(sql2);
    return Number(
      res["rows"][0]["count"]
    );
  }
}
class NodePgTransaction extends PgTransaction {
  static [entity/* entityKind */.i] = "NodePgTransaction";
  async transaction(transaction) {
    const savepointName = `sp${this.nestedIndex + 1}`;
    const tx = new NodePgTransaction(
      this.dialect,
      this.session,
      this.schema,
      this.nestedIndex + 1
    );
    await tx.execute(sql/* sql */.ll.raw(`savepoint ${savepointName}`));
    try {
      const result = await transaction(tx);
      await tx.execute(sql/* sql */.ll.raw(`release savepoint ${savepointName}`));
      return result;
    } catch (err) {
      await tx.execute(sql/* sql */.ll.raw(`rollback to savepoint ${savepointName}`));
      throw err;
    }
  }
}

//# sourceMappingURL=session.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/node-postgres/driver.js








class NodePgDriver {
  constructor(client, dialect, options = {}) {
    this.client = client;
    this.dialect = dialect;
    this.options = options;
  }
  static [entity/* entityKind */.i] = "NodePgDriver";
  createSession(schema) {
    return new NodePgSession(this.client, this.dialect, schema, {
      logger: this.options.logger,
      cache: this.options.cache
    });
  }
}
class NodePgDatabase extends PgDatabase {
  static [entity/* entityKind */.i] = "NodePgDatabase";
}
function construct(client, config = {}) {
  const dialect = new PgDialect({ casing: config.casing });
  let logger;
  if (config.logger === true) {
    logger = new drizzle_orm_logger/* DefaultLogger */.w();
  } else if (config.logger !== false) {
    logger = config.logger;
  }
  let schema;
  if (config.schema) {
    const tablesConfig = (0,relations/* extractTablesRelationalConfig */._k)(
      config.schema,
      relations/* createTableRelationsHelpers */.DZ
    );
    schema = {
      fullSchema: config.schema,
      schema: tablesConfig.tables,
      tableNamesMap: tablesConfig.tableNamesMap
    };
  }
  const driver = new NodePgDriver(client, dialect, { logger, cache: config.cache });
  const session = driver.createSession(schema);
  const db = new NodePgDatabase(dialect, session, schema);
  db.$client = client;
  db.$cache = config.cache;
  if (db.$cache) {
    db.$cache["invalidate"] = config.cache?.onMutate;
  }
  return db;
}
function drizzle(...params) {
  if (typeof params[0] === "string") {
    const instance = new esm/* default.Pool */.Ay.Pool({
      connectionString: params[0]
    });
    return construct(instance, params[1]);
  }
  if ((0,utils/* isConfig */.Lq)(params[0])) {
    const { connection, client, ...drizzleConfig } = params[0];
    if (client) return construct(client, drizzleConfig);
    const instance = typeof connection === "string" ? new esm/* default.Pool */.Ay.Pool({
      connectionString: connection
    }) : new esm/* default.Pool */.Ay.Pool(connection);
    return construct(instance, drizzleConfig);
  }
  return construct(params[0], params[1]);
}
((drizzle2) => {
  function mock(config) {
    return construct({}, config);
  }
  drizzle2.mock = mock;
})(drizzle || (drizzle = {}));

//# sourceMappingURL=driver.js.map

/***/ }),

/***/ 60401:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   zM: () => (/* binding */ boolean)
/* harmony export */ });
/* unused harmony exports PgBoolean, PgBooleanBuilder */
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(48666);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(70704);


class PgBooleanBuilder extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .PgColumnBuilder */ .pe {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgBooleanBuilder";
  constructor(name) {
    super(name, "boolean", "PgBoolean");
  }
  /** @internal */
  build(table) {
    return new PgBoolean(table, this.config);
  }
}
class PgBoolean extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .PgColumn */ .Kl {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgBoolean";
  getSQLType() {
    return "boolean";
  }
}
function boolean(name) {
  return new PgBooleanBuilder(name ?? "");
}

//# sourceMappingURL=boolean.js.map

/***/ }),

/***/ 70704:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  Kl: () => (/* binding */ PgColumn),
  pe: () => (/* binding */ PgColumnBuilder)
});

// UNUSED EXPORTS: ExtraConfigColumn, IndexedColumn, PgArray, PgArrayBuilder

// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/column-builder.js
var column_builder = __webpack_require__(30057);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/column.js
var column = __webpack_require__(599);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/entity.js
var entity = __webpack_require__(48666);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/table.utils.js
var table_utils = __webpack_require__(66918);
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/foreign-keys.js


class ForeignKeyBuilder {
  static [entity/* entityKind */.i] = "PgForeignKeyBuilder";
  /** @internal */
  reference;
  /** @internal */
  _onUpdate = "no action";
  /** @internal */
  _onDelete = "no action";
  constructor(config, actions) {
    this.reference = () => {
      const { name, columns, foreignColumns } = config();
      return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
    };
    if (actions) {
      this._onUpdate = actions.onUpdate;
      this._onDelete = actions.onDelete;
    }
  }
  onUpdate(action) {
    this._onUpdate = action === void 0 ? "no action" : action;
    return this;
  }
  onDelete(action) {
    this._onDelete = action === void 0 ? "no action" : action;
    return this;
  }
  /** @internal */
  build(table) {
    return new ForeignKey(table, this);
  }
}
class ForeignKey {
  constructor(table, builder) {
    this.table = table;
    this.reference = builder.reference;
    this.onUpdate = builder._onUpdate;
    this.onDelete = builder._onDelete;
  }
  static [entity/* entityKind */.i] = "PgForeignKey";
  reference;
  onUpdate;
  onDelete;
  getName() {
    const { name, columns, foreignColumns } = this.reference();
    const columnNames = columns.map((column) => column.name);
    const foreignColumnNames = foreignColumns.map((column) => column.name);
    const chunks = [
      this.table[table_utils/* TableName */.E],
      ...columnNames,
      foreignColumns[0].table[table_utils/* TableName */.E],
      ...foreignColumnNames
    ];
    return name ?? `${chunks.join("_")}_fk`;
  }
}
function foreignKey(config) {
  function mappedConfig() {
    const { name, columns, foreignColumns } = config;
    return {
      name,
      columns,
      foreignColumns
    };
  }
  return new ForeignKeyBuilder(mappedConfig);
}

//# sourceMappingURL=foreign-keys.js.map
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/tracing-utils.js
var tracing_utils = __webpack_require__(7575);
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/unique-constraint.js


function unique(name) {
  return new UniqueOnConstraintBuilder(name);
}
function uniqueKeyName(table, columns) {
  return `${table[table_utils/* TableName */.E]}_${columns.join("_")}_unique`;
}
class UniqueConstraintBuilder {
  constructor(columns, name) {
    this.name = name;
    this.columns = columns;
  }
  static [entity/* entityKind */.i] = (/* unused pure expression or super */ null && ("PgUniqueConstraintBuilder"));
  /** @internal */
  columns;
  /** @internal */
  nullsNotDistinctConfig = false;
  nullsNotDistinct() {
    this.nullsNotDistinctConfig = true;
    return this;
  }
  /** @internal */
  build(table) {
    return new UniqueConstraint(table, this.columns, this.nullsNotDistinctConfig, this.name);
  }
}
class UniqueOnConstraintBuilder {
  static [entity/* entityKind */.i] = (/* unused pure expression or super */ null && ("PgUniqueOnConstraintBuilder"));
  /** @internal */
  name;
  constructor(name) {
    this.name = name;
  }
  on(...columns) {
    return new UniqueConstraintBuilder(columns, this.name);
  }
}
class UniqueConstraint {
  constructor(table, columns, nullsNotDistinct, name) {
    this.table = table;
    this.columns = columns;
    this.name = name ?? uniqueKeyName(this.table, this.columns.map((column) => column.name));
    this.nullsNotDistinct = nullsNotDistinct;
  }
  static [entity/* entityKind */.i] = (/* unused pure expression or super */ null && ("PgUniqueConstraint"));
  columns;
  name;
  nullsNotDistinct = false;
  getName() {
    return this.name;
  }
}

//# sourceMappingURL=unique-constraint.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/utils/array.js
function parsePgArrayValue(arrayString, startFrom, inQuotes) {
  for (let i = startFrom; i < arrayString.length; i++) {
    const char = arrayString[i];
    if (char === "\\") {
      i++;
      continue;
    }
    if (char === '"') {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i + 1];
    }
    if (inQuotes) {
      continue;
    }
    if (char === "," || char === "}") {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i];
    }
  }
  return [arrayString.slice(startFrom).replace(/\\/g, ""), arrayString.length];
}
function parsePgNestedArray(arrayString, startFrom = 0) {
  const result = [];
  let i = startFrom;
  let lastCharIsComma = false;
  while (i < arrayString.length) {
    const char = arrayString[i];
    if (char === ",") {
      if (lastCharIsComma || i === startFrom) {
        result.push("");
      }
      lastCharIsComma = true;
      i++;
      continue;
    }
    lastCharIsComma = false;
    if (char === "\\") {
      i += 2;
      continue;
    }
    if (char === '"') {
      const [value2, startFrom2] = parsePgArrayValue(arrayString, i + 1, true);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    if (char === "}") {
      return [result, i + 1];
    }
    if (char === "{") {
      const [value2, startFrom2] = parsePgNestedArray(arrayString, i + 1);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    const [value, newStartFrom] = parsePgArrayValue(arrayString, i, false);
    result.push(value);
    i = newStartFrom;
  }
  return [result, i];
}
function parsePgArray(arrayString) {
  const [result] = parsePgNestedArray(arrayString, 1);
  return result;
}
function makePgArray(array) {
  return `{${array.map((item) => {
    if (Array.isArray(item)) {
      return makePgArray(item);
    }
    if (typeof item === "string") {
      return `"${item.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    }
    return `${item}`;
  }).join(",")}}`;
}

//# sourceMappingURL=array.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/common.js







class PgColumnBuilder extends column_builder/* ColumnBuilder */.Q {
  foreignKeyConfigs = [];
  static [entity/* entityKind */.i] = "PgColumnBuilder";
  array(size) {
    return new PgArrayBuilder(this.config.name, this, size);
  }
  references(ref, actions = {}) {
    this.foreignKeyConfigs.push({ ref, actions });
    return this;
  }
  unique(name, config) {
    this.config.isUnique = true;
    this.config.uniqueName = name;
    this.config.uniqueType = config?.nulls;
    return this;
  }
  generatedAlwaysAs(as) {
    this.config.generated = {
      as,
      type: "always",
      mode: "stored"
    };
    return this;
  }
  /** @internal */
  buildForeignKeys(column, table) {
    return this.foreignKeyConfigs.map(({ ref, actions }) => {
      return (0,tracing_utils/* iife */.i)(
        (ref2, actions2) => {
          const builder = new ForeignKeyBuilder(() => {
            const foreignColumn = ref2();
            return { columns: [column], foreignColumns: [foreignColumn] };
          });
          if (actions2.onUpdate) {
            builder.onUpdate(actions2.onUpdate);
          }
          if (actions2.onDelete) {
            builder.onDelete(actions2.onDelete);
          }
          return builder.build(table);
        },
        ref,
        actions
      );
    });
  }
  /** @internal */
  buildExtraConfigColumn(table) {
    return new ExtraConfigColumn(table, this.config);
  }
}
class PgColumn extends column/* Column */.V {
  constructor(table, config) {
    if (!config.uniqueName) {
      config.uniqueName = uniqueKeyName(table, [config.name]);
    }
    super(table, config);
    this.table = table;
  }
  static [entity/* entityKind */.i] = "PgColumn";
}
class ExtraConfigColumn extends PgColumn {
  static [entity/* entityKind */.i] = "ExtraConfigColumn";
  getSQLType() {
    return this.getSQLType();
  }
  indexConfig = {
    order: this.config.order ?? "asc",
    nulls: this.config.nulls ?? "last",
    opClass: this.config.opClass
  };
  defaultConfig = {
    order: "asc",
    nulls: "last",
    opClass: void 0
  };
  asc() {
    this.indexConfig.order = "asc";
    return this;
  }
  desc() {
    this.indexConfig.order = "desc";
    return this;
  }
  nullsFirst() {
    this.indexConfig.nulls = "first";
    return this;
  }
  nullsLast() {
    this.indexConfig.nulls = "last";
    return this;
  }
  /**
   * ### PostgreSQL documentation quote
   *
   * > An operator class with optional parameters can be specified for each column of an index.
   * The operator class identifies the operators to be used by the index for that column.
   * For example, a B-tree index on four-byte integers would use the int4_ops class;
   * this operator class includes comparison functions for four-byte integers.
   * In practice the default operator class for the column's data type is usually sufficient.
   * The main point of having operator classes is that for some data types, there could be more than one meaningful ordering.
   * For example, we might want to sort a complex-number data type either by absolute value or by real part.
   * We could do this by defining two operator classes for the data type and then selecting the proper class when creating an index.
   * More information about operator classes check:
   *
   * ### Useful links
   * https://www.postgresql.org/docs/current/sql-createindex.html
   *
   * https://www.postgresql.org/docs/current/indexes-opclass.html
   *
   * https://www.postgresql.org/docs/current/xindex.html
   *
   * ### Additional types
   * If you have the `pg_vector` extension installed in your database, you can use the
   * `vector_l2_ops`, `vector_ip_ops`, `vector_cosine_ops`, `vector_l1_ops`, `bit_hamming_ops`, `bit_jaccard_ops`, `halfvec_l2_ops`, `sparsevec_l2_ops` options, which are predefined types.
   *
   * **You can always specify any string you want in the operator class, in case Drizzle doesn't have it natively in its types**
   *
   * @param opClass
   * @returns
   */
  op(opClass) {
    this.indexConfig.opClass = opClass;
    return this;
  }
}
class IndexedColumn {
  static [entity/* entityKind */.i] = (/* unused pure expression or super */ null && ("IndexedColumn"));
  constructor(name, keyAsName, type, indexConfig) {
    this.name = name;
    this.keyAsName = keyAsName;
    this.type = type;
    this.indexConfig = indexConfig;
  }
  name;
  keyAsName;
  type;
  indexConfig;
}
class PgArrayBuilder extends PgColumnBuilder {
  static [entity/* entityKind */.i] = "PgArrayBuilder";
  constructor(name, baseBuilder, size) {
    super(name, "array", "PgArray");
    this.config.baseBuilder = baseBuilder;
    this.config.size = size;
  }
  /** @internal */
  build(table) {
    const baseColumn = this.config.baseBuilder.build(table);
    return new PgArray(
      table,
      this.config,
      baseColumn
    );
  }
}
class PgArray extends PgColumn {
  constructor(table, config, baseColumn, range) {
    super(table, config);
    this.baseColumn = baseColumn;
    this.range = range;
    this.size = config.size;
  }
  size;
  static [entity/* entityKind */.i] = "PgArray";
  getSQLType() {
    return `${this.baseColumn.getSQLType()}[${typeof this.size === "number" ? this.size : ""}]`;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      value = parsePgArray(value);
    }
    return value.map((v) => this.baseColumn.mapFromDriverValue(v));
  }
  mapToDriverValue(value, isNestedArray = false) {
    const a = value.map(
      (v) => v === null ? null : (0,entity.is)(this.baseColumn, PgArray) ? this.baseColumn.mapToDriverValue(v, true) : this.baseColumn.mapToDriverValue(v)
    );
    if (isNestedArray) return a;
    return makePgArray(a);
  }
}

//# sourceMappingURL=common.js.map

/***/ }),

/***/ 6478:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   u: () => (/* binding */ PgDateColumnBaseBuilder)
/* harmony export */ });
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(48666);
/* harmony import */ var _sql_sql_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(67910);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(70704);



class PgDateColumnBaseBuilder extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .PgColumnBuilder */ .pe {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgDateColumnBaseBuilder";
  defaultNow() {
    return this.default((0,_sql_sql_js__WEBPACK_IMPORTED_MODULE_2__/* .sql */ .ll)`now()`);
  }
}

//# sourceMappingURL=date.common.js.map

/***/ }),

/***/ 81077:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   dw: () => (/* binding */ PgDateString),
/* harmony export */   p6: () => (/* binding */ date),
/* harmony export */   qw: () => (/* binding */ PgDate)
/* harmony export */ });
/* unused harmony exports PgDateBuilder, PgDateStringBuilder */
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(48666);
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(82348);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(70704);
/* harmony import */ var _date_common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(6478);




class PgDateBuilder extends _date_common_js__WEBPACK_IMPORTED_MODULE_0__/* .PgDateColumnBaseBuilder */ .u {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgDateBuilder";
  constructor(name) {
    super(name, "date", "PgDate");
  }
  /** @internal */
  build(table) {
    return new PgDate(table, this.config);
  }
}
class PgDate extends _common_js__WEBPACK_IMPORTED_MODULE_2__/* .PgColumn */ .Kl {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgDate";
  getSQLType() {
    return "date";
  }
  mapFromDriverValue(value) {
    return new Date(value);
  }
  mapToDriverValue(value) {
    return value.toISOString();
  }
}
class PgDateStringBuilder extends _date_common_js__WEBPACK_IMPORTED_MODULE_0__/* .PgDateColumnBaseBuilder */ .u {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgDateStringBuilder";
  constructor(name) {
    super(name, "string", "PgDateString");
  }
  /** @internal */
  build(table) {
    return new PgDateString(
      table,
      this.config
    );
  }
}
class PgDateString extends _common_js__WEBPACK_IMPORTED_MODULE_2__/* .PgColumn */ .Kl {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgDateString";
  getSQLType() {
    return "date";
  }
}
function date(a, b) {
  const { name, config } = (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .getColumnNameAndConfig */ .Ll)(a, b);
  if (config?.mode === "date") {
    return new PgDateBuilder(name);
  }
  return new PgDateStringBuilder(name);
}

//# sourceMappingURL=date.js.map

/***/ }),

/***/ 83141:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   p: () => (/* binding */ PgIntColumnBaseBuilder)
/* harmony export */ });
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(48666);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(70704);


class PgIntColumnBaseBuilder extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .PgColumnBuilder */ .pe {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgIntColumnBaseBuilder";
  generatedAlwaysAsIdentity(sequence) {
    if (sequence) {
      const { name, ...options } = sequence;
      this.config.generatedIdentity = {
        type: "always",
        sequenceName: name,
        sequenceOptions: options
      };
    } else {
      this.config.generatedIdentity = {
        type: "always"
      };
    }
    this.config.hasDefault = true;
    this.config.notNull = true;
    return this;
  }
  generatedByDefaultAsIdentity(sequence) {
    if (sequence) {
      const { name, ...options } = sequence;
      this.config.generatedIdentity = {
        type: "byDefault",
        sequenceName: name,
        sequenceOptions: options
      };
    } else {
      this.config.generatedIdentity = {
        type: "byDefault"
      };
    }
    this.config.hasDefault = true;
    this.config.notNull = true;
    return this;
  }
}

//# sourceMappingURL=int.common.js.map

/***/ }),

/***/ 97815:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   nd: () => (/* binding */ integer)
/* harmony export */ });
/* unused harmony exports PgInteger, PgIntegerBuilder */
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(48666);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(70704);
/* harmony import */ var _int_common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(83141);



class PgIntegerBuilder extends _int_common_js__WEBPACK_IMPORTED_MODULE_0__/* .PgIntColumnBaseBuilder */ .p {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgIntegerBuilder";
  constructor(name) {
    super(name, "number", "PgInteger");
  }
  /** @internal */
  build(table) {
    return new PgInteger(table, this.config);
  }
}
class PgInteger extends _common_js__WEBPACK_IMPORTED_MODULE_2__/* .PgColumn */ .Kl {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgInteger";
  getSQLType() {
    return "integer";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      return Number.parseInt(value);
    }
    return value;
  }
}
function integer(name) {
  return new PgIntegerBuilder(name ?? "");
}

//# sourceMappingURL=integer.js.map

/***/ }),

/***/ 75127:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Pq: () => (/* binding */ json),
/* harmony export */   iX: () => (/* binding */ PgJson)
/* harmony export */ });
/* unused harmony export PgJsonBuilder */
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(48666);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(70704);


class PgJsonBuilder extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .PgColumnBuilder */ .pe {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgJsonBuilder";
  constructor(name) {
    super(name, "json", "PgJson");
  }
  /** @internal */
  build(table) {
    return new PgJson(table, this.config);
  }
}
class PgJson extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .PgColumn */ .Kl {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgJson";
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return "json";
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }
}
function json(name) {
  return new PgJsonBuilder(name ?? "");
}

//# sourceMappingURL=json.js.map

/***/ }),

/***/ 78785:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Fx: () => (/* binding */ jsonb),
/* harmony export */   kn: () => (/* binding */ PgJsonb)
/* harmony export */ });
/* unused harmony export PgJsonbBuilder */
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(48666);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(70704);


class PgJsonbBuilder extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .PgColumnBuilder */ .pe {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgJsonbBuilder";
  constructor(name) {
    super(name, "json", "PgJsonb");
  }
  /** @internal */
  build(table) {
    return new PgJsonb(table, this.config);
  }
}
class PgJsonb extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .PgColumn */ .Kl {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgJsonb";
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return "jsonb";
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }
}
function jsonb(name) {
  return new PgJsonbBuilder(name ?? "");
}

//# sourceMappingURL=jsonb.js.map

/***/ }),

/***/ 90994:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Z5: () => (/* binding */ PgNumeric),
/* harmony export */   sH: () => (/* binding */ numeric)
/* harmony export */ });
/* unused harmony exports PgNumericBigInt, PgNumericBigIntBuilder, PgNumericBuilder, PgNumericNumber, PgNumericNumberBuilder, decimal */
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(48666);
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(82348);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(70704);



class PgNumericBuilder extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .PgColumnBuilder */ .pe {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgNumericBuilder";
  constructor(name, precision, scale) {
    super(name, "string", "PgNumeric");
    this.config.precision = precision;
    this.config.scale = scale;
  }
  /** @internal */
  build(table) {
    return new PgNumeric(table, this.config);
  }
}
class PgNumeric extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .PgColumn */ .Kl {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgNumeric";
  precision;
  scale;
  constructor(table, config) {
    super(table, config);
    this.precision = config.precision;
    this.scale = config.scale;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") return value;
    return String(value);
  }
  getSQLType() {
    if (this.precision !== void 0 && this.scale !== void 0) {
      return `numeric(${this.precision}, ${this.scale})`;
    } else if (this.precision === void 0) {
      return "numeric";
    } else {
      return `numeric(${this.precision})`;
    }
  }
}
class PgNumericNumberBuilder extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .PgColumnBuilder */ .pe {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgNumericNumberBuilder";
  constructor(name, precision, scale) {
    super(name, "number", "PgNumericNumber");
    this.config.precision = precision;
    this.config.scale = scale;
  }
  /** @internal */
  build(table) {
    return new PgNumericNumber(
      table,
      this.config
    );
  }
}
class PgNumericNumber extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .PgColumn */ .Kl {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgNumericNumber";
  precision;
  scale;
  constructor(table, config) {
    super(table, config);
    this.precision = config.precision;
    this.scale = config.scale;
  }
  mapFromDriverValue(value) {
    if (typeof value === "number") return value;
    return Number(value);
  }
  mapToDriverValue = String;
  getSQLType() {
    if (this.precision !== void 0 && this.scale !== void 0) {
      return `numeric(${this.precision}, ${this.scale})`;
    } else if (this.precision === void 0) {
      return "numeric";
    } else {
      return `numeric(${this.precision})`;
    }
  }
}
class PgNumericBigIntBuilder extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .PgColumnBuilder */ .pe {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgNumericBigIntBuilder";
  constructor(name, precision, scale) {
    super(name, "bigint", "PgNumericBigInt");
    this.config.precision = precision;
    this.config.scale = scale;
  }
  /** @internal */
  build(table) {
    return new PgNumericBigInt(
      table,
      this.config
    );
  }
}
class PgNumericBigInt extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .PgColumn */ .Kl {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgNumericBigInt";
  precision;
  scale;
  constructor(table, config) {
    super(table, config);
    this.precision = config.precision;
    this.scale = config.scale;
  }
  mapFromDriverValue = BigInt;
  mapToDriverValue = String;
  getSQLType() {
    if (this.precision !== void 0 && this.scale !== void 0) {
      return `numeric(${this.precision}, ${this.scale})`;
    } else if (this.precision === void 0) {
      return "numeric";
    } else {
      return `numeric(${this.precision})`;
    }
  }
}
function numeric(a, b) {
  const { name, config } = (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__/* .getColumnNameAndConfig */ .Ll)(a, b);
  const mode = config?.mode;
  return mode === "number" ? new PgNumericNumberBuilder(name, config?.precision, config?.scale) : mode === "bigint" ? new PgNumericBigIntBuilder(name, config?.precision, config?.scale) : new PgNumericBuilder(name, config?.precision, config?.scale);
}
const decimal = (/* unused pure expression or super */ null && (numeric));

//# sourceMappingURL=numeric.js.map

/***/ }),

/***/ 82857:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   x: () => (/* binding */ real)
/* harmony export */ });
/* unused harmony exports PgReal, PgRealBuilder */
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(48666);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(70704);


class PgRealBuilder extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .PgColumnBuilder */ .pe {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgRealBuilder";
  constructor(name, length) {
    super(name, "number", "PgReal");
    this.config.length = length;
  }
  /** @internal */
  build(table) {
    return new PgReal(table, this.config);
  }
}
class PgReal extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .PgColumn */ .Kl {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgReal";
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return "real";
  }
  mapFromDriverValue = (value) => {
    if (typeof value === "string") {
      return Number.parseFloat(value);
    }
    return value;
  };
}
function real(name) {
  return new PgRealBuilder(name ?? "");
}

//# sourceMappingURL=real.js.map

/***/ }),

/***/ 77541:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   vX: () => (/* binding */ serial)
/* harmony export */ });
/* unused harmony exports PgSerial, PgSerialBuilder */
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(48666);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(70704);


class PgSerialBuilder extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .PgColumnBuilder */ .pe {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgSerialBuilder";
  constructor(name) {
    super(name, "number", "PgSerial");
    this.config.hasDefault = true;
    this.config.notNull = true;
  }
  /** @internal */
  build(table) {
    return new PgSerial(table, this.config);
  }
}
class PgSerial extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .PgColumn */ .Kl {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgSerial";
  getSQLType() {
    return "serial";
  }
}
function serial(name) {
  return new PgSerialBuilder(name ?? "");
}

//# sourceMappingURL=serial.js.map

/***/ }),

/***/ 74134:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Qq: () => (/* binding */ text)
/* harmony export */ });
/* unused harmony exports PgText, PgTextBuilder */
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(48666);
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(82348);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(70704);



class PgTextBuilder extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .PgColumnBuilder */ .pe {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgTextBuilder";
  constructor(name, config) {
    super(name, "string", "PgText");
    this.config.enumValues = config.enum;
  }
  /** @internal */
  build(table) {
    return new PgText(table, this.config);
  }
}
class PgText extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .PgColumn */ .Kl {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgText";
  enumValues = this.config.enumValues;
  getSQLType() {
    return "text";
  }
}
function text(a, b = {}) {
  const { name, config } = (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__/* .getColumnNameAndConfig */ .Ll)(a, b);
  return new PgTextBuilder(name, config);
}

//# sourceMappingURL=text.js.map

/***/ }),

/***/ 72988:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Xd: () => (/* binding */ PgTime),
/* harmony export */   kB: () => (/* binding */ time)
/* harmony export */ });
/* unused harmony export PgTimeBuilder */
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(48666);
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(82348);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(70704);
/* harmony import */ var _date_common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(6478);




class PgTimeBuilder extends _date_common_js__WEBPACK_IMPORTED_MODULE_0__/* .PgDateColumnBaseBuilder */ .u {
  constructor(name, withTimezone, precision) {
    super(name, "string", "PgTime");
    this.withTimezone = withTimezone;
    this.precision = precision;
    this.config.withTimezone = withTimezone;
    this.config.precision = precision;
  }
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgTimeBuilder";
  /** @internal */
  build(table) {
    return new PgTime(table, this.config);
  }
}
class PgTime extends _common_js__WEBPACK_IMPORTED_MODULE_2__/* .PgColumn */ .Kl {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgTime";
  withTimezone;
  precision;
  constructor(table, config) {
    super(table, config);
    this.withTimezone = config.withTimezone;
    this.precision = config.precision;
  }
  getSQLType() {
    const precision = this.precision === void 0 ? "" : `(${this.precision})`;
    return `time${precision}${this.withTimezone ? " with time zone" : ""}`;
  }
}
function time(a, b = {}) {
  const { name, config } = (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .getColumnNameAndConfig */ .Ll)(a, b);
  return new PgTimeBuilder(name, config.withTimezone ?? false, config.precision);
}

//# sourceMappingURL=time.js.map

/***/ }),

/***/ 87841:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   KM: () => (/* binding */ PgTimestamp),
/* harmony export */   vE: () => (/* binding */ timestamp),
/* harmony export */   xQ: () => (/* binding */ PgTimestampString)
/* harmony export */ });
/* unused harmony exports PgTimestampBuilder, PgTimestampStringBuilder */
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(48666);
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(82348);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(70704);
/* harmony import */ var _date_common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(6478);




class PgTimestampBuilder extends _date_common_js__WEBPACK_IMPORTED_MODULE_0__/* .PgDateColumnBaseBuilder */ .u {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgTimestampBuilder";
  constructor(name, withTimezone, precision) {
    super(name, "date", "PgTimestamp");
    this.config.withTimezone = withTimezone;
    this.config.precision = precision;
  }
  /** @internal */
  build(table) {
    return new PgTimestamp(table, this.config);
  }
}
class PgTimestamp extends _common_js__WEBPACK_IMPORTED_MODULE_2__/* .PgColumn */ .Kl {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgTimestamp";
  withTimezone;
  precision;
  constructor(table, config) {
    super(table, config);
    this.withTimezone = config.withTimezone;
    this.precision = config.precision;
  }
  getSQLType() {
    const precision = this.precision === void 0 ? "" : ` (${this.precision})`;
    return `timestamp${precision}${this.withTimezone ? " with time zone" : ""}`;
  }
  mapFromDriverValue = (value) => {
    return new Date(this.withTimezone ? value : value + "+0000");
  };
  mapToDriverValue = (value) => {
    return value.toISOString();
  };
}
class PgTimestampStringBuilder extends _date_common_js__WEBPACK_IMPORTED_MODULE_0__/* .PgDateColumnBaseBuilder */ .u {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgTimestampStringBuilder";
  constructor(name, withTimezone, precision) {
    super(name, "string", "PgTimestampString");
    this.config.withTimezone = withTimezone;
    this.config.precision = precision;
  }
  /** @internal */
  build(table) {
    return new PgTimestampString(
      table,
      this.config
    );
  }
}
class PgTimestampString extends _common_js__WEBPACK_IMPORTED_MODULE_2__/* .PgColumn */ .Kl {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgTimestampString";
  withTimezone;
  precision;
  constructor(table, config) {
    super(table, config);
    this.withTimezone = config.withTimezone;
    this.precision = config.precision;
  }
  getSQLType() {
    const precision = this.precision === void 0 ? "" : `(${this.precision})`;
    return `timestamp${precision}${this.withTimezone ? " with time zone" : ""}`;
  }
}
function timestamp(a, b = {}) {
  const { name, config } = (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .getColumnNameAndConfig */ .Ll)(a, b);
  if (config?.mode === "string") {
    return new PgTimestampStringBuilder(name, config.withTimezone ?? false, config.precision);
  }
  return new PgTimestampBuilder(name, config?.withTimezone ?? false, config?.precision);
}

//# sourceMappingURL=timestamp.js.map

/***/ }),

/***/ 58546:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   dL: () => (/* binding */ PgUUID),
/* harmony export */   uR: () => (/* binding */ uuid)
/* harmony export */ });
/* unused harmony export PgUUIDBuilder */
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(48666);
/* harmony import */ var _sql_sql_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(67910);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(70704);



class PgUUIDBuilder extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .PgColumnBuilder */ .pe {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgUUIDBuilder";
  constructor(name) {
    super(name, "string", "PgUUID");
  }
  /**
   * Adds `default gen_random_uuid()` to the column definition.
   */
  defaultRandom() {
    return this.default((0,_sql_sql_js__WEBPACK_IMPORTED_MODULE_2__/* .sql */ .ll)`gen_random_uuid()`);
  }
  /** @internal */
  build(table) {
    return new PgUUID(table, this.config);
  }
}
class PgUUID extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .PgColumn */ .Kl {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgUUID";
  getSQLType() {
    return "uuid";
  }
}
function uuid(name) {
  return new PgUUIDBuilder(name ?? "");
}

//# sourceMappingURL=uuid.js.map

/***/ }),

/***/ 22232:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   yf: () => (/* binding */ varchar)
/* harmony export */ });
/* unused harmony exports PgVarchar, PgVarcharBuilder */
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(48666);
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(82348);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(70704);



class PgVarcharBuilder extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .PgColumnBuilder */ .pe {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgVarcharBuilder";
  constructor(name, config) {
    super(name, "string", "PgVarchar");
    this.config.length = config.length;
    this.config.enumValues = config.enum;
  }
  /** @internal */
  build(table) {
    return new PgVarchar(
      table,
      this.config
    );
  }
}
class PgVarchar extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .PgColumn */ .Kl {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "PgVarchar";
  length = this.config.length;
  enumValues = this.config.enumValues;
  getSQLType() {
    return this.length === void 0 ? `varchar` : `varchar(${this.length})`;
  }
}
function varchar(a, b = {}) {
  const { name, config } = (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__/* .getColumnNameAndConfig */ .Ll)(a, b);
  return new PgVarcharBuilder(name, config);
}

//# sourceMappingURL=varchar.js.map

/***/ }),

/***/ 78886:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  mu: () => (/* binding */ PgTable),
  cJ: () => (/* binding */ pgTable)
});

// UNUSED EXPORTS: EnableRLS, InlineForeignKeys, pgTableCreator, pgTableWithSchema

// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/entity.js
var entity = __webpack_require__(48666);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/table.js
var drizzle_orm_table = __webpack_require__(17169);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/utils.js
var utils = __webpack_require__(82348);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/common.js + 3 modules
var common = __webpack_require__(70704);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/int.common.js
var int_common = __webpack_require__(83141);
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/bigint.js




class PgBigInt53Builder extends int_common/* PgIntColumnBaseBuilder */.p {
  static [entity/* entityKind */.i] = "PgBigInt53Builder";
  constructor(name) {
    super(name, "number", "PgBigInt53");
  }
  /** @internal */
  build(table) {
    return new PgBigInt53(table, this.config);
  }
}
class PgBigInt53 extends common/* PgColumn */.Kl {
  static [entity/* entityKind */.i] = "PgBigInt53";
  getSQLType() {
    return "bigint";
  }
  mapFromDriverValue(value) {
    if (typeof value === "number") {
      return value;
    }
    return Number(value);
  }
}
class PgBigInt64Builder extends int_common/* PgIntColumnBaseBuilder */.p {
  static [entity/* entityKind */.i] = "PgBigInt64Builder";
  constructor(name) {
    super(name, "bigint", "PgBigInt64");
  }
  /** @internal */
  build(table) {
    return new PgBigInt64(
      table,
      this.config
    );
  }
}
class PgBigInt64 extends common/* PgColumn */.Kl {
  static [entity/* entityKind */.i] = "PgBigInt64";
  getSQLType() {
    return "bigint";
  }
  // eslint-disable-next-line unicorn/prefer-native-coercion-functions
  mapFromDriverValue(value) {
    return BigInt(value);
  }
}
function bigint(a, b) {
  const { name, config } = (0,utils/* getColumnNameAndConfig */.Ll)(a, b);
  if (config.mode === "number") {
    return new PgBigInt53Builder(name);
  }
  return new PgBigInt64Builder(name);
}

//# sourceMappingURL=bigint.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/bigserial.js



class PgBigSerial53Builder extends common/* PgColumnBuilder */.pe {
  static [entity/* entityKind */.i] = "PgBigSerial53Builder";
  constructor(name) {
    super(name, "number", "PgBigSerial53");
    this.config.hasDefault = true;
    this.config.notNull = true;
  }
  /** @internal */
  build(table) {
    return new PgBigSerial53(
      table,
      this.config
    );
  }
}
class PgBigSerial53 extends common/* PgColumn */.Kl {
  static [entity/* entityKind */.i] = "PgBigSerial53";
  getSQLType() {
    return "bigserial";
  }
  mapFromDriverValue(value) {
    if (typeof value === "number") {
      return value;
    }
    return Number(value);
  }
}
class PgBigSerial64Builder extends common/* PgColumnBuilder */.pe {
  static [entity/* entityKind */.i] = "PgBigSerial64Builder";
  constructor(name) {
    super(name, "bigint", "PgBigSerial64");
    this.config.hasDefault = true;
  }
  /** @internal */
  build(table) {
    return new PgBigSerial64(
      table,
      this.config
    );
  }
}
class PgBigSerial64 extends common/* PgColumn */.Kl {
  static [entity/* entityKind */.i] = "PgBigSerial64";
  getSQLType() {
    return "bigserial";
  }
  // eslint-disable-next-line unicorn/prefer-native-coercion-functions
  mapFromDriverValue(value) {
    return BigInt(value);
  }
}
function bigserial(a, b) {
  const { name, config } = (0,utils/* getColumnNameAndConfig */.Ll)(a, b);
  if (config.mode === "number") {
    return new PgBigSerial53Builder(name);
  }
  return new PgBigSerial64Builder(name);
}

//# sourceMappingURL=bigserial.js.map
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/boolean.js
var columns_boolean = __webpack_require__(60401);
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/char.js



class PgCharBuilder extends common/* PgColumnBuilder */.pe {
  static [entity/* entityKind */.i] = "PgCharBuilder";
  constructor(name, config) {
    super(name, "string", "PgChar");
    this.config.length = config.length;
    this.config.enumValues = config.enum;
  }
  /** @internal */
  build(table) {
    return new PgChar(
      table,
      this.config
    );
  }
}
class PgChar extends common/* PgColumn */.Kl {
  static [entity/* entityKind */.i] = "PgChar";
  length = this.config.length;
  enumValues = this.config.enumValues;
  getSQLType() {
    return this.length === void 0 ? `char` : `char(${this.length})`;
  }
}
function char_char(a, b = {}) {
  const { name, config } = (0,utils/* getColumnNameAndConfig */.Ll)(a, b);
  return new PgCharBuilder(name, config);
}

//# sourceMappingURL=char.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/cidr.js


class PgCidrBuilder extends common/* PgColumnBuilder */.pe {
  static [entity/* entityKind */.i] = "PgCidrBuilder";
  constructor(name) {
    super(name, "string", "PgCidr");
  }
  /** @internal */
  build(table) {
    return new PgCidr(table, this.config);
  }
}
class PgCidr extends common/* PgColumn */.Kl {
  static [entity/* entityKind */.i] = "PgCidr";
  getSQLType() {
    return "cidr";
  }
}
function cidr(name) {
  return new PgCidrBuilder(name ?? "");
}

//# sourceMappingURL=cidr.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/custom.js



class PgCustomColumnBuilder extends common/* PgColumnBuilder */.pe {
  static [entity/* entityKind */.i] = "PgCustomColumnBuilder";
  constructor(name, fieldConfig, customTypeParams) {
    super(name, "custom", "PgCustomColumn");
    this.config.fieldConfig = fieldConfig;
    this.config.customTypeParams = customTypeParams;
  }
  /** @internal */
  build(table) {
    return new PgCustomColumn(
      table,
      this.config
    );
  }
}
class PgCustomColumn extends common/* PgColumn */.Kl {
  static [entity/* entityKind */.i] = "PgCustomColumn";
  sqlName;
  mapTo;
  mapFrom;
  constructor(table, config) {
    super(table, config);
    this.sqlName = config.customTypeParams.dataType(config.fieldConfig);
    this.mapTo = config.customTypeParams.toDriver;
    this.mapFrom = config.customTypeParams.fromDriver;
  }
  getSQLType() {
    return this.sqlName;
  }
  mapFromDriverValue(value) {
    return typeof this.mapFrom === "function" ? this.mapFrom(value) : value;
  }
  mapToDriverValue(value) {
    return typeof this.mapTo === "function" ? this.mapTo(value) : value;
  }
}
function customType(customTypeParams) {
  return (a, b) => {
    const { name, config } = (0,utils/* getColumnNameAndConfig */.Ll)(a, b);
    return new PgCustomColumnBuilder(name, config, customTypeParams);
  };
}

//# sourceMappingURL=custom.js.map
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/date.js
var date = __webpack_require__(81077);
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/double-precision.js


class PgDoublePrecisionBuilder extends common/* PgColumnBuilder */.pe {
  static [entity/* entityKind */.i] = "PgDoublePrecisionBuilder";
  constructor(name) {
    super(name, "number", "PgDoublePrecision");
  }
  /** @internal */
  build(table) {
    return new PgDoublePrecision(
      table,
      this.config
    );
  }
}
class PgDoublePrecision extends common/* PgColumn */.Kl {
  static [entity/* entityKind */.i] = "PgDoublePrecision";
  getSQLType() {
    return "double precision";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      return Number.parseFloat(value);
    }
    return value;
  }
}
function doublePrecision(name) {
  return new PgDoublePrecisionBuilder(name ?? "");
}

//# sourceMappingURL=double-precision.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/inet.js


class PgInetBuilder extends common/* PgColumnBuilder */.pe {
  static [entity/* entityKind */.i] = "PgInetBuilder";
  constructor(name) {
    super(name, "string", "PgInet");
  }
  /** @internal */
  build(table) {
    return new PgInet(table, this.config);
  }
}
class PgInet extends common/* PgColumn */.Kl {
  static [entity/* entityKind */.i] = "PgInet";
  getSQLType() {
    return "inet";
  }
}
function inet(name) {
  return new PgInetBuilder(name ?? "");
}

//# sourceMappingURL=inet.js.map
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/integer.js
var integer = __webpack_require__(97815);
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/interval.js



class PgIntervalBuilder extends common/* PgColumnBuilder */.pe {
  static [entity/* entityKind */.i] = "PgIntervalBuilder";
  constructor(name, intervalConfig) {
    super(name, "string", "PgInterval");
    this.config.intervalConfig = intervalConfig;
  }
  /** @internal */
  build(table) {
    return new PgInterval(table, this.config);
  }
}
class PgInterval extends common/* PgColumn */.Kl {
  static [entity/* entityKind */.i] = "PgInterval";
  fields = this.config.intervalConfig.fields;
  precision = this.config.intervalConfig.precision;
  getSQLType() {
    const fields = this.fields ? ` ${this.fields}` : "";
    const precision = this.precision ? `(${this.precision})` : "";
    return `interval${fields}${precision}`;
  }
}
function interval(a, b = {}) {
  const { name, config } = (0,utils/* getColumnNameAndConfig */.Ll)(a, b);
  return new PgIntervalBuilder(name, config);
}

//# sourceMappingURL=interval.js.map
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/json.js
var json = __webpack_require__(75127);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/jsonb.js
var jsonb = __webpack_require__(78785);
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/line.js



class PgLineBuilder extends common/* PgColumnBuilder */.pe {
  static [entity/* entityKind */.i] = "PgLineBuilder";
  constructor(name) {
    super(name, "array", "PgLine");
  }
  /** @internal */
  build(table) {
    return new PgLineTuple(
      table,
      this.config
    );
  }
}
class PgLineTuple extends common/* PgColumn */.Kl {
  static [entity/* entityKind */.i] = "PgLine";
  getSQLType() {
    return "line";
  }
  mapFromDriverValue(value) {
    const [a, b, c] = value.slice(1, -1).split(",");
    return [Number.parseFloat(a), Number.parseFloat(b), Number.parseFloat(c)];
  }
  mapToDriverValue(value) {
    return `{${value[0]},${value[1]},${value[2]}}`;
  }
}
class PgLineABCBuilder extends common/* PgColumnBuilder */.pe {
  static [entity/* entityKind */.i] = "PgLineABCBuilder";
  constructor(name) {
    super(name, "json", "PgLineABC");
  }
  /** @internal */
  build(table) {
    return new PgLineABC(
      table,
      this.config
    );
  }
}
class PgLineABC extends common/* PgColumn */.Kl {
  static [entity/* entityKind */.i] = "PgLineABC";
  getSQLType() {
    return "line";
  }
  mapFromDriverValue(value) {
    const [a, b, c] = value.slice(1, -1).split(",");
    return { a: Number.parseFloat(a), b: Number.parseFloat(b), c: Number.parseFloat(c) };
  }
  mapToDriverValue(value) {
    return `{${value.a},${value.b},${value.c}}`;
  }
}
function line(a, b) {
  const { name, config } = (0,utils/* getColumnNameAndConfig */.Ll)(a, b);
  if (!config?.mode || config.mode === "tuple") {
    return new PgLineBuilder(name);
  }
  return new PgLineABCBuilder(name);
}

//# sourceMappingURL=line.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/macaddr.js


class PgMacaddrBuilder extends common/* PgColumnBuilder */.pe {
  static [entity/* entityKind */.i] = "PgMacaddrBuilder";
  constructor(name) {
    super(name, "string", "PgMacaddr");
  }
  /** @internal */
  build(table) {
    return new PgMacaddr(table, this.config);
  }
}
class PgMacaddr extends common/* PgColumn */.Kl {
  static [entity/* entityKind */.i] = "PgMacaddr";
  getSQLType() {
    return "macaddr";
  }
}
function macaddr(name) {
  return new PgMacaddrBuilder(name ?? "");
}

//# sourceMappingURL=macaddr.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/macaddr8.js


class PgMacaddr8Builder extends common/* PgColumnBuilder */.pe {
  static [entity/* entityKind */.i] = "PgMacaddr8Builder";
  constructor(name) {
    super(name, "string", "PgMacaddr8");
  }
  /** @internal */
  build(table) {
    return new PgMacaddr8(table, this.config);
  }
}
class PgMacaddr8 extends common/* PgColumn */.Kl {
  static [entity/* entityKind */.i] = "PgMacaddr8";
  getSQLType() {
    return "macaddr8";
  }
}
function macaddr8(name) {
  return new PgMacaddr8Builder(name ?? "");
}

//# sourceMappingURL=macaddr8.js.map
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/numeric.js
var numeric = __webpack_require__(90994);
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/point.js



class PgPointTupleBuilder extends common/* PgColumnBuilder */.pe {
  static [entity/* entityKind */.i] = "PgPointTupleBuilder";
  constructor(name) {
    super(name, "array", "PgPointTuple");
  }
  /** @internal */
  build(table) {
    return new PgPointTuple(
      table,
      this.config
    );
  }
}
class PgPointTuple extends common/* PgColumn */.Kl {
  static [entity/* entityKind */.i] = "PgPointTuple";
  getSQLType() {
    return "point";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      const [x, y] = value.slice(1, -1).split(",");
      return [Number.parseFloat(x), Number.parseFloat(y)];
    }
    return [value.x, value.y];
  }
  mapToDriverValue(value) {
    return `(${value[0]},${value[1]})`;
  }
}
class PgPointObjectBuilder extends common/* PgColumnBuilder */.pe {
  static [entity/* entityKind */.i] = "PgPointObjectBuilder";
  constructor(name) {
    super(name, "json", "PgPointObject");
  }
  /** @internal */
  build(table) {
    return new PgPointObject(
      table,
      this.config
    );
  }
}
class PgPointObject extends common/* PgColumn */.Kl {
  static [entity/* entityKind */.i] = "PgPointObject";
  getSQLType() {
    return "point";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      const [x, y] = value.slice(1, -1).split(",");
      return { x: Number.parseFloat(x), y: Number.parseFloat(y) };
    }
    return value;
  }
  mapToDriverValue(value) {
    return `(${value.x},${value.y})`;
  }
}
function point(a, b) {
  const { name, config } = (0,utils/* getColumnNameAndConfig */.Ll)(a, b);
  if (!config?.mode || config.mode === "tuple") {
    return new PgPointTupleBuilder(name);
  }
  return new PgPointObjectBuilder(name);
}

//# sourceMappingURL=point.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/postgis_extension/utils.js
function hexToBytes(hex) {
  const bytes = [];
  for (let c = 0; c < hex.length; c += 2) {
    bytes.push(Number.parseInt(hex.slice(c, c + 2), 16));
  }
  return new Uint8Array(bytes);
}
function bytesToFloat64(bytes, offset) {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  for (let i = 0; i < 8; i++) {
    view.setUint8(i, bytes[offset + i]);
  }
  return view.getFloat64(0, true);
}
function parseEWKB(hex) {
  const bytes = hexToBytes(hex);
  let offset = 0;
  const byteOrder = bytes[offset];
  offset += 1;
  const view = new DataView(bytes.buffer);
  const geomType = view.getUint32(offset, byteOrder === 1);
  offset += 4;
  let _srid;
  if (geomType & 536870912) {
    _srid = view.getUint32(offset, byteOrder === 1);
    offset += 4;
  }
  if ((geomType & 65535) === 1) {
    const x = bytesToFloat64(bytes, offset);
    offset += 8;
    const y = bytesToFloat64(bytes, offset);
    offset += 8;
    return [x, y];
  }
  throw new Error("Unsupported geometry type");
}

//# sourceMappingURL=utils.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/postgis_extension/geometry.js




class PgGeometryBuilder extends common/* PgColumnBuilder */.pe {
  static [entity/* entityKind */.i] = "PgGeometryBuilder";
  constructor(name) {
    super(name, "array", "PgGeometry");
  }
  /** @internal */
  build(table) {
    return new PgGeometry(
      table,
      this.config
    );
  }
}
class PgGeometry extends common/* PgColumn */.Kl {
  static [entity/* entityKind */.i] = "PgGeometry";
  getSQLType() {
    return "geometry(point)";
  }
  mapFromDriverValue(value) {
    return parseEWKB(value);
  }
  mapToDriverValue(value) {
    return `point(${value[0]} ${value[1]})`;
  }
}
class PgGeometryObjectBuilder extends common/* PgColumnBuilder */.pe {
  static [entity/* entityKind */.i] = "PgGeometryObjectBuilder";
  constructor(name) {
    super(name, "json", "PgGeometryObject");
  }
  /** @internal */
  build(table) {
    return new PgGeometryObject(
      table,
      this.config
    );
  }
}
class PgGeometryObject extends common/* PgColumn */.Kl {
  static [entity/* entityKind */.i] = "PgGeometryObject";
  getSQLType() {
    return "geometry(point)";
  }
  mapFromDriverValue(value) {
    const parsed = parseEWKB(value);
    return { x: parsed[0], y: parsed[1] };
  }
  mapToDriverValue(value) {
    return `point(${value.x} ${value.y})`;
  }
}
function geometry(a, b) {
  const { name, config } = (0,utils/* getColumnNameAndConfig */.Ll)(a, b);
  if (!config?.mode || config.mode === "tuple") {
    return new PgGeometryBuilder(name);
  }
  return new PgGeometryObjectBuilder(name);
}

//# sourceMappingURL=geometry.js.map
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/real.js
var real = __webpack_require__(82857);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/serial.js
var serial = __webpack_require__(77541);
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/smallint.js



class PgSmallIntBuilder extends int_common/* PgIntColumnBaseBuilder */.p {
  static [entity/* entityKind */.i] = "PgSmallIntBuilder";
  constructor(name) {
    super(name, "number", "PgSmallInt");
  }
  /** @internal */
  build(table) {
    return new PgSmallInt(table, this.config);
  }
}
class PgSmallInt extends common/* PgColumn */.Kl {
  static [entity/* entityKind */.i] = "PgSmallInt";
  getSQLType() {
    return "smallint";
  }
  mapFromDriverValue = (value) => {
    if (typeof value === "string") {
      return Number(value);
    }
    return value;
  };
}
function smallint(name) {
  return new PgSmallIntBuilder(name ?? "");
}

//# sourceMappingURL=smallint.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/smallserial.js


class PgSmallSerialBuilder extends common/* PgColumnBuilder */.pe {
  static [entity/* entityKind */.i] = "PgSmallSerialBuilder";
  constructor(name) {
    super(name, "number", "PgSmallSerial");
    this.config.hasDefault = true;
    this.config.notNull = true;
  }
  /** @internal */
  build(table) {
    return new PgSmallSerial(
      table,
      this.config
    );
  }
}
class PgSmallSerial extends common/* PgColumn */.Kl {
  static [entity/* entityKind */.i] = "PgSmallSerial";
  getSQLType() {
    return "smallserial";
  }
}
function smallserial(name) {
  return new PgSmallSerialBuilder(name ?? "");
}

//# sourceMappingURL=smallserial.js.map
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/text.js
var columns_text = __webpack_require__(74134);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/time.js
var time = __webpack_require__(72988);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/timestamp.js
var timestamp = __webpack_require__(87841);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/uuid.js
var uuid = __webpack_require__(58546);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/varchar.js
var varchar = __webpack_require__(22232);
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/vector_extension/bit.js



class PgBinaryVectorBuilder extends common/* PgColumnBuilder */.pe {
  static [entity/* entityKind */.i] = "PgBinaryVectorBuilder";
  constructor(name, config) {
    super(name, "string", "PgBinaryVector");
    this.config.dimensions = config.dimensions;
  }
  /** @internal */
  build(table) {
    return new PgBinaryVector(
      table,
      this.config
    );
  }
}
class PgBinaryVector extends common/* PgColumn */.Kl {
  static [entity/* entityKind */.i] = "PgBinaryVector";
  dimensions = this.config.dimensions;
  getSQLType() {
    return `bit(${this.dimensions})`;
  }
}
function bit(a, b) {
  const { name, config } = (0,utils/* getColumnNameAndConfig */.Ll)(a, b);
  return new PgBinaryVectorBuilder(name, config);
}

//# sourceMappingURL=bit.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/vector_extension/halfvec.js



class PgHalfVectorBuilder extends common/* PgColumnBuilder */.pe {
  static [entity/* entityKind */.i] = "PgHalfVectorBuilder";
  constructor(name, config) {
    super(name, "array", "PgHalfVector");
    this.config.dimensions = config.dimensions;
  }
  /** @internal */
  build(table) {
    return new PgHalfVector(
      table,
      this.config
    );
  }
}
class PgHalfVector extends common/* PgColumn */.Kl {
  static [entity/* entityKind */.i] = "PgHalfVector";
  dimensions = this.config.dimensions;
  getSQLType() {
    return `halfvec(${this.dimensions})`;
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
  mapFromDriverValue(value) {
    return value.slice(1, -1).split(",").map((v) => Number.parseFloat(v));
  }
}
function halfvec(a, b) {
  const { name, config } = (0,utils/* getColumnNameAndConfig */.Ll)(a, b);
  return new PgHalfVectorBuilder(name, config);
}

//# sourceMappingURL=halfvec.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/vector_extension/sparsevec.js



class PgSparseVectorBuilder extends common/* PgColumnBuilder */.pe {
  static [entity/* entityKind */.i] = "PgSparseVectorBuilder";
  constructor(name, config) {
    super(name, "string", "PgSparseVector");
    this.config.dimensions = config.dimensions;
  }
  /** @internal */
  build(table) {
    return new PgSparseVector(
      table,
      this.config
    );
  }
}
class PgSparseVector extends common/* PgColumn */.Kl {
  static [entity/* entityKind */.i] = "PgSparseVector";
  dimensions = this.config.dimensions;
  getSQLType() {
    return `sparsevec(${this.dimensions})`;
  }
}
function sparsevec(a, b) {
  const { name, config } = (0,utils/* getColumnNameAndConfig */.Ll)(a, b);
  return new PgSparseVectorBuilder(name, config);
}

//# sourceMappingURL=sparsevec.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/vector_extension/vector.js



class PgVectorBuilder extends common/* PgColumnBuilder */.pe {
  static [entity/* entityKind */.i] = "PgVectorBuilder";
  constructor(name, config) {
    super(name, "array", "PgVector");
    this.config.dimensions = config.dimensions;
  }
  /** @internal */
  build(table) {
    return new PgVector(
      table,
      this.config
    );
  }
}
class PgVector extends common/* PgColumn */.Kl {
  static [entity/* entityKind */.i] = "PgVector";
  dimensions = this.config.dimensions;
  getSQLType() {
    return `vector(${this.dimensions})`;
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
  mapFromDriverValue(value) {
    return value.slice(1, -1).split(",").map((v) => Number.parseFloat(v));
  }
}
function vector(a, b) {
  const { name, config } = (0,utils/* getColumnNameAndConfig */.Ll)(a, b);
  return new PgVectorBuilder(name, config);
}

//# sourceMappingURL=vector.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/all.js
































function getPgColumnBuilders() {
  return {
    bigint: bigint,
    bigserial: bigserial,
    boolean: columns_boolean/* boolean */.zM,
    char: char_char,
    cidr: cidr,
    customType: customType,
    date: date/* date */.p6,
    doublePrecision: doublePrecision,
    inet: inet,
    integer: integer/* integer */.nd,
    interval: interval,
    json: json/* json */.Pq,
    jsonb: jsonb/* jsonb */.Fx,
    line: line,
    macaddr: macaddr,
    macaddr8: macaddr8,
    numeric: numeric/* numeric */.sH,
    point: point,
    geometry: geometry,
    real: real/* real */.x,
    serial: serial/* serial */.vX,
    smallint: smallint,
    smallserial: smallserial,
    text: columns_text/* text */.Qq,
    time: time/* time */.kB,
    timestamp: timestamp/* timestamp */.vE,
    uuid: uuid/* uuid */.uR,
    varchar: varchar/* varchar */.yf,
    bit: bit,
    halfvec: halfvec,
    sparsevec: sparsevec,
    vector: vector
  };
}

//# sourceMappingURL=all.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/table.js



const InlineForeignKeys = Symbol.for("drizzle:PgInlineForeignKeys");
const EnableRLS = Symbol.for("drizzle:EnableRLS");
class PgTable extends drizzle_orm_table/* Table */.XI {
  static [entity/* entityKind */.i] = "PgTable";
  /** @internal */
  static Symbol = Object.assign({}, drizzle_orm_table/* Table */.XI.Symbol, {
    InlineForeignKeys,
    EnableRLS
  });
  /**@internal */
  [InlineForeignKeys] = [];
  /** @internal */
  [EnableRLS] = false;
  /** @internal */
  [drizzle_orm_table/* Table */.XI.Symbol.ExtraConfigBuilder] = void 0;
  /** @internal */
  [drizzle_orm_table/* Table */.XI.Symbol.ExtraConfigColumns] = {};
}
function pgTableWithSchema(name, columns, extraConfig, schema, baseName = name) {
  const rawTable = new PgTable(name, schema, baseName);
  const parsedColumns = typeof columns === "function" ? columns(getPgColumnBuilders()) : columns;
  const builtColumns = Object.fromEntries(
    Object.entries(parsedColumns).map(([name2, colBuilderBase]) => {
      const colBuilder = colBuilderBase;
      colBuilder.setName(name2);
      const column = colBuilder.build(rawTable);
      rawTable[InlineForeignKeys].push(...colBuilder.buildForeignKeys(column, rawTable));
      return [name2, column];
    })
  );
  const builtColumnsForExtraConfig = Object.fromEntries(
    Object.entries(parsedColumns).map(([name2, colBuilderBase]) => {
      const colBuilder = colBuilderBase;
      colBuilder.setName(name2);
      const column = colBuilder.buildExtraConfigColumn(rawTable);
      return [name2, column];
    })
  );
  const table = Object.assign(rawTable, builtColumns);
  table[drizzle_orm_table/* Table */.XI.Symbol.Columns] = builtColumns;
  table[drizzle_orm_table/* Table */.XI.Symbol.ExtraConfigColumns] = builtColumnsForExtraConfig;
  if (extraConfig) {
    table[PgTable.Symbol.ExtraConfigBuilder] = extraConfig;
  }
  return Object.assign(table, {
    enableRLS: () => {
      table[PgTable.Symbol.EnableRLS] = true;
      return table;
    }
  });
}
const pgTable = (name, columns, extraConfig) => {
  return pgTableWithSchema(name, columns, extraConfig, void 0);
};
function pgTableCreator(customizeTableName) {
  return (name, columns, extraConfig) => {
    return pgTableWithSchema(customizeTableName(name), columns, extraConfig, void 0, name);
  };
}

//# sourceMappingURL=table.js.map

/***/ }),

/***/ 45399:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   O: () => (/* binding */ TypedQueryBuilder)
/* harmony export */ });
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(48666);

class TypedQueryBuilder {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_0__/* .entityKind */ .i] = "TypedQueryBuilder";
  /** @internal */
  getSelectedFields() {
    return this._.selectedFields;
  }
}

//# sourceMappingURL=query-builder.js.map

/***/ }),

/***/ 61753:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   k: () => (/* binding */ QueryPromise)
/* harmony export */ });
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(48666);

class QueryPromise {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_0__/* .entityKind */ .i] = "QueryPromise";
  [Symbol.toStringTag] = "QueryPromise";
  catch(onRejected) {
    return this.then(void 0, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (reason) => {
        onFinally?.();
        throw reason;
      }
    );
  }
  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }
}

//# sourceMappingURL=query-promise.js.map

/***/ }),

/***/ 54518:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  iv: () => (/* binding */ Many),
  pD: () => (/* binding */ One),
  DZ: () => (/* binding */ createTableRelationsHelpers),
  _k: () => (/* binding */ extractTablesRelationalConfig),
  mm: () => (/* binding */ getOperators),
  rl: () => (/* binding */ getOrderByOperators),
  I$: () => (/* binding */ mapRelationalRow),
  W0: () => (/* binding */ normalizeRelation),
  K1: () => (/* binding */ relations)
});

// UNUSED EXPORTS: Relation, Relations, createMany, createOne

// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/table.js
var table = __webpack_require__(17169);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/column.js
var column = __webpack_require__(599);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/entity.js
var entity = __webpack_require__(48666);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/table.js + 21 modules
var pg_core_table = __webpack_require__(78886);
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/primary-keys.js


function primaryKey(...config) {
  if (config[0].columns) {
    return new PrimaryKeyBuilder(config[0].columns, config[0].name);
  }
  return new PrimaryKeyBuilder(config);
}
class PrimaryKeyBuilder {
  static [entity/* entityKind */.i] = "PgPrimaryKeyBuilder";
  /** @internal */
  columns;
  /** @internal */
  name;
  constructor(columns, name) {
    this.columns = columns;
    this.name = name;
  }
  /** @internal */
  build(table) {
    return new PrimaryKey(table, this.columns, this.name);
  }
}
class PrimaryKey {
  constructor(table, columns, name) {
    this.table = table;
    this.columns = columns;
    this.name = name;
  }
  static [entity/* entityKind */.i] = "PgPrimaryKey";
  columns;
  name;
  getName() {
    return this.name ?? `${this.table[pg_core_table/* PgTable */.mu.Symbol.Name]}_${this.columns.map((column) => column.name).join("_")}_pk`;
  }
}

//# sourceMappingURL=primary-keys.js.map
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sql/expressions/conditions.js
var conditions = __webpack_require__(7002);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sql/expressions/select.js
var expressions_select = __webpack_require__(37372);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sql/sql.js + 1 modules
var sql = __webpack_require__(67910);
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/relations.js






class Relation {
  constructor(sourceTable, referencedTable, relationName) {
    this.sourceTable = sourceTable;
    this.referencedTable = referencedTable;
    this.relationName = relationName;
    this.referencedTableName = referencedTable[table/* Table */.XI.Symbol.Name];
  }
  static [entity/* entityKind */.i] = "Relation";
  referencedTableName;
  fieldName;
}
class Relations {
  constructor(table, config) {
    this.table = table;
    this.config = config;
  }
  static [entity/* entityKind */.i] = "Relations";
}
class One extends Relation {
  constructor(sourceTable, referencedTable, config, isNullable) {
    super(sourceTable, referencedTable, config?.relationName);
    this.config = config;
    this.isNullable = isNullable;
  }
  static [entity/* entityKind */.i] = "One";
  withFieldName(fieldName) {
    const relation = new One(
      this.sourceTable,
      this.referencedTable,
      this.config,
      this.isNullable
    );
    relation.fieldName = fieldName;
    return relation;
  }
}
class Many extends Relation {
  constructor(sourceTable, referencedTable, config) {
    super(sourceTable, referencedTable, config?.relationName);
    this.config = config;
  }
  static [entity/* entityKind */.i] = "Many";
  withFieldName(fieldName) {
    const relation = new Many(
      this.sourceTable,
      this.referencedTable,
      this.config
    );
    relation.fieldName = fieldName;
    return relation;
  }
}
function getOperators() {
  return {
    and: conditions/* and */.Uo,
    between: conditions/* between */.Tq,
    eq: conditions.eq,
    exists: conditions/* exists */.t2,
    gt: conditions.gt,
    gte: conditions/* gte */.RO,
    ilike: conditions/* ilike */.B3,
    inArray: conditions/* inArray */.RV,
    isNull: conditions/* isNull */.kZ,
    isNotNull: conditions/* isNotNull */.Pe,
    like: conditions/* like */.mj,
    lt: conditions.lt,
    lte: conditions/* lte */.wJ,
    ne: conditions.ne,
    not: conditions/* not */.AU,
    notBetween: conditions/* notBetween */.o8,
    notExists: conditions/* notExists */.KJ,
    notLike: conditions/* notLike */.RK,
    notIlike: conditions/* notIlike */.q1,
    notInArray: conditions/* notInArray */.KL,
    or: conditions.or,
    sql: sql/* sql */.ll
  };
}
function getOrderByOperators() {
  return {
    sql: sql/* sql */.ll,
    asc: expressions_select/* asc */.Y,
    desc: expressions_select/* desc */.i
  };
}
function extractTablesRelationalConfig(schema, configHelpers) {
  if (Object.keys(schema).length === 1 && "default" in schema && !(0,entity.is)(schema["default"], table/* Table */.XI)) {
    schema = schema["default"];
  }
  const tableNamesMap = {};
  const relationsBuffer = {};
  const tablesConfig = {};
  for (const [key, value] of Object.entries(schema)) {
    if ((0,entity.is)(value, table/* Table */.XI)) {
      const dbName = (0,table/* getTableUniqueName */.Lf)(value);
      const bufferedRelations = relationsBuffer[dbName];
      tableNamesMap[dbName] = key;
      tablesConfig[key] = {
        tsName: key,
        dbName: value[table/* Table */.XI.Symbol.Name],
        schema: value[table/* Table */.XI.Symbol.Schema],
        columns: value[table/* Table */.XI.Symbol.Columns],
        relations: bufferedRelations?.relations ?? {},
        primaryKey: bufferedRelations?.primaryKey ?? []
      };
      for (const column of Object.values(
        value[table/* Table */.XI.Symbol.Columns]
      )) {
        if (column.primary) {
          tablesConfig[key].primaryKey.push(column);
        }
      }
      const extraConfig = value[table/* Table */.XI.Symbol.ExtraConfigBuilder]?.(value[table/* Table */.XI.Symbol.ExtraConfigColumns]);
      if (extraConfig) {
        for (const configEntry of Object.values(extraConfig)) {
          if ((0,entity.is)(configEntry, PrimaryKeyBuilder)) {
            tablesConfig[key].primaryKey.push(...configEntry.columns);
          }
        }
      }
    } else if ((0,entity.is)(value, Relations)) {
      const dbName = (0,table/* getTableUniqueName */.Lf)(value.table);
      const tableName = tableNamesMap[dbName];
      const relations2 = value.config(
        configHelpers(value.table)
      );
      let primaryKey;
      for (const [relationName, relation] of Object.entries(relations2)) {
        if (tableName) {
          const tableConfig = tablesConfig[tableName];
          tableConfig.relations[relationName] = relation;
          if (primaryKey) {
            tableConfig.primaryKey.push(...primaryKey);
          }
        } else {
          if (!(dbName in relationsBuffer)) {
            relationsBuffer[dbName] = {
              relations: {},
              primaryKey
            };
          }
          relationsBuffer[dbName].relations[relationName] = relation;
        }
      }
    }
  }
  return { tables: tablesConfig, tableNamesMap };
}
function relations(table, relations2) {
  return new Relations(
    table,
    (helpers) => Object.fromEntries(
      Object.entries(relations2(helpers)).map(([key, value]) => [
        key,
        value.withFieldName(key)
      ])
    )
  );
}
function createOne(sourceTable) {
  return function one(table, config) {
    return new One(
      sourceTable,
      table,
      config,
      config?.fields.reduce((res, f) => res && f.notNull, true) ?? false
    );
  };
}
function createMany(sourceTable) {
  return function many(referencedTable, config) {
    return new Many(sourceTable, referencedTable, config);
  };
}
function normalizeRelation(schema, tableNamesMap, relation) {
  if ((0,entity.is)(relation, One) && relation.config) {
    return {
      fields: relation.config.fields,
      references: relation.config.references
    };
  }
  const referencedTableTsName = tableNamesMap[(0,table/* getTableUniqueName */.Lf)(relation.referencedTable)];
  if (!referencedTableTsName) {
    throw new Error(
      `Table "${relation.referencedTable[table/* Table */.XI.Symbol.Name]}" not found in schema`
    );
  }
  const referencedTableConfig = schema[referencedTableTsName];
  if (!referencedTableConfig) {
    throw new Error(`Table "${referencedTableTsName}" not found in schema`);
  }
  const sourceTable = relation.sourceTable;
  const sourceTableTsName = tableNamesMap[(0,table/* getTableUniqueName */.Lf)(sourceTable)];
  if (!sourceTableTsName) {
    throw new Error(
      `Table "${sourceTable[table/* Table */.XI.Symbol.Name]}" not found in schema`
    );
  }
  const reverseRelations = [];
  for (const referencedTableRelation of Object.values(
    referencedTableConfig.relations
  )) {
    if (relation.relationName && relation !== referencedTableRelation && referencedTableRelation.relationName === relation.relationName || !relation.relationName && referencedTableRelation.referencedTable === relation.sourceTable) {
      reverseRelations.push(referencedTableRelation);
    }
  }
  if (reverseRelations.length > 1) {
    throw relation.relationName ? new Error(
      `There are multiple relations with name "${relation.relationName}" in table "${referencedTableTsName}"`
    ) : new Error(
      `There are multiple relations between "${referencedTableTsName}" and "${relation.sourceTable[table/* Table */.XI.Symbol.Name]}". Please specify relation name`
    );
  }
  if (reverseRelations[0] && (0,entity.is)(reverseRelations[0], One) && reverseRelations[0].config) {
    return {
      fields: reverseRelations[0].config.references,
      references: reverseRelations[0].config.fields
    };
  }
  throw new Error(
    `There is not enough information to infer relation "${sourceTableTsName}.${relation.fieldName}"`
  );
}
function createTableRelationsHelpers(sourceTable) {
  return {
    one: createOne(sourceTable),
    many: createMany(sourceTable)
  };
}
function mapRelationalRow(tablesConfig, tableConfig, row, buildQueryResultSelection, mapColumnValue = (value) => value) {
  const result = {};
  for (const [
    selectionItemIndex,
    selectionItem
  ] of buildQueryResultSelection.entries()) {
    if (selectionItem.isJson) {
      const relation = tableConfig.relations[selectionItem.tsKey];
      const rawSubRows = row[selectionItemIndex];
      const subRows = typeof rawSubRows === "string" ? JSON.parse(rawSubRows) : rawSubRows;
      result[selectionItem.tsKey] = (0,entity.is)(relation, One) ? subRows && mapRelationalRow(
        tablesConfig,
        tablesConfig[selectionItem.relationTableTsKey],
        subRows,
        selectionItem.selection,
        mapColumnValue
      ) : subRows.map(
        (subRow) => mapRelationalRow(
          tablesConfig,
          tablesConfig[selectionItem.relationTableTsKey],
          subRow,
          selectionItem.selection,
          mapColumnValue
        )
      );
    } else {
      const value = mapColumnValue(row[selectionItemIndex]);
      const field = selectionItem.field;
      let decoder;
      if ((0,entity.is)(field, column/* Column */.V)) {
        decoder = field;
      } else if ((0,entity.is)(field, sql/* SQL */.Xs)) {
        decoder = field.decoder;
      } else {
        decoder = field.sql.decoder;
      }
      result[selectionItem.tsKey] = value === null ? null : decoder.mapFromDriverValue(value);
    }
  }
  return result;
}

//# sourceMappingURL=relations.js.map

/***/ }),

/***/ 37406:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   b: () => (/* binding */ SelectionProxyHandler)
/* harmony export */ });
/* harmony import */ var _alias_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(91369);
/* harmony import */ var _column_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(599);
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(48666);
/* harmony import */ var _sql_sql_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(67910);
/* harmony import */ var _subquery_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(2387);
/* harmony import */ var _view_common_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(9152);






class SelectionProxyHandler {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_0__/* .entityKind */ .i] = "SelectionProxyHandler";
  config;
  constructor(config) {
    this.config = { ...config };
  }
  get(subquery, prop) {
    if (prop === "_") {
      return {
        ...subquery["_"],
        selectedFields: new Proxy(
          subquery._.selectedFields,
          this
        )
      };
    }
    if (prop === _view_common_js__WEBPACK_IMPORTED_MODULE_1__/* .ViewBaseConfig */ .n) {
      return {
        ...subquery[_view_common_js__WEBPACK_IMPORTED_MODULE_1__/* .ViewBaseConfig */ .n],
        selectedFields: new Proxy(
          subquery[_view_common_js__WEBPACK_IMPORTED_MODULE_1__/* .ViewBaseConfig */ .n].selectedFields,
          this
        )
      };
    }
    if (typeof prop === "symbol") {
      return subquery[prop];
    }
    const columns = (0,_entity_js__WEBPACK_IMPORTED_MODULE_0__.is)(subquery, _subquery_js__WEBPACK_IMPORTED_MODULE_2__/* .Subquery */ .n) ? subquery._.selectedFields : (0,_entity_js__WEBPACK_IMPORTED_MODULE_0__.is)(subquery, _sql_sql_js__WEBPACK_IMPORTED_MODULE_3__/* .View */ .Ss) ? subquery[_view_common_js__WEBPACK_IMPORTED_MODULE_1__/* .ViewBaseConfig */ .n].selectedFields : subquery;
    const value = columns[prop];
    if ((0,_entity_js__WEBPACK_IMPORTED_MODULE_0__.is)(value, _sql_sql_js__WEBPACK_IMPORTED_MODULE_3__/* .SQL */ .Xs.Aliased)) {
      if (this.config.sqlAliasedBehavior === "sql" && !value.isSelectionField) {
        return value.sql;
      }
      const newValue = value.clone();
      newValue.isSelectionField = true;
      return newValue;
    }
    if ((0,_entity_js__WEBPACK_IMPORTED_MODULE_0__.is)(value, _sql_sql_js__WEBPACK_IMPORTED_MODULE_3__/* .SQL */ .Xs)) {
      if (this.config.sqlBehavior === "sql") {
        return value;
      }
      throw new Error(
        `You tried to reference "${prop}" field from a subquery, which is a raw SQL field, but it doesn't have an alias declared. Please add an alias to the field using ".as('alias')" method.`
      );
    }
    if ((0,_entity_js__WEBPACK_IMPORTED_MODULE_0__.is)(value, _column_js__WEBPACK_IMPORTED_MODULE_4__/* .Column */ .V)) {
      if (this.config.alias) {
        return new Proxy(
          value,
          new _alias_js__WEBPACK_IMPORTED_MODULE_5__/* .ColumnAliasProxyHandler */ .Ht(
            new Proxy(
              value.table,
              new _alias_js__WEBPACK_IMPORTED_MODULE_5__/* .TableAliasProxyHandler */ .h_(this.config.alias, this.config.replaceOriginalName ?? false)
            )
          )
        );
      }
      return value;
    }
    if (typeof value !== "object" || value === null) {
      return value;
    }
    return new Proxy(value, new SelectionProxyHandler(this.config));
  }
}

//# sourceMappingURL=selection-proxy.js.map

/***/ }),

/***/ 7002:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AU: () => (/* binding */ not),
/* harmony export */   B3: () => (/* binding */ ilike),
/* harmony export */   KJ: () => (/* binding */ notExists),
/* harmony export */   KL: () => (/* binding */ notInArray),
/* harmony export */   Pe: () => (/* binding */ isNotNull),
/* harmony export */   RK: () => (/* binding */ notLike),
/* harmony export */   RO: () => (/* binding */ gte),
/* harmony export */   RV: () => (/* binding */ inArray),
/* harmony export */   Tq: () => (/* binding */ between),
/* harmony export */   Uo: () => (/* binding */ and),
/* harmony export */   eq: () => (/* binding */ eq),
/* harmony export */   gt: () => (/* binding */ gt),
/* harmony export */   kZ: () => (/* binding */ isNull),
/* harmony export */   lt: () => (/* binding */ lt),
/* harmony export */   mj: () => (/* binding */ like),
/* harmony export */   ne: () => (/* binding */ ne),
/* harmony export */   o8: () => (/* binding */ notBetween),
/* harmony export */   or: () => (/* binding */ or),
/* harmony export */   q1: () => (/* binding */ notIlike),
/* harmony export */   t2: () => (/* binding */ exists),
/* harmony export */   wJ: () => (/* binding */ lte)
/* harmony export */ });
/* unused harmony exports arrayContained, arrayContains, arrayOverlaps, bindIfParam */
/* harmony import */ var _column_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(599);
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(48666);
/* harmony import */ var _table_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(17169);
/* harmony import */ var _sql_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(67910);




function bindIfParam(value, column) {
  if ((0,_sql_js__WEBPACK_IMPORTED_MODULE_0__/* .isDriverValueEncoder */ .eG)(column) && !(0,_sql_js__WEBPACK_IMPORTED_MODULE_0__/* .isSQLWrapper */ .qt)(value) && !(0,_entity_js__WEBPACK_IMPORTED_MODULE_1__.is)(value, _sql_js__WEBPACK_IMPORTED_MODULE_0__/* .Param */ .Iw) && !(0,_entity_js__WEBPACK_IMPORTED_MODULE_1__.is)(value, _sql_js__WEBPACK_IMPORTED_MODULE_0__/* .Placeholder */ .Or) && !(0,_entity_js__WEBPACK_IMPORTED_MODULE_1__.is)(value, _column_js__WEBPACK_IMPORTED_MODULE_2__/* .Column */ .V) && !(0,_entity_js__WEBPACK_IMPORTED_MODULE_1__.is)(value, _table_js__WEBPACK_IMPORTED_MODULE_3__/* .Table */ .XI) && !(0,_entity_js__WEBPACK_IMPORTED_MODULE_1__.is)(value, _sql_js__WEBPACK_IMPORTED_MODULE_0__/* .View */ .Ss)) {
    return new _sql_js__WEBPACK_IMPORTED_MODULE_0__/* .Param */ .Iw(value, column);
  }
  return value;
}
const eq = (left, right) => {
  return (0,_sql_js__WEBPACK_IMPORTED_MODULE_0__/* .sql */ .ll)`${left} = ${bindIfParam(right, left)}`;
};
const ne = (left, right) => {
  return (0,_sql_js__WEBPACK_IMPORTED_MODULE_0__/* .sql */ .ll)`${left} <> ${bindIfParam(right, left)}`;
};
function and(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new _sql_js__WEBPACK_IMPORTED_MODULE_0__/* .SQL */ .Xs(conditions);
  }
  return new _sql_js__WEBPACK_IMPORTED_MODULE_0__/* .SQL */ .Xs([
    new _sql_js__WEBPACK_IMPORTED_MODULE_0__/* .StringChunk */ .DJ("("),
    _sql_js__WEBPACK_IMPORTED_MODULE_0__/* .sql */ .ll.join(conditions, new _sql_js__WEBPACK_IMPORTED_MODULE_0__/* .StringChunk */ .DJ(" and ")),
    new _sql_js__WEBPACK_IMPORTED_MODULE_0__/* .StringChunk */ .DJ(")")
  ]);
}
function or(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new _sql_js__WEBPACK_IMPORTED_MODULE_0__/* .SQL */ .Xs(conditions);
  }
  return new _sql_js__WEBPACK_IMPORTED_MODULE_0__/* .SQL */ .Xs([
    new _sql_js__WEBPACK_IMPORTED_MODULE_0__/* .StringChunk */ .DJ("("),
    _sql_js__WEBPACK_IMPORTED_MODULE_0__/* .sql */ .ll.join(conditions, new _sql_js__WEBPACK_IMPORTED_MODULE_0__/* .StringChunk */ .DJ(" or ")),
    new _sql_js__WEBPACK_IMPORTED_MODULE_0__/* .StringChunk */ .DJ(")")
  ]);
}
function not(condition) {
  return (0,_sql_js__WEBPACK_IMPORTED_MODULE_0__/* .sql */ .ll)`not ${condition}`;
}
const gt = (left, right) => {
  return (0,_sql_js__WEBPACK_IMPORTED_MODULE_0__/* .sql */ .ll)`${left} > ${bindIfParam(right, left)}`;
};
const gte = (left, right) => {
  return (0,_sql_js__WEBPACK_IMPORTED_MODULE_0__/* .sql */ .ll)`${left} >= ${bindIfParam(right, left)}`;
};
const lt = (left, right) => {
  return (0,_sql_js__WEBPACK_IMPORTED_MODULE_0__/* .sql */ .ll)`${left} < ${bindIfParam(right, left)}`;
};
const lte = (left, right) => {
  return (0,_sql_js__WEBPACK_IMPORTED_MODULE_0__/* .sql */ .ll)`${left} <= ${bindIfParam(right, left)}`;
};
function inArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return (0,_sql_js__WEBPACK_IMPORTED_MODULE_0__/* .sql */ .ll)`false`;
    }
    return (0,_sql_js__WEBPACK_IMPORTED_MODULE_0__/* .sql */ .ll)`${column} in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return (0,_sql_js__WEBPACK_IMPORTED_MODULE_0__/* .sql */ .ll)`${column} in ${bindIfParam(values, column)}`;
}
function notInArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return (0,_sql_js__WEBPACK_IMPORTED_MODULE_0__/* .sql */ .ll)`true`;
    }
    return (0,_sql_js__WEBPACK_IMPORTED_MODULE_0__/* .sql */ .ll)`${column} not in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return (0,_sql_js__WEBPACK_IMPORTED_MODULE_0__/* .sql */ .ll)`${column} not in ${bindIfParam(values, column)}`;
}
function isNull(value) {
  return (0,_sql_js__WEBPACK_IMPORTED_MODULE_0__/* .sql */ .ll)`${value} is null`;
}
function isNotNull(value) {
  return (0,_sql_js__WEBPACK_IMPORTED_MODULE_0__/* .sql */ .ll)`${value} is not null`;
}
function exists(subquery) {
  return (0,_sql_js__WEBPACK_IMPORTED_MODULE_0__/* .sql */ .ll)`exists ${subquery}`;
}
function notExists(subquery) {
  return (0,_sql_js__WEBPACK_IMPORTED_MODULE_0__/* .sql */ .ll)`not exists ${subquery}`;
}
function between(column, min, max) {
  return (0,_sql_js__WEBPACK_IMPORTED_MODULE_0__/* .sql */ .ll)`${column} between ${bindIfParam(min, column)} and ${bindIfParam(
    max,
    column
  )}`;
}
function notBetween(column, min, max) {
  return (0,_sql_js__WEBPACK_IMPORTED_MODULE_0__/* .sql */ .ll)`${column} not between ${bindIfParam(
    min,
    column
  )} and ${bindIfParam(max, column)}`;
}
function like(column, value) {
  return (0,_sql_js__WEBPACK_IMPORTED_MODULE_0__/* .sql */ .ll)`${column} like ${value}`;
}
function notLike(column, value) {
  return (0,_sql_js__WEBPACK_IMPORTED_MODULE_0__/* .sql */ .ll)`${column} not like ${value}`;
}
function ilike(column, value) {
  return (0,_sql_js__WEBPACK_IMPORTED_MODULE_0__/* .sql */ .ll)`${column} ilike ${value}`;
}
function notIlike(column, value) {
  return (0,_sql_js__WEBPACK_IMPORTED_MODULE_0__/* .sql */ .ll)`${column} not ilike ${value}`;
}
function arrayContains(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      throw new Error("arrayContains requires at least one value");
    }
    const array = sql`${bindIfParam(values, column)}`;
    return sql`${column} @> ${array}`;
  }
  return sql`${column} @> ${bindIfParam(values, column)}`;
}
function arrayContained(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      throw new Error("arrayContained requires at least one value");
    }
    const array = sql`${bindIfParam(values, column)}`;
    return sql`${column} <@ ${array}`;
  }
  return sql`${column} <@ ${bindIfParam(values, column)}`;
}
function arrayOverlaps(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      throw new Error("arrayOverlaps requires at least one value");
    }
    const array = sql`${bindIfParam(values, column)}`;
    return sql`${column} && ${array}`;
  }
  return sql`${column} && ${bindIfParam(values, column)}`;
}

//# sourceMappingURL=conditions.js.map

/***/ }),

/***/ 37372:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Y: () => (/* binding */ asc),
/* harmony export */   i: () => (/* binding */ desc)
/* harmony export */ });
/* harmony import */ var _sql_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(67910);

function asc(column) {
  return (0,_sql_js__WEBPACK_IMPORTED_MODULE_0__/* .sql */ .ll)`${column} asc`;
}
function desc(column) {
  return (0,_sql_js__WEBPACK_IMPORTED_MODULE_0__/* .sql */ .ll)`${column} desc`;
}

//# sourceMappingURL=select.js.map

/***/ }),

/***/ 67910:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  Iw: () => (/* binding */ Param),
  Or: () => (/* binding */ Placeholder),
  Xs: () => (/* binding */ SQL),
  DJ: () => (/* binding */ StringChunk),
  Ss: () => (/* binding */ View),
  Ct: () => (/* binding */ fillPlaceholders),
  eG: () => (/* binding */ isDriverValueEncoder),
  qt: () => (/* binding */ isSQLWrapper),
  ll: () => (/* binding */ sql)
});

// UNUSED EXPORTS: FakePrimitiveParam, Name, getViewName, isView, name, noopDecoder, noopEncoder, noopMapper, param, placeholder

// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/entity.js
var entity = __webpack_require__(48666);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/common.js + 3 modules
var common = __webpack_require__(70704);
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/pg-core/columns/enum.js


class PgEnumObjectColumnBuilder extends common/* PgColumnBuilder */.pe {
  static [entity/* entityKind */.i] = "PgEnumObjectColumnBuilder";
  constructor(name, enumInstance) {
    super(name, "string", "PgEnumObjectColumn");
    this.config.enum = enumInstance;
  }
  /** @internal */
  build(table) {
    return new PgEnumObjectColumn(
      table,
      this.config
    );
  }
}
class PgEnumObjectColumn extends common/* PgColumn */.Kl {
  static [entity/* entityKind */.i] = "PgEnumObjectColumn";
  enum;
  enumValues = this.config.enum.enumValues;
  constructor(table, config) {
    super(table, config);
    this.enum = config.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
}
const isPgEnumSym = Symbol.for("drizzle:isPgEnum");
function isPgEnum(obj) {
  return !!obj && typeof obj === "function" && isPgEnumSym in obj && obj[isPgEnumSym] === true;
}
class PgEnumColumnBuilder extends common/* PgColumnBuilder */.pe {
  static [entity/* entityKind */.i] = "PgEnumColumnBuilder";
  constructor(name, enumInstance) {
    super(name, "string", "PgEnumColumn");
    this.config.enum = enumInstance;
  }
  /** @internal */
  build(table) {
    return new PgEnumColumn(
      table,
      this.config
    );
  }
}
class PgEnumColumn extends common/* PgColumn */.Kl {
  static [entity/* entityKind */.i] = "PgEnumColumn";
  enum = this.config.enum;
  enumValues = this.config.enum.enumValues;
  constructor(table, config) {
    super(table, config);
    this.enum = config.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
}
function pgEnum(enumName, input) {
  return Array.isArray(input) ? pgEnumWithSchema(enumName, [...input], void 0) : pgEnumObjectWithSchema(enumName, input, void 0);
}
function pgEnumWithSchema(enumName, values, schema) {
  const enumInstance = Object.assign(
    (name) => new PgEnumColumnBuilder(name ?? "", enumInstance),
    {
      enumName,
      enumValues: values,
      schema,
      [isPgEnumSym]: true
    }
  );
  return enumInstance;
}
function pgEnumObjectWithSchema(enumName, values, schema) {
  const enumInstance = Object.assign(
    (name) => new PgEnumObjectColumnBuilder(name ?? "", enumInstance),
    {
      enumName,
      enumValues: Object.values(values),
      schema,
      [isPgEnumSym]: true
    }
  );
  return enumInstance;
}

//# sourceMappingURL=enum.js.map
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/subquery.js
var subquery = __webpack_require__(2387);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/tracing.js + 1 modules
var tracing = __webpack_require__(63186);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/view-common.js
var view_common = __webpack_require__(9152);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/column.js
var column = __webpack_require__(599);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/table.js
var table = __webpack_require__(17169);
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sql/sql.js







class FakePrimitiveParam {
  static [entity/* entityKind */.i] = (/* unused pure expression or super */ null && ("FakePrimitiveParam"));
}
function isSQLWrapper(value) {
  return value !== null && value !== void 0 && typeof value.getSQL === "function";
}
function mergeQueries(queries) {
  const result = { sql: "", params: [] };
  for (const query of queries) {
    result.sql += query.sql;
    result.params.push(...query.params);
    if (query.typings?.length) {
      if (!result.typings) {
        result.typings = [];
      }
      result.typings.push(...query.typings);
    }
  }
  return result;
}
class StringChunk {
  static [entity/* entityKind */.i] = "StringChunk";
  value;
  constructor(value) {
    this.value = Array.isArray(value) ? value : [value];
  }
  getSQL() {
    return new SQL([this]);
  }
}
class SQL {
  constructor(queryChunks) {
    this.queryChunks = queryChunks;
    for (const chunk of queryChunks) {
      if ((0,entity.is)(chunk, table/* Table */.XI)) {
        const schemaName = chunk[table/* Table */.XI.Symbol.Schema];
        this.usedTables.push(
          schemaName === void 0 ? chunk[table/* Table */.XI.Symbol.Name] : schemaName + "." + chunk[table/* Table */.XI.Symbol.Name]
        );
      }
    }
  }
  static [entity/* entityKind */.i] = "SQL";
  /** @internal */
  decoder = noopDecoder;
  shouldInlineParams = false;
  /** @internal */
  usedTables = [];
  append(query) {
    this.queryChunks.push(...query.queryChunks);
    return this;
  }
  toQuery(config) {
    return tracing/* tracer */.k.startActiveSpan("drizzle.buildSQL", (span) => {
      const query = this.buildQueryFromSourceParams(this.queryChunks, config);
      span?.setAttributes({
        "drizzle.query.text": query.sql,
        "drizzle.query.params": JSON.stringify(query.params)
      });
      return query;
    });
  }
  buildQueryFromSourceParams(chunks, _config) {
    const config = Object.assign({}, _config, {
      inlineParams: _config.inlineParams || this.shouldInlineParams,
      paramStartIndex: _config.paramStartIndex || { value: 0 }
    });
    const {
      casing,
      escapeName,
      escapeParam,
      prepareTyping,
      inlineParams,
      paramStartIndex
    } = config;
    return mergeQueries(chunks.map((chunk) => {
      if ((0,entity.is)(chunk, StringChunk)) {
        return { sql: chunk.value.join(""), params: [] };
      }
      if ((0,entity.is)(chunk, Name)) {
        return { sql: escapeName(chunk.value), params: [] };
      }
      if (chunk === void 0) {
        return { sql: "", params: [] };
      }
      if (Array.isArray(chunk)) {
        const result = [new StringChunk("(")];
        for (const [i, p] of chunk.entries()) {
          result.push(p);
          if (i < chunk.length - 1) {
            result.push(new StringChunk(", "));
          }
        }
        result.push(new StringChunk(")"));
        return this.buildQueryFromSourceParams(result, config);
      }
      if ((0,entity.is)(chunk, SQL)) {
        return this.buildQueryFromSourceParams(chunk.queryChunks, {
          ...config,
          inlineParams: inlineParams || chunk.shouldInlineParams
        });
      }
      if ((0,entity.is)(chunk, table/* Table */.XI)) {
        const schemaName = chunk[table/* Table */.XI.Symbol.Schema];
        const tableName = chunk[table/* Table */.XI.Symbol.Name];
        return {
          sql: schemaName === void 0 || chunk[table/* IsAlias */.HE] ? escapeName(tableName) : escapeName(schemaName) + "." + escapeName(tableName),
          params: []
        };
      }
      if ((0,entity.is)(chunk, column/* Column */.V)) {
        const columnName = casing.getColumnCasing(chunk);
        if (_config.invokeSource === "indexes") {
          return { sql: escapeName(columnName), params: [] };
        }
        const schemaName = chunk.table[table/* Table */.XI.Symbol.Schema];
        return {
          sql: chunk.table[table/* IsAlias */.HE] || schemaName === void 0 ? escapeName(chunk.table[table/* Table */.XI.Symbol.Name]) + "." + escapeName(columnName) : escapeName(schemaName) + "." + escapeName(chunk.table[table/* Table */.XI.Symbol.Name]) + "." + escapeName(columnName),
          params: []
        };
      }
      if ((0,entity.is)(chunk, View)) {
        const schemaName = chunk[view_common/* ViewBaseConfig */.n].schema;
        const viewName = chunk[view_common/* ViewBaseConfig */.n].name;
        return {
          sql: schemaName === void 0 || chunk[view_common/* ViewBaseConfig */.n].isAlias ? escapeName(viewName) : escapeName(schemaName) + "." + escapeName(viewName),
          params: []
        };
      }
      if ((0,entity.is)(chunk, Param)) {
        if ((0,entity.is)(chunk.value, Placeholder)) {
          return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
        }
        const mappedValue = chunk.value === null ? null : chunk.encoder.mapToDriverValue(chunk.value);
        if ((0,entity.is)(mappedValue, SQL)) {
          return this.buildQueryFromSourceParams([mappedValue], config);
        }
        if (inlineParams) {
          return { sql: this.mapInlineParam(mappedValue, config), params: [] };
        }
        let typings = ["none"];
        if (prepareTyping) {
          typings = [prepareTyping(chunk.encoder)];
        }
        return { sql: escapeParam(paramStartIndex.value++, mappedValue), params: [mappedValue], typings };
      }
      if ((0,entity.is)(chunk, Placeholder)) {
        return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
      }
      if ((0,entity.is)(chunk, SQL.Aliased) && chunk.fieldAlias !== void 0) {
        return { sql: escapeName(chunk.fieldAlias), params: [] };
      }
      if ((0,entity.is)(chunk, subquery/* Subquery */.n)) {
        if (chunk._.isWith) {
          return { sql: escapeName(chunk._.alias), params: [] };
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk._.sql,
          new StringChunk(") "),
          new Name(chunk._.alias)
        ], config);
      }
      if (isPgEnum(chunk)) {
        if (chunk.schema) {
          return { sql: escapeName(chunk.schema) + "." + escapeName(chunk.enumName), params: [] };
        }
        return { sql: escapeName(chunk.enumName), params: [] };
      }
      if (isSQLWrapper(chunk)) {
        if (chunk.shouldOmitSQLParens?.()) {
          return this.buildQueryFromSourceParams([chunk.getSQL()], config);
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk.getSQL(),
          new StringChunk(")")
        ], config);
      }
      if (inlineParams) {
        return { sql: this.mapInlineParam(chunk, config), params: [] };
      }
      return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
    }));
  }
  mapInlineParam(chunk, { escapeString }) {
    if (chunk === null) {
      return "null";
    }
    if (typeof chunk === "number" || typeof chunk === "boolean") {
      return chunk.toString();
    }
    if (typeof chunk === "string") {
      return escapeString(chunk);
    }
    if (typeof chunk === "object") {
      const mappedValueAsString = chunk.toString();
      if (mappedValueAsString === "[object Object]") {
        return escapeString(JSON.stringify(chunk));
      }
      return escapeString(mappedValueAsString);
    }
    throw new Error("Unexpected param value: " + chunk);
  }
  getSQL() {
    return this;
  }
  as(alias) {
    if (alias === void 0) {
      return this;
    }
    return new SQL.Aliased(this, alias);
  }
  mapWith(decoder) {
    this.decoder = typeof decoder === "function" ? { mapFromDriverValue: decoder } : decoder;
    return this;
  }
  inlineParams() {
    this.shouldInlineParams = true;
    return this;
  }
  /**
   * This method is used to conditionally include a part of the query.
   *
   * @param condition - Condition to check
   * @returns itself if the condition is `true`, otherwise `undefined`
   */
  if(condition) {
    return condition ? this : void 0;
  }
}
class Name {
  constructor(value) {
    this.value = value;
  }
  static [entity/* entityKind */.i] = "Name";
  brand;
  getSQL() {
    return new SQL([this]);
  }
}
function sql_name(value) {
  return new Name(value);
}
function isDriverValueEncoder(value) {
  return typeof value === "object" && value !== null && "mapToDriverValue" in value && typeof value.mapToDriverValue === "function";
}
const noopDecoder = {
  mapFromDriverValue: (value) => value
};
const noopEncoder = {
  mapToDriverValue: (value) => value
};
const noopMapper = {
  ...noopDecoder,
  ...noopEncoder
};
class Param {
  /**
   * @param value - Parameter value
   * @param encoder - Encoder to convert the value to a driver parameter
   */
  constructor(value, encoder = noopEncoder) {
    this.value = value;
    this.encoder = encoder;
  }
  static [entity/* entityKind */.i] = "Param";
  brand;
  getSQL() {
    return new SQL([this]);
  }
}
function param(value, encoder) {
  return new Param(value, encoder);
}
function sql(strings, ...params) {
  const queryChunks = [];
  if (params.length > 0 || strings.length > 0 && strings[0] !== "") {
    queryChunks.push(new StringChunk(strings[0]));
  }
  for (const [paramIndex, param2] of params.entries()) {
    queryChunks.push(param2, new StringChunk(strings[paramIndex + 1]));
  }
  return new SQL(queryChunks);
}
((sql2) => {
  function empty() {
    return new SQL([]);
  }
  sql2.empty = empty;
  function fromList(list) {
    return new SQL(list);
  }
  sql2.fromList = fromList;
  function raw(str) {
    return new SQL([new StringChunk(str)]);
  }
  sql2.raw = raw;
  function join(chunks, separator) {
    const result = [];
    for (const [i, chunk] of chunks.entries()) {
      if (i > 0 && separator !== void 0) {
        result.push(separator);
      }
      result.push(chunk);
    }
    return new SQL(result);
  }
  sql2.join = join;
  function identifier(value) {
    return new Name(value);
  }
  sql2.identifier = identifier;
  function placeholder2(name2) {
    return new Placeholder(name2);
  }
  sql2.placeholder = placeholder2;
  function param2(value, encoder) {
    return new Param(value, encoder);
  }
  sql2.param = param2;
})(sql || (sql = {}));
((SQL2) => {
  class Aliased {
    constructor(sql2, fieldAlias) {
      this.sql = sql2;
      this.fieldAlias = fieldAlias;
    }
    static [entity/* entityKind */.i] = "SQL.Aliased";
    /** @internal */
    isSelectionField = false;
    getSQL() {
      return this.sql;
    }
    /** @internal */
    clone() {
      return new Aliased(this.sql, this.fieldAlias);
    }
  }
  SQL2.Aliased = Aliased;
})(SQL || (SQL = {}));
class Placeholder {
  constructor(name2) {
    this.name = name2;
  }
  static [entity/* entityKind */.i] = "Placeholder";
  getSQL() {
    return new SQL([this]);
  }
}
function placeholder(name2) {
  return new Placeholder(name2);
}
function fillPlaceholders(params, values) {
  return params.map((p) => {
    if ((0,entity.is)(p, Placeholder)) {
      if (!(p.name in values)) {
        throw new Error(`No value for placeholder "${p.name}" was provided`);
      }
      return values[p.name];
    }
    if ((0,entity.is)(p, Param) && (0,entity.is)(p.value, Placeholder)) {
      if (!(p.value.name in values)) {
        throw new Error(`No value for placeholder "${p.value.name}" was provided`);
      }
      return p.encoder.mapToDriverValue(values[p.value.name]);
    }
    return p;
  });
}
const IsDrizzleView = Symbol.for("drizzle:IsDrizzleView");
class View {
  static [entity/* entityKind */.i] = "View";
  /** @internal */
  [view_common/* ViewBaseConfig */.n];
  /** @internal */
  [IsDrizzleView] = true;
  constructor({ name: name2, schema, selectedFields, query }) {
    this[view_common/* ViewBaseConfig */.n] = {
      name: name2,
      originalName: name2,
      schema,
      selectedFields,
      query,
      isExisting: !query,
      isAlias: false
    };
  }
  getSQL() {
    return new SQL([this]);
  }
}
function isView(view) {
  return typeof view === "object" && view !== null && IsDrizzleView in view;
}
function getViewName(view) {
  return view[ViewBaseConfig].name;
}
column/* Column */.V.prototype.getSQL = function() {
  return new SQL([this]);
};
table/* Table */.XI.prototype.getSQL = function() {
  return new SQL([this]);
};
subquery/* Subquery */.n.prototype.getSQL = function() {
  return new SQL([this]);
};

//# sourceMappingURL=sql.js.map

/***/ }),

/***/ 2387:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   J: () => (/* binding */ WithSubquery),
/* harmony export */   n: () => (/* binding */ Subquery)
/* harmony export */ });
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(48666);

class Subquery {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_0__/* .entityKind */ .i] = "Subquery";
  constructor(sql, fields, alias, isWith = false, usedTables = []) {
    this._ = {
      brand: "Subquery",
      sql,
      selectedFields: fields,
      alias,
      isWith,
      usedTables
    };
  }
  // getSQL(): SQL<unknown> {
  // 	return new SQL([this]);
  // }
}
class WithSubquery extends Subquery {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_0__/* .entityKind */ .i] = "WithSubquery";
}

//# sourceMappingURL=subquery.js.map

/***/ }),

/***/ 17169:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   HE: () => (/* binding */ IsAlias),
/* harmony export */   Io: () => (/* binding */ getTableName),
/* harmony export */   Lf: () => (/* binding */ getTableUniqueName),
/* harmony export */   Sj: () => (/* binding */ Schema),
/* harmony export */   XI: () => (/* binding */ Table),
/* harmony export */   e: () => (/* binding */ Columns)
/* harmony export */ });
/* unused harmony exports BaseName, ExtraConfigBuilder, ExtraConfigColumns, OriginalName, isTable */
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(48666);
/* harmony import */ var _table_utils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(66918);


const Schema = Symbol.for("drizzle:Schema");
const Columns = Symbol.for("drizzle:Columns");
const ExtraConfigColumns = Symbol.for("drizzle:ExtraConfigColumns");
const OriginalName = Symbol.for("drizzle:OriginalName");
const BaseName = Symbol.for("drizzle:BaseName");
const IsAlias = Symbol.for("drizzle:IsAlias");
const ExtraConfigBuilder = Symbol.for("drizzle:ExtraConfigBuilder");
const IsDrizzleTable = Symbol.for("drizzle:IsDrizzleTable");
class Table {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_0__/* .entityKind */ .i] = "Table";
  /** @internal */
  static Symbol = {
    Name: _table_utils_js__WEBPACK_IMPORTED_MODULE_1__/* .TableName */ .E,
    Schema,
    OriginalName,
    Columns,
    ExtraConfigColumns,
    BaseName,
    IsAlias,
    ExtraConfigBuilder
  };
  /**
   * @internal
   * Can be changed if the table is aliased.
   */
  [_table_utils_js__WEBPACK_IMPORTED_MODULE_1__/* .TableName */ .E];
  /**
   * @internal
   * Used to store the original name of the table, before any aliasing.
   */
  [OriginalName];
  /** @internal */
  [Schema];
  /** @internal */
  [Columns];
  /** @internal */
  [ExtraConfigColumns];
  /**
   *  @internal
   * Used to store the table name before the transformation via the `tableCreator` functions.
   */
  [BaseName];
  /** @internal */
  [IsAlias] = false;
  /** @internal */
  [IsDrizzleTable] = true;
  /** @internal */
  [ExtraConfigBuilder] = void 0;
  constructor(name, schema, baseName) {
    this[_table_utils_js__WEBPACK_IMPORTED_MODULE_1__/* .TableName */ .E] = this[OriginalName] = name;
    this[Schema] = schema;
    this[BaseName] = baseName;
  }
}
function isTable(table) {
  return typeof table === "object" && table !== null && IsDrizzleTable in table;
}
function getTableName(table) {
  return table[_table_utils_js__WEBPACK_IMPORTED_MODULE_1__/* .TableName */ .E];
}
function getTableUniqueName(table) {
  return `${table[Schema] ?? "public"}.${table[_table_utils_js__WEBPACK_IMPORTED_MODULE_1__/* .TableName */ .E]}`;
}

//# sourceMappingURL=table.js.map

/***/ }),

/***/ 66918:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   E: () => (/* binding */ TableName)
/* harmony export */ });
const TableName = Symbol.for("drizzle:Name");

//# sourceMappingURL=table.utils.js.map

/***/ }),

/***/ 7575:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   i: () => (/* binding */ iife)
/* harmony export */ });
function iife(fn, ...args) {
  return fn(...args);
}

//# sourceMappingURL=tracing-utils.js.map

/***/ }),

/***/ 63186:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  k: () => (/* binding */ tracer)
});

// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/tracing-utils.js
var tracing_utils = __webpack_require__(7575);
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/version.js
// package.json
var version = "0.44.7";

// src/version.ts
var compatibilityVersion = 10;


;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/tracing.js


let otel;
let rawTracer;
const tracer = {
  startActiveSpan(name, fn) {
    if (!otel) {
      return fn();
    }
    if (!rawTracer) {
      rawTracer = otel.trace.getTracer("drizzle-orm", version);
    }
    return (0,tracing_utils/* iife */.i)(
      (otel2, rawTracer2) => rawTracer2.startActiveSpan(
        name,
        (span) => {
          try {
            return fn(span);
          } catch (e) {
            span.setStatus({
              code: otel2.SpanStatusCode.ERROR,
              message: e instanceof Error ? e.message : "Unknown error"
              // eslint-disable-line no-instanceof/no-instanceof
            });
            throw e;
          } finally {
            span.end();
          }
        }
      ),
      otel,
      rawTracer
    );
  }
};

//# sourceMappingURL=tracing.js.map

/***/ }),

/***/ 82348:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DV: () => (/* binding */ haveSameKeys),
/* harmony export */   He: () => (/* binding */ orderSelectedFields),
/* harmony export */   Ll: () => (/* binding */ getColumnNameAndConfig),
/* harmony export */   Lq: () => (/* binding */ isConfig),
/* harmony export */   XJ: () => (/* binding */ applyMixins),
/* harmony export */   YD: () => (/* binding */ getTableColumns),
/* harmony export */   a6: () => (/* binding */ mapResultRow),
/* harmony export */   q: () => (/* binding */ mapUpdateSet),
/* harmony export */   su: () => (/* binding */ textDecoder),
/* harmony export */   zN: () => (/* binding */ getTableLikeName)
/* harmony export */ });
/* unused harmony export getViewSelectedFields */
/* harmony import */ var _column_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(599);
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(48666);
/* harmony import */ var _sql_sql_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(67910);
/* harmony import */ var _subquery_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(2387);
/* harmony import */ var _table_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(17169);
/* harmony import */ var _view_common_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(9152);






function mapResultRow(columns, row, joinsNotNullableMap) {
  const nullifyMap = {};
  const result = columns.reduce(
    (result2, { path, field }, columnIndex) => {
      let decoder;
      if ((0,_entity_js__WEBPACK_IMPORTED_MODULE_0__.is)(field, _column_js__WEBPACK_IMPORTED_MODULE_1__/* .Column */ .V)) {
        decoder = field;
      } else if ((0,_entity_js__WEBPACK_IMPORTED_MODULE_0__.is)(field, _sql_sql_js__WEBPACK_IMPORTED_MODULE_2__/* .SQL */ .Xs)) {
        decoder = field.decoder;
      } else {
        decoder = field.sql.decoder;
      }
      let node = result2;
      for (const [pathChunkIndex, pathChunk] of path.entries()) {
        if (pathChunkIndex < path.length - 1) {
          if (!(pathChunk in node)) {
            node[pathChunk] = {};
          }
          node = node[pathChunk];
        } else {
          const rawValue = row[columnIndex];
          const value = node[pathChunk] = rawValue === null ? null : decoder.mapFromDriverValue(rawValue);
          if (joinsNotNullableMap && (0,_entity_js__WEBPACK_IMPORTED_MODULE_0__.is)(field, _column_js__WEBPACK_IMPORTED_MODULE_1__/* .Column */ .V) && path.length === 2) {
            const objectName = path[0];
            if (!(objectName in nullifyMap)) {
              nullifyMap[objectName] = value === null ? (0,_table_js__WEBPACK_IMPORTED_MODULE_3__/* .getTableName */ .Io)(field.table) : false;
            } else if (typeof nullifyMap[objectName] === "string" && nullifyMap[objectName] !== (0,_table_js__WEBPACK_IMPORTED_MODULE_3__/* .getTableName */ .Io)(field.table)) {
              nullifyMap[objectName] = false;
            }
          }
        }
      }
      return result2;
    },
    {}
  );
  if (joinsNotNullableMap && Object.keys(nullifyMap).length > 0) {
    for (const [objectName, tableName] of Object.entries(nullifyMap)) {
      if (typeof tableName === "string" && !joinsNotNullableMap[tableName]) {
        result[objectName] = null;
      }
    }
  }
  return result;
}
function orderSelectedFields(fields, pathPrefix) {
  return Object.entries(fields).reduce((result, [name, field]) => {
    if (typeof name !== "string") {
      return result;
    }
    const newPath = pathPrefix ? [...pathPrefix, name] : [name];
    if ((0,_entity_js__WEBPACK_IMPORTED_MODULE_0__.is)(field, _column_js__WEBPACK_IMPORTED_MODULE_1__/* .Column */ .V) || (0,_entity_js__WEBPACK_IMPORTED_MODULE_0__.is)(field, _sql_sql_js__WEBPACK_IMPORTED_MODULE_2__/* .SQL */ .Xs) || (0,_entity_js__WEBPACK_IMPORTED_MODULE_0__.is)(field, _sql_sql_js__WEBPACK_IMPORTED_MODULE_2__/* .SQL */ .Xs.Aliased)) {
      result.push({ path: newPath, field });
    } else if ((0,_entity_js__WEBPACK_IMPORTED_MODULE_0__.is)(field, _table_js__WEBPACK_IMPORTED_MODULE_3__/* .Table */ .XI)) {
      result.push(...orderSelectedFields(field[_table_js__WEBPACK_IMPORTED_MODULE_3__/* .Table */ .XI.Symbol.Columns], newPath));
    } else {
      result.push(...orderSelectedFields(field, newPath));
    }
    return result;
  }, []);
}
function haveSameKeys(left, right) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  for (const [index, key] of leftKeys.entries()) {
    if (key !== rightKeys[index]) {
      return false;
    }
  }
  return true;
}
function mapUpdateSet(table, values) {
  const entries = Object.entries(values).filter(([, value]) => value !== void 0).map(([key, value]) => {
    if ((0,_entity_js__WEBPACK_IMPORTED_MODULE_0__.is)(value, _sql_sql_js__WEBPACK_IMPORTED_MODULE_2__/* .SQL */ .Xs) || (0,_entity_js__WEBPACK_IMPORTED_MODULE_0__.is)(value, _column_js__WEBPACK_IMPORTED_MODULE_1__/* .Column */ .V)) {
      return [key, value];
    } else {
      return [key, new _sql_sql_js__WEBPACK_IMPORTED_MODULE_2__/* .Param */ .Iw(value, table[_table_js__WEBPACK_IMPORTED_MODULE_3__/* .Table */ .XI.Symbol.Columns][key])];
    }
  });
  if (entries.length === 0) {
    throw new Error("No values to set");
  }
  return Object.fromEntries(entries);
}
function applyMixins(baseClass, extendedClasses) {
  for (const extendedClass of extendedClasses) {
    for (const name of Object.getOwnPropertyNames(extendedClass.prototype)) {
      if (name === "constructor") continue;
      Object.defineProperty(
        baseClass.prototype,
        name,
        Object.getOwnPropertyDescriptor(extendedClass.prototype, name) || /* @__PURE__ */ Object.create(null)
      );
    }
  }
}
function getTableColumns(table) {
  return table[_table_js__WEBPACK_IMPORTED_MODULE_3__/* .Table */ .XI.Symbol.Columns];
}
function getViewSelectedFields(view) {
  return view[ViewBaseConfig].selectedFields;
}
function getTableLikeName(table) {
  return (0,_entity_js__WEBPACK_IMPORTED_MODULE_0__.is)(table, _subquery_js__WEBPACK_IMPORTED_MODULE_4__/* .Subquery */ .n) ? table._.alias : (0,_entity_js__WEBPACK_IMPORTED_MODULE_0__.is)(table, _sql_sql_js__WEBPACK_IMPORTED_MODULE_2__/* .View */ .Ss) ? table[_view_common_js__WEBPACK_IMPORTED_MODULE_5__/* .ViewBaseConfig */ .n].name : (0,_entity_js__WEBPACK_IMPORTED_MODULE_0__.is)(table, _sql_sql_js__WEBPACK_IMPORTED_MODULE_2__/* .SQL */ .Xs) ? void 0 : table[_table_js__WEBPACK_IMPORTED_MODULE_3__/* .Table */ .XI.Symbol.IsAlias] ? table[_table_js__WEBPACK_IMPORTED_MODULE_3__/* .Table */ .XI.Symbol.Name] : table[_table_js__WEBPACK_IMPORTED_MODULE_3__/* .Table */ .XI.Symbol.BaseName];
}
function getColumnNameAndConfig(a, b) {
  return {
    name: typeof a === "string" && a.length > 0 ? a : "",
    config: typeof a === "object" ? a : b
  };
}
const _ = {};
const __ = {};
function isConfig(data) {
  if (typeof data !== "object" || data === null) return false;
  if (data.constructor.name !== "Object") return false;
  if ("logger" in data) {
    const type = typeof data["logger"];
    if (type !== "boolean" && (type !== "object" || typeof data["logger"]["logQuery"] !== "function") && type !== "undefined") return false;
    return true;
  }
  if ("schema" in data) {
    const type = typeof data["schema"];
    if (type !== "object" && type !== "undefined") return false;
    return true;
  }
  if ("casing" in data) {
    const type = typeof data["casing"];
    if (type !== "string" && type !== "undefined") return false;
    return true;
  }
  if ("mode" in data) {
    if (data["mode"] !== "default" || data["mode"] !== "planetscale" || data["mode"] !== void 0) return false;
    return true;
  }
  if ("connection" in data) {
    const type = typeof data["connection"];
    if (type !== "string" && type !== "object" && type !== "undefined") return false;
    return true;
  }
  if ("client" in data) {
    const type = typeof data["client"];
    if (type !== "object" && type !== "function" && type !== "undefined") return false;
    return true;
  }
  if (Object.keys(data).length === 0) return true;
  return false;
}
const textDecoder = typeof TextDecoder === "undefined" ? null : new TextDecoder();

//# sourceMappingURL=utils.js.map

/***/ }),

/***/ 9152:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   n: () => (/* binding */ ViewBaseConfig)
/* harmony export */ });
const ViewBaseConfig = Symbol.for("drizzle:ViewBaseConfig");

//# sourceMappingURL=view-common.js.map

/***/ }),

/***/ 99556:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Ay: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* unused harmony exports Client, Pool, Connection, types, Query, DatabaseError, escapeIdentifier, escapeLiteral, Result, TypeOverrides, defaults */
/* harmony import */ var _lib_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(62372);
// ESM wrapper for pg


// Re-export all the properties
const Client = _lib_index_js__WEBPACK_IMPORTED_MODULE_0__.Client
const Pool = _lib_index_js__WEBPACK_IMPORTED_MODULE_0__.Pool
const Connection = _lib_index_js__WEBPACK_IMPORTED_MODULE_0__.Connection
const types = _lib_index_js__WEBPACK_IMPORTED_MODULE_0__.types
const Query = _lib_index_js__WEBPACK_IMPORTED_MODULE_0__.Query
const DatabaseError = _lib_index_js__WEBPACK_IMPORTED_MODULE_0__.DatabaseError
const escapeIdentifier = _lib_index_js__WEBPACK_IMPORTED_MODULE_0__.escapeIdentifier
const escapeLiteral = _lib_index_js__WEBPACK_IMPORTED_MODULE_0__.escapeLiteral
const Result = _lib_index_js__WEBPACK_IMPORTED_MODULE_0__.Result
const TypeOverrides = _lib_index_js__WEBPACK_IMPORTED_MODULE_0__.TypeOverrides

// Also export the defaults
const defaults = _lib_index_js__WEBPACK_IMPORTED_MODULE_0__.defaults

// Re-export the default
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_lib_index_js__WEBPACK_IMPORTED_MODULE_0__);


/***/ })

};
