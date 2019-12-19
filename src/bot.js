'use strict';

const discord = require('discord.js');
const Rule = require('./structs/Rule.js');
const RuleContainer = require('./structs/RuleContainer.js');
const AutoRuleContainer = require('./structs/AutoRuleContainer.js');
const PagedEmbed = require('./structs/PagedEmbed.js');
const { parseUserMention, regexEscape, timeString } = require('./util.js');
const { getHelpMessage, banReason } = require('./messages.js');
const client = new discord.Client({ fetchAllMembers: true, disabledEvents: [ 'TYPING_START', 'VOICE_STATE_UPDATE', 'WEBHOOKS_UPDATE', 'VOICE_SERVER_UPDATE', 'CHANNEL_PINS_UPDATE' ] });

var TOKEN = '';
var MODERATOR_FLAG = 'MANAGE_MESSAGES';
var PREFIX = '!';
var RULE_TIME = 24;
var RULE_USER_TIME = 24;
var RULE_FILE = './rules.json';
var AUTO_RULE_RATE = 60000; // 1 Minute
var AUTO_RULE_COUNT = 4;

const HOUR = 1000*60*60;

var RULES;
var AUTORULES = new AutoRuleContainer();

const commands = { /* Subcommands of main command !spamban */
  'new': async function(message, params) {
    let time = RULE_USER_TIME, length = RULE_TIME;
    for (let i=1;i<params.length;i++) {
      if (params[i-1].toLowerCase() === '-time') {
        time = parseInt(params[i]);
        if (isNaN(time)) time = RULE_USER_TIME;
        params.splice(i-1, 2);
      }
      if (params[i-1].toLowerCase() === '-length') {
        length = parseInt(params[i]);
        if (isNaN(length)) length = RULE_TIME;
        params.splice(i-1, 2);
      }
    }
    let regex = params.join(' ').trim();
    if (regex.length === 0) return await message.channel.send('You must provide a name rule');
    let response = await message.channel.send(`Banning all users matching \`/${regex}/i\` who were created in the past ${time} hours`);

    let rule = {
      guild: message.guild,
      creator: message.author.id,
      length: length*HOUR,
      regex: regex,
      created: Date.now(),
      time: time*HOUR
    };
    let banned = await Rule.enforce(rule, RULES);
    await response.edit(`Banned ${banned} users matching \`/${regex}/i\` who were created in the past ${time} hours\nRule active for ${RULE_TIME} hours`);
  },
  'delete': async function(message, params) {
    let a = params[0],
    id = Rule.parseID(a);
    if (isNaN(id)) return await message.channel.send(`${id} is not a valid number`);
    let deleted = [];
    if (RULES.has(id)) {
      deleted.push(RULES.get(id));
      RULES.delete(id);
      await RULES.save();
    }
    let embed = new PagedEmbed({ title: `Deleted ${deleted.length} rule(s)`});
    if (deleted.length === 0) embed.setDescription(`No rules matched ID ${id}`);
    for (let rule of deleted) {
      Rule.addEmbedField(rule, embed);
    }
    return await embed.send(message.channel);
  },
  'search': async function(message, params) {
    let embed = new PagedEmbed({ title: 'Matching rules' });
    for (let p of params) {
      let id;

      id = Rule.parseID(p);
      if (!isNaN(id)) {
        if (RULES.has(id)) Rule.addEmbedField(RULES.get(id), embed);
        else embed.addField('_ _', `No rule with ID #\`${id}\` exists`, false);
        continue;
      }

      id = parseUserMention(p);
      if (id !== null) {
        let rules = Array.from(RULES.values()).filter(r => r.creator === id);
        if (rules.length === 0) embed.addField('_ _', `No rules created by user <@!${id}>`);
        for (let rule of rules) {
          Rule.addEmbedField(rule, embed);
        }
        continue;
      }

      embed.addField('_ _', `Could not identify search term ${p}`, false);
    }
    return await embed.send(message.channel);
  },
  'list': async function(message) {
    let embed = new PagedEmbed();
    for (let rule of RULES.active()) {
      Rule.addEmbedField(rule, embed);
    }
    /* Set title after as active iterator removes rules that become inactive */
    embed.setTitle(`${RULES._active.length} Active spam rules`);
    return await embed.send(message.channel);
  },
  'help': async function(message, params) {
    let embed = new PagedEmbed({ title: 'Antispam help' });
    let done = false;
    for (let i=0;i<params.length;i++) {
      if (params[i] in commands) {
        embed.addField(params[i], getHelpMessage(params[i]), false);
        done = true;
      } else {
        embed.addField('Unknown command', `\`${params[i]}\``, false);
      }
    }
    if (!done) embed.addField('Commands', Object.getOwnPropertyNames(commands).map(v => ` • \`${v}\``).join('\n'), false);
    return await embed.send(message.channel);
  },
  'info': async function(message) {
    let embed = new PagedEmbed();
    let info = require('../package.json');
    embed.setTitle(`${info.name} info`);
    embed.addField('Environment', `[${info.name}](${info.homepage}) v${info.version}\nNode v${process.versions.node} (${process.platform}${process.arch})\n[Discord.js](https://discord.js.org) v${discord.version}`);
    embed.addField('Runtime', `Uptime: ${timeString(client.uptime)}\nPing: ${client.ping}ms`);
    embed.addField('_ _', 'Created by: <@!293482190031945739>');
    return await embed.send(message.channel);
  }
}

