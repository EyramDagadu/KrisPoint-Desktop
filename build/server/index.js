import { Y as Ye$1, F, E as Ee, e as et$1, k as ke$1, a as kt$1, A as Ae$1, N as Ne$1, D as De, m as me, M as Mn, X as Xn, O as Oe, $ as $n, T as Te$1, P as Pe$1, y as ye, b as Fe, V, i as it$1, c as bn, p as p$1, v as v$1, C as Ce$1, I as Ie$1, _ as _e, d as Me, f as ve$1, R as Re$1, q, S as Se$1, s } from './chunks/index2-CY1CdFeX.js';
import { j as json, t as text, R as Redirect, S as SvelteKitError, H as HttpError, e as error, A as ActionFailure } from './chunks/index-Djsj11qr.js';
import { i as i$1, l as l$1, P, S, $, y as y$1, E as E$1, j as j$1, R, O as O$1, a as a$1, b as b$1, x, s as s$1, f as f$1 } from './chunks/utils-Ca-EoiSx.js';
import { x as x$1, z } from './chunks/index-DNKSM4PU.js';

/** @import { RequestEvent } from '@sveltejs/kit' */
/** @import { RequestStore } from 'types' */
/** @import { AsyncLocalStorage } from 'node:async_hooks' */

/** @type {RequestStore | null} */
let sync_store = null;

/** @type {AsyncLocalStorage<RequestStore | null> | null} */
let als;

import('node:async_hooks')
	.then((hooks) => (als = new hooks.AsyncLocalStorage()))
	.catch(() => {
		// can't use AsyncLocalStorage, but can still call getRequestEvent synchronously.
		// this isn't behind `supports` because it's basically just StackBlitz (i.e.
		// in-browser usage) that doesn't support it AFAICT
	});

/**
 * @template T
 * @param {RequestStore | null} store
 * @param {() => T} fn
 */
function with_request_store(store, fn) {
	try {
		sync_store = store;
		return als ? als.run(store, fn) : fn();
	} finally {
		sync_store = null;
	}
}

/**
 * @template {{ tracing: { enabled: boolean, root: import('@opentelemetry/api').Span, current: import('@opentelemetry/api').Span } }} T
 * @param {T} event_like
 * @param {import('@opentelemetry/api').Span} current
 * @returns {T}
 */
function merge_tracing(event_like, current) {
	return {
		...event_like,
		tracing: {
			...event_like.tracing,
			current
		}
	};
}

let e="",a=e;const i="_app",t={base:e,assets:a};function r(s){e=s.base,a=s.assets;}function o(){e=t.base,a=t.assets;}

/** @type {Record<string, string>} */
const escaped = {
	'<': '\\u003C',
	'\\': '\\\\',
	'\b': '\\b',
	'\f': '\\f',
	'\n': '\\n',
	'\r': '\\r',
	'\t': '\\t',
	'\u2028': '\\u2028',
	'\u2029': '\\u2029'
};

class DevalueError extends Error {
	/**
	 * @param {string} message
	 * @param {string[]} keys
	 */
	constructor(message, keys) {
		super(message);
		this.name = 'DevalueError';
		this.path = keys.join('');
	}
}

/** @param {any} thing */
function is_primitive(thing) {
	return Object(thing) !== thing;
}

const object_proto_names = /* @__PURE__ */ Object.getOwnPropertyNames(
	Object.prototype
)
	.sort()
	.join('\0');

/** @param {any} thing */
function is_plain_object(thing) {
	const proto = Object.getPrototypeOf(thing);

	return (
		proto === Object.prototype ||
		proto === null ||
		Object.getPrototypeOf(proto) === null ||
		Object.getOwnPropertyNames(proto).sort().join('\0') === object_proto_names
	);
}

/** @param {any} thing */
function get_type(thing) {
	return Object.prototype.toString.call(thing).slice(8, -1);
}

/** @param {string} char */
function get_escaped_char(char) {
	switch (char) {
		case '"':
			return '\\"';
		case '<':
			return '\\u003C';
		case '\\':
			return '\\\\';
		case '\n':
			return '\\n';
		case '\r':
			return '\\r';
		case '\t':
			return '\\t';
		case '\b':
			return '\\b';
		case '\f':
			return '\\f';
		case '\u2028':
			return '\\u2028';
		case '\u2029':
			return '\\u2029';
		default:
			return char < ' '
				? `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`
				: '';
	}
}

/** @param {string} str */
function stringify_string(str) {
	let result = '';
	let last_pos = 0;
	const len = str.length;

	for (let i = 0; i < len; i += 1) {
		const char = str[i];
		const replacement = get_escaped_char(char);
		if (replacement) {
			result += str.slice(last_pos, i) + replacement;
			last_pos = i + 1;
		}
	}

	return `"${last_pos === 0 ? str : result + str.slice(last_pos)}"`;
}

/** @param {Record<string | symbol, any>} object */
function enumerable_symbols(object) {
	return Object.getOwnPropertySymbols(object).filter(
		(symbol) => Object.getOwnPropertyDescriptor(object, symbol).enumerable
	);
}

const is_identifier = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/;

/** @param {string} key */
function stringify_key(key) {
	return is_identifier.test(key) ? '.' + key : '[' + JSON.stringify(key) + ']';
}

const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$';
const unsafe_chars = /[<\b\f\n\r\t\0\u2028\u2029]/g;
const reserved =
	/^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;

/**
 * Turn a value into the JavaScript that creates an equivalent value
 * @param {any} value
 * @param {(value: any) => string | void} [replacer]
 */
function uneval(value, replacer) {
	const counts = new Map();

	/** @type {string[]} */
	const keys = [];

	const custom = new Map();

	/** @param {any} thing */
	function walk(thing) {
		if (typeof thing === 'function') {
			throw new DevalueError(`Cannot stringify a function`, keys);
		}

		if (!is_primitive(thing)) {
			if (counts.has(thing)) {
				counts.set(thing, counts.get(thing) + 1);
				return;
			}

			counts.set(thing, 1);

			if (replacer) {
				const str = replacer(thing);

				if (typeof str === 'string') {
					custom.set(thing, str);
					return;
				}
			}

			const type = get_type(thing);

			switch (type) {
				case 'Number':
				case 'BigInt':
				case 'String':
				case 'Boolean':
				case 'Date':
				case 'RegExp':
				case 'URL':
				case 'URLSearchParams':
					return;

				case 'Array':
					/** @type {any[]} */ (thing).forEach((value, i) => {
						keys.push(`[${i}]`);
						walk(value);
						keys.pop();
					});
					break;

				case 'Set':
					Array.from(thing).forEach(walk);
					break;

				case 'Map':
					for (const [key, value] of thing) {
						keys.push(
							`.get(${is_primitive(key) ? stringify_primitive$1(key) : '...'})`
						);
						walk(value);
						keys.pop();
					}
					break;

				case 'Int8Array':
				case 'Uint8Array':
				case 'Uint8ClampedArray':
				case 'Int16Array':
				case 'Uint16Array':
				case 'Int32Array':
				case 'Uint32Array':
				case 'Float32Array':
				case 'Float64Array':
				case 'BigInt64Array':
				case 'BigUint64Array':
					walk(thing.buffer);
					return;

				case 'ArrayBuffer':
					return;

				case 'Temporal.Duration':
				case 'Temporal.Instant':
				case 'Temporal.PlainDate':
				case 'Temporal.PlainTime':
				case 'Temporal.PlainDateTime':
				case 'Temporal.PlainMonthDay':
				case 'Temporal.PlainYearMonth':
				case 'Temporal.ZonedDateTime':
					return;

				default:
					if (!is_plain_object(thing)) {
						throw new DevalueError(
							`Cannot stringify arbitrary non-POJOs`,
							keys
						);
					}

					if (enumerable_symbols(thing).length > 0) {
						throw new DevalueError(
							`Cannot stringify POJOs with symbolic keys`,
							keys
						);
					}

					for (const key in thing) {
						keys.push(stringify_key(key));
						walk(thing[key]);
						keys.pop();
					}
			}
		}
	}

	walk(value);

	const names = new Map();

	Array.from(counts)
		.filter((entry) => entry[1] > 1)
		.sort((a, b) => b[1] - a[1])
		.forEach((entry, i) => {
			names.set(entry[0], get_name(i));
		});

	/**
	 * @param {any} thing
	 * @returns {string}
	 */
	function stringify(thing) {
		if (names.has(thing)) {
			return names.get(thing);
		}

		if (is_primitive(thing)) {
			return stringify_primitive$1(thing);
		}

		if (custom.has(thing)) {
			return custom.get(thing);
		}

		const type = get_type(thing);

		switch (type) {
			case 'Number':
			case 'String':
			case 'Boolean':
				return `Object(${stringify(thing.valueOf())})`;

			case 'RegExp':
				return `new RegExp(${stringify_string(thing.source)}, "${
					thing.flags
				}")`;

			case 'Date':
				return `new Date(${thing.getTime()})`;

			case 'URL':
				return `new URL(${stringify_string(thing.toString())})`;

			case 'URLSearchParams':
				return `new URLSearchParams(${stringify_string(thing.toString())})`;

			case 'Array':
				const members = /** @type {any[]} */ (thing).map((v, i) =>
					i in thing ? stringify(v) : ''
				);
				const tail = thing.length === 0 || thing.length - 1 in thing ? '' : ',';
				return `[${members.join(',')}${tail}]`;

			case 'Set':
			case 'Map':
				return `new ${type}([${Array.from(thing).map(stringify).join(',')}])`;

			case 'Int8Array':
			case 'Uint8Array':
			case 'Uint8ClampedArray':
			case 'Int16Array':
			case 'Uint16Array':
			case 'Int32Array':
			case 'Uint32Array':
			case 'Float32Array':
			case 'Float64Array':
			case 'BigInt64Array':
			case 'BigUint64Array': {
				let str = `new ${type}`;

				if (counts.get(thing.buffer) === 1) {
					const array = new thing.constructor(thing.buffer);
					str += `([${array}])`;
				} else {
					str += `([${stringify(thing.buffer)}])`;
				}

				const a = thing.byteOffset;
				const b = a + thing.byteLength;

				// handle subarrays
				if (a > 0 || b !== thing.buffer.byteLength) {
					const m = +/(\d+)/.exec(type)[1] / 8;
					str += `.subarray(${a / m},${b / m})`;
				}

				return str;
			}

			case 'ArrayBuffer': {
				const ui8 = new Uint8Array(thing);
				return `new Uint8Array([${ui8.toString()}]).buffer`;
			}

			case 'Temporal.Duration':
			case 'Temporal.Instant':
			case 'Temporal.PlainDate':
			case 'Temporal.PlainTime':
			case 'Temporal.PlainDateTime':
			case 'Temporal.PlainMonthDay':
			case 'Temporal.PlainYearMonth':
			case 'Temporal.ZonedDateTime':
				return `${type}.from(${stringify_string(thing.toString())})`;

			default:
				const obj = `{${Object.keys(thing)
					.map((key) => `${safe_key(key)}:${stringify(thing[key])}`)
					.join(',')}}`;
				const proto = Object.getPrototypeOf(thing);
				if (proto === null) {
					return Object.keys(thing).length > 0
						? `Object.assign(Object.create(null),${obj})`
						: `Object.create(null)`;
				}

				return obj;
		}
	}

	const str = stringify(value);

	if (names.size) {
		/** @type {string[]} */
		const params = [];

		/** @type {string[]} */
		const statements = [];

		/** @type {string[]} */
		const values = [];

		names.forEach((name, thing) => {
			params.push(name);

			if (custom.has(thing)) {
				values.push(/** @type {string} */ (custom.get(thing)));
				return;
			}

			if (is_primitive(thing)) {
				values.push(stringify_primitive$1(thing));
				return;
			}

			const type = get_type(thing);

			switch (type) {
				case 'Number':
				case 'String':
				case 'Boolean':
					values.push(`Object(${stringify(thing.valueOf())})`);
					break;

				case 'RegExp':
					values.push(thing.toString());
					break;

				case 'Date':
					values.push(`new Date(${thing.getTime()})`);
					break;

				case 'Array':
					values.push(`Array(${thing.length})`);
					/** @type {any[]} */ (thing).forEach((v, i) => {
						statements.push(`${name}[${i}]=${stringify(v)}`);
					});
					break;

				case 'Set':
					values.push(`new Set`);
					statements.push(
						`${name}.${Array.from(thing)
							.map((v) => `add(${stringify(v)})`)
							.join('.')}`
					);
					break;

				case 'Map':
					values.push(`new Map`);
					statements.push(
						`${name}.${Array.from(thing)
							.map(([k, v]) => `set(${stringify(k)}, ${stringify(v)})`)
							.join('.')}`
					);
					break;

				case 'ArrayBuffer':
					values.push(
						`new Uint8Array([${new Uint8Array(thing).join(',')}]).buffer`
					);
					break;

				default:
					values.push(
						Object.getPrototypeOf(thing) === null ? 'Object.create(null)' : '{}'
					);
					Object.keys(thing).forEach((key) => {
						statements.push(
							`${name}${safe_prop(key)}=${stringify(thing[key])}`
						);
					});
			}
		});

		statements.push(`return ${str}`);

		return `(function(${params.join(',')}){${statements.join(
			';'
		)}}(${values.join(',')}))`;
	} else {
		return str;
	}
}

/** @param {number} num */
function get_name(num) {
	let name = '';

	do {
		name = chars[num % chars.length] + name;
		num = ~~(num / chars.length) - 1;
	} while (num >= 0);

	return reserved.test(name) ? `${name}0` : name;
}

/** @param {string} c */
function escape_unsafe_char(c) {
	return escaped[c] || c;
}

/** @param {string} str */
function escape_unsafe_chars(str) {
	return str.replace(unsafe_chars, escape_unsafe_char);
}

/** @param {string} key */
function safe_key(key) {
	return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key)
		? key
		: escape_unsafe_chars(JSON.stringify(key));
}

/** @param {string} key */
function safe_prop(key) {
	return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key)
		? `.${key}`
		: `[${escape_unsafe_chars(JSON.stringify(key))}]`;
}

/** @param {any} thing */
function stringify_primitive$1(thing) {
	if (typeof thing === 'string') return stringify_string(thing);
	if (thing === void 0) return 'void 0';
	if (thing === 0 && 1 / thing < 0) return '-0';
	const str = String(thing);
	if (typeof thing === 'number') return str.replace(/^(-)?0\./, '$1.');
	if (typeof thing === 'bigint') return thing + 'n';
	return str;
}

/**
 * Base64 Encodes an arraybuffer
 * @param {ArrayBuffer} arraybuffer
 * @returns {string}
 */
function encode64(arraybuffer) {
  const dv = new DataView(arraybuffer);
  let binaryString = "";

  for (let i = 0; i < arraybuffer.byteLength; i++) {
    binaryString += String.fromCharCode(dv.getUint8(i));
  }

  return binaryToAscii(binaryString);
}

/**
 * Decodes a base64 string into an arraybuffer
 * @param {string} string
 * @returns {ArrayBuffer}
 */
