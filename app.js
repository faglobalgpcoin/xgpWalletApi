require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require("body-parser");
const AWS = require("aws-sdk");
const request = require("request");

const { jwtMiddleware } = require("./lib/jwt");
const apiRouter = require('./routes/api/v1');

const app = express();

AWS.config.update({
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET,
  region: process.env.AWS_SNS_REGION
});

const sns = new AWS.SNS();

app.use(helmet());
app.use(cors({origin: true, credentials: true}));
app.disable('x-powered-by');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(jwtMiddleware);
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: false }));

app.get("/status", (req, res) => {
  res.json(true);
});

app.use((req, res, next) => {
  if (req.get("x-amz-sns-message-type")) {
    req.headers["content-type"] = "application/json";
  }
  next();
});

app.post("/sns-bounce", (req, res) => {
  let body = ''

  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', () => {
    let payload = JSON.parse(body)

    console.log(payload);

    if (payload.Type === 'SubscriptionConfirmation') {
      const promise = new Promise((resolve, reject) => {
        const url = payload.SubscribeURL;

        request(url, (error, response) => {
          if (!error && response.statusCode == 200) {
            console.log('Yess! We have accepted the confirmation from AWS')
            return resolve()
          } else {
            return reject()
          }
        })
      })

      promise.then(() => {
        res.end("ok")
      });
    }
  });
});
//app.use(logger('dev'));

app.use('/api/v1', apiRouter);
app.use(logger('dev'));
app.get("*", (req, res) => {
  res.status(404);
  res.json({"message":"Not Found","error":{"message":"Not Found"}});
});

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.json(res.locals);
});

module.exports = app;
