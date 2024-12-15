require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const fs = require('fs');

// Variáveis de ambiente
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// Lista centralizada de itens
const ITEMS = [
  { name: 'Espada', value: 'espada' },
  { name: 'Poção', value: 'pocao' },
  { name: 'Escudo', value: 'escudo' },
  { name: 'Armadura', value: 'armadura' }
];

// Inicialização do cliente do bot
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Função para criar as opções de itens dinamicamente
const getItemOptions = () => ITEMS.map(item => ({ name: item.name, value: item.value }));

// Comandos do bot
const commands = [
  {
    name: 'colocar',
    description: 'Adiciona itens ao baú',
    options: [
      {
        type: 4, // Inteiro
        name: 'quantidade',
        description: 'Quantidade do item',
        required: true,
      },
      {
        type: 3, // String
        name: 'item',
        description: 'Nome do item',
        required: true,
        choices: getItemOptions(),
      },
      {
        type: 11, // Anexo
        name: 'print',
        description: 'Adicione uma print',
        required: false,
      },
    ],
  },
  {
    name: 'retirar',
    description: 'Retira itens do baú',
    options: [
      {
        type: 4, // Inteiro
        name: 'quantidade',
        description: 'Quantidade do item',
        required: true,
      },
      {
        type: 3, // String
        name: 'item',
        description: 'Nome do item',
        required: true,
        choices: getItemOptions(),
      },
      {
        type: 11, // Anexo
        name: 'print',
        description: 'Adicione uma print',
        required: false,
      },
    ],
  },
  {
    name: 'total',
    description: 'Exibe o total de cada item no canal',
  },
  {
    name: 'limpartotal',
    description: 'Zera o total de todos os itens no canal',
  },
];

// Registrar comandos no Discord
const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    console.log('Atualizando comandos globalmente...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('Comandos registrados com sucesso!');
  } catch (error) {
    console.error('Erro ao registrar comandos:', error);
  }
})();

// Banco de dados local para armazenar totais
const totals = new Map();

// Listener para eventos do bot
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options, channelId } = interaction;

  if (commandName === 'colocar' || commandName === 'retirar') {
    const quantidade = options.getInteger('quantidade');
    const item = options.getString('item');

    // Atualizar totais
    if (!totals.has(channelId)) totals.set(channelId, {});
    const channelTotals = totals.get(channelId);
    channelTotals[item] = (channelTotals[item] || 0) + (commandName === 'colocar' ? quantidade : -quantidade);

    // Confirmar ao usuário
    await interaction.reply({
      content: `Você **${commandName === 'colocar' ? 'adicionou' : 'removeu'}** ${quantidade} de **${item}**!`,
      ephemeral: true,
    });
  } else if (commandName === 'total') {
    const channelTotals = totals.get(channelId) || {};
    const totalString = Object.entries(channelTotals)
      .map(([item, total]) => `${ITEMS.find(i => i.value === item)?.name || item}: ${total}`)
      .join('\n') || 'Sem itens no total.';

    await interaction.reply(`**Totais do Canal:**\n${totalString}`);
  } else if (commandName === 'limpartotal') {
    totals.set(channelId, {});
    await interaction.reply('Totais zerados com sucesso!');
  }
});

client.once('ready', () => {
  console.log(`Bot online como ${client.user.tag}`);
});

client.login(TOKEN);