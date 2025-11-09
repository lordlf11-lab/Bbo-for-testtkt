const { Events } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    // معالجة الأوامر السلاش
    if (interaction.isChatInputCommand()) {
      const command = client.slashCommands.get(interaction.commandName);

      if (!command) {
        console.error(`❌ أمر غير معروف: ${interaction.commandName}`);
        return interaction.reply({ 
          content: '❌ هذا الأمر غير متوفر حالياً.', 
          ephemeral: true 
        });
      }

      // التحقق من صلاحيات الأوامر الخاصة
      if (command.requiredPermissions) {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const hasPermission = command.requiredPermissions.some(perm => 
          member.permissions.has(perm)
        );

        if (!hasPermission) {
          return interaction.reply({ 
            content: '❌ لا تملك الصلاحيات اللازمة لاستخدام هذا الأمر.', 
            ephemeral: true 
          });
        }
      }

      // تنفيذ الأمر
      try {
        console.log(`🔧 تشغيل أمر: ${interaction.commandName} بواسطة ${interaction.user.tag}`);
        await command.execute(interaction, client);
      } catch (error) {
        console.error(`❌ خطأ في تنفيذ ${interaction.commandName}:`, error);
        
        const errorEmbed = {
          color: client.config.COLORS.ERROR,
          title: '❌ حدث خطأ',
          description: 'حدث خطأ غير متوقع أثناء تنفيذ الأمر.',
          timestamp: new Date()
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
          await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
      }
    }

    // معالجة الأزرار
    else if (interaction.isButton()) {
      await handleButtonInteraction(interaction, client);
    }

    // معالجة القوائم المنسدلة
    else if (interaction.isStringSelectMenu()) {
      await handleSelectMenuInteraction(interaction, client);
    }

    // معالجة النماذج
    else if (interaction.isModalSubmit()) {
      await handleModalInteraction(interaction, client);
    }
  }
};

// معالجة الأزرار
async function handleButtonInteraction(interaction, client) {
  const { customId } = interaction;

  try {
    // أزرار نظام التذاكر
    if (customId === 'open_ticket_btn') {
      await handleOpenTicketButton(interaction, client);
    }
    else if (customId.startsWith('claim_ticket')) {
      await handleClaimTicketButton(interaction, client);
    }
    else if (customId.startsWith('close_ticket')) {
      await handleCloseTicketButton(interaction, client);
    }
    else if (customId.startsWith('hide_ticket')) {
      await handleHideTicketButton(interaction, client);
    }
    else if (customId.startsWith('admin_helper')) {
      await handleAdminHelperButton(interaction, client);
    }
    else if (customId === 'confirm_close') {
      await handleConfirmCloseButton(interaction, client);
    }
    else if (customId === 'cancel_close') {
      await handleCancelCloseButton(interaction, client);
    }
    else {
      await interaction.reply({ 
        content: '❌ هذا الزر لم يعد نشطاً.', 
        ephemeral: true 
      });
    }
  } catch (error) {
    console.error('❌ خطأ في معالجة الزر:', error);
    await interaction.reply({ 
      content: '❌ حدث خطأ في معالجة هذا الزر.', 
      ephemeral: true 
    });
  }
}

// معالجة القوائم المنسدلة
async function handleSelectMenuInteraction(interaction, client) {
  const { customId } = interaction;

  try {
    if (customId === 'select_ticket_type') {
      await handleTicketTypeSelect(interaction, client);
    }
    else if (customId === 'ticket_options') {
      await handleTicketOptionsSelect(interaction, client);
    }
  } catch (error) {
    console.error('❌ خطأ في معالجة القائمة:', error);
    await interaction.reply({ 
      content: '❌ حدث خطأ في معالجة هذا الخيار.', 
      ephemeral: true 
    });
  }
}

// معالجة النماذج
async function handleModalInteraction(interaction, client) {
  const { customId } = interaction;

  try {
    if (customId.startsWith('ticket_reason_')) {
      await handleTicketReasonModal(interaction, client);
    }
    else if (customId.startsWith('setup_')) {
      await handleSetupModal(interaction, client);
    }
  } catch (error) {
    console.error('❌ خطأ في معالجة النموذج:', error);
    await interaction.reply({ 
      content: '❌ حدث خطأ في معالجة هذا النموذج.', 
      ephemeral: true 
    });
  }
}

