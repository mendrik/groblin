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

		const myFunction = new LFunction(this, 'HelloWorldFunction', {
			runtime: Runtime.NODEJS_LATEST,
			handler: 'index.handler',
			code: Code.fromInline(`
            exports.handler = async function(event) {
              return {
                statusCode: 200,
                body: JSON.stringify('Hello World!'),
              };
            };
          `)
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
