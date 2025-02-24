import { SESClient as AWSClient } from '@aws-sdk/client-ses'
import { injectable } from 'inversify'

@injectable()
export class SesClient extends AWSClient {
	constructor() {
		super({ region: process.env.AWS_REGION })
	}
}
