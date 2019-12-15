'use strict';

const discord = require('discord.js');
const { writeJSON, readJSON } = require('./io.js');
const { concatIterators, allSettled } = require('./util.js');
const { getHelpMessage } = require('./messages.js');
const client = new discord.Client({ fetchAllMembers: true, disabledEvents: [ 'TYPING_START', 'VOICE_STATE_UPDATE', 'WEBHOOKS_UPDATE', 'VOICE_SERVER_UPDATE', 'CHANNEL_PINS_UPDATE' ] });

var TOKEN = '';
var MODERATOR_FLAG = 'MANAGE_MESSAGES';
var PREFIX = '!';
var RULE_TIME = 24;
var RULE_USER_TIME = 24;
var RULE_FILE = './rules.json';

const HOUR = 1000*60;

let activeRules = new Array(),
inactiveRules = new Array();

const ruleFilter = (rule) => {
  return function(member) {
    let reg = new RegExp(rule.regex, 'i');
    return ( (member.nickname ? member.nickname : '').match(reg) !== null || member.user.username.match(reg) !== null) && member.user.createdTimestamp >= rule.created-rule.time;
  }
}

const enforceRule = async function(rule) {
  /* Add to member join handler */
  activeRules.push(rule);
  saveRules();
  /* Filter current members */
  let members = rule.guild.members.filter(ruleFilter(rule));
  const guild = rule.guild;
  let promises = members.map((member) => {
    return new Promise((resolve, reject) => {
      return guild.ban(member, {reason: 'Spambot'}).then(resolve).catch(reject);
    })
  });
  await allSettled(promises); /* Wait for all bans to finish */
  return promises.length;
}

const saveRules = async function() {
  let rules = [];
  for (let rule of concatIterators(activeRules, inactiveRules)) {
    rules.push({
      guild: rule.guild.id,
      creator: rule.creator,
      regex: rule.regex,
      created: rule.created,
      time: rule.time
    });
  }
  return await writeJSON(rules, RULE_FILE);
}

const loadRules = async function() {
  let rules = await readJSON(RULE_FILE);
  for (let rule of rules) {
    rule.guild = client.guilds.get(rule.guild);
    if (rule.created+rule.time >= new Date().getTime()) {
      activeRules.push(rule);
    } else {
      inactiveRules.push(rule);
    }
  }
}

const addRuleField = function(embed, rule) {
  embed.addField(`#${rule.created}`, `Rule: \`/${rule.regex}/i\`\nFor users created after: ${new Date(rule.created-rule.time).toUTCString()}\nCreated by: <@!${rule.creator}>\nExpires: ${new Date(rule.created+RULE_TIME*HOUR).toUTCString()}`, false);
}

const commands = { /* Subcommands of main command !spamban */
  'new': async function(message, params) {
    let time = RULE_USER_TIME;
    for (let i=1;i<params.length;i++) {
      if (params[i-1].toLowerCase() === '-time') {
        time = parseInt(params[i]);
        if (isNaN(time)) time = RULE_USER_TIME;
        params.splice(i-1, i);
      }
    }
    let regex = params.join(' ').trim();
    if (regex.length === 0) return await message.channel.send('You must provide a name rule');
    let response = await message.channel.send(`Banning all users matching \`/${regex}/i\` who were created in the past ${time} hours`);

    let rule = {
      guild: message.guild,
      creator: message.author.id,
      regex: regex,
      created: new Date().getTime(),
      time: time*HOUR
    };
    let banned = await enforceRule(rule);
    await response.edit(`Banned ${banned} users matching \`/${regex}/i\` who were created in the past ${time} hours\nRule active for ${RULE_TIME} hours`);
  },
  'delete': async function(message, params) {
    let a = params[0],
    time = parseInt(a.startsWith('#') ? a.substr(1) : a);
    if (isNaN(time)) return await message.channel.send(`${time} is not a valid number`);
    let deleted = [];
    activeRules = activeRules.filter((rule) => {
      if (rule.created === time) {
        deleted.push(rule);
        return false;
      }
      return true;
    });
    await saveRules();
    let embed = new discord.RichEmbed({ title: `Deleted ${deleted.length} rule(s)`});
    if (deleted.length === 0) embed.setDescription(`No rules matched ID ${time}`);
    for (let rule of deleted) {
      addRuleField(embed, rule);
    }
    return await message.channel.send(embed);
  },
  'list': async function(message) {
    let embed = new discord.RichEmbed({ title: `${activeRules.length} Active spam rules` });
    for (let rule of activeRules) {
      addRuleField(embed, rule);
    }
    await message.channel.send(embed);
  },
  'help': async function(message, params) {
    let embed = new discord.RichEmbed({ title: 'Antispam help' });
    let done = false;
    for (let i=0;i<params.length;i++) {
      if (params[i] in commands) {
        embed.addField(params[i], getHelpMessage(params[i]), false);
        done = true;
        break;
      } else {
        embed.addField('Unknown command', `\`${params[i]}\``, false);
      }
    }
    if (!done) embed.addField('Commands', Object.getOwnPropertyNames(commands).map(v => ` • \`${v}\``).join('\n'), false);
    await message.channel.send(embed);
  }
}

client.on('message', async function (message) {
  if (!message.member || !message.member.hasPermission(MODERATOR_FLAG)) return; /* Check message sent in guild by a moderator */
  if (!message.content.startsWith(`${PREFIX}spamban`)) return; /* Single command bot */

  let parts = message.content.split(' ').splice(1); /* Remove !spamban */
  if (parts.length === 0) return commands.help(message, parts); /* If no subcommand is specified */
  if (parts[0].toLowerCase(0) in commands) return commands[parts[0].toLowerCase()](message, parts.splice(1)); /* If subcommand is specified */
  return commands.help(message, parts); /* If subcommand is unknown */
})

client.on('guildMemberAdd', async function(member) {
  /* Filter joining members */
  for (let i=activeRules.length-1;i>=0;i--) {
    let rule = activeRules[i];
    /* Move old rules to inactiveRules */
    if (rule.created < new Date().time-(HOUR*RULE_TIME)) {
      inactiveRules.push(rule);
      activeRules.splice(i, 1);
    } else if (ruleFilter(rule)(member)) { /* If member matches active rule ban them */
      /* At this point we return because we don't need to ban a user multiple times */
      return await member.guild.ban(member, {reason: 'Spambot'});
    }
  }
})

client.on('ready', async function() {
  console.log(`Logged in ${client.user.username} [${client.user.id}]...`);
  let invite = await client.generateInvite('ADMINISTRATOR');
  console.log(`Invite link ${invite}`);
  try {
    await loadRules();
    console.log(`${activeRules.length}/${inactiveRules.length} active/inactive rules loaded`);
  } catch(e) {
    console.warn('Unable to load rules', e);
  }
})

module.exports = function(opts) {
  opts = opts ? opts : {};
  TOKEN = opts.token ? opts.token : TOKEN;
  MODERATOR_FLAG = opts.mod_flag ? opts.mod_flag : MODERATOR_FLAG;
  PREFIX = opts.prefix ? opts.prefix : PREFIX;
  RULE_TIME = opts.rule_time ? opts.rule_time : RULE_TIME;
  RULE_USER_TIME = opts.rule_user_time ? opts.rule_user_time : RULE_USER_TIME;

  client.login(TOKEN).then(null).catch(console.error);
}
