// backend/src/middleware/auth.js
const jwt = require("jsonwebtoken");
const { supabaseAdmin } = require("../config/database");
const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    console.log("🔐 Auth middleware reached");

    // 1️⃣ Try backend-issued JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 🧠 Detect Supabase-issued token (has iss: "https://<project>.supabase.co/auth/v1")
      if (decoded?.iss?.includes("supabase.co/auth/v1")) {
        console.log("🌐 Detected Supabase token, skipping backend JWT path");
        throw new Error("Supabase token detected");
      }

      console.log("✅ Using backend JWT path:", decoded);

      const { data: user, error } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("id", decoded.userId)
        .maybeSingle();

      if (!user || error) {
        return res.status(401).json({ error: "Invalid backend token" });
      }

      req.user = user;
      return next();
    } catch (e) {
      console.log("🌐 Trying Supabase OAuth token path...");
    }

    // 2️⃣ Verify Supabase token manually
    const verifyRes = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    });

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok) {
      console.error("❌ Supabase manual verify failed:", verifyData);
      return res.status(401).json({ error: "Invalid or expired Supabase token" });
    }

    const supUser = verifyData;
    console.log("✅ Verified Supabase user:", supUser.email);

    // 3️⃣ Ensure user exists in our users table
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", supUser.id)
      .maybeSingle();

    if (fetchErr) {
      console.error("Error reading users table:", fetchErr);
    }

    if (!existing) {
      console.log("🆕 Inserting new Supabase user:", supUser.email);

      const toInsert = {
        id: supUser.id,
        email: supUser.email,
        full_name: supUser.user_metadata?.full_name || supUser.email,
        avatar_url: supUser.user_metadata?.avatar_url || null,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from("users")
        .upsert(toInsert, { onConflict: "id" }) // ✅ prevents duplicate key errors
        .select()
        .maybeSingle();

      if (insertErr) {
        console.error("❌ Failed to insert user:", insertErr.message);
      } else {
        console.log("✅ User synced:", inserted?.email || toInsert.email);
      }

      req.user = inserted || toInsert;
      return next();
    }


    req.user = existing;
    return next();
  } catch (err) {
    console.error("Auth middleware unexpected error:", err);
    return res.status(403).json({ error: "Invalid token" });
  }
};

// ✅ Keep existing role-check logic
const checkWorkspaceAccess = (requiredRole = "member") => {
  return async (req, res, next) => {
    try {
      const workspaceId = req.params.workspaceId || req.body.workspaceId;
      if (!workspaceId)
        return res.status(400).json({ error: "Workspace ID required" });

      const { data: membership, error } = await supabaseAdmin
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspaceId)
        .eq("user_id", req.user.id)
        .maybeSingle();

      if (error || !membership)
        return res.status(403).json({ error: "Access denied to workspace" });

      const roleHierarchy = { guest: 0, member: 1, admin: 2, owner: 3 };
      const userRoleLevel = roleHierarchy[membership.role] ?? 0;
      const requiredRoleLevel = roleHierarchy[requiredRole] ?? 0;

      if (userRoleLevel < requiredRoleLevel)
        return res.status(403).json({ error: "Insufficient permissions" });

      req.workspaceRole = membership.role;
      next();
    } catch (error) {
      console.error("Workspace access check error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
};

module.exports = {
  authenticateToken,
  checkWorkspaceAccess,
};
