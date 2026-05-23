import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface DeliveryAddress {
  strada: string;
  bloc?: string;
  oras: string;
  judet: string;
  codPostal: string;
  observatii?: string;
}

export interface OrderItemEmail {
  name: string;
  quantity: number;
  price: number;
  currency: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('MAIL_HOST', 'smtp.gmail.com'),
      port: Number(this.config.get('MAIL_PORT', 587)),
      secure: false,
      auth: {
        user: this.config.get('MAIL_USER'),
        pass: this.config.get('MAIL_PASS'),
      },
      tls: { rejectUnauthorized: false },
    });
  }

  private get mailConfigured(): boolean {
    return !!(this.config.get('MAIL_USER') && this.config.get('MAIL_PASS'));
  }

  private get fromAddress(): string {
    return this.config.get('MAIL_FROM', 'TD Supply <dentaltdsupply@gmail.com>');
  }

  private get contactEmail(): string {
    return this.config.get('MAIL_USER', 'dentaltdsupply@gmail.com');
  }

  private formatAddress(addr: DeliveryAddress): string {
    const parts = [addr.strada];
    if (addr.bloc) parts.push(addr.bloc);
    parts.push(`${addr.oras}, ${addr.judet} ${addr.codPostal}`);
    return parts.join(', ');
  }

  private buildOrderItemsTable(items: OrderItemEmail[]): string {
    const rows = items
      .map(
        (item) => `
      <tr>
        <td style="padding:10px 8px; border-bottom:1px solid #e2e8f0; font-size:14px; color:#1e293b;">${item.name}</td>
        <td style="padding:10px 8px; border-bottom:1px solid #e2e8f0; text-align:center; font-size:14px; color:#64748b;">${item.quantity}</td>
        <td style="padding:10px 8px; border-bottom:1px solid #e2e8f0; text-align:right; font-size:14px; color:#1e293b;">
          ${(item.price * item.quantity).toFixed(2)} ${item.currency}
        </td>
      </tr>`,
      )
      .join('');

    return `
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-bottom:20px;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:10px 8px; text-align:left; font-size:12px; color:#64748b; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Produs</th>
            <th style="padding:10px 8px; text-align:center; font-size:12px; color:#64748b; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Cant.</th>
            <th style="padding:10px 8px; text-align:right; font-size:12px; color:#64748b; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  /** Email confirmare comandă → trimis clientului */
  async sendOrderConfirmation(params: {
    to: string;
    userName: string;
    orderId: string;
    total: number;
    currency: string;
    items: OrderItemEmail[];
    deliveryAddress?: DeliveryAddress;
  }) {
    const { to, userName, orderId, total, currency, items, deliveryAddress } = params;
    const shortId = orderId.slice(0, 8).toUpperCase();
    const dateStr = new Date().toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const addressHtml = deliveryAddress
      ? `
      <div style="background:#f8fafc; border-radius:8px; padding:16px; margin-bottom:24px;">
        <p style="margin:0 0 8px; font-size:12px; color:#64748b; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Adresă de livrare</p>
        <p style="margin:0; font-size:14px; color:#1e293b; line-height:1.6;">
          ${deliveryAddress.strada}${deliveryAddress.bloc ? '<br>' + deliveryAddress.bloc : ''}<br>
          ${deliveryAddress.oras}, ${deliveryAddress.judet} ${deliveryAddress.codPostal}
          ${deliveryAddress.observatii ? '<br><em style="color:#64748b;">Obs: ' + deliveryAddress.observatii + '</em>' : ''}
        </p>
      </div>`
      : '';

    const html = `<!DOCTYPE html>
<html lang="ro">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);padding:36px 40px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">DISTRIDENT MEDICAL</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:12px;text-transform:uppercase;letter-spacing:1px;">Distribuitor B2B Materiale Dentare</p>
    </div>

    <!-- Success Banner -->
    <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:20px 40px;display:flex;align-items:center;">
      <span style="font-size:32px;margin-right:16px;">✅</span>
      <div>
        <p style="margin:0;font-size:17px;font-weight:700;color:#15803d;">Comanda dvs. a fost primită!</p>
        <p style="margin:4px 0 0;font-size:13px;color:#4ade80a0;color:#166534;">Echipa noastră o va confirma prin email în maxim 24 ore lucrătoare.</p>
      </div>
    </div>

    <!-- Body -->
    <div style="padding:32px 40px;">
      <p style="margin:0 0 24px;font-size:15px;color:#334155;">Bună ziua, <strong>${userName}</strong>,</p>
      <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.7;">
        Vă mulțumim pentru comanda plasată! Mai jos găsiți toate detaliile.
      </p>

      <!-- Order Meta -->
      <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:24px;display:flex;justify-content:space-between;">
        <div>
          <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Număr comandă</p>
          <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#1e293b;font-family:monospace;">#${shortId}</p>
        </div>
        <div style="text-align:right;">
          <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Data</p>
          <p style="margin:4px 0 0;font-size:14px;color:#1e293b;">${dateStr}</p>
        </div>
      </div>

      <!-- Products -->
      <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Produse comandate</p>
      ${this.buildOrderItemsTable(items)}

      <!-- Total -->
      <div style="background:#1e3a5f;border-radius:8px;padding:16px 20px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;">
        <span style="color:rgba(255,255,255,0.8);font-size:14px;">TOTAL COMANDĂ</span>
        <span style="color:#ffffff;font-size:20px;font-weight:700;">${total.toFixed(2)} ${currency}</span>
      </div>

      <!-- Address -->
      ${addressHtml}

      <!-- Confirmation Notice -->
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#92400e;line-height:1.6;">
          <strong>📋 Pasul următor:</strong> Un reprezentant Distrident Medical vă va contacta prin email pentru a <strong>confirma disponibilitatea produselor și detaliile livrării</strong> în maxim 24 ore lucrătoare.
        </p>
      </div>

      <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.7;">
        Pentru orice întrebare, ne puteți contacta la <a href="mailto:${this.contactEmail}" style="color:#2563eb;">${this.contactEmail}</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} Distrident Medical · Distribuitor B2B</p>
      <p style="margin:6px 0 0;font-size:12px;color:#94a3b8;">Acesta este un email automat generat de sistem.</p>
    </div>
  </div>
