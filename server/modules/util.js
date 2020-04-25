const mongodb  = require('mongodb');
const AWS = require('aws-sdk');
require('dotenv').config();

module.exports = {
    getDrunk: async function() {

        const client = await mongodb.MongoClient.connect(
            process.env.MONGODB_CONNECTION_STRING,{useNewUrlParser: true, useUnifiedTopology: true});
    
        return client.db('isxdrunk').collection('drunk');
    },
    checkDrunk: async function(drunkCollection) {

        const current_ts = new Date();
        const maxDrunkTs = await drunkCollection.find().sort({drunkEndDate:-1}).limit(1).toArray();

        return current_ts < maxDrunkTs[0].drunkEndDate;
    },
    getUsers: async function(drunkCollection) {

        const client = await mongodb.MongoClient.connect(
            process.env.MONGODB_CONNECTION_STRING,{useNewUrlParser: true, useUnifiedTopology: true});
    
        return client.db('isxdrunk').collection('user');
    },
    uploadImageToS3Bucket: async function(base64) {

        try {
            // Configure AWS with access and secret key.
          const { ACCESS_KEY_ID, SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET } = process.env;
  
          // Configure AWS to use promise
          AWS.config.setPromisesDependency(require('bluebird'));
          AWS.config.update({ accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY, region: AWS_REGION });
  
          //const base64 = "data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==";
  
          const s3 = new AWS.S3();
          const base64Data = new Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
          const type = base64.split(';')[0].split('/')[1];
          const fileID = await this.uuidv4();
  
          const params = {
              Bucket: S3_BUCKET,
              Key: `${fileID}.${type}`, 
              Body: base64Data,
              ACL: 'public-read',
              ContentEncoding: 'base64', 
              ContentType: `image/${type}` 
            }
          
          let location = '';
          let key = '';
          
          const { Location, Key } = await s3.upload(params).promise();
          location = Location;
          key = Key;
          
          return location;
      } 
      catch(err){
        throw new Error(err.message)
      }

    },
    uuidv4: async function() {

        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
    },
    getDrunkImages: async function() {

        const client = await mongodb.MongoClient.connect(
            process.env.MONGODB_CONNECTION_STRING,{useNewUrlParser: true, useUnifiedTopology: true});
    
        return client.db('isxdrunk').collection('images');
    }
    

}
  