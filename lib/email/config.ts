export interface SMTPConfig {
    host: string
    port: number
    secure: boolean
    auth: {
      user: string
      pass: string
    }
    from: {
      name: string
      email: string
    }
  }
  
  export class EmailConfig {
    static getConfig(): SMTPConfig {
      const requiredEnvVars = [
        'SMTP_HOST',
        'SMTP_PORT', 
        'SMTP_USER',
        'SMTP_PASS',
        'FROM_EMAIL',
        'FROM_NAME'
      ]
  
      // Check for missing environment variables
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
      if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
      }
  
      return {
        host: process.env.SMTP_HOST!,
        port: parseInt(process.env.SMTP_PORT!),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER!,
          pass: process.env.SMTP_PASS!
        },
        from: {
          name: process.env.FROM_NAME!,
          email: process.env.FROM_EMAIL!
        }
      }
    }
  
    static validateConfig(): { valid: boolean; errors: string[] } {
      const errors: string[] = []
  
      try {
        const config = this.getConfig()
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(config.from.email)) {
          errors.push('FROM_EMAIL must be a valid email address')
        }
        
        if (!emailRegex.test(config.auth.user)) {
          errors.push('SMTP_USER must be a valid email address')
        }
  
        // Validate port
        if (isNaN(config.port) || config.port < 1 || config.port > 65535) {
          errors.push('SMTP_PORT must be a valid port number (1-65535)')
        }
  
        // Validate host
        if (!config.host || config.host.trim().length === 0) {
          errors.push('SMTP_HOST cannot be empty')
        }
  
        // Validate password
        if (!config.auth.pass || config.auth.pass.trim().length === 0) {
          errors.push('SMTP_PASS cannot be empty')
        }
  
        return { valid: errors.length === 0, errors }
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Unknown configuration error')
        return { valid: false, errors }
      }
    }
  
    static getProviderSettings(provider: 'gmail' | 'outlook' | 'yahoo' | 'custom'): Partial<SMTPConfig> {
      switch (provider) {
        case 'gmail':
          return {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false
          }
        case 'outlook':
          return {
            host: 'smtp-mail.outlook.com',
            port: 587,
            secure: false
          }
        case 'yahoo':
          return {
            host: 'smtp.mail.yahoo.com',
            port: 587,
            secure: false
          }
        default:
          return {}
      }
    }
  }
  