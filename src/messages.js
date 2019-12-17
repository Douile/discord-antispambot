'use strict';

const HELP_MESSAGES = {
  'new': 'Create a new spamban rule `new [-time TIME] [-length LENGTH] {RULE}`\nTIME - an optional argument specifying the time restriction for when accounts where created\nLENGTH - an optional argument specifying how long in hours the rule will be active\nRULE - A regex rule for the name or nickname of accounts (for help see <https://regexr.com>)',
  'delete': 'Delete a rule `delete {RULEID}`\nRULEID - The ID outputted by the list command (time rule was created in unix)',
  'search': 'Search all rules that haven\' been deleted `search {TERM}...`\nTERM - Either a rule ID or user (via mention)',
  'list': 'List the currently active rules',
  'help': 'Print help messages for all commands specified `help {COMMAND}...`\nCOMMAND - exact name of subcommand\nDon\'t specify any commands if you wish to list all commands'
}

exports.getHelpMessage = function(command) {
  if (command in HELP_MESSAGES) {
    return HELP_MESSAGES[command];
  }
  return 'COULD_NOT_FIND_HELP_MESSAGE';
}

exports.banReason = function(rule) {
  return `Spambot rule #${rule.created}`;
}