// الدوال المساعدة للتفاعلات (سيتم تفصيلها لاحقاً)
async function handleOpenTicketButton(interaction, client) {
  // سيتم تفصيلها في نظام التذاكر
}

async function handleClaimTicketButton(interaction, client) {
  // سيتم تفصيلها في نظام التذاكر
}

// ========== الدوال المساعدة للتفاعلات ==========
// زر فتح التذكرة
async function handleOpenTicketButton(interaction, client) {
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('select_ticket_type')
    .setPlaceholder('اختر نوع التذكرة')
    .addOptions([
      { 
        label: 'طـلـب دعـم فـنـي', 
        description: 'فتح تذكرة دعم فني', 
        value: 'support', 
        emoji: '📩' 
      },
      { 
        label: 'طلب إدارة عليا', 
        description: 'فتح تذكرة طلب عليا', 
        value: 'complaint', 
        emoji: '⚠️' 
      },
      { 
        label: 'طـلـب رفـع رانـك', 
        description: 'فتح تذكرة رفع رانك', 
        value: 'rankup', 
        emoji: '📈' 
      }
    ]);

  const row = new ActionRowBuilder().addComponents(selectMenu);
  await interaction.reply({ 
    content: 'يرجى اختيار نوع التذكرة من القائمة أدناه:', 
    components: [row], 
    ephemeral: true 
  });
}

// اختيار نوع التذكرة
async function handleTicketTypeSelect(interaction, client) {
  const type = interaction.values[0];
  await client.ticketSystem.openTicketReasonModal(interaction, type);
}

// نموذج سبب التذكرة
async function handleTicketReasonModal(interaction, client) {
  const type = interaction.customId.replace('ticket_reason_', '');
  const reason = interaction.fields.getTextInputValue('ticket_reason');

  try {
    const { channel, ticket } = await client.ticketSystem.createTicket(interaction, type, reason);
    
    await interaction.reply({ 
      content: `✅ تم فتح التذكرة: ${channel}`, 
      ephemeral: true 
    });

  } catch (error) {
    console.error('❌ خطأ في فتح التذكرة:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ خطأ في فتح التذكرة')
      .setDescription(error.message)
      .setColor(client.config.COLORS.ERROR);
    
    await interaction.reply({ 
      embeds: [errorEmbed], 
      ephemeral: true 
    });
  }
}

// زر استلام التذكرة
async function handleClaimTicketButton(interaction, client) {
  const Ticket = require('../models/Ticket');
  const ticket = await Ticket.findOne({ 
    channelId: interaction.channel.id, 
    status: { $in: ['open', 'claimed'] } 
  });

  if (!ticket) {
    return interaction.reply({ 
      content: '❌ هذه ليست قناة تذكرة مفتوحة.', 
      ephemeral: true 
    });
  }

  try {
    await client.ticketSystem.claimTicket(interaction, ticket);
  } catch (error) {
    await interaction.reply({ 
      content: `❌ ${error.message}`, 
      ephemeral: true 
    });
  }
}

// زر إغلاق التذكرة
async function handleCloseTicketButton(interaction, client) {
  const Ticket = require('../models/Ticket');
  const ticket = await Ticket.findOne({ 
    channelId: interaction.channel.id, 
    status: { $in: ['open', 'claimed'] } 
  });

  if (!ticket) {
    return interaction.reply({ 
      content: '❌ هذه ليست قناة تذكرة مفتوحة.', 
      ephemeral: true 
    });
  }

  try {
    await client.ticketCloser.startCloseProcess(interaction, ticket);
  } catch (error) {
    await interaction.reply({ 
      content: `❌ ${error.message}`, 
      ephemeral: true 
    });
  }
}

// زر تأكيد الإغلاق
async function handleConfirmCloseButton(interaction, client) {
  const Ticket = require('../models/Ticket');
  const ticket = await Ticket.findOne({ 
    channelId: interaction.channel.id, 
    status: { $in: ['open', 'claimed'] } 
  });

  if (!ticket) {
    return interaction.reply({ 
      content: '❌ هذه ليست قناة تذكرة مفتوحة.', 
      ephemeral: true 
    });
  }

  await client.ticketCloser.confirmClose(interaction, ticket);
}

// زر إلغاء الإغلاق
async function handleCancelCloseButton(interaction, client) {
  await interaction.update({ 
    content: '❌ تم إلغاء الإغلاق.', 
    components: [], 
    embeds: [] 
  });
}

