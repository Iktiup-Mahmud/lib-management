const Member = require('../models/memberModel');

// Get all members with borrowing statistics
exports.getAllMembers = async (req, res) => {
    try {
        const members = await Member.getAll();
        res.render('members/list', { 
            members,
            title: 'Members List'
        });
    } catch (error) {
        console.error('Error retrieving members:', error);
        res.status(500).render('error', { 
            message: 'Error retrieving members', 
            error 
        });
    }
};

// Get member by ID
exports.getMemberById = async (req, res) => {
    try {
        const member = await Member.getById(req.params.id);
        if (!member) {
            return res.status(404).render('error', { 
                message: 'Member not found' 
            });
        }
        res.render('members/detail', { 
            member,
            title: `Member: ${member.name}`
        });
    } catch (error) {
        console.error('Error retrieving member:', error);
        res.status(500).render('error', { 
            message: 'Error retrieving member', 
            error 
        });
    }
};

// Show add member form
exports.showAddForm = (req, res) => {
    res.render('members/add', { 
        title: 'Add New Member' 
    });
};

// Add new member
exports.addMember = async (req, res) => {
    try {
        const memberId = await Member.create(req.body);
        res.redirect('/members?success=Member added successfully');
    } catch (error) {
        console.error('Error adding member:', error);
        res.render('members/add', { 
            error: 'Error adding member: ' + error.message,
            title: 'Add New Member',
            formData: req.body
        });
    }
};

// Show edit member form
exports.showEditForm = async (req, res) => {
    try {
        const member = await Member.getById(req.params.id);
        if (!member) {
            return res.status(404).render('error', { 
                message: 'Member not found' 
            });
        }
        res.render('members/edit', { 
            member,
            title: `Edit Member: ${member.name}`
        });
    } catch (error) {
        console.error('Error retrieving member for edit:', error);
        res.status(500).render('error', { 
            message: 'Error retrieving member', 
            error 
        });
    }
};

// Update member
exports.updateMember = async (req, res) => {
    try {
        const affectedRows = await Member.update(req.params.id, req.body);
        if (affectedRows === 0) {
            return res.status(404).render('error', { 
                message: 'Member not found' 
            });
        }
        res.redirect('/members?success=Member updated successfully');
    } catch (error) {
        console.error('Error updating member:', error);
        const member = await Member.getById(req.params.id).catch(() => null);
        res.render('members/edit', { 
            member: member || req.body,
            error: 'Error updating member: ' + error.message,
            title: 'Edit Member'
        });
    }
};

// Delete member
exports.deleteMember = async (req, res) => {
    try {
        const affectedRows = await Member.delete(req.params.id);
        if (affectedRows === 0) {
            return res.status(404).json({ message: 'Member not found' });
        }
        res.redirect('/members?success=Member deleted successfully');
    } catch (error) {
        console.error('Error deleting member:', error);
        res.redirect('/members?error=Error deleting member: ' + error.message);
    }
};

// Get overdue members report
exports.getOverdueMembers = async (req, res) => {
    try {
        const overdueMembers = await Member.getOverdueMembers();
        res.render('reports/overdue-members', {
            overdueMembers,
            title: 'Overdue Members Report',
            reportDate: new Date()
        });
    } catch (error) {
        console.error('Error retrieving overdue members:', error);
        res.status(500).render('error', { 
            message: 'Error retrieving overdue members', 
            error 
        });
    }
};