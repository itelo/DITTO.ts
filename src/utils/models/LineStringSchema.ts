import mongoose from "mongoose";
import { arrayLimit } from "./validators";

export type LineStringType = {
  type: "LineString";
  coordinates: [number, number];
};

export const LineStringScheme = new mongoose.Schema({
  type: {
    type: String, // Don't do `{ location: { type: String } }`
    enum: ["LineString"], // 'location.type' must be 'LineString'
    required: true
  },
  coordinates: [
    {
      type: [Number],
      validate: [arrayLimit(2), "Need pass lat and long"],
      required: true
    }
  ]
});
