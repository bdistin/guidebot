// Load up the discord.js library
const Discord = require("discord.js");
// We also load the rest of the things we need in this file:
const { promisify } = require('util');
const readdir = promisify(require("fs").readdir);

module.exports = class GuideBot extends Discord.Client {

    /* 
    CONSTRUCTOR FUNCTION
    
    This is a very basic way to extend the Discord.js Client. This function is 
    called when in index.js we say const client = new GuideBot();.
    
    */
    constructor(options) {
        // Calls the Discord.Client Class with the options passed when doing new GuideBot();
        super(options);

        // Here we load the config.json file that contains our token and our prefix values. 
        this.config = require("./config.json");
        // client.config.token contains the bot's token
        // client.config.prefix contains the message prefix

        // Aliases and commands are put in collections where they can be read from,
        // catalogued, listed, etc.
        this.commands = new Discord.Collection();
        this.aliases = new Discord.Collection();
    }

    /* 
    lOGIN METHOD
    
    This is a method of extending the login method from the normal client.login.
    Since this method has the same name, in an instance of GuideBot this method will 
    be prefered over the parent class's login method.
    
    */
    async login(token) {
        // Here we load **commands** into memory, as a collection, so they're accessible
        // here and everywhere else. 
        const commands = await readdir('./commands/');
        this.log("log", `Loading a total of ${commands.length} commands.`);
        commands.forEach(f => {
            try {
            let props = require(`./commands/${f}`);
            this.log("log", `Loading Command: ${props.help.name}. 👌`);
            this.commands.set(props.help.name, props);
            props.conf.aliases.forEach(alias => {
                this.aliases.set(alias, props.help.name);
            });
            } catch (e) {
                this.log(`Unable to load command ${f}: ${e}`);
            }
        });

        // Then we load events, which will include our message and ready event.
        const events = await readdir('./events/')
        this.log("log", `Loading a total of ${events.length} events.`);
        events.forEach(file => {
            const eventName = file.split(".")[0];
            const event = require(`./events/${file}`);
            // This line is awesome by the way. Just sayin'.
            this.on(eventName, event.bind(null, this));
            delete require.cache[require.resolve(`./events/${file}`)];
        });

        // Here we login with the Discord.Client login method
        super.login(token);
    }


    /* 
    PERMISSION LEVEL METHOD
    
    This is a very basic permission system for commands which uses "levels"
    "spaces" are intentionally left black so you can add them if you want.
    NEVER GIVE ANYONE BUT OWNER THE LEVEL 10! By default this can run any
    command including the VERY DANGEROUS `eval` and `exec` commands!
    
    */
    permlevel(message) {
        let permlvl = 0;
        
        // If bot owner, return max perm level
        if(message.author.id === this.config.ownerID) return 10;
        
        // If DMs or webhook, return 0 perm level.
        if(!message.guild || !message.member) return 0;
        
        // The rest of the perms rely on roles. If those roles are not found
        // in the config, or the user does not have it, their level will be 0
        try {
            let modRole = message.guild.roles.find('name', this.config.modRoleName);
            if (modRole && message.member.roles.has(modRole.id)) permlvl = 2;
            let adminRole = message.guild.roles.find('name', this.config.adminRoleName);
            if (adminRole && message.member.roles.has(adminRole.id)) permlvl = 3;
        } catch (e) {
        // Mod names were not configured.
        permlvl = 0;
        }
        // Guild Owner gets an extra level, wooh!
        if(message.author.id === message.guild.owner.id) permlvl = 4;
        
        return permlvl;
    }

    /* 
    LOGGING METHOD
    
    Logs to console. Future patches may include time+colors
    */
    log(type, msg, title = "Log") {
        console.log(`[${type}] [${title}]${msg}`);
    }

    /* 
    SINGLE-LINE AWAITMESSAGE METHOD
    
    A simple way to grab a single reply, from the user that initiated
    the command. Useful to get "precisions" on certain things...
    
    USAGE
    
    const response = await client.awaitReply(msg, "Favourite Color?");
    msg.reply(`Oh, I really love ${response} too!`);
    
    */
    async awaitReply(msg, question, limit = 60000) {
        const filter = m=>m.author.id = msg.author.id;
        await msg.channel.send(question);
        try {
            const collected = await msg.channel.awaitMessages(filter, { max: 1, time: limit, errors: ['time'] });
            return collected.first().content;
        } catch(e) {
            return false;
        }
    }

    /* 
    MESSAGE CLEAN METHOD
    
    "Clean" removes @everyone pings, as well as tokens, and makes code blocks
    escaped so they're shown more easily. As a bonus it resolves promises
    and stringifies objects!
    This is mostly only used by the Eval and Exec commands.
    */
    async clean (text) {
        if (text && text.constructor.name == 'Promise')
        text = await text;
        if (typeof evaled !== 'string')
        text = require('util').inspect(text, {depth: 0});
        
        text = text
            .replace(/`/g, "`" + String.fromCharCode(8203))
            .replace(/@/g, "@" + String.fromCharCode(8203))
            .replace(this.token, "mfa.VkO_2G4Qv3T--NO--lWetW_tjND--TOKEN--QFTm6YGtzq9PH--4U--tG0");
        
        return text;
    }


};

/* MISCELANEOUS NON-CRITICAL FUNCTIONS */


// `await wait(1000);` to "pause" for 1 second. 
global.wait = require('util').promisify(setTimeout);


// Another semi-useful utility command, which creates a "range" of numbers
// in an array. `range(10).forEach()` loops 10 times for instance. Why?
// Because honestly for...i loops are ugly.
global.range = (count, start = 0) => {
    const myArr = [];
    for(var i = 0; i<count; i++) {
        myArr[i] = i+start;
    }
    return myArr;
};

// These 2 simply handle unhandled things. Like Magic. /shrug
process.on('uncaughtException', (err) => {
    let errorMsg = err.stack.replace(new RegExp(`${__dirname}\/`, 'g'), './');
    console.error("Uncaught Exception: ", errorMsg);
});

process.on("unhandledRejection", err => {
    console.error("Uncaught Promise Error: ", err);
});