const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

const initializeBaileys = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version } = await fetchLatestBaileysVersion();

    const client = makeWASocket({
        auth: state,
        version,
        printQRInTerminal: true,
        syncFullHistory: false,
    });

    client.ev.on('creds.update', saveCreds);

    client.ev.on('connection.update', async (update) => {
        const { connection } = update;

        if (connection === 'close') {
            console.log('Connection closed');
        } else if (connection === 'open') {
            console.log('Baileys Client is ready to use!');
        }
    });

    // Listen for incoming messages
    client.ev.on('messages.upsert', async (m) => {
        const message = m.messages[0];
        if (message.key.fromMe) return; // Ignore bot's own messages

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const sender = message.key.remoteJid;

        console.log("Received Text:", text);

        // // Respond to "hello" or "hai"
        // if (text.toLowerCase() === 'hello') {
        //     await client.sendMessage(sender, { text: 'hai' });
        //     console.log(`Replied with: hai`);
        // } else if (text.toLowerCase() === 'hai') {
        //     await client.sendMessage(sender, { text: 'hello' });
        //     console.log(`Replied with: hello`);
        // }
    });

    

    client.ev.on('presence.update', (update) => {
        console.log(update); // Log the full update for debugging
    
        const jid = update.id; // Extract the JID
        const presenceData = update.presences?.[jid]; // Get presence info
    
        if (presenceData) {
            const lastKnownPresence = presenceData.lastKnownPresence;
    
            // Check the presence status
            if (lastKnownPresence === 'available') {
                client.sendPresenceUpdate('paused',jid)
            } else if (lastKnownPresence === 'recording') {
                client.sendPresenceUpdate('recording',jid)
            }else if (lastKnownPresence === 'composing') {
                client.sendPresenceUpdate('composing',jid)
            } else {
                console.log(`${jid} has presence status: ${lastKnownPresence}`);
            }
        } else {
            console.log(`No presence data available for ${jid}`);
        }
    });
    
};

initializeBaileys();