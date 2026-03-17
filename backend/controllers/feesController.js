const supabase = require("../config/supabase");

exports.getFees = async (req, res) => {
  const { data, error } = await supabase.from("fees").select("*, classes(name)");
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
};

exports.getPayments = async (req, res) => {
  const { data, error } = await supabase.from("payments").select("*, students(name)");
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
};

exports.recordPayment = async (req, res) => {
  const { data, error } = await supabase.from("payments").insert([req.body]).select().single();
  if (error) return res.status(400).json({ message: error.message });
  res.status(201).json(data);
};