function decode64(string) {
  const binaryString = asciiToBinary(string);
  const arraybuffer = new ArrayBuffer(binaryString.length);
  const dv = new DataView(arraybuffer);

  for (let i = 0; i < arraybuffer.byteLength; i++) {
    dv.setUint8(i, binaryString.charCodeAt(i));
  }

  return arraybuffer;
}

const KEY_STRING =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/**
 * Substitute for atob since it's deprecated in node.
 * Does not do any input validation.
 *
 * @see https://github.com/jsdom/abab/blob/master/lib/atob.js
 *
 * @param {string} data
 * @returns {string}
 */
function asciiToBinary(data) {
  if (data.length % 4 === 0) {
    data = data.replace(/==?$/, "");
  }

  let output = "";
  let buffer = 0;
  let accumulatedBits = 0;

  for (let i = 0; i < data.length; i++) {
    buffer <<= 6;
    buffer |= KEY_STRING.indexOf(data[i]);
    accumulatedBits += 6;
    if (accumulatedBits === 24) {
      output += String.fromCharCode((buffer & 0xff0000) >> 16);
      output += String.fromCharCode((buffer & 0xff00) >> 8);
      output += String.fromCharCode(buffer & 0xff);
      buffer = accumulatedBits = 0;
    }
  }
  if (accumulatedBits === 12) {
    buffer >>= 4;
    output += String.fromCharCode(buffer);
  } else if (accumulatedBits === 18) {
    buffer >>= 2;
    output += String.fromCharCode((buffer & 0xff00) >> 8);
    output += String.fromCharCode(buffer & 0xff);
  }
  return output;
}

/**
 * Substitute for btoa since it's deprecated in node.
 * Does not do any input validation.
 *
 * @see https://github.com/jsdom/abab/blob/master/lib/btoa.js
 *
 * @param {string} str
 * @returns {string}
 */
function binaryToAscii(str) {
  let out = "";
  for (let i = 0; i < str.length; i += 3) {
    /** @type {[number, number, number, number]} */
    const groupsOfSix = [undefined, undefined, undefined, undefined];
    groupsOfSix[0] = str.charCodeAt(i) >> 2;
    groupsOfSix[1] = (str.charCodeAt(i) & 0x03) << 4;
    if (str.length > i + 1) {
      groupsOfSix[1] |= str.charCodeAt(i + 1) >> 4;
      groupsOfSix[2] = (str.charCodeAt(i + 1) & 0x0f) << 2;
    }
    if (str.length > i + 2) {
      groupsOfSix[2] |= str.charCodeAt(i + 2) >> 6;
      groupsOfSix[3] = str.charCodeAt(i + 2) & 0x3f;
    }
    for (let j = 0; j < groupsOfSix.length; j++) {
      if (typeof groupsOfSix[j] === "undefined") {
        out += "=";
      } else {
        out += KEY_STRING[groupsOfSix[j]];
      }
    }
  }
  return out;
}

const UNDEFINED = -1;
const HOLE = -2;
const NAN = -3;
const POSITIVE_INFINITY = -4;
const NEGATIVE_INFINITY = -5;
const NEGATIVE_ZERO = -6;

/**
 * Revive a value serialized with `devalue.stringify`
 * @param {string} serialized
 * @param {Record<string, (value: any) => any>} [revivers]
 */
function parse(serialized, revivers) {
	return unflatten(JSON.parse(serialized), revivers);
}

/**
 * Revive a value flattened with `devalue.stringify`
 * @param {number | any[]} parsed
 * @param {Record<string, (value: any) => any>} [revivers]
 */
function unflatten(parsed, revivers) {
	if (typeof parsed === 'number') return hydrate(parsed, true);

	if (!Array.isArray(parsed) || parsed.length === 0) {
		throw new Error('Invalid input');
	}

	const values = /** @type {any[]} */ (parsed);

	const hydrated = Array(values.length);

	/**
	 * @param {number} index
	 * @returns {any}
	 */
	function hydrate(index, standalone = false) {
		if (index === UNDEFINED) return undefined;
		if (index === NAN) return NaN;
		if (index === POSITIVE_INFINITY) return Infinity;
		if (index === NEGATIVE_INFINITY) return -Infinity;
		if (index === NEGATIVE_ZERO) return -0;

		if (standalone || typeof index !== 'number') {
			throw new Error(`Invalid input`);
		}

		if (index in hydrated) return hydrated[index];

		const value = values[index];

		if (!value || typeof value !== 'object') {
			hydrated[index] = value;
		} else if (Array.isArray(value)) {
			if (typeof value[0] === 'string') {
				const type = value[0];

				const reviver = revivers?.[type];
				if (reviver) {
					return (hydrated[index] = reviver(hydrate(value[1])));
				}

				switch (type) {
					case 'Date':
						hydrated[index] = new Date(value[1]);
						break;

					case 'Set':
						const set = new Set();
						hydrated[index] = set;
						for (let i = 1; i < value.length; i += 1) {
							set.add(hydrate(value[i]));
						}
						break;

					case 'Map':
						const map = new Map();
						hydrated[index] = map;
						for (let i = 1; i < value.length; i += 2) {
							map.set(hydrate(value[i]), hydrate(value[i + 1]));
						}
						break;

					case 'RegExp':
						hydrated[index] = new RegExp(value[1], value[2]);
						break;

					case 'Object':
						hydrated[index] = Object(value[1]);
						break;

					case 'BigInt':
						hydrated[index] = BigInt(value[1]);
						break;

					case 'null':
						const obj = Object.create(null);
						hydrated[index] = obj;
						for (let i = 1; i < value.length; i += 2) {
							obj[value[i]] = hydrate(value[i + 1]);
						}
						break;

					case 'Int8Array':
					case 'Uint8Array':
					case 'Uint8ClampedArray':
					case 'Int16Array':
					case 'Uint16Array':
					case 'Int32Array':
					case 'Uint32Array':
					case 'Float32Array':
					case 'Float64Array':
					case 'BigInt64Array':
					case 'BigUint64Array': {
						const TypedArrayConstructor = globalThis[type];
						const typedArray = new TypedArrayConstructor(hydrate(value[1]));

						hydrated[index] =
							value[2] !== undefined
								? typedArray.subarray(value[2], value[3])
								: typedArray;

						break;
					}

					case 'ArrayBuffer': {
						const base64 = value[1];
						const arraybuffer = decode64(base64);
						hydrated[index] = arraybuffer;
						break;
					}

					case 'Temporal.Duration':
					case 'Temporal.Instant':
					case 'Temporal.PlainDate':
					case 'Temporal.PlainTime':
					case 'Temporal.PlainDateTime':
					case 'Temporal.PlainMonthDay':
					case 'Temporal.PlainYearMonth':
					case 'Temporal.ZonedDateTime': {
						const temporalName = type.slice(9);
						// @ts-expect-error TS doesn't know about Temporal yet
						hydrated[index] = Temporal[temporalName].from(value[1]);
						break;
					}

					case 'URL': {
						const url = new URL(value[1]);
						hydrated[index] = url;
						break;
					}

					case 'URLSearchParams': {
						const url = new URLSearchParams(value[1]);
						hydrated[index] = url;
						break;
					}

					default:
						throw new Error(`Unknown type ${type}`);
				}
			} else {
				const array = new Array(value.length);
				hydrated[index] = array;

				for (let i = 0; i < value.length; i += 1) {
					const n = value[i];
					if (n === HOLE) continue;

					array[i] = hydrate(n);
				}
			}
		} else {
			/** @type {Record<string, any>} */
			const object = {};
			hydrated[index] = object;

			for (const key in value) {
				if (key === '__proto__') {
					throw new Error('Cannot parse an object with a `__proto__` property');
				}

				const n = value[key];
				object[key] = hydrate(n);
			}
		}

		return hydrated[index];
	}

	return hydrate(0);
}

/**
 * Turn a value into a JSON string that can be parsed with `devalue.parse`
 * @param {any} value
 * @param {Record<string, (value: any) => any>} [reducers]
 */
function stringify(value, reducers) {
	/** @type {any[]} */
	const stringified = [];

	/** @type {Map<any, number>} */
	const indexes = new Map();

	/** @type {Array<{ key: string, fn: (value: any) => any }>} */
	const custom = [];
	if (reducers) {
		for (const key of Object.getOwnPropertyNames(reducers)) {
			custom.push({ key, fn: reducers[key] });
		}
	}

	/** @type {string[]} */
	const keys = [];

	let p = 0;

	/** @param {any} thing */
	function flatten(thing) {
		if (typeof thing === 'function') {
			throw new DevalueError(`Cannot stringify a function`, keys);
		}

		if (thing === undefined) return UNDEFINED;
		if (Number.isNaN(thing)) return NAN;
		if (thing === Infinity) return POSITIVE_INFINITY;
		if (thing === -Infinity) return NEGATIVE_INFINITY;
		if (thing === 0 && 1 / thing < 0) return NEGATIVE_ZERO;

		if (indexes.has(thing)) return indexes.get(thing);

		const index = p++;
		indexes.set(thing, index);

		for (const { key, fn } of custom) {
			const value = fn(thing);
			if (value) {
				stringified[index] = `["${key}",${flatten(value)}]`;
				return index;
			}
		}

		let str = '';

		if (is_primitive(thing)) {
			str = stringify_primitive(thing);
		} else {
			const type = get_type(thing);

			switch (type) {
				case 'Number':
				case 'String':
				case 'Boolean':
					str = `["Object",${stringify_primitive(thing)}]`;
					break;

				case 'BigInt':
					str = `["BigInt",${thing}]`;
					break;

				case 'Date':
					const valid = !isNaN(thing.getDate());
					str = `["Date","${valid ? thing.toISOString() : ''}"]`;
					break;

				case 'URL':
					str = `["URL",${stringify_string(thing.toString())}]`;
					break;

				case 'URLSearchParams':
					str = `["URLSearchParams",${stringify_string(thing.toString())}]`;
					break;

				case 'RegExp':
					const { source, flags } = thing;
					str = flags
						? `["RegExp",${stringify_string(source)},"${flags}"]`
						: `["RegExp",${stringify_string(source)}]`;
					break;

				case 'Array':
					str = '[';

					for (let i = 0; i < thing.length; i += 1) {
						if (i > 0) str += ',';

						if (i in thing) {
							keys.push(`[${i}]`);
							str += flatten(thing[i]);
							keys.pop();
						} else {
							str += HOLE;
						}
					}

					str += ']';

					break;

				case 'Set':
					str = '["Set"';

					for (const value of thing) {
						str += `,${flatten(value)}`;
					}

					str += ']';
					break;

				case 'Map':
					str = '["Map"';

					for (const [key, value] of thing) {
						keys.push(
							`.get(${is_primitive(key) ? stringify_primitive(key) : '...'})`
						);
						str += `,${flatten(key)},${flatten(value)}`;
						keys.pop();
					}

					str += ']';
					break;

				case 'Int8Array':
				case 'Uint8Array':
				case 'Uint8ClampedArray':
				case 'Int16Array':
				case 'Uint16Array':
				case 'Int32Array':
				case 'Uint32Array':
				case 'Float32Array':
				case 'Float64Array':
				case 'BigInt64Array':
				case 'BigUint64Array': {
					/** @type {import("./types.js").TypedArray} */
					const typedArray = thing;
					str = '["' + type + '",' + flatten(typedArray.buffer);

					const a = thing.byteOffset;
					const b = a + thing.byteLength;

					// handle subarrays
					if (a > 0 || b !== typedArray.buffer.byteLength) {
						const m = +/(\d+)/.exec(type)[1] / 8;
						str += `,${a / m},${b / m}`;
					}

					str += ']';
					break;
				}

				case 'ArrayBuffer': {
					/** @type {ArrayBuffer} */
					const arraybuffer = thing;
					const base64 = encode64(arraybuffer);

					str = `["ArrayBuffer","${base64}"]`;
					break;
				}

				case 'Temporal.Duration':
				case 'Temporal.Instant':
				case 'Temporal.PlainDate':
				case 'Temporal.PlainTime':
				case 'Temporal.PlainDateTime':
				case 'Temporal.PlainMonthDay':
				case 'Temporal.PlainYearMonth':
				case 'Temporal.ZonedDateTime':
					str = `["${type}",${stringify_string(thing.toString())}]`;
					break;

				default:
					if (!is_plain_object(thing)) {
						throw new DevalueError(
							`Cannot stringify arbitrary non-POJOs`,
							keys
						);
					}

					if (enumerable_symbols(thing).length > 0) {
						throw new DevalueError(
							`Cannot stringify POJOs with symbolic keys`,
							keys
						);
					}

					if (Object.getPrototypeOf(thing) === null) {
						str = '["null"';
						for (const key in thing) {
							keys.push(stringify_key(key));
							str += `,${stringify_string(key)},${flatten(thing[key])}`;
							keys.pop();
						}
						str += ']';
					} else {
						str = '{';
						let started = false;
						for (const key in thing) {
							if (started) str += ',';
							started = true;
							keys.push(stringify_key(key));
							str += `${stringify_string(key)}:${flatten(thing[key])}`;
							keys.pop();
						}
						str += '}';
					}
			}
		}

		stringified[index] = str;
		return index;
	}

	const index = flatten(value);

	// special case — value is represented as a negative index
	if (index < 0) return `${index}`;

	return `[${stringified.join(',')}]`;
}

/**
 * @param {any} thing
 * @returns {string}
 */
function stringify_primitive(thing) {
	const type = typeof thing;
	if (type === 'string') return stringify_string(thing);
	if (thing instanceof String) return stringify_string(thing.toString());
	if (thing === void 0) return UNDEFINED.toString();
	if (thing === 0 && 1 / thing < 0) return NEGATIVE_ZERO.toString();
	if (type === 'bigint') return `["BigInt","${thing}"]`;
	return String(thing);
}

