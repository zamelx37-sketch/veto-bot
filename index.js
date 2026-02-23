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
const UNVERIFIED_ROLE_ID = process.env.UNVERIFIED_ROLE_ID;

const roomOwners = new Map();

/* ================= READY ================= */

client.once("clientReady", async () => {

console.log("👑 VETO SYSTEM READY");

client.user.setPresence({
  status: "online",
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
id:UNVERIFIED_ROLE_ID,
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

/* ========= VETO PANEL ========= */

const embed = new EmbedBuilder()
.setColor("#ff0000")
.setTitle("👑 VETO — Voice Control Panel")
.setDescription(`
Manage your private voice channel easily.

━━━━━━━━━━━━━━━━━━

✏️ !rename — change room name  
🔒 !lock / !unlock — lock room  
👻 !hide / !unhide — hide room  
👥 !limit — set user limit  
📊 !info — room info  

👢 !kick @user  
🎤 !mute @user  
🔊 !unmute @user  

💣 !nuke — kick everyone  
🗑️ !delete — delete room

━━━━━━━━━━━━━━━━━━
`)
.setImage("attachment://VETO.png")
.setTimestamp();

setTimeout(async ()=>{
await channel.send({
embeds:[embed],
files:["./VETO.png"]
}).catch(()=>{});
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

if(cmd==="!hide"){
await voiceChannel.permissionOverwrites.edit(message.guild.id,{ViewChannel:false});
message.reply("👻 Room Hidden");
}

if(cmd==="!unhide"){
await voiceChannel.permissionOverwrites.edit(message.guild.id,{ViewChannel:true});
message.reply("👁 Room Visible");
}

if(cmd==="!limit"){
const limit=parseInt(args[1]);
if(!limit) return;
await voiceChannel.setUserLimit(limit);
message.reply(`👥 Limit → ${limit}`);
}

if(cmd==="!rename"){
const name=args.slice(1).join(" ");
if(!name) return;
await voiceChannel.setName(`⚡・${name}`);
message.reply("✏ Room Renamed");
}

if(cmd==="!info"){
message.reply(`📊 ${voiceChannel.name} | 👥 ${voiceChannel.members.size}`);
}

if(cmd==="!kick"){
const user=message.mentions.members.first();
if(!user) return;
await user.voice.disconnect();
message.reply("👢 Member Kicked");
}

if(cmd==="!mute"){
const user=message.mentions.members.first();
if(!user) return;
await user.voice.setMute(true);
message.reply("🎤 Muted");
}

if(cmd==="!unmute"){
const user=message.mentions.members.first();
if(!user) return;
await user.voice.setMute(false);
message.reply("🔊 Unmuted");
}

if(cmd==="!nuke"){
voiceChannel.members.forEach(m=>{
if(m.id!==message.member.id) m.voice.disconnect();
});
message.reply("💣 Room Cleaned");
}

if(cmd==="!delete"){
roomOwners.delete(voiceChannel.id);
await voiceChannel.delete();
}

}catch(err){
console.error("COMMAND ERROR:",err);
}

});

/* ================= ANTI CRASH ================= */

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

client.login(TOKEN);