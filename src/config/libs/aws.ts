import aws from "aws-sdk";
import configStack from "@config/index";

let instance: any;
class Aws {
  constructor() {
    if (instance) {
      return instance;
    }

    instance = this;
    return this;
  }

  public s3() {
    const config = configStack.config;
    aws.config.update({
      accessKeyId: config.aws.s3.accessKeyId,
      secretAccessKey: config.aws.s3.secretAccessKey
    });
    return new aws.S3();
  }
}

export default new Aws();
