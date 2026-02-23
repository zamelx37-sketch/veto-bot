require("dotenv").config();

/* ================= KOYEB KEEP ALIVE ================= */

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
    GatewayIntentBits.GuildPresences // 
  ]
});

const TOKEN = process.env.TOKEN;
const CREATE_CHANNEL_ID = process.env.CREATE_CHANNEL_ID;

const roomOwners = new Map();
client.once("clientReady", async () => {

console.log("👑 VETO SYSTEM READY");

/* ===== PRESENCE ===== */
client.user.setPresence({
  status: "online",
  activities: [{
    name: " Managing Veto Voice🎙 ",
    type: 0
  }]
});

/* ===== DIAGNOSTIC ===== */
setTimeout(() => {
console.log("========== BOT DIAGNOSTIC ==========");
console.log("Bot Tag:", client.user.tag);
console.log("Bot ID:", client.user.id);
console.log("Status:", client.user.presence?.status);
console.log("Guilds:", client.guilds.cache.size);
console.log("====================================");
}, 5000);

});



/* ================= CREATE ROOM ================= */

client.on("voiceStateUpdate", async(oldState,newState)=>{

if(!newState.channelId) return;
if(newState.channelId !== CREATE_CHANNEL_ID) return;

const member = newState.member;

const channel = await newState.guild.channels.create({
name:`⚡・${member.displayName}`,
type:ChannelType.GuildVoice,
parent:newState.channel.parent,

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


/* ========= PANEL (MA TBDEL WALO) ========= */

const embed = new EmbedBuilder()
.setColor("#ff0000")
.setTitle("𝑽𝑬𝑻𝑶")
.setDescription(`

╭━━ 🔐 𝑹𝑶𝑶𝑴 ━━╮
🔒 ・!𝒍𝒐𝒄𝒌
🔓 ・!𝒖𝒏𝒍𝒐𝒄𝒌
👻 ・!𝒉𝒊𝒅𝒆
👁 ・!𝒖𝒏𝒉𝒊𝒅𝒆

╭━━ ⚙ 𝑺𝑬𝑻𝑻𝑰𝑵𝑮 ━━╮
👥 ・!𝒍𝒊𝒎𝒊𝒕
✏ ・!𝒓𝒆𝒏𝒂𝒎𝒆
📊 ・!𝒊𝒏𝒇𝒐

╭━━ 🎙 𝑪𝑶𝑵𝑻𝑹𝑶𝑳 ━━╮
👢 ・!𝒌𝒊𝒄𝒌
🎤 ・!𝒎𝒖𝒕𝒆
🔊 ・!𝒖𝒏𝒎𝒖𝒕𝒆

╭━━ 💣 𝑨𝑫𝑽𝑨𝑵𝑪𝑬𝑫 ━━╮
💣 ・!𝒏𝒖𝒌𝒆
🗑 ・!𝒅𝒆𝒍𝒆𝒕𝒆

✨ 𝑫𝒆𝒗𝒆𝒍𝒐𝒑𝒆𝒅 𝒃𝒚 𝑴𝒂𝒏𝒂𝒇
`)
.setTimestamp();

setTimeout(()=>{
channel.send({embeds:[embed]}).catch(()=>{});
},1000);

});


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


/* ================= COMMANDS ================= */

client.on("messageCreate", async(message)=>{

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
message.reply("🔒 𝑹𝒐𝒐𝒎 𝑳𝒐𝒄𝒌𝒆𝒅");
}

if(cmd==="!unlock"){
await voiceChannel.permissionOverwrites.edit(message.guild.id,{Connect:true});
message.reply("🔓 𝑹𝒐𝒐𝒎 𝑼𝒏𝒍𝒐𝒄𝒌𝒆𝒅");
}

if(cmd==="!hide"){
await voiceChannel.permissionOverwrites.edit(message.guild.id,{ViewChannel:false});
message.reply("👻 𝑹𝒐𝒐𝒎 𝑯𝒊𝒅𝒅𝒆𝒏");
}

if(cmd==="!unhide"){
await voiceChannel.permissionOverwrites.edit(message.guild.id,{ViewChannel:true});
message.reply("👁 𝑹𝒐𝒐𝒎 𝑽𝒊𝒔𝒊𝒃𝒍𝒆");
}

if(cmd==="!limit"){
const limit=parseInt(args[1]);
if(!limit) return;
await voiceChannel.setUserLimit(limit);
message.reply(`👥 𝑳𝒊𝒎𝒊𝒕 → ${limit}`);
}

if(cmd==="!rename"){
const name=args.slice(1).join(" ");
if(!name) return;
await voiceChannel.setName(`⚡・${name}`);
message.reply("✏ 𝑹𝒐𝒐𝒎 𝑹𝒆𝒏𝒂𝒎𝒆𝒅");
}

if(cmd==="!info"){
message.reply(`📊 ${voiceChannel.name} | 👥 ${voiceChannel.members.size}`);
}

if(cmd==="!kick"){
const user=message.mentions.members.first();
if(!user) return;
await user.voice.disconnect();
message.reply("👢 𝑴𝒆𝒎𝒃𝒆𝒓 𝑲𝒊𝒄𝒌𝒆𝒅");
}

if(cmd==="!mute"){
const user=message.mentions.members.first();
if(!user) return;
await user.voice.setMute(true);
message.reply("🎤 𝑴𝒖𝒕𝒆𝒅");
}

if(cmd==="!unmute"){
const user=message.mentions.members.first();
if(!user) return;
await user.voice.setMute(false);
message.reply("🔊 𝑼𝒏𝒎𝒖𝒕𝒆𝒅");
}

if(cmd==="!nuke"){
voiceChannel.members.forEach(m=>{
if(m.id!==message.member.id) m.voice.disconnect();
});
message.reply("💣 𝑹𝒐𝒐𝒎 𝑪𝒍𝒆𝒂𝒏𝒆𝒅");
}

if(cmd==="!delete"){
roomOwners.delete(voiceChannel.id);
await voiceChannel.delete();
}
F
});

client.login(TOKEN);
