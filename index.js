// Load up the extended discord.js client class
const GuideBot = require("./client.js");

// This is your client. Some people call it `bot`, some people call it `self`, 
// some might call it `cootchie`. Either way, when you see `client.something`, 
// or `bot.something`, this is what we're refering to. Your client.
const client = new GuideBot();

// Here we login the client.
client.login(client.config.token);
