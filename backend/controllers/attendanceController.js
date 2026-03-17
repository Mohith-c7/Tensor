const supabase = require("../config/supabase");

exports.getAll = async (req, res) => {
  const { data, error } = await supabase.from("attendance").select("*, students(name)");
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
};

exports.mark = async (req, res) => {
  const { data, error } = await supabase.from("attendance").insert([req.body]).select().single();
  if (error) return res.status(400).json({ message: error.message });
  res.status(201).json(data);
};
