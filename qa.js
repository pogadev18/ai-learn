import { Document } from 'langchain/document'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { CharacterTextSplitter } from 'langchain/text_splitter'
import { PDFLoader } from 'langchain/document_loaders/fs/pdf'
import { YoutubeLoader } from 'langchain/document_loaders/web/youtube'

import { openai } from './openai.js'

const commandLineQuestion = process.argv[2] || 'hi' // argv[2] is the first argument after the command name in the terminal (node qa.js "what is the meaning of life?")
const videoUrl = 'https://youtu.be/zR_iuq2evXo?si=cG8rODgRgXOx9_Cn'

const createStore = async (docs) =>
  MemoryVectorStore.fromDocuments(docs, new OpenAIEmbeddings())

const docsFromYTVideo = (videoUrl) => {
  const loader = YoutubeLoader.createFromUrl(videoUrl, {
    language: 'en',
    addVideoInfo: true,
  })

  return loader.loadAndSplit(
    new CharacterTextSplitter({
      separator: ' ',
      chunkSize: 2500,
      chunkOverlap: 200,
    })
  )
}

const docsFromPDF = () => {
  const loader = new PDFLoader('xbox.pdf')

  return loader.loadAndSplit(
    new CharacterTextSplitter({
      separator: '. ',
      chunkSize: 2500,
      chunkOverlap: 200,
    })
  )
}

const loadStore = async () => {
  const videoDocs = await docsFromYTVideo(videoUrl)
  const pdfDocs = await docsFromPDF()

  console.log(videoDocs[0], pdfDocs[0])

  return createStore([...videoDocs, ...pdfDocs])
}

const query = async () => {
  const store = await loadStore()
  const results = await store.similaritySearch(commandLineQuestion, 2)

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: 'You are a helpful AI. Answer questions to your best ability.',
      },
      {
        role: 'user',
        content: `Answer the following question using the provided context. If you cannot answer the question with the context, don't lie and make up stuff. Just say you need more context.
        Question: ${commandLineQuestion}
  
        Context: ${results.map((r) => r.pageContent).join('\n')}`,
      },
    ],
  })

  console.log(
    `Answer: ${response.choices[0].message.content}\n\nSources: ${results
      .map((r) => r.metadata.source)
      .join(', ')}`
  )
}

query()
