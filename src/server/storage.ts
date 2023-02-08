import * as envVars from 'dotenv';
import { GetObjectCommand, PutObjectCommand, S3Client, S3ClientConfig } from '@aws-sdk/client-s3';

envVars.config();

export class Storage {
  client: S3Client;
  bucket: string;
  constructor(config: S3ClientConfig) {
    this.client = new S3Client(config);
    this.bucket = `outline-${process.env.ENVIRONMENT || 'unknown'}`;
  }

  async writeFile(path: string, data: string, makePublic: boolean = false) {
    const params = {
      Bucket: this.bucket,
      Key: path,
      Body: data,
      ACL: makePublic ? 'public' : 'private'
    };

    return this.client.send(new PutObjectCommand(params));
  }

  async getFile<T>(path: string) {
    const params = {
      Bucket: this.bucket,
      Key: path
    };

    const res = await this.client.send(new GetObjectCommand(params));
    return JSON.parse(await res.Body.transformToString('utf8')) as T;
  }
}
