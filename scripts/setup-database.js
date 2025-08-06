const { MongoClient } = require('mongodb')

const uri = process.env.MONGODB_URI || 'mongodb+srv://nikhil:1234@vediotube.lvrjv.mongodb.net/MeetManager?retryWrites=true&w=majority&appName=VedioTube'

async function setupDatabase() {
  const client = new MongoClient(uri)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB Atlas')
    
    const db = client.db('MeetManager')
    
    // Drop existing collections if they exist
    try {
      await db.collection('users').drop()
      console.log('Dropped existing users collection')
    } catch (e) {
      console.log('Users collection does not exist, creating new one')
    }
    
    try {
      await db.collection('meetings').drop()
      console.log('Dropped existing meetings collection')
    } catch (e) {
      console.log('Meetings collection does not exist, creating new one')
    }
    
    // Create collections with validation
    await db.createCollection('users', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name', 'email', 'password', 'createdAt', 'isActive'],
          properties: {
            name: { bsonType: 'string', minLength: 1 },
            email: { bsonType: 'string', pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' },
            password: { bsonType: 'string', minLength: 6 },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' },
            lastLoginAt: { bsonType: 'date' },
            isActive: { bsonType: 'bool' },
            avatar: { bsonType: 'string' },
            timezone: { bsonType: 'string' },
            preferences: {
              bsonType: 'object',
              properties: {
                emailNotifications: { bsonType: 'bool' },
                reminderTime: { bsonType: 'number' },
                defaultMeetingDuration: { bsonType: 'number' }
              }
            }
          }
        }
      }
    })
    
    await db.createCollection('meetings', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['title', 'date', 'startTime', 'endTime', 'organizer', 'createdAt', 'isActive'],
          properties: {
            title: { bsonType: 'string', minLength: 1 },
            agenda: { bsonType: 'string' },
            date: { bsonType: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
            startTime: { bsonType: 'string', pattern: '^\\d{2}:\\d{2}$' },
            endTime: { bsonType: 'string', pattern: '^\\d{2}:\\d{2}$' },
            location: { bsonType: 'string' },
            organizer: {
              bsonType: 'object',
              required: ['id', 'name', 'email'],
              properties: {
                id: { bsonType: 'string' },
                name: { bsonType: 'string' },
                email: { bsonType: 'string' }
              }
            },
            participants: {
              bsonType: 'array',
              items: {
                bsonType: 'object',
                required: ['email', 'name', 'status'],
                properties: {
                  email: { bsonType: 'string' },
                  name: { bsonType: 'string' },
                  status: { enum: ['invited', 'accepted', 'declined', 'maybe'] },
                  respondedAt: { bsonType: 'date' }
                }
              }
            },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' },
            isActive: { bsonType: 'bool' },
            meetingType: { enum: ['in-person', 'virtual', 'hybrid'] },
            reminderSent: { bsonType: 'bool' },
            notes: { bsonType: 'string' },
            attachments: { bsonType: 'array', items: { bsonType: 'string' } }
          }
        }
      }
    })
    
    // Create indexes for better performance
    await db.collection('users').createIndex({ email: 1 }, { unique: true })
    await db.collection('users').createIndex({ isActive: 1 })
    
    await db.collection('meetings').createIndex({ 'organizer.id': 1 })
    await db.collection('meetings').createIndex({ 'participants.email': 1 })
    await db.collection('meetings').createIndex({ date: 1, startTime: 1 })
    await db.collection('meetings').createIndex({ isActive: 1 })
    await db.collection('meetings').createIndex({ createdAt: -1 })
    
    // Insert a demo user for testing
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash('password', 12)
    
    await db.collection('users').insertOne({
      name: 'Demo User',
      email: 'demo@example.com',
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      preferences: {
        emailNotifications: true,
        reminderTime: 15,
        defaultMeetingDuration: 60
      }
    })
    
    console.log('Database setup completed successfully!')
    console.log('Collections created: users, meetings')
    console.log('Indexes created for optimal performance')
    console.log('Demo user created: demo@example.com / password')
    
  } catch (error) {
    console.error('Database setup error:', error)
  } finally {
    await client.close()
  }
}

setupDatabase()
