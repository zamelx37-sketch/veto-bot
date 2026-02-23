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
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences
  ]
});

const TOKEN = process.env.TOKEN;
const CREATE_CHANNEL_ID = process.env.CREATE_CHANNEL_ID;

const roomOwners = new Map();

/* ================= READY ================= */

client.once("clientReady", async () => {

console.log("👑 VETO SYSTEM READY");

client.user.setPresence({
  status: "online",
  activities: [{
    name: " Managing Veto Voice🎙 ",
    type: 0
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
if(!newState.channel) return;

const channel = await newState.guild.channels.create({
name:`⚡・${member.displayName}`,
type:ChannelType.GuildVoice,
parent:newState.channel?.parentId,

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
PermissionsBitField.Flags.Connect,
PermissionsBitField.Flags.ViewChannel
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

/* ========= PANEL ========= */

const embed = new EmbedBuilder()
.setColor("#ff0000")
.setTitle("𝑽𝑬𝑻𝑶")
.setDescription("Voice Room Panel Ready")
.setTimestamp();

setTimeout(()=>{
channel.send({embeds:[embed]}).catch(()=>{});
},1000);

}catch(err){
console.error("ROOM CREATE ERROR:",err);
}

});

/* ================= AUTO DELETE ================= */

client.on("voiceStateUpdate", async(oldState)=>{

try{

const channel = oldState.channel;
if(!channel) return;
if(!roomOwners.has(channel.id)) return;

if(channel.members.size === 0){
roomOwners.delete(channel.id);
await channel.delete().catch(()=>{});
console.log("🗑 ROOM AUTO DELETED");
}

}catch(err){
console.error("AUTO DELETE ERROR:",err);
}

});

/* ================= COMMANDS ================= */

client.on("messageCreate", async(message)=>{

try{

if(message.author.bot) return;
if(!message.member.voice.channel) return;

const voiceChannel = message.member.voice.channel;
const ownerId = roomOwners.get(voiceChannel.id);

if(!ownerId) return;
if(ownerId !== message.member.id)
return message.reply("❌ Only Room Owner");

const args = message.content.split(" ");
const cmd = args[0].toLowerCase();

if(cmd==="!lock"){
await voiceChannel.permissionOverwrites.edit(message.guild.id,{Connect:false});
message.reply("🔒 Room Locked");
}

if(cmd==="!unlock"){
await voiceChannel.permissionOverwrites.edit(message.guild.id,{Connect:true});
message.reply("🔓 Room Unlocked");
}

}catch(err){
console.error("COMMAND ERROR:",err);
}

});

/* ================= ANTI CRASH ================= */

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

client.login(TOKEN);