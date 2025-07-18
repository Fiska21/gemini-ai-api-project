const {GoogleGenerativeAI} = require('@google/generative-ai'); //import the Google Generative AI library
const express = require('express'); //import the express library for creating API
const dotenv = require('dotenv'); //load environment variables from .env file
dotenv.config(); //configure dotenv to load environment variables
const app = express(); //create an express application
const port = process.env.PORT || 3000; //set the port to listen on, defaulting to 3000

app.use(express.json()); //middleware to parse JSON request bodies
const multer = require('multer'); //initialize multer for handling multipart/form-data
const upload = multer({ dest: 'uploads/' }); //create an instance of multer
const fs = require('fs'); //import the file system module for file operations
const path = require('path'); //import the path module for handling file paths

const pdfParse = require("pdf-parse"); //import pdf-parse for parsing PDF files
const genAI = new GoogleGenerativeAI(process.env.gemini_API); //initialize Google Generative AI with API key from environment variables
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); //get the Gemini model for generative AI

// Endpoint to read text 
app.post("/generate-text", async (req, res) => {
    try {

        const { prompt } = req.body; //extract the prompt from the request body

        const result = await model.generateContent(prompt);
        const response = result.response; //get the response from the model
        const text = response.text(); //extract the text from the response

        res.status(200).json({ output:text }); //send the text as a JSON response
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while generating text.' }); //handle errors and send a 500 response
    } 

});

const imageGenerativePart = (filepath,mimetype) => ({
    inlineData : {
        data : fs.readFileSync(filepath).toString('base64'),
        mimeType : mimetype
    }
});

// Endpoint to generate image

app.post("/generate-from-image", upload.single('image'), async (req, res) => {
    try {
        const {prompt} = req.body; //extract the prompt from the request body
        const image = imageGenerativePart(req.file.path, 'image/png'); //read the uploaded image file and convert it to base64
        const result = await model.generateContent([{ text: prompt }, image]); //generate content using the model with the prompt and image
        const response = result.response; //get the response from the 
        const text = response.text(); //extract the text from the response
        res.status(200).json({ output: text }); //send the text as a JSON response
    } catch(error) {
        console.log('Error generating image:', error); //log the error
        res.status(500).json({ error: 'An error occurred while generating image.' }); //send a 500 response with an error message
    } finally {
        fs.unlinkSync(req.file.path); //delete the uploaded file
    }
})

// Endpoint untuk membaca document
app.post("/generate-from-document", upload.single('document'), async (req, res) => {
    try{
        //const {prompt} = req.body; //extract the prompt from the request body
        const filepath = req.file.path; //get the path of the uploaded file
        const mimetype = req.file.mimetype; //get the MIME type of the uploaded file
        const document = imageGenerativePart (filepath, mimetype); //read the uploaded document file and convert it to base64
        const result = await model.generateContent([ 'Analyze this document:', document]); //generate content using the model with the prompt and document
        const response = result.response; //get the response from the model
        const text = response.text(); //extract the text from the response
        res.status(200).json({ output: text }); //send the text as a JSON response
    } catch(error) {
        console.log('Error generating document:', error); //log the error
        res.status(500).json({ error: 'An error occurred while generating document.' }); //send a 500 response with an error message    
    } finally {
        fs.unlinkSync(req.file.path)
    }
})

// Endpoint untuk membaca audio
app.post("/generate-from-audio", upload.single('audio'), async (req, res) => {
  try {
    const { transcript } = req.body; // Kirim teks hasil transkripsi secara manual

    if (!transcript) {
      return res.status(400).json({ error: "Transcript is required in request body." });
    }

    const result = await model.generateContent(`Analyze this audio conversation:\n\n${transcript}`);
    const response = result.response;
    const text = response.text();

    res.status(200).json({ output: text });
  } catch (error) {
    console.error("Error generating from audio:", error);
    res.status(500).json({ error: "An error occurred while generating from the audio." });
  } finally {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
  }
});


app.listen(port, () =>{
    console.log(`Server is running on port ${port}`); //start the server and log the port
});