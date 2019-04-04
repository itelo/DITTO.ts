import sharp from "sharp";
import Firebase from "@config/libs/firebase";
import configStack from "@config/index";
import fs from "fs";
import express from "express";
import multer from "multer";

export function uploadToFirebaseStorage(
  storageRef: string,
  file: Express.Multer.File,
  sizes?: Array<number>
) {
  const config = configStack.config;

  const firebase = Firebase.app();

  // Get a reference to the storage service, which is used to create references in your storage bucket
  const storage = firebase.storage();

  // Points to the enverioremt reference, could be "", "dev", "test"
  const { baseRef, bucketName } = config.firebase.storage;

  const metadata = {
    // Enable long-lived HTTP caching headers
    // Use only if the contents of the file will never change
    // (If the contents will change, use cacheControl: 'no-cache')
    cacheControl: "public, max-age=31536000",
    contentType: file.mimetype
  };

  const destination = `${baseRef}/${storageRef}/${file.filename}`;
  const result = storage.bucket(bucketName).upload(file.path, {
    // Support for HTTP requests made with `Accept-Encoding: gzip`
    gzip: true,
    public: true,
    destination,
    metadata
  });

  return result;
}

/**
 *
 * Simple delete a local file, normally used to delete the resized images
 *
 * @param filePath Path of the image, e.g. photo.jpeg
 */
export function deleteLocalImage(filePath: string) {
  fs.unlinkSync(filePath);
}

/**
 *
 * @param storageRef Path where the file are, e.g. users/profile
 * @param filename Filename of a image, e.g. photo.jpeg
 * @param options An object that receives the acceptable action and extire time in MM-DD-YYYY
 */
export function generateSignedUrl(
  storageRef: string,
  filename: string,
  _options = {}
): Promise<string> {
  const config = configStack.config;

  const firebase = Firebase.app();

  // Get a reference to the storage service, which is used to create references in your storage bucket
  const storage = firebase.storage();

  // Points to the enverioremt reference, could be "", "dev", "test"
  const { baseRef, bucketName } = config.firebase.storage;

  // These options will allow temporary read access to the file
  const options = {
    action: "read",
    expires: "10-22-2208",
    ..._options
  };

  const imagePath = `${baseRef}/${storageRef}/${filename}`;

  // Get a signed URL for the file
  return new Promise((resolve, reject) => {
    storage
      .bucket(bucketName)
      .file(imagePath)
      .getSignedUrl(options)
      .then(results => {
        const url = results[0];
        resolve(url);
      })
      .catch(reject);
  });

  // [END storage_generate_signed_url]
}

// /**
//  * @function deleteFolderAtGoogleCloudStorage
//  * @param bucketName Name of a bucket, e.g. my-bucket
//  * @param prefix Path where the file are, e.g. users/profile
//  */
// export function deleteFolderAtGoogleCloudStorage(
//   bucketName: string,
//   prefix: string
// ) {
//   return storage.bucket(bucketName).deleteFiles({
//     prefix
//   });
// }

/**
 *
 * @param filepath the local file path, e.g. /tmp/78231592138291301
 * @param size the resized image size in px, e.g 100 will be 100px
 * @param quality a porcentage from 0 to 100 that indicates the result image quality, e.g. 30
 */
export function resizeImage(
  filepath: string,
  size: number,
  quality: number = 80,
  format: "jpeg" | "webp" = "jpeg"
): Promise<ResizedResult> {
  return new Promise((resolve, reject) => {
    const resizedFilepath = `${filepath}-x${size}`;
    sharp(filepath)
      .resize(size)
      [format]({
        quality
      })
      .toFile(resizedFilepath)
      .then(() =>
        resolve({ path: resizedFilepath, size, mimetype: "image/jpeg" })
      )
      .catch(reject);
  });
}

/**
 *
 * A wrapper function that contains:
 * { resizeImage, uploadToFirebaseStorage, deleteLocalImage, generateSignedUrl }
 *
 * @param {Express.Multer.File} file the original Multer File object to be resized
 * @param {number} size the size, e.g. 100
 * @param {string} path
 * @param {string} url the url used to put the image in correct path
 * @returns {Promise<string>} A promise that resolve to the url of the resized image
 */
export function resizeUploadToFirebaseAndGetURL(
  file: Express.Multer.File,
  size: number,
  path: string,
  url: string
): Promise<string> {
  let _file = {} as Express.Multer.File;

  // resize image for size with quality 100
  return resizeImage(file.path, size, 100)
    .then((resized: { path: string; mimetype: string }) => {
      _file = {
        ...file,
        filename: `${file.filename}-x${size}`,
        path: resized.path,
        mimetype: resized.mimetype
      };

      // upload the resized image to google cloud storage
      return uploadToFirebaseStorage(url, _file);
    })
    .then(() => {
      // since we already upload the resized image we can delete the local image
      deleteLocalImage(`${path}/${_file.filename}`);

      // get the url for resized image in google cloud storage
      return generateSignedUrl(url, _file.filename);
    });
}

export interface ResizedResult {
  path: string;
  size: number;
  mimetype: "image/jpeg" | "image/webp";
}
