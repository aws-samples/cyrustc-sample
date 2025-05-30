import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { RemovalPolicy, Tags } from 'aws-cdk-lib';

export interface BaseBucketProps {
  /**
   * The environment name (e.g., dev, test, prod)
   */
  environment?: string;

  /**
   * The bucket name (optional)
   * If not provided, a unique name will be generated by CDK
   */
  bucketName?: string;

  /**
   * Enable versioning for the bucket
   * @default false
   */
  versioned?: boolean;

  /**
   * Enable encryption for the bucket
   * @default true
   */
  encrypted?: boolean;

  /**
   * Enable public access for the bucket
   * @default false
   */
  publicReadAccess?: boolean;

  /**
   * Block public access to the bucket
   * @default true
   */
  blockPublicAccess?: boolean;

  /**
   * Tags for the bucket
   * @default {}
   */
  tags?: { [key: string]: string };

  /**
   * CORS rules for the bucket
   */
  cors?: s3.CorsRule[];
}

export class BaseBucket extends Construct {
  /**
   * The S3 bucket
   */
  public readonly bucket: s3.Bucket;

  /**
   * The bucket ARN
   */
  public readonly bucketArn: string;

  /**
   * The bucket name
   */
  public readonly bucketName: string;

  /**
   * The environment name
   */
  protected readonly environmentName: string;

  constructor(scope: Construct, id: string, props: BaseBucketProps) {
    super(scope, id);

    // Set default values
    this.environmentName = props.environment || 'dev';
    const isDevEnvironment = this.environmentName === 'dev' || this.environmentName === 'local';

    // Create the bucket
    this.bucket = new s3.Bucket(this, 'Bucket', {
      // Only set bucketName if explicitly provided
      ...(props.bucketName ? { bucketName: props.bucketName } : {}),
      versioned: props.versioned ?? false,
      encryption: props.encrypted === false ? undefined : s3.BucketEncryption.S3_MANAGED,
      publicReadAccess: props.publicReadAccess ?? false,
      blockPublicAccess: props.blockPublicAccess === false
        ? undefined 
        : s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: isDevEnvironment ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
      autoDeleteObjects: isDevEnvironment,
      cors: props.cors,
    });

    // Set the properties
    this.bucketArn = this.bucket.bucketArn;
    this.bucketName = this.bucket.bucketName;

    // Apply tags
    if (props.tags) {
      for (const [key, value] of Object.entries(props.tags)) {
        Tags.of(this.bucket).add(key, value);
      }
    }

    // Add default tags
    Tags.of(this.bucket).add('Environment', this.environmentName);
    Tags.of(this.bucket).add('ManagedBy', 'CDK');
  }

  /**
   * Grant read access to the bucket
   */
  public grantRead(grantee: cdk.aws_iam.IGrantable): cdk.aws_iam.Grant {
    return this.bucket.grantRead(grantee);
  }

  /**
   * Grant write access to the bucket
   */
  public grantWrite(grantee: cdk.aws_iam.IGrantable): cdk.aws_iam.Grant {
    return this.bucket.grantWrite(grantee);
  }

  /**
   * Grant read/write access to the bucket
   */
  public grantReadWrite(grantee: cdk.aws_iam.IGrantable): cdk.aws_iam.Grant {
    return this.bucket.grantReadWrite(grantee);
  }
} 