let lt$1={};function Ot$1(t){}function Ct$1(t){lt$1=t;}function M(t){console.warn("https://svelte.dev/e/hydration_mismatch");}let k=false;function y(t){k=t;}let _;function E(t){if(t===null)throw M(),Oe;return _=t}function ct$1(){return E(Xn(_))}const ut=["touchstart","touchmove"];function dt(t){return ut.includes(t)}const ft$1=new Set,N=new Set;let A=null;function b(t){var e=this,s=e.ownerDocument,i=t.type,a=t.composedPath?.()||[],n=a[0]||t.target;A=t;var r=0,o=A===t&&t.__root;if(o){var d=a.indexOf(o);if(d!==-1&&(e===document||e===window)){t.__root=e;return}var f=a.indexOf(e);if(f===-1)return;d<=f&&(r=d);}if(n=a[r]||t.target,n!==e){kt$1(t,"currentTarget",{configurable:true,get(){return n||s}});var h=v$1,c=p$1;V(null),it$1(null);try{for(var l,u=[];n!==null;){var p=n.assignedSlot||n.parentNode||n.host||null;try{var m=n["__"+i];if(m!=null&&(!n.disabled||t.target===n))if(bn(m)){var[q,...H]=m;q.apply(n,[t,...H]);}else m.call(n,t);}catch(g){l?u.push(g):l=g;}if(t.cancelBubble||p===e||p===null)break;n=p;}if(l){for(let g of u)queueMicrotask(()=>{throw g});throw l}}finally{t.__root=e,delete t.currentTarget,V(h),it$1(c);}}}function ht$1(t,e){var s=p$1;s.nodes_start===null&&(s.nodes_start=t,s.nodes_end=e);}function j(t,e){return I(t,e)}function mt$1(t,e){Ne$1(),e.intro=e.intro??false;const s=e.target,i=k,a=_;try{for(var n=De(s);n&&(n.nodeType!==me||n.data!==Mn);)n=Xn(n);if(!n)throw Oe;y(!0),E(n),ct$1();const r=I(t,{...e,anchor:n});if(_===null||_.nodeType!==me||_.data!==$n)throw M(),Oe;return y(!1),r}catch(r){if(r instanceof Error&&r.message.split(`
`).some(o=>o.startsWith("https://svelte.dev/e/")))throw r;return r!==Oe&&console.warn("Failed to hydrate: ",r),e.recover===false&&Te$1(),Ne$1(),Pe$1(s),y(false),j(t,e)}finally{y(i),E(a);}}const v=new Map;function I(t,{target:e,anchor:s,props:i={},events:a,context:n,intro:r=true}){Ne$1();var o=new Set,d=c=>{for(var l=0;l<c.length;l++){var u=c[l];if(!o.has(u)){o.add(u);var p=dt(u);e.addEventListener(u,b,{passive:p});var m=v.get(u);m===void 0?(document.addEventListener(u,b,{passive:p}),v.set(u,1)):v.set(u,m+1);}}};d(ye(ft$1)),N.add(d);var f=void 0,h=Fe(()=>{var c=s??e.appendChild(Ce$1());return Ie$1(()=>{if(n){Re$1({});var l=q;l.c=n;}a&&(i.$$events=a),k&&ht$1(c,null),f=t(c,i)||{},k&&(p$1.nodes_end=_),n&&Se$1();}),()=>{for(var l of o){e.removeEventListener(l,b);var u=v.get(l);--u===0?(document.removeEventListener(l,b),v.delete(l)):v.set(l,u);}N.delete(d),c!==s&&c.parentNode?.removeChild(c);}});return O.set(f,h),f}let O=new WeakMap;function _t$1(t,e){const s=O.get(t);return s?(O.delete(t),s(e)):Promise.resolve()}function pt$1(t){return class extends vt$1{constructor(e){super({component:t,...e});}}}let vt$1 = class vt{#e;#t;constructor(e){var s=new Map,i=(n,r)=>{var o=Ae$1(r,false,false);return s.set(n,o),o};const a=new Proxy({...e.props||{},$$events:{}},{get(n,r){return et$1(s.get(r)??i(r,Reflect.get(n,r)))},has(n,r){return r===Ee?true:(et$1(s.get(r)??i(r,Reflect.get(n,r))),Reflect.has(n,r))},set(n,r,o){return F(s.get(r)??i(r,o),o),Reflect.set(n,r,o)}});this.#t=(e.hydrate?mt$1:j)(e.component,{target:e.target,anchor:e.anchor,props:a,context:e.context,intro:e.intro??false,recover:e.recover}),(!e?.props?.$$host||e.sync===false)&&ke$1(),this.#e=a.$$events;for(const n of Object.keys(this.#t))n==="$set"||n==="$destroy"||n==="$on"||kt$1(this,n,{get(){return this.#t[n]},set(r){this.#t[n]=r;},enumerable:true});this.#t.$set=n=>{Object.assign(a,n);},this.#t.$destroy=()=>{_t$1(this.#t);};}$set(e){this.#t.$set(e);}$on(e,s){this.#e[e]=this.#e[e]||[];const i=(...a)=>s.call(this,...a);return this.#e[e].push(i),()=>{this.#e[e]=this.#e[e].filter(a=>a!==i);}}$destroy(){this.#t.$destroy();}};let gt$1=null;function Rt$1(t){gt$1=t;}function yt$1(t){const e=pt$1(t),s=(i,{context:a}={})=>{const n=Ye$1(t,{props:i,context:a});return {css:{code:"",map:null},head:n.head,html:n.body}};return e.render=s,e}function bt$1(t,e){_e();let{stores:s,page:i,constructors:a,components:n=[],form:r,data_0:o=null,data_1:d=null}=e;Me("__svelte__",s),s.page.set(i);const f=a[1];if(a[1]){t.out.push("<!--[-->");const h=a[0];t.out.push("<!---->"),h(t,{data:o,form:r,params:i.params,children:c=>{c.out.push("<!---->"),f(c,{data:d,form:r,params:i.params}),c.out.push("<!---->");},$$slots:{default:true}}),t.out.push("<!---->");}else {t.out.push("<!--[!-->");const h=a[0];t.out.push("<!---->"),h(t,{data:o,form:r,params:i.params}),t.out.push("<!---->");}t.out.push("<!--]--> "),t.out.push("<!--[!-->"),t.out.push("<!--]-->"),ve$1();}const wt$1=yt$1(bt$1),Pt$1={app_template_contains_nonce:false,csp:{mode:"auto",directives:{"upgrade-insecure-requests":false,"block-all-mixed-content":false},reportOnly:{"upgrade-insecure-requests":false,"block-all-mixed-content":false}},csrf_check_origin:false,csrf_trusted_origins:[],embedded:false,env_public_prefix:"PUBLIC_",env_private_prefix:"",hash_routing:false,hooks:null,preload_strategy:"modulepreload",root:wt$1,service_worker:false,service_worker_options:void 0,templates:{app:({head:t,body:e,assets:s,nonce:i,env:a})=>`<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<link rel="icon" href="`+s+`/favicon.png" />
		<link rel="apple-touch-icon" href="`+s+`/icons/icon-192.png" />
		<link rel="manifest" href="`+s+`/manifest.json" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<meta name="theme-color" content="#0066cc" />
		<meta name="apple-mobile-web-app-capable" content="yes" />
		<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
		<meta name="apple-mobile-web-app-title" content="KrisPoint" />
		`+t+`
	</head>
	<body data-sveltekit-preload-data="hover">
		<div style="display: contents">`+e+`</div>
		<script>
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.register('/service-worker.js');
			}
		<\/script>
	</body>
</html>
`,error:({status:t,message:e})=>`<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<title>`+e+`</title>

		<style>
			body {
				--bg: white;
				--fg: #222;
				--divider: #ccc;
				background: var(--bg);
				color: var(--fg);
				font-family:
					system-ui,
					-apple-system,
					BlinkMacSystemFont,
					'Segoe UI',
					Roboto,
					Oxygen,
					Ubuntu,
					Cantarell,
					'Open Sans',
					'Helvetica Neue',
					sans-serif;
				display: flex;
				align-items: center;
				justify-content: center;
				height: 100vh;
				margin: 0;
			}

			.error {
				display: flex;
				align-items: center;
				max-width: 32rem;
				margin: 0 1rem;
			}

			.status {
				font-weight: 200;
				font-size: 3rem;
				line-height: 1;
				position: relative;
				top: -0.05rem;
			}

			.message {
				border-left: 1px solid var(--divider);
				padding: 0 0 0 1rem;
				margin: 0 0 0 1rem;
				min-height: 2.5rem;
				display: flex;
				align-items: center;
			}

			.message h1 {
				font-weight: 400;
				font-size: 1em;
				margin: 0;
			}

			@media (prefers-color-scheme: dark) {
				body {
					--bg: #222;
					--fg: #ddd;
					--divider: #666;
				}
			}
		</style>
	</head>
	<body>
		<div class="error">
			<span class="status">`+t+`</span>
			<div class="message">
				<h1>`+e+`</h1>
			</div>
		</div>
	</body>