</body>
</html>`;

    if (!this.mailConfigured) {
      this.logger.warn('📧 MAIL neCONFIGURAT — simulare email client:');
      this.logger.log(`  → Destinatar: ${to}`);
      this.logger.log(`  → Subiect: ✅ Comanda dvs. #${shortId} a fost primită — Distrident Medical`);
      this.logger.log(`  → Total: ${total.toFixed(2)} ${currency} (${items.length} produse)`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject: `✅ Comanda dvs. #${shortId} a fost primită — Distrident Medical`,
        html,
      });
      this.logger.log(`✉️  Email confirmare trimis → ${to} (comanda #${shortId})`);
    } catch (error) {
      this.logger.error(`❌ Eroare trimitere email client ${to}:`, (error as Error).message);
    }
  }

  /** Notificare admin → trimis la adresa ADMIN_NOTIFICATION_EMAIL */
  async sendAdminOrderNotification(params: {
    orderId: string;
    userName: string;
    userEmail: string;
    total: number;
    currency: string;
    items: OrderItemEmail[];
    deliveryAddress?: DeliveryAddress;
  }) {
    const { orderId, userName, userEmail, total, currency, items, deliveryAddress } = params;
    const adminEmail = this.config.get('ADMIN_NOTIFICATION_EMAIL', 'dentaltdsupply@gmail.com');
    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
    const shortId = orderId.slice(0, 8).toUpperCase();
    const dateStr = new Date().toLocaleString('ro-RO');

    const addressBlock = deliveryAddress
      ? `
      <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
        <strong style="color:#64748b;font-size:12px;">ADRESĂ LIVRARE</strong><br>
        <span style="font-size:14px;color:#1e293b;">
          ${deliveryAddress.strada}${deliveryAddress.bloc ? ', ' + deliveryAddress.bloc : ''}<br>
          ${deliveryAddress.oras}, ${deliveryAddress.judet} ${deliveryAddress.codPostal}
          ${deliveryAddress.observatii ? '<br><em>Obs: ' + deliveryAddress.observatii + '</em>' : ''}
        </span>
      </td></tr>`
      : '';

    const html = `<!DOCTYPE html>
<html lang="ro">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    
    <!-- Header Admin -->
    <div style="background:linear-gradient(135deg,#1e3a5f,#1d4ed8);padding:30px 40px;">
      <p style="margin:0 0 4px;color:rgba(255,255,255,0.6);font-size:11px;text-transform:uppercase;letter-spacing:1px;">Distrident Medical — Notificare Admin</p>
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">🔔 Comandă Nouă Primită!</h1>
    </div>

    <!-- Alert Banner -->
    <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px 40px;">
      <p style="margin:0;font-size:14px;color:#92400e;font-weight:600;">
        Comandă nouă de la <strong>${userName}</strong> · ${dateStr}
      </p>
    </div>

    <div style="padding:32px 40px;">
      
      <!-- Client Info -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
          <strong style="color:#64748b;font-size:12px;">CLIENT</strong><br>
          <span style="font-size:15px;font-weight:700;color:#1e293b;">${userName}</span>
        </td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
          <strong style="color:#64748b;font-size:12px;">EMAIL</strong><br>
          <a href="mailto:${userEmail}" style="font-size:14px;color:#2563eb;">${userEmail}</a>
        </td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
          <strong style="color:#64748b;font-size:12px;">NR. COMANDĂ</strong><br>
          <span style="font-size:16px;font-weight:700;color:#1e293b;font-family:monospace;">#${shortId}</span>
        </td></tr>
        ${addressBlock}
      </table>

      <!-- Products -->
      <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;">Produse comandate</p>
      ${this.buildOrderItemsTable(items)}

      <!-- Total -->
      <div style="background:#1e3a5f;border-radius:8px;padding:16px 20px;margin-bottom:28px;display:flex;justify-content:space-between;">
        <span style="color:rgba(255,255,255,0.8);font-size:14px;">TOTAL</span>
        <span style="color:#ffffff;font-size:20px;font-weight:700;">${total.toFixed(2)} ${currency}</span>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;">
        <a href="${frontendUrl}/admin/orders"
           style="display:inline-block;background:#2563eb;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
          🗂️ Deschide Panoul Admin
        </a>
      </div>
    </div>

    <div style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">Notificare automată — Distrident Medical B2B Platform</p>
    </div>
  </div>
</body>
</html>`;

    if (!this.mailConfigured) {
      this.logger.warn('📧 MAIL neCONFIGURAT — simulare notificare admin:');
      this.logger.log(`  → Comandă #${shortId} de la ${userName} (${userEmail})`);
      this.logger.log(`  → Total: ${total.toFixed(2)} ${currency}`);
      if (deliveryAddress) {
        this.logger.log(`  → Livrare: ${this.formatAddress(deliveryAddress)}`);
      }
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: adminEmail,
        subject: `🔔 Comandă Nouă #${shortId} — ${userName} (${total.toFixed(2)} ${currency})`,
        html,
      });
      this.logger.log(`✉️  Notificare admin trimisă → ${adminEmail} (comanda #${shortId})`);
    } catch (error) {
      this.logger.error(`❌ Eroare notificare admin:`, (error as Error).message);
    }
  }

  /** Email resetare parolă */
  async sendPasswordReset(to: string, resetLink: string) {
    const html = `<!DOCTYPE html>
<html lang="ro">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:500px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:36px 40px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">DISTRIDENT MEDICAL</h1>
    </div>
    <div style="padding:36px 40px;text-align:center;">
      <div style="font-size:48px;margin-bottom:16px;">🔒</div>
      <h2 style="margin:0 0 12px;font-size:20px;color:#1e293b;">Resetare Parolă</h2>
      <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.7;">
        Ai solicitat resetarea parolei pentru contul tău B2B.<br>
        Apasă butonul de mai jos pentru a crea o parolă nouă.
      </p>
      <a href="${resetLink}"
         style="display:inline-block;background:#2563eb;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;margin-bottom:24px;">
        Resetează Parola
      </a>
      <p style="margin:0;font-size:12px;color:#94a3b8;">
        Link-ul este valabil <strong>1 oră</strong>.<br>
        Dacă nu tu ai solicitat resetarea, ignoră acest email.
      </p>
    </div>
    <div style="background:#f8fafc;padding:16px 40px;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="margin:0;font-size:11px;color:#94a3b8;">© ${new Date().getFullYear()} Distrident Medical</p>
    </div>
  </div>
</body>
</html>`;

    if (!this.mailConfigured) {
      this.logger.warn('📧 MAIL neCONFIGURAT — simulare email resetare parolă:');
      this.logger.log(`  → Destinatar: ${to}`);
      this.logger.log(`  → Link: ${resetLink}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject: '🔒 Resetare Parolă — Distrident Medical',
        html,
      });
      this.logger.log(`✉️  Email resetare parolă → ${to}`);
    } catch (error) {
      this.logger.error(`❌ Eroare trimitere email resetare parolă:`, (error as Error).message);
    }
  }

  /** Email de bun venit → trimis clientului la înregistrare */
  async sendWelcomeEmail(to: string, userName: string) {
    const html = `<!DOCTYPE html>
<html lang="ro">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:500px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:36px 40px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">DISTRIDENT MEDICAL</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:11px;text-transform:uppercase;letter-spacing:1px;">Bun venit în platforma B2B</p>
    </div>
    <div style="padding:36px 40px;">
      <h2 style="margin:0 0 12px;font-size:20px;color:#1e293b;text-align:center;">Cont B2B Creat cu Succes!</h2>
      <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.6;">
        Bună ziua, <strong>${userName}</strong>,
      </p>
      <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
        Contul dumneavoastră de partener B2B a fost înregistrat cu succes pe platforma Distrident Medical. Acum puteți plasa comenzi de materiale și consumabile dentare direct din catalogul nostru.
      </p>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${this.config.get('FRONTEND_URL', 'http://localhost:3000')}/autentificare"
           style="display:inline-block;background:#2563eb;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
          Autentifică-te pe Site
        </a>
      </div>
      <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;text-align:center;">
        Pentru orice asistență, ne puteți contacta la <a href="mailto:${this.contactEmail}" style="color:#2563eb;">${this.contactEmail}</a>
      </p>
    </div>
    <div style="background:#f8fafc;padding:16px 40px;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="margin:0;font-size:11px;color:#94a3b8;">© ${new Date().getFullYear()} Distrident Medical</p>
    </div>
  </div>
</body>
</html>`;

    if (!this.mailConfigured) {
      this.logger.warn('📧 MAIL neCONFIGURAT — simulare email bun venit:');
      this.logger.log(`  → Destinatar: ${to}`);
      this.logger.log(`  → Subiect: 🎉 Bun venit la Distrident Medical!`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject: '🎉 Bun venit la Distrident Medical!',
        html,
      });
      this.logger.log(`✉️  Email bun venit trimis → ${to}`);
    } catch (error) {
      this.logger.error(`❌ Eroare trimitere email bun venit:`, (error as Error).message);
    }
  }

  /** Email verificare cont → trimis clientului la înregistrare */
  async sendVerificationEmail(to: string, userName: string, verificationLink: string) {
    const html = `<!DOCTYPE html>
<html lang="ro">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:500px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:36px 40px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">TD SUPPLY</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:11px;text-transform:uppercase;letter-spacing:1px;">Activare Cont Partener</p>
    </div>
    <div style="padding:36px 40px;text-align:center;">
      <div style="font-size:48px;margin-bottom:16px;">📧</div>
      <h2 style="margin:0 0 12px;font-size:20px;color:#1e293b;">Confirmare Adresă de Email</h2>
      <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.6;text-align:left;">
        Bună ziua, <strong>${userName}</strong>,
      </p>
      <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;text-align:left;">
        Vă mulțumim pentru înregistrarea pe platforma B2B TD Supply. Pentru a activa contul dumneavoastră de partener, vă rugăm să confirmați adresa de email apăsând butonul de mai jos:
      </p>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${verificationLink}"
           style="display:inline-block;background:#2563eb;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
          Activează Contul
        </a>
      </div>
      <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;text-align:center;">
        Dacă butonul de mai sus nu funcționează, copiați și accesați următorul link în browser:<br>
        <a href="${verificationLink}" style="color:#2563eb;word-break:break-all;">${verificationLink}</a>
      </p>
      <div style="margin-top:24px;border-top:1px solid #e2e8f0;padding-top:16px;">
        <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;text-align:center;">
          Pentru orice asistență, ne puteți contacta la <a href="mailto:${this.contactEmail}" style="color:#2563eb;">${this.contactEmail}</a>
        </p>
      </div>
    </div>
    <div style="background:#f8fafc;padding:16px 40px;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="margin:0;font-size:11px;color:#94a3b8;">© ${new Date().getFullYear()} TD Supply</p>
    </div>
  </div>
</body>
</html>`;

    if (!this.mailConfigured) {
      this.logger.warn('📧 MAIL neCONFIGURAT — simulare email verificare cont:');
      this.logger.log(`  → Destinatar: ${to}`);
      this.logger.log(`  → Subiect: 🔒 Activează contul tău B2B — TD Supply`);
      this.logger.log(`  → Link: ${verificationLink}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject: '🔒 Activează contul tău B2B — TD Supply',
        html,
      });
      this.logger.log(`✉️  Email verificare trimis → ${to}`);
    } catch (error) {
      this.logger.error(`❌ Eroare trimitere email verificare:`, (error as Error).message);
    }
  }
}
