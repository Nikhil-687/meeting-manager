import nodemailer from 'nodemailer'
import { EmailConfig, SMTPConfig } from './config'

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
  attachments?: Array<{
    filename: string
    content: string | Buffer
    contentType?: string
  }>
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

class SMTPService {
  private transporter: nodemailer.Transporter | null = null
  private config: SMTPConfig | null = null

  private async initializeTransporter(): Promise<nodemailer.Transporter> {
    if (!this.transporter) {
      try {
        this.config = EmailConfig.getConfig()
        
        // Validate configuration
        const validation = EmailConfig.validateConfig()
        if (!validation.valid) {
          throw new Error(`Invalid email configuration: ${validation.errors.join(', ')}`)
        }

        this.transporter = nodemailer.createTransport({
          host: this.config.host,
          port: this.config.port,
          secure: this.config.secure,
          auth: {
            user: this.config.auth.user,
            pass: this.config.auth.pass
          },
          tls: {
            rejectUnauthorized: false // Allow self-signed certificates
          }
        })
        
        // Verify connection
        await this.transporter.verify()
        console.log('✅ SMTP connection verified successfully')
        
      } catch (error) {
        console.error('❌ SMTP initialization failed:', error)
        throw new Error(`SMTP setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    return this.transporter
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const transporter = await this.initializeTransporter()
      
      if (!this.config) {
        throw new Error('SMTP configuration not initialized')
      }

      const fromAddress = options.from || `${this.config.from.name} <${this.config.from.email}>`
      
      const mailOptions = {
        from: fromAddress,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.htmlToText(options.html),
        replyTo: options.replyTo,
        attachments: options.attachments
      }

      const result = await transporter.sendMail(mailOptions)
      
      console.log('✅ Email sent successfully:', {
        messageId: result.messageId,
        to: mailOptions.to,
        subject: options.subject
      })
      
      return {
        success: true,
        messageId: result.messageId
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ Failed to send email:', {
        error: errorMessage,
        to: options.to,
        subject: options.subject
      })
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }

  async sendBulkEmails(emails: EmailOptions[]): Promise<EmailResult[]> {
    const results: EmailResult[] = []
    
    for (const email of emails) {
      const result = await this.sendEmail(email)
      results.push(result)
      
      // Add small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    return results
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/, '')
      .replace(/<script[^>]*>.*?<\/script>/, '')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
  }

  async testConnection(): Promise<{ success: boolean; error?: string; config?: any }> {
    try {
      const transporter = await this.initializeTransporter()
      await transporter.verify()
      
      return {
        success: true,
        config: {
          host: this.config?.host,
          port: this.config?.port,
          secure: this.config?.secure,
          user: this.config?.auth.user,
          from: this.config?.from
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ SMTP connection test failed:', errorMessage)
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }

  getConfiguration(): SMTPConfig | null {
    return this.config
  }

  async closeConnection(): Promise<void> {
    if (this.transporter) {
      this.transporter.close()
      this.transporter = null
      this.config = null
      console.log('📧 SMTP connection closed')
    }
  }
}

export const smtpService = new SMTPService()
