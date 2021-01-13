/*
 * Copyright (C) 2016-present cm45t3r.
 * MIT License.
 */

class ArgumentRequiredError extends Error {
  constructor(argument) {
    super(`Argument ${argument} is required.`);
    this.name = 'ArgumentRequiredError';
  }
}

class PropertyRequiredError extends Error {
  constructor(property, argument, ohlc) {
    super(`${property} is required in ${argument || 'argument'}. Value: ${ohlc}`);
    this.name = 'PropertyRequiredError';
  }
}

function validate(ohlc, options) {
  if (ohlc === undefined || ohlc === null) {
    throw new ArgumentRequiredError(options.name);
  }

  const properties = options.properties;

  for (let property of properties) {
    if (!ohlc[property]) {
      throw new PropertyRequiredError(property, options.name, ohlc);
    }
  }

  if (options.high && options.low && ohlc.high < ohlc.low) {
    throw new Error('Low price cannot be greater than high price.');
  }
}

/**
 * Calculate the distance between `open` and `close` prices from an OHLC candlestick.
 *
 * @param {Object} ohlc - An object including at least the following properties:
 *
 * `{ open: number, close: number }`
 *
 * @param {number} ohlc.open - opening price of the security.
 * @param {number} ohlc.close - closing price of the security.
 * @returns {number} a positive `number` or zero.
 */
function bodyLength(ohlc) {
  validate(ohlc, { name: 'ohlc', properties: ['open', 'close'] });
  return Math.abs(ohlc.open - ohlc.close);
}

/**
 * Calculate the distance between `close` and `high` prices from a bullish OHLC candlestick,
 * or between `open` and `high` prices from a bearish OHLC candlestick.
 *
 * @param {Object} ohlc - An object including at least the following properties:
 *
 * `{ open: number, high: number, close: number }`
 *
 * @param {number} ohlc.open - opening price of the security.
 * @param {number} ohlc.high - highest price of the security.
 * @param {number} ohlc.close - closing price of the security.
 * @throws {InvalidHighValueException} high must be higher
 * @returns {number} a positive `number` or zero.
 */
function wickLength(ohlc) {
  validate(ohlc);
  return ohlc.high - Math.max(ohlc.open, ohlc.close);
}

/**
 * Return the distance between `open` and `low` in a bullish OHLC candlestick,
 * or between `close` and `low` in a bearish OHLC candlestick.
 *
 * @param ohlc An object including at least the following properties:
 *
 * `{ open: Number, low: Number, close: Number }`
 */
function tailLength(ohlc) {
  validate(ohlc);
  return Math.min(ohlc.open, ohlc.close) - ohlc.low;
}

/**
 * Return the distance between `close` and `low` in a bullish OHLC candlestick,
 * or between `open` and `low` in a OHLC candlestick.
 *
 * @param ohlc An object including at least the following properties:
 *
 * `{ open: Number, close: Number }`
 */
function isBullish(ohlc) {
  validate(ohlc);
  return ohlc.open < ohlc.close;
}

/**
 * Return body length of the candlestick.
 * @param ohlc Object including the following properties:
 *
 * `{ open: Number, high: Number, low: Number, close: Number }`
 */
function isBearish(ohlc) {
  validate(ohlc);
  return ohlc.open > ohlc.close;
}

/**
 * Return body length of the candlestick.
 * @param ohlc Object including the following properties:
 *
 * `{ open: Number, high: Number, low: Number, close: Number }`
 */
function isHammerLike(ohlc) {
  validate(ohlc);
  return tailLength(ohlc) > (bodyLength(ohlc) * 2)
    && wickLength(ohlc) < bodyLength(ohlc);
}

/**
 * Return body length of the candlestick.
 * @param ohlc Object including the following properties:
 *
 * `{ open: Number, high: Number, low: Number, close: Number }`
 */
function isInvertedHammerLike(ohlc) {
  validate(ohlc);
  return wickLength(ohlc) > (bodyLength(ohlc) * 2)
    && tailLength(ohlc) < bodyLength(ohlc);
}

/**
 * Return body length of the candlestick.
 * @param ohlc Object including the following properties:
 *
 * `{ open: Number, high: Number, low: Number, close: Number }`
 */
function isEngulfed(shortest, longest) {
  validate(ohlc);
  return bodyLength(shortest) < bodyLength(longest);
}

/**
 * Return body length of the candlestick.
 * @param ohlc Object including the following properties:
 *
 * `{ open: Number, high: Number, low: Number, close: Number }`
 */
function isGap(lowest, upmost) {
  validate(ohlc);
  return Math.max(lowest.open, lowest.close) < Math.min(upmost.open, upmost.close);
}

