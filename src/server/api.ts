import fastify from 'fastify';
import cors from '@fastify/cors';
import formbody from '@fastify/formbody';

import * as envVars from 'dotenv';
import { v4 as uuid } from 'uuid';
import { Storage } from './storage';
import { prisma } from './db';
import { map } from 'lodash';
import { RawOutline, OutlineTree } from '../lib/outline';

import * as rawStartingOutline from '../client/test-data.json';
import {Account, Prisma} from '@prisma/client';

envVars.config();

const app = fastify({
  logger: !!process.env.API_LOGGER
});

app.register(cors, {
  origin: process.env.CORS_DOMAINS!.toString().split(',')
});

app.register(formbody);

app.log.info(`Cors Domains: ${process.env.CORS_DOMAINS!.toString().split(',')}`);

const cache = new Map<string, string>();

const doStorage = new Storage({
  endpoint: process.env.SPACES_ORIGIN || '',
  forcePathStyle: true,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || '',
    secretAccessKey: process.env.SPACES_SECRET || ''
  }
});

class BadUserInputError extends Error {
  statusCode: number;
  constructor(msg: string) {
    super(msg);
    this.statusCode = 400;
  }
}

app.post('/accounts', async (req, res) => {
  const raw = req.body as { emailAddress: string }
  const emailAddress = raw.emailAddress.trim();

  if(!emailAddress || emailAddress.length < 3) {
    throw new BadUserInputError(`Invalid email address ${raw.emailAddress}`);
  }

  const emailb64 = Buffer.from(emailAddress).toString('base64');

  const account = await prisma.account.upsert({
    where: {
      emailAddress
    },
    update: {
      activationToken: uuid(),
      activatedDate: null,
      activated: false
    },
    create: {
      emailAddress,
    }
  });

  app.log.info(`Saved intial account create request: ${emailb64}`);

  // this should eventually be emailed. The authToken should 
  // NOT exist on the client - only in the users email!
  console.log({
    url: `http://localhost:3000/accounts/${account.id}/activate?emailAddress=${account.emailAddress}&activationToken=${account.activationToken}`
  });

  res.redirect(303, 'http://localhost:3000/');
});

app.get('/accounts/:accountId/activate', async (req, res) => {
  const raw = req.query as { emailAddress: string, activationToken: string};
  const { accountId } = req.params as { accountId: string };

  if(!raw.emailAddress || !raw.activationToken || !accountId) {
    app.log.warn('Inbound account verification data is incorrect');
    throw new BadUserInputError('Invalid account verification data');
  }

  const account = await prisma.account.findUnique({
    where: {
      id: accountId
    }
  });

  if(!account) {
    app.log.warn('Account ID/email Address were not a match for verification');
    throw new BadUserInputError('Invalid account verification data');
  }

  if(account.emailAddress !== raw.emailAddress) {
    app.log.warn(`User [${account.id}] attempted to activate an invalid email`);
    throw new BadUserInputError('Invalid account verification data');
  }

  if(raw.activationToken !== account.activationToken) {
    app.log.warn(`User [${account.id}] attempted to use an invalid activation token`);
    throw new BadUserInputError('Invalid account verification data');
  }

  await prisma.account.update({
    where: {
      id: account.id
    },
    data: {
      activatedDate: new Date(),
      activated: true
    }
  });

  res.redirect(303, `http://localhost:3000?token=${account.activationToken}&accountId=${account.id}`);
});

function timestampBackup() {
  const now = new Date();

  return `${now.getUTCFullYear()}-${now.getUTCMonth()+1}-${now.getUTCDate()}`;
}

app.post('/backup', async req => {
  const outline = req.body as string;
  const { outlineId } = req.query as { outlineId: string };

  const timestamp = timestampBackup();
  const data = await doStorage.writeFile(`outlines/${outlineId}.${timestamp}.json`, outline);
  app.log.info(data);

  return {
    outlineId: outlineId,
    saveDate: timestamp
  };
});

async function validateActivatedAccount(accountId: string, token: string): Promise<Account> {
  const account = await prisma.account.findUnique({
    where: {
      id: accountId
    }
  });

  if(!account) {
    throw new BadUserInputError('Invalid account information');
  }

  if(!account.activated || account.activationToken !== token) {
    app.log.warn(`Outline creation attempt with invalid activation token: ${accountId}`);
    throw new BadUserInputError('This account is not verified yet');
  }

  return account;
}

// this endpoint is used to create an outline. If the outline already exists 
// it will return a 206 which indicates partial content. 
// if the outline doesn't exist, you'll receive a 201
app.post('/account/:accountId/outline/:outlineId', async (req, res) => {
  // validate authToken
  const { accountId, outlineId } = req.params as { accountId: string, outlineId: string };
  const { token } = req.query as { token: string };

  const account = await validateActivatedAccount(accountId, token)

  const outline = await prisma.outline.findUnique({
    where: {
      id_accountId: {
        id: outlineId,
        accountId: accountId
      }
    }
  });

  if(!outline) {
    // outline doesn't exist, lets create it
    const outline = await prisma.outline.create({
      data: {
        id: outlineId,
        accountId: accountId,
        name: 'My Outline',
        tree: [] as Prisma.JsonArray
      }
    });

    res.code(201);
  }
  else {
    // outline exists, lets let the client know 
    // but not touch it
    res.code(206);
  }

  return {};
});

// used to update the tree state
app.patch('/account/:accountId/outline/:outlineId', async (req, res) => {
  // validate authToken
  const { accountId, outlineId } = req.params as { accountId: string, outlineId: string };
  const { token } = req.query as { token: string };
  const { outlineTree } = req.body as { outlineTree: Prisma.JsonArray };

  const account = validateActivatedAccount(accountId, token);

  const update = await prisma.outline.update({
    where: {
      id_accountId: {
        id: outlineId,
        accountId: accountId
      }
    },
    data: {
      lastUpdated: new Date(),
      tree: outlineTree
    }
  });

  res.code(200);
  return {};
});

app.post('/account/:accountId/batch-content-create', async (req, res) => {
  const { accountId } = req.params as { accountId: string };
  const { token } = req.query as { token: string };
  const data = req.body as { content: any[] };

  const account = validateActivatedAccount(accountId, token);

  const update = await prisma.contentNode.createMany({
    data: data.content.map(c => {
      let obj = {
        id: c.id,
        accountId: accountId,
        type: c.type,
        content: c.content,
        archiveDate: c.archiveDate
      }

      return obj;
    }),
    skipDuplicates: true
  });

  res.code(201);
  return {};
});


// this is the endpoint that accepts a bunch of changes to node states 
// and propagates them to the database to save network calls.
app.patch('/account/:accountId/content/:contentId', async req => {

});

async function main() {
  try {
    await app.listen({ port: parseInt(process.env.API_PORT) || 3000 });
  }
  catch(err) {
    process.exit(1);
  }
}

main();