</html>
`},version_hash:"a2llq4"};async function Tt$1(){let t,e,s,i,a;return {handle:t,handleFetch:e,handleError:s,handleValidationError:i,init:a}=await import('./chunks/hooks.server-MTh-ngQN.js'),{handle:t,handleFetch:e,handleError:s,handleValidationError:i,init:a,reroute:void 0,transport:void 0}}

const f="x-sveltekit-invalidated",p="x-sveltekit-trailing-slash";function l(e,t){const r=Object.fromEntries(Object.entries(t).map(([n,s])=>[n,s.encode]));return stringify(e,r)}function u(e,t){if(!e)return;const r=i$1.decode(l$1(e.replaceAll("-","+").replaceAll("_","/"))),n=Object.fromEntries(Object.entries(t).map(([s,o])=>[s,o.decode]));return parse(r,n)}

var cookie = {};

/*!
 * cookie
 * Copyright(c) 2012-2014 Roman Shtylman
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */

var hasRequiredCookie;

function requireCookie () {
	if (hasRequiredCookie) return cookie;
	hasRequiredCookie = 1;

	/**
	 * Module exports.
	 * @public
	 */

	cookie.parse = parse;
	cookie.serialize = serialize;

	/**
	 * Module variables.
	 * @private
	 */

	var __toString = Object.prototype.toString;

	/**
	 * RegExp to match field-content in RFC 7230 sec 3.2
	 *
	 * field-content = field-vchar [ 1*( SP / HTAB ) field-vchar ]
	 * field-vchar   = VCHAR / obs-text
	 * obs-text      = %x80-FF
	 */

	var fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;

	/**
	 * Parse a cookie header.
	 *
	 * Parse the given cookie header string into an object
	 * The object has the various cookies as keys(names) => values
	 *
	 * @param {string} str
	 * @param {object} [options]
	 * @return {object}
	 * @public
	 */

	function parse(str, options) {
	  if (typeof str !== 'string') {
	    throw new TypeError('argument str must be a string');
	  }

	  var obj = {};
	  var opt = options || {};
	  var dec = opt.decode || decode;

	  var index = 0;
	  while (index < str.length) {
	    var eqIdx = str.indexOf('=', index);

	    // no more cookie pairs
	    if (eqIdx === -1) {
	      break
	    }

	    var endIdx = str.indexOf(';', index);

	    if (endIdx === -1) {
	      endIdx = str.length;
	    } else if (endIdx < eqIdx) {
	      // backtrack on prior semicolon
	      index = str.lastIndexOf(';', eqIdx - 1) + 1;
	      continue
	    }

	    var key = str.slice(index, eqIdx).trim();

	    // only assign once
	    if (undefined === obj[key]) {
	      var val = str.slice(eqIdx + 1, endIdx).trim();

	      // quoted values
	      if (val.charCodeAt(0) === 0x22) {
	        val = val.slice(1, -1);
	      }

	      obj[key] = tryDecode(val, dec);
	    }

	    index = endIdx + 1;
	  }

	  return obj;
	}

	/**
	 * Serialize data into a cookie header.
	 *
	 * Serialize the a name value pair into a cookie string suitable for
	 * http headers. An optional options object specified cookie parameters.
	 *
	 * serialize('foo', 'bar', { httpOnly: true })
	 *   => "foo=bar; httpOnly"
	 *
	 * @param {string} name
	 * @param {string} val
	 * @param {object} [options]
	 * @return {string}
	 * @public
	 */

	function serialize(name, val, options) {
	  var opt = options || {};
	  var enc = opt.encode || encode;

	  if (typeof enc !== 'function') {
	    throw new TypeError('option encode is invalid');
	  }

	  if (!fieldContentRegExp.test(name)) {
	    throw new TypeError('argument name is invalid');
	  }

	  var value = enc(val);

	  if (value && !fieldContentRegExp.test(value)) {
	    throw new TypeError('argument val is invalid');
	  }

	  var str = name + '=' + value;

	  if (null != opt.maxAge) {
	    var maxAge = opt.maxAge - 0;

	    if (isNaN(maxAge) || !isFinite(maxAge)) {
	      throw new TypeError('option maxAge is invalid')
	    }

	    str += '; Max-Age=' + Math.floor(maxAge);
	  }

	  if (opt.domain) {
	    if (!fieldContentRegExp.test(opt.domain)) {
	      throw new TypeError('option domain is invalid');
	    }

	    str += '; Domain=' + opt.domain;
	  }

	  if (opt.path) {
	    if (!fieldContentRegExp.test(opt.path)) {
	      throw new TypeError('option path is invalid');
	    }

	    str += '; Path=' + opt.path;
	  }

	  if (opt.expires) {
	    var expires = opt.expires;

	    if (!isDate(expires) || isNaN(expires.valueOf())) {
	      throw new TypeError('option expires is invalid');
	    }

	    str += '; Expires=' + expires.toUTCString();
	  }

	  if (opt.httpOnly) {
	    str += '; HttpOnly';
	  }

	  if (opt.secure) {
	    str += '; Secure';
	  }

	  if (opt.partitioned) {
	    str += '; Partitioned';
	  }

	  if (opt.priority) {
	    var priority = typeof opt.priority === 'string'
	      ? opt.priority.toLowerCase()
	      : opt.priority;

	    switch (priority) {
	      case 'low':
	        str += '; Priority=Low';
	        break
	      case 'medium':
	        str += '; Priority=Medium';
	        break
	      case 'high':
	        str += '; Priority=High';
	        break
	      default:
	        throw new TypeError('option priority is invalid')
	    }
	  }

	  if (opt.sameSite) {
	    var sameSite = typeof opt.sameSite === 'string'
	      ? opt.sameSite.toLowerCase() : opt.sameSite;

	    switch (sameSite) {
	      case true:
	        str += '; SameSite=Strict';
	        break;
	      case 'lax':
	        str += '; SameSite=Lax';
	        break;
	      case 'strict':
	        str += '; SameSite=Strict';
	        break;
	      case 'none':
	        str += '; SameSite=None';
	        break;
	      default:
	        throw new TypeError('option sameSite is invalid');
	    }
	  }

	  return str;
	}

	/**
	 * URL-decode string value. Optimized to skip native call when no %.
	 *
	 * @param {string} str
	 * @returns {string}
	 */

	function decode (str) {
	  return str.indexOf('%') !== -1
	    ? decodeURIComponent(str)
	    : str
	}

	/**
	 * URL-encode value.
	 *
	 * @param {string} val
	 * @returns {string}
	 */

	function encode (val) {
	  return encodeURIComponent(val)
	}

	/**
	 * Determine if value is a Date.
	 *
	 * @param {*} val
	 * @private
	 */

	function isDate (val) {
	  return __toString.call(val) === '[object Date]' ||
	    val instanceof Date
	}

	/**
	 * Try decoding a string using a decoding function.
	 *
	 * @param {string} str
	 * @param {function} decode
	 * @private
	 */

	function tryDecode(str, decode) {
	  try {
	    return decode(str);
	  } catch (e) {
	    return str;
	  }
	}
	return cookie;
}

var cookieExports = requireCookie();

var setCookie = {exports: {}};

var hasRequiredSetCookie;

function requireSetCookie () {
	if (hasRequiredSetCookie) return setCookie.exports;
	hasRequiredSetCookie = 1;

	var defaultParseOptions = {
	  decodeValues: true,
	  map: false,
	  silent: false,
	};

	function isNonEmptyString(str) {
	  return typeof str === "string" && !!str.trim();
	}

	function parseString(setCookieValue, options) {
	  var parts = setCookieValue.split(";").filter(isNonEmptyString);

	  var nameValuePairStr = parts.shift();
	  var parsed = parseNameValuePair(nameValuePairStr);
	  var name = parsed.name;
	  var value = parsed.value;

	  options = options
	    ? Object.assign({}, defaultParseOptions, options)
	    : defaultParseOptions;

	  try {
	    value = options.decodeValues ? decodeURIComponent(value) : value; // decode cookie value
	  } catch (e) {
	    console.error(
	      "set-cookie-parser encountered an error while decoding a cookie with value '" +
	        value +
	        "'. Set options.decodeValues to false to disable this feature.",
	      e
	    );
	  }

	  var cookie = {
	    name: name,
	    value: value,
	  };

	  parts.forEach(function (part) {
	    var sides = part.split("=");
	    var key = sides.shift().trimLeft().toLowerCase();
	    var value = sides.join("=");
	    if (key === "expires") {
	      cookie.expires = new Date(value);
	    } else if (key === "max-age") {
	      cookie.maxAge = parseInt(value, 10);
	    } else if (key === "secure") {
	      cookie.secure = true;
	    } else if (key === "httponly") {
	      cookie.httpOnly = true;
	    } else if (key === "samesite") {
	      cookie.sameSite = value;
	    } else if (key === "partitioned") {
	      cookie.partitioned = true;
	    } else {
	      cookie[key] = value;
	    }
	  });

	  return cookie;
	}

	function parseNameValuePair(nameValuePairStr) {
	  // Parses name-value-pair according to rfc6265bis draft

	  var name = "";
	  var value = "";
	  var nameValueArr = nameValuePairStr.split("=");
	  if (nameValueArr.length > 1) {
	    name = nameValueArr.shift();
	    value = nameValueArr.join("="); // everything after the first =, joined by a "=" if there was more than one part
	  } else {
	    value = nameValuePairStr;
	  }

	  return { name: name, value: value };
	}

	function parse(input, options) {
	  options = options
	    ? Object.assign({}, defaultParseOptions, options)
	    : defaultParseOptions;

	  if (!input) {
	    if (!options.map) {
	      return [];
	    } else {
	      return {};
	    }
	  }

	  if (input.headers) {
	    if (typeof input.headers.getSetCookie === "function") {
	      // for fetch responses - they combine headers of the same type in the headers array,
	      // but getSetCookie returns an uncombined array
	      input = input.headers.getSetCookie();
	    } else if (input.headers["set-cookie"]) {
	      // fast-path for node.js (which automatically normalizes header names to lower-case
	      input = input.headers["set-cookie"];
	    } else {
	      // slow-path for other environments - see #25
	      var sch =
	        input.headers[
	          Object.keys(input.headers).find(function (key) {
	            return key.toLowerCase() === "set-cookie";
	          })
	        ];
	      // warn if called on a request-like object with a cookie header rather than a set-cookie header - see #34, 36
	      if (!sch && input.headers.cookie && !options.silent) {
	        console.warn(
	          "Warning: set-cookie-parser appears to have been called on a request object. It is designed to parse Set-Cookie headers from responses, not Cookie headers from requests. Set the option {silent: true} to suppress this warning."
	        );
	      }
	      input = sch;
	    }
	  }
	  if (!Array.isArray(input)) {
	    input = [input];
	  }

	  if (!options.map) {
	    return input.filter(isNonEmptyString).map(function (str) {
	      return parseString(str, options);
	    });
	  } else {
	    var cookies = {};
	    return input.filter(isNonEmptyString).reduce(function (cookies, str) {
	      var cookie = parseString(str, options);
	      cookies[cookie.name] = cookie;
	      return cookies;
	    }, cookies);
	  }
	}

	/*
	  Set-Cookie header field-values are sometimes comma joined in one string. This splits them without choking on commas
	  that are within a single set-cookie field-value, such as in the Expires portion.

	  This is uncommon, but explicitly allowed - see https://tools.ietf.org/html/rfc2616#section-4.2
	  Node.js does this for every header *except* set-cookie - see https://github.com/nodejs/node/blob/d5e363b77ebaf1caf67cd7528224b651c86815c1/lib/_http_incoming.js#L128
	  React Native's fetch does this for *every* header, including set-cookie.

	  Based on: https://github.com/google/j2objc/commit/16820fdbc8f76ca0c33472810ce0cb03d20efe25
	  Credits to: https://github.com/tomball for original and https://github.com/chrusart for JavaScript implementation
	*/
	function splitCookiesString(cookiesString) {
	  if (Array.isArray(cookiesString)) {
	    return cookiesString;
	  }
	  if (typeof cookiesString !== "string") {
	    return [];
	  }

	  var cookiesStrings = [];
	  var pos = 0;
	  var start;
	  var ch;
	  var lastComma;
	  var nextStart;
	  var cookiesSeparatorFound;

	  function skipWhitespace() {
	    while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))) {
	      pos += 1;
	    }
	    return pos < cookiesString.length;
	  }

	  function notSpecialChar() {
	    ch = cookiesString.charAt(pos);

	    return ch !== "=" && ch !== ";" && ch !== ",";
	  }

	  while (pos < cookiesString.length) {
	    start = pos;
	    cookiesSeparatorFound = false;

	    while (skipWhitespace()) {
	      ch = cookiesString.charAt(pos);
	      if (ch === ",") {
	        // ',' is a cookie separator if we have later first '=', not ';' or ','
	        lastComma = pos;
	        pos += 1;

	        skipWhitespace();
	        nextStart = pos;

	        while (pos < cookiesString.length && notSpecialChar()) {
	          pos += 1;
	        }

	        // currently special character
	        if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
	          // we found cookies separator
	          cookiesSeparatorFound = true;
	          // pos is inside the next cookie, so back up and return it.
	          pos = nextStart;
	          cookiesStrings.push(cookiesString.substring(start, lastComma));
	          start = pos;
	        } else {
	          // in param ',' or param separator ';',
	          // we continue from that comma
	          pos = lastComma + 1;
	        }
	      } else {
	        pos += 1;
	      }
	    }

	    if (!cookiesSeparatorFound || pos >= cookiesString.length) {
	      cookiesStrings.push(cookiesString.substring(start, cookiesString.length));
	    }
	  }

	  return cookiesStrings;
	}

	setCookie.exports = parse;
	setCookie.exports.parse = parse;
	setCookie.exports.parseString = parseString;
	setCookie.exports.splitCookiesString = splitCookiesString;
	return setCookie.exports;
}

var setCookieExports = /*@__PURE__*/ requireSetCookie();

const nr="/_svelte_kit_assets",ft=["GET","POST","PUT","PATCH","DELETE","OPTIONS","HEAD"],sr=["GET","POST","HEAD"];function qe(e,t){const r=[];e.split(",").forEach((a,o)=>{const i=/([^/ \t]+)\/([^; \t]+)[ \t]*(?:;[ \t]*q=([0-9.]+))?/.exec(a);if(i){const[,c,d,l="1"]=i;r.push({type:c,subtype:d,q:+l,i:o});}}),r.sort((a,o)=>a.q!==o.q?o.q-a.q:a.subtype==="*"!=(o.subtype==="*")?a.subtype==="*"?1:-1:a.type==="*"!=(o.type==="*")?a.type==="*"?1:-1:a.i-o.i);let n,s=1/0;for(const a of t){const[o,i]=a.split("/"),c=r.findIndex(d=>(d.type===o||d.type==="*")&&(d.subtype===i||d.subtype==="*"));c!==-1&&c<s&&(n=a,s=c);}return n}function ar(e,...t){const r=e.headers.get("content-type")?.split(";",1)[0].trim()??"";return t.includes(r.toLowerCase())}function Pe(e){return ar(e,"application/x-www-form-urlencoded","multipart/form-data","text/plain")}function or(e){return e instanceof Error||e&&e.name&&e.message?e:new Error(JSON.stringify(e))}function ne(e){return e instanceof HttpError||e instanceof SvelteKitError?e.status:500}function ir(e){return e instanceof SvelteKitError?e.text:"Internal Error"}const pt={"&":"&amp;",'"':"&quot;"},ht={"&":"&amp;","<":"&lt;"},_t="[\\ud800-\\udbff](?![\\udc00-\\udfff])|[\\ud800-\\udbff][\\udc00-\\udfff]|[\\udc00-\\udfff]",cr=new RegExp(`[${Object.keys(pt).join("")}]|`+_t,"g"),lr=new RegExp(`[${Object.keys(ht).join("")}]|`+_t,"g");function ze(e,t){const r=t?pt:ht;return e.replace(t?cr:lr,s=>s.length===2?s:r[s]??`&#${s.charCodeAt(0)};`)}function mt(e,t){return text(`${t} method not allowed`,{status:405,headers:{allow:dr(e).join(", ")}})}function dr(e){const t=ft.filter(r=>r in e);return ("GET"in e||"HEAD"in e)&&t.push("HEAD"),t}function yt(e){return `__sveltekit_${e.version_hash}`}function fe(e,t,r){let n=e.templates.error({status:t,message:ze(r)});return text(n,{headers:{"content-type":"text/html; charset=utf-8"},status:t})}async function Ye(e,t,r,n){n=n instanceof HttpError?n:or(n);const s=ne(n),a=await L(e,t,r,n),o=qe(e.request.headers.get("accept")||"text/html",["application/json","text/html"]);return e.isDataRequest||o==="application/json"?json(a,{status:s}):fe(r,s,a.message)}async function L(e,t,r,n){if(n instanceof HttpError)return {message:"Unknown Error",...n.body};const s=ne(n),a=ir(n);return await with_request_store({event:e,state:t},()=>r.hooks.handleError({error:n,event:e,status:s,message:a}))??{message:a}}function pe(e,t){return new Response(void 0,{status:e,headers:{location:t}})}function gt(e,t){return t.path?`Data returned from \`load\` while rendering ${e.route.id} is not serializable: ${t.message} (${t.path}). If you need to serialize/deserialize custom types, use transport hooks: https://svelte.dev/docs/kit/hooks#Universal-hooks-transport.`:t.path===""?`Data returned from \`load\` while rendering ${e.route.id} is not a plain object`:t.message}function wt(e){const t={};return e.uses&&e.uses.dependencies.size>0&&(t.dependencies=Array.from(e.uses.dependencies)),e.uses&&e.uses.search_params.size>0&&(t.search_params=Array.from(e.uses.search_params)),e.uses&&e.uses.params.size>0&&(t.params=Array.from(e.uses.params)),e.uses?.parent&&(t.parent=1),e.uses?.route&&(t.route=1),e.uses?.url&&(t.url=1),t}function bt(e,t){return e._.prerendered_routes.has(t)||t.at(-1)==="/"&&e._.prerendered_routes.has(t.slice(0,-1))}function ur(e,t,r){const n=`
\x1B[1;31m[${e}] ${r.request.method} ${r.url.pathname}\x1B[0m`;return e===404?n:`${n}
${t.stack}`}function kt(e){const r=e?.split("/")?.at(-1);return r?r.split(".").slice(0,-1).join("."):"unknown"}async function fr(e,t,r,n){const s=e.request.method;let a=r[s]||r.fallback;if(s==="HEAD"&&!r.HEAD&&r.GET&&(a=r.GET),!a)return mt(r,s);const o=r.prerender??n.prerender_default;if(o&&(r.POST||r.PATCH||r.PUT||r.DELETE))throw new Error("Cannot prerender endpoints that have mutative methods");if(n.prerendering&&!n.prerendering.inside_reroute&&!o){if(n.depth>0)throw new Error(`${e.route.id} is not prerenderable`);return new Response(void 0,{status:204})}try{const i=await with_request_store({event:e,state:t},()=>a(e));if(!(i instanceof Response))throw new Error(`Invalid response from route ${e.url.pathname}: handler should return a Response object`);if(n.prerendering&&(!n.prerendering.inside_reroute||o)){const c=new Response(i.clone().body,{status:i.status,statusText:i.statusText,headers:new Headers(i.headers)});if(c.headers.set("x-sveltekit-prerender",String(o)),n.prerendering.inside_reroute&&o)c.headers.set("x-sveltekit-routeid",encodeURI(e.route.id)),n.prerendering.dependencies.set(e.url.pathname,{response:c,body:null});else return c}return i}catch(i){if(i instanceof Redirect)return new Response(void 0,{status:i.status,headers:{location:i.location}});throw i}}function pr(e){const{method:t,headers:r}=e.request;if(ft.includes(t)&&!sr.includes(t))return  true;if(t==="POST"&&r.get("x-sveltekit-action")==="true")return  false;const n=e.request.headers.get("accept")??"*/*";return qe(n,["*","text/html"])!=="text/html"}function Qe(e){return e.filter(t=>t!=null)}const Ce="/__data.json",he=".html__data.json";function hr(e){return e.endsWith(Ce)||e.endsWith(he)}function Ue(e){return e.endsWith(".html")?e.replace(/\.html$/,he):e.replace(/\/$/,"")+Ce}function _r(e){return e.endsWith(he)?e.slice(0,-he.length)+".html":e.slice(0,-Ce.length)}const He="/__route.js";function mr(e){return e.endsWith(He)}function $t(e){return e.replace(/\/$/,"")+He}function yr(e){return e.slice(0,-He.length)}const gr={spanContext(){return wr},setAttribute(){return this},setAttributes(){return this},addEvent(){return this},setStatus(){return this},updateName(){return this},end(){return this},isRecording(){return  false},recordException(){return this},addLink(){return this},addLinks(){return this}},wr={traceId:"",spanId:"",traceFlags:0};async function Q({name:e,attributes:t,fn:r}){return r(gr)}function vt(e){return qe(e.request.headers.get("accept")??"*/*",["application/json","text/html"])==="application/json"&&e.request.method==="POST"}async function br(e,t,r,n){const s=n?.actions;if(!s){const a=new SvelteKitError(405,"Method Not Allowed","POST method not allowed. No form actions exist for this page");return ae({type:"error",error:await L(e,t,r,a)},{status:a.status,headers:{allow:"GET"}})}Et(s);try{const a=await jt(e,t,s);return a instanceof ActionFailure?ae({type:"failure",status:a.status,data:Ze(a.data,e.route.id,r.hooks.transport)}):ae({type:"success",status:a?200:204,data:Ze(a,e.route.id,r.hooks.transport)})}catch(a){const o=a;return o instanceof Redirect?xt(o):ae({type:"error",error:await L(e,t,r,Ne(o))},{status:ne(o)})}}function Ne(e){return e instanceof ActionFailure?new Error('Cannot "throw fail()". Use "return fail()"'):e}function xt(e){return ae({type:"redirect",status:e.status,location:e.location})}function ae(e,t){return json(e,t)}function kr(e){return e.request.method==="POST"}async function $r(e,t,r){const n=r?.actions;if(!n)return e.setHeaders({allow:"GET"}),{type:"error",error:new SvelteKitError(405,"Method Not Allowed","POST method not allowed. No form actions exist for this page")};Et(n);try{const s=await jt(e,t,n);return s instanceof ActionFailure?{type:"failure",status:s.status,data:s.data}:{type:"success",status:200,data:s}}catch(s){const a=s;return a instanceof Redirect?{type:"redirect",status:a.status,location:a.location}:{type:"error",error:Ne(a)}}}function Et(e){if(e.default&&Object.keys(e).length>1)throw new Error("When using named actions, the default action cannot be used. See the docs for more info: https://svelte.dev/docs/kit/form-actions#named-actions")}async function jt(e,t,r){const n=new URL(e.request.url);let s="default";for(const o of n.searchParams)if(o[0].startsWith("/")){if(s=o[0].slice(1),s==="default")throw new Error('Cannot use reserved action name "default"');break}const a=r[s];if(!a)throw new SvelteKitError(404,"Not Found",`No action with name '${s}' found`);if(!Pe(e.request))throw new SvelteKitError(415,"Unsupported Media Type",`Form actions expect form-encoded data — received ${e.request.headers.get("content-type")}`);return Q({name:"sveltekit.form_action",attributes:{"http.route":e.route.id||"unknown"},fn:async o=>{const i=merge_tracing(e,o),c=await with_request_store({event:i,state:t},()=>a(i));return c instanceof ActionFailure&&o.setAttributes({"sveltekit.form_action.result.type":"failure","sveltekit.form_action.result.status":c.status}),c}})}function vr(e,t,r){const n=s=>{for(const a in r){const o=r[a].encode(s);if(o)return `app.decode('${a}', ${uneval(o,n)})`}};return Rt(e,s=>uneval(s,n),t)}function Ze(e,t,r){const n=Object.fromEntries(Object.entries(r).map(([s,a])=>[s,a.encode]));return Rt(e,s=>stringify(s,n),t)}function Rt(e,t,r){try{return t(e)}catch(n){const s=n;if(e instanceof Response)throw new Error(`Data returned from action inside ${r} is not serializable. Form actions need to return plain objects or fail(). E.g. return { success: true } or return fail(400, { message: "invalid" });`);if("path"in s){let a=`Data returned from action inside ${r} is not serializable: ${s.message}`;throw s.path!==""&&(a+=` (data.${s.path})`),new Error(a)}throw s}}function et(){let e,t;return {promise:new Promise((n,s)=>{e=n,t=s;}),fulfil:e,reject:t}}function St(){let e=0;const t=[et()];return {iterate:(r=n=>n)=>({[Symbol.asyncIterator](){return {next:async()=>{const n=await t[0].promise;return n.done?n:(t.shift(),{value:r(n.value),done:false})}}}}),add:r=>{e+=1,r.then(n=>{t[t.length-1].fulfil({value:n,done:false}),t.push(et()),--e===0&&t[t.length-1].fulfil({done:true});});}}}function oe(e,t,r){let n=1;const s=St(),a=yt(r);function o(c){if(typeof c?.then=="function"){const d=n++,l=c.then(h=>({data:h})).catch(async h=>({error:await L(e,t,r,h)})).then(async({data:h,error:g})=>{let p;try{p=uneval(g?[,g]:[h],o);}catch{g=await L(e,t,r,new Error(`Failed to serialize promise while rendering ${e.route.id}`)),h=void 0,p=uneval([,g],o);}return `${a}.resolve(${d}, ${p.includes("app.decode")?`(app) => ${p}`:`() => ${p}`})`});return s.add(l),`${a}.defer(${d})`}else for(const d in r.hooks.transport){const l=r.hooks.transport[d].encode(c);if(l)return `app.decode('${d}', ${uneval(l,o)})`}}const i=[];return {add_node(c,d){try{if(!d){i[c]="null";return}const l={type:"data",data:d.data,uses:wt(d)};d.slash&&(l.slash=d.slash),i[c]=uneval(l,o);}catch(l){throw l.path=l.path.slice(1),new Error(gt(e,l))}},get_data(c){const d=`<script${c.script_needs_nonce?` nonce="${c.nonce}"`:""}>`,l=`<\/script>
`;return {data:`[${i.join(",")}]`,chunks:n>1?s.iterate(h=>d+h+l):null}}}}function At(e,t,r){let n=1;const s=St(),a={...Object.fromEntries(Object.entries(r.hooks.transport).map(([i,c])=>[i,c.encode])),Promise:i=>{if(typeof i?.then!="function")return;const c=n++;let d="data";const l=i.catch(async h=>(d="error",L(e,t,r,h))).then(async h=>{let g;try{g=stringify(h,a);}catch{const p=await L(e,t,r,new Error(`Failed to serialize promise while rendering ${e.route.id}`));d="error",g=stringify(p,a);}return `{"type":"chunk","id":${c},"${d}":${g}}
`});return s.add(l),c}},o=[];return {add_node(i,c){try{if(!c){o[i]="null";return}if(c.type==="error"||c.type==="skip"){o[i]=JSON.stringify(c);return}o[i]=`{"type":"data","data":${stringify(c.data,a)},"uses":${JSON.stringify(wt(c))}${c.slash?`,"slash":${JSON.stringify(c.slash)}`:""}}`;}catch(d){throw d.path="data"+d.path,new Error(gt(e,d))}},get_data(){return {data:`{"type":"data","nodes":[${o.join(",")}]}
`,chunks:n>1?s.iterate():null}}}}const xr=[101,103,204,205,304];async function Ie({event:e,event_state:t,state:r,node:n,parent:s}){if(!n?.server)return null;let a=true;const o={dependencies:new Set,params:new Set,parent:false,route:false,url:false,search_params:new Set},i=n.server.load,c=n.server.trailingSlash;if(!i)return {type:"data",data:null,uses:o,slash:c};const d=x(e.url,()=>{a&&(o.url=true);},h=>{a&&o.search_params.add(h);});return r.prerendering&&y$1(d),{type:"data",data:await Q({name:"sveltekit.load",attributes:{"sveltekit.load.node_id":n.server_id||"unknown","sveltekit.load.node_type":kt(n.server_id),"http.route":e.route.id||"unknown"},fn:async h=>{const g=merge_tracing(e,h);return await with_request_store({event:g,state:t},()=>i.call(null,{...g,fetch:(f,u)=>(new URL(f instanceof Request?f.url:f,e.url),e.fetch(f,u)),depends:(...f)=>{for(const u of f){const{href:b}=new URL(u,e.url);o.dependencies.add(b);}},params:new Proxy(e.params,{get:(f,u)=>(a&&o.params.add(u),f[u])}),parent:async()=>(a&&(o.parent=!0),s()),route:new Proxy(e.route,{get:(f,u)=>(a&&(o.route=!0),f[u])}),url:d,untrack(f){a=!1;try{return f()}finally{a=!0;}}}))}})??null,uses:o,slash:c}}async function Tt({event:e,event_state:t,fetched:r,node:n,parent:s,server_data_promise:a,state:o,resolve_opts:i,csr:c}){const d=await a,l=n?.universal?.load;return l?await Q({name:"sveltekit.load",attributes:{"sveltekit.load.node_id":n.universal_id||"unknown","sveltekit.load.node_type":kt(n.universal_id),"http.route":e.route.id||"unknown"},fn:async g=>{const p=merge_tracing(e,g);return await with_request_store({event:p,state:t},()=>l.call(null,{url:e.url,params:e.params,data:d?.data??null,route:e.route,fetch:Er(e,o,r,c,i),setHeaders:e.setHeaders,depends:()=>{},parent:s,untrack:f=>f(),tracing:p.tracing}))}})??null:d?.data??null}function Er(e,t,r,n,s){const a=async(o,i)=>{const c=o instanceof Request&&o.body?o.clone().body:null,d=o instanceof Request&&[...o.headers].length?new Headers(o.headers):i?.headers;let l=await e.fetch(o,i);const h=new URL(o instanceof Request?o.url:o,e.url),g=h.origin===e.url.origin;let p;if(g)t.prerendering&&(p={response:l,body:null},t.prerendering.dependencies.set(h.pathname,p));else if(h.protocol==="https:"||h.protocol==="http:")if((o instanceof Request?o.mode:i?.mode??"cors")==="no-cors")l=new Response("",{status:l.status,statusText:l.statusText,headers:l.headers});else {const y=l.headers.get("access-control-allow-origin");if(!y||y!==e.url.origin&&y!=="*")throw new Error(`CORS error: ${y?"Incorrect":"No"} 'Access-Control-Allow-Origin' header is present on the requested resource`)}let f;const u=new Proxy(l,{get(b,y,$){async function S(x,_){const w=Number(b.status);if(isNaN(w))throw new Error(`response.status is not a number. value: "${b.status}" type: ${typeof b.status}`);r.push({url:g?h.href.slice(e.url.origin.length):h.href,method:e.request.method,request_body:o instanceof Request&&c?await jr(c):i?.body,request_headers:d,response_body:x,response:b,is_b64:_});}if(y==="body"){if(b.body===null)return null;if(f)return f;const[x,_]=b.body.tee();return (async()=>{let w=new Uint8Array;for await(const m of x){const k=new Uint8Array(w.length+m.length);k.set(w,0),k.set(m,w.length),w=k;}p&&(p.body=new Uint8Array(w)),S(f$1(w),true);})(),f=_}if(y==="arrayBuffer")return async()=>{const x=await b.arrayBuffer(),_=new Uint8Array(x);return p&&(p.body=_),x instanceof ArrayBuffer&&await S(f$1(_),true),x};async function v(){const x=await b.text();if(x===""&&xr.includes(b.status)){await S(void 0,false);return}return (!x||typeof x=="string")&&await S(x,false),p&&(p.body=x),x}return y==="text"?v:y==="json"?async()=>{const x=await v();return x?JSON.parse(x):void 0}:Reflect.get(b,y,b)}});if(n){const b=l.headers.get;l.headers.get=y=>{const $=y.toLowerCase(),S=b.call(l.headers,$);if(S&&!$.startsWith("x-sveltekit-")&&!s.filterSerializedResponseHeaders($,S))throw new Error(`Failed to get response header "${$}" — it must be included by the \`filterSerializedResponseHeaders\` option: https://svelte.dev/docs/kit/hooks#Server-hooks-handle (at ${e.route.id})`);return S};}return u};return (o,i)=>{const c=a(o,i);return c.catch(()=>{}),c}}async function jr(e){let t="";const r=e.getReader();for(;;){const{done:n,value:s}=await r.read();if(n)break;t+=i$1.decode(s);}return t}function Ot(...e){let t=5381;for(const r of e)if(typeof r=="string"){let n=r.length;for(;n;)t=t*33^r.charCodeAt(--n);}else if(ArrayBuffer.isView(r)){const n=new Uint8Array(r.buffer,r.byteOffset,r.byteLength);let s=n.length;for(;s;)t=t*33^n[--s];}else throw new TypeError("value must be a string or TypedArray");return (t>>>0).toString(36)}const qt={"<":"\\u003C","\u2028":"\\u2028","\u2029":"\\u2029"},Rr=new RegExp(`[${Object.keys(qt).join("")}]`,"g");function Sr(e,t,r=false){const n={};let s=null,a=null,o=false;for(const[l,h]of e.response.headers)t(l,h)&&(n[l]=h),l==="cache-control"?s=h:l==="age"?a=h:l==="vary"&&h.trim()==="*"&&(o=true);const i={status:e.response.status,statusText:e.response.statusText,headers:n,body:e.response_body},c=JSON.stringify(i).replace(Rr,l=>qt[l]),d=['type="application/json"',"data-sveltekit-fetched",`data-url="${ze(e.url,true)}"`];if(e.is_b64&&d.push("data-b64"),e.request_headers||e.request_body){const l=[];e.request_headers&&l.push([...new Headers(e.request_headers)].join(",")),e.request_body&&l.push(e.request_body),d.push(`data-hash="${Ot(...l)}"`);}if(!r&&e.method==="GET"&&s&&!o){const l=/s-maxage=(\d+)/g.exec(s)??/max-age=(\d+)/g.exec(s);if(l){const h=+l[1]-+(a??"0");d.push(`data-ttl="${h}"`);}}return `<script ${d.join(" ")}>${c}<\/script>`}const H=JSON.stringify;function tt(e){Re[0]||Ar();const t=Pt.slice(0),r=Tr(e);for(let s=0;s<r.length;s+=16){const a=r.subarray(s,s+16);let o,i,c,d=t[0],l=t[1],h=t[2],g=t[3],p=t[4],f=t[5],u=t[6],b=t[7];for(let y=0;y<64;y++)y<16?o=a[y]:(i=a[y+1&15],c=a[y+14&15],o=a[y&15]=(i>>>7^i>>>18^i>>>3^i<<25^i<<14)+(c>>>17^c>>>19^c>>>10^c<<15^c<<13)+a[y&15]+a[y+9&15]|0),o=o+b+(p>>>6^p>>>11^p>>>25^p<<26^p<<21^p<<7)+(u^p&(f^u))+Re[y],b=u,u=f,f=p,p=g+o|0,g=h,h=l,l=d,d=o+(l&h^g&(l^h))+(l>>>2^l>>>13^l>>>22^l<<30^l<<19^l<<10)|0;t[0]=t[0]+d|0,t[1]=t[1]+l|0,t[2]=t[2]+h|0,t[3]=t[3]+g|0,t[4]=t[4]+p|0,t[5]=t[5]+f|0,t[6]=t[6]+u|0,t[7]=t[7]+b|0;}const n=new Uint8Array(t.buffer);return zt(n),btoa(String.fromCharCode(...n))}const Pt=new Uint32Array(8),Re=new Uint32Array(64);function Ar(){function e(r){return (r-Math.floor(r))*4294967296}let t=2;for(let r=0;r<64;t++){let n=true;for(let s=2;s*s<=t;s++)if(t%s===0){n=false;break}n&&(r<8&&(Pt[r]=e(t**(1/2))),Re[r]=e(t**(1/3)),r++);}}function zt(e){for(let t=0;t<e.length;t+=4){const r=e[t+0],n=e[t+1],s=e[t+2],a=e[t+3];e[t+0]=a,e[t+1]=s,e[t+2]=n,e[t+3]=r;}}function Tr(e){const t=a$1.encode(e),r=t.length*8,n=512*Math.ceil((r+65)/512),s=new Uint8Array(n/8);s.set(t),s[t.length]=128,zt(s);const a=new Uint32Array(s.buffer);return a[a.length-2]=Math.floor(r/4294967296),a[a.length-1]=r,a}const rt=new Uint8Array(16);function Or(){return crypto.getRandomValues(rt),btoa(String.fromCharCode(...rt))}const qr=new Set(["self","unsafe-eval","unsafe-hashes","unsafe-inline","none","strict-dynamic","report-sample","wasm-unsafe-eval","script"]),Pr=/^(nonce|sha\d\d\d)-/;class Ct{#e;#t;#c;#l;#d;#u;#f;#p;#n;#s;#a;#o;#i;#r;#h;constructor(t,r,n){this.#e=t,this.#n=r;const s=this.#n;this.#s=[],this.#a=[],this.#o=[],this.#i=[],this.#r=[];const a=s["script-src"]||s["default-src"],o=s["script-src-elem"],i=s["style-src"]||s["default-src"],c=s["style-src-attr"],d=s["style-src-elem"],l=h=>!!h&&!h.some(g=>g==="unsafe-inline");this.#c=l(a),this.#l=l(o),this.#u=l(i),this.#f=l(c),this.#p=l(d),this.#t=this.#c||this.#l,this.#d=this.#u||this.#f||this.#p,this.script_needs_nonce=this.#t&&!this.#e,this.style_needs_nonce=this.#d&&!this.#e,this.#h=n;}add_script(t){if(!this.#t)return;const r=this.#e?`sha256-${tt(t)}`:`nonce-${this.#h}`;this.#c&&this.#s.push(r),this.#l&&this.#a.push(r);}add_style(t){if(!this.#d)return;const r=this.#e?`sha256-${tt(t)}`:`nonce-${this.#h}`;if(this.#u&&this.#o.push(r),this.#f&&this.#i.push(r),this.#p){const n="sha256-9OlNO0DNEeaVzHL4RZwCLsBHA8WBQ8toBp/4F5XV2nc=",s=this.#n;s["style-src-elem"]&&!s["style-src-elem"].includes(n)&&!this.#r.includes(n)&&this.#r.push(n),r!==n&&this.#r.push(r);}}get_header(t=false){const r=[],n={...this.#n};this.#o.length>0&&(n["style-src"]=[...n["style-src"]||n["default-src"]||[],...this.#o]),this.#i.length>0&&(n["style-src-attr"]=[...n["style-src-attr"]||[],...this.#i]),this.#r.length>0&&(n["style-src-elem"]=[...n["style-src-elem"]||[],...this.#r]),this.#s.length>0&&(n["script-src"]=[...n["script-src"]||n["default-src"]||[],...this.#s]),this.#a.length>0&&(n["script-src-elem"]=[...n["script-src-elem"]||[],...this.#a]);for(const s in n){if(t&&(s==="frame-ancestors"||s==="report-uri"||s==="sandbox"))continue;const a=n[s];if(!a)continue;const o=[s];Array.isArray(a)&&a.forEach(i=>{qr.has(i)||Pr.test(i)?o.push(`'${i}'`):o.push(i);}),r.push(o.join(" "));}return r.join("; ")}}class zr extends Ct{get_meta(){const t=this.get_header(true);if(t)return `<meta http-equiv="content-security-policy" content="${ze(t,true)}">`}}class Cr extends Ct{constructor(t,r,n){if(super(t,r,n),Object.values(r).filter(s=>!!s).length>0){const s=r["report-to"]?.length??false,a=r["report-uri"]?.length??false;if(!s&&!a)throw Error("`content-security-policy-report-only` must be specified with either the `report-to` or `report-uri` directives, or both")}}}class Ur{nonce=Or();csp_provider;report_only_provider;constructor({mode:t,directives:r,reportOnly:n},{prerender:s}){const a=t==="hash"||t==="auto"&&s;this.csp_provider=new zr(a,r,this.nonce),this.report_only_provider=new Cr(a,n,this.nonce);}get script_needs_nonce(){return this.csp_provider.script_needs_nonce||this.report_only_provider.script_needs_nonce}get style_needs_nonce(){return this.csp_provider.style_needs_nonce||this.report_only_provider.style_needs_nonce}add_script(t){this.csp_provider.add_script(t),this.report_only_provider.add_script(t);}add_style(t){this.csp_provider.add_style(t),this.report_only_provider.add_style(t);}}function Ut(e,t,r){const n={},s=e.slice(1),a=s.filter(i=>i!==void 0);let o=0;for(let i=0;i<t.length;i+=1){const c=t[i];let d=s[i-o];if(c.chained&&c.rest&&o&&(d=s.slice(i-o,i+1).filter(l=>l).join("/"),o=0),d===void 0){c.rest&&(n[c.name]="");continue}if(!c.matcher||r[c.matcher](d)){n[c.name]=d;const l=t[i+1],h=s[i+1];l&&!l.rest&&l.optional&&h&&c.chained&&(o=0),!l&&!h&&Object.keys(n).length===a.length&&(o=0);continue}if(c.optional&&c.chained){o++;continue}return}if(!o)return n}function Ht(e,t,r){const{errors:n,layouts:s,leaf:a}=e,o=[...n,...s.map(i=>i?.[1]),a[1]].filter(i=>typeof i=="number").map(i=>`'${i}': () => ${Nt(r._.client.nodes?.[i],t)}`).join(`,
		`);return [`{
	id: ${H(e.id)}`,`errors: ${H(e.errors)}`,`layouts: ${H(e.layouts)}`,`leaf: ${H(e.leaf)}`,`nodes: {
		${o}
	}
}`].join(`,
	`)}function Nt(e$1,t){if(!e$1)return "Promise.resolve({})";if(e$1[0]==="/")return `import('${e$1}')`;if(a!=="")return `import('${a}/${e$1}')`;let r=s$1(t.pathname,`${e}/${e$1}`);return r[0]!=="."&&(r=`./${r}`),`import('${r}')`}async function Hr(e,t,r){if(!r._.client.routes)return text("Server-side route resolution disabled",{status:400});let n=null,s={};const a=await r._.matchers();for(const o of r._.client.routes){const i=o.pattern.exec(e);if(!i)continue;const c=Ut(i,o.params,a);if(c){n=o,s=S(c);break}}return It(n,s,t,r).response}function It(e,t,r,n){const s=new Headers({"content-type":"application/javascript; charset=utf-8"});if(e){const a=Ht(e,r,n),o=`${Nr(e,r,n)}
export const route = ${a}; export const params = ${JSON.stringify(t)};`;return {response:text(o,{headers:s}),body:o}}else return {response:text("",{headers:s}),body:""}}function Nr(e$1,t,r){const{errors:n,layouts:s,leaf:a$1}=e$1;let o="";for(const i of [...n,...s.map(c=>c?.[1]),a$1[1]]){if(typeof i!="number")continue;const c=r._.client.css?.[i];for(const d of c??[])o+=`'${a||e}/${d}',`;}return o?`${Nt(r._.client.start,t)}.then(x => x.load_css([${o}]));`:""}const Ir={...x$1(false),check:()=>false};async function ie({branch:e$1,fetched:t,options:r$1,manifest:n,state:s,page_config:a$2,status:o$1,error:i$1=null,event:c,event_state:d,resolve_opts:l,action_result:h,data_serializer:g}){if(s.prerendering){if(r$1.csp.mode==="nonce")throw new Error('Cannot use prerendering if config.kit.csp.mode === "nonce"');if(r$1.app_template_contains_nonce)throw new Error("Cannot use prerendering if page template contains %sveltekit.nonce%")}const{client:p}=n._,f=new Set(p.imports),u=new Set(p.stylesheets),b=new Set(p.fonts),y=new Set,$=new Set,S=new Map;let v;const x=h?.type==="success"||h?.type==="failure"?h.data??null:null;let _=e,w=a,m=H(e);if(s.prerendering?.fallback?r$1.hash_routing&&(m="new URL('.', location).pathname.slice(0, -1)"):(_=c.url.pathname.slice(e.length).split("/").slice(2).map(()=>"..").join("/")||".",m=`new URL(${H(_)}, location).pathname.slice(0, -1)`,(!a||a[0]==="/"&&a!==nr)&&(w=_)),a$2.ssr){const R={stores:{page:z(null),navigating:z(null),updated:Ir},constructors:await Promise.all(e$1.map(({node:P})=>{if(!P.component)throw new Error(`Missing +page.svelte component for route ${c.route.id}`);return P.component()})),form:x};let T={};for(let P=0;P<e$1.length;P+=1)T={...T,...e$1[P].data},R[`data_${P}`]=T;R.page={error:i$1,params:c.params,route:c.route,status:o$1,url:c.url,data:T,form:x,state:{}},r({base:_,assets:w});const D={context:new Map([["__request__",{page:R.page}]])};try{v=with_request_store({event:c,state:d},()=>r$1.root.render(R,D));}finally{o();}for(const{node:P}of e$1){for(const W of P.imports)f.add(W);for(const W of P.stylesheets)u.add(W);for(const W of P.fonts)b.add(W);P.inline_styles&&!p.inline&&Object.entries(await P.inline_styles()).forEach(([W,Z])=>S.set(W,Z));}}else v={head:"",html:"",css:{code:"",map:null}};let k="",E=v.html;const j=new Ur(r$1.csp,{prerender:!!s.prerendering}),A=R=>R.startsWith("/")?e+R:`${w}/${R}`,q=p.inline?p.inline?.style:Array.from(S.values()).join(`
`);if(q){const R=[];j.style_needs_nonce&&R.push(` nonce="${j.nonce}"`),j.add_style(q),k+=`
	<style${R.join("")}>${q}</style>`;}for(const R of u){const T=A(R),D=['rel="stylesheet"'];S.has(R)?D.push("disabled",'media="(max-width: 0)"'):l.preload({type:"css",path:T})&&y.add(`<${encodeURI(T)}>; rel="preload"; as="style"; nopush`),k+=`
		<link href="${T}" ${D.join(" ")}>`;}for(const R of b){const T=A(R);if(l.preload({type:"font",path:T})){const D=R.slice(R.lastIndexOf(".")+1);$.add(`<link rel="preload" as="font" type="font/${D}" href="${T}" crossorigin>`),y.add(`<${encodeURI(T)}>; rel="preload"; as="font"; type="font/${D}"; crossorigin; nopush`);}}const J=yt(r$1),{data:G,chunks:V}=g.get_data(j);if(a$2.ssr&&a$2.csr&&(E+=`
			${t.map(R=>Sr(R,l.filterSerializedResponseHeaders,!!s.prerendering)).join(`
			`)}`),a$2.csr){const R=n._.client.routes?.find(O=>O.id===c.route.id)??null;if(p.uses_env_dynamic_public&&s.prerendering&&f.add(`${i}/env.js`),!p.inline){const O=Array.from(f,z=>A(z)).filter(z=>l.preload({type:"js",path:z}));for(const z of O)y.add(`<${encodeURI(z)}>; rel="modulepreload"; nopush`),r$1.preload_strategy!=="modulepreload"?k+=`
		<link rel="preload" as="script" crossorigin="anonymous" href="${z}">`:$.add(`<link rel="modulepreload" href="${z}">`);}if(s.prerendering&&$.size>0&&(k+=Array.from($).map(O=>`
		${O}`).join("")),n._.client.routes&&s.prerendering&&!s.prerendering.fallback){const O=$t(c.url.pathname);s.prerendering.dependencies.set(O,It(R,c.params,new URL(O,c.url),n));}const T=[],D=p.uses_env_dynamic_public&&s.prerendering,P=[`base: ${m}`];if(a&&P.push(`assets: ${H(a)}`),p.uses_env_dynamic_public&&P.push(`env: ${D?"null":H(lt$1)}`),V){T.push("const deferred = new Map();"),P.push(`defer: (id) => new Promise((fulfil, reject) => {
							deferred.set(id, { fulfil, reject });
						})`);let O="";Object.keys(r$1.hooks.transport).length>0&&(p.inline?O=`const app = __sveltekit_${r$1.version_hash}.app.app;`:p.app?O=`const app = await import(${H(A(p.app))});`:O=`const { app } = await import(${H(A(p.start))});`);const z=O?`${O}
							const [data, error] = fn(app);`:"const [data, error] = fn();";P.push(`resolve: async (id, fn) => {
							${z}

							const try_to_resolve = () => {
								if (!deferred.has(id)) {
									setTimeout(try_to_resolve, 0);
									return;
								}
								const { fulfil, reject } = deferred.get(id);
								deferred.delete(id);
								if (error) reject(error);
								else fulfil(data);
							}
							try_to_resolve();
						}`);}const{remote_data:W}=d;if(W){const O={};for(const Y in W)O[Y]=await W[Y];const z=Y=>{for(const ee in r$1.hooks.transport){const Me=r$1.hooks.transport[ee].encode(Y);if(Me)return `app.decode('${ee}', ${uneval(Me,z)})`}};P.push(`data: ${uneval(O,z)}`);}T.push(`${J} = {
						${P.join(`,
						`)}
					};`);const Z=["element"];if(T.push("const element = document.currentScript.parentElement;"),a$2.ssr){const O={form:"null",error:"null"};x&&(O.form=vr(x,c.route.id,r$1.hooks.transport)),i$1&&(O.error=uneval(i$1));const z=[`node_ids: [${e$1.map(({node:ee})=>ee.index).join(", ")}]`,`data: ${G}`,`form: ${O.form}`,`error: ${O.error}`];if(o$1!==200&&z.push(`status: ${o$1}`),n._.client.routes){if(R){const ee=Ht(R,c.url,n).replaceAll(`
`,`
							`);z.push(`params: ${uneval(c.params)}`,`server_route: ${ee}`);}}else r$1.embedded&&z.push(`params: ${uneval(c.params)}`,`route: ${H(c.route)}`);const Y="	".repeat(D?7:6);Z.push(`{
${Y}	${z.join(`,
${Y}	`)}
${Y}}`);}const De=p.inline?`${p.inline.script}

					__sveltekit_${r$1.version_hash}.app.start(${Z.join(", ")});`:p.app?`Promise.all([
						import(${H(A(p.start))}),
						import(${H(A(p.app))})
					]).then(([kit, app]) => {
						kit.start(app, ${Z.join(", ")});
					});`:`import(${H(A(p.start))}).then((app) => {
						app.start(${Z.join(", ")})
					});`;if(D?T.push(`import(${H(`${_}/${i}/env.js`)}).then(({ env }) => {
						${J}.env = env;

						${De.replace(/\n/g,`
	`)}
					});`):T.push(De),r$1.service_worker){let O="";if(r$1.service_worker_options!=null){const z={...r$1.service_worker_options};O=`, ${H(z)}`;}T.push(`if ('serviceWorker' in navigator) {
						addEventListener('load', function () {
							navigator.serviceWorker.register('${A("service-worker.js")}'${O});
						});
					}`);}const We=`
				{
					${T.join(`

					`)}
				}
			`;j.add_script(We),E+=`
			<script${j.script_needs_nonce?` nonce="${j.nonce}"`:""}>${We}<\/script>
		`;}const X=new Headers({"x-sveltekit-page":"true","content-type":"text/html"});if(s.prerendering){const R=[],T=j.csp_provider.get_meta();T&&R.push(T),s.prerendering.cache&&R.push(`<meta http-equiv="cache-control" content="${s.prerendering.cache}">`),R.length>0&&(k=R.join(`
`)+k);}else {const R=j.csp_provider.get_header();R&&X.set("content-security-policy",R);const T=j.report_only_provider.get_header();T&&X.set("content-security-policy-report-only",T),y.size&&X.set("link",Array.from(y).join(", "));}k+=v.head;const me=r$1.templates.app({head:k,body:E,assets:w,nonce:j.nonce,env:lt$1}),ye=await l.transformPageChunk({html:me,done:true})||"";return V||X.set("etag",`"${Ot(ye)}"`),V?new Response(new ReadableStream({async start(R){R.enqueue(a$1.encode(ye+`
`));for await(const T of V)R.enqueue(a$1.encode(T));R.close();},type:"bytes"}),{headers:X}):text(ye,{status:o$1,headers:X})}class Le{data;constructor(t){this.data=t;}layouts(){return this.data.slice(0,-1)}page(){return this.data.at(-1)}validate(){for(const r of this.layouts())r&&(E$1(r.server,r.server_id),j$1(r.universal,r.universal_id));const t=this.page();t&&(R(t.server,t.server_id),O$1(t.universal,t.universal_id));}#e(t){return this.data.reduce((r,n)=>n?.universal?.[t]??n?.server?.[t]??r,void 0)}csr(){return this.#e("csr")??true}ssr(){return this.#e("ssr")??true}prerender(){return this.#e("prerender")??false}trailing_slash(){return this.#e("trailingSlash")??"never"}get_config(){let t={};for(const r of this.data)!r?.universal?.config&&!r?.server?.config||(t={...t,...r?.universal?.config,...r?.server?.config});return Object.keys(t).length?t:void 0}should_prerender_data(){return this.data.some(t=>t?.server?.load||t?.server?.trailingSlash!==void 0)}}async function Lt({event:e,event_state:t,options:r,manifest:n,state:s,status:a,error:o,resolve_opts:i}){if(e.request.headers.get("x-sveltekit-error"))return fe(r,a,o.message);const c=[];try{const d=[],l=await n._.nodes[0](),h=new Le([l]),g=h.ssr(),p=h.csr(),f=oe(e,t,r);if(g){s.error=!0;const u=Ie({event:e,event_state:t,state:s,node:l,parent:async()=>({})}),b=await u;f.add_node(0,b);const y=await Tt({event:e,event_state:t,fetched:c,node:l,parent:async()=>({}),resolve_opts:i,server_data_promise:u,state:s,csr:p});d.push({node:l,server_data:b,data:y},{node:await n._.nodes[1](),data:null,server_data:null});}return await ie({options:r,manifest:n,state:s,page_config:{ssr:g,csr:p},status:a,error:await L(e,t,r,o),branch:d,fetched:c,event:e,event_state:t,resolve_opts:i,data_serializer:f})}catch(d){return d instanceof Redirect?pe(d.status,d.location):fe(r,ne(d),(await L(e,t,r,d)).message)}}async function Lr(e,t,r,n,s){return Q({name:"sveltekit.remote.call",attributes:{},fn:a=>{const o=merge_tracing(e,a);return with_request_store({event:o,state:t},()=>Dr(o,t,r,n,s))}})}async function Dr(e,t,r,n,s){const[a,o,i]=s.split("/"),c=n._.remotes;c[a]||error(404);const l$1=(await c[a]())[o];l$1||error(404);const h=l$1.__,g=r.hooks.transport;e.tracing.current.setAttributes({"sveltekit.remote.call.type":h.type,"sveltekit.remote.call.name":h.name});let p;try{if(h.type==="form"){if(!Pe(e.request))throw new SvelteKitError(415,"Unsupported Media Type",`Form actions expect form-encoded data — received ${e.request.headers.get("content-type")}`);const y=await e.request.formData();p=JSON.parse(y.get("sveltekit:remote_refreshes")??"[]"),y.delete("sveltekit:remote_refreshes");const $=h.fn,S=await with_request_store({event:e,state:t},()=>$(y));return json({type:"result",result:l(S,g),refreshes:await f(p)})}if(h.type==="command"){const{payload:y,refreshes:$}=await e.request.json(),S=u(y,g),v=await with_request_store({event:e,state:t},()=>l$1(S));return json({type:"result",result:l(v,g),refreshes:await f($)})}const u$1=h.type==="prerender"?i:new URL(e.request.url).searchParams.get("payload"),b=await with_request_store({event:e,state:t},()=>l$1(u(u$1,g)));return json({type:"result",result:l(b,g)})}catch(u){return u instanceof Redirect?json({type:"redirect",location:u.location,refreshes:await f(p??[])}):json({type:"error",error:await L(e,t,r,u),status:u instanceof HttpError||u instanceof SvelteKitError?u.status:500},{headers:{"cache-control":"private, no-store"}})}async function f(u$1){const b=t.refreshes;for(const y of u$1){if(b[y]!==void 0)continue;const[$,S,v]=y.split("/"),x=n._.remotes[$],_=(await x?.())?.[S];_||error(400,"Bad Request"),b[y]=with_request_store({event:e,state:t},()=>_(u(v,g)));}if(Object.keys(b).length!==0)return l(Object.fromEntries(await Promise.all(Object.entries(b).map(async([y,$])=>[y,await $]))),g)}}async function Wr(e,t,r,n){return Q({name:"sveltekit.remote.form.post",attributes:{},fn:s=>{const a=merge_tracing(e,s);return with_request_store({event:a,state:t},()=>Mr(a,t,r,n))}})}async function Mr(e,t,r,n){const[s,a,o]=n.split("/");let d=(await r._.remotes[s]?.())?.[a];if(!d)return e.setHeaders({allow:"GET"}),{type:"error",error:new SvelteKitError(405,"Method Not Allowed","POST method not allowed. No form actions exist for this page")};o&&(d=with_request_store({event:e,state:t},()=>d.for(JSON.parse(o))));try{const l=await e.request.formData(),h=d.__.fn;return await with_request_store({event:e,state:t},()=>h(l)),{type:"success",status:200}}catch(l){const h=l;return h instanceof Redirect?{type:"redirect",status:h.status,location:h.location}:{type:"error",error:Ne(h)}}}function Fr(e$1){return e$1.pathname.startsWith(`${e}/${i}/remote/`)&&e$1.pathname.replace(`${e}/${i}/remote/`,"")}function Gr(e){return e.searchParams.get("/remote")}const Br=10;async function Jr(e,t,r,n,s$1,a,o,i){if(a.depth>Br)return text(`Not found: ${e.url.pathname}`,{status:404});if(vt(e)){const c=await s$1._.nodes[r.leaf]();return br(e,t,n,c?.server)}try{const c=o.page();let d=200,l;if(kr(e)){const w=Gr(e.url);if(w?l=await Wr(e,t,s$1,w):l=await $r(e,t,c.server),l?.type==="redirect")return pe(l.status,l.location);l?.type==="error"&&(d=ne(l.error)),l?.type==="failure"&&(d=l.status);}const h=o.prerender();if(h){if(c.server?.actions)throw new Error("Cannot prerender pages with actions")}else if(a.prerendering)return new Response(void 0,{status:204});a.prerender_default=h;const g=o.should_prerender_data(),p=Ue(e.url.pathname),f=[],u=o.ssr(),b=o.csr();if(u===!1&&!(a.prerendering&&g))return s&&l&&e.request.headers.has("x-sveltekit-action"),await ie({branch:[],fetched:f,page_config:{ssr:!1,csr:b},status:d,error:null,event:e,event_state:t,options:n,manifest:s$1,state:a,resolve_opts:i,data_serializer:oe(e,t,n)});const y=[];let $=null;const S=oe(e,t,n),v=a.prerendering&&g?At(e,t,n):null,x=o.data.map((w,m)=>{if($)throw $;return Promise.resolve().then(async()=>{try{if(w===c&&l?.type==="error")throw l.error;const k=await Ie({event:e,event_state:t,state:a,node:w,parent:async()=>{const E={};for(let j=0;j<m;j+=1){const A=await x[j];A&&Object.assign(E,A.data);}return E}});return S.add_node(m,k),v?.add_node(m,k),k}catch(k){throw $=k,$}})}),_=o.data.map((w,m)=>{if($)throw $;return Promise.resolve().then(async()=>{try{return await Tt({event:e,event_state:t,fetched:f,node:w,parent:async()=>{const k={};for(let E=0;E<m;E+=1)Object.assign(k,await _[E]);return k},resolve_opts:i,server_data_promise:x[m],state:a,csr:b})}catch(k){throw $=k,$}})});for(const w of x)w.catch(()=>{});for(const w of _)w.catch(()=>{});for(let w=0;w<o.data.length;w+=1){const m=o.data[w];if(m)try{const k=await x[w],E=await _[w];y.push({node:m,server_data:k,data:E});}catch(k){const E=k;if(E instanceof Redirect){if(a.prerendering&&g){const q=JSON.stringify({type:"redirect",location:E.location});a.prerendering.dependencies.set(p,{response:text(q),body:q});}return pe(E.status,E.location)}const j=ne(E),A=await L(e,t,n,E);for(;w--;)if(r.errors[w]){const q=r.errors[w],J=await s$1._.nodes[q]();let G=w;for(;!y[G];)G-=1;const V=Qe(y.slice(0,G+1)),X=new Le(V.map(me=>me.node));return await ie({event:e,event_state:t,options:n,manifest:s$1,state:a,resolve_opts:i,page_config:{ssr:X.ssr(),csr:X.csr()},status:j,error:A,branch:V.concat({node:J,data:null,server_data:null}),fetched:f,data_serializer:oe(e,t,n)})}return fe(n,j,A.message)}else y.push(null);}if(a.prerendering&&v){let{data:w,chunks:m}=v.get_data();if(m)for await(const k of m)w+=k;a.prerendering.dependencies.set(p,{response:text(w),body:w});}return await ie({event:e,event_state:t,options:n,manifest:s$1,state:a,resolve_opts:i,page_config:{csr:b,ssr:u},status:d,error:null,branch:u===!1?[]:Qe(y),action_result:l,fetched:f,data_serializer:S})}catch(c){return await Lt({event:e,event_state:t,options:n,manifest:s$1,state:a,status:500,error:c,resolve_opts:i})}}function Vr(e){let t=false,r;return ()=>t?r:(t=true,r=e())}async function Xr(e,t,r,n,s,a,o,i){if(!r.page)return new Response(void 0,{status:404});try{const c=[...r.page.layouts,r.page.leaf],d=o??c.map(()=>!0);let l=!1;const h=new URL(e.url);h.pathname=$(h.pathname,i);const g={...e,url:h},p=c.map((v,x)=>Vr(async()=>{try{if(l)return {type:"skip"};const _=v==null?v:await s._.nodes[v]();return Ie({event:g,event_state:t,state:a,node:_,parent:async()=>{const w={};for(let m=0;m<x;m+=1){const k=await p[m]();k&&Object.assign(w,k.data);}return w}})}catch(_){throw l=!0,_}})),f=p.map(async(v,x)=>d[x]?v():{type:"skip"});let u=f.length;const b=await Promise.all(f.map((v,x)=>v.catch(async _=>{if(_ instanceof Redirect)throw _;return u=Math.min(u,x+1),{type:"error",error:await L(e,t,n,_),status:_ instanceof HttpError||_ instanceof SvelteKitError?_.status:void 0}}))),y=At(e,t,n);for(let v=0;v<b.length;v++)y.add_node(v,b[v]);const{data:$$1,chunks:S}=y.get_data();return S?new Response(new ReadableStream({async start(v){v.enqueue(a$1.encode($$1));for await(const x of S)v.enqueue(a$1.encode(x));v.close();},type:"bytes"}),{headers:{"content-type":"text/sveltekit-data","cache-control":"private, no-store"}}):Se($$1)}catch(c){const d=c;return d instanceof Redirect?Ae(d):Se(await L(e,t,n,d),500)}}function Se(e,t=200){return text(typeof e=="string"?e:JSON.stringify(e),{status:t,headers:{"content-type":"application/json","cache-control":"private, no-store"}})}function Ae(e){return Se({type:"redirect",location:e.location})}const Kr=/[\x00-\x1F\x7F()<>@,;:"/[\]?={} \t]/;function be(e){if(e?.path===void 0)throw new Error("You must specify a `path` when setting, deleting or serializing cookies")}function Yr(e,t,r){return `${e||""}${t}?${encodeURIComponent(r)}`}function Qr(e,t){const r=e.headers.get("cookie")??"",n=cookieExports.parse(r,{decode:g=>g});let s;const a=new Map,o={httpOnly:true,sameSite:"lax",secure:!(t.hostname==="localhost"&&t.protocol==="http:")},i={get(g,p){const f=Array.from(a.values()).filter(y=>y.name===g&&ke(t.hostname,y.options.domain)&&$e(t.pathname,y.options.path)).sort((y,$)=>$.options.path.length-y.options.path.length)[0];return f?f.options.maxAge===0?void 0:f.value:cookieExports.parse(r,{decode:p?.decode})[g]},getAll(g){const p=cookieExports.parse(r,{decode:g?.decode}),f=new Map;for(const u of a.values())if(ke(t.hostname,u.options.domain)&&$e(t.pathname,u.options.path)){const b=f.get(u.name);(!b||u.options.path.length>b.options.path.length)&&f.set(u.name,u);}for(const u of f.values())p[u.name]=u.value;return Object.entries(p).map(([u,b])=>({name:u,value:b}))},set(g,p,f){const u=g.match(Kr);u&&console.warn(`The cookie name "${g}" will be invalid in SvelteKit 3.0 as it contains ${u.join(" and ")}. See RFC 2616 for more details https://datatracker.ietf.org/doc/html/rfc2616#section-2.2`),be(f),l(g,p,{...o,...f});},delete(g,p){be(p),i.set(g,"",{...p,maxAge:0});},serialize(g,p,f){be(f);let u=f.path;if(!f.domain||f.domain===t.hostname){if(!s)throw new Error("Cannot serialize cookies until after the route is determined");u=b$1(s,u);}return cookieExports.serialize(g,p,{...o,...f,path:u})}};function c(g,p){const f={...n};for(const u of a.values()){if(!ke(g.hostname,u.options.domain)||!$e(g.pathname,u.options.path))continue;const b=u.options.encode||encodeURIComponent;f[u.name]=b(u.value);}if(p){const u=cookieExports.parse(p,{decode:b=>b});for(const b in u)f[b]=u[b];}return Object.entries(f).map(([u,b])=>`${u}=${b}`).join("; ")}const d=[];function l(g,p,f){if(!s){d.push(()=>l(g,p,f));return}let u=f.path;(!f.domain||f.domain===t.hostname)&&(u=b$1(s,u));const b=Yr(f.domain,u,g),y={name:g,value:p,options:{...f,path:u}};a.set(b,y);}function h(g){s=$(t.pathname,g),d.forEach(p=>p());}return {cookies:i,new_cookies:a,get_cookie_header:c,set_internal:l,set_trailing_slash:h}}function ke(e,t){if(!t)return  true;const r=t[0]==="."?t.slice(1):t;return e===r?true:e.endsWith("."+r)}function $e(e,t){if(!t)return  true;const r=t.endsWith("/")?t.slice(0,-1):t;return e===r?true:e.startsWith(r+"/")}function nt(e,t){for(const r of t){const{name:n,value:s,options:a}=r;if(e.append("set-cookie",cookieExports.serialize(n,s,a)),a.path.endsWith(".html")){const o=Ue(a.path);e.append("set-cookie",cookieExports.serialize(n,s,{...a,path:o}));}}}function Zr({event:e$1,options:t,manifest:r,state:n,get_cookie_header:s,set_internal:a$1}){const o=async(i,c)=>{const d=st(i,c,e$1.url);let l=(i instanceof Request?i.mode:c?.mode)??"cors",h=(i instanceof Request?i.credentials:c?.credentials)??"same-origin";return t.hooks.handleFetch({event:e$1,request:d,fetch:async(g,p)=>{const f=st(g,p,e$1.url),u=new URL(f.url);if(f.headers.has("origin")||f.headers.set("origin",e$1.url.origin),g!==d&&(l=(g instanceof Request?g.mode:p?.mode)??"cors",h=(g instanceof Request?g.credentials:p?.credentials)??"same-origin"),(f.method==="GET"||f.method==="HEAD")&&(l==="no-cors"&&u.origin!==e$1.url.origin||u.origin===e$1.url.origin)&&f.headers.delete("origin"),u.origin!==e$1.url.origin){if(`.${u.hostname}`.endsWith(`.${e$1.url.hostname}`)&&h!=="omit"){const m=s(u,f.headers.get("cookie"));m&&f.headers.set("cookie",m);}return fetch(f)}const b=a||e,y=decodeURIComponent(u.pathname),$=(y.startsWith(b)?y.slice(b.length):y).slice(1),S=`${$}/index.html`,v=r.assets.has($)||$ in r._.server_assets,x=r.assets.has(S)||S in r._.server_assets;if(v||x){const m=v?$:S;if(n.read){const k=v?r.mimeTypes[$.slice($.lastIndexOf("."))]:"text/html";return new Response(n.read(m),{headers:k?{"content-type":k}:{}})}else if(gt$1&&m in r._.server_assets){const k=r._.server_assets[m],E=r.mimeTypes[m.slice(m.lastIndexOf("."))];return new Response(gt$1(m),{headers:{"Content-Length":""+k,"Content-Type":E}})}return await fetch(f)}if(bt(r,e+y))return await fetch(f);if(h!=="omit"){const m=s(u,f.headers.get("cookie"));m&&f.headers.set("cookie",m);const k=e$1.request.headers.get("authorization");k&&!f.headers.has("authorization")&&f.headers.set("authorization",k);}f.headers.has("accept")||f.headers.set("accept","*/*"),f.headers.has("accept-language")||f.headers.set("accept-language",e$1.request.headers.get("accept-language"));const _=await en(f,t,r,n),w=_.headers.get("set-cookie");if(w)for(const m of setCookieExports.splitCookiesString(w)){const{name:k,value:E,...j}=setCookieExports.parseString(m,{decodeValues:false}),A=j.path??(u.pathname.split("/").slice(0,-1).join("/")||"/");a$1(k,E,{path:A,encode:q=>q,...j});}return _}})};return (i,c)=>{const d=o(i,c);return d.catch(()=>{}),d}}function st(e,t,r){return e instanceof Request?e:new Request(typeof e=="string"?new URL(e,r):e,t)}async function en(e,t,r,n){if(e.signal){if(e.signal.aborted)throw new DOMException("The operation was aborted.","AbortError");let s=()=>{};const a=new Promise((i,c)=>{const d=()=>{c(new DOMException("The operation was aborted.","AbortError"));};e.signal.addEventListener("abort",d,{once:true}),s=()=>e.signal.removeEventListener("abort",d);}),o=await Promise.race([Te(e,t,r,{...n,depth:n.depth+1}),a]);return s(),o}else return await Te(e,t,r,{...n,depth:n.depth+1})}let at,ve,xe;function tn(e){return at??=`export const env=${JSON.stringify(lt$1)}`,ve??=`W/${Date.now()}`,xe??=new Headers({"content-type":"application/javascript; charset=utf-8",etag:ve}),e.headers.get("if-none-match")===ve?new Response(void 0,{status:304,headers:xe}):new Response(at,{headers:xe})}const ot=({html:e})=>e,it=()=>false,ct=({type:e})=>e==="js"||e==="css",rn=new Set(["GET","HEAD","POST"]),nn=new Set(["GET","HEAD","OPTIONS"]);const Te=on(sn);async function sn(e$1,t,r,n){const s$1=new URL(e$1.url),a=mr(s$1.pathname),o=hr(s$1.pathname),i$1=Fr(s$1);{const _=e$1.headers.get("origin");if(i$1){if(e$1.method!=="GET"&&_!==s$1.origin)return json({message:"Cross-site remote requests are forbidden"},{status:403})}else if(t.csrf_check_origin&&Pe(e$1)&&(e$1.method==="POST"||e$1.method==="PUT"||e$1.method==="PATCH"||e$1.method==="DELETE")&&_!==s$1.origin&&(!_||!t.csrf_trusted_origins.includes(_))){const m=`Cross-site ${e$1.method} form submissions are forbidden`,k={status:403};return e$1.headers.get("accept")==="application/json"?json({message:m},k):text(m,k)}}if(t.hash_routing&&s$1.pathname!==e+"/"&&s$1.pathname!=="/[fallback]")return text("Not found",{status:404});let c;a?s$1.pathname=yr(s$1.pathname):o?(s$1.pathname=_r(s$1.pathname)+(s$1.searchParams.get(p)==="1"?"/":"")||"/",s$1.searchParams.delete(p),c=s$1.searchParams.get(f)?.split("").map(_=>_==="1"),s$1.searchParams.delete(f)):i$1&&(s$1.pathname=e,s$1.search="");const d={},{cookies:l,new_cookies:h,get_cookie_header:g,set_internal:p$1,set_trailing_slash:f$1}=Qr(e$1,s$1),u={prerendering:n.prerendering,transport:t.hooks.transport,handleValidationError:t.hooks.handleValidationError,tracing:{record_span:Q}},b={cookies:l,fetch:null,getClientAddress:n.getClientAddress||(()=>{throw new Error("@sveltejs/adapter-node does not specify getClientAddress. Please raise an issue")}),locals:{},params:{},platform:n.platform,request:e$1,route:{id:null},setHeaders:_=>{for(const w in _){const m=w.toLowerCase(),k=_[w];if(m==="set-cookie")throw new Error("Use `event.cookies.set(name, value, options)` instead of `event.setHeaders` to set cookies");if(m in d)throw new Error(`"${w}" header is already set`);d[m]=k,n.prerendering&&m==="cache-control"&&(n.prerendering.cache=k);}},url:s$1,isDataRequest:o,isSubRequest:n.depth>0,isRemoteRequest:!!i$1};b.fetch=Zr({event:b,options:t,manifest:r,state:n,get_cookie_header:g,set_internal:p$1}),n.emulator?.platform&&(b.platform=await n.emulator.platform({config:{},prerender:!!n.prerendering?.fallback}));let y=s$1.pathname;if(!i$1){const _=n.prerendering?.inside_reroute;try{n.prerendering&&(n.prerendering.inside_reroute=!0),y=await t.hooks.reroute({url:new URL(s$1),fetch:b.fetch})??s$1.pathname;}catch{return text("Internal Server Error",{status:500})}finally{n.prerendering&&(n.prerendering.inside_reroute=_);}}try{y=P(y);}catch{return text("Malformed URI",{status:400})}if(y!==s$1.pathname&&!n.prerendering?.fallback&&bt(r,y)){const _=new URL(e$1.url);_.pathname=o?Ue(y):a?$t(y):y;const w=await fetch(_,e$1),m=new Headers(w.headers);return m.has("content-encoding")&&(m.delete("content-encoding"),m.delete("content-length")),new Response(w.body,{headers:m,status:w.status,statusText:w.statusText})}let $$1=null;if(e&&!n.prerendering?.fallback){if(!y.startsWith(e))return text("Not found",{status:404});y=y.slice(e.length)||"/";}if(a)return Hr(y,new URL(e$1.url),r);if(y===`/${i}/env.js`)return tn(e$1);if(!i$1&&y.startsWith(`/${i}`)){const _=new Headers;return _.set("cache-control","public, max-age=0, must-revalidate"),text("Not found",{status:404,headers:_})}if(!n.prerendering?.fallback&&!i$1){const _=await r._.matchers();for(const w of r._.routes){const m=w.pattern.exec(y);if(!m)continue;const k=Ut(m,w.params,_);if(k){$$1=w,b.route={id:$$1.id},b.params=S(k);break}}}let S$1={transformPageChunk:ot,filterSerializedResponseHeaders:it,preload:ct},v="never";try{const _=$$1?.page?new Le(await an($$1.page,r)):void 0;if($$1){if(s$1.pathname===e||s$1.pathname===e+"/"?v="always":_?v=_.trailing_slash():$$1.endpoint&&(v=(await $$1.endpoint()).trailingSlash??"never"),!o){const m=$(s$1.pathname,v);if(m!==s$1.pathname&&!n.prerendering?.fallback)return new Response(void 0,{status:308,headers:{"x-sveltekit-normalize":"1",location:(m.startsWith("//")?s$1.origin+m:m)+(s$1.search==="?"?"":s$1.search)}})}if(n.before_handle||n.emulator?.platform){let m={},k=!1;if($$1.endpoint){const E=await $$1.endpoint();m=E.config??m,k=E.prerender??k;}else _&&(m=_.get_config()??m,k=_.prerender());n.before_handle&&n.before_handle(b,m,k),n.emulator?.platform&&(b.platform=await n.emulator.platform({config:m,prerender:k}));}}f$1(v),n.prerendering&&!n.prerendering.fallback&&!n.prerendering.inside_reroute&&y$1(s$1);const w=await Q({name:"sveltekit.handle.root",attributes:{"http.route":b.route.id||"unknown","http.method":b.request.method,"http.url":b.url.href,"sveltekit.is_data_request":o,"sveltekit.is_sub_request":b.isSubRequest},fn:async m=>{const k={...b,tracing:{enabled:!1,root:m,current:m}};return await with_request_store({event:k,state:u},()=>t.hooks.handle({event:k,resolve:(E,j)=>Q({name:"sveltekit.resolve",attributes:{"http.route":E.route.id||"unknown"},fn:A=>with_request_store(null,()=>x(merge_tracing(E,A),_,j).then(q=>{for(const J in d){const G=d[J];q.headers.set(J,G);}return nt(q.headers,h.values()),n.prerendering&&E.route.id!==null&&q.headers.set("x-sveltekit-routeid",encodeURI(E.route.id)),A.setAttributes({"http.response.status_code":q.status,"http.response.body.size":q.headers.get("content-length")||"unknown"}),q}))})}))}});if(w.status===200&&w.headers.has("etag")){let m=e$1.headers.get("if-none-match");m?.startsWith('W/"')&&(m=m.substring(2));const k=w.headers.get("etag");if(m===k){const E=new Headers({etag:k});for(const j of ["cache-control","content-location","date","expires","vary","set-cookie"]){const A=w.headers.get(j);A&&E.set(j,A);}return new Response(void 0,{status:304,headers:E})}}if(o&&w.status>=300&&w.status<=308){const m=w.headers.get("location");if(m)return Ae(new Redirect(w.status,m))}return w}catch(_){if(_ instanceof Redirect){const w=o?Ae(_):$$1?.page&&vt(b)?xt(_):pe(_.status,_.location);return nt(w.headers,h.values()),w}return await Ye(b,u,t,_)}async function x(_,w,m){try{if(m&&(S$1={transformPageChunk:m.transformPageChunk||ot,filterSerializedResponseHeaders:m.filterSerializedResponseHeaders||it,preload:m.preload||ct}),t.hash_routing||n.prerendering?.fallback)return await ie({event:_,event_state:u,options:t,manifest:r,state:n,page_config:{ssr:!1,csr:!0},status:200,error:null,branch:[],fetched:[],resolve_opts:S$1,data_serializer:oe(_,u,t)});if(i$1)return await Lr(_,u,t,r,i$1);if($$1){const E=_.request.method;let j;if(o)j=await Xr(_,u,$$1,t,r,n,c,v);else if($$1.endpoint&&(!$$1.page||pr(_)))j=await fr(_,u,await $$1.endpoint(),n);else if($$1.page)if(w)if(rn.has(E))j=await Jr(_,u,$$1.page,t,r,n,w,S$1);else {const A=new Set(nn);if((await r._.nodes[$$1.page.leaf]())?.server?.actions&&A.add("POST"),E==="OPTIONS")j=new Response(null,{status:204,headers:{allow:Array.from(A.values()).join(", ")}});else {const J=[...A].reduce((G,V)=>(G[V]=!0,G),{});j=mt(J,E);}}else throw new Error("page_nodes not found. This should never happen");else throw new Error("Route is neither page nor endpoint. This should never happen");if(e$1.method==="GET"&&$$1.page&&$$1.endpoint){const A=j.headers.get("vary")?.split(",")?.map(q=>q.trim().toLowerCase());A?.includes("accept")||A?.includes("*")||(j=new Response(j.body,{status:j.status,statusText:j.statusText,headers:new Headers(j.headers)}),j.headers.append("Vary","Accept"));}return j}if(n.error&&_.isSubRequest){const E=new Headers(e$1.headers);return E.set("x-sveltekit-error","true"),await fetch(e$1,{headers:E})}if(n.error)return text("Internal Server Error",{status:500});if(n.depth===0)return s&&_.url.pathname,await Lt({event:_,event_state:u,options:t,manifest:r,state:n,status:404,error:new SvelteKitError(404,"Not Found",`Not found: ${_.url.pathname}`),resolve_opts:S$1});if(n.prerendering)return text("not found",{status:404});const k=await fetch(e$1);return new Response(k.body,k)}catch(k){return await Ye(_,u,t,k)}finally{_.cookies.set=()=>{throw new Error("Cannot use `cookies.set(...)` after the response has been generated")},_.setHeaders=()=>{throw new Error("Cannot use `setHeaders(...)` after the response has been generated")};}}}function an(e,t){return Promise.all([...e.layouts.map(r=>r==null?r:t._.nodes[r]()),t._.nodes[e.leaf]()])}function on(e){return async(t,...r)=>e(t,...r)}function lt(e,t,r){return Object.fromEntries(Object.entries(e).filter(([n])=>n.startsWith(t)&&(r===""||!n.startsWith(r))))}let cn;class kn{#e;#t;constructor(t){this.#e=Pt$1,this.#t=t;}async init({env:t,read:r}){const{env_public_prefix:n,env_private_prefix:s}=this.#e;Ot$1(lt(t,s,n)),Ct$1(lt(t,n,s)),r&&Rt$1(o=>{const i=r(o);return i instanceof ReadableStream?i:new ReadableStream({async start(c){try{const d=await Promise.resolve(i);if(!d){c.close();return}const l=d.getReader();for(;;){const{done:h,value:g}=await l.read();if(h)break;c.enqueue(g);}c.close();}catch(d){c.error(d);}}})}),await(cn??=(async()=>{try{const a=await Tt$1();this.#e.hooks={handle:a.handle||(({event:o,resolve:i})=>i(o)),handleError:a.handleError||(({status:o,error:i,event:c})=>{const d=ur(o,i,c);console.error(d);}),handleFetch:a.handleFetch||(({request:o,fetch:i})=>i(o)),handleValidationError:a.handleValidationError||(({issues:o})=>(console.error("Remote function schema validation failed:",o),{message:"Bad Request"})),reroute:a.reroute||(()=>{}),transport:a.transport||{}},a.transport&&Object.fromEntries(Object.entries(a.transport).map(([o,i])=>[o,i.decode])),a.init&&await a.init();}catch(a){throw a}})());}async respond(t,r){return Te(t,this.#e,this.#t,{...r,error:false,depth:0})}}

export { kn as Server };
//# sourceMappingURL=index.js.map
