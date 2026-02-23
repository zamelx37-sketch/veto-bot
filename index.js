require("dotenv").config();

/* ================= KEEP ALIVE ================= */

const express = require("express");
const app = express();

const PORT = process.env.PORT || 8000;

app.get("/", (req, res) => {
  res.send("✅ VETO BOT ONLINE");
});

app.listen(PORT, () => {
  console.log("🌍 Web server running on port " + PORT);
});

/* ================= DISCORD ================= */

const {
Client,
GatewayIntentBits,
ChannelType,
PermissionsBitField,
EmbedBuilder
} = require("discord.js");

const client = new Client({
  intents:[
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.TOKEN;
const CREATE_CHANNEL_ID = process.env.CREATE_CHANNEL_ID;

const roomOwners = new Map();

/* ================= READY ================= */

client.once("clientReady", () => {

console.log("👑 VETO SYSTEM READY");

client.user.setPresence({
  status:"online",
  activities:[{
    name:"Managing Veto Voice 🎙",
    type:0
  }]
});

});

/* ================= CREATE ROOM ================= */

client.on("voiceStateUpdate", async(oldState,newState)=>{

try{

if(!newState.channelId) return;
if(newState.channelId !== CREATE_CHANNEL_ID) return;

const member = newState.member;
if(!member) return;

const channel = await newState.guild.channels.create({
name:`⚡・${member.displayName}`,
type:ChannelType.GuildVoice,
parent:newState.channel.parentId,

permissionOverwrites:[
{
id:newState.guild.id,
allow:[
PermissionsBitField.Flags.Connect,
PermissionsBitField.Flags.ViewChannel
]
},
{
id:process.env.UNVERIFIED_ROLE_ID,
deny:[
PermissionsBitField.Flags.Connect
]
},
{
id:member.id,
allow:[
PermissionsBitField.Flags.Connect,
PermissionsBitField.Flags.ManageChannels,
PermissionsBitField.Flags.MoveMembers,
PermissionsBitField.Flags.MuteMembers,
PermissionsBitField.Flags.ViewChannel
]
}
]
});

await member.voice.setChannel(channel);
roomOwners.set(channel.id, member.id);
/* ================= VETO PANEL ================= */

const embed = new EmbedBuilder()
.setColor("#2b2d31")
.setAuthor({
name:"One Tap – Help Panel",
iconURL:client.user.displayAvatarURL()
})

.setThumbnail("attachment://VETO.png") // ✅ صورة صغيرة فوق ليسار

.setDescription(`
Need help managing your voice channel? Use the commands below.

━━━━━━━━━━━━━━━━━━

<:pen:1475466779445821440> **| name**
<:padlock:1475466815349198929> **| lock / unlock**
<:check:1475471936543785112> **| permit**
<:auth:1475471991858266172> **| permall**
<:forbidden:1475471815467073677> **| reject**

<:refresh:1475466704216920095> **| reset**
<:volume:1475466641755082752> **| soundboard**
<:hide:1475472028529197168> **| hide / unhide**

<:crown:1475472061693563104> **| owner**
<:close:1475466610281156800> **| transfer**

━━━━━━━━━━━━━━━━━━

<:transfer:1475481464324882523> **| transfer**
<:claim:1475481418506309732> **| claim**
<:status:1475481165254361251> **| status**
<:mute:1475481232719478827> **| tmute / tunmute**
<:remove:1475481135248310402> **| remove user**
<:waves:1475471843149217969> **| bitrate**
<:mic:1475481328462991561> **| slowmode**
<:forbidden:1475471815467073677> **| blacklist**
<:check:1475471936543785112> **| whitelist**
<:auth:1475471991858266172> **| role whitelist**
<:crown:1475472061693563104> **| co-owner**

━━━━━━━━━━━━━━━━━━
`)
.setTimestamp();

setTimeout(()=>{
channel.send({
embeds:[embed],
files:["./VETO.png"]
}).catch(()=>{});
},1000);
/* ================= AUTO DELETE ================= */

client.on("voiceStateUpdate", async(oldState)=>{

const channel = oldState.channel;
if(!channel) return;
if(!roomOwners.has(channel.id)) return;

if(channel.members.size === 0){
roomOwners.delete(channel.id);
await channel.delete().catch(()=>{});
console.log("🗑 ROOM AUTO DELETED");
}

});

/* ================= BASIC COMMANDS ================= */

client.on("messageCreate", async(message)=>{

if(message.author.bot) return;
if(!message.member.voice.channel) return;

const voiceChannel = message.member.voice.channel;
const ownerId = roomOwners.get(voiceChannel.id);

if(ownerId !== message.member.id) return;

const args = message.content.split(" ");
const cmd = args[0].toLowerCase();

if(cmd==="!lock"){
await voiceChannel.permissionOverwrites.edit(message.guild.id,{Connect:false});
message.reply("🔒 Locked");
}

if(cmd==="!unlock"){
await voiceChannel.permissionOverwrites.edit(message.guild.id,{Connect:true});
message.reply("🔓 Unlocked");
}

if(cmd==="!name"){
const name=args.slice(1).join(" ");
if(!name) return;
await voiceChannel.setName(`⚡・${name}`);
message.reply("✏️ Renamed");
}

});

/* ================= ANTI CRASH ================= */

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

client.login(TOKEN);