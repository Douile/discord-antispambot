# Discord anti-spambot

## Requirements
Node > 10.15.0 and its relevant version of NPM

Before using make sure you run `npm install` in the directory containing `package.json`

## Configuration
All configuration options should be set in a file called `config.json`, you can see an example in `config.template.json`.

**WARNING**: Configuration options only reload when the bot is restarted

For moderator flags see [discord.js docs](https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS)

### Defaults
| Config option | value |
| ------------ | ----- |
| moderator_flag | `MANAGE_MESSAGES` |
| prefix | `!` |
| rule_time | `24` |
| rule_user_time | `24` |
| rule_file | `./rules.json` |


## Running
To run using node use `node ./index.js`

This command is what is run by the `start.sh` and `start.bat` scripts but you can use these if you prefer.