/**
 * Return body length of the candlestick.
 * @param ohlc Object including the following properties:
 *
 * `{ open: Number, high: Number, low: Number, close: Number }`
 */
function isGapUp(previous, current) {
  validate(ohlc);
  return isGap(previous, current);
}

/**
 * Return body length of the candlestick.
 * @param ohlc Object including the following properties:
 *
 * `{ open: Number, high: Number, low: Number, close: Number }`
 */
function isGapDown(previous, current) {
  validate(ohlc);
  return isGap(current, previous);
}

// Dynamic array search for callback arguments.
function findPattern(dataArray, callback) {
  const upperBound = (dataArray.length - callback.length) + 1;
  const matches = [];

  for (let i = 0; i < upperBound; i++) {
    const args = [];

    // Read the leftmost j values at position i in array.
    // The j values are callback arguments.
    for (let j = 0; j < callback.length; j++) {
      args.push(dataArray[i + j]);
    }

    // Destructure args and find matches.
    if (callback(...args)) {
      matches.push(args[1]);
    }
  }

  return matches;
}

// Boolean pattern detection.
// @public

function isHammer(ohlc) {
  return isBullish(ohlc)
    && isHammerLike(ohlc);
}

function isInvertedHammer(ohlc) {
  return isBearish(ohlc)
    && isInvertedHammerLike(ohlc);
}

function isHangingMan(previous, current) {
  return isBullish(previous)
    && isBearish(current)
    && isGapUp(previous, current)
    && isHammerLike(current);
}

function isShootingStar(previous, current) {
  return isBullish(previous)
    && isBearish(current)
    && isGapUp(previous, current)
    && isInvertedHammerLike(current);
}

function isBullishEngulfing(previous, current) {
  return isBearish(previous)
    && isBullish(current)
    && isEngulfed(previous, current);
}

function isBearishEngulfing(previous, current) {
  return isBullish(previous)
    && isBearish(current)
    && isEngulfed(previous, current);
}

function isBullishHarami(previous, current) {
  return isBearish(previous)
    && isBullish(current)
    && isEngulfed(current, previous);
}

function isBearishHarami(previous, current) {
  return isBullish(previous)
    && isBearish(current)
    && isEngulfed(current, previous);
}

function isBullishKicker(previous, current) {
  return isBearish(previous)
    && isBullish(current)
    && isGapUp(previous, current);
}

function isBearishKicker(previous, current) {
  return isBullish(previous)
    && isBearish(current)
    && isGapDown(previous, current);
}

// Pattern detection in arrays.
// @public

function hammer(dataArray) {
  return findPattern(dataArray, isHammer);
}

function invertedHammer(dataArray) {
  return findPattern(dataArray, isInvertedHammer);
}

function hangingMan(dataArray) {
  return findPattern(dataArray, isShootingStar);
}

function shootingStar(dataArray) {
  return findPattern(dataArray, isShootingStar);
}

function bullishEngulfing(dataArray) {
  return findPattern(dataArray, isBullishEngulfing);
}

function bearishEngulfing(dataArray) {
  return findPattern(dataArray, isBearishEngulfing);
}

function bullishHarami(dataArray) {
  return findPattern(dataArray, isBullishHarami);
}

function bearishHarami(dataArray) {
  return findPattern(dataArray, isBearishHarami);
}

function bullishKicker(dataArray) {
  return findPattern(dataArray, isBullishKicker);
}

function bearishKicker(dataArray) {
  return findPattern(dataArray, isBearishKicker);
}

module.exports.isHammer = isHammer;
module.exports.isInvertedHammer = isInvertedHammer;
module.exports.isHangingMan = isHangingMan;
module.exports.isShootingStar = isShootingStar;
module.exports.isBullishEngulfing = isBullishEngulfing;
module.exports.isBearishEngulfing = isBearishEngulfing;
module.exports.isBullishHarami = isBullishHarami;
module.exports.isBearishHarami = isBearishHarami;
module.exports.isBullishKicker = isBullishKicker;
module.exports.isBearishKicker = isBearishKicker;

module.exports.hammer = hammer;
module.exports.invertedHammer = invertedHammer;
module.exports.hangingMan = hangingMan;
module.exports.shootingStar = shootingStar;
module.exports.bullishEngulfing = bullishEngulfing;
module.exports.bearishEngulfing = bearishEngulfing;
module.exports.bullishHarami = bullishHarami;
module.exports.bearishHarami = bearishHarami;
module.exports.bullishKicker = bullishKicker;
module.exports.bearishKicker = bearishKicker;
