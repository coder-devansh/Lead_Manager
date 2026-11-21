import { Router } from "express";
import mongoose from "mongoose";
import Lead, { SOURCES, STATUSES } from "../models/Lead.js";

const router = Router();

function validateLead(body, partial = false) {
  const errors = {};
  const required = ["name", "email", "phone", "company", "source"];

  for (const field of required) {
    if (!partial && (!body[field] || !String(body[field]).trim())) {
      errors[field] = "This field is required";
    }
  }
  if (body.name != null && String(body.name).trim().length > 100) errors.name = "Maximum 100 characters";
  if (body.email != null) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email).trim())) errors.email = "Enter a valid email";
  }
  if (body.phone != null && String(body.phone).trim().length > 30) errors.phone = "Maximum 30 characters";
  if (body.company != null && String(body.company).trim().length > 150) errors.company = "Maximum 150 characters";
  if (body.source != null && !SOURCES.includes(body.source)) errors.source = "Select a valid source";
  if (body.status != null && !STATUSES.includes(body.status)) errors.status = "Select a valid status";
  return errors;
}

router.get("/", async (req, res, next) => {
  try {
    const { search = "", status = "" } = req.query;
    const query = {};
    if (status) {
      if (!STATUSES.includes(status)) return res.status(400).json({ message: "Invalid status filter" });
      query.status = status;
    }
    if (search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
        { company: { $regex: search.trim(), $options: "i" } }
      ];
    }
    const leads = await Lead.find(query).sort({ createdAt: -1 });
    res.json(leads);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const errors = validateLead(req.body);
    if (Object.keys(errors).length) return res.status(400).json({ message: "Validation failed", errors });
    const lead = await Lead.create(req.body);
    res.status(201).json(lead);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid lead ID" });
    const errors = validateLead(req.body, true);
    if (Object.keys(errors).length) return res.status(400).json({ message: "Validation failed", errors });
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    res.json(lead);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid lead ID" });
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
