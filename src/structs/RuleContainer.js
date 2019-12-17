'use strict';

const { writeJSON, readJSON } = require('../io.js');
const { valid } = require('./Rule.js');

class RuleContainer extends Map {
  constructor(iterable) {
    super(iterable);
    this._active = [];
    this._file;
  }
  addRule(rule) {
    if (!valid(rule)) return;
    this.set(rule.created, rule);
    if (rule.created+rule.length >= new Date().getTime()) {
      this._active.push(rule.created);
    }
  }
  *active() {
    let time = new Date().getTime();

    for (let i=this._active.length-1;i>=0;i--) {
      let key = this._active[i];
      if (!this.has(key)) continue;
      let rule = this.get(key);
      if (valid(rule) && rule.created+rule.length >= time) {
        yield rule;
      } else {
        this._active.slice(i);
      }
    }
  }
  static async load(file, guilds) {
    let cont = new RuleContainer();
    cont._file = file;
    let rules = [];
    try {
      rules = await readJSON(file);
    } catch(e) {
      console.warn(e);
    }
    try {
      for (let rule of rules) {
        /* Old rules don't have a length so set to one hour */
        if (typeof rule.length === 'undefined') rule.length = 1440000;
        if (!valid(rule)) continue;

        rule.guild = guilds.get(rule.guild);
        cont.addRule(rule);
      }
    } catch(e) {
      console.warn(e);
    }
    return cont;
  }
  async save(file) {
    if (!file) file = this._file;
    let values = Array.from(this.values()).map((v) => {
      v.guild = v.guild.id;
      return v;
    });
    await writeJSON(file, values);
  }
}

module.exports = RuleContainer;
