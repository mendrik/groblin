import { CfnOutput, Stack, type StackProps } from 'aws-cdk-lib'
import {
	Code,
	FunctionUrlAuthType,
	Function as LFunction,
	Runtime
} from 'aws-cdk-lib/aws-lambda'
import type { Construct } from 'constructs'

export class BackendStack extends Stack {
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props)

		const myFunction = new LFunction(this, 'RegisterFunction', {
			runtime: Runtime.NODEJS_LATEST,
			handler: 'register.handler',
			code: Code.fromAsset('src')
		})

		// Define the Lambda function URL resource
		const myFunctionUrl = myFunction.addFunctionUrl({
			authType: FunctionUrlAuthType.NONE
		})

		// Define a CloudFormation output for your URL
		new CfnOutput(this, 'myFunctionUrlOutput', {
			value: myFunctionUrl.url
		})
	}
}
