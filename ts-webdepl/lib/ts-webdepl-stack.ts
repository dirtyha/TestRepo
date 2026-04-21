import { Bucket } from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib/core';
import { join } from 'path';
import { Construct } from 'constructs';
import { existsSync } from 'fs';
import { OriginAccessIdentity, Distribution } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';

export class TsWebdeplStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const deploymentBucket = new Bucket(this, 'TsWebdeploymentBucket');

    const uiDir = join(__dirname, '..', '..', 'web', 'dist');
    if (!existsSync(uiDir)) {
      console.warn(`UI directory not found at ${uiDir}. Please build the UI before deploying.`);
      return;
    }

    const originIdentity = new OriginAccessIdentity(this, 'TsWebOriginAccessIdentity');
    deploymentBucket.grantRead(originIdentity);

    const distribution = new Distribution(this, 'TsWebDistribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new S3Origin(deploymentBucket, { originAccessIdentity: originIdentity }),
      },
    });

    new BucketDeployment(this, 'TsWebBucketDeployment', {
      sources: [Source.asset(uiDir)],
      destinationBucket: deploymentBucket,
      distribution: distribution,
    });

    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: distribution.distributionDomainName,
      description: 'The domain name of the CloudFront distribution',
    }); 
  }
}
