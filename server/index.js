const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware

app.use(bodyParser.json());
app.use(cors());

const drunk = require('./routes/api/drunk');

app.use('/api/drunk/', drunk);

// Handle production build
if(process.env.NODE_ENV === 'production') {

    app.use(express.static(__dirname + '/public/'));

    //Handle SPA
    app.get(/.*/);
}

const port = process.env.PORT || 5000;

app.listen(port, () => console.log("server started on port 5000"));

