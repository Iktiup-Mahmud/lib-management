const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');

// Route to get all members
router.get('/', memberController.getAllMembers);

// Route to show add member form
router.get('/add', memberController.showAddForm);

// Route to show edit member form
router.get('/edit/:id', memberController.showEditForm);

// Route to get a specific member by ID
router.get('/:id', memberController.getMemberById);

// Route to add a new member
router.post('/', memberController.addMember);

// Route to update an existing member
router.post('/update/:id', memberController.updateMember);

// Route to delete a member
router.get('/delete/:id', memberController.deleteMember);

// Route for overdue members report
router.get('/reports/overdue', memberController.getOverdueMembers);

module.exports = router;