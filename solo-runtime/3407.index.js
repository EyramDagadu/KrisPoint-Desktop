import { createRequire as __WEBPACK_EXTERNAL_createRequire } from "module";
export const id = 3407;
export const ids = [3407];
export const modules = {

/***/ 84282:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


const fs = __webpack_require__(79896);
const path = __webpack_require__(16928);
const util = __webpack_require__(4047);
const SqliteError = __webpack_require__(81356);

let DEFAULT_ADDON;

function Database(filenameGiven, options) {
	if (new.target == null) {
		return new Database(filenameGiven, options);
	}

	// Apply defaults
	let buffer;
	if (Buffer.isBuffer(filenameGiven)) {
		buffer = filenameGiven;
		filenameGiven = ':memory:';
	}
	if (filenameGiven == null) filenameGiven = '';
	if (options == null) options = {};

	// Validate arguments
	if (typeof filenameGiven !== 'string') throw new TypeError('Expected first argument to be a string');
	if (typeof options !== 'object') throw new TypeError('Expected second argument to be an options object');
	if ('readOnly' in options) throw new TypeError('Misspelled option "readOnly" should be "readonly"');
	if ('memory' in options) throw new TypeError('Option "memory" was removed in v7.0.0 (use ":memory:" filename instead)');

	// Interpret options
	const filename = filenameGiven.trim();
	const anonymous = filename === '' || filename === ':memory:';
	const readonly = util.getBooleanOption(options, 'readonly');
	const fileMustExist = util.getBooleanOption(options, 'fileMustExist');
	const timeout = 'timeout' in options ? options.timeout : 5000;
	const verbose = 'verbose' in options ? options.verbose : null;
	const nativeBinding = 'nativeBinding' in options ? options.nativeBinding : null;

	// Validate interpreted options
	if (readonly && anonymous && !buffer) throw new TypeError('In-memory/temporary databases cannot be readonly');
	if (!Number.isInteger(timeout) || timeout < 0) throw new TypeError('Expected the "timeout" option to be a positive integer');
	if (timeout > 0x7fffffff) throw new RangeError('Option "timeout" cannot be greater than 2147483647');
	if (verbose != null && typeof verbose !== 'function') throw new TypeError('Expected the "verbose" option to be a function');
	if (nativeBinding != null && typeof nativeBinding !== 'string' && typeof nativeBinding !== 'object') throw new TypeError('Expected the "nativeBinding" option to be a string or addon object');

	// Load the native addon
	let addon;
	if (nativeBinding == null) {
		addon = DEFAULT_ADDON || (DEFAULT_ADDON = __WEBPACK_EXTERNAL_createRequire(import.meta.url)(__webpack_require__.ab + "build/Release/better_sqlite3.node"));
	} else if (typeof nativeBinding === 'string') {
		// See <https://webpack.js.org/api/module-variables/#__non_webpack_require__-webpack-specific>
		const requireFunc = typeof __WEBPACK_EXTERNAL_createRequire(import.meta.url) === 'function' ? eval("require") : __WEBPACK_EXTERNAL_createRequire(import.meta.url);
		addon = requireFunc(path.resolve(nativeBinding).replace(/(\.node)?$/, '.node'));
	} else {
		// See <https://github.com/WiseLibs/better-sqlite3/issues/972>
		addon = nativeBinding;
	}

	if (!addon.isInitialized) {
		addon.setErrorConstructor(SqliteError);
		addon.isInitialized = true;
	}

	// Make sure the specified directory exists
	if (!anonymous && !filename.startsWith('file:') && !fs.existsSync(path.dirname(filename))) {
		throw new TypeError('Cannot open database because the directory does not exist');
	}

	Object.defineProperties(this, {
		[util.cppdb]: { value: new addon.Database(filename, filenameGiven, anonymous, readonly, fileMustExist, timeout, verbose || null, buffer || null) },
		...wrappers.getters,
	});
}

const wrappers = __webpack_require__(6924);
Database.prototype.prepare = wrappers.prepare;
Database.prototype.transaction = __webpack_require__(22506);
Database.prototype.pragma = __webpack_require__(42404);
Database.prototype.backup = __webpack_require__(90334);
Database.prototype.serialize = __webpack_require__(27200);
Database.prototype.function = __webpack_require__(84348);
Database.prototype.aggregate = __webpack_require__(42657);
Database.prototype.table = __webpack_require__(33130);
Database.prototype.loadExtension = wrappers.loadExtension;
Database.prototype.exec = wrappers.exec;
Database.prototype.close = wrappers.close;
Database.prototype.defaultSafeIntegers = wrappers.defaultSafeIntegers;
Database.prototype.unsafeMode = wrappers.unsafeMode;
Database.prototype[util.inspect] = __webpack_require__(74914);

module.exports = Database;


/***/ }),

/***/ 25103:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


module.exports = __webpack_require__(84282);
module.exports.SqliteError = __webpack_require__(81356);


/***/ }),

/***/ 42657:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


const { getBooleanOption, cppdb } = __webpack_require__(4047);

module.exports = function defineAggregate(name, options) {
	// Validate arguments
	if (typeof name !== 'string') throw new TypeError('Expected first argument to be a string');
	if (typeof options !== 'object' || options === null) throw new TypeError('Expected second argument to be an options object');
	if (!name) throw new TypeError('User-defined function name cannot be an empty string');

	// Interpret options
	const start = 'start' in options ? options.start : null;
	const step = getFunctionOption(options, 'step', true);
	const inverse = getFunctionOption(options, 'inverse', false);
	const result = getFunctionOption(options, 'result', false);
	const safeIntegers = 'safeIntegers' in options ? +getBooleanOption(options, 'safeIntegers') : 2;
	const deterministic = getBooleanOption(options, 'deterministic');
	const directOnly = getBooleanOption(options, 'directOnly');
	const varargs = getBooleanOption(options, 'varargs');
	let argCount = -1;

	// Determine argument count
	if (!varargs) {
		argCount = Math.max(getLength(step), inverse ? getLength(inverse) : 0);
		if (argCount > 0) argCount -= 1;
		if (argCount > 100) throw new RangeError('User-defined functions cannot have more than 100 arguments');
	}

	this[cppdb].aggregate(start, step, inverse, result, name, argCount, safeIntegers, deterministic, directOnly);
	return this;
};

const getFunctionOption = (options, key, required) => {
	const value = key in options ? options[key] : null;
	if (typeof value === 'function') return value;
	if (value != null) throw new TypeError(`Expected the "${key}" option to be a function`);
	if (required) throw new TypeError(`Missing required option "${key}"`);
	return null;
};

const getLength = ({ length }) => {
	if (Number.isInteger(length) && length >= 0) return length;
	throw new TypeError('Expected function.length to be a positive integer');
};


/***/ }),

/***/ 90334:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


const fs = __webpack_require__(79896);
const path = __webpack_require__(16928);
const { promisify } = __webpack_require__(39023);
const { cppdb } = __webpack_require__(4047);
const fsAccess = promisify(fs.access);

module.exports = async function backup(filename, options) {
	if (options == null) options = {};

	// Validate arguments
	if (typeof filename !== 'string') throw new TypeError('Expected first argument to be a string');
	if (typeof options !== 'object') throw new TypeError('Expected second argument to be an options object');

	// Interpret options
	filename = filename.trim();
	const attachedName = 'attached' in options ? options.attached : 'main';
	const handler = 'progress' in options ? options.progress : null;

	// Validate interpreted options
	if (!filename) throw new TypeError('Backup filename cannot be an empty string');
	if (filename === ':memory:') throw new TypeError('Invalid backup filename ":memory:"');
	if (typeof attachedName !== 'string') throw new TypeError('Expected the "attached" option to be a string');
	if (!attachedName) throw new TypeError('The "attached" option cannot be an empty string');
	if (handler != null && typeof handler !== 'function') throw new TypeError('Expected the "progress" option to be a function');

	// Make sure the specified directory exists
	await fsAccess(path.dirname(filename)).catch(() => {
		throw new TypeError('Cannot save backup because the directory does not exist');
	});

	const isNewFile = await fsAccess(filename).then(() => false, () => true);
	return runBackup(this[cppdb].backup(this, attachedName, filename, isNewFile), handler || null);
};

const runBackup = (backup, handler) => {
	let rate = 0;
	let useDefault = true;

	return new Promise((resolve, reject) => {
		setImmediate(function step() {
			try {
				const progress = backup.transfer(rate);
				if (!progress.remainingPages) {
					backup.close();
					resolve(progress);
					return;
				}
				if (useDefault) {
					useDefault = false;
					rate = 100;
				}
				if (handler) {
					const ret = handler(progress);
					if (ret !== undefined) {
						if (typeof ret === 'number' && ret === ret) rate = Math.max(0, Math.min(0x7fffffff, Math.round(ret)));
						else throw new TypeError('Expected progress callback to return a number or undefined');
					}
				}
				setImmediate(step);
			} catch (err) {
				backup.close();
				reject(err);
			}
		});
	});
};


/***/ }),

/***/ 84348:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


const { getBooleanOption, cppdb } = __webpack_require__(4047);

module.exports = function defineFunction(name, options, fn) {
	// Apply defaults
	if (options == null) options = {};
	if (typeof options === 'function') { fn = options; options = {}; }

	// Validate arguments
	if (typeof name !== 'string') throw new TypeError('Expected first argument to be a string');
	if (typeof fn !== 'function') throw new TypeError('Expected last argument to be a function');
	if (typeof options !== 'object') throw new TypeError('Expected second argument to be an options object');
	if (!name) throw new TypeError('User-defined function name cannot be an empty string');

	// Interpret options
	const safeIntegers = 'safeIntegers' in options ? +getBooleanOption(options, 'safeIntegers') : 2;
	const deterministic = getBooleanOption(options, 'deterministic');
	const directOnly = getBooleanOption(options, 'directOnly');
	const varargs = getBooleanOption(options, 'varargs');
	let argCount = -1;

	// Determine argument count
	if (!varargs) {
		argCount = fn.length;
		if (!Number.isInteger(argCount) || argCount < 0) throw new TypeError('Expected function.length to be a positive integer');
		if (argCount > 100) throw new RangeError('User-defined functions cannot have more than 100 arguments');
	}

	this[cppdb].function(fn, name, argCount, safeIntegers, deterministic, directOnly);
	return this;
};


/***/ }),

/***/ 74914:
/***/ ((module) => {


const DatabaseInspection = function Database() {};

module.exports = function inspect(depth, opts) {
	return Object.assign(new DatabaseInspection(), this);
};



/***/ }),

/***/ 42404:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


const { getBooleanOption, cppdb } = __webpack_require__(4047);

module.exports = function pragma(source, options) {
	if (options == null) options = {};
	if (typeof source !== 'string') throw new TypeError('Expected first argument to be a string');
	if (typeof options !== 'object') throw new TypeError('Expected second argument to be an options object');
	const simple = getBooleanOption(options, 'simple');

	const stmt = this[cppdb].prepare(`PRAGMA ${source}`, this, true);
	return simple ? stmt.pluck().get() : stmt.all();
};


/***/ }),

/***/ 27200:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


const { cppdb } = __webpack_require__(4047);

module.exports = function serialize(options) {
	if (options == null) options = {};

	// Validate arguments
	if (typeof options !== 'object') throw new TypeError('Expected first argument to be an options object');

	// Interpret and validate options
	const attachedName = 'attached' in options ? options.attached : 'main';
	if (typeof attachedName !== 'string') throw new TypeError('Expected the "attached" option to be a string');
	if (!attachedName) throw new TypeError('The "attached" option cannot be an empty string');

	return this[cppdb].serialize(attachedName);
};


/***/ }),

/***/ 33130:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


const { cppdb } = __webpack_require__(4047);

