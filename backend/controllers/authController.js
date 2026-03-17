const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const supabase = require("../config/supabase");

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const { data: users, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !users) return res.status(401).json({ message: "Invalid credentials" });

  const valid = await bcrypt.compare(password, users.password);
  if (!valid) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: users.id, email: users.email, role: users.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({ token, user: { email: users.email, role: users.role } });
};

exports.register = async (req, res) => {
  const { email, password, role } = req.body;
  const hashed = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from("users")
    .insert([{ email, password: hashed, role }])
    .select()
    .single();

  if (error) return res.status(400).json({ message: error.message });
  res.status(201).json({ message: "User created", user: data });
};