client.on('message', async function (message) {
  if (!message.member || !message.member.hasPermission(MODERATOR_FLAG)) return; /* Check message sent in guild by a moderator */
  if (!message.content.startsWith(`${PREFIX}spamban`)) return; /* Single command bot */

  let parts = message.content.split(' ').splice(1); /* Remove !spamban */
  if (parts.length === 0) return await commands.help(message, parts); /* If no subcommand is specified */
  if (parts[0].toLowerCase(0) in commands) return await commands[parts[0].toLowerCase()](message, parts.splice(1)); /* If subcommand is specified */
  return await commands.help(message, parts); /* If subcommand is unknown */
})

client.on('guildMemberAdd', async function(member) {
  /* Apply user created filters */
  for (let rule of RULES.active()) {
    if (Rule.filter(rule)(member)) { /* If member matches active rule ban them */
      /* At this point we return because we don't need to ban a user multiple times */
      return await member.guild.ban(member, {reason: banReason(rule)});
    }
  }
  /* Auto detect users with same name */
  for (let rule of AUTORULES.all()) {
    if(Rule.filter(rule)(member)) {
      rule.count += 1;
      rule.created = Date.now();
      if (rule.count >= AUTO_RULE_COUNT) {
        delete rule.count; // By deleting rule.count the next time generator is run this rule is deleted
        rule.length = RULE_TIME*HOUR;
        console.log(`Auto ban detection :: /${rule.regex}/i`);
        await Rule.enforce(rule, RULES);
      }
      return; // WARNING: Memory leak could be caused here if lots of matches occur as AUTORULES generator never reachs start of array to delete oldest auto rules
    }
  }

  /* User matched no active rules or auto rules so create new autorule */
  let rule = {
    guild: member.guild,
    creator: client.user.id,
    length: AUTO_RULE_RATE,
    regex: `^${regexEscape(member.user.username)}$`,
    created: Date.now(),
    time: RULE_USER_TIME*HOUR,
    count: 1
  };
  AUTORULES.push(rule);
})

client.on('ready', async function() {
  console.log(`Logged in ${client.user.username} [${client.user.id}]...`);
  let invite = await client.generateInvite('ADMINISTRATOR');
  console.log(`Invite link ${invite}`);
  try {
    RULES = await RuleContainer.load(RULE_FILE, client.guilds);
    console.log(`${RULES._active.length}/${RULES.size} active/total rules loaded`);
  } catch(e) {
    RULES = new RuleContainer();
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
  AUTO_RULE_RATE = opts.auto_rule_rate ? opts.auto_rule_rate : AUTO_RULE_RATE;
  AUTO_RULE_COUNT = opts.auto_rule_count ? opts.auto_rule_count : AUTO_RULE_COUNT;

  client.login(TOKEN).then(null).catch(console.error);
}