module.exports = function defineTable(name, factory) {
	// Validate arguments
	if (typeof name !== 'string') throw new TypeError('Expected first argument to be a string');
	if (!name) throw new TypeError('Virtual table module name cannot be an empty string');

	// Determine whether the module is eponymous-only or not
	let eponymous = false;
	if (typeof factory === 'object' && factory !== null) {
		eponymous = true;
		factory = defer(parseTableDefinition(factory, 'used', name));
	} else {
		if (typeof factory !== 'function') throw new TypeError('Expected second argument to be a function or a table definition object');
		factory = wrapFactory(factory);
	}

	this[cppdb].table(factory, name, eponymous);
	return this;
};

function wrapFactory(factory) {
	return function virtualTableFactory(moduleName, databaseName, tableName, ...args) {
		const thisObject = {
			module: moduleName,
			database: databaseName,
			table: tableName,
		};

		// Generate a new table definition by invoking the factory
		const def = apply.call(factory, thisObject, args);
		if (typeof def !== 'object' || def === null) {
			throw new TypeError(`Virtual table module "${moduleName}" did not return a table definition object`);
		}

		return parseTableDefinition(def, 'returned', moduleName);
	};
}

function parseTableDefinition(def, verb, moduleName) {
	// Validate required properties
	if (!hasOwnProperty.call(def, 'rows')) {
		throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition without a "rows" property`);
	}
	if (!hasOwnProperty.call(def, 'columns')) {
		throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition without a "columns" property`);
	}

	// Validate "rows" property
	const rows = def.rows;
	if (typeof rows !== 'function' || Object.getPrototypeOf(rows) !== GeneratorFunctionPrototype) {
		throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "rows" property (should be a generator function)`);
	}

	// Validate "columns" property
	let columns = def.columns;
	if (!Array.isArray(columns) || !(columns = [...columns]).every(x => typeof x === 'string')) {
		throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "columns" property (should be an array of strings)`);
	}
	if (columns.length !== new Set(columns).size) {
		throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with duplicate column names`);
	}
	if (!columns.length) {
		throw new RangeError(`Virtual table module "${moduleName}" ${verb} a table definition with zero columns`);
	}

	// Validate "parameters" property
	let parameters;
	if (hasOwnProperty.call(def, 'parameters')) {
		parameters = def.parameters;
		if (!Array.isArray(parameters) || !(parameters = [...parameters]).every(x => typeof x === 'string')) {
			throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "parameters" property (should be an array of strings)`);
		}
	} else {
		parameters = inferParameters(rows);
	}
	if (parameters.length !== new Set(parameters).size) {
		throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with duplicate parameter names`);
	}
	if (parameters.length > 32) {
		throw new RangeError(`Virtual table module "${moduleName}" ${verb} a table definition with more than the maximum number of 32 parameters`);
	}
	for (const parameter of parameters) {
		if (columns.includes(parameter)) {
			throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with column "${parameter}" which was ambiguously defined as both a column and parameter`);
		}
	}

	// Validate "safeIntegers" option
	let safeIntegers = 2;
	if (hasOwnProperty.call(def, 'safeIntegers')) {
		const bool = def.safeIntegers;
		if (typeof bool !== 'boolean') {
			throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "safeIntegers" property (should be a boolean)`);
		}
		safeIntegers = +bool;
	}

	// Validate "directOnly" option
	let directOnly = false;
	if (hasOwnProperty.call(def, 'directOnly')) {
		directOnly = def.directOnly;
		if (typeof directOnly !== 'boolean') {
			throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "directOnly" property (should be a boolean)`);
		}
	}

	// Generate SQL for the virtual table definition
	const columnDefinitions = [
		...parameters.map(identifier).map(str => `${str} HIDDEN`),
		...columns.map(identifier),
	];
	return [
		`CREATE TABLE x(${columnDefinitions.join(', ')});`,
		wrapGenerator(rows, new Map(columns.map((x, i) => [x, parameters.length + i])), moduleName),
		parameters,
		safeIntegers,
		directOnly,
	];
}

function wrapGenerator(generator, columnMap, moduleName) {
	return function* virtualTable(...args) {
		/*
			We must defensively clone any buffers in the arguments, because
			otherwise the generator could mutate one of them, which would cause
			us to return incorrect values for hidden columns, potentially
			corrupting the database.
		 */
		const output = args.map(x => Buffer.isBuffer(x) ? Buffer.from(x) : x);
		for (let i = 0; i < columnMap.size; ++i) {
			output.push(null); // Fill with nulls to prevent gaps in array (v8 optimization)
		}
		for (const row of generator(...args)) {
			if (Array.isArray(row)) {
				extractRowArray(row, output, columnMap.size, moduleName);
				yield output;
			} else if (typeof row === 'object' && row !== null) {
				extractRowObject(row, output, columnMap, moduleName);
				yield output;
			} else {
				throw new TypeError(`Virtual table module "${moduleName}" yielded something that isn't a valid row object`);
			}
		}
	};
}

function extractRowArray(row, output, columnCount, moduleName) {
	if (row.length !== columnCount) {
		throw new TypeError(`Virtual table module "${moduleName}" yielded a row with an incorrect number of columns`);
	}
	const offset = output.length - columnCount;
	for (let i = 0; i < columnCount; ++i) {
		output[i + offset] = row[i];
	}
}

function extractRowObject(row, output, columnMap, moduleName) {
	let count = 0;
	for (const key of Object.keys(row)) {
		const index = columnMap.get(key);
		if (index === undefined) {
			throw new TypeError(`Virtual table module "${moduleName}" yielded a row with an undeclared column "${key}"`);
		}
		output[index] = row[key];
		count += 1;
	}
	if (count !== columnMap.size) {
		throw new TypeError(`Virtual table module "${moduleName}" yielded a row with missing columns`);
	}
}

function inferParameters({ length }) {
	if (!Number.isInteger(length) || length < 0) {
		throw new TypeError('Expected function.length to be a positive integer');
	}
	const params = [];
	for (let i = 0; i < length; ++i) {
		params.push(`$${i + 1}`);
	}
	return params;
}

const { hasOwnProperty } = Object.prototype;
const { apply } = Function.prototype;
const GeneratorFunctionPrototype = Object.getPrototypeOf(function*(){});
const identifier = str => `"${str.replace(/"/g, '""')}"`;
const defer = x => () => x;


/***/ }),

/***/ 22506:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


const { cppdb } = __webpack_require__(4047);
const controllers = new WeakMap();

module.exports = function transaction(fn) {
	if (typeof fn !== 'function') throw new TypeError('Expected first argument to be a function');

	const db = this[cppdb];
	const controller = getController(db, this);
	const { apply } = Function.prototype;

	// Each version of the transaction function has these same properties
	const properties = {
		default: { value: wrapTransaction(apply, fn, db, controller.default) },
		deferred: { value: wrapTransaction(apply, fn, db, controller.deferred) },
		immediate: { value: wrapTransaction(apply, fn, db, controller.immediate) },
		exclusive: { value: wrapTransaction(apply, fn, db, controller.exclusive) },
		database: { value: this, enumerable: true },
	};

	Object.defineProperties(properties.default.value, properties);
	Object.defineProperties(properties.deferred.value, properties);
	Object.defineProperties(properties.immediate.value, properties);
	Object.defineProperties(properties.exclusive.value, properties);

	// Return the default version of the transaction function
	return properties.default.value;
};

// Return the database's cached transaction controller, or create a new one
const getController = (db, self) => {
	let controller = controllers.get(db);
	if (!controller) {
		const shared = {
			commit: db.prepare('COMMIT', self, false),
			rollback: db.prepare('ROLLBACK', self, false),
			savepoint: db.prepare('SAVEPOINT `\t_bs3.\t`', self, false),
			release: db.prepare('RELEASE `\t_bs3.\t`', self, false),
			rollbackTo: db.prepare('ROLLBACK TO `\t_bs3.\t`', self, false),
		};
		controllers.set(db, controller = {
			default: Object.assign({ begin: db.prepare('BEGIN', self, false) }, shared),
			deferred: Object.assign({ begin: db.prepare('BEGIN DEFERRED', self, false) }, shared),
			immediate: Object.assign({ begin: db.prepare('BEGIN IMMEDIATE', self, false) }, shared),
			exclusive: Object.assign({ begin: db.prepare('BEGIN EXCLUSIVE', self, false) }, shared),
		});
	}
	return controller;
};

// Return a new transaction function by wrapping the given function
const wrapTransaction = (apply, fn, db, { begin, commit, rollback, savepoint, release, rollbackTo }) => function sqliteTransaction() {
	let before, after, undo;
	if (db.inTransaction) {
		before = savepoint;
		after = release;
		undo = rollbackTo;
	} else {
		before = begin;
		after = commit;
		undo = rollback;
	}
	before.run();
	try {
		const result = apply.call(fn, this, arguments);
		if (result && typeof result.then === 'function') {
			throw new TypeError('Transaction function cannot return a promise');
		}
		after.run();
		return result;
	} catch (ex) {
		if (db.inTransaction) {
			undo.run();
			if (undo !== rollback) after.run();
		}
		throw ex;
	}
};


/***/ }),

/***/ 6924:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


const { cppdb } = __webpack_require__(4047);

exports.prepare = function prepare(sql) {
	return this[cppdb].prepare(sql, this, false);
};

exports.exec = function exec(sql) {
	this[cppdb].exec(sql);
	return this;
};

exports.close = function close() {
	this[cppdb].close();
	return this;
};

exports.loadExtension = function loadExtension(...args) {
	this[cppdb].loadExtension(...args);
	return this;
};

exports.defaultSafeIntegers = function defaultSafeIntegers(...args) {
	this[cppdb].defaultSafeIntegers(...args);
	return this;
};

exports.unsafeMode = function unsafeMode(...args) {
	this[cppdb].unsafeMode(...args);
	return this;
};

exports.getters = {
	name: {
		get: function name() { return this[cppdb].name; },
		enumerable: true,
	},
	open: {
		get: function open() { return this[cppdb].open; },
		enumerable: true,
	},
	inTransaction: {
		get: function inTransaction() { return this[cppdb].inTransaction; },
		enumerable: true,
	},
	readonly: {
		get: function readonly() { return this[cppdb].readonly; },
		enumerable: true,
	},
	memory: {
		get: function memory() { return this[cppdb].memory; },
		enumerable: true,
	},
};


/***/ }),

/***/ 81356:
/***/ ((module) => {


const descriptor = { value: 'SqliteError', writable: true, enumerable: false, configurable: true };

function SqliteError(message, code) {
	if (new.target !== SqliteError) {
		return new SqliteError(message, code);
	}
	if (typeof code !== 'string') {
		throw new TypeError('Expected second argument to be a string');
	}
	Error.call(this, message);
	descriptor.value = '' + message;
	Object.defineProperty(this, 'message', descriptor);
	Error.captureStackTrace(this, SqliteError);
	this.code = code;
}
Object.setPrototypeOf(SqliteError, Error);
Object.setPrototypeOf(SqliteError.prototype, Error.prototype);
Object.defineProperty(SqliteError.prototype, 'name', descriptor);
module.exports = SqliteError;


/***/ }),

/***/ 4047:
/***/ ((__unused_webpack_module, exports) => {



exports.getBooleanOption = (options, key) => {
	let value = false;
	if (key in options && typeof (value = options[key]) !== 'boolean') {
		throw new TypeError(`Expected the "${key}" option to be a boolean`);
	}
	return value;
};

exports.cppdb = Symbol();
exports.inspect = Symbol.for('nodejs.util.inspect.custom');


/***/ }),

/***/ 93145:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  v: () => (/* binding */ SQLiteColumn),
  o: () => (/* binding */ SQLiteColumnBuilder)
});

// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/column-builder.js
var column_builder = __webpack_require__(30057);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/column.js
var column = __webpack_require__(599);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/entity.js
var entity = __webpack_require__(48666);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/table.utils.js
var table_utils = __webpack_require__(66918);
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/foreign-keys.js


