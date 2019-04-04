import { SafeUser } from "@models/user.model";
import mongoose from "mongoose";
import configStack from "@config/index";
const config = configStack.config;
// owasp.config(config.shared.owasp);

const Schema = mongoose.Schema;

export type AlbumModel = mongoose.Document & {
  user: SafeUser;
  images_url: {
    original?: string;
    x256?: string;
    x720?: string;
  };
};

/**
 * Album Schema
 */
const AlbumSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  images_url: [
    {
      original: String,
      x256: String,
      x720: String
    }
  ]
});

/**
 * Seeds the User collection with document (User)
 * and provided options.
 */
// AlbumSchema.statics.seed = createSeed("Album");

export default mongoose.model<AlbumModel>("Album", AlbumSchema);
