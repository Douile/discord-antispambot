'use strict';

const FIELD_LIMIT = 25;

const { RichEmbed } = require('discord.js');

class PagedEmbed extends RichEmbed {
  addField(name, value, inline = false) {
    name = resolveString(name);
    if (name.length > 256) throw new RangeError('RichEmbed field names may not exceed 256 characters.');
    if (!/\S/.test(name)) throw new RangeError('RichEmbed field names may not be empty.');
    value = resolveString(value);
    if (value.length > 1024) throw new RangeError('RichEmbed field values may not exceed 1024 characters.');
    if (!/\S/.test(value)) throw new RangeError('RichEmbed field values may not be empty.');
    this.fields.push({ name, value, inline });
    return this;
  }
  async send(channel) {
    if (this.fields.length <= FIELD_LIMIT) {
      return await channel.send(this);
    }
    let pages = Math.ceil(this.fields.length / FIELD_LIMIT),
    fields = this.fields;
    for (let page=0;page<pages;page++) {
      let embed = new RichEmbed(this);
      embed.fields = fields.splice(0,FIELD_LIMIT);
      embed.setFooter(`${page+1}/${pages}`);
      await channel.send(embed);
    }
  }
}

module.exports = PagedEmbed;

function resolveString(data) {
  if (typeof data === 'string') return data;
  if (data instanceof Array) return data.join('\n');
  return String(data);
}