class ForeignKeyBuilder {
  static [entity/* entityKind */.i] = "SQLiteForeignKeyBuilder";
  /** @internal */
  reference;
  /** @internal */
  _onUpdate;
  /** @internal */
  _onDelete;
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
    this._onUpdate = action;
    return this;
  }
  onDelete(action) {
    this._onDelete = action;
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
  static [entity/* entityKind */.i] = "SQLiteForeignKey";
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
    if (typeof config === "function") {
      const { name, columns, foreignColumns } = config();
      return {
        name,
        columns,
        foreignColumns
      };
    }
    return config;
  }
  return new ForeignKeyBuilder(mappedConfig);
}

//# sourceMappingURL=foreign-keys.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/unique-constraint.js


function uniqueKeyName(table, columns) {
  return `${table[table_utils/* TableName */.E]}_${columns.join("_")}_unique`;
}
function unique(name) {
  return new UniqueOnConstraintBuilder(name);
}
class UniqueConstraintBuilder {
  constructor(columns, name) {
    this.name = name;
    this.columns = columns;
  }
  static [entity/* entityKind */.i] = (/* unused pure expression or super */ null && ("SQLiteUniqueConstraintBuilder"));
  /** @internal */
  columns;
  /** @internal */
  build(table) {
    return new UniqueConstraint(table, this.columns, this.name);
  }
}
class UniqueOnConstraintBuilder {
  static [entity/* entityKind */.i] = (/* unused pure expression or super */ null && ("SQLiteUniqueOnConstraintBuilder"));
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
  constructor(table, columns, name) {
    this.table = table;
    this.columns = columns;
    this.name = name ?? uniqueKeyName(this.table, this.columns.map((column) => column.name));
  }
  static [entity/* entityKind */.i] = (/* unused pure expression or super */ null && ("SQLiteUniqueConstraint"));
  columns;
  name;
  getName() {
    return this.name;
  }
}

//# sourceMappingURL=unique-constraint.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/columns/common.js





class SQLiteColumnBuilder extends column_builder/* ColumnBuilder */.Q {
  static [entity/* entityKind */.i] = "SQLiteColumnBuilder";
  foreignKeyConfigs = [];
  references(ref, actions = {}) {
    this.foreignKeyConfigs.push({ ref, actions });
    return this;
  }
  unique(name) {
    this.config.isUnique = true;
    this.config.uniqueName = name;
    return this;
  }
  generatedAlwaysAs(as, config) {
    this.config.generated = {
      as,
      type: "always",
      mode: config?.mode ?? "virtual"
    };
    return this;
  }
  /** @internal */
  buildForeignKeys(column, table) {
    return this.foreignKeyConfigs.map(({ ref, actions }) => {
      return ((ref2, actions2) => {
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
      })(ref, actions);
    });
  }
}
class SQLiteColumn extends column/* Column */.V {
  constructor(table, config) {
    if (!config.uniqueName) {
      config.uniqueName = uniqueKeyName(table, [config.name]);
    }
    super(table, config);
    this.table = table;
  }
  static [entity/* entityKind */.i] = "SQLiteColumn";
}

//# sourceMappingURL=common.js.map

/***/ }),

/***/ 22840:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   nd: () => (/* binding */ integer)
/* harmony export */ });
/* unused harmony exports SQLiteBaseInteger, SQLiteBaseIntegerBuilder, SQLiteBoolean, SQLiteBooleanBuilder, SQLiteInteger, SQLiteIntegerBuilder, SQLiteTimestamp, SQLiteTimestampBuilder, int */
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(48666);
/* harmony import */ var _sql_sql_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(67910);
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(82348);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(93145);




class SQLiteBaseIntegerBuilder extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .SQLiteColumnBuilder */ .o {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "SQLiteBaseIntegerBuilder";
  constructor(name, dataType, columnType) {
    super(name, dataType, columnType);
    this.config.autoIncrement = false;
  }
  primaryKey(config) {
    if (config?.autoIncrement) {
      this.config.autoIncrement = true;
    }
    this.config.hasDefault = true;
    return super.primaryKey();
  }
}
class SQLiteBaseInteger extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .SQLiteColumn */ .v {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "SQLiteBaseInteger";
  autoIncrement = this.config.autoIncrement;
  getSQLType() {
    return "integer";
  }
}
class SQLiteIntegerBuilder extends SQLiteBaseIntegerBuilder {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "SQLiteIntegerBuilder";
  constructor(name) {
    super(name, "number", "SQLiteInteger");
  }
  build(table) {
    return new SQLiteInteger(
      table,
      this.config
    );
  }
}
class SQLiteInteger extends SQLiteBaseInteger {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "SQLiteInteger";
}
class SQLiteTimestampBuilder extends SQLiteBaseIntegerBuilder {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "SQLiteTimestampBuilder";
  constructor(name, mode) {
    super(name, "date", "SQLiteTimestamp");
    this.config.mode = mode;
  }
  /**
   * @deprecated Use `default()` with your own expression instead.
   *
   * Adds `DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))` to the column, which is the current epoch timestamp in milliseconds.
   */
  defaultNow() {
    return this.default((0,_sql_sql_js__WEBPACK_IMPORTED_MODULE_2__/* .sql */ .ll)`(cast((julianday('now') - 2440587.5)*86400000 as integer))`);
  }
  build(table) {
    return new SQLiteTimestamp(
      table,
      this.config
    );
  }
}
class SQLiteTimestamp extends SQLiteBaseInteger {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "SQLiteTimestamp";
  mode = this.config.mode;
  mapFromDriverValue(value) {
    if (this.config.mode === "timestamp") {
      return new Date(value * 1e3);
    }
    return new Date(value);
  }
  mapToDriverValue(value) {
    const unix = value.getTime();
    if (this.config.mode === "timestamp") {
      return Math.floor(unix / 1e3);
    }
    return unix;
  }
}
class SQLiteBooleanBuilder extends SQLiteBaseIntegerBuilder {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "SQLiteBooleanBuilder";
  constructor(name, mode) {
    super(name, "boolean", "SQLiteBoolean");
    this.config.mode = mode;
  }
  build(table) {
    return new SQLiteBoolean(
      table,
      this.config
    );
  }
}
class SQLiteBoolean extends SQLiteBaseInteger {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "SQLiteBoolean";
  mode = this.config.mode;
  mapFromDriverValue(value) {
    return Number(value) === 1;
  }
  mapToDriverValue(value) {
    return value ? 1 : 0;
  }
}
function integer(a, b) {
  const { name, config } = (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .getColumnNameAndConfig */ .Ll)(a, b);
  if (config?.mode === "timestamp" || config?.mode === "timestamp_ms") {
    return new SQLiteTimestampBuilder(name, config.mode);
  }
  if (config?.mode === "boolean") {
    return new SQLiteBooleanBuilder(name, config.mode);
  }
  return new SQLiteIntegerBuilder(name);
}
const int = (/* unused pure expression or super */ null && (integer));

//# sourceMappingURL=integer.js.map

/***/ }),

/***/ 94748:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   x: () => (/* binding */ real)
/* harmony export */ });
/* unused harmony exports SQLiteReal, SQLiteRealBuilder */
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(48666);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(93145);


class SQLiteRealBuilder extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .SQLiteColumnBuilder */ .o {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "SQLiteRealBuilder";
  constructor(name) {
    super(name, "number", "SQLiteReal");
  }
  /** @internal */
  build(table) {
    return new SQLiteReal(table, this.config);
  }
}
class SQLiteReal extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .SQLiteColumn */ .v {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "SQLiteReal";
  getSQLType() {
    return "real";
  }
}
function real(name) {
  return new SQLiteRealBuilder(name ?? "");
}

//# sourceMappingURL=real.js.map

/***/ }),

/***/ 82563:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Qq: () => (/* binding */ text)
/* harmony export */ });
/* unused harmony exports SQLiteText, SQLiteTextBuilder, SQLiteTextJson, SQLiteTextJsonBuilder */
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(48666);
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(82348);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(93145);



class SQLiteTextBuilder extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .SQLiteColumnBuilder */ .o {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "SQLiteTextBuilder";
  constructor(name, config) {
    super(name, "string", "SQLiteText");
    this.config.enumValues = config.enum;
    this.config.length = config.length;
  }
  /** @internal */
  build(table) {
    return new SQLiteText(
      table,
      this.config
    );
  }
}
class SQLiteText extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .SQLiteColumn */ .v {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "SQLiteText";
  enumValues = this.config.enumValues;
  length = this.config.length;
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return `text${this.config.length ? `(${this.config.length})` : ""}`;
  }
}
class SQLiteTextJsonBuilder extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .SQLiteColumnBuilder */ .o {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "SQLiteTextJsonBuilder";
  constructor(name) {
    super(name, "json", "SQLiteTextJson");
  }
  /** @internal */
  build(table) {
    return new SQLiteTextJson(
      table,
      this.config
    );
  }
}
class SQLiteTextJson extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .SQLiteColumn */ .v {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "SQLiteTextJson";
  getSQLType() {
    return "text";
  }
  mapFromDriverValue(value) {
    return JSON.parse(value);
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
}
function text(a, b = {}) {
  const { name, config } = (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__/* .getColumnNameAndConfig */ .Ll)(a, b);
  if (config.mode === "json") {
    return new SQLiteTextJsonBuilder(name);
  }
  return new SQLiteTextBuilder(name, config);
}

//# sourceMappingURL=text.js.map

/***/ }),

/***/ 20161:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  jo: () => (/* binding */ SQLiteTable),
  D: () => (/* binding */ sqliteTable)
});

// UNUSED EXPORTS: InlineForeignKeys, sqliteTableCreator

// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/entity.js
var entity = __webpack_require__(48666);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/table.js
var drizzle_orm_table = __webpack_require__(17169);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/utils.js
var utils = __webpack_require__(82348);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/columns/common.js + 2 modules
var common = __webpack_require__(93145);
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/columns/blob.js



class SQLiteBigIntBuilder extends common/* SQLiteColumnBuilder */.o {
  static [entity/* entityKind */.i] = "SQLiteBigIntBuilder";
  constructor(name) {
    super(name, "bigint", "SQLiteBigInt");
  }
  /** @internal */
  build(table) {
    return new SQLiteBigInt(table, this.config);
  }
}
class SQLiteBigInt extends common/* SQLiteColumn */.v {
  static [entity/* entityKind */.i] = "SQLiteBigInt";
  getSQLType() {
    return "blob";
  }
  mapFromDriverValue(value) {
    if (typeof Buffer !== "undefined" && Buffer.from) {
      const buf = Buffer.isBuffer(value) ? value : value instanceof ArrayBuffer ? Buffer.from(value) : value.buffer ? Buffer.from(value.buffer, value.byteOffset, value.byteLength) : Buffer.from(value);
      return BigInt(buf.toString("utf8"));
    }
    return BigInt(utils/* textDecoder */.su.decode(value));
  }
  mapToDriverValue(value) {
    return Buffer.from(value.toString());
  }
}
class SQLiteBlobJsonBuilder extends common/* SQLiteColumnBuilder */.o {
  static [entity/* entityKind */.i] = "SQLiteBlobJsonBuilder";
  constructor(name) {
    super(name, "json", "SQLiteBlobJson");
  }
  /** @internal */
  build(table) {
    return new SQLiteBlobJson(
      table,
      this.config
    );
  }
}
class SQLiteBlobJson extends common/* SQLiteColumn */.v {
  static [entity/* entityKind */.i] = "SQLiteBlobJson";
  getSQLType() {
    return "blob";
  }
  mapFromDriverValue(value) {
    if (typeof Buffer !== "undefined" && Buffer.from) {
      const buf = Buffer.isBuffer(value) ? value : value instanceof ArrayBuffer ? Buffer.from(value) : value.buffer ? Buffer.from(value.buffer, value.byteOffset, value.byteLength) : Buffer.from(value);
      return JSON.parse(buf.toString("utf8"));
    }
    return JSON.parse(utils/* textDecoder */.su.decode(value));
  }
  mapToDriverValue(value) {
    return Buffer.from(JSON.stringify(value));
  }
}
class SQLiteBlobBufferBuilder extends common/* SQLiteColumnBuilder */.o {
  static [entity/* entityKind */.i] = "SQLiteBlobBufferBuilder";
  constructor(name) {
    super(name, "buffer", "SQLiteBlobBuffer");
  }
  /** @internal */
  build(table) {
    return new SQLiteBlobBuffer(table, this.config);
  }
}
class SQLiteBlobBuffer extends common/* SQLiteColumn */.v {
  static [entity/* entityKind */.i] = "SQLiteBlobBuffer";
  mapFromDriverValue(value) {
    if (Buffer.isBuffer(value)) {
      return value;
    }
    return Buffer.from(value);
  }
  getSQLType() {
    return "blob";
  }
}
function blob(a, b) {
  const { name, config } = (0,utils/* getColumnNameAndConfig */.Ll)(a, b);
  if (config?.mode === "json") {
    return new SQLiteBlobJsonBuilder(name);
  }
  if (config?.mode === "bigint") {
    return new SQLiteBigIntBuilder(name);
  }
  return new SQLiteBlobBufferBuilder(name);
}

