const express = require("express");
const router = express.Router();

const note = require("../models/note");

const userAuth = require("../middlewares/userAuth");

router.post("/create-note", userAuth, async (req, res) => {
  try {
    const newNote = new note(req.body);
    newNote.save();
    res.status(200).json({ success: true, msg: "Note saved successfully" });
  } catch (error) {
    res.status(400).json({ success: false, msg: "unable to create note" });
  }
});

router.get("/fetch-notes", userAuth, async (req, res) => {
  try {
    const user = req.body.belongsTo;
    const notes = await note.find({ belongsTo: user });

    res.status(200).json(notes);
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ success: false, msg: "unable to fetch notes" });
  }
});

router.put("/update-note/:id", userAuth, async (req, res) => {
  try {
    const updatedNote = {};
    const { title, description, tag } = req.body;
    if (title) updatedNote.title = title;
    if (description) updatedNote.description = description;
    if (tag) updatedNote.tag = tag;
    const noteExist = await note.findById(req.params.id);
    if (!noteExist) {
      return res
        .status(404)
        .json({ success: false, msg: "No note found for updation" });
    }
    if (req.body.belongsTo != noteExist.belongsTo) {
      return res.status(401).json({
        success: false,
        msg: "you are not authorized to update the note",
      });
    }
    await note.findByIdAndUpdate(noteExist._id, { $set: updatedNote });
    res.status(200).json({ success: true, msg: "Note updated successfully" });
  } catch (error) {
    if (error) console.log(error.message);
    res.status(400).json({ success: false, msg: "Unable to update note" });
  }
});

router.delete("/delete-note/:id", userAuth, async (req, res) => {
  try {
    const noteExist = await note.findById(req.params.id);
    if (!noteExist) {
      return res
        .status(404)
        .json({ success: false, msg: "No note found for deletion" });
    }
    if (req.body.belongsTo != noteExist.belongsTo) {
      return res.status(401).json({
        success: false,
        msg: "you are not authorized to delete the note",
      });
    }

    await note.findByIdAndDelete(noteExist._id);
    res
      .status(200)
      .json({ success: true, msg: "Successfully deleted the note" });
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ success: false, msg: "unable to delete note" });
  }
});

module.exports = router;
