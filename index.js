require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient } = require('mongodb');
const { send } = require('express/lib/response');
const client = new MongoClient(process.env.MONGO_URL)

app.use(express.urlencoded({ extended: true }));

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', async (req, res) => {
  try {
    const database = client.db("freecodecampDB");
    const collection = database.collection("url-shortener-microservice");
    const { url } = req.body
    const isValidUrl = (url) => {
      try {
        const urlObj = new URL(url);
        //console.log(urlObj.protocol)
        if (urlObj.protocol!=='https:') return false; 
        return true;
      } catch (error) {
        return false;
      }
    }

    if (isValidUrl(url)) {
      const query = { url };
      const urlRes = await collection.findOne(query);
      if (urlRes) {
        res.json({url:urlRes.url, short_url:urlRes.short_url})
      } else {
        const estimate = await collection.estimatedDocumentCount();
        const doc = {
          url,
          short_url: estimate + 1,
        }
        const result = await collection.insertOne(doc);
        res.json({
          'original_url': url,
          short_url: estimate + 1,
        })
      }
    } else {
      res.json({ error: 'invalid url' })
    }
  } catch (error) {
    console.log(error)
  }
})
// https://3000-freecodecam-boilerplate-uibcf0lwbjf.ws-us117.gitpod.io/api/shorturl/1
app.get('/api/shorturl/:short_url',async (req,res)=>{
  try{
    const database = client.db("freecodecampDB");
    const collection = database.collection("url-shortener-microservice");
    const{short_url} = req.params;
    const query = { short_url: parseInt(short_url, 10) };
    const urlRes = await collection.findOne(query);  
    if (urlRes) {
      res.redirect(urlRes.url)
    }else{
      res.json({"error": "No short URL found for the given input"})
    }
    
  }catch(error){
    res.json(error);
  }
})

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
