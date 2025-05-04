import { Construct } from 'constructs';
import { BaseBucket, BaseBucketProps } from '../base/base-bucket.construct';
import * as s3 from 'aws-cdk-lib/aws-s3';

export interface SampleBucketProps extends Omit<BaseBucketProps, 'bucketName'> {
  /**
   * Optional bucket name - if not provided, CDK will auto-generate one
   */
  bucketName?: string;
}

/**
 * Sample bucket for demonstration purposes
 */
export class SampleBucket extends BaseBucket {
  constructor(scope: Construct, id: string, props?: SampleBucketProps) {
    // Define CORS rules to allow web access
    const corsRules: s3.CorsRule[] = [
      {
        allowedMethods: [
          s3.HttpMethods.GET,
          s3.HttpMethods.HEAD,
        ],
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
      },
    ];

    // Call the base class constructor
    super(scope, id, {
      ...props,
      // Only pass bucketName if explicitly provided
      bucketName: props?.bucketName,
      cors: corsRules,
      versioned: true,
      tags: {
        ...props?.tags,
        Service: 'Storage',
        Feature: 'Sample'
      }
    });
  }
} 