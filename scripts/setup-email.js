const nodemailer = require('nodemailer')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function setupEmail() {
  console.log('🚀 Meeting Scheduler Email Setup\n')
  
  try {
    console.log('Choose your email provider:')
    console.log('1. Gmail')
    console.log('2. Outlook/Hotmail')
    console.log('3. Yahoo')
    console.log('4. Custom SMTP')
    
    const provider = await question('\nEnter your choice (1-4): ')
    
    let config = {}
    
    switch (provider) {
      case '1':
        config = {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false
        }
        console.log('\n📧 Gmail Setup:')
        console.log('1. Go to Google Account settings')
        console.log('2. Enable 2-Factor Authentication')
        console.log('3. Go to Security → App passwords')
        console.log('4. Generate app password for "Mail"')
        console.log('5. Use the 16-character password below\n')
        break
        
      case '2':
        config = {
          host: 'smtp-mail.outlook.com',
          port: 587,
          secure: false
        }
        console.log('\n📧 Outlook Setup:')
        console.log('Use your regular Outlook password\n')
        break
        
      case '3':
        config = {
          host: 'smtp.mail.yahoo.com',
          port: 587,
          secure: false
        }
        console.log('\n📧 Yahoo Setup:')
        console.log('You may need to enable "Less secure app access"\n')
        break
        
      case '4':
        config.host = await question('SMTP Host: ')
        config.port = parseInt(await question('SMTP Port: '))
        config.secure = (await question('Use SSL/TLS? (y/n): ')).toLowerCase() === 'y'
        break
        
      default:
        console.log('Invalid choice')
        process.exit(1)
    }
    
    const email = await question('Your email address: ')
    const password = await question('Your password (or app password): ')
    const fromName = await question('From name (e.g., "Meeting Scheduler"): ')
    
    // Test the configuration
    console.log('\n🔄 Testing email configuration...')
    
    const transporter = nodemailer.createTransporter({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: email,
        pass: password
      }
    })
    
    await transporter.verify()
    console.log('✅ Email configuration test successful!')
    
    // Generate .env content
    console.log('\n📝 Add these to your .env.local file:')
    console.log('=' .repeat(50))
    console.log(`SMTP_HOST=${config.host}`)
    console.log(`SMTP_PORT=${config.port}`)
    console.log(`SMTP_SECURE=${config.secure}`)
    console.log(`SMTP_USER=${email}`)
    console.log(`SMTP_PASS=${password}`)
    console.log(`FROM_EMAIL=${email}`)
    console.log(`FROM_NAME=${fromName}`)
    console.log(`APP_URL=http://localhost:3000`)
    console.log(`CRON_SECRET=your-secure-cron-secret-here`)
    console.log('=' .repeat(50))
    
    // Send test email
    const sendTest = await question('\nSend test email? (y/n): ')
    if (sendTest.toLowerCase() === 'y') {
      const testEmail = await question('Test email address: ')
      
      const testResult = await transporter.sendMail({
        from: `${fromName} <${email}>`,
        to: testEmail,
        subject: 'Meeting Scheduler - Setup Test',
        html: `
          <h2>🎉 Email Setup Successful!</h2>
          <p>Your Meeting Scheduler email configuration is working perfectly.</p>
          <p>You can now use all email features including:</p>
          <ul>
            <li>Meeting invitations</li>
            <li>RSVP management</li>
            <li>Meeting reminders</li>
            <li>Update notifications</li>
          </ul>
          <p>Setup completed at: ${new Date().toLocaleString()}</p>
        `
      })
      
      console.log(`✅ Test email sent successfully! Message ID: ${testResult.messageId}`)
    }
    
    console.log('\n🎉 Email setup completed successfully!')
    console.log('Restart your Next.js application to apply the changes.')
    
  } catch (error) {
    console.error('\n❌ Email setup failed:', error.message)
    
    if (error.message.includes('Invalid login')) {
      console.log('\n💡 Troubleshooting tips:')
      console.log('- For Gmail: Use App Password, not regular password')
      console.log('- For Outlook: Try enabling "Less secure app access"')
      console.log('- Check your email and password are correct')
    }
  } finally {
    rl.close()
  }
}

setupEmail()
