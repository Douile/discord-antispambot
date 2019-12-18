'use strict';

class AutoRuleContainer extends Array {
  *all() {
    let time = new Date().getTime();
    for (let i=this.length-1;i>=0;i--) {
      let rule = this[i];
      if (typeof rule.count === 'number' && rule.created+rule.length >= time) {
        yield rule;
      } else {
        this.splice(i,1);
      }
    }
  }
}

module.exports = AutoRuleContainer;
