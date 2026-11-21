import mongoose from "mongoose";

export const SOURCES = ["Website", "Referral", "Social Media", "Advertisement", "Cold Call", "Other"];
export const STATUSES = ["New", "Contacted", "Qualified", "Lost"];

const leadSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"]
    },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    company: { type: String, required: true, trim: true, maxlength: 150 },
    source: { type: String, required: true, enum: SOURCES },
    status: { type: String, required: true, enum: STATUSES, default: "New" }
  },
  { timestamps: true }
);

leadSchema.index({ name: "text", email: "text", company: "text" });
leadSchema.index({ status: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ owner: 1, status: 1, createdAt: -1 });

export default mongoose.model("Lead", leadSchema);
