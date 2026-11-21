import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : null;
  if (!token) return res.status(401).json({ message: "Authentication required" });

  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET || "lead-manager-development-secret").sub;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired session" });
  }
}
