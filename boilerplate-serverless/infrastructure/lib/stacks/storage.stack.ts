import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { BaseBucket } from '../../core/storage';
import { SampleBucket } from '../../core/storage/sample/sample-bucket.construct';

export interface StorageStackProps extends cdk.NestedStackProps {
  /**
   * The environment name (e.g., dev, test, prod)
   */
  environment?: string;
}

export class StorageStack extends cdk.NestedStack {
  /**
   * Registry of all buckets in the stack
   */
  private readonly bucketRegistry: Map<string, BaseBucket> = new Map();
  
  /**
   * The environment name
   */
  private readonly environmentName: string;

  constructor(scope: Construct, id: string, props?: StorageStackProps) {
    super(scope, id, props);

    // Set default values
    this.environmentName = props?.environment || 'dev';

    // Create the sample bucket and register it
    const sampleBucket = new SampleBucket(this, 'SampleBucket', {
      environment: this.environmentName,
    });

    // Register the bucket with the registry
    this.registerBucket('sample', sampleBucket);
  }

  /**
   * Create a bucket and register it in the registry
   * @param id The bucket ID
   * @param props The bucket properties
   */
  public createBucket(id: string, props: s3.BucketProps): s3.Bucket {
    const bucket = new s3.Bucket(this, id, props);
    const wrapper = new BaseBucket(this, `${id}Wrapper`, {
      environment: this.environmentName,
      // We don't set bucketName here to let CDK generate it
    });
    this.bucketRegistry.set(id.toLowerCase(), wrapper);
    return bucket;
  }

  /**
   * Register a bucket in the registry
   * @param id The bucket ID
   * @param bucket The bucket to register
   */
  public registerBucket(id: string, bucket: BaseBucket): void {
    this.bucketRegistry.set(id.toLowerCase(), bucket);
  }

  /**
   * Get a bucket from the registry
   * @param id The bucket ID
   */
  public getBucket(id: string): BaseBucket {
    const bucket = this.bucketRegistry.get(id.toLowerCase());
    if (!bucket) {
      throw new Error(`Bucket with ID ${id} not found in storage stack registry`);
    }
    return bucket;
  }
  
  /**
   * Get all registered bucket IDs
   * @returns Array of bucket IDs
   */
  public getAllBucketIds(): string[] {
    return Array.from(this.bucketRegistry.keys());
  }
} 