import { Router } from "express";
import mongoose from "mongoose";
import Lead, { SOURCES, STATUSES } from "../models/Lead.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

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
    const { search = "", status = "", sort = "newest", page = "1", limit = "10" } = req.query;
    const query = { owner: req.userId };
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
    const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 10));
    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      name: { name: 1 },
      status: { status: 1 }
    };
    const [leads, total, statusCounts] = await Promise.all([
      Lead.find(query).sort(sortOptions[sort] || sortOptions.newest).skip((pageNumber - 1) * pageSize).limit(pageSize),
      Lead.countDocuments(query),
      Lead.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(req.userId) } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ])
    ]);
    const counts = Object.fromEntries(STATUSES.map((item) => [item, 0]));
    statusCounts.forEach(({ _id, count }) => { counts[_id] = count; });
    res.json({
      leads,
      pagination: { page: pageNumber, limit: pageSize, total, pages: Math.ceil(total / pageSize) },
      counts
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const errors = validateLead(req.body);
    if (Object.keys(errors).length) return res.status(400).json({ message: "Validation failed", errors });
    const lead = await Lead.create({ ...req.body, owner: req.userId });
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
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    res.json(lead);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid lead ID" });
    const lead = await Lead.findOneAndDelete({ _id: req.params.id, owner: req.userId });
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
