const { Events, PermissionFlagsBits } = require('discord.js');
const { DEFAULT_PREFIX } = require('../config');

module.exports = {
  name: Events.MessageCreate,
  async execute(message, client) {
    // تجاهل رسائل البوتات
    if (message.author.bot) return;

    // تجاهل الرسائل خارج السيرفرات
    if (!message.guild) return;

    try {
      // جلب إعدادات السيرفر
      const serverSettings = await client.database.getServerSettings(message.guild.id);
      const prefix = serverSettings?.prefix || DEFAULT_PREFIX;

      // التحقق من الأمر العادي
      if (message.content.startsWith(prefix)) {
        await handlePrefixCommand(message, client, prefix, serverSettings);
      }

      // معالجة الردود على التذاكر
      await handleTicketReplies(message, client, serverSettings);

      // تحديث إحصائيات النشاط
      await updateUserStats(message, client);

    } catch (error) {
      console.error('❌ خطأ في معالجة الرسالة:', error);
    }
  }
};

// معالجة الأوامر العادية
async function handlePrefixCommand(message, client, prefix, serverSettings) {
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  // حذف رسالة الأمر
  try {
    await message.delete();
  } catch (error) {
    // إذا لم نستطع حذف الرسالة، نستمر
  }

  // الأوامر العادية
  switch (commandName) {
    case 'خط':
      await handleLineCommand(message, client, serverSettings);
      break;
    
    case 'say':
      await handleSayCommand(message, client, args, serverSettings);
      break;
    
    case 'embed':
      await handleEmbedCommand(message, client, args, serverSettings);
      break;
    
    case 'فحص':
      await handleStatsCommand(message, client, serverSettings);
      break;
    
    case 'تصفير':
      await handleResetCommand(message, client, args, serverSettings);
      break;
    
    case 'نداء':
      await handleCallCommand(message, client, args, serverSettings);
      break;
    
    case 'مهلة':
      await handleTimeoutCommand(message, client, serverSettings);
      break;
    
    case 'rename':
      await handleRenameCommand(message, client, args, serverSettings);
      break;

    default:
      // إذا كان الأمر غير معروف، تجاهل
      break;
  }
}

// معالجة الردود في التذاكر
async function handleTicketReplies(message, client, serverSettings) {
  const Ticket = require('../models/Ticket');
  const ticket = await Ticket.findOne({ 
    channelId: message.channel.id, 
    status: { $in: ['open', 'claimed'] } 
  });

  if (ticket) {
    // إذا كان المرسل هو صاحب التذكرة
    if (message.author.id === ticket.userId) {
      // إلغاء أي مهلة زمنية نشطة
      await cancelTicketTimeout(message.channel.id, client, ticket);
      
      // زيادة عداد الرسائل
      ticket.messageCount += 1;
      await ticket.save();
    }

    // تحديث إحصائيات المستخدم
    await updateUserActivity(message.author.id, message.guild.id, client);
  }
}

