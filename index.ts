import cors from "cors"
import express from "express"
import { MongoClient } from "mongodb"

import { laureatsRouter } from "./endpoints/laureats"
import { statsRouter } from "./endpoints/stats"
import { env } from "./env"
export const app = express()
app.use(cors())
const port = 8080

const client = new MongoClient(env.DATABASE_URI)
await client.connect()
export const database = client.db("testdb")
export const nobels = database.collection("nobel")

app.use("/api/laureats", laureatsRouter)
app.use("/api/stats", statsRouter)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