//# sourceMappingURL=blob.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/columns/custom.js



class SQLiteCustomColumnBuilder extends common/* SQLiteColumnBuilder */.o {
  static [entity/* entityKind */.i] = "SQLiteCustomColumnBuilder";
  constructor(name, fieldConfig, customTypeParams) {
    super(name, "custom", "SQLiteCustomColumn");
    this.config.fieldConfig = fieldConfig;
    this.config.customTypeParams = customTypeParams;
  }
  /** @internal */
  build(table) {
    return new SQLiteCustomColumn(
      table,
      this.config
    );
  }
}
class SQLiteCustomColumn extends common/* SQLiteColumn */.v {
  static [entity/* entityKind */.i] = "SQLiteCustomColumn";
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
    return new SQLiteCustomColumnBuilder(
      name,
      config,
      customTypeParams
    );
  };
}

//# sourceMappingURL=custom.js.map
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/columns/integer.js
var integer = __webpack_require__(22840);
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/columns/numeric.js



class SQLiteNumericBuilder extends common/* SQLiteColumnBuilder */.o {
  static [entity/* entityKind */.i] = "SQLiteNumericBuilder";
  constructor(name) {
    super(name, "string", "SQLiteNumeric");
  }
  /** @internal */
  build(table) {
    return new SQLiteNumeric(
      table,
      this.config
    );
  }
}
class SQLiteNumeric extends common/* SQLiteColumn */.v {
  static [entity/* entityKind */.i] = "SQLiteNumeric";
  mapFromDriverValue(value) {
    if (typeof value === "string") return value;
    return String(value);
  }
  getSQLType() {
    return "numeric";
  }
}
class SQLiteNumericNumberBuilder extends common/* SQLiteColumnBuilder */.o {
  static [entity/* entityKind */.i] = "SQLiteNumericNumberBuilder";
  constructor(name) {
    super(name, "number", "SQLiteNumericNumber");
  }
  /** @internal */
  build(table) {
    return new SQLiteNumericNumber(
      table,
      this.config
    );
  }
}
class SQLiteNumericNumber extends common/* SQLiteColumn */.v {
  static [entity/* entityKind */.i] = "SQLiteNumericNumber";
  mapFromDriverValue(value) {
    if (typeof value === "number") return value;
    return Number(value);
  }
  mapToDriverValue = String;
  getSQLType() {
    return "numeric";
  }
}
class SQLiteNumericBigIntBuilder extends common/* SQLiteColumnBuilder */.o {
  static [entity/* entityKind */.i] = "SQLiteNumericBigIntBuilder";
  constructor(name) {
    super(name, "bigint", "SQLiteNumericBigInt");
  }
  /** @internal */
  build(table) {
    return new SQLiteNumericBigInt(
      table,
      this.config
    );
  }
}
class SQLiteNumericBigInt extends common/* SQLiteColumn */.v {
  static [entity/* entityKind */.i] = "SQLiteNumericBigInt";
  mapFromDriverValue = BigInt;
  mapToDriverValue = String;
  getSQLType() {
    return "numeric";
  }
}
function numeric(a, b) {
  const { name, config } = (0,utils/* getColumnNameAndConfig */.Ll)(a, b);
  const mode = config?.mode;
  return mode === "number" ? new SQLiteNumericNumberBuilder(name) : mode === "bigint" ? new SQLiteNumericBigIntBuilder(name) : new SQLiteNumericBuilder(name);
}

//# sourceMappingURL=numeric.js.map
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/columns/real.js
var real = __webpack_require__(94748);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/columns/text.js
var columns_text = __webpack_require__(82563);
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/columns/all.js






function getSQLiteColumnBuilders() {
  return {
    blob: blob,
    customType: customType,
    integer: integer/* integer */.nd,
    numeric: numeric,
    real: real/* real */.x,
    text: columns_text/* text */.Qq
  };
}

//# sourceMappingURL=all.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/table.js



const InlineForeignKeys = Symbol.for("drizzle:SQLiteInlineForeignKeys");
class SQLiteTable extends drizzle_orm_table/* Table */.XI {
  static [entity/* entityKind */.i] = "SQLiteTable";
  /** @internal */
  static Symbol = Object.assign({}, drizzle_orm_table/* Table */.XI.Symbol, {
    InlineForeignKeys
  });
  /** @internal */
  [drizzle_orm_table/* Table */.XI.Symbol.Columns];
  /** @internal */
  [InlineForeignKeys] = [];
  /** @internal */
  [drizzle_orm_table/* Table */.XI.Symbol.ExtraConfigBuilder] = void 0;
}
function sqliteTableBase(name, columns, extraConfig, schema, baseName = name) {
  const rawTable = new SQLiteTable(name, schema, baseName);
  const parsedColumns = typeof columns === "function" ? columns(getSQLiteColumnBuilders()) : columns;
  const builtColumns = Object.fromEntries(
    Object.entries(parsedColumns).map(([name2, colBuilderBase]) => {
      const colBuilder = colBuilderBase;
      colBuilder.setName(name2);
      const column = colBuilder.build(rawTable);
      rawTable[InlineForeignKeys].push(...colBuilder.buildForeignKeys(column, rawTable));
      return [name2, column];
    })
  );
  const table = Object.assign(rawTable, builtColumns);
  table[drizzle_orm_table/* Table */.XI.Symbol.Columns] = builtColumns;
  table[drizzle_orm_table/* Table */.XI.Symbol.ExtraConfigColumns] = builtColumns;
  if (extraConfig) {
    table[SQLiteTable.Symbol.ExtraConfigBuilder] = extraConfig;
  }
  return table;
}
const sqliteTable = (name, columns, extraConfig) => {
  return sqliteTableBase(name, columns, extraConfig);
};
function sqliteTableCreator(customizeTableName) {
  return (name, columns, extraConfig) => {
    return sqliteTableBase(customizeTableName(name), columns, extraConfig, void 0, name);
  };
}

//# sourceMappingURL=table.js.map

/***/ }),

/***/ 25789:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  f: () => (/* binding */ drizzle)
});

// UNUSED EXPORTS: SqliteRemoteDatabase

// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/entity.js
var entity = __webpack_require__(48666);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/logger.js
var drizzle_orm_logger = __webpack_require__(58337);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/relations.js + 1 modules
var relations = __webpack_require__(54518);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/selection-proxy.js
var selection_proxy = __webpack_require__(37406);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sql/sql.js + 1 modules
var sql = __webpack_require__(67910);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/alias.js
var alias = __webpack_require__(91369);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/casing.js
var casing = __webpack_require__(50690);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/column.js
var column = __webpack_require__(599);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/errors.js
var errors = __webpack_require__(42230);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sql/expressions/conditions.js
var conditions = __webpack_require__(7002);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/columns/common.js + 2 modules
var common = __webpack_require__(93145);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/table.js + 4 modules
var sqlite_core_table = __webpack_require__(20161);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/subquery.js
var subquery = __webpack_require__(2387);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/table.js
var drizzle_orm_table = __webpack_require__(17169);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/utils.js
var utils = __webpack_require__(82348);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/view-common.js
var view_common = __webpack_require__(9152);
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/view-base.js


class SQLiteViewBase extends sql/* View */.Ss {
  static [entity/* entityKind */.i] = "SQLiteViewBase";
}

//# sourceMappingURL=view-base.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/dialect.js