// تحديث إحصائيات المستخدم
async function updateUserStats(message, client) {
  const Stats = require('../models/Stats');
  
  try {
    await Stats.findOneAndUpdate(
      { guildId: message.guild.id, userId: message.author.id },
      { 
        $set: { userName: message.author.username },
        $inc: { 'activity.totalMessages': 1 },
        $set: { 'activity.lastActive': new Date() }
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('❌ خطأ في تحديث إحصائيات المستخدم:', error);
  }
}

// الدوال المساعدة للأوامر (سيتم تفصيلها لاحقاً)
async function handleLineCommand(message, client, serverSettings) {
  // سيتم تفصيلها في الأوامر
}

async function handleSayCommand(message, client, args, serverSettings) {
  // سيتم تفصيلها في الأوامر
}

// ... باقي الدوال المساعدة


// ========== دوال الأوامر العادية ==========

// أمر الخط
async function handleLineCommand(message, client, serverSettings) {
  if (!serverSettings.ticketSettings?.lineRole) {
    return message.channel.send('❌ لم يتم إعداد رتبة الخط بعد.');
  }

  const member = await message.guild.members.fetch(message.author.id);
  const hasLineRole = member.roles.cache.has(serverSettings.ticketSettings.lineRole);

  if (!hasLineRole) {
    return message.channel.send('❌ لا تملك صلاحية استخدام هذا الأمر.').then(msg => {
      setTimeout(() => msg.delete(), 5000);
    });
  }

  await message.channel.send(client.config.IMAGES.LINE_IMAGE);
}

// أمر say
async function handleSayCommand(message, client, args, serverSettings) {
  if (!serverSettings.ticketSettings?.adminRole) {
    return message.channel.send('❌ لم يتم إعداد رتبة المشرفين بعد.').then(msg => {
      setTimeout(() => msg.delete(), 5000);
    });
  }

  const member = await message.guild.members.fetch(message.author.id);
  const hasAdminRole = member.roles.cache.has(serverSettings.ticketSettings.adminRole);

  if (!hasAdminRole) {
    return message.channel.send('❌ لا تملك صلاحية استخدام هذا الأمر.').then(msg => {
      setTimeout(() => msg.delete(), 5000);
    });
  }

  const text = args.join(' ');
  if (!text) {
    return message.channel.send('❌ يرجى كتابة النص بعد الأمر.').then(msg => {
      setTimeout(() => msg.delete(), 5000);
    });
  }

  await message.channel.send(text);
}

// أمر embed
async function handleEmbedCommand(message, client, args, serverSettings) {
  if (!serverSettings.ticketSettings?.adminRole) {
    return message.channel.send('❌ لم يتم إعداد رتبة المشرفين بعد.').then(msg => {
      setTimeout(() => msg.delete(), 5000);
    });
  }

  const member = await message.guild.members.fetch(message.author.id);
  const hasAdminRole = member.roles.cache.has(serverSettings.ticketSettings.adminRole);

  if (!hasAdminRole) {
    return message.channel.send('❌ لا تملك صلاحية استخدام هذا الأمر.').then(msg => {
      setTimeout(() => msg.delete(), 5000);
    });
  }

  const text = args.join(' ');
  if (!text) {
    return message.channel.send('❌ يرجى كتابة النص بعد الأمر.').then(msg => {
      setTimeout(() => msg.delete(), 5000);
    });
  }

  const embed = new EmbedBuilder()
    .setDescription(text)
    .setColor(client.config.COLORS.PRIMARY)
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });
}

// أمر ticket
async function handleTicketCommand(message, client, serverSettings) {
  // هذا سيتم التعامل معه عبر النظام الرئيسي
  // يمكن إضافة منطق إضافي هنا إذا لزم الأمر
}

// أمر الفحص
async function handleStatsCommand(message, client, serverSettings) {
  if (!serverSettings.ticketSettings?.adminRole) {
    return message.channel.send('❌ لم يتم إعداد رتبة المشرفين بعد.').then(msg => {
      setTimeout(() => msg.delete(), 5000);
    });
  }

  const member = await message.guild.members.fetch(message.author.id);
  const hasAdminRole = member.roles.cache.has(serverSettings.ticketSettings.adminRole);

  if (!hasAdminRole) {
    return message.channel.send('❌ لا تملك صلاحية استخدام هذا الأمر.').then(msg => {
      setTimeout(() => msg.delete(), 5000);
    });
  }

  // استخدام الأمر السلاش بدلاً من ذلك
  await message.channel.send('🔧 يرجى استخدام الأمر `/فحص` للحصول على إحصائيات مفصلة.').then(msg => {
    setTimeout(() => msg.delete(), 5000);
  });
}

