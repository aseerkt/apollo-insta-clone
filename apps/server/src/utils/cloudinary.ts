import { ImageTransformationOptions, v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY_ROOT_PATH, __prod__ } from '../constants';
import crypto from 'node:crypto';
import {
  CloudinarySignature,
  CloudinaryUploadResult,
  EnumFilePathPrefix,
} from '../types';

const API_SECRET = process.env.CLOUDINARY_API_SECRET!;

function getTransformationOptions(
  pathPrefix: EnumFilePathPrefix
): ImageTransformationOptions {
  return pathPrefix === EnumFilePathPrefix.POSTS
    ? {
        width: 600,
      }
    : {
        width: 180,
        height: 180,
      };
}

export function generateUrl(selector: string, pathSuffix: EnumFilePathPrefix) {
  const options = getTransformationOptions(pathSuffix);

  return cloudinary.url(selector, {
    ...options,
    quality: 'auto',
    format: 'webp',
  });
}

export async function deleteCloudinaryFile(public_id: string) {
  if (public_id.startsWith(CLOUDINARY_ROOT_PATH)) {
    await cloudinary.uploader.destroy(public_id);
    return true;
  }
  return false;
}

export const createUploadSignature = (
  pathPrefix: EnumFilePathPrefix
): CloudinarySignature => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const publicId = `${CLOUDINARY_ROOT_PATH}/${pathPrefix}/${crypto
    .randomBytes(32)
    .toString('hex')}`;
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, public_id: publicId },
    API_SECRET
  );

  return { timestamp, signature, publicId };
};

export const verifySignature = (result: CloudinaryUploadResult) => {
  const expectedSignature = cloudinary.utils.api_sign_request(
    { public_id: result.publicId, version: result.version },
    API_SECRET
  );

  if (expectedSignature !== result.signature)
    throw new Error('Invalid file signature');
};
