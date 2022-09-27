const path = require("path");

module.exports = {
  sql: {
    dialect: 'mysql',
    host: process.env.SQL_HOST,
    port: process.env.SQL_PORT,
    pool: {
      max: 20,
      idle: 30000
    },
    define: {
      "charset": "utf8mb4",
      "dialectOptions": {
        "collate": "utf8mb4_general_ci"
      }
    },
    timezone: '+09:00',
    logging: false
  },

  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    db: process.env.REDIS_DB
  },

  aws: {
    accessKeyId: process.env.AWS_KEY,
    secretAccessKey: process.env.AWS_SECRET,
    region: process.env.AWS_SNS_REGION,
    imgUrl: process.env.AWS_IMG_URL,
    bcKey: process.env.AWS_BC_KEY,
    bcSecret: process.env.AWS_BC_SECRET,
    bcNode: process.env.AWS_BC_NODE,
    bcRegion: process.env.AWS_DEFAULT_REGION
  },

  mail: {
    message: {
      from: process.env.MAIL_FROM
    },
    transport: {
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: true,

      auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS
      }
    },
    views: {
      options: {
        extension: 'ejs' // <---- HERE
      },
      root: path.join(__dirname, '../', 'template', 'email')
    },
    send: true,
    juiceResources: {
      webResources: {
        relativeTo: path.join(__dirname, '../', 'template', 'email')
      }
    }
  },

  bcrypt: {
    saltRounds: process.env.BCRYPT_SALT_ROUNDS
  },

  jwt: {
    secret: process.env.JWT_SECRET
  },

  luniverse: {
    apiKey: process.env.LUNIVERSE_API_KEY,
    apiUrl: process.env.LUNIVERSE_API_URL,
    scanApiUrl: process.env.LUNIVERSE_SCAN_API_URL,
    tokenName: process.env.LUNIVERSE_TOKEN_NAME,
    mt: process.env.LUNIVERSE_MT,
    walletEncKey: process.env.LUNIVERSE_WALLET_ENCKEY,
    v2: {
      apiUrl: process.env.LUNIVERSE_API_V2_URL,
      accessKey: process.env.LUNIVERSE_API_V2_ACCESS_KEY,
      secretKey: process.env.LUNIVERSE_API_V2_SECRET_KEY,
      environmentId: process.env.LUNIVERSE_API_V2_ENVIRONMENT_ID
    }
  },

  ethereum: {
    web3: {
      url: process.env.ETHEREUM_WEB3_URL,
    }
  },

  bitcoin: {
    host: process.env.BITCOIN_HOST,
    port: process.env.BITCOIN_PORT,
    user: process.env.BITCOIN_USER,
    pass: process.env.BITCOIN_PASS,
    network: "mainnet"
  },

  wallet: {
    iv: process.env.WALLET_IV
  },

  cfConfig: {
    keypairId: process.env.AWS_CF_ID,
    privateKeyPath: './config/pk-APKAIAEV5CMR6I4NQNCA.pem',
    imageTimeOut: 60000
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN
  },

  alibaba: {
    accessKeyId: process.env.ALIBABA_ACCESSKEYID,
    accessKeySecret: process.env.ALIBABA_ACCESSKEYSECRET,
    templateCode: process.env.ALIBABA_TEMPLATECODE
  }
}
