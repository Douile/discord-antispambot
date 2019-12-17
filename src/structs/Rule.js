'use strict';

const { allSettled } = require('../util.js');

const filter = function(rule) {
  return function(member) {
    let reg = new RegExp(rule.regex, 'i');
    return ( (member.nickname ? member.nickname : '').match(reg) !== null || member.user.username.match(reg) !== null) && member.user.createdTimestamp >= rule.created-rule.time;
  }
}

const enforce = async function(rule, container) {
  /* Add to member join handler */
  container.addRule(rule);
  await container.save();
  /* Filter current members */
  const guild = rule.guild;
  let members = guild.members.filter(filter(rule));
  let promises = members.map((member) => {
    return new Promise((resolve, reject) => {
      return guild.ban(member, {reason: banReason(rule)}).then(resolve).catch(reject);
    })
  });
  await allSettled(promises); /* Wait for all bans to finish */
  return promises.length;
}

const addEmbedField = function(rule, embed) {
  embed.addField(`#${rule.created}`, `Rule: \`/${rule.regex}/i\`\nFor users created after: ${new Date(rule.created-rule.time).toUTCString()}\nCreated by: <@!${rule.creator}>\nExpires: ${new Date(rule.created+rule.length).toUTCString()}`, false);
}

const valid = function(rule) {
  return (['object', 'string'].includes(typeof rule.guild)) &&
    (typeof rule.creator === 'string') &&
    (typeof rule.length === 'number') &&
    (typeof rule.regex === 'string') &&
    (typeof rule.created === 'number') &&
    (typeof rule.time === 'number');
}

const parseID = function(text) {
  return parseInt(text.startsWith('#') ? text.substr(1) : text);
}

exports.filter = filter;
exports.enforce = enforce;
exports.addEmbedField = addEmbedField;
exports.valid = valid;
exports.parseID = parseID;
