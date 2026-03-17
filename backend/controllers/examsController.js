const supabase = require("../config/supabase");

exports.getExams = async (req, res) => {
  const { data, error } = await supabase.from("exams").select("*");
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
};

exports.createExam = async (req, res) => {
  const { data, error } = await supabase.from("exams").insert([req.body]).select().single();
  if (error) return res.status(400).json({ message: error.message });
  res.status(201).json(data);
};

exports.getMarks = async (req, res) => {
  const { data, error } = await supabase.from("marks").select("*, students(name), exams(name)");
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
};

exports.enterMarks = async (req, res) => {
  const { data, error } = await supabase.from("marks").insert([req.body]).select().single();
  if (error) return res.status(400).json({ message: error.message });
  res.status(201).json(data);
};
