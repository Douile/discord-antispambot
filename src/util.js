'use strict';

/* Join iterators into a single iterator */
exports.concatIterators = function *() {
  for (let iter of arguments) {
    for (let v of iter) {
      yield v;
    }
  }
}

/* Polyfill for Promise.allSettled as it is not supported until Node v12.9.0 */
exports.allSettled = function(promises) {
  var count = 0, size = promises.length, responses = new Array(size);
  return new Promise((resolve) => {
    for (let i=0;i<size;i++) {
      let onFufilled = () => {
        let res = Array.from(arguments);
        if (res.length === 1) res = res[0];
        responses[i] = res;
        count += 1;
        if (count >= size) resolve(responses);
      }
      promises[i].then(onFufilled).catch(onFufilled);
    }
  });
}

exports.parseUserMention = function(text) {
  let match = text.match(/<@!?([0-9]+)>/);
  if (match === null) return;
  return match[1];
}

/* Escape all regex special characters */
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Using_special_characters
exports.regexEscape = function(string) {
  if (typeof string !== 'string') throw new TypeError('Argument must be a string');
  return string.replace(/([[\]\\^$.|?*+(){}])/g, '\\$1');
}

exports.timeString = function(time) {
  if (typeof time !== 'number' || isNaN(time) || time <= 0) throw new Error(`Invalid time ${time}`);
  let divisors = [24*60*60*1000, 60*60*1000, 60*1000, 1000, 1];
  let prefixes = ['days', 'hours', 'mins', 'secs', 'msecs'];
  let output = [];

  for (let i=0;i<divisors.length;i++) {
    let part = Math.floor(time/divisors[i]);
    if (part > 0) {
      output.push(part.toString()+prefixes[i]);
      time = time % divisors[i];
    }
  }
  return output.join(' ');
}
