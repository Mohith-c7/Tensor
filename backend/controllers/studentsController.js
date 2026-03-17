const supabase = require("../config/supabase");

exports.getAll = async (req, res) => {
  const { data, error } = await supabase.from("students").select("*, parents(*), classes(*), sections(*)");
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
};

exports.getById = async (req, res) => {
  const { data, error } = await supabase.from("students").select("*").eq("id", req.params.id).single();
  if (error) return res.status(404).json({ message: "Student not found" });
  res.json(data);
};

exports.create = async (req, res) => {
  const { data, error } = await supabase.from("students").insert([req.body]).select().single();
  if (error) return res.status(400).json({ message: error.message });
  res.status(201).json(data);
};

exports.update = async (req, res) => {
  const { data, error } = await supabase.from("students").update(req.body).eq("id", req.params.id).select().single();
  if (error) return res.status(400).json({ message: error.message });
  res.json(data);
};

exports.remove = async (req, res) => {
  const { error } = await supabase.from("students").delete().eq("id", req.params.id);
  if (error) return res.status(400).json({ message: error.message });
  res.json({ message: "Student deleted" });
};
