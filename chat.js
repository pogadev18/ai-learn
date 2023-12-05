import 'dotenv/config'
import readline from 'node:readline'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const newMessage = async (history, message) => {
  const results = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [...history, message],
  })

  return results.choices[0].message
}

const formatMessage = (userInput) => ({ role: 'user', content: userInput })

const chat = () => {
  // closure
  const history = [
    {
      role: 'system',
      content:
        'You are an AI assistant. You are helping a customer with a problem.',
    },
  ]

  const start = () => {
    rl.question('You: ', async (userInput) => {
      if (userInput.toLowerCase() === 'exit') {
        rl.close()
        return
      }

      const userMessage = formatMessage(userInput)
      const response = await newMessage(history, userMessage)

      history.push(userMessage, response)
      console.log(`\n\nAI: ${response.content}`)
      start() // recursion
    })
  }

  start() // initial "kick-off"
}

console.log('Welcome to the AI chatbot. Type "exit" to quit.')
chat()
