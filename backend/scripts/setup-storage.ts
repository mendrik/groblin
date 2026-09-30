import {
	CreateBucketCommand,
	HeadBucketCommand,
	PutBucketCorsCommand,
	S3Client
} from '@aws-sdk/client-s3'

const s3 = new S3Client({
	region: process.env.AWS_REGION,
	endpoint: process.env.S3_ENDPOINT,
	forcePathStyle: true,
	maxAttempts: 1
})
try {
	let ready = false
	for (let attempt = 0; attempt < 60; attempt++) {
		try {
			await s3.send(new HeadBucketCommand({ Bucket: process.env.AWS_BUCKET }))
			ready = true
			break
		} catch {
			await new Promise(resolve => setTimeout(resolve, 1000))
		}
	}
	if (!ready)
		await s3.send(new CreateBucketCommand({ Bucket: process.env.AWS_BUCKET }))
	await s3.send(
		new PutBucketCorsCommand({
			Bucket: process.env.AWS_BUCKET,
			CORSConfiguration: {
				CORSRules: [
					{
						AllowedOrigins: (process.env.TRUSTED_ORIGINS ?? '').split(','),
						AllowedMethods: ['GET', 'HEAD', 'PUT'],
						AllowedHeaders: ['content-type', 'content-length'],
						ExposeHeaders: ['etag'],
						MaxAgeSeconds: 3600
					}
				]
			}
		})
	)
	console.log(JSON.stringify({ event: 'storage_ready' }))
} finally {
	s3.destroy()
}
