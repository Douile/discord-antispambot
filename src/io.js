'use strict';

const fs = require('fs');

exports.writeJSON = function(file, object) {
  return new Promise((resolve,reject) => {
    let text;
    try {
      text = JSON.stringify(object);
    } catch(e) {
      return reject(e);
    }
    fs.writeFile(file, text, (err) => {
      if (err) return reject(err);
      resolve(file);
    });
  });
}

exports.readJSON = function(file) {
  return new Promise((resolve,reject) => {
    fs.readFile(file, (err,text) => {
      if (err) return reject(err);
      let object;
      try {
        object = JSON.parse(text);
      } catch(e) {
        return reject(e);
      }
      resolve(object);
    })
  })
}