// أمر التصفير
async function handleResetCommand(message, client, args, serverSettings) {
  if (!serverSettings.ticketSettings?.adminRole) {
    return message.channel.send('❌ لم يتم إعداد رتبة المشرفين بعد.').then(msg => {
      setTimeout(() => msg.delete(), 5000);
    });
  }

  const member = await message.guild.members.fetch(message.author.id);
  const hasAdminRole = member.roles.cache.has(serverSettings.ticketSettings.adminRole);

  if (!hasAdminRole) {
    return message.channel.send('❌ لا تملك صلاحية استخدام هذا الأمر.').then(msg => {
      setTimeout(() => msg.delete(), 5000);
    });
  }

  // استخدام الأمر السلاش بدلاً من ذلك
  await message.channel.send('🔧 يرجى استخدام الأمر `/تصفير` لتصفير الإحصائيات.').then(msg => {
    setTimeout(() => msg.delete(), 5000);
  });
}

// أمر النداء
async function handleCallCommand(message, client, args, serverSettings) {
  const Ticket = require('../models/Ticket');
  const ticket = await Ticket.findOne({ 
    channelId: message.channel.id, 
    status: { $in: ['open', 'claimed'] } 
  });

  if (!ticket) {
    return message.channel.send('❌ هذا الأمر يعمل فقط داخل التذاكر.').then(msg => {
      setTimeout(() => msg.delete(), 5000);
    });
  }

  const text = args.join(' ');
  if (!text) {
    return message.channel.send('❌ يرجى كتابة رسالة النداء بعد الأمر.').then(msg => {
      setTimeout(() => msg.delete(), 5000);
    });
  }

  const callEmbed = new EmbedBuilder()
    .setTitle('📢 نداء عاجل')
    .setDescription(`**من: <@${message.author.id}>**\n\n${text}`)
    .setColor(client.config.COLORS.WARNING)
    .setTimestamp();

  await message.channel.send({ 
    content: `<@${ticket.userId}>`,
    embeds: [callEmbed] 
  });
}

// أمر المهلة
async function handleTimeoutCommand(message, client, serverSettings) {
  const Ticket = require('../models/Ticket');
  const ticket = await Ticket.findOne({ 
    channelId: message.channel.id, 
    status: { $in: ['open', 'claimed'] } 
  });

  if (!ticket) {
    return message.channel.send('❌ هذا الأمر يعمل فقط داخل التذاكر.').then(msg => {
      setTimeout(() => msg.delete(), 5000);
    });
  }

  await client.timeoutSystem.startTimeout(message.channel.id, ticket.userId, ticket.ticketId, 10);

  const timeoutEmbed = new EmbedBuilder()
    .setTitle('⏰ بدء المهلة الزمنية')
    .setDescription('تم بدء مهلة لمدة 10 دقائق.\nيرجى الرد داخل هذه القناة قبل انتهاء المهلة وإغلاق التذكرة.')
    .setColor(client.config.COLORS.WARNING)
    .setTimestamp();

  await message.channel.send({ embeds: [timeoutEmbed] });
}

// أمر تغيير الاسم
async function handleRenameCommand(message, client, args, serverSettings) {
  const Ticket = require('../models/Ticket');
  const ticket = await Ticket.findOne({ 
    channelId: message.channel.id, 
    status: { $in: ['open', 'claimed'] } 
  });

  if (!ticket) {
    return message.channel.send('❌ هذا الأمر يعمل فقط داخل التذاكر.').then(msg => {
      setTimeout(() => msg.delete(), 5000);
    });
  }

  const newName = args.join(' ');
  if (!newName) {
    return message.channel.send('❌ يرجى كتابة الاسم الجديد بعد الأمر.').then(msg => {
      setTimeout(() => msg.delete(), 5000);
    });
  }

  try {
    await message.channel.setName(newName);

    const renameEmbed = new EmbedBuilder()
      .setTitle('✏️ تغيير اسم التذكرة')
      .setDescription(`تم تغيير اسم التذكرة إلى: **${newName}**`)
      .setColor(client.config.COLORS.SUCCESS)
      .setTimestamp();

    await message.channel.send({ embeds: [renameEmbed] });

  } catch (error) {
    await message.channel.send('❌ حدث خطأ في تغيير اسم التذكرة.').then(msg => {
      setTimeout(() => msg.delete(), 5000);
    });
  }
}