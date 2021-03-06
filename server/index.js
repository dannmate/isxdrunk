const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(bodyParser.json({limit: '10mb', extended: true}))
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}))
//app.use(bodyParser.json());
app.use(cors());

const drunk = require('./routes/api/drunk');
const user = require('./routes/api/user');
const image = require('./routes/api/image');

// Add routes
app.use('/api/drunk/', drunk);
app.use('/api/user/', user);
app.use('/api/image/', image);

// Handle production build
if(process.env.NODE_ENV === 'production') {

    app.use(express.static(__dirname + '/public/'));

    //Handle SPA
    app.get(/.*/, (req,res) => res.sendfile(__dirname + '/public/index.html'));
}

const port = process.env.PORT || 5000;

app.listen(port, () => console.log("server started on port 5000"));

