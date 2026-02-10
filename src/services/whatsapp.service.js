import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import pino from 'pino';
import { AccountStatus } from '../models/AccountStatus.js';

class WhatsAppService {
  constructor() {
    this.sock = null;
    this.qr = null;
    this.connectionStatus = 'disconnected';
    this.authFolder = './auth_info_baileys';
    this.checkInterval = null;
    this.logger = pino({ level: 'fatal' }); // Solo errores críticos
  }

  async initialize() {
    try {
      // Verificar si existe sesión anterior
      if (!fs.existsSync(this.authFolder)) {
        fs.mkdirSync(this.authFolder, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);
      const { version } = await fetchLatestBaileysVersion();

      this.sock = makeWASocket({
        version,
        logger: this.logger,
        printQRInTerminal: false,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, this.logger)
        },
        browser: ['WhatsApp Bot', 'Chrome', '1.0.0']
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.qr = await QRCode.toDataURL(qr);
          this.connectionStatus = 'qr_ready';
          console.log('📱 QR Code generado');
        }

        if (connection === 'close') {
          const shouldReconnect = 
            (lastDisconnect?.error instanceof Boom) &&
            lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut;

          console.log('❌ Conexión cerrada. Reconectar:', shouldReconnect);

          if (shouldReconnect) {
            this.connectionStatus = 'reconnecting';
            await this.initialize();
          } else {
            // Desconexión permanente (logout) - limpiar sesión y reiniciar
            console.log('🧹 Sesión cerrada. Limpiando y reiniciando...');
            this.connectionStatus = 'disconnected';
            this.qr = null;
            await this.cleanSession();
            await this.updateAccountStatus(false);
            
            // Reiniciar para generar nuevo QR
            setTimeout(async () => {
              console.log('🔄 Reiniciando WhatsApp para nuevo QR...');
              await this.initialize();
            }, 2000);
          }
        } else if (connection === 'open') {
          this.connectionStatus = 'connected';
          this.qr = null;
          console.log('✅ WhatsApp conectado');
          await this.updateAccountStatus(true);
          this.startConnectionCheck();
        }
      });

    } catch (error) {
      console.error('Error inicializando WhatsApp:', error);
      this.connectionStatus = 'error';
      throw error;
    }
  }

  startConnectionCheck() {
    // Verificar conexión cada 2 minutos
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(async () => {
      try {
        if (this.sock && this.connectionStatus === 'connected') {
          // Verificar si el socket sigue activo
          const isConnected = this.sock.user ? true : false;
          
          if (!isConnected) {
            console.log('⚠️ WhatsApp desconectado detectado');
            await this.cleanSession();
            await this.updateAccountStatus(false);
            await this.initialize();
          } else {
            await this.updateAccountStatus(true);
          }
        }
      } catch (error) {
        console.error('Error en verificación de conexión:', error);
      }
    }, 120000); // 2 minutos
  }

  async updateAccountStatus(isConnected) {
    try {
      let status = await AccountStatus.findOne();
      
      if (!status) {
        status = new AccountStatus();
      }

      status.whatsappConnected = isConnected;
      status.whatsappLastCheck = new Date();
      
      if (!isConnected) {
        status.whatsappDisconnectedAt = new Date();
      }

      await status.save();
    } catch (error) {
      console.error('Error actualizando estado de cuenta:', error);
    }
  }

  async cleanSession() {
    try {
      if (fs.existsSync(this.authFolder)) {
        fs.rmSync(this.authFolder, { recursive: true, force: true });
        console.log('🧹 Sesión de WhatsApp limpiada');
      }
    } catch (error) {
      console.error('Error limpiando sesión:', error);
    }
  }

  getStatus() {
    const status = {
      status: this.connectionStatus,
      qr: this.qr,
      connected: this.connectionStatus === 'connected'
    };

    // Si está conectado, agregar información del teléfono
    if (this.connectionStatus === 'connected' && this.sock && this.sock.user) {
      const userId = this.sock.user.id; // Formato: "51966384230:1@s.whatsapp.net"
      const phoneNumber = userId.split(':')[0]; // Extraer solo el número
      
      status.phone = {
        number: phoneNumber,
        name: this.sock.user.name || 'Sin nombre'
      };
    }

    return status;
  }

  async sendMessage(to, message, retryCount = 0) {
    const maxRetries = 3;
    
    if (this.connectionStatus !== 'connected' || !this.sock) {
      throw new Error('WhatsApp no está conectado');
    }

    try {
      // Formatear número para WhatsApp (agregar @s.whatsapp.net si no lo tiene)
      const formattedNumber = to.includes('@') ? to : `${to}@s.whatsapp.net`;
      
      await this.sock.sendMessage(formattedNumber, { text: message });
      
      return {
        success: true,
        sentAt: new Date()
      };
    } catch (error) {
      console.error(`Error enviando mensaje (intento ${retryCount + 1}/${maxRetries}):`, error);
      
      if (retryCount < maxRetries) {
        // Esperar 2 segundos antes de reintentar
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.sendMessage(to, message, retryCount + 1);
      }
      
      throw error;
    }
  }

  async disconnect() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    if (this.sock) {
      await this.sock.logout();
      this.sock = null;
    }
    
    this.connectionStatus = 'disconnected';
    this.qr = null;
  }
}

// Singleton
export const whatsappService = new WhatsAppService();
