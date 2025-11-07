import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

interface SMTPConfig {
  host: string | undefined;
  port: number;
  secure: boolean;
  auth?: {
    user: string;
    pass: string;
  };
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const config: SMTPConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
    };

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      config.auth = {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      };
    }

    this.transporter = nodemailer.createTransport(config);
  }

  async sendNewVolumeNotification(
    userEmail: string,
    userName: string,
    titleName: string,
    volumeNumber: number,
  ) {
    const subject = `Novo volume disponível: ${titleName}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">Novo Volume Disponível!</h2>

        <p>Olá ${userName},</p>

        <p>Temos uma ótima notícia! Um novo volume do título <strong>${titleName}</strong> foi adicionado.</p>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0;">📚 Volume ${volumeNumber}</h3>
          <p style="margin-bottom: 0;"><strong>Título:</strong> ${titleName}</p>
        </div>

        <p>Acesse sua conta no Kushon para atualizar seu progresso e marcar este volume como adquirido!</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}"
             style="background-color: #3498db; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Acessar Kushon
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

        <p style="color: #7f8c8d; font-size: 12px;">
          Você está recebendo este email porque ativou as notificações para "${titleName}".
          Para desativar as notificações, acesse as configurações do título em sua conta.
        </p>
      </div>
    `;

    const textContent = `
Novo Volume Disponível!

Olá ${userName},

Temos uma ótima notícia! Um novo volume do título "${titleName}" foi adicionado.

Volume ${volumeNumber}
Título: ${titleName}

Acesse sua conta no Kushon para atualizar seu progresso e marcar este volume como adquirido!

Link: ${process.env.FRONTEND_URL}

---
Você está recebendo este email porque ativou as notificações para "${titleName}".
Para desativar as notificações, acesse as configurações do título em sua conta.
    `;

    try {
      await this.transporter.sendMail({
        from: `"Kushon" <${process.env.SMTP_FROM}>`,
        to: userEmail,
        subject: subject,
        text: textContent,
        html: htmlContent,
      });

      console.log(`Email enviado com sucesso para ${userEmail}`);
    } catch (error) {
      console.error(`Erro ao enviar email para ${userEmail}:`, error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Conexão SMTP verificada com sucesso');
      return true;
    } catch (error) {
      console.error('Erro na conexão SMTP:', error);
      return false;
    }
  }
}
