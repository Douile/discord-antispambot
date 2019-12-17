'use strict';

/* Join iterators into a single iterator */
module.exports.concatIterators = function *() {
  for (let iter of arguments) {
    for (let v of iter) {
      yield v;
    }
  }
}

/* Polyfill for Promise.allSettled as it is not supported until Node v12.9.0 */
module.exports.allSettled = function(promises) {
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