// زر إخفاء التذكرة
async function handleHideTicketButton(interaction, client) {
  const Ticket = require('../models/Ticket');
  const ticket = await Ticket.findOne({ 
    channelId: interaction.channel.id, 
    status: { $in: ['open', 'claimed'] } 
  });

  if (!ticket) {
    return interaction.reply({ 
      content: '❌ هذه ليست قناة تذكرة مفتوحة.', 
      ephemeral: true 
    });
  }

  try {
    // إخفاء التذكرة من المستخدم
    await interaction.channel.permissionOverwrites.edit(ticket.userId, {
      ViewChannel: false,
      SendMessages: false,
      ReadMessageHistory: false
    });

    // تحديث حالة التذكرة
    ticket.status = 'hidden';
    await ticket.save();

    const hideEmbed = new EmbedBuilder()
      .setTitle('👁️ تم إخفاء التذكرة')
      .setDescription(`تم إخفاء التذكرة من <@${ticket.userId}>\nالتذكرة لا تزال موجودة للإدارة ولكن لا يمكن للعميل رؤيتها.`)
      .setColor(client.config.COLORS.WARNING)
      .setTimestamp();

    await interaction.reply({ embeds: [hideEmbed] });

    // إرسال رسالة للخاص
    const dmEmbed = new EmbedBuilder()
      .setTitle('👁️ تم إخفاء تذكرتك')
      .setDescription('تم إخفاء تذكرتك من قبل الإدارة. لم تعد تستطيع الوصول إليها.')
      .setColor(client.config.COLORS.WARNING)
      .setTimestamp();

    try {
      const user = await client.users.fetch(ticket.userId);
      await user.send({ embeds: [dmEmbed] });
    } catch {
      // لا يمكن إرسال رسالة خاصة
    }

  } catch (error) {
    console.error('❌ خطأ في إخفاء التذكرة:', error);
    await interaction.reply({ 
      content: '❌ حدث خطأ في إخفاء التذكرة.', 
      ephemeral: true 
    });
  }
}

// زر مساعد الإدارة
async function handleAdminHelperButton(interaction, client) {
  await client.adminHelper.openAdminHelper(interaction);
}

// اختيارات مساعد الإدارة
async function handleTicketOptionsSelect(interaction, client) {
  const selectedAction = interaction.values[0];
  await client.adminHelper.handleAdminHelperSelect(interaction, selectedAction);
}

// تأكيد التصفير
async function handleResetConfirmation(interaction, client) {
  const { customId } = interaction;

  try {
    if (customId === 'confirm_reset_all') {
      // تصفير جميع الإحصائيات
      const Stats = require('../models/Stats');
      await Stats.deleteMany({ guildId: interaction.guild.id });

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ تم التصفير')
        .setDescription('تم تصفير إحصائيات جميع الأعضاء بنجاح.')
        .setColor(client.config.COLORS.SUCCESS)
        .setTimestamp();

      await interaction.update({ 
        embeds: [successEmbed], 
        components: [] 
      });

    } else if (customId.startsWith('confirm_reset_user_')) {
      // تصفير إحصائيات عضو معين
      const userId = customId.replace('confirm_reset_user_', '');
      const Stats = require('../models/Stats');
      
      await Stats.findOneAndDelete({ 
        guildId: interaction.guild.id, 
        userId: userId 
      });

      const user = await client.users.fetch(userId);
      const successEmbed = new EmbedBuilder()
        .setTitle('✅ تم التصفير')
        .setDescription(`تم تصفير إحصائيات ${user} بنجاح.`)
        .setColor(client.config.COLORS.SUCCESS)
        .setTimestamp();

      await interaction.update({ 
        embeds: [successEmbed], 
        components: [] 
      });
    }

  } catch (error) {
    console.error('❌ خطأ في التصفير:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ حدث خطأ')
      .setDescription('حدث خطأ أثناء تصفير الإحصائيات.')
      .setColor(client.config.COLORS.ERROR);

    await interaction.update({ 
      embeds: [errorEmbed], 
      components: [] 
    });
  }
}

// إلغاء التصفير
async function handleCancelReset(interaction, client) {
  await interaction.update({ 
    content: '❌ تم إلغاء التصفير.', 
    components: [], 
    embeds: [] 
  });
}