class SQLiteDialect {
  static [entity/* entityKind */.i] = "SQLiteDialect";
  /** @internal */
  casing;
  constructor(config) {
    this.casing = new casing/* CasingCache */.Yn(config?.casing);
  }
  escapeName(name) {
    return `"${name}"`;
  }
  escapeParam(_num) {
    return "?";
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
  buildDeleteQuery({ table, where, returning, withList, limit, orderBy }) {
    const withSql = this.buildWithCTE(withList);
    const returningSql = returning ? (0,sql/* sql */.ll)` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const whereSql = where ? (0,sql/* sql */.ll)` where ${where}` : void 0;
    const orderBySql = this.buildOrderBy(orderBy);
    const limitSql = this.buildLimit(limit);
    return (0,sql/* sql */.ll)`${withSql}delete from ${table}${whereSql}${returningSql}${orderBySql}${limitSql}`;
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
  buildUpdateQuery({ table, set, where, returning, withList, joins, from, limit, orderBy }) {
    const withSql = this.buildWithCTE(withList);
    const setSql = this.buildUpdateSet(table, set);
    const fromSql = from && sql/* sql */.ll.join([sql/* sql */.ll.raw(" from "), this.buildFromTable(from)]);
    const joinsSql = this.buildJoins(joins);
    const returningSql = returning ? (0,sql/* sql */.ll)` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const whereSql = where ? (0,sql/* sql */.ll)` where ${where}` : void 0;
    const orderBySql = this.buildOrderBy(orderBy);
    const limitSql = this.buildLimit(limit);
    return (0,sql/* sql */.ll)`${withSql}update ${table} set ${setSql}${fromSql}${joinsSql}${whereSql}${returningSql}${orderBySql}${limitSql}`;
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
                if ((0,entity.is)(c, column/* Column */.V)) {
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
        const tableName = field.table[drizzle_orm_table/* Table */.XI.Symbol.Name];
        if (field.columnType === "SQLiteNumericBigInt") {
          if (isSingleTable) {
            chunk.push((0,sql/* sql */.ll)`cast(${sql/* sql */.ll.identifier(this.casing.getColumnCasing(field))} as text)`);
          } else {
            chunk.push(
              (0,sql/* sql */.ll)`cast(${sql/* sql */.ll.identifier(tableName)}.${sql/* sql */.ll.identifier(this.casing.getColumnCasing(field))} as text)`
            );
          }
        } else {
          if (isSingleTable) {
            chunk.push(sql/* sql */.ll.identifier(this.casing.getColumnCasing(field)));
          } else {
            chunk.push((0,sql/* sql */.ll)`${sql/* sql */.ll.identifier(tableName)}.${sql/* sql */.ll.identifier(this.casing.getColumnCasing(field))}`);
          }
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
    if (joins) {
      for (const [index, joinMeta] of joins.entries()) {
        if (index === 0) {
          joinsArray.push((0,sql/* sql */.ll)` `);
        }
        const table = joinMeta.table;
        const onSql = joinMeta.on ? (0,sql/* sql */.ll)` on ${joinMeta.on}` : void 0;
        if ((0,entity.is)(table, sqlite_core_table/* SQLiteTable */.jo)) {
          const tableName = table[sqlite_core_table/* SQLiteTable */.jo.Symbol.Name];
          const tableSchema = table[sqlite_core_table/* SQLiteTable */.jo.Symbol.Schema];
          const origTableName = table[sqlite_core_table/* SQLiteTable */.jo.Symbol.OriginalName];
          const alias = tableName === origTableName ? void 0 : joinMeta.alias;
          joinsArray.push(
            (0,sql/* sql */.ll)`${sql/* sql */.ll.raw(joinMeta.joinType)} join ${tableSchema ? (0,sql/* sql */.ll)`${sql/* sql */.ll.identifier(tableSchema)}.` : void 0}${sql/* sql */.ll.identifier(origTableName)}${alias && (0,sql/* sql */.ll)` ${sql/* sql */.ll.identifier(alias)}`}${onSql}`
          );
        } else {
          joinsArray.push(
            (0,sql/* sql */.ll)`${sql/* sql */.ll.raw(joinMeta.joinType)} join ${table}${onSql}`
          );
        }
        if (index < joins.length - 1) {
          joinsArray.push((0,sql/* sql */.ll)` `);
        }
      }
    }
    return sql/* sql */.ll.join(joinsArray);
  }
  buildLimit(limit) {
    return typeof limit === "object" || typeof limit === "number" && limit >= 0 ? (0,sql/* sql */.ll)` limit ${limit}` : void 0;
  }
  buildOrderBy(orderBy) {
    const orderByList = [];
    if (orderBy) {
      for (const [index, orderByValue] of orderBy.entries()) {
        orderByList.push(orderByValue);
        if (index < orderBy.length - 1) {
          orderByList.push((0,sql/* sql */.ll)`, `);
        }
      }
    }
    return orderByList.length > 0 ? (0,sql/* sql */.ll)` order by ${sql/* sql */.ll.join(orderByList)}` : void 0;
  }
  buildFromTable(table) {
    if ((0,entity.is)(table, drizzle_orm_table/* Table */.XI) && table[drizzle_orm_table/* Table */.XI.Symbol.IsAlias]) {
      return (0,sql/* sql */.ll)`${(0,sql/* sql */.ll)`${sql/* sql */.ll.identifier(table[drizzle_orm_table/* Table */.XI.Symbol.Schema] ?? "")}.`.if(table[drizzle_orm_table/* Table */.XI.Symbol.Schema])}${sql/* sql */.ll.identifier(table[drizzle_orm_table/* Table */.XI.Symbol.OriginalName])} ${sql/* sql */.ll.identifier(table[drizzle_orm_table/* Table */.XI.Symbol.Name])}`;
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
    distinct,
    setOperators
  }) {
    const fieldsList = fieldsFlat ?? (0,utils/* orderSelectedFields */.He)(fields);
    for (const f of fieldsList) {
      if ((0,entity.is)(f.field, column/* Column */.V) && (0,drizzle_orm_table/* getTableName */.Io)(f.field.table) !== ((0,entity.is)(table, subquery/* Subquery */.n) ? table._.alias : (0,entity.is)(table, SQLiteViewBase) ? table[view_common/* ViewBaseConfig */.n].name : (0,entity.is)(table, sql/* SQL */.Xs) ? void 0 : (0,drizzle_orm_table/* getTableName */.Io)(table)) && !((table2) => joins?.some(
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
    const distinctSql = distinct ? (0,sql/* sql */.ll)` distinct` : void 0;
    const selection = this.buildSelection(fieldsList, { isSingleTable });
    const tableSql = this.buildFromTable(table);
    const joinsSql = this.buildJoins(joins);
    const whereSql = where ? (0,sql/* sql */.ll)` where ${where}` : void 0;
    const havingSql = having ? (0,sql/* sql */.ll)` having ${having}` : void 0;
    const groupByList = [];
    if (groupBy) {
      for (const [index, groupByValue] of groupBy.entries()) {
        groupByList.push(groupByValue);
        if (index < groupBy.length - 1) {
          groupByList.push((0,sql/* sql */.ll)`, `);
        }
      }
    }
    const groupBySql = groupByList.length > 0 ? (0,sql/* sql */.ll)` group by ${sql/* sql */.ll.join(groupByList)}` : void 0;
    const orderBySql = this.buildOrderBy(orderBy);
    const limitSql = this.buildLimit(limit);
    const offsetSql = offset ? (0,sql/* sql */.ll)` offset ${offset}` : void 0;
    const finalQuery = (0,sql/* sql */.ll)`${withSql}select${distinctSql} ${selection} from ${tableSql}${joinsSql}${whereSql}${groupBySql}${havingSql}${orderBySql}${limitSql}${offsetSql}`;
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
    const leftChunk = (0,sql/* sql */.ll)`${leftSelect.getSQL()} `;
    const rightChunk = (0,sql/* sql */.ll)`${rightSelect.getSQL()}`;
    let orderBySql;
    if (orderBy && orderBy.length > 0) {
      const orderByValues = [];
      for (const singleOrderBy of orderBy) {
        if ((0,entity.is)(singleOrderBy, common/* SQLiteColumn */.v)) {
          orderByValues.push(sql/* sql */.ll.identifier(singleOrderBy.name));
        } else if ((0,entity.is)(singleOrderBy, sql/* SQL */.Xs)) {
          for (let i = 0; i < singleOrderBy.queryChunks.length; i++) {
            const chunk = singleOrderBy.queryChunks[i];
            if ((0,entity.is)(chunk, common/* SQLiteColumn */.v)) {
              singleOrderBy.queryChunks[i] = sql/* sql */.ll.identifier(this.casing.getColumnCasing(chunk));
            }
          }
          orderByValues.push((0,sql/* sql */.ll)`${singleOrderBy}`);
        } else {
          orderByValues.push((0,sql/* sql */.ll)`${singleOrderBy}`);
        }
      }
      orderBySql = (0,sql/* sql */.ll)` order by ${sql/* sql */.ll.join(orderByValues, (0,sql/* sql */.ll)`, `)}`;
    }
    const limitSql = typeof limit === "object" || typeof limit === "number" && limit >= 0 ? (0,sql/* sql */.ll)` limit ${limit}` : void 0;
    const operatorChunk = sql/* sql */.ll.raw(`${type} ${isAll ? "all " : ""}`);
    const offsetSql = offset ? (0,sql/* sql */.ll)` offset ${offset}` : void 0;
    return (0,sql/* sql */.ll)`${leftChunk}${operatorChunk}${rightChunk}${orderBySql}${limitSql}${offsetSql}`;
  }
  buildInsertQuery({ table, values: valuesOrSelect, onConflict, returning, withList, select }) {
    const valuesSqlList = [];
    const columns = table[drizzle_orm_table/* Table */.XI.Symbol.Columns];
    const colEntries = Object.entries(columns).filter(
      ([_, col]) => !col.shouldDisableInsert()
    );
    const insertOrder = colEntries.map(([, column]) => sql/* sql */.ll.identifier(this.casing.getColumnCasing(column)));
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
            let defaultValue;
            if (col.default !== null && col.default !== void 0) {
              defaultValue = (0,entity.is)(col.default, sql/* SQL */.Xs) ? col.default : sql/* sql */.ll.param(col.default, col);
            } else if (col.defaultFn !== void 0) {
              const defaultFnResult = col.defaultFn();
              defaultValue = (0,entity.is)(defaultFnResult, sql/* SQL */.Xs) ? defaultFnResult : sql/* sql */.ll.param(defaultFnResult, col);
            } else if (!col.default && col.onUpdateFn !== void 0) {
              const onUpdateFnResult = col.onUpdateFn();
              defaultValue = (0,entity.is)(onUpdateFnResult, sql/* SQL */.Xs) ? onUpdateFnResult : sql/* sql */.ll.param(onUpdateFnResult, col);
            } else {
              defaultValue = (0,sql/* sql */.ll)`null`;
            }
            valueList.push(defaultValue);
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
    const onConflictSql = onConflict?.length ? sql/* sql */.ll.join(onConflict) : void 0;
    return (0,sql/* sql */.ll)`${withSql}insert into ${table} ${insertOrder} ${valuesSql}${onConflictSql}${returningSql}`;
  }
  sqlToQuery(sql2, invokeSource) {
    return sql2.toQuery({
      casing: this.casing,
      escapeName: this.escapeName,
      escapeParam: this.escapeParam,
      escapeString: this.escapeString,
      invokeSource
    });
  }
  buildRelationalQuery({
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
        const builtRelation = this.buildRelationalQuery({
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
        const field = (0,sql/* sql */.ll)`(${builtRelation.sql})`.as(selectedRelationTsKey);
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
      throw new errors/* DrizzleError */.n9({
        message: `No fields selected for table "${tableConfig.tsName}" ("${tableAlias}"). You need to have at least one item in "columns", "with" or "extras". If you need to select all columns, omit the "columns" key or set it to undefined.`
      });
    }
    let result;
    where = (0,conditions/* and */.Uo)(joinOn, where);
    if (nestedQueryRelation) {
      let field = (0,sql/* sql */.ll)`json_array(${sql/* sql */.ll.join(
        selection.map(
          ({ field: field2 }) => (0,entity.is)(field2, common/* SQLiteColumn */.v) ? sql/* sql */.ll.identifier(this.casing.getColumnCasing(field2)) : (0,entity.is)(field2, sql/* SQL */.Xs.Aliased) ? field2.sql : field2
        ),
        (0,sql/* sql */.ll)`, `
      )})`;
      if ((0,entity.is)(nestedQueryRelation, relations/* Many */.iv)) {
        field = (0,sql/* sql */.ll)`coalesce(json_group_array(${field}), json_array())`;
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
          fieldsFlat: [
            {
              path: [],
              field: sql/* sql */.ll.raw("*")
            }
          ],
          where,
          limit,
          offset,
          orderBy,
          setOperators: []
        });
        where = void 0;
        limit = void 0;
        offset = void 0;
        orderBy = void 0;
      } else {
        result = (0,alias/* aliasedTable */.oG)(table, tableAlias);
      }
      result = this.buildSelectQuery({
        table: (0,entity.is)(result, sqlite_core_table/* SQLiteTable */.jo) ? result : new subquery/* Subquery */.n(result, {}, tableAlias),
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
class SQLiteSyncDialect extends SQLiteDialect {
  static [entity/* entityKind */.i] = "SQLiteSyncDialect";
  migrate(migrations, session, config) {
    const migrationsTable = config === void 0 ? "__drizzle_migrations" : typeof config === "string" ? "__drizzle_migrations" : config.migrationsTable ?? "__drizzle_migrations";
    const migrationTableCreate = (0,sql/* sql */.ll)`
			CREATE TABLE IF NOT EXISTS ${sql/* sql */.ll.identifier(migrationsTable)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at numeric
			)
		`;
    session.run(migrationTableCreate);
    const dbMigrations = session.values(
      (0,sql/* sql */.ll)`SELECT id, hash, created_at FROM ${sql/* sql */.ll.identifier(migrationsTable)} ORDER BY created_at DESC LIMIT 1`
    );
    const lastDbMigration = dbMigrations[0] ?? void 0;
    session.run((0,sql/* sql */.ll)`BEGIN`);
    try {
      for (const migration of migrations) {
        if (!lastDbMigration || Number(lastDbMigration[2]) < migration.folderMillis) {
          for (const stmt of migration.sql) {
            session.run(sql/* sql */.ll.raw(stmt));
          }
          session.run(
            (0,sql/* sql */.ll)`INSERT INTO ${sql/* sql */.ll.identifier(migrationsTable)} ("hash", "created_at") VALUES(${migration.hash}, ${migration.folderMillis})`
          );
        }
      }
      session.run((0,sql/* sql */.ll)`COMMIT`);
    } catch (e) {
      session.run((0,sql/* sql */.ll)`ROLLBACK`);
      throw e;
    }
  }
}
class SQLiteAsyncDialect extends SQLiteDialect {
  static [entity/* entityKind */.i] = "SQLiteAsyncDialect";
  async migrate(migrations, session, config) {
    const migrationsTable = config === void 0 ? "__drizzle_migrations" : typeof config === "string" ? "__drizzle_migrations" : config.migrationsTable ?? "__drizzle_migrations";
    const migrationTableCreate = (0,sql/* sql */.ll)`
			CREATE TABLE IF NOT EXISTS ${sql/* sql */.ll.identifier(migrationsTable)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at numeric
			)
		`;
    await session.run(migrationTableCreate);
    const dbMigrations = await session.values(
      (0,sql/* sql */.ll)`SELECT id, hash, created_at FROM ${sql/* sql */.ll.identifier(migrationsTable)} ORDER BY created_at DESC LIMIT 1`
    );
    const lastDbMigration = dbMigrations[0] ?? void 0;
    await session.transaction(async (tx) => {
      for (const migration of migrations) {
        if (!lastDbMigration || Number(lastDbMigration[2]) < migration.folderMillis) {
          for (const stmt of migration.sql) {
            await tx.run(sql/* sql */.ll.raw(stmt));
          }
          await tx.run(
            (0,sql/* sql */.ll)`INSERT INTO ${sql/* sql */.ll.identifier(migrationsTable)} ("hash", "created_at") VALUES(${migration.hash}, ${migration.folderMillis})`
          );
        }
      }
    });
  }
}

//# sourceMappingURL=dialect.js.map
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/query-builders/query-builder.js
var query_builder = __webpack_require__(45399);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/query-promise.js
var query_promise = __webpack_require__(61753);
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/utils.js











function getTableConfig(table) {
  const columns = Object.values(table[SQLiteTable.Symbol.Columns]);
  const indexes = [];
  const checks = [];
  const primaryKeys = [];
  const uniqueConstraints = [];
  const foreignKeys = Object.values(table[SQLiteTable.Symbol.InlineForeignKeys]);
  const name = table[Table.Symbol.Name];
  const extraConfigBuilder = table[SQLiteTable.Symbol.ExtraConfigBuilder];
  if (extraConfigBuilder !== void 0) {
    const extraConfig = extraConfigBuilder(table[SQLiteTable.Symbol.Columns]);
    const extraValues = Array.isArray(extraConfig) ? extraConfig.flat(1) : Object.values(extraConfig);
    for (const builder of Object.values(extraValues)) {
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
    name
  };
}
function extractUsedTable(table) {
  if ((0,entity.is)(table, sqlite_core_table/* SQLiteTable */.jo)) {
    return [`${table[drizzle_orm_table/* Table */.XI.Symbol.BaseName]}`];
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
    ...view[ViewBaseConfig]
    // ...view[SQLiteViewConfig],
  };
}

//# sourceMappingURL=utils.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/query-builders/select.js











class SQLiteSelectBuilder {
  static [entity/* entityKind */.i] = "SQLiteSelectBuilder";
  fields;
  session;
  dialect;
  withList;
  distinct;
  constructor(config) {
    this.fields = config.fields;
    this.session = config.session;
    this.dialect = config.dialect;
    this.withList = config.withList;
    this.distinct = config.distinct;
  }
  from(source) {
    const isPartialSelect = !!this.fields;
    let fields;
    if (this.fields) {
      fields = this.fields;
    } else if ((0,entity.is)(source, subquery/* Subquery */.n)) {
      fields = Object.fromEntries(
        Object.keys(source._.selectedFields).map((key) => [key, source[key]])
      );
    } else if ((0,entity.is)(source, SQLiteViewBase)) {
      fields = source[view_common/* ViewBaseConfig */.n].selectedFields;
    } else if ((0,entity.is)(source, sql/* SQL */.Xs)) {
      fields = {};
    } else {
      fields = (0,utils/* getTableColumns */.YD)(source);
    }
    return new SQLiteSelectBase({
      table: source,
      fields,
      isPartialSelect,
      session: this.session,
      dialect: this.dialect,
      withList: this.withList,
      distinct: this.distinct
    });
  }
}
class SQLiteSelectQueryBuilderBase extends query_builder/* TypedQueryBuilder */.O {
  static [entity/* entityKind */.i] = "SQLiteSelectQueryBuilder";
  _;
  /** @internal */
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
  createJoin(joinType) {
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
  leftJoin = this.createJoin("left");
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
  rightJoin = this.createJoin("right");
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
  innerJoin = this.createJoin("inner");
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
  fullJoin = this.createJoin("full");
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
  crossJoin = this.createJoin("cross");
  createSetOperator(type, isAll) {
    return (rightSelection) => {
      const rightSelect = typeof rightSelection === "function" ? rightSelection(getSQLiteSetOperators()) : rightSelection;
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
   * import { union } from 'drizzle-orm/sqlite-core'
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
   * import { unionAll } from 'drizzle-orm/sqlite-core'
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
   * import { intersect } from 'drizzle-orm/sqlite-core'
   *
   * await intersect(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  intersect = this.createSetOperator("intersect", false);
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
   * import { except } from 'drizzle-orm/sqlite-core'
   *
   * await except(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  except = this.createSetOperator("except", false);
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
}
class SQLiteSelectBase extends SQLiteSelectQueryBuilderBase {
  static [entity/* entityKind */.i] = "SQLiteSelect";
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    if (!this.session) {
      throw new Error("Cannot execute a query on a query builder. Please use a database instance instead.");
    }
    const fieldsList = (0,utils/* orderSelectedFields */.He)(this.config.fields);
    const query = this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      fieldsList,
      "all",
      true,
      void 0,
      {
        type: "select",
        tables: [...this.usedTables]
      },
      this.cacheConfig
    );
    query.joinsNotNullableMap = this.joinsNotNullableMap;
    return query;
  }
  $withCache(config) {
    this.cacheConfig = config === void 0 ? { config: {}, enable: true, autoInvalidate: true } : config === false ? { enable: false } : { enable: true, autoInvalidate: true, ...config };
    return this;
  }
  prepare() {
    return this._prepare(false);
  }
  run = (placeholderValues) => {
    return this._prepare().run(placeholderValues);
  };
  all = (placeholderValues) => {
    return this._prepare().all(placeholderValues);
  };
  get = (placeholderValues) => {
    return this._prepare().get(placeholderValues);
  };
  values = (placeholderValues) => {
    return this._prepare().values(placeholderValues);
  };
  async execute() {
    return this.all();
  }
}
(0,utils/* applyMixins */.XJ)(SQLiteSelectBase, [query_promise/* QueryPromise */.k]);
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
const getSQLiteSetOperators = () => ({
  union,
  unionAll,
  intersect,
  except
});
const union = createSetOperator("union", false);
const unionAll = createSetOperator("union", true);
const intersect = createSetOperator("intersect", false);
const except = createSetOperator("except", false);

//# sourceMappingURL=select.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/query-builders/query-builder.js





class QueryBuilder {
  static [entity/* entityKind */.i] = "SQLiteQueryBuilder";
  dialect;
  dialectConfig;
  constructor(dialect) {
    this.dialect = (0,entity.is)(dialect, SQLiteDialect) ? dialect : void 0;
    this.dialectConfig = (0,entity.is)(dialect, SQLiteDialect) ? void 0 : dialect;
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
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        withList: queries
      });
    }
    function selectDistinct(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        withList: queries,
        distinct: true
      });
    }
    return { select, selectDistinct };
  }
  select(fields) {
    return new SQLiteSelectBuilder({ fields: fields ?? void 0, session: void 0, dialect: this.getDialect() });
  }
  selectDistinct(fields) {
    return new SQLiteSelectBuilder({
      fields: fields ?? void 0,
      session: void 0,
      dialect: this.getDialect(),
      distinct: true
    });
  }
  // Lazy load dialect to avoid circular dependency
  getDialect() {
    if (!this.dialect) {
      this.dialect = new SQLiteSyncDialect(this.dialectConfig);
    }
    return this.dialect;
  }
}

//# sourceMappingURL=query-builder.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/query-builders/update.js










class SQLiteUpdateBuilder {
  constructor(table, session, dialect, withList) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
  }
  static [entity/* entityKind */.i] = "SQLiteUpdateBuilder";
  set(values) {
    return new SQLiteUpdateBase(
      this.table,
      (0,utils/* mapUpdateSet */.q)(this.table, values),
      this.session,
      this.dialect,
      this.withList
    );
  }
}
class SQLiteUpdateBase extends query_promise/* QueryPromise */.k {
  constructor(table, set, session, dialect, withList) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { set, table, withList, joins: [] };
  }
  static [entity/* entityKind */.i] = "SQLiteUpdate";
  /** @internal */
  config;
  from(source) {
    this.config.from = source;
    return this;
  }
  createJoin(joinType) {
    return (table, on) => {
      const tableName = (0,utils/* getTableLikeName */.zN)(table);
      if (typeof tableName === "string" && this.config.joins.some((join) => join.alias === tableName)) {
        throw new Error(`Alias "${tableName}" is already used in this query`);
      }
      if (typeof on === "function") {
        const from = this.config.from ? (0,entity.is)(table, sqlite_core_table/* SQLiteTable */.jo) ? table[drizzle_orm_table/* Table */.XI.Symbol.Columns] : (0,entity.is)(table, subquery/* Subquery */.n) ? table._.selectedFields : (0,entity.is)(table, SQLiteViewBase) ? table[view_common/* ViewBaseConfig */.n].selectedFields : void 0 : void 0;
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
   * db.update(cars).set({ color: 'red' })
   *   .where(eq(cars.color, 'green'));
   * // or
   * db.update(cars).set({ color: 'red' })
   *   .where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Update all BMW cars with a green color
   * db.update(cars).set({ color: 'red' })
   *   .where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Update all cars with the green or blue color
   * db.update(cars).set({ color: 'red' })
   *   .where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.table[drizzle_orm_table/* Table */.XI.Symbol.Columns],
          new selection_proxy/* SelectionProxyHandler */.b({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      this.config.orderBy = orderByArray;
    } else {
      const orderByArray = columns;
      this.config.orderBy = orderByArray;
    }
    return this;
  }
  limit(limit) {
    this.config.limit = limit;
    return this;
  }
  returning(fields = this.config.table[sqlite_core_table/* SQLiteTable */.jo.Symbol.Columns]) {
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
  _prepare(isOneTimeQuery = true) {
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      this.config.returning,
      this.config.returning ? "all" : "run",
      true,
      void 0,
      {
        type: "insert",
        tables: extractUsedTable(this.config.table)
      }
    );
  }
  prepare() {
    return this._prepare(false);
  }
  run = (placeholderValues) => {
    return this._prepare().run(placeholderValues);
  };
  all = (placeholderValues) => {
    return this._prepare().all(placeholderValues);
  };
  get = (placeholderValues) => {
    return this._prepare().get(placeholderValues);
  };
  values = (placeholderValues) => {
    return this._prepare().values(placeholderValues);
  };
  async execute() {
    return this.config.returning ? this.all() : this.run();
  }
  $dynamic() {
    return this;
  }
}

//# sourceMappingURL=update.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/query-builders/insert.js








class SQLiteInsertBuilder {
  constructor(table, session, dialect, withList) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
  }
  static [entity/* entityKind */.i] = "SQLiteInsertBuilder";
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
    return new SQLiteInsertBase(this.table, mappedValues, this.session, this.dialect, this.withList);
  }
  select(selectQuery) {
    const select = typeof selectQuery === "function" ? selectQuery(new QueryBuilder()) : selectQuery;
    if (!(0,entity.is)(select, sql/* SQL */.Xs) && !(0,utils/* haveSameKeys */.DV)(this.table[drizzle_orm_table/* Columns */.e], select._.selectedFields)) {
      throw new Error(
        "Insert select error: selected fields are not the same or are in a different order compared to the table definition"
      );
    }
    return new SQLiteInsertBase(this.table, select, this.session, this.dialect, this.withList, true);
  }
}
class SQLiteInsertBase extends query_promise/* QueryPromise */.k {
  constructor(table, values, session, dialect, withList, select) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { table, values, withList, select };
  }
  static [entity/* entityKind */.i] = "SQLiteInsert";
  /** @internal */
  config;
  returning(fields = this.config.table[sqlite_core_table/* SQLiteTable */.jo.Symbol.Columns]) {
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
    if (!this.config.onConflict) this.config.onConflict = [];
    if (config.target === void 0) {
      this.config.onConflict.push((0,sql/* sql */.ll)` on conflict do nothing`);
    } else {
      const targetSql = Array.isArray(config.target) ? (0,sql/* sql */.ll)`${config.target}` : (0,sql/* sql */.ll)`${[config.target]}`;
      const whereSql = config.where ? (0,sql/* sql */.ll)` where ${config.where}` : (0,sql/* sql */.ll)``;
      this.config.onConflict.push((0,sql/* sql */.ll)` on conflict ${targetSql} do nothing${whereSql}`);
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
   *     where: sql`${cars.createdAt} > '2023-01-01'::date`,
   *   });
   * ```
   */
  onConflictDoUpdate(config) {
    if (config.where && (config.targetWhere || config.setWhere)) {
      throw new Error(
        'You cannot use both "where" and "targetWhere"/"setWhere" at the same time - "where" is deprecated, use "targetWhere" or "setWhere" instead.'
      );
    }
    if (!this.config.onConflict) this.config.onConflict = [];
    const whereSql = config.where ? (0,sql/* sql */.ll)` where ${config.where}` : void 0;
    const targetWhereSql = config.targetWhere ? (0,sql/* sql */.ll)` where ${config.targetWhere}` : void 0;
    const setWhereSql = config.setWhere ? (0,sql/* sql */.ll)` where ${config.setWhere}` : void 0;
    const targetSql = Array.isArray(config.target) ? (0,sql/* sql */.ll)`${config.target}` : (0,sql/* sql */.ll)`${[config.target]}`;
    const setSql = this.dialect.buildUpdateSet(this.config.table, (0,utils/* mapUpdateSet */.q)(this.config.table, config.set));
    this.config.onConflict.push(
      (0,sql/* sql */.ll)` on conflict ${targetSql}${targetWhereSql} do update set ${setSql}${whereSql}${setWhereSql}`
    );
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
  _prepare(isOneTimeQuery = true) {
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      this.config.returning,
      this.config.returning ? "all" : "run",
      true,
      void 0,
      {
        type: "insert",
        tables: extractUsedTable(this.config.table)
      }
    );
  }
  prepare() {
    return this._prepare(false);
  }
  run = (placeholderValues) => {
    return this._prepare().run(placeholderValues);
  };
  all = (placeholderValues) => {
    return this._prepare().all(placeholderValues);
  };
  get = (placeholderValues) => {
    return this._prepare().get(placeholderValues);
  };
  values = (placeholderValues) => {
    return this._prepare().values(placeholderValues);
  };
  async execute() {
    return this.config.returning ? this.all() : this.run();
  }
  $dynamic() {
    return this;
  }
}

//# sourceMappingURL=insert.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/query-builders/delete.js







class SQLiteDeleteBase extends query_promise/* QueryPromise */.k {
  constructor(table, session, dialect, withList) {
    super();
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.config = { table, withList };
  }
  static [entity/* entityKind */.i] = "SQLiteDelete";
  /** @internal */
  config;
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
   * db.delete(cars).where(eq(cars.color, 'green'));
   * // or
   * db.delete(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Delete all BMW cars with a green color
   * db.delete(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Delete all cars with the green or blue color
   * db.delete(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.table[drizzle_orm_table/* Table */.XI.Symbol.Columns],
          new selection_proxy/* SelectionProxyHandler */.b({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      this.config.orderBy = orderByArray;
    } else {
      const orderByArray = columns;
      this.config.orderBy = orderByArray;
    }
    return this;
  }
  limit(limit) {
    this.config.limit = limit;
    return this;
  }
  returning(fields = this.table[sqlite_core_table/* SQLiteTable */.jo.Symbol.Columns]) {
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
  _prepare(isOneTimeQuery = true) {
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      this.config.returning,
      this.config.returning ? "all" : "run",
      true,
      void 0,
      {
        type: "delete",
        tables: extractUsedTable(this.config.table)
      }
    );
  }
  prepare() {
    return this._prepare(false);
  }
  run = (placeholderValues) => {
    return this._prepare().run(placeholderValues);
  };
  all = (placeholderValues) => {
    return this._prepare().all(placeholderValues);
  };
  get = (placeholderValues) => {
    return this._prepare().get(placeholderValues);
  };
  values = (placeholderValues) => {
    return this._prepare().values(placeholderValues);
  };
  async execute(placeholderValues) {
    return this._prepare().execute(placeholderValues);
  }
  $dynamic() {
    return this;
  }
}

//# sourceMappingURL=delete.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/query-builders/count.js


class SQLiteCountBuilder extends sql/* SQL */.Xs {
  constructor(params) {
    super(SQLiteCountBuilder.buildEmbeddedCount(params.source, params.filters).queryChunks);
    this.params = params;
    this.session = params.session;
    this.sql = SQLiteCountBuilder.buildCount(
      params.source,
      params.filters
    );
  }
  sql;
  static [entity/* entityKind */.i] = "SQLiteCountBuilderAsync";
  [Symbol.toStringTag] = "SQLiteCountBuilderAsync";
  session;
  static buildEmbeddedCount(source, filters) {
    return (0,sql/* sql */.ll)`(select count(*) from ${source}${sql/* sql */.ll.raw(" where ").if(filters)}${filters})`;
  }
  static buildCount(source, filters) {
    return (0,sql/* sql */.ll)`select count(*) from ${source}${sql/* sql */.ll.raw(" where ").if(filters)}${filters}`;
  }
  then(onfulfilled, onrejected) {
    return Promise.resolve(this.session.count(this.sql)).then(
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
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/query-builders/query.js



class RelationalQueryBuilder {
  constructor(mode, fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session) {
    this.mode = mode;
    this.fullSchema = fullSchema;
    this.schema = schema;
    this.tableNamesMap = tableNamesMap;
    this.table = table;
    this.tableConfig = tableConfig;
    this.dialect = dialect;
    this.session = session;
  }
  static [entity/* entityKind */.i] = "SQLiteAsyncRelationalQueryBuilder";
  findMany(config) {
    return this.mode === "sync" ? new SQLiteSyncRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? config : {},
      "many"
    ) : new SQLiteRelationalQuery(
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
    return this.mode === "sync" ? new SQLiteSyncRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? { ...config, limit: 1 } : { limit: 1 },
      "first"
    ) : new SQLiteRelationalQuery(
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
class SQLiteRelationalQuery extends query_promise/* QueryPromise */.k {
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
  static [entity/* entityKind */.i] = "SQLiteAsyncRelationalQuery";
  /** @internal */
  mode;
  /** @internal */
  getSQL() {
    return this.dialect.buildRelationalQuery({
      fullSchema: this.fullSchema,
      schema: this.schema,
      tableNamesMap: this.tableNamesMap,
      table: this.table,
      tableConfig: this.tableConfig,
      queryConfig: this.config,
      tableAlias: this.tableConfig.tsName
    }).sql;
  }
  /** @internal */
  _prepare(isOneTimeQuery = false) {
    const { query, builtQuery } = this._toSQL();
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      builtQuery,
      void 0,
      this.mode === "first" ? "get" : "all",
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
  }
  prepare() {
    return this._prepare(false);
  }
  _toSQL() {
    const query = this.dialect.buildRelationalQuery({
      fullSchema: this.fullSchema,
      schema: this.schema,
      tableNamesMap: this.tableNamesMap,
      table: this.table,
      tableConfig: this.tableConfig,
      queryConfig: this.config,
      tableAlias: this.tableConfig.tsName
    });
    const builtQuery = this.dialect.sqlToQuery(query.sql);
    return { query, builtQuery };
  }
  toSQL() {
    return this._toSQL().builtQuery;
  }
  /** @internal */
  executeRaw() {
    if (this.mode === "first") {
      return this._prepare(false).get();
    }
    return this._prepare(false).all();
  }
  async execute() {
    return this.executeRaw();
  }
}
class SQLiteSyncRelationalQuery extends SQLiteRelationalQuery {
  static [entity/* entityKind */.i] = "SQLiteSyncRelationalQuery";
  sync() {
    return this.executeRaw();
  }
}

//# sourceMappingURL=query.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/query-builders/raw.js


class SQLiteRaw extends query_promise/* QueryPromise */.k {
  constructor(execute, getSQL, action, dialect, mapBatchResult) {
    super();
    this.execute = execute;
    this.getSQL = getSQL;
    this.dialect = dialect;
    this.mapBatchResult = mapBatchResult;
    this.config = { action };
  }
  static [entity/* entityKind */.i] = "SQLiteRaw";
  /** @internal */
  config;
  getQuery() {
    return { ...this.dialect.sqlToQuery(this.getSQL()), method: this.config.action };
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
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/db.js








class BaseSQLiteDatabase {
  constructor(resultKind, dialect, session, schema) {
    this.resultKind = resultKind;
    this.dialect = dialect;
    this.session = session;
    this._ = schema ? {
      schema: schema.schema,
      fullSchema: schema.fullSchema,
      tableNamesMap: schema.tableNamesMap
    } : {
      schema: void 0,
      fullSchema: {},
      tableNamesMap: {}
    };
    this.query = {};
    const query = this.query;
    if (this._.schema) {
      for (const [tableName, columns] of Object.entries(this._.schema)) {
        query[tableName] = new RelationalQueryBuilder(
          resultKind,
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
  static [entity/* entityKind */.i] = "BaseSQLiteDatabase";
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
    return new SQLiteCountBuilder({ source, filters, session: this.session });
  }
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
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries
      });
    }
    function selectDistinct(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries,
        distinct: true
      });
    }
    function update(table) {
      return new SQLiteUpdateBuilder(table, self.session, self.dialect, queries);
    }
    function insert(into) {
      return new SQLiteInsertBuilder(into, self.session, self.dialect, queries);
    }
    function delete_(from) {
      return new SQLiteDeleteBase(from, self.session, self.dialect, queries);
    }
    return { select, selectDistinct, update, insert, delete: delete_ };
  }
  select(fields) {
    return new SQLiteSelectBuilder({ fields: fields ?? void 0, session: this.session, dialect: this.dialect });
  }
  selectDistinct(fields) {
    return new SQLiteSelectBuilder({
      fields: fields ?? void 0,
      session: this.session,
      dialect: this.dialect,
      distinct: true
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
    return new SQLiteUpdateBuilder(table, this.session, this.dialect);
  }
  $cache;
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
  insert(into) {
    return new SQLiteInsertBuilder(into, this.session, this.dialect);
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
  delete(from) {
    return new SQLiteDeleteBase(from, this.session, this.dialect);
  }
  run(query) {
    const sequel = typeof query === "string" ? sql/* sql */.ll.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.run(sequel),
        () => sequel,
        "run",
        this.dialect,
        this.session.extractRawRunValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.run(sequel);
  }
  all(query) {
    const sequel = typeof query === "string" ? sql/* sql */.ll.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.all(sequel),
        () => sequel,
        "all",
        this.dialect,
        this.session.extractRawAllValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.all(sequel);
  }
  get(query) {
    const sequel = typeof query === "string" ? sql/* sql */.ll.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.get(sequel),
        () => sequel,
        "get",
        this.dialect,
        this.session.extractRawGetValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.get(sequel);
  }
  values(query) {
    const sequel = typeof query === "string" ? sql/* sql */.ll.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.values(sequel),
        () => sequel,
        "values",
        this.dialect,
        this.session.extractRawValuesValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.values(sequel);
  }
  transaction(transaction, config) {
    return this.session.transaction(transaction, config);
  }
}
const withReplicas = (primary, replicas, getReplica = () => replicas[Math.floor(Math.random() * replicas.length)]) => {
  const select = (...args) => getReplica(replicas).select(...args);
  const selectDistinct = (...args) => getReplica(replicas).selectDistinct(...args);
  const $count = (...args) => getReplica(replicas).$count(...args);
  const $with = (...args) => getReplica(replicas).with(...args);
  const update = (...args) => primary.update(...args);
  const insert = (...args) => primary.insert(...args);
  const $delete = (...args) => primary.delete(...args);
  const run = (...args) => primary.run(...args);
  const all = (...args) => primary.all(...args);
  const get = (...args) => primary.get(...args);
  const values = (...args) => primary.values(...args);
  const transaction = (...args) => primary.transaction(...args);
  return {
    ...primary,
    update,
    insert,
    delete: $delete,
    run,
    all,
    get,
    values,
    transaction,
    $primary: primary,
    $replicas: replicas,
    select,
    selectDistinct,
    $count,
    with: $with,
    get query() {
      return getReplica(replicas).query;
    }
  };
};

//# sourceMappingURL=db.js.map
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/cache/core/cache.js
var cache = __webpack_require__(33324);
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/session.js





class ExecuteResultSync extends query_promise/* QueryPromise */.k {
  constructor(resultCb) {
    super();
    this.resultCb = resultCb;
  }
  static [entity/* entityKind */.i] = "ExecuteResultSync";
  async execute() {
    return this.resultCb();
  }
  sync() {
    return this.resultCb();
  }
}
class SQLitePreparedQuery {
  constructor(mode, executeMethod, query, cache, queryMetadata, cacheConfig) {
    this.mode = mode;
    this.executeMethod = executeMethod;
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
  static [entity/* entityKind */.i] = "PreparedQuery";
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
  getQuery() {
    return this.query;
  }
  mapRunResult(result, _isFromBatch) {
    return result;
  }
  mapAllResult(_result, _isFromBatch) {
    throw new Error("Not implemented");
  }
  mapGetResult(_result, _isFromBatch) {
    throw new Error("Not implemented");
  }
  execute(placeholderValues) {
    if (this.mode === "async") {
      return this[this.executeMethod](placeholderValues);
    }
    return new ExecuteResultSync(() => this[this.executeMethod](placeholderValues));
  }
  mapResult(response, isFromBatch) {
    switch (this.executeMethod) {
      case "run": {
        return this.mapRunResult(response, isFromBatch);
      }
      case "all": {
        return this.mapAllResult(response, isFromBatch);
      }
      case "get": {
        return this.mapGetResult(response, isFromBatch);
      }
    }
  }
}
class SQLiteSession {
  constructor(dialect) {
    this.dialect = dialect;
  }
  static [entity/* entityKind */.i] = "SQLiteSession";
  prepareOneTimeQuery(query, fields, executeMethod, isResponseInArrayMode, customResultMapper, queryMetadata, cacheConfig) {
    return this.prepareQuery(
      query,
      fields,
      executeMethod,
      isResponseInArrayMode,
      customResultMapper,
      queryMetadata,
      cacheConfig
    );
  }
  run(query) {
    const staticQuery = this.dialect.sqlToQuery(query);
    try {
      return this.prepareOneTimeQuery(staticQuery, void 0, "run", false).run();
    } catch (err) {
      throw new errors/* DrizzleError */.n9({ cause: err, message: `Failed to run the query '${staticQuery.sql}'` });
    }
  }
  /** @internal */
  extractRawRunValueFromBatchResult(result) {
    return result;
  }
  all(query) {
    return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).all();
  }
  /** @internal */
  extractRawAllValueFromBatchResult(_result) {
    throw new Error("Not implemented");
  }
  get(query) {
    return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).get();
  }
  /** @internal */
  extractRawGetValueFromBatchResult(_result) {
    throw new Error("Not implemented");
  }
  values(query) {
    return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).values();
  }
  async count(sql) {
    const result = await this.values(sql);
    return result[0][0];
  }
  /** @internal */
  extractRawValuesValueFromBatchResult(_result) {
    throw new Error("Not implemented");
  }
}
class SQLiteTransaction extends BaseSQLiteDatabase {
  constructor(resultType, dialect, session, schema, nestedIndex = 0) {
    super(resultType, dialect, session, schema);
    this.schema = schema;
    this.nestedIndex = nestedIndex;
  }
  static [entity/* entityKind */.i] = "SQLiteTransaction";
  rollback() {
    throw new errors/* TransactionRollbackError */.jY();
  }
}

//# sourceMappingURL=session.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-proxy/session.js







class SQLiteRemoteSession extends SQLiteSession {
  constructor(client, dialect, schema, batchCLient, options = {}) {
    super(dialect);
    this.client = client;
    this.schema = schema;
    this.batchCLient = batchCLient;
    this.logger = options.logger ?? new drizzle_orm_logger/* NoopLogger */.Pv();
    this.cache = options.cache ?? new cache/* NoopCache */.Th();
  }
  static [entity/* entityKind */.i] = "SQLiteRemoteSession";
  logger;
  cache;
  prepareQuery(query, fields, executeMethod, isResponseInArrayMode, customResultMapper, queryMetadata, cacheConfig) {
    return new RemotePreparedQuery(
      this.client,
      query,
      this.logger,
      this.cache,
      queryMetadata,
      cacheConfig,
      fields,
      executeMethod,
      isResponseInArrayMode,
      customResultMapper
    );
  }
  async batch(queries) {
    const preparedQueries = [];
    const builtQueries = [];
    for (const query of queries) {
      const preparedQuery = query._prepare();
      const builtQuery = preparedQuery.getQuery();
      preparedQueries.push(preparedQuery);
      builtQueries.push({ sql: builtQuery.sql, params: builtQuery.params, method: builtQuery.method });
    }
    const batchResults = await this.batchCLient(builtQueries);
    return batchResults.map((result, i) => preparedQueries[i].mapResult(result, true));
  }
  async transaction(transaction, config) {
    const tx = new SQLiteProxyTransaction("async", this.dialect, this, this.schema);
    await this.run(sql/* sql */.ll.raw(`begin${config?.behavior ? " " + config.behavior : ""}`));
    try {
      const result = await transaction(tx);
      await this.run((0,sql/* sql */.ll)`commit`);
      return result;
    } catch (err) {
      await this.run((0,sql/* sql */.ll)`rollback`);
      throw err;
    }
  }
  extractRawAllValueFromBatchResult(result) {
    return result.rows;
  }
  extractRawGetValueFromBatchResult(result) {
    return result.rows[0];
  }
  extractRawValuesValueFromBatchResult(result) {
    return result.rows;
  }
}
class SQLiteProxyTransaction extends SQLiteTransaction {
  static [entity/* entityKind */.i] = "SQLiteProxyTransaction";
  async transaction(transaction) {
    const savepointName = `sp${this.nestedIndex}`;
    const tx = new SQLiteProxyTransaction("async", this.dialect, this.session, this.schema, this.nestedIndex + 1);
    await this.session.run(sql/* sql */.ll.raw(`savepoint ${savepointName}`));
    try {
      const result = await transaction(tx);
      await this.session.run(sql/* sql */.ll.raw(`release savepoint ${savepointName}`));
      return result;
    } catch (err) {
      await this.session.run(sql/* sql */.ll.raw(`rollback to savepoint ${savepointName}`));
      throw err;
    }
  }
}
class RemotePreparedQuery extends SQLitePreparedQuery {
  constructor(client, query, logger, cache, queryMetadata, cacheConfig, fields, executeMethod, _isResponseInArrayMode, customResultMapper) {
    super("async", executeMethod, query, cache, queryMetadata, cacheConfig);
    this.client = client;
    this.logger = logger;
    this.fields = fields;
    this._isResponseInArrayMode = _isResponseInArrayMode;
    this.customResultMapper = customResultMapper;
    this.customResultMapper = customResultMapper;
    this.method = executeMethod;
  }
  static [entity/* entityKind */.i] = "SQLiteProxyPreparedQuery";
  method;
  getQuery() {
    return { ...this.query, method: this.method };
  }
  async run(placeholderValues) {
    const params = (0,sql/* fillPlaceholders */.Ct)(this.query.params, placeholderValues ?? {});
    this.logger.logQuery(this.query.sql, params);
    return await this.queryWithCache(this.query.sql, params, async () => {
      return await this.client(this.query.sql, params, "run");
    });
  }
  mapAllResult(rows, isFromBatch) {
    if (isFromBatch) {
      rows = rows.rows;
    }
    if (!this.fields && !this.customResultMapper) {
      return rows;
    }
    if (this.customResultMapper) {
      return this.customResultMapper(rows);
    }
    return rows.map((row) => {
      return (0,utils/* mapResultRow */.a6)(
        this.fields,
        row,
        this.joinsNotNullableMap
      );
    });
  }
  async all(placeholderValues) {
    const { query, logger, client } = this;
    const params = (0,sql/* fillPlaceholders */.Ct)(query.params, placeholderValues ?? {});
    logger.logQuery(query.sql, params);
    const { rows } = await this.queryWithCache(query.sql, params, async () => {
      return await client(query.sql, params, "all");
    });
    return this.mapAllResult(rows);
  }
  async get(placeholderValues) {
    const { query, logger, client } = this;
    const params = (0,sql/* fillPlaceholders */.Ct)(query.params, placeholderValues ?? {});
    logger.logQuery(query.sql, params);
    const clientResult = await this.queryWithCache(query.sql, params, async () => {
      return await client(query.sql, params, "get");
    });
    return this.mapGetResult(clientResult.rows);
  }
  mapGetResult(rows, isFromBatch) {
    if (isFromBatch) {
      rows = rows.rows;
    }
    const row = rows;
    if (!this.fields && !this.customResultMapper) {
      return row;
    }
    if (!row) {
      return void 0;
    }
    if (this.customResultMapper) {
      return this.customResultMapper([rows]);
    }
    return (0,utils/* mapResultRow */.a6)(
      this.fields,
      row,
      this.joinsNotNullableMap
    );
  }
  async values(placeholderValues) {
    const params = (0,sql/* fillPlaceholders */.Ct)(this.query.params, placeholderValues ?? {});
    this.logger.logQuery(this.query.sql, params);
    const clientResult = await this.queryWithCache(this.query.sql, params, async () => {
      return await this.client(this.query.sql, params, "values");
    });
    return clientResult.rows;
  }
  /** @internal */
  isResponseInArrayMode() {
    return this._isResponseInArrayMode;
  }
}

//# sourceMappingURL=session.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-proxy/driver.js






class SqliteRemoteDatabase extends BaseSQLiteDatabase {
  static [entity/* entityKind */.i] = "SqliteRemoteDatabase";
  async batch(batch) {
    return this.session.batch(batch);
  }
}
function drizzle(callback, batchCallback, config) {
  const dialect = new SQLiteAsyncDialect({ casing: config?.casing });
  let logger;
  let cache;
  let _batchCallback;
  let _config = {};
  if (batchCallback) {
    if (typeof batchCallback === "function") {
      _batchCallback = batchCallback;
      _config = config ?? {};
    } else {
      _batchCallback = void 0;
      _config = batchCallback;
    }
    if (_config.logger === true) {
      logger = new drizzle_orm_logger/* DefaultLogger */.w();
    } else if (_config.logger !== false) {
      logger = _config.logger;
      cache = _config.cache;
    }
  }
  let schema;
  if (_config.schema) {
    const tablesConfig = (0,relations/* extractTablesRelationalConfig */._k)(
      _config.schema,
      relations/* createTableRelationsHelpers */.DZ
    );
    schema = {
      fullSchema: _config.schema,
      schema: tablesConfig.tables,
      tableNamesMap: tablesConfig.tableNamesMap
    };
  }
  const session = new SQLiteRemoteSession(callback, dialect, schema, _batchCallback, { logger, cache });
  const db = new SqliteRemoteDatabase("async", dialect, session, schema);
  db.$cache = cache;
  if (db.$cache) {
    db.$cache["invalidate"] = cache?.onMutate;
  }
  return db;
}

//# sourceMappingURL=driver.js.map

/***/ })

};
