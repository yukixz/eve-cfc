const port = 8001
const prefix = '/cfc'

const fs = require('fs')
const express = require('express')
const examine = require('./examine')

const app = express()
app.use(express.json())
app.use(prefix, express.static('public'))

app.post(`${prefix}/`, async (req, res, next) => {
  const r = await examine(req.body.skills, req.body.fitting)
  res.json(r)
  await next()
})

app.listen(port, () => {
  console.log(`Server listening at ${port}...`)
})