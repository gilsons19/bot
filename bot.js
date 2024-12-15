const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// Criação do cliente do bot
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Configuração do token
const TOKEN = 'MTMxNTE3Mzg5NDYxMjg0ODY1MA.GVRbiM.kLewG6eOFZLAdrFbufKPDV77ss-n76ZDOeTKks';

// Lista de itens permitidos
const ITENS_PERMITIDOS = [
  { name: 'Pólvora', value: 'Pólvora' },
  { name: 'Din. sujo', value: 'Din. sujo' },
  { name: 'Drop inteiro', value: 'Drop inteiro' },
  { name: 'Droga', value: 'Droga' },
];

// Memória para rastrear estoques por canal (cada item separadamente)
const estoquePorCanal = {};

// Comandos de barra
client.once('ready', async () => {
  console.log(`Bot iniciado como ${client.user.tag}`);

  const guild = client.guilds.cache.first(); // Use o ID do servidor, se necessário
  const commands = guild.commands;

  // Comando /colocar
  await commands.create(
    new SlashCommandBuilder()
      .setName('colocar')
      .setDescription('Colocar itens no baú')
      .addIntegerOption(option =>
        option.setName('quantidade').setDescription('Quantidade do item').setRequired(true)
      )
      .addStringOption(option => {
        option.setName('item').setDescription('Escolha o item').setRequired(true);
        ITENS_PERMITIDOS.forEach(item => option.addChoices({ name: item.name, value: item.value }));
        return option;
      })
      .addAttachmentOption(option =>
        option.setName('print').setDescription('Print do item').setRequired(false)
      )
  );

  // Comando /retirar
  await commands.create(
    new SlashCommandBuilder()
      .setName('retirar')
      .setDescription('Retirar itens do baú')
      .addIntegerOption(option =>
        option.setName('quantidade').setDescription('Quantidade do item').setRequired(true)
      )
      .addStringOption(option => {
        option.setName('item').setDescription('Escolha o item').setRequired(true);
        ITENS_PERMITIDOS.forEach(item => option.addChoices({ name: item.name, value: item.value }));
        return option;
      })
      .addAttachmentOption(option =>
        option.setName('print').setDescription('Print do item').setRequired(false)
      )
  );

  // Comando /limpartotal
  await commands.create(
    new SlashCommandBuilder()
      .setName('limpartotal')
      .setDescription('Reseta o total do estoque para 0 neste canal')
  );

  // Comando /total
  await commands.create(
    new SlashCommandBuilder()
      .setName('total')
      .setDescription('Mostra o total atual de entradas e retiradas neste canal')
  );
});

// Lógica dos comandos
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName, options, channelId } = interaction;

  // Inicializa o registro do canal, se necessário
  if (!estoquePorCanal[channelId]) {
    estoquePorCanal[channelId] = {
      itens: {}, // Armazena o total de cada item
    };
  }

  const canal = estoquePorCanal[channelId];

  // Comando /colocar
  if (commandName === 'colocar') {
    const quantidade = options.getInteger('quantidade');
    const itemKey = options.getString('item');
    const item = ITENS_PERMITIDOS.find(i => i.value === itemKey).name;
    const print = options.getAttachment('print');

    // Atualiza o total do item no canal
    if (!canal.itens[itemKey]) {
      canal.itens[itemKey] = 0;
    }
    canal.itens[itemKey] += quantidade;

    // Criar Embed para exibição
    const embed = new EmbedBuilder()
      .setTitle('Item adicionado ao baú')
      .setColor('Green')
      .addFields(
        { name: 'Item', value: item, inline: true },
        { name: 'Quantidade', value: `${quantidade}`, inline: true },
        { name: 'Total Atual', value: `${canal.itens[itemKey]}`, inline: true }
      )
      .setTimestamp();

    if (print) {
      embed.setImage(print.url);
    }

    await interaction.reply({ embeds: [embed] });
  }

  // Comando /retirar
  if (commandName === 'retirar') {
    const quantidade = options.getInteger('quantidade');
    const itemKey = options.getString('item');
    const item = ITENS_PERMITIDOS.find(i => i.value === itemKey).name;
    const print = options.getAttachment('print');

    // Atualiza o total do item no canal
    if (!canal.itens[itemKey]) {
      canal.itens[itemKey] = 0;
    }
    canal.itens[itemKey] -= quantidade;

    const embed = new EmbedBuilder()
      .setTitle('Item retirado do baú')
      .setColor('Red')
      .addFields(
        { name: 'Item', value: item, inline: true },
        { name: 'Quantidade', value: `-${quantidade}`, inline: true },
        { name: 'Total Atual', value: `${canal.itens[itemKey]}`, inline: true }
      )
      .setTimestamp();

    if (print) {
      embed.setImage(print.url);
    }

    await interaction.reply({ embeds: [embed] });
  }

  // Comando /total
  if (commandName === 'total') {
    const embed = new EmbedBuilder()
      .setTitle('Totais do Estoque por Item')
      .setColor('Blue')
      .setTimestamp();

    // Adiciona totais de cada item ao embed
    for (const [itemKey, total] of Object.entries(canal.itens)) {
      const itemName = ITENS_PERMITIDOS.find(i => i.value === itemKey).name;
      embed.addFields({ name: itemName, value: `${total}`, inline: true });
    }

    await interaction.reply({ embeds: [embed] });
  }

  // Comando /limpartotal
  if (commandName === 'limpartotal') {
    canal.itens = {}; // Reseta todos os itens

    const embed = new EmbedBuilder()
      .setTitle('Totais Resetados')
      .setColor('Orange')
      .setDescription('Todos os totais de itens foram resetados para 0 neste canal.')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
});

// Login do bot
client.login(TOKEN